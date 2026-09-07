const express = require('express');
const { getDb } = require('../database');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const { audit } = require('../middleware/audit');

const router = express.Router();

// GET /api/settings  (public — public-facing restaurant info for the website)
router.get('/', (req, res) => {
  try {
    const db = getDb();
    
    // Use restaurant_settings table
    let settings = [];
    try {
      settings = db.prepare('SELECT * FROM restaurant_settings').all();
    } catch (e) {
      settings = [];
    }
    
    // Convert to key-value object
    const settingsObj = {};
    settings.forEach(s => {
      settingsObj[s.key] = s.value;
    });
    
    res.json({ success: true, data: settingsObj });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Erro ao obter configurações: ' + err.message });
  }
});

// PUT /api/settings
router.put('/', requireAuth, requireAdmin, (req, res) => {
  const db = getDb();
  const updateTx = db.transaction(() => {
    const settings = req.body;
    if (!settings || typeof settings !== 'object') {
      throw new Error('Dados de configuração inválidos');
    }
    
    const now = new Date().toISOString();
    let updated = 0;
    
    for (const [key, value] of Object.entries(settings)) {
      const existing = db.prepare('SELECT * FROM restaurant_settings WHERE key = ?').get(key);
      
      let sqlValue;
      if (typeof value === 'object' && value !== null) {
        sqlValue = JSON.stringify(value);
      } else {
        sqlValue = String(value);
      }
      
      if (existing) {
        db.prepare('UPDATE restaurant_settings SET value = ?, updated_at = ? WHERE key = ?')
          .run(sqlValue, now, key);
      } else {
        db.prepare('INSERT INTO restaurant_settings (key, value, updated_at) VALUES (?, ?, ?)')
          .run(key, sqlValue, now);
      }
      updated++;
    }
    
    // Audit log
    audit(req.user, 'UPDATE', 'SETTINGS', 'global',
      `Configurações atualizadas (${updated} chaves)`,
      null, { keys: Object.keys(settings), count: updated });
    
    return updated;
  });
  
  try {
    const count = updateTx();
    res.json({ success: true, data: { updated: count, message: 'Configurações atualizadas com sucesso' } });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Erro ao atualizar configurações: ' + err.message });
  }
});

module.exports = router;
