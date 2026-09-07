const express = require('express');
const { getDb, uuid } = require('../database');
const { requireAuth } = require('../middleware/auth');
const { audit } = require('../middleware/audit');

const router = express.Router();

const DEBT_STATUSES = ['PENDENTE', 'PARCIAL', 'PAGO', 'ATRASADO', 'CANCELADO'];

// GET /api/debts
router.get('/', requireAuth, (req, res) => {
  try {
    const db = getDb();
    const { status, customer_id } = req.query;
    
    let sql = `
      SELECT d.*, c.name as customer_name, c.phone as customer_phone
      FROM debts d
      JOIN customers c ON d.customer_id = c.id
      WHERE 1=1
    `;
    const params = [];
    
    if (status) {
      sql += ' AND d.status = ?';
      params.push(status);
    }
    if (customer_id) {
      sql += ' AND d.customer_id = ?';
      params.push(customer_id);
    }
    
    sql += ' ORDER BY d.created_at DESC';
    const debts = db.prepare(sql).all(...params);
    
    // Compute summary
    const totalDebt = debts.reduce((s, d) => s + (d.balance || 0), 0);
    const paidTotal = debts.reduce((s, d) => s + (d.amount_paid || 0), 0);
    
    res.json({ success: true, data: { debts, summary: { total_debt: totalDebt, total_paid: paidTotal, count: debts.length } } });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Erro ao listar dívidas: ' + err.message });
  }
});

// GET /api/debts/summary
router.get('/summary', requireAuth, (req, res) => {
  try {
    const db = getDb();
    const allDebts = db.prepare("SELECT * FROM debts WHERE status != 'CANCELADO'").all();
    
    const totalDebt = allDebts.reduce((s, d) => s + (d.balance || 0), 0);
    
    // Overdue (past due_date and not paid)
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const overdue = allDebts.filter(d => d.status !== 'PAGO' && d.due_date && d.due_date < today);
    const totalOverdue = overdue.reduce((s, d) => s + (d.balance || 0), 0);
    
    // Aging buckets
    const aging = {
      '0_30': 0,
      '31_60': 0,
      '61_90': 0,
      '90_plus': 0
    };
    
    overdue.forEach(d => {
      const due = new Date(d.due_date);
      const diffDays = Math.floor((Date.now() - due.getTime()) / (1000 * 60 * 60 * 24));
      const balance = d.balance || 0;
      if (diffDays <= 30) aging['0_30'] += balance;
      else if (diffDays <= 60) aging['31_60'] += balance;
      else if (diffDays <= 90) aging['61_90'] += balance;
      else aging['90_plus'] += balance;
    });
    
    // By status breakdown
    const byStatus = {};
    DEBT_STATUSES.forEach(s => {
      const items = allDebts.filter(d => d.status === s);
      byStatus[s] = items.reduce((sum, d) => sum + (d.balance || 0), 0);
    });
    
    res.json({
      success: true,
      data: {
        total_debt: totalDebt,
        overdue_total: totalOverdue,
        overdue_count: overdue.length,
        aging,
        by_status: byStatus,
        debt_count: allDebts.length
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Erro ao obter resumo de dívidas: ' + err.message });
  }
});

// GET /api/debts/:id
router.get('/:id', requireAuth, (req, res) => {
  try {
    const db = getDb();
    const debt = db.prepare(`
      SELECT d.*, c.name as customer_name, c.phone as customer_phone
      FROM debts d
      JOIN customers c ON d.customer_id = c.id
      WHERE d.id = ?
    `).get(req.params.id);
    
    if (!debt) {
      return res.status(404).json({ success: false, error: 'Dívida não encontrada' });
    }
    
    const payments = db.prepare(`
      SELECT dp.*, u.name as received_by_name
      FROM debt_payments dp
      LEFT JOIN users u ON dp.received_by = u.id
      WHERE dp.debt_id = ?
      ORDER BY dp.created_at DESC
    `).all(req.params.id);
    
    res.json({ success: true, data: { ...debt, payment_history: payments } });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Erro ao obter dívida: ' + err.message });
  }
});

// POST /api/debts/:id/pay
router.post('/:id/pay', requireAuth, (req, res) => {
  const db = getDb();
  const payDebtTx = db.transaction(() => {
    const { amount, method, reference, notes } = req.body;
    
    if (!amount || isNaN(amount) || amount <= 0) {
      throw new Error('Montante do pagamento deve ser positivo');
    }
    if (!method) {
      throw new Error('Método de pagamento é obrigatório');
    }
    
    const debt = db.prepare('SELECT * FROM debts WHERE id = ?').get(req.params.id);
    if (!debt) {
      throw new Error('Dívida não encontrada');
    }
    
    if (debt.status === 'CANCELADO') {
      throw new Error('Dívida cancelada não pode receber pagamentos');
    }
    if (debt.status === 'PAGO') {
      throw new Error('Dívida já está paga');
    }
    
    const paymentAmount = parseFloat(amount);
    if (paymentAmount > debt.balance + 0.01) {
      throw new Error(`Montante (${paymentAmount} MT) excede o saldo em falta (${debt.balance.toFixed(2)} MT)`);
    }
    
    const now = new Date().toISOString();
    
    // Create debt payment
    const dpId = uuid();
    db.prepare(`
      INSERT INTO debt_payments (id, debt_id, amount, method, reference, notes, created_at, received_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(dpId, debt.id, paymentAmount, method, reference || null, notes || null, now, req.user.userId);
    
    // Update debt balance
    const newPaid = (debt.amount_paid || 0) + paymentAmount;
    const newBalance = debt.original_amount - newPaid;
    
    let newStatus;
    if (newBalance <= 0.01) {
      newStatus = 'PAGO';
    } else {
      newStatus = 'PARCIAL';
    }
    
    db.prepare(`
      UPDATE debts SET amount_paid = ?, balance = ?, status = ?, updated_at = ? WHERE id = ?
    `).run(newPaid, newBalance, newStatus, now, debt.id);
    
    // Create payment record if linked to order
    if (debt.order_id) {
      const paymentId = uuid();
      db.prepare(`
        INSERT INTO payments (id, order_id, order_number, customer_name, customer_id,
          amount, method, reference, receipt_number, status, notes, created_at, received_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'COMPLETED', ?, ?, ?)
      `).run(
        paymentId, debt.order_id, debt.order_number, debt.customer_name, debt.customer_id,
        paymentAmount, method, reference || null,
        `RC-${debt.order_number || uuid().substring(0, 8)}`,
        `Pagamento de dívida: ${debt.id}`, now, req.user.userId
      );
      
      // Update order payment status
      const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(debt.order_id);
      if (order) {
        const paid = db.prepare('SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE order_id = ? AND amount > 0')
          .get(debt.order_id).total;
        const paymentStatus = paid >= order.total - 0.01 ? 'PAID' : (paid > 0 ? 'PARTIALLY_PAID' : 'PENDING');
        db.prepare("UPDATE orders SET payment_status = ? WHERE id = ?").run(paymentStatus, order.id);
      }
    }
    
    // Create cash movement if CASH
    if (method === 'CASH') {
      const openShift = db.prepare(
        `SELECT * FROM cash_shifts WHERE status = 'OPEN' ORDER BY opened_at DESC LIMIT 1`
      ).get();
      if (openShift) {
        db.prepare(`
          INSERT INTO cash_movements (id, shift_id, type, amount, description, reference_id, reference_type, created_at, performed_by)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(uuid(), openShift.id, 'DEBT_PAYMENT', paymentAmount,
          `Pagamento de dívida ${debt.id}`, dpId, 'DEBT_PAYMENT', now, req.user.userId);
      }
    }
    
    audit(req.user, 'PAYMENT', 'DEBT', debt.id,
      `Pagamento de dívida: ${paymentAmount} MT para ${debt.customer_name}`,
      { balance_before: debt.balance }, { balance_after: newBalance, status: newStatus });
    
    return {
      debt_id: debt.id,
      amount: paymentAmount,
      new_balance: newBalance,
      status: newStatus,
      fully_paid: newStatus === 'PAGO'
    };
  });
  
  try {
    const result = payDebtTx();
    res.json({ success: true, data: result });
  } catch (err) {
    const msg = err.message || '';
    if (msg.includes('obrigatório') || msg.includes('encontrada') || msg.includes('cancelada') || msg.includes('paga') || msg.includes('excede')) {
      return res.status(400).json({ success: false, error: msg });
    }
    res.status(500).json({ success: false, error: 'Erro ao pagar dívida: ' + err.message });
  }
});

module.exports = router;
