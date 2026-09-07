const express = require('express');
const { getDb, uuid } = require('../database');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const { audit } = require('../middleware/audit');

const router = express.Router();

// GET /api/categories  (public — used by the website menu)
router.get('/', (req, res) => {
  try {
    const db = getDb();
    const categories = db.prepare(`
      SELECT c.*, 
        (SELECT COUNT(*) FROM products p WHERE p.category_id = c.id AND p.status = 'ACTIVE') as product_count
      FROM categories c
      ORDER BY c.display_order ASC, c.name ASC
    `).all();
    res.json({ success: true, data: categories });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Erro ao listar categorias: ' + err.message });
  }
});

// POST /api/categories
router.post('/', requireAuth, requireAdmin, (req, res) => {
  try {
    const db = getDb();
    const { name, description, icon_name, display_order, slug } = req.body;
    
    if (!name) {
      return res.status(400).json({ success: false, error: 'Nome da categoria é obrigatório' });
    }
    
    const id = uuid();
    const now = new Date().toISOString();
    
    db.prepare(`
      INSERT INTO categories (id, name, slug, icon_name, description, display_order, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      name,
      slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      icon_name || null,
      description || null,
      display_order !== undefined ? parseInt(display_order) : 0,
      now,
      now
    );
    
    audit(req.user, 'CREATE', 'CATEGORY', id, `Categoria criada: ${name}`,
      null, { name, display_order });
    
    const category = db.prepare('SELECT * FROM categories WHERE id = ?').get(id);
    res.status(201).json({ success: true, data: category });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Erro ao criar categoria: ' + err.message });
  }
});

// PUT /api/categories/:id
router.put('/:id', requireAuth, requireAdmin, (req, res) => {
  try {
    const db = getDb();
    const existing = db.prepare('SELECT * FROM categories WHERE id = ?').get(req.params.id);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Categoria não encontrada' });
    }
    
    const { name, description, icon_name, display_order, slug } = req.body;
    if (name !== undefined && !name) {
      return res.status(400).json({ success: false, error: 'Nome não pode ser vazio' });
    }
    
    db.prepare(`
      UPDATE categories SET
        name = COALESCE(?, name),
        slug = COALESCE(?, slug),
        icon_name = COALESCE(?, icon_name),
        description = COALESCE(?, description),
        display_order = COALESCE(?, display_order),
        updated_at = ?
      WHERE id = ?
    `).run(
      name || null,
      slug || null,
      icon_name !== undefined ? icon_name : null,
      description !== undefined ? description : null,
      display_order !== undefined ? parseInt(display_order) : null,
      new Date().toISOString(),
      req.params.id
    );
    
    audit(req.user, 'UPDATE', 'CATEGORY', req.params.id,
      `Categoria atualizada: ${name || existing.name}`,
      { name: existing.name }, { name: name || existing.name });
    
    const updated = db.prepare('SELECT * FROM categories WHERE id = ?').get(req.params.id);
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Erro ao atualizar categoria: ' + err.message });
  }
});

// DELETE /api/categories/:id
router.delete('/:id', requireAuth, requireAdmin, (req, res) => {
  try {
    const db = getDb();
    const category = db.prepare('SELECT * FROM categories WHERE id = ?').get(req.params.id);
    if (!category) {
      return res.status(404).json({ success: false, error: 'Categoria não encontrada' });
    }
    
    const products = db.prepare(
      "SELECT COUNT(*) as count FROM products WHERE category_id = ? AND status = 'ACTIVE'"
    ).get(req.params.id);
    if (products.count > 0) {
      return res.status(400).json({ success: false, error: 'Esta categoria tem produtos associados. Mova os produtos antes de eliminar.' });
    }
    
    const now = new Date().toISOString();
    // No is_deleted field on categories - check schema 
    // categories has no status field. We'll keep the record but this is the delete
    // The schema doesn't have is_deleted on categories, so we use the FK approach
    // Since no products are attached, delete the record
    db.prepare('DELETE FROM categories WHERE id = ?').run(req.params.id);
    
    audit(req.user, 'DELETE', 'CATEGORY', req.params.id,
      `Categoria eliminada: ${category.name}`, { name: category.name }, null);
    
    res.json({ success: true, data: { message: 'Categoria eliminada com sucesso' } });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Erro ao eliminar categoria: ' + err.message });
  }
});

module.exports = router;
