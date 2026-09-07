const express = require('express');
const { getDb, uuid } = require('../database');
const { requireAuth } = require('../middleware/auth');
const { audit } = require('../middleware/audit');

const router = express.Router();

// GET /api/customers
router.get('/', requireAuth, (req, res) => {
  try {
    const db = getDb();
    const { search } = req.query;
    
    let sql = "SELECT * FROM customers WHERE status = 'ACTIVE'";
    const params = [];
    
    if (search) {
      sql += ' AND (name LIKE ? OR phone LIKE ? OR email LIKE ? OR whatsapp LIKE ?)';
      const like = `%${search}%`;
      params.push(like, like, like, like);
    }
    
    sql += ' ORDER BY name ASC';
    const customers = db.prepare(sql).all(...params);
    res.json({ success: true, data: customers });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Erro ao listar clientes: ' + err.message });
  }
});

// GET /api/customers/:id
router.get('/:id', requireAuth, (req, res) => {
  try {
    const db = getDb();
    const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(req.params.id);
    if (!customer) {
      return res.status(404).json({ success: false, error: 'Cliente não encontrado' });
    }
    
    // Order history using order_items to get details
    const orders = db.prepare(`
      SELECT o.id, o.order_number, o.status, o.payment_status, o.total, o.created_at
      FROM orders o
      WHERE o.customer_id = ?
      ORDER BY o.created_at DESC
      LIMIT 50
    `).all(req.params.id);
    
    // Debt summary
    const debts = db.prepare(`
      SELECT id, original_amount, amount_paid, balance, status, due_date, created_at, order_number
      FROM debts
      WHERE customer_id = ? AND status != 'CANCELADO'
      ORDER BY created_at DESC
    `).all(req.params.id);
    
    const totalDebt = debts.filter(d => d.balance > 0)
      .reduce((sum, d) => sum + d.balance, 0);
    
    res.json({ success: true, data: { ...customer, orders, debts, total_debt: totalDebt } });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Erro ao obter cliente: ' + err.message });
  }
});

// POST /api/customers
router.post('/', requireAuth, (req, res) => {
  try {
    const db = getDb();
    const { name, phone, whatsapp, email, address, notes } = req.body;
    
    if (!name) {
      return res.status(400).json({ success: false, error: 'Nome do cliente é obrigatório' });
    }
    
    const id = uuid();
    const now = new Date().toISOString();
    
    db.prepare(`
      INSERT INTO customers (id, name, phone, whatsapp, email, address, notes,
        status, total_orders, total_spent, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'ACTIVE', 0, 0, ?, ?)
    `).run(
      id, name, phone || null, whatsapp || null, email || null,
      address || null, notes || null, now, now
    );
    
    audit(req.user, 'CREATE', 'CUSTOMER', id,
      `Cliente criado: ${name}`, null, { name, phone });
    
    const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(id);
    res.status(201).json({ success: true, data: customer });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Erro ao criar cliente: ' + err.message });
  }
});

// PUT /api/customers/:id
router.put('/:id', requireAuth, (req, res) => {
  try {
    const db = getDb();
    const existing = db.prepare('SELECT * FROM customers WHERE id = ?').get(req.params.id);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Cliente não encontrado' });
    }
    
    const { name, phone, whatsapp, email, address, notes } = req.body;
    if (name !== undefined && !name) {
      return res.status(400).json({ success: false, error: 'Nome não pode ser vazio' });
    }
    
    db.prepare(`
      UPDATE customers SET
        name = COALESCE(?, name),
        phone = COALESCE(?, phone),
        whatsapp = COALESCE(?, whatsapp),
        email = COALESCE(?, email),
        address = COALESCE(?, address),
        notes = COALESCE(?, notes),
        updated_at = ?
      WHERE id = ?
    `).run(
      name || null, phone || null, whatsapp || null, email || null,
      address !== undefined ? address : null, notes !== undefined ? notes : null,
      new Date().toISOString(), req.params.id
    );
    
    audit(req.user, 'UPDATE', 'CUSTOMER', req.params.id,
      `Cliente atualizado: ${name || existing.name}`,
      { name: existing.name }, { name: name || existing.name });
    
    const updated = db.prepare('SELECT * FROM customers WHERE id = ?').get(req.params.id);
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Erro ao atualizar cliente: ' + err.message });
  }
});

// GET /api/customers/:id/orders
router.get('/:id/orders', requireAuth, (req, res) => {
  try {
    const db = getDb();
    const customer = db.prepare('SELECT id FROM customers WHERE id = ?').get(req.params.id);
    if (!customer) {
      return res.status(404).json({ success: false, error: 'Cliente não encontrado' });
    }
    
    const orders = db.prepare(`
      SELECT o.*, 
        (SELECT COALESCE(SUM(amount), 0) FROM payments p WHERE p.order_id = o.id) as total_paid
      FROM orders o
      WHERE o.customer_id = ?
      ORDER BY o.created_at DESC
    `).all(req.params.id);
    
    res.json({ success: true, data: orders });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Erro ao listar encomendas do cliente: ' + err.message });
  }
});

// GET /api/customers/:id/debts
router.get('/:id/debts', requireAuth, (req, res) => {
  try {
    const db = getDb();
    const customer = db.prepare('SELECT id FROM customers WHERE id = ?').get(req.params.id);
    if (!customer) {
      return res.status(404).json({ success: false, error: 'Cliente não encontrado' });
    }
    
    const debts = db.prepare(`
      SELECT d.*, c.name as customer_name
      FROM debts d
      JOIN customers c ON d.customer_id = c.id
      WHERE d.customer_id = ? AND d.status != 'CANCELADO'
      ORDER BY d.created_at DESC
    `).all(req.params.id);
    
    const totalDebt = debts.reduce((sum, d) => sum + d.balance, 0);
    
    res.json({ success: true, data: { debts, total_debt: totalDebt } });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Erro ao listar dívidas do cliente: ' + err.message });
  }
});

module.exports = router;
