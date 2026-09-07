const express = require('express');
const { getDb, uuid } = require('../database');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const { audit } = require('../middleware/audit');

const router = express.Router();

// GET /api/cash/shifts - list all shifts
router.get('/shifts', requireAuth, (req, res) => {
  try {
    const db = getDb();
    const shifts = db.prepare(`
      SELECT cs.*, u.name as opened_by_name, u2.name as closed_by_name, cr.name as register_name
      FROM cash_shifts cs
      LEFT JOIN users u ON cs.opened_by = u.id
      LEFT JOIN users u2 ON cs.closed_by = u2.id
      LEFT JOIN cash_registers cr ON cs.register_id = cr.id
      ORDER BY cs.opened_at DESC
    `).all();
    res.json({ success: true, data: shifts });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Erro ao listar turnos: ' + err.message });
  }
});

// GET /api/cash/shifts/current
router.get('/shifts/current', requireAuth, (req, res) => {
  try {
    const db = getDb();
    const shift = db.prepare(`
      SELECT cs.*, u.name as opened_by_name
      FROM cash_shifts cs
      LEFT JOIN users u ON cs.opened_by = u.id
      WHERE cs.status = 'OPEN'
      ORDER BY cs.opened_at DESC
      LIMIT 1
    `).get();
    
    if (!shift) {
      return res.json({ success: true, data: null });
    }
    
    // Get cash movements for this shift
    const movements = db.prepare(`
      SELECT cm.*, u.name as performed_by_name
      FROM cash_movements cm
      LEFT JOIN users u ON cm.performed_by = u.id
      WHERE cm.shift_id = ?
      ORDER BY cm.created_at ASC
    `).all(shift.id);
    
    // Sales summary for this shift
    const sales = db.prepare(`
      SELECT 
        COALESCE(SUM(CASE WHEN p.method = 'CASH' THEN p.amount END), 0) as cash_sales,
        COALESCE(SUM(CASE WHEN p.method != 'CASH' AND p.method != 'CREDIT' THEN p.amount END), 0) as other_sales,
        COALESCE(SUM(p.amount), 0) as total_sales
      FROM payments p
      WHERE p.created_at >= ?
    `).get(shift.opened_at);
    
    // Calculate expected cash from movements
    const totalIn = movements
      .filter(m => ['SALE', 'INITIAL_FLOAT', 'DEBT_PAYMENT', 'INFLOW'].includes(m.type))
      .reduce((s, m) => s + m.amount, 0);
    const totalOut = movements
      .filter(m => ['WITHDRAWAL', 'EXPENSE', 'OUTFLOW'].includes(m.type))
      .reduce((s, m) => s + m.amount, 0);
    
    res.json({
      success: true,
      data: {
        ...shift,
        current_cash: totalIn - totalOut,
        cash_sales: sales.cash_sales,
        other_sales: sales.other_sales,
        total_sales: sales.total_sales,
        movements_count: movements.length
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Erro ao obter turno atual: ' + err.message });
  }
});

// POST /api/cash/shifts/open
router.post('/shifts/open', requireAuth, requireAdmin, (req, res) => {
  try {
    const db = getDb();
    const { initial_cash_float, notes } = req.body;
    
    // Check if there's already an open shift
    const existing = db.prepare("SELECT id FROM cash_shifts WHERE status = 'OPEN'").get();
    if (existing) {
      return res.status(400).json({ success: false, error: 'Já existe um turno aberto. Feche o turno atual antes de abrir outro.' });
    }
    
    const float = initial_cash_float !== undefined ? parseFloat(initial_cash_float) : 0;
    if (isNaN(float) || float < 0) {
      return res.status(400).json({ success: false, error: 'Valor do fundo de caixa deve ser não-negativo' });
    }
    
    // Get or create a cash register
    let register = db.prepare("SELECT * FROM cash_registers WHERE status = 'ACTIVE' LIMIT 1").get();
    if (!register) {
      const regId = uuid();
      const now = new Date().toISOString();
      db.prepare(`
        INSERT INTO cash_registers (id, name, status, created_at)
        VALUES (?, ?, 'ACTIVE', ?)
      `).run(regId, 'Caixa Principal', now);
      register = { id: regId, name: 'Caixa Principal' };
    }
    
    // Get next shift number
    const lastShift = db.prepare('SELECT MAX(shift_number) as max_num FROM cash_shifts').get();
    const shiftNum = (lastShift.max_num || 0) + 1;
    
    const shiftId = uuid();
    const now = new Date().toISOString();
    
    db.prepare(`
      INSERT INTO cash_shifts (id, shift_number, register_id, status, opened_by, opened_at,
        initial_cash_float, expected_cash, total_sales_amount, orders_count, notes)
      VALUES (?, ?, ?, 'OPEN', ?, ?, ?, ?, 0, 0, ?)
    `).run(
      shiftId, shiftNum, register.id, req.user.userId, now,
      float, float, notes || 'Abertura de turno'
    );
    
    // Record initial float movement
    if (float > 0) {
      db.prepare(`
        INSERT INTO cash_movements (id, shift_id, type, amount, description, created_at, performed_by)
        VALUES (?, ?, 'INITIAL_FLOAT', ?, 'Fundo inicial de caixa', ?, ?)
      `).run(uuid(), shiftId, float, now, req.user.userId);
    }
    
    audit(req.user, 'OPEN', 'CASH_SHIFT', shiftId,
      `Turno #${shiftNum} aberto com fundo de ${float} MT`,
      null, { shift_number: shiftNum, initial_cash_float: float });
    
    const shift = db.prepare('SELECT * FROM cash_shifts WHERE id = ?').get(shiftId);
    res.status(201).json({ success: true, data: shift });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Erro ao abrir turno: ' + err.message });
  }
});

// PATCH /api/cash/shifts/current/close
router.patch('/shifts/current/close', requireAuth, requireAdmin, (req, res) => {
  const db = getDb();
  const closeTx = db.transaction(() => {
    const shift = db.prepare(
      "SELECT * FROM cash_shifts WHERE status = 'OPEN' ORDER BY opened_at DESC LIMIT 1"
    ).get();
    
    if (!shift) {
      throw new Error('Nenhum turno aberto para fechar');
    }
    
    const { counted_cash, notes, discrepancy_justification } = req.body;
    const now = new Date().toISOString();
    
    // Get all movements to compute expected cash
    const movements = db.prepare('SELECT * FROM cash_movements WHERE shift_id = ?').all(shift.id);
    const totalIn = movements
      .filter(m => ['SALE', 'INITIAL_FLOAT', 'DEBT_PAYMENT', 'INFLOW'].includes(m.type))
      .reduce((s, m) => s + m.amount, 0);
    const totalOut = movements
      .filter(m => ['WITHDRAWAL', 'EXPENSE', 'OUTFLOW'].includes(m.type))
      .reduce((s, m) => s + m.amount, 0);
    
    const expectedCash = totalIn - totalOut;
    
    // Payment breakdown
    const payments = db.prepare(`
      SELECT p.method, COUNT(*) as count, COALESCE(SUM(p.amount), 0) as total
      FROM payments p
      WHERE p.created_at >= ?
      GROUP BY p.method
    `).all(shift.opened_at);
    
    const breakdown = payments.map(p => ({ method: p.method, count: p.count, total: p.total }));
    
    let discrepancy = null;
    if (counted_cash !== undefined && counted_cash !== null) {
      const counted = parseFloat(counted_cash);
      if (isNaN(counted)) {
        throw new Error('Valor de contagem de caixa inválido');
      }
      discrepancy = parseFloat((counted - expectedCash).toFixed(2));
    }
    
    // Get orders count in this shift
    const ordersCount = db.prepare('SELECT COUNT(*) as count FROM orders WHERE created_at >= ?').get(shift.opened_at).count;
    
    db.prepare(`
      UPDATE cash_shifts SET
        status = 'CLOSED',
        closed_by = ?,
        closed_at = ?,
        expected_cash = ?,
        counted_cash = ?,
        cash_discrepancy = ?,
        total_sales_amount = ?,
        orders_count = ?,
        payment_breakdown = ?,
        notes = COALESCE(?, notes),
        discrepancy_justification = ?
      WHERE id = ?
    `).run(
      req.user.userId, now, expectedCash,
      counted_cash !== undefined && counted_cash !== null ? parseFloat(counted_cash) : null,
      discrepancy,
      payments.reduce((s, p) => s + p.total, 0),
      ordersCount,
      JSON.stringify(breakdown),
      // notes param handling
      (() => {
        try { return notes || null; } catch(e) { return null; }
      })(),
      // Actually run with direct values
      (discrepancy_justification || null),
      shift.id
    );
    
    // Fix notes if undefined
    if (notes !== undefined) {
      db.prepare('UPDATE cash_shifts SET notes = ? WHERE id = ?').run(notes, shift.id);
    }
    
    audit(req.user, 'CLOSE', 'CASH_SHIFT', shift.id,
      `Turno #${shift.shift_number} fechado. Esperado: ${expectedCash} MT, Contado: ${counted_cash || 'N/A'} MT, Diferença: ${discrepancy === null ? 'N/A' : discrepancy + ' MT'}`,
      { status: 'OPEN' },
      { status: 'CLOSED', expected_cash: expectedCash, counted_cash: counted_cash || null, discrepancy });
    
    return {
      id: shift.id,
      shift_number: shift.shift_number,
      expected_cash: expectedCash,
      counted_cash: counted_cash !== undefined ? parseFloat(counted_cash) : null,
      discrepancy: discrepancy,
      payment_breakdown: breakdown,
      orders_count: ordersCount
    };
  });
  
  try {
    const result = closeTx();
    res.json({ success: true, data: result });
  } catch (err) {
    const msg = err.message || '';
    if (msg.includes('aberto') || msg.includes('inválido')) {
      return res.status(400).json({ success: false, error: msg });
    }
    res.status(500).json({ success: false, error: 'Erro ao fechar turno: ' + err.message });
  }
});

// GET /api/cash/shifts/:id
router.get('/shifts/:id', requireAuth, (req, res) => {
  try {
    const db = getDb();
    const shift = db.prepare(`
      SELECT cs.*, u.name as opened_by_name, u2.name as closed_by_name
      FROM cash_shifts cs
      LEFT JOIN users u ON cs.opened_by = u.id
      LEFT JOIN users u2 ON cs.closed_by = u2.id
      WHERE cs.id = ?
    `).get(req.params.id);
    
    if (!shift) {
      return res.status(404).json({ success: false, error: 'Turno não encontrado' });
    }
    
    const movements = db.prepare(`
      SELECT cm.*, u.name as performed_by_name
      FROM cash_movements cm
      LEFT JOIN users u ON cm.performed_by = u.id
      WHERE cm.shift_id = ?
      ORDER BY cm.created_at ASC
    `).all(req.params.id);
    
    // Get payments made during this shift
    const payments = db.prepare(`
      SELECT p.*, c.name as customer_name
      FROM payments p
      LEFT JOIN customers c ON p.customer_id = c.id
      WHERE p.created_at >= ?
      ORDER BY p.created_at ASC
    `).all(shift.opened_at);
    
    res.json({ success: true, data: { ...shift, movements, payments } });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Erro ao obter turno: ' + err.message });
  }
});

// GET /api/cash/summary
router.get('/summary', requireAuth, (req, res) => {
  try {
    const db = getDb();
    
    const openShift = db.prepare(
      "SELECT * FROM cash_shifts WHERE status = 'OPEN' ORDER BY opened_at DESC LIMIT 1"
    ).get();
    
    let currentCash = 0;
    if (openShift) {
      const movements = db.prepare('SELECT * FROM cash_movements WHERE shift_id = ?').all(openShift.id);
      const totalIn = movements
        .filter(m => ['SALE', 'INITIAL_FLOAT', 'DEBT_PAYMENT', 'INFLOW'].includes(m.type))
        .reduce((s, m) => s + m.amount, 0);
      const totalOut = movements
        .filter(m => ['WITHDRAWAL', 'EXPENSE', 'OUTFLOW'].includes(m.type))
        .reduce((s, m) => s + m.amount, 0);
      currentCash = totalIn - totalOut;
    }
    
    // Today's payments by method
    const today = new Date().toISOString().split('T')[0];
    const todayPayments = db.prepare(`
      SELECT method, COUNT(*) as count, COALESCE(SUM(amount), 0) as total
      FROM payments
      WHERE date(created_at) = date('now')
      GROUP BY method
    `).all();
    
    res.json({
      success: true,
      data: {
        current_shift: openShift ? {
          id: openShift.id,
          shift_number: openShift.shift_number,
          status: openShift.status,
          initial_cash_float: openShift.initial_cash_float,
          opened_at: openShift.opened_at
        } : null,
        current_cash: currentCash,
        today_by_method: todayPayments,
        today_total: todayPayments.reduce((s, p) => s + p.total, 0)
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Erro ao obter resumo de caixa: ' + err.message });
  }
});

module.exports = router;
