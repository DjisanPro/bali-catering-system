const express = require('express');
const { getDb, uuid } = require('../database');
const { requireAuth } = require('../middleware/auth');
const { audit } = require('../middleware/audit');

const router = express.Router();

const PAYMENT_METHODS = ['CASH', 'MPESA', 'EMOLA', 'POS_CARD', 'BANK_TRANSFER', 'CREDIT'];

// GET /api/payments
router.get('/', requireAuth, (req, res) => {
  try {
    const db = getDb();
    const { order_id, date_from, date_to, customer_id } = req.query;
    
    let sql = `
      SELECT p.*, c.name as customer_name, u.name as received_by_name
      FROM payments p
      LEFT JOIN customers c ON p.customer_id = c.id
      LEFT JOIN users u ON p.received_by = u.id
      WHERE 1=1
    `;
    const params = [];
    
    if (order_id) {
      sql += ' AND p.order_id = ?';
      params.push(order_id);
    }
    if (customer_id) {
      sql += ' AND p.customer_id = ?';
      params.push(customer_id);
    }
    if (date_from) {
      sql += ' AND p.created_at >= ?';
      params.push(`${date_from}T00:00:00Z`);
    }
    if (date_to) {
      sql += ' AND p.created_at <= ?';
      params.push(`${date_to}T23:59:59Z`);
    }
    
    sql += ' ORDER BY p.created_at DESC';
    const payments = db.prepare(sql).all(...params);
    res.json({ success: true, data: payments });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Erro ao listar pagamentos: ' + err.message });
  }
});

// POST /api/payments
router.post('/', requireAuth, (req, res) => {
  const db = getDb();
  const createPaymentTx = db.transaction(() => {
    const { order_id, customer_id, amount, method, reference, notes } = req.body;
    
    if (!amount || isNaN(amount) || amount <= 0) {
      throw new Error('Montante do pagamento deve ser positivo');
    }
    if (!method || !PAYMENT_METHODS.includes(method)) {
      throw new Error('Método de pagamento inválido');
    }
    if (!order_id && !customer_id) {
      throw new Error('Deve indicar uma encomenda ou um cliente');
    }
    
    const now = new Date().toISOString();
    let order = null;
    let orderNumber = null;
    
    if (order_id) {
      order = db.prepare('SELECT * FROM orders WHERE id = ?').get(order_id);
      if (!order) {
        throw new Error('Encomenda não encontrada');
      }
      orderNumber = order.order_number;
    }
    
    const finalCustomerId = customer_id || (order ? order.customer_id : null) || null;
    let customerName = null;
    if (finalCustomerId) {
      const customer = db.prepare('SELECT name FROM customers WHERE id = ?').get(finalCustomerId);
      customerName = customer ? customer.name : null;
    }
    
    if (method === 'CREDIT') {
      throw new Error('Use o endpoint /api/payments/credit para vendas a crédito');
    }
    
    // Check remaining balance on the order
    if (order_id) {
      const paid = db.prepare(
        'SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE order_id = ? AND amount > 0'
      ).get(order_id).total;
      const remaining = order.total - paid;
      
      if (amount > remaining + 0.01) {
        throw new Error(`Montante (${amount} MT) excede o saldo em falta do pedido (${remaining.toFixed(2)} MT)`);
      }
      
      // Update order payment status
      const newPaid = paid + parseFloat(amount);
      const newPaymentStatus = newPaid >= order.total - 0.01 ? 'PAID'
        : (newPaid > 0 ? 'PARTIALLY_PAID' : 'PENDING');
      
      db.prepare("UPDATE orders SET payment_status = ?, payment_method = ?, updated_at = ? WHERE id = ?")
        .run(newPaymentStatus, method, now, order_id);
    }
    
    const paymentId = uuid();
    db.prepare(`
      INSERT INTO payments (id, order_id, order_number, customer_name, customer_id,
        amount, method, reference, receipt_number, status, notes, created_at, received_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'COMPLETED', ?, ?, ?)
    `).run(
      paymentId,
      order_id || null,
      orderNumber,
      customerName,
      finalCustomerId,
      parseFloat(amount),
      method,
      reference || null,
      `RC-${orderNumber || uuid().substring(0, 8)}`,
      notes || null,
      now,
      req.user.userId
    );
    
    // Create cash movement if CASH
    if (method === 'CASH') {
      const openShift = db.prepare(
        `SELECT * FROM cash_shifts WHERE status = 'OPEN' ORDER BY opened_at DESC LIMIT 1`
      ).get();
      
      if (openShift) {
        db.prepare(`
          INSERT INTO cash_movements (id, shift_id, type, amount, description, reference_id, reference_type, created_at, performed_by)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(uuid(), openShift.id, 'SALE', parseFloat(amount),
          `Pagamento em dinheiro ${orderNumber ? 'para ' + orderNumber : ''}`,
          paymentId, 'PAYMENT', now, req.user.userId);
      }
    }
    
    audit(req.user, 'CREATE', 'PAYMENT', paymentId,
      `Pagamento de ${amount} MT (${method}) ${orderNumber ? 'para ' + orderNumber : ''}`,
      null, { amount, method, orderNumber });
    
    return { id: paymentId, amount: parseFloat(amount), method };
  });
  
  try {
    const result = createPaymentTx();
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    const msg = err.message || '';
    if (msg.includes('obrigatório') || msg.includes('inválido') || msg.includes('excede') || msg.includes('encontrada') || msg.includes('endpoint')) {
      return res.status(400).json({ success: false, error: msg });
    }
    res.status(500).json({ success: false, error: 'Erro ao criar pagamento: ' + err.message });
  }
});

// POST /api/payments/credit
router.post('/credit', requireAuth, (req, res) => {
  const db = getDb();
  const createCreditTx = db.transaction(() => {
    const { order_id, customer_id, customer_name, due_date, notes } = req.body;
    
    if (!customer_id && !customer_name) {
      throw new Error('Cliente é obrigatório para venda a crédito');
    }
    
    let finalCustomerId = customer_id;
    let finalCustomerName = customer_name;
    const now = new Date().toISOString();
    
    if (!finalCustomerId && customer_name) {
      // Find or create customer
      const existing = db.prepare("SELECT * FROM customers WHERE name = ? COLLATE NOCASE AND status = 'ACTIVE'").get(customer_name);
      if (existing) {
        finalCustomerId = existing.id;
        finalCustomerName = existing.name;
      } else {
        const cid = uuid();
        db.prepare(`
          INSERT INTO customers (id, name, phone, status, total_orders, total_spent, created_at, updated_at)
          VALUES (?, ?, NULL, 'ACTIVE', 0, 0, ?, ?)
        `).run(cid, customer_name, now, now);
        finalCustomerId = cid;
        finalCustomerName = customer_name;
      }
    } else if (finalCustomerId) {
      const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(finalCustomerId);
      if (!customer) {
        throw new Error('Cliente não encontrado');
      }
      finalCustomerName = customer.name;
    }
    
    let order = null;
    let amount = 0;
    let orderNumber = null;
    
    if (order_id) {
      order = db.prepare('SELECT * FROM orders WHERE id = ?').get(order_id);
      if (!order) {
        throw new Error('Encomenda não encontrada');
      }
      amount = order.total;
      orderNumber = order.order_number;
      
      // Check if there's already a debt for this order
      const existingDebt = db.prepare('SELECT id FROM debts WHERE order_id = ?').get(order_id);
      if (existingDebt) {
        throw new Error('Já existe um crédito para esta encomenda');
      }
    } else {
      if (!req.body.amount || isNaN(req.body.amount) || req.body.amount <= 0) {
        throw new Error('Montante do crédito é obrigatório');
      }
      amount = parseFloat(req.body.amount);
    }
    
    const debtId = uuid();
    db.prepare(`
      INSERT INTO debts (id, customer_id, customer_name, order_id, order_number,
        original_amount, amount_paid, balance, due_date, status, notes, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDENTE', ?, ?, ?)
    `).run(
      debtId, finalCustomerId, finalCustomerName, order_id || null, orderNumber,
      amount, 0, amount, due_date || null,
      notes || (order ? `Crédito para ${orderNumber}` : 'Venda a crédito'),
      now, now
    );
    
    // Update order payment status
    if (order) {
      db.prepare("UPDATE orders SET payment_status = 'PENDING', payment_method = 'CREDIT', updated_at = ? WHERE id = ?")
        .run(now, order.id);
    }
    
    audit(req.user, 'CREATE', 'DEBT', debtId,
      `Crédito de ${amount} MT criado para ${finalCustomerName}`,
      null, { amount, customer: finalCustomerName });
    
    return { id: debtId, amount, customer: finalCustomerName };
  });
  
  try {
    const result = createCreditTx();
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    const msg = err.message || '';
    if (msg.includes('obrigatório') || msg.includes('encontrada') || msg.includes('crédito') || msg.includes('montante')) {
      return res.status(400).json({ success: false, error: msg });
    }
    res.status(500).json({ success: false, error: 'Erro ao criar crédito: ' + err.message });
  }
});

module.exports = router;
