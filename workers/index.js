/**
 * BALI CATERING SYSTEM — Cloudflare Worker API
 * --------------------------------------------
 * API completa para o funcionamento público do Bali Catering.
 * Usa D1 (SQLite na Cloudflare) como banco de dados.
 * Rotas:
 *   GET  /api/health
 *   POST /api/auth/login
 *   GET  /api/auth/me
 *   GET  /api/settings
 *   GET  /api/categories
 *   GET  /api/products
 *   POST /api/orders
 *   POST /api/customers
 * Endpoints administrativos exigem role=ADMIN (validado com token)
 */

// Tiny bcrypt-compatible hash check (constant-time compare)
async function verifyPassword(password, hash) {
  try {
    // bcryptjs é pesado para Workers; usamos um hash compatível simples.
    // Para produção real: usar WebCrypto PBKDF2 ou o módulo bcryptjs via npm.
    // Aqui re-implementamos a verificação do hash bcrypt $2b$ usando bcryptjs
    // importado como módulo.
    const { compareSync } = await import('bcryptjs');
    return compareSync(password, hash);
  } catch (e) {
    console.error('bcrypt error', e);
    return false;
  }
}

async function hashPassword(password) {
  const { hashSync } = await import('bcryptjs');
  return hashSync(password, 10);
}

// Gerar token de sessão simples (base64 de timestamp + random)
function generateToken() {
  const arr = new Uint8Array(24);
  crypto.getRandomValues(arr);
  return Array.from(arr, (b) => b.toString(16).padStart(2, '0')).join('');
}

// In-memory sessions (per Worker instance). Para multi-instância usar KV.
const sessions = new Map();

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type, Authorization', 'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS' },
  });
}

function unauthorized(msg = 'Não autorizado') {
  return json({ success: false, error: msg }, 401);
}

async function getSessionUser(env, req) {
  const auth = req.headers.get('Authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return null;
  const session = sessions.get(token);
  if (!session) return null;
  // Opcional: buscar user atualizado do D1
  return session;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type, Authorization', 'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS' } });
    }

    // Health
    if (path === '/api/health' && request.method === 'GET') {
      return json({ success: true, status: 'ok', service: 'Bali Catering API (Cloudflare)', serverTime: new Date().toISOString(), database: 'd1' });
    }

    // ==================== AUTH ====================
    if (path === '/api/auth/login' && request.method === 'POST') {
      try {
        const body = await request.json();
        const { identifier, password } = body;
        if (!identifier || !password) return json({ success: false, error: 'Utilizador e palavra-passe são obrigatórios' }, 400);

        const user = await env.BALI_DB.prepare('SELECT * FROM users WHERE username = ?').bind(identifier).first();
        if (!user) return json({ success: false, error: 'Credenciais inválidas' }, 401);

        if (user.status !== 'ACTIVE') return json({ success: false, error: 'Conta desativada' }, 403);

        const valid = await verifyPassword(password, user.password_hash);
        if (!valid) return json({ success: false, error: 'Credenciais inválidas' }, 401);

        const token = generateToken();
        sessions.set(token, { userId: user.id, username: user.username, role: user.role, name: user.name });

        return json({
          success: true,
          data: {
            token,
            user: { id: user.id, name: user.name, username: user.username, role: user.role, status: user.status },
          },
        });
      } catch (e) {
        return json({ success: false, error: 'Erro no login: ' + e.message }, 500);
      }
    }

    if (path === '/api/auth/me' && request.method === 'GET') {
      const user = await getSessionUser(env, request);
      if (!user) return unauthorized();
      return json({ success: true, data: user });
    }

    // ==================== PUBLIC DATA ====================
    // Settings (público para o site)
    if (path === '/api/settings' && request.method === 'GET') {
      const rows = await env.BALI_DB.prepare('SELECT key, value FROM restaurant_settings').all();
      const settings = {};
      for (const r of rows.results) settings[r.key] = r.value;
      return json({ success: true, data: settings });
    }

    // Categories (público)
    if (path === '/api/categories' && request.method === 'GET') {
      const rows = await env.BALI_DB.prepare('SELECT * FROM categories ORDER BY display_order, name').all();
      return json({ success: true, data: rows.results });
    }

    // Products (público — só ativos)
    if (path === '/api/products' && request.method === 'GET') {
      const rows = await env.BALI_DB.prepare("SELECT * FROM products WHERE status = 'ACTIVE' ORDER BY is_featured DESC, name").all();
      return json({ success: true, data: rows.results });
    }

    // ==================== ORDERS (público — criar pedido) ====================
    if (path === '/api/orders' && request.method === 'POST') {
      try {
        const body = await request.json();
        const { customer, items, order_type, table_number, payment, notes } = body;

        if (!items || !Array.isArray(items) || items.length === 0) {
          return json({ success: false, error: 'Itens do pedido são obrigatórios' }, 400);
        }

        // Validar produtos e calcular total
        let subtotal = 0;
        let deliveryFee = 0;
        for (const item of items) {
          const product = await env.BALI_DB.prepare('SELECT * FROM products WHERE id = ? AND status = ?').bind(item.product_id, 'ACTIVE').first();
          if (!product) return json({ success: false, error: `Produto não encontrado: ${item.product_id}` }, 400);
          const price = Number(product.price);
          subtotal += price * Number(item.quantity || 1);
        }

        if (order_type === 'DELIVERY') {
          const fee = await env.BALI_DB.prepare("SELECT value FROM restaurant_settings WHERE key = 'default_delivery_fee'").first();
          deliveryFee = fee ? Number(fee.value) : 100;
        }

        const total = subtotal + deliveryFee;
        const id = crypto.randomUUID();
        const orderNumber = 'BC-' + new Date().toISOString().slice(0, 10).replace(/-/g, '') + '-' + String(Math.floor(Math.random() * 900) + 100);
        const now = new Date().toISOString();

        // Criar pedido
        await env.BALI_DB.prepare(
          `INSERT INTO orders (id, order_number, customer_name, customer_phone, customer_address, customer_id, order_type, table_number, status, subtotal, delivery_fee, discount, total, payment_status, payment_method, payment_reference, notes, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'PENDING', ?, ?, 0, ?, ?, ?, ?, ?, ?, ?)`
        ).bind(
          id, orderNumber, customer?.name || 'Cliente', customer?.phone || '',
          customer?.address || '', customer?.id || null, order_type || 'TAKEAWAY',
          table_number || null, subtotal, deliveryFee, total,
          payment?.status || 'PENDING', payment?.method || 'CASH', payment?.reference || null,
          notes || null, now, now
        ).run();

        // Criar itens
        for (const item of items) {
          const product = await env.BALI_DB.prepare('SELECT * FROM products WHERE id = ?').bind(item.product_id).first();
          await env.BALI_DB.prepare(
            `INSERT INTO order_items (id, order_id, product_id, product_name, price, quantity, unit_cost, notes)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
          ).bind(
            crypto.randomUUID(), id, item.product_id, product.name,
            Number(product.price), Number(item.quantity || 1), Number(product.cost_price || 0),
            item.notes || null
          ).run();
        }

        return json({ success: true, data: { id, orderNumber, total, paymentStatus: payment?.status || 'PENDING' } }, 201);
      } catch (e) {
        return json({ success: false, error: 'Erro ao criar pedido: ' + e.message }, 500);
      }
    }

    // ==================== CUSTOMERS ====================
    if (path === '/api/customers' && request.method === 'POST') {
      try {
        const body = await request.json();
        const id = crypto.randomUUID();
        const now = new Date().toISOString();
        await env.BALI_DB.prepare(
          `INSERT INTO customers (id, name, phone, whatsapp, email, address, notes, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
        ).bind(id, body.name, body.phone || null, body.phone || null, body.email || null, body.address || null, body.notes || null, now, now).run();
        return json({ success: true, data: { id, name: body.name } }, 201);
      } catch (e) {
        return json({ success: false, error: 'Erro ao criar cliente: ' + e.message }, 500);
      }
    }

    // 404
    return json({ success: false, error: 'Rota não encontrada: ' + path }, 404);
  },
};