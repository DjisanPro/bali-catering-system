const express = require('express');
const { getDb, uuid } = require('../database');
const { requireAuth } = require('../middleware/auth');
const { audit } = require('../middleware/audit');

const router = express.Router();

// Order status state machine
const STATUS_FLOW = ['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'DELIVERED'];
const PAYMENT_METHODS = ['CASH', 'MPESA', 'EMOLA', 'POS_CARD', 'BANK_TRANSFER', 'CREDIT'];

function generateOrderNumber(db) {
  // Format: BC-YYYYMMDD-XXX
  const now = new Date();
  const prefix = `BC-${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}`;
  const todayCount = db.prepare(
    "SELECT COUNT(*) as count FROM orders WHERE order_number LIKE ?"
  ).get(`${prefix}-%`).count;
  const seq = String(todayCount + 1).padStart(3, '0');
  return `${prefix}-${seq}`;
}

// Helper to get the recipe for a product
function getRecipeForProduct(db, productId) {
  const recipe = db.prepare('SELECT * FROM recipes WHERE product_id = ?').get(productId);
  if (!recipe) return [];
  return db.prepare('SELECT * FROM recipe_items WHERE recipe_id = ?').all(recipe.id);
}

// GET /api/orders/number/next
router.get('/number/next', requireAuth, (req, res) => {
  try {
    const db = getDb();
    const nextNumber = generateOrderNumber(db);
    res.json({ success: true, data: { orderNumber: nextNumber } });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Erro ao gerar número de encomenda: ' + err.message });
  }
});

// GET /api/orders
router.get('/', requireAuth, (req, res) => {
  try {
    const db = getDb();
    const { status, seller_id, customer_id, date_from, date_to, page = 1, limit = 20 } = req.query;
    
    const pageNum = parseInt(page) || 1;
    const limitNum = Math.min(parseInt(limit) || 20, 100);
    const offset = (pageNum - 1) * limitNum;
    
    let where = 'WHERE 1=1';
    const params = [];
    
    if (status) {
      where += ' AND o.status = ?';
      params.push(status);
    }
    if (seller_id) {
      where += ' AND o.seller_id = ?';
      params.push(seller_id);
    }
    if (customer_id) {
      where += ' AND o.customer_id = ?';
      params.push(customer_id);
    }
    if (date_from) {
      where += ' AND o.created_at >= ?';
      params.push(`${date_from}T00:00:00Z`);
    }
    if (date_to) {
      where += ' AND o.created_at <= ?';
      params.push(`${date_to}T23:59:59Z`);
    }
    
    const total = db.prepare(`SELECT COUNT(*) as count FROM orders o ${where}`).get(...params).count;
    const orders = db.prepare(`
      SELECT o.*, u.name as seller_name,
        (SELECT COALESCE(SUM(amount), 0) FROM payments p WHERE p.order_id = o.id AND p.amount > 0) as total_paid,
        (SELECT json_group_array(json_object(
          'id', oi.id,
          'product_id', oi.product_id,
          'product_name', oi.product_name,
          'price', oi.price,
          'quantity', oi.quantity,
          'unit_cost', oi.unit_cost,
          'notes', oi.notes
        )) FROM order_items oi WHERE oi.order_id = o.id) as items_json
      FROM orders o
      LEFT JOIN users u ON o.seller_id = u.id
      ${where}
      ORDER BY o.created_at DESC
      LIMIT ? OFFSET ?
    `).all(...params, limitNum, offset);

    // Convert items_json → items array (null-safe)
    const data = orders.map((o) => {
      let items = [];
      if (o.items_json) {
        try { items = JSON.parse(o.items_json); } catch { items = []; }
      }
      delete o.items_json;
      return { ...o, items };
    });

    res.json({
      success: true,
      data,
      pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Erro ao listar encomendas: ' + err.message });
  }
});

// POST /api/orders - create order (atomic)
router.post('/', requireAuth, (req, res) => {
  const db = getDb();
  const createOrderTx = db.transaction(() => {
    const { customer, items, discount, delivery_fee, payment, notes, order_type, table_number } = req.body;
    
    if (!items || !Array.isArray(items) || items.length === 0) {
      throw new Error('A encomenda deve ter pelo menos um produto');
    }
    
    // 1. Validate items and compute total
    let subtotal = 0;
    const orderItems = [];
    
    for (const item of items) {
      if (!item.product_id || !item.quantity || item.quantity <= 0) {
        throw new Error('Cada item deve ter product_id e quantidade válida');
      }
      
      const product = db.prepare(
        `SELECT * FROM products WHERE id = ? AND status = 'ACTIVE' AND is_available = 1`
      ).get(item.product_id);
      
      if (!product) {
        throw new Error(`Produto não encontrado ou indisponível`);
      }
      
      const quantity = parseFloat(item.quantity);
      const unitPrice = item.price !== undefined ? parseFloat(item.price) : product.price;
      const itemSubtotal = unitPrice * quantity;
      subtotal += itemSubtotal;
      
      orderItems.push({ product, quantity, unitPrice, itemSubtotal });
      
      // 2. Check stock via recipe and deduct
      const recipeItems = getRecipeForProduct(db, product.id);
      if (recipeItems.length > 0) {
        for (const ri of recipeItems) {
          const needed = ri.quantity * quantity;
          const ingredient = db.prepare('SELECT * FROM ingredients WHERE id = ?').get(ri.ingredient_id);
          
          if (!ingredient) {
            throw new Error(`Ingrediente não encontrado na receita de ${product.name}`);
          }
          
          if (ingredient.current_stock < needed) {
            throw new Error(
              `Stock insuficiente de "${ingredient.name}" para "${product.name}" ` +
              `(necessário: ${needed} ${ingredient.unit}, disponível: ${ingredient.current_stock} ${ingredient.unit})`
            );
          }
          
          const prevStock = ingredient.current_stock;
          db.prepare(
            `UPDATE ingredients SET current_stock = current_stock - ?, last_updated = ?
             WHERE id = ?`
          ).run(needed, new Date().toISOString(), ingredient.id);
          
          // Inventory movement
          db.prepare(`
            INSERT INTO inventory_movements (id, ingredient_id, ingredient_name, unit, type,
              quantity, previous_stock, new_stock, reason, reference_order_id, performed_by, created_at)
            VALUES (?, ?, ?, ?, 'EXIT_ORDER', ?, ?, ?, ?, ?, ?, ?)
          `).run(uuid(), ingredient.id, ingredient.name, ingredient.unit,
            needed, prevStock, prevStock - needed,
            `Venda: ${product.name} (qty ${quantity})`, null, req.user.userId,
            new Date().toISOString());
        }
      }
    }
    
    // 3. Finalize totals
    const finalDiscount = discount !== undefined ? parseFloat(discount) : 0;
    const finalDeliveryFee = delivery_fee !== undefined ? parseFloat(delivery_fee) : 0;
    const total = subtotal - finalDiscount + finalDeliveryFee;
    
    if (total < 0) {
      throw new Error('Total da encomenda não pode ser negativo');
    }
    
    // 4. Resolve customer
    let customerId = null;
    let customerName = customer && customer.name ? customer.name : null;
    let customerPhone = customer && customer.phone ? customer.phone : null;
    let customerAddress = customer && customer.address ? customer.address : null;
    const now = new Date().toISOString();
    
    if (customer) {
      if (customer.id) {
        const existing = db.prepare('SELECT * FROM customers WHERE id = ?').get(customer.id);
        if (existing) {
          customerId = existing.id;
          customerName = existing.name;
          customerPhone = existing.phone;
          customerAddress = existing.address;
        }
      } else if (customer.name) {
        // Search existing by name+phone
        const existing = db.prepare(
          `SELECT * FROM customers WHERE name = ? COLLATE NOCASE AND (? IS NULL OR phone = ?) AND status = 'ACTIVE'`
        ).get(customer.name, customer.phone || null, customer.phone || null);
        
        if (existing) {
          customerId = existing.id;
          customerName = existing.name;
          customerPhone = existing.phone;
          customerAddress = existing.address;
        } else {
          // Create new customer
          const cid = uuid();
          db.prepare(`
            INSERT INTO customers (id, name, phone, whatsapp, email, address, notes,
              status, total_orders, total_spent, first_order_date, last_order_date, created_at, updated_at)
            VALUES (?, ?, ?, ?, NULL, ?, NULL, 'ACTIVE', 0, 0, ?, ?, ?, ?)
          `).run(cid, customer.name, customer.phone || null, customer.whatsapp || null,
            customer.address || null, now, now, now, now);
          customerId = cid;
          customerName = customer.name;
          customerPhone = customer.phone || null;
          customerAddress = customer.address || null;
        }
      }
    }
    
    // 5. Create order
    const orderId = uuid();
    const orderNumber = generateOrderNumber(db);
    const paymentMethod = payment && payment.method ? payment.method : (payment && payment.amount !== undefined && payment.amount >= total ? 'CASH' : 'PENDING');
    
    // Determine payment status
    const paymentStatus = !payment || payment.amount === undefined || payment.amount <= 0 ? 'PENDING'
      : (payment.amount >= total - 0.01 ? 'PAID' : 'PARTIALLY_PAID');
    
    db.prepare(`
      INSERT INTO orders (id, order_number, customer_name, customer_phone, customer_address,
        customer_id, order_type, table_number, status, subtotal, delivery_fee, discount,
        total, payment_status, payment_method, payment_reference, notes, stock_deducted,
        seller_id, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?)
    `).run(
      orderId, orderNumber, customerName || 'Cliente Ocasional', customerPhone,
      customerAddress, customerId, order_type || 'TAKEAWAY', table_number || null,
      'PENDING', subtotal, finalDeliveryFee, finalDiscount, total,
      paymentStatus, paymentMethod,
      payment && payment.reference ? payment.reference : null,
      notes || null, req.user.userId, now, now
    );
    
    // 6. Create order_items
    for (const oi of orderItems) {
      db.prepare(`
        INSERT INTO order_items (id, order_id, product_id, product_name, price, quantity, unit_cost, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        uuid(), orderId, oi.product.id, oi.product.name, oi.unitPrice,
        oi.quantity, oi.product.cost_price || null, null
      );
    }
    
    // 7. Create payment / debt
    const method = (payment && payment.method) || 'CASH';
    if (!PAYMENT_METHODS.includes(method)) {
      throw new Error('Método de pagamento inválido');
    }

    if (method === 'CREDIT') {
      // Credit sale (fiado): always creates a debt, capturing any down-payment.
      const downPayment = payment && payment.amount !== undefined && payment.amount > 0
        ? Math.min(parseFloat(payment.amount), total) : 0;
      const debtId = uuid();
      db.prepare(`
        INSERT INTO debts (id, customer_id, customer_name, order_id, order_number,
          original_amount, amount_paid, balance, due_date, status, notes, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        debtId, customerId, customerName, orderId, orderNumber,
        total, downPayment, total - downPayment,
        payment && payment.due_date ? payment.due_date : null,
        downPayment > 0 ? 'PARCIAL' : 'PENDENTE',
        `Crédito para ${orderNumber}`, now, now
      );

      // Record down-payment as a debt_payment if any
      if (downPayment > 0) {
        db.prepare(`
          INSERT INTO debt_payments (id, debt_id, amount, method, reference, notes, created_at, received_by)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run(uuid(), debtId, downPayment, payment.method, payment.reference || null,
          'Pagamento inicial na venda a crédito', now, req.user.userId);
        // Also record in payments table for cash-flow visibility
        db.prepare(`
          INSERT INTO payments (id, order_id, order_number, customer_name, customer_id,
            amount, method, reference, receipt_number, status, notes, created_at, received_by)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'COMPLETED', NULL, ?, ?)
        `).run(uuid(), orderId, orderNumber, customerName, customerId,
          downPayment, payment.method, payment.reference || null,
          `RC-${orderNumber}`, now, req.user.userId);

        // Record SALE cash movement for a CASH down-payment when an open shift exists
        if (payment.method === 'CASH') {
          const openShift = db.prepare("SELECT * FROM cash_shifts WHERE status = 'OPEN' ORDER BY opened_at DESC LIMIT 1").get();
          if (openShift) {
            db.prepare(`
              INSERT INTO cash_movements (id, shift_id, type, amount, description, reference_id, reference_type, created_at, performed_by)
              VALUES (?, ?, 'SALE', ?, ?, ?, 'ORDER', ?, ?)
            `).run(uuid(), openShift.id, downPayment, `Pagamento inicial (crédito) ${orderNumber}`, orderId, now, req.user.userId);
          }
        }
      }

      db.prepare(`UPDATE orders SET payment_status = 'PENDING', payment_method = 'CREDIT' WHERE id = ?`)
        .run(orderId);

      // Customer CRM update
      if (customerId) {
        db.prepare(`
          UPDATE customers SET total_orders = total_orders + 1,
            total_spent = total_spent + ?, last_order_date = ? WHERE id = ?
        `).run(total, now, customerId);
      }
    } else if (payment && payment.amount !== undefined && payment.amount > 0) {
      // Normal (non-credit) payment
      const amount = Math.min(parseFloat(payment.amount), total);
      const paymentId = uuid();
      db.prepare(`
        INSERT INTO payments (id, order_id, order_number, customer_name, customer_id,
          amount, method, reference, receipt_number, status, notes, created_at, received_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'COMPLETED', NULL, ?, ?)
      `).run(
        paymentId, orderId, orderNumber, customerName, customerId,
        amount, method, payment.reference || null,
        `RC-${orderNumber}`, now, req.user.userId
      );

      // Update customer total spending
      if (customerId) {
        db.prepare(`
          UPDATE customers SET total_orders = total_orders + 1,
            total_spent = total_spent + ?, last_order_date = ? WHERE id = ?
        `).run(total, now, customerId);
      }

      // Record SALE cash movement when there is an open cash shift
      if (method === 'CASH') {
        const openShift = db.prepare("SELECT * FROM cash_shifts WHERE status = 'OPEN' ORDER BY opened_at DESC LIMIT 1").get();
        if (openShift) {
          db.prepare(`
            INSERT INTO cash_movements (id, shift_id, type, amount, description, reference_id, reference_type, created_at, performed_by)
            VALUES (?, ?, 'SALE', ?, ?, ?, 'ORDER', ?, ?)
          `).run(uuid(), openShift.id, amount, `Venda ${orderNumber}`, orderId, now, req.user.userId);
        }
      }
    } else if (customerId) {
      // Customer exists but no payment - still count order
      db.prepare(`
        UPDATE customers SET total_orders = total_orders + 1,
          total_spent = total_spent + ?, last_order_date = ? WHERE id = ?
      `).run(total, now, customerId);
    }
    
    audit(req.user, 'CREATE', 'ORDER', orderId,
      `Encomenda ${orderNumber} criada - ${total} MT (${paymentStatus})`,
      null, { orderNumber, total, paymentStatus, items: orderItems.length });
    
    return { id: orderId, orderNumber, total, paymentStatus };
  });
  
  try {
    const result = createOrderTx();
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    const msg = err.message || '';
    if (msg.includes('Stock') || msg.includes('Produto') || msg.includes('encomenda') ||
        msg.includes('item') || msg.includes('negativo') || msg.includes('Método')) {
      return res.status(400).json({ success: false, error: msg });
    }
    res.status(500).json({ success: false, error: 'Erro ao criar encomenda: ' + err.message });
  }
});

// GET /api/orders/:id
router.get('/:id', requireAuth, (req, res) => {
  try {
    const db = getDb();
    const order = db.prepare(`
      SELECT o.*, u.name as seller_name
      FROM orders o
      LEFT JOIN users u ON o.seller_id = u.id
      WHERE o.id = ?
    `).get(req.params.id);
    
    if (!order) {
      return res.status(404).json({ success: false, error: 'Encomenda não encontrada' });
    }
    
    // Get order items
    const items = db.prepare(`
      SELECT * FROM order_items WHERE order_id = ? ORDER BY product_name
    `).all(req.params.id);
    
    // Get payments
    const payments = db.prepare(`
      SELECT p.*, u.name as received_by_name
      FROM payments p
      LEFT JOIN users u ON p.received_by = u.id
      WHERE p.order_id = ?
      ORDER BY p.created_at DESC
    `).all(req.params.id);
    
    // Get debts for this order
    const debts = db.prepare('SELECT * FROM debts WHERE order_id = ?').all(req.params.id);
    
    res.json({ success: true, data: { ...order, items, payments, debts } });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Erro ao obter encomenda: ' + err.message });
  }
});

// PATCH /api/orders/:id/status
router.patch('/:id/status', requireAuth, (req, res) => {
  try {
    const db = getDb();
    const { status } = req.body;
    
    if (!status) {
      return res.status(400).json({ success: false, error: 'Status é obrigatório' });
    }
    
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, error: 'Encomenda não encontrada' });
    }
    
    if (order.status === 'CANCELLED') {
      return res.status(400).json({ success: false, error: 'Encomenda cancelada não pode mudar de status' });
    }
    if (order.status === 'DELIVERED') {
      return res.status(400).json({ success: false, error: 'Encomenda entregue não pode mudar de status' });
    }
    
    const validStatuses = [...STATUS_FLOW, 'CANCELLED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, error: 'Status inválido' });
    }
    
    const oldStatus = order.status;
    const now = new Date().toISOString();
    
    db.prepare(`UPDATE orders SET status = ?, updated_at = ? WHERE id = ?`)
      .run(status, now, req.params.id);
    
    audit(req.user, 'STATUS_CHANGE', 'ORDER', req.params.id,
      `Status de ${order.order_number} mudou: ${oldStatus} -> ${status}`,
      { status: oldStatus }, { status });
    
    res.json({ success: true, data: { id: order.id, status, oldStatus } });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Erro ao mudar status: ' + err.message });
  }
});

// PATCH /api/orders/:id/cancel
router.patch('/:id/cancel', requireAuth, (req, res) => {
  const db = getDb();
  const cancelTx = db.transaction(() => {
    const { reason } = req.body;
    if (!reason) {
      throw new Error('Motivo do cancelamento é obrigatório');
    }
    
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
    if (!order) {
      throw new Error('Encomenda não encontrada');
    }
    
    if (order.status === 'CANCELLED') {
      throw new Error('Encomenda já foi cancelada');
    }
    
    const now = new Date().toISOString();
    const oldStatus = order.status;
    
    // Reverse stock if it was deducted
    if (order.stock_deducted) {
      const orderItems = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id);
      
      for (const item of orderItems) {
        const recipeItems = getRecipeForProduct(db, item.product_id);
        for (const ri of recipeItems) {
          const amountToRestore = ri.quantity * item.quantity;
          const ingredient = db.prepare('SELECT * FROM ingredients WHERE id = ?').get(ri.ingredient_id);
          
          if (ingredient) {
            db.prepare('UPDATE ingredients SET current_stock = current_stock + ?, last_updated = ? WHERE id = ?')
              .run(amountToRestore, now, ri.ingredient_id);
            
            db.prepare(`
              INSERT INTO inventory_movements (id, ingredient_id, ingredient_name, unit, type,
                quantity, previous_stock, new_stock, reason, reference_order_id, performed_by, created_at)
              VALUES (?, ?, ?, ?, 'ENTRY', ?, ?, ?, ?, ?, ?, ?)
            `).run(uuid(), ingredient.id, ingredient.name, ingredient.unit,
              amountToRestore, ingredient.current_stock, ingredient.current_stock + amountToRestore,
              `Cancelamento ${order.order_number}: ${reason}`, order.id, req.user.userId, now);
          }
        }
      }
    }
    
    // Update order
    db.prepare(`
      UPDATE orders SET status = 'CANCELLED', cancellation_reason = ?, cancelled_by = ?,
        cancelled_at = ?, updated_at = ?, stock_deducted = 0
      WHERE id = ?
    `).run(reason, req.user.userId, now, now, order.id);
    
    // Cancel pending debts for this order
    db.prepare(`
      UPDATE debts SET status = 'CANCELADO', updated_at = ? WHERE order_id = ? AND status = 'PENDENTE'
    `).run(now, order.id);
    
    // Adjust customer stats
    if (order.customer_id) {
      db.prepare(`
        UPDATE customers SET total_orders = MAX(0, total_orders - 1),
          total_spent = MAX(0, total_spent - ?)
        WHERE id = ?
      `).run(order.total, order.customer_id);
    }
    
    audit(req.user, 'CANCEL', 'ORDER', req.params.id,
      `Encomenda ${order.order_number} cancelada. Motivo: ${reason}`,
      { status: oldStatus }, { status: 'CANCELLED', reason });
    
    return { id: order.id, orderNumber: order.order_number, status: 'CANCELLED' };
  });
  
  try {
    const result = cancelTx();
    res.json({ success: true, data: result });
  } catch (err) {
    const msg = err.message || '';
    if (msg.includes('obrigatório') || msg.includes('não encontrada') || msg.includes('cancelada')) {
      return res.status(400).json({ success: false, error: msg });
    }
    res.status(500).json({ success: false, error: 'Erro ao cancelar encomenda: ' + err.message });
  }
});

// PATCH /api/orders/:id/correct
router.patch('/:id/correct', requireAuth, (req, res) => {
  const db = getDb();
  const correctTx = db.transaction(() => {
    const { old_state, new_state, reason } = req.body;
    
    if (!reason) {
      throw new Error('Motivo da correção é obrigatório');
    }
    
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
    if (!order) {
      throw new Error('Encomenda não encontrada');
    }
    
    if (order.status !== 'DELIVERED' && order.status !== 'READY') {
      throw new Error('Só é possível corrigir encomendas concluídas (entregues ou prontas)');
    }
    
    const now = new Date().toISOString();
    const oldOrderState = JSON.stringify(order);
    
    // If items changed, reverse old stock and deduct new
    if (old_state && new_state && 
        JSON.stringify(old_state.items || []) !== JSON.stringify(new_state.items || [])) {
      
      // Reverse old stock
      for (const item of old_state.items || []) {
        const recipeItems = getRecipeForProduct(db, item.product_id);
        for (const ri of recipeItems) {
          db.prepare('UPDATE ingredients SET current_stock = current_stock + ? WHERE id = ?')
            .run(ri.quantity * item.quantity, ri.ingredient_id);
        }
      }
      
      // Deduct new stock
      for (const item of new_state.items || []) {
        const product = db.prepare('SELECT * FROM products WHERE id = ?').get(item.product_id);
        if (!product) {
          throw new Error('Produto não encontrado na correção');
        }
        const recipeItems = getRecipeForProduct(db, item.product_id);
        for (const ri of recipeItems) {
          const needed = ri.quantity * item.quantity;
          const ingredient = db.prepare('SELECT * FROM ingredients WHERE id = ?').get(ri.ingredient_id);
          if (ingredient.current_stock < needed) {
            throw new Error(`Stock insuficiente de ${ingredient.name} para correção`);
          }
          db.prepare('UPDATE ingredients SET current_stock = current_stock - ? WHERE id = ?')
            .run(needed, ri.ingredient_id);
        }
      }
    }
    
    // Update order with new state
    const newTotal = new_state && new_state.total !== undefined ? new_state.total : order.total;
    
    db.prepare(`
      UPDATE orders SET total = ?, updated_at = ? WHERE id = ?
    `).run(newTotal, now, req.params.id);
    
    // If items provided, update order_items
    if (new_state && new_state.items) {
      // Delete old items
      db.prepare('DELETE FROM order_items WHERE order_id = ?').run(order.id);
      
      // Insert new items
      for (const item of new_state.items) {
        const product = db.prepare('SELECT * FROM products WHERE id = ?').get(item.product_id);
        db.prepare(`
          INSERT INTO order_items (id, order_id, product_id, product_name, price, quantity, unit_cost, notes)
          VALUES (?, ?, ?, ?, ?, ?, ?, NULL)
        `).run(uuid(), order.id, item.product_id, product ? product.name : 'Produto',
          item.price || 0, item.quantity || 1, product ? product.cost_price : null);
      }
    }
    
    audit(req.user, 'CORRECT', 'ORDER', req.params.id,
      `Encomenda ${order.order_number} corrigida. Motivo: ${reason}`,
      oldOrderState,
      JSON.stringify({ status: order.status, total: newTotal, reason }));
    
    return { id: order.id, corrected: true, reason };
  });
  
  try {
    const result = correctTx();
    res.json({ success: true, data: result });
  } catch (err) {
    const msg = err.message || '';
    if (msg.includes('obrigatório') || msg.includes('não encontrada') || msg.includes('corrigir') || msg.includes('Stock')) {
      return res.status(400).json({ success: false, error: msg });
    }
    res.status(500).json({ success: false, error: 'Erro ao corrigir encomenda: ' + err.message });
  }
});

module.exports = router;
