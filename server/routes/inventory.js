const express = require('express');
const { getDb, uuid } = require('../database');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const { audit } = require('../middleware/audit');

const router = express.Router();

const MOVEMENT_TYPES = ['ENTRY', 'EXIT_ORDER', 'EXIT_WASTE', 'ADJUSTMENT'];

// GET /api/inventory/movements
router.get('/movements', requireAuth, (req, res) => {
  try {
    const db = getDb();
    const { ingredient_id, type, date_from, date_to, page = 1, limit = 50 } = req.query;
    
    let sql = `
      SELECT im.*, u.name as performed_by_name
      FROM inventory_movements im
      LEFT JOIN users u ON im.performed_by = u.id
      WHERE 1=1
    `;
    const params = [];
    
    if (ingredient_id) {
      sql += ' AND im.ingredient_id = ?';
      params.push(ingredient_id);
    }
    if (type) {
      sql += ' AND im.type = ?';
      params.push(type);
    }
    if (date_from) {
      sql += ' AND im.created_at >= ?';
      params.push(`${date_from}T00:00:00Z`);
    }
    if (date_to) {
      sql += ' AND im.created_at <= ?';
      params.push(`${date_to}T23:59:59Z`);
    }
    
    sql += ' ORDER BY im.created_at DESC';
    
    const pageNum = parseInt(page) || 1;
    const limitNum = Math.min(parseInt(limit) || 50, 200);
    const offset = (pageNum - 1) * limitNum;
    
    // Build count query
    let countSql = 'SELECT COUNT(*) as count FROM inventory_movements im WHERE 1=1';
    if (ingredient_id) countSql += ' AND im.ingredient_id = ?';
    if (type) countSql += ' AND im.type = ?';
    if (date_from) countSql += ' AND im.created_at >= ?';
    if (date_to) countSql += ' AND im.created_at <= ?';
    
    const total = db.prepare(countSql).get(...params).count;
    const movements = db.prepare(sql + ' LIMIT ? OFFSET ?').all(...params, limitNum, offset);
    
    res.json({
      success: true,
      data: movements,
      pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Erro ao listar movimentos: ' + err.message });
  }
});

// POST /api/inventory/movements
router.post('/movements', requireAuth, requireAdmin, (req, res) => {
  const db = getDb();
  const createMovementTx = db.transaction(() => {
    const { ingredient_id, type, quantity, reason } = req.body;
    
    if (!ingredient_id || !type || !quantity) {
      throw new Error('Ingrediente, tipo e quantidade são obrigatórios');
    }
    if (!MOVEMENT_TYPES.includes(type)) {
      throw new Error('Tipo de movimento inválido');
    }
    
    const qty = parseFloat(quantity);
    if (isNaN(qty) || qty <= 0) {
      throw new Error('Quantidade deve ser positiva');
    }
    
    const ingredient = db.prepare("SELECT * FROM ingredients WHERE id = ? AND status = 'ACTIVE'").get(ingredient_id);
    if (!ingredient) {
      throw new Error('Ingrediente não encontrado');
    }
    
    const now = new Date().toISOString();
    const prevStock = ingredient.current_stock;
    let newStock;
    
    if (type === 'ENTRY') {
      newStock = prevStock + qty;
    } else if (type === 'EXIT_ORDER' || type === 'EXIT_WASTE') {
      if (prevStock < qty) {
        throw new Error(`Stock insuficiente: apenas ${prevStock} ${ingredient.unit} disponíveis`);
      }
      newStock = prevStock - qty;
    } else { // ADJUSTMENT - quantity is delta
      newStock = prevStock + qty;
    }
    
    if (newStock < 0) {
      throw new Error('Ajuste resultaria em stock negativo');
    }
    
    // Update stock
    db.prepare('UPDATE ingredients SET current_stock = ?, last_updated = ? WHERE id = ?')
      .run(newStock, now, ingredient_id);
    
    // Create movement
    const movementId = uuid();
    db.prepare(`
      INSERT INTO inventory_movements (id, ingredient_id, ingredient_name, unit, type,
        quantity, previous_stock, new_stock, reason, performed_by, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      movementId, ingredient_id, ingredient.name, ingredient.unit, type,
      qty, prevStock, newStock,
      reason || `Movimento ${type} de ${ingredient.name}`, req.user.userId, now
    );
    
    audit(req.user, 'CREATE', 'INVENTORY_MOVEMENT', movementId,
      `Movimento de stock: ${ingredient.name} (${type}) ${qty} ${ingredient.unit}`,
      { current_stock: prevStock }, { current_stock: newStock });
    
    return {
      id: movementId,
      ingredient_id,
      ingredient_name: ingredient.name,
      type,
      quantity: qty,
      previous_stock: prevStock,
      new_stock: newStock,
      reason
    };
  });
  
  try {
    const result = createMovementTx();
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    const msg = err.message || '';
    if (msg.includes('obrigatório') || msg.includes('inválido') || msg.includes('insuficiente') || msg.includes('encontrado') || msg.includes('negativo')) {
      return res.status(400).json({ success: false, error: msg });
    }
    res.status(500).json({ success: false, error: 'Erro ao criar movimento: ' + err.message });
  }
});

// GET /api/inventory/low-stock
router.get('/low-stock', requireAuth, (req, res) => {
  try {
    const db = getDb();
    const lowStock = db.prepare(`
      SELECT * FROM ingredients
      WHERE status = 'ACTIVE' AND current_stock <= minimum_stock
      ORDER BY (current_stock * 1.0 / CASE WHEN minimum_stock > 0 THEN minimum_stock ELSE 1 END) ASC
    `).all();
    
    res.json({ success: true, data: lowStock });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Erro ao listar stock baixo: ' + err.message });
  }
});

// GET /api/inventory/valuation
router.get('/valuation', requireAuth, (req, res) => {
  try {
    const db = getDb();
    const valuation = db.prepare(`
      SELECT 
        COUNT(*) as ingredient_count,
        COALESCE(SUM(current_stock * cost_per_unit), 0) as total_value,
        COALESCE(SUM(CASE WHEN current_stock <= minimum_stock THEN current_stock * cost_per_unit END), 0) as low_stock_value
      FROM ingredients
      WHERE status = 'ACTIVE'
    `).get();
    
    res.json({ success: true, data: valuation });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Erro ao obter avaliação de inventário: ' + err.message });
  }
});

module.exports = router;
