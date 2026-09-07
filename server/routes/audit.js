const express = require('express');
const { getDb } = require('../database');
const { requireAuth, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// GET /api/audit
router.get('/', requireAuth, requireAdmin, (req, res) => {
  try {
    const db = getDb();
    const { entity, action, user_id, date_from, date_to, page = 1, limit = 50 } = req.query;
    
    let where = 'WHERE 1=1';
    const params = [];
    
    if (entity) {
      where += ' AND a.entity = ?';
      params.push(entity);
    }
    if (action) {
      where += ' AND a.action = ?';
      params.push(action);
    }
    if (user_id) {
      where += ' AND a.user_id = ?';
      params.push(user_id);
    }
    if (date_from) {
      where += ' AND a.created_at >= ?';
      params.push(`${date_from}T00:00:00Z`);
    }
    if (date_to) {
      where += ' AND a.created_at <= ?';
      params.push(`${date_to}T23:59:59Z`);
    }
    
    const pageNum = parseInt(page) || 1;
    const limitNum = Math.min(parseInt(limit) || 50, 200);
    const offset = (pageNum - 1) * limitNum;
    
    const total = db.prepare(`SELECT COUNT(*) as count FROM audit_logs a ${where}`).get(...params).count;
    
    const logs = db.prepare(`
      SELECT a.*, u.name as user_name_full
      FROM audit_logs a
      LEFT JOIN users u ON a.user_id = u.id
      ${where}
      ORDER BY a.created_at DESC
      LIMIT ? OFFSET ?
    `).all(...params, limitNum, offset);
    
    res.json({
      success: true,
      data: logs,
      pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Erro ao listar logs de auditoria: ' + err.message });
  }
});

// GET /api/audit/entities
router.get('/entities', requireAuth, requireAdmin, (req, res) => {
  try {
    const db = getDb();
    const entities = db.prepare('SELECT DISTINCT entity FROM audit_logs ORDER BY entity').all();
    const actions = db.prepare('SELECT DISTINCT action FROM audit_logs ORDER BY action').all();
    res.json({
      success: true,
      data: {
        entities: entities.map(e => e.entity).filter(Boolean),
        actions: actions.map(a => a.action).filter(Boolean)
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Erro: ' + err.message });
  }
});

module.exports = router;
