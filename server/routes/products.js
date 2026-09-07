const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { getDb, uuid, UPLOADS_DIR } = require('../database');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const { audit } = require('../middleware/audit');

const router = express.Router();

// Multer config for product images
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, `product_${Date.now()}_${Math.random().toString(36).substring(2, 8)}${ext}`);
  }
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

// GET /api/products  (public — the website menu reads the catalog without login)
router.get('/', (req, res) => {
  try {
    const db = getDb();
    const { category, search, available_only } = req.query;
    
    let sql = `
      SELECT p.*, c.name as category_name, c.icon_name as category_icon
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.status = 'ACTIVE'
    `;
    const params = [];
    
    if (category) {
      sql += ' AND (p.category_id = ? OR c.name = ?)';
      params.push(category, category);
    }
    if (search) {
      sql += ' AND (p.name LIKE ? OR p.description LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }
    if (available_only === '1') {
      sql += ' AND p.is_available = 1';
    }
    
    sql += ' ORDER BY p.name ASC';
    const products = db.prepare(sql).all(...params);
    
    res.json({ success: true, data: products });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Erro ao listar produtos: ' + err.message });
  }
});

// GET /api/products/:id  (public read)
router.get('/:id', (req, res) => {
  try {
    const db = getDb();
    const product = db.prepare(`
      SELECT p.*, c.name as category_name, c.icon_name as category_icon
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.id = ?
    `).get(req.params.id);
    
    if (!product) {
      return res.status(404).json({ success: false, error: 'Produto não encontrado' });
    }
    
    // Get recipe via recipes table -> recipe_items
    const recipe = db.prepare('SELECT * FROM recipes WHERE product_id = ?').get(product.id);
    let recipeItems = [];
    if (recipe) {
      recipeItems = db.prepare(`
        SELECT ri.*, i.name as ingredient_name, i.unit as ingredient_unit,
          i.cost_per_unit as ingredient_cost, i.current_stock as ingredient_stock
        FROM recipe_items ri
        JOIN ingredients i ON ri.ingredient_id = i.id
        WHERE ri.recipe_id = ?
        ORDER BY i.name
      `).all(recipe.id);
    }
    
    res.json({ success: true, data: { ...product, recipe_items: recipeItems } });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Erro ao obter produto: ' + err.message });
  }
});

// POST /api/products
router.post('/', requireAuth, requireAdmin, (req, res) => {
  try {
    const db = getDb();
    const { name, description, price, cost_price, category_id, image_url, is_available, is_featured, is_specialty, preparation_time_minutes } = req.body;
    
    if (!name || price === undefined) {
      return res.status(400).json({ success: false, error: 'Nome e preço são obrigatórios' });
    }
    if (isNaN(price) || price < 0) {
      return res.status(400).json({ success: false, error: 'Preço deve ser um número positivo' });
    }
    
    const id = uuid();
    const now = new Date().toISOString();
    
    db.prepare(`
      INSERT INTO products (id, category_id, name, description, price, cost_price,
        image_url, is_available, status, is_specialty, is_featured, is_seasonal,
        preparation_time_minutes, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE', ?, ?, 0, ?, ?, ?)
    `).run(
      id,
      category_id || null,
      name,
      description || null,
      parseFloat(price),
      cost_price !== undefined ? parseFloat(cost_price) : null,
      image_url || null,
      is_available !== undefined ? (is_available ? 1 : 0) : 1,
      is_specialty ? 1 : 0,
      is_featured ? 1 : 0,
      preparation_time_minutes || 10,
      now,
      now
    );
    
    // Record price history
    db.prepare(`
      INSERT INTO product_price_history (id, product_id, price, changed_by, changed_at, reason)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(uuid(), id, parseFloat(price), req.user.userId, now, 'Preço inicial');
    
    audit(req.user, 'CREATE', 'PRODUCT', id, `Produto criado: ${name} (${price} MT)`,
      null, { name, price, category_id });
    
    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
    res.status(201).json({ success: true, data: product });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Erro ao criar produto: ' + err.message });
  }
});

// PUT /api/products/:id
router.put('/:id', requireAuth, requireAdmin, (req, res) => {
  try {
    const db = getDb();
    const existing = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
    
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Produto não encontrado' });
    }
    
    const { name, description, price, cost_price, category_id, image_url, is_available, is_featured, is_specialty, preparation_time_minutes } = req.body;
    
    if (name !== undefined && !name) {
      return res.status(400).json({ success: false, error: 'Nome não pode ser vazio' });
    }
    if (price !== undefined && (isNaN(price) || price < 0)) {
      return res.status(400).json({ success: false, error: 'Preço deve ser um número positivo' });
    }
    
    const now = new Date().toISOString();
    
    // If price changed, record audit + price history
    let oldPrice = existing.price;
    if (price !== undefined && parseFloat(price) !== existing.price) {
      db.prepare(`
        INSERT INTO product_price_history (id, product_id, price, previous_price, changed_by, changed_at, reason)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(uuid(), existing.id, parseFloat(price), existing.price, req.user.userId, now, 'Alteração de preço');
      
      audit(req.user, 'PRICE_CHANGE', 'PRODUCT', existing.id,
        `Preço de ${existing.name} alterado de ${oldPrice} MT para ${price} MT`,
        { price: oldPrice }, { price: parseFloat(price) });
    }
    
    db.prepare(`
      UPDATE products SET
        name = COALESCE(?, name),
        description = COALESCE(?, description),
        price = COALESCE(?, price),
        cost_price = COALESCE(?, cost_price),
        category_id = COALESCE(?, category_id),
        image_url = COALESCE(?, image_url),
        is_available = COALESCE(?, is_available),
        is_featured = COALESCE(?, is_featured),
        is_specialty = COALESCE(?, is_specialty),
        preparation_time_minutes = COALESCE(?, preparation_time_minutes),
        updated_at = ?
      WHERE id = ?
    `).run(
      name || null,
      description !== undefined ? description : null,
      price !== undefined ? parseFloat(price) : null,
      cost_price !== undefined ? parseFloat(cost_price) : null,
      category_id !== undefined ? category_id : null,
      image_url !== undefined ? image_url : null,
      is_available !== undefined ? (is_available ? 1 : 0) : null,
      is_featured !== undefined ? (is_featured ? 1 : 0) : null,
      is_specialty !== undefined ? (is_specialty ? 1 : 0) : null,
      preparation_time_minutes !== undefined ? parseInt(preparation_time_minutes) : null,
      now,
      req.params.id
    );
    
    audit(req.user, 'UPDATE', 'PRODUCT', req.params.id,
      `Produto atualizado: ${name || existing.name}`,
      { name: existing.name },
      { name: name || existing.name });
    
    const updated = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Erro ao atualizar produto: ' + err.message });
  }
});

// PATCH /api/products/:id/price
router.patch('/:id/price', requireAuth, (req, res) => {
  try {
    const db = getDb();
    const { price } = req.body;
    
    if (price === undefined || isNaN(price) || price < 0) {
      return res.status(400).json({ success: false, error: 'Preço válido é obrigatório' });
    }
    
    const existing = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Produto não encontrado' });
    }
    
    const now = new Date().toISOString();
    const oldPrice = existing.price;
    
    db.prepare('UPDATE products SET price = ?, updated_at = ? WHERE id = ?')
      .run(parseFloat(price), now, req.params.id);
    
    // Price history
    db.prepare(`
      INSERT INTO product_price_history (id, product_id, price, previous_price, changed_by, changed_at, reason)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(uuid(), existing.id, parseFloat(price), oldPrice, req.user.userId, now, 'Alteração de preço direta');
    
    // Audit log
    audit(req.user, 'PRICE_CHANGE', 'PRODUCT', req.params.id,
      `Preço de ${existing.name} alterado de ${oldPrice} MT para ${price} MT`,
      { price: oldPrice }, { price: parseFloat(price), nome: existing.name });
    
    res.json({ success: true, data: { ...existing, price: parseFloat(price) } });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Erro ao alterar preço: ' + err.message });
  }
});

// PATCH /api/products/:id/featured
router.patch('/:id/featured', requireAuth, requireAdmin, (req, res) => {
  try {
    const db = getDb();
    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, error: 'Produto não encontrado' });
    }
    
    const newFeatured = product.is_featured ? 0 : 1;
    db.prepare('UPDATE products SET is_featured = ?, updated_at = ? WHERE id = ?')
      .run(newFeatured, new Date().toISOString(), req.params.id);
    
    audit(req.user, 'UPDATE', 'PRODUCT', req.params.id,
      `Destaque de ${product.name} = ${newFeatured ? 'sim' : 'não'}`,
      { is_featured: product.is_featured }, { is_featured: newFeatured });
    
    res.json({ success: true, data: { ...product, is_featured: newFeatured } });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Erro ao alterar destaque: ' + err.message });
  }
});

// PATCH /api/products/:id/available
router.patch('/:id/available', requireAuth, (req, res) => {
  try {
    const db = getDb();
    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, error: 'Produto não encontrado' });
    }
    
    const newAvailable = product.is_available ? 0 : 1;
    db.prepare('UPDATE products SET is_available = ?, updated_at = ? WHERE id = ?')
      .run(newAvailable, new Date().toISOString(), req.params.id);
    
    audit(req.user, 'UPDATE', 'PRODUCT', req.params.id,
      `Disponibilidade de ${product.name} = ${newAvailable ? 'disponível' : 'indisponível'}`,
      { is_available: product.is_available }, { is_available: newAvailable });
    
    res.json({ success: true, data: { ...product, is_available: newAvailable } });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Erro ao alterar disponibilidade: ' + err.message });
  }
});

// DELETE /api/products/:id (soft delete via status)
router.delete('/:id', requireAuth, requireAdmin, (req, res) => {
  try {
    const db = getDb();
    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, error: 'Produto não encontrado' });
    }
    
    db.prepare("UPDATE products SET status = 'INACTIVE', updated_at = ? WHERE id = ?")
      .run(new Date().toISOString(), req.params.id);
    
    audit(req.user, 'DELETE', 'PRODUCT', req.params.id,
      `Produto desativado: ${product.name}`, { name: product.name }, { status: 'INACTIVE' });
    
    res.json({ success: true, data: { message: 'Produto desativado com sucesso' } });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Erro ao desativar produto: ' + err.message });
  }
});

// POST /api/products/:id/image
router.post('/:id/image', requireAuth, requireAdmin, upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'Nenhuma imagem enviada' });
    }
    
    const db = getDb();
    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, error: 'Produto não encontrado' });
    }
    
    // Delete old image if exists
    if (product.image_url) {
      const oldPath = path.join(process.cwd(), 'data', 'uploads', 'products', path.basename(product.image_url));
      if (fs.existsSync(oldPath)) {
        try { fs.unlinkSync(oldPath); } catch(e) {}
      }
    }
    
    const imageUrl = `/uploads/products/${req.file.filename}`;
    db.prepare('UPDATE products SET image_url = ?, updated_at = ? WHERE id = ?')
      .run(imageUrl, new Date().toISOString(), req.params.id);
    
    audit(req.user, 'UPDATE', 'PRODUCT', req.params.id,
      `Imagem de ${product.name} atualizada`, { image_url: product.image_url }, { image_url: imageUrl });
    
    res.json({ success: true, data: { image_url: imageUrl } });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Erro ao enviar imagem: ' + err.message });
  }
});

module.exports = router;
