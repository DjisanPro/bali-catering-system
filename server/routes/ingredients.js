const express = require('express');
const { getDb, uuid } = require('../database');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const { audit } = require('../middleware/audit');

const router = express.Router();

// GET /api/ingredients
router.get('/', requireAuth, (req, res) => {
  try {
    const db = getDb();
    const { search, low_stock } = req.query;
    
    let sql = "SELECT * FROM ingredients WHERE status = 'ACTIVE'";
    const params = [];
    
    if (search) {
      sql += ' AND (name LIKE ? OR category LIKE ? OR supplier LIKE ?)';
      const like = `%${search}%`;
      params.push(like, like, like);
    }
    if (low_stock === '1') {
      sql += ' AND current_stock <= minimum_stock';
    }
    
    sql += ' ORDER BY name ASC';
    const ingredients = db.prepare(sql).all(...params);
    
    res.json({ success: true, data: ingredients });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Erro ao listar ingredientes: ' + err.message });
  }
});

// POST /api/ingredients
router.post('/', requireAuth, requireAdmin, (req, res) => {
  try {
    const db = getDb();
    const { name, unit, current_stock, minimum_stock, cost_per_unit, category, supplier } = req.body;
    
    if (!name || !unit) {
      return res.status(400).json({ success: false, error: 'Nome e unidade são obrigatórios' });
    }
    
    const id = uuid();
    const now = new Date().toISOString();
    
    db.prepare(`
      INSERT INTO ingredients (id, name, category, unit, current_stock, minimum_stock,
        cost_per_unit, supplier, status, last_updated)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE', ?)
    `).run(
      id,
      name,
      category || null,
      unit,
      current_stock !== undefined ? parseFloat(current_stock) : 0,
      minimum_stock !== undefined ? parseFloat(minimum_stock) : 0,
      cost_per_unit !== undefined ? parseFloat(cost_per_unit) : 0,
      supplier || null,
      now
    );
    
    // Initial inventory movement if stock was given
    if (current_stock && parseFloat(current_stock) > 0) {
      db.prepare(`
        INSERT INTO inventory_movements (id, ingredient_id, ingredient_name, unit, type,
          quantity, previous_stock, new_stock, reason, performed_by, created_at)
        VALUES (?, ?, ?, ?, 'ENTRY', ?, 0, ?, 'Stock inicial', ?, ?)
      `).run(uuid(), id, name, unit, parseFloat(current_stock), parseFloat(current_stock), req.user.userId, now);
    }
    
    audit(req.user, 'CREATE', 'INGREDIENT', id,
      `Ingrediente criado: ${name} (${unit})`,
      null, { name, unit, current_stock });
    
    const ingredient = db.prepare('SELECT * FROM ingredients WHERE id = ?').get(id);
    res.status(201).json({ success: true, data: ingredient });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Erro ao criar ingrediente: ' + err.message });
  }
});

// PUT /api/ingredients/:id
router.put('/:id', requireAuth, requireAdmin, (req, res) => {
  try {
    const db = getDb();
    const existing = db.prepare('SELECT * FROM ingredients WHERE id = ?').get(req.params.id);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Ingrediente não encontrado' });
    }
    
    const { name, unit, current_stock, minimum_stock, cost_per_unit, category, supplier } = req.body;
    
    if (name !== undefined && !name) {
      return res.status(400).json({ success: false, error: 'Nome não pode ser vazio' });
    }
    if (unit !== undefined && !unit) {
      return res.status(400).json({ success: false, error: 'Unidade não pode ser vazia' });
    }
    
    // If stock is being adjusted directly, record movement
    let stockChanged = false;
    let prevStock = existing.current_stock;
    let newStockVal = existing.current_stock;
    if (current_stock !== undefined && parseFloat(current_stock) !== existing.current_stock) {
      newStockVal = parseFloat(current_stock);
      stockChanged = true;
      
      db.prepare(`
        INSERT INTO inventory_movements (id, ingredient_id, ingredient_name, unit, type,
          quantity, previous_stock, new_stock, reason, performed_by, created_at)
        VALUES (?, ?, ?, ?, 'ADJUSTMENT', ?, ?, ?, 'Ajuste manual de stock', ?, ?)
      `).run(uuid(), existing.id, existing.name, existing.unit,
        Math.abs(newStockVal - prevStock), prevStock, newStockVal, req.user.userId,
        new Date().toISOString());
    }
    
    db.prepare(`
      UPDATE ingredients SET
        name = COALESCE(?, name),
        unit = COALESCE(?, unit),
        current_stock = COALESCE(?, current_stock),
        minimum_stock = COALESCE(?, minimum_stock),
        cost_per_unit = COALESCE(?, cost_per_unit),
        category = COALESCE(?, category),
        supplier = COALESCE(?, supplier),
        last_updated = ?
      WHERE id = ?
    `).run(
      name || null,
      unit || null,
      current_stock !== undefined ? parseFloat(current_stock) : null,
      minimum_stock !== undefined ? parseFloat(minimum_stock) : null,
      cost_per_unit !== undefined ? parseFloat(cost_per_unit) : null,
      category !== undefined ? category : null,
      supplier !== undefined ? supplier : null,
      new Date().toISOString(),
      req.params.id
    );
    
    audit(req.user, 'UPDATE', 'INGREDIENT', req.params.id,
      `Ingrediente atualizado: ${name || existing.name}`,
      { name: existing.name, current_stock: prevStock },
      { name: name || existing.name, current_stock: stockChanged ? newStockVal : prevStock });
    
    const updated = db.prepare('SELECT * FROM ingredients WHERE id = ?').get(req.params.id);
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Erro ao atualizar ingrediente: ' + err.message });
  }
});

// DELETE /api/ingredients/:id (soft delete via status)
router.delete('/:id', requireAuth, requireAdmin, (req, res) => {
  try {
    const db = getDb();
    const ingredient = db.prepare('SELECT * FROM ingredients WHERE id = ?').get(req.params.id);
    if (!ingredient) {
      return res.status(404).json({ success: false, error: 'Ingrediente não encontrado' });
    }
    
    const inRecipe = db.prepare(`
      SELECT COUNT(*) as count FROM recipe_items WHERE ingredient_id = ?
    `).get(req.params.id);
    if (inRecipe.count > 0) {
      return res.status(400).json({ success: false, error: 'Este ingrediente é usado em receitas. Remova das receitas primeiro.' });
    }
    
    db.prepare("UPDATE ingredients SET status = 'INACTIVE', last_updated = ? WHERE id = ?")
      .run(new Date().toISOString(), req.params.id);
    
    audit(req.user, 'DELETE', 'INGREDIENT', req.params.id,
      `Ingrediente desativado: ${ingredient.name}`, { name: ingredient.name }, { status: 'INACTIVE' });
    
    res.json({ success: true, data: { message: 'Ingrediente desativado com sucesso' } });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Erro ao desativar ingrediente: ' + err.message });
  }
});

module.exports = router;
