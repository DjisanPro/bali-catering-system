const express = require('express');
const { getDb, uuid } = require('../database');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const { audit } = require('../middleware/audit');

const router = express.Router();

// GET /api/recipes/:productId
router.get('/:productId', requireAuth, (req, res) => {
  try {
    const db = getDb();
    const product = db.prepare("SELECT * FROM products WHERE id = ? AND status = 'ACTIVE'").get(req.params.productId);
    if (!product) {
      return res.status(404).json({ success: false, error: 'Produto não encontrado' });
    }
    
    // Get recipe via recipes table
    const recipe = db.prepare('SELECT * FROM recipes WHERE product_id = ?').get(product.id);
    let ingredients = [];
    
    if (recipe) {
      ingredients = db.prepare(`
        SELECT ri.*, i.name as ingredient_name, i.unit as ingredient_unit,
          i.cost_per_unit as ingredient_cost, i.current_stock as ingredient_stock
        FROM recipe_items ri
        JOIN ingredients i ON ri.ingredient_id = i.id
        WHERE ri.recipe_id = ?
        ORDER BY i.name
      `).all(recipe.id);
    }
    
    // Calculate recipe cost
    let total_cost = 0;
    for (const item of ingredients) {
      const cost = (item.ingredient_cost || 0) * item.quantity;
      item.cost_mt = cost;
      total_cost += cost;
    }
    
    const margin_pct = product.price > 0 ? ((product.price - total_cost) / product.price) * 100 : 0;
    
    res.json({
      success: true,
      data: {
        product_id: product.id,
        product_name: product.name,
        product_price: product.price,
        ingredients_count: ingredients.length,
        total_cost_mt: total_cost,
        margin_mt: product.price - total_cost,
        margin_pct: margin_pct,
        ingredients
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Erro ao obter receita: ' + err.message });
  }
});

// PUT /api/recipes/:productId
router.put('/:productId', requireAuth, requireAdmin, (req, res) => {
  const db = getDb();
  const updateRecipeTx = db.transaction(() => {
    const { ingredients } = req.body;
    const productId = req.params.productId;
    const now = new Date().toISOString();
    
    const product = db.prepare("SELECT * FROM products WHERE id = ? AND status = 'ACTIVE'").get(productId);
    if (!product) {
      throw new Error('Produto não encontrado');
    }
    
    if (!ingredients || !Array.isArray(ingredients)) {
      throw new Error('Lista de ingredientes é obrigatória');
    }
    
    // Get or create the recipe row
    let recipe = db.prepare('SELECT * FROM recipes WHERE product_id = ?').get(productId);
    if (!recipe) {
      const rid = uuid();
      db.prepare(`
        INSERT INTO recipes (id, product_id, created_at, updated_at)
        VALUES (?, ?, ?, ?)
      `).run(rid, productId, now, now);
      recipe = { id: rid };
    } else {
      // Delete existing recipe items
      db.prepare('DELETE FROM recipe_items WHERE recipe_id = ?').run(recipe.id);
    }
    
    // Update recipe row
    db.prepare('UPDATE recipes SET updated_at = ? WHERE id = ?').run(now, recipe.id);
    
    // Insert new recipe items
    for (const item of ingredients) {
      if (!item.ingredient_id || item.quantity === undefined || isNaN(item.quantity)) {
        throw new Error(`Ingrediente inválido na receita: ${JSON.stringify(item)}`);
      }
      
      const ingredient = db.prepare("SELECT id FROM ingredients WHERE id = ? AND status = 'ACTIVE'").get(item.ingredient_id);
      if (!ingredient) {
        throw new Error(`Ingrediente ${item.ingredient_id} não encontrado`);
      }
      
      db.prepare(`
        INSERT INTO recipe_items (id, recipe_id, ingredient_id, quantity, unit)
        VALUES (?, ?, ?, ?, ?)
      `).run(
        uuid(), recipe.id, item.ingredient_id, parseFloat(item.quantity),
        item.unit || null
      );
    }
    
    // Calculate new cost
    const costs = db.prepare(`
      SELECT COALESCE(SUM(ri.quantity * i.cost_per_unit), 0) as total_cost,
        COUNT(ri.id) as ingredient_count
      FROM recipe_items ri
      JOIN ingredients i ON ri.ingredient_id = i.id
      WHERE ri.recipe_id = ?
    `).get(recipe.id);
    
    audit(req.user, 'UPDATE', 'RECIPE', productId,
      `Receita de ${product.name} atualizada: ${ingredients.length} ingredientes`,
      null, { ingredients_count: ingredients.length, total_cost: costs.total_cost });
    
    return {
      product_id: productId,
      product_name: product.name,
      ingredients_count: ingredients.length,
      total_cost_mt: costs.total_cost
    };
  });
  
  try {
    const result = updateRecipeTx();
    res.json({ success: true, data: result });
  } catch (err) {
    const msg = err.message || '';
    if (msg.includes('obrigatória') || msg.includes('inválido') || msg.includes('encontrado')) {
      return res.status(400).json({ success: false, error: msg });
    }
    res.status(500).json({ success: false, error: 'Erro ao atualizar receita: ' + err.message });
  }
});

// POST /api/recipes/:productId/cost
router.post('/:productId/cost', requireAuth, (req, res) => {
  try {
    const db = getDb();
    const product = db.prepare("SELECT * FROM products WHERE id = ? AND status = 'ACTIVE'").get(req.params.productId);
    if (!product) {
      return res.status(404).json({ success: false, error: 'Produto não encontrado' });
    }
    
    const recipe = db.prepare('SELECT * FROM recipes WHERE product_id = ?').get(product.id);
    if (!recipe) {
      return res.status(400).json({ success: false, error: 'Este produto não tem receita definida' });
    }
    
    const costs = db.prepare(`
      SELECT 
        COALESCE(SUM(ri.quantity * i.cost_per_unit), 0) as total_cost,
        COUNT(ri.id) as ingredient_count
      FROM recipe_items ri
      JOIN ingredients i ON ri.ingredient_id = i.id
      WHERE ri.recipe_id = ?
    `).get(recipe.id);
    
    const total_cost = costs.total_cost;
    const price = product.price;
    const margin = price - total_cost;
    const margin_pct = price > 0 ? (margin / price) * 100 : 0;
    
    // Audit log for cost calculation
    audit(req.user, 'CALCULATE', 'RECIPE_COST', req.params.productId,
      `Custo da receita de ${product.name} calculado: ${total_cost.toFixed(2)} MT`,
      null, { total_cost, margin, margin_pct });
    
    res.json({
      success: true,
      data: {
        product_id: product.id,
        product_name: product.name,
        price,
        total_cost,
        ingredient_count: costs.ingredient_count,
        margin,
        margin_pct,
        is_profitable: margin > 0
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Erro ao calcular custo: ' + err.message });
  }
});

module.exports = router;
