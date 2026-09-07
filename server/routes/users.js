const express = require('express');
const bcrypt = require('bcryptjs');
const { getDb, uuid } = require('../database');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const { audit } = require('../middleware/audit');

const router = express.Router();

const ROLES = ['ADMIN', 'SELLER', 'COOK', 'WAITER'];

// GET /api/users
router.get('/', requireAuth, requireAdmin, (req, res) => {
  try {
    const db = getDb();
    const users = db.prepare(`
      SELECT id, name, username, role, status, created_at, last_activity, created_by_id
      FROM users
      ORDER BY name ASC
    `).all();
    res.json({ success: true, data: users });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Erro ao listar utilizadores: ' + err.message });
  }
});

// POST /api/users
router.post('/', requireAuth, requireAdmin, (req, res) => {
  try {
    const db = getDb();
    const { username, name, password, role } = req.body;
    
    if (!username || !name || !password) {
      return res.status(400).json({ success: false, error: 'Username, nome e senha são obrigatórios' });
    }
    
    const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
    if (existing) {
      return res.status(400).json({ success: false, error: 'Utilizador com este username já existe' });
    }
    
    if (!ROLES.includes(role || 'SELLER')) {
      return res.status(400).json({ success: false, error: 'Cargo inválido' });
    }
    
    const hashedPassword = bcrypt.hashSync(password, 10);
    const id = uuid();
    const now = new Date().toISOString();
    
    db.prepare(`
      INSERT INTO users (id, name, username, role, status, password_hash, created_at, created_by_id)
      VALUES (?, ?, ?, ?, 'ACTIVE', ?, ?, ?)
    `).run(id, name, username, role || 'SELLER', hashedPassword, now, req.user.userId);
    
    // Create seller record if role is SELLER
    if ((role || 'SELLER') === 'SELLER') {
      db.prepare(`
        INSERT INTO sellers (id, user_id, commission_rate, target_monthly, created_at)
        VALUES (?, ?, 0, 0, ?)
      `).run(uuid(), id, now);
    }
    
    audit(req.user, 'CREATE', 'USER', id,
      `Utilizador criado: ${name} (${role || 'SELLER'})`,
      null, { username, name, role: role || 'SELLER' });
    
    res.status(201).json({
      success: true,
      data: { id, name, username, role: role || 'SELLER', status: 'ACTIVE', created_at: now }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Erro ao criar utilizador: ' + err.message });
  }
});

// PUT /api/users/:id
router.put('/:id', requireAuth, requireAdmin, (req, res) => {
  try {
    const db = getDb();
    const existing = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Utilizador não encontrado' });
    }
    
    const { username, name, role } = req.body;
    
    if (username !== undefined && !username) {
      return res.status(400).json({ success: false, error: 'Username não pode ser vazio' });
    }
    if (role !== undefined && !ROLES.includes(role)) {
      return res.status(400).json({ success: false, error: 'Cargo inválido' });
    }
    
    // Prevent removing last admin
    if (existing.role === 'ADMIN' && role && role !== 'ADMIN') {
      const adminCount = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'ADMIN' AND status = 'ACTIVE'").get();
      if (adminCount.count <= 1) {
        return res.status(400).json({ success: false, error: 'Não pode remover o último administrador' });
      }
    }
    
    db.prepare(`
      UPDATE users SET
        username = COALESCE(?, username),
        name = COALESCE(?, name),
        role = COALESCE(?, role)
      WHERE id = ?
    `).run(username || null, name || null, role || null, req.params.id);
    
    // Update seller record if role changes
    if (role) {
      const sellerExists = db.prepare('SELECT id FROM sellers WHERE user_id = ?').get(req.params.id);
      if (role === 'SELLER' && !sellerExists) {
        db.prepare(`
          INSERT INTO sellers (id, user_id, commission_rate, target_monthly, created_at)
          VALUES (?, ?, 0, 0, ?)
        `).run(uuid(), req.params.id, new Date().toISOString());
      }
    }
    
    audit(req.user, 'UPDATE', 'USER', req.params.id,
      `Utilizador atualizado: ${name || existing.name}`,
      { username: existing.username, role: existing.role },
      { username: username || existing.username, name: name || existing.name, role: role || existing.role });
    
    const user = db.prepare(
      'SELECT id, name, username, role, status, created_at FROM users WHERE id = ?'
    ).get(req.params.id);
    
    res.json({ success: true, data: user });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Erro ao atualizar utilizador: ' + err.message });
  }
});

// PATCH /api/users/:id/status
router.patch('/:id/status', requireAuth, requireAdmin, (req, res) => {
  try {
    const db = getDb();
    const { is_active } = req.body;
    
    if (is_active === undefined) {
      return res.status(400).json({ success: false, error: 'Estado (is_active) é obrigatório' });
    }
    
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'Utilizador não encontrado' });
    }
    
    // Prevent deactivating last active admin
    const newStatus = is_active ? 'ACTIVE' : 'INACTIVE';
    if (user.role === 'ADMIN' && newStatus === 'INACTIVE') {
      const adminCount = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'ADMIN' AND status = 'ACTIVE'").get();
      if (adminCount.count <= 1) {
        return res.status(400).json({ success: false, error: 'Não pode desativar o último administrador' });
      }
    }
    
    db.prepare('UPDATE users SET status = ? WHERE id = ?').run(newStatus, req.params.id);
    
    audit(req.user, 'STATUS_CHANGE', 'USER', req.params.id,
      `Utilizador ${user.name} ${newStatus === 'ACTIVE' ? 'ativado' : 'desativado'}`,
      { status: user.status }, { status: newStatus });
    
    res.json({ success: true, data: { id: user.id, status: newStatus } });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Erro ao mudar estado: ' + err.message });
  }
});

// DELETE /api/users/:id (deactivate)
router.delete('/:id', requireAuth, requireAdmin, (req, res) => {
  try {
    const db = getDb();
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'Utilizador não encontrado' });
    }
    
    if (user.role === 'ADMIN') {
      const adminCount = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'ADMIN' AND status = 'ACTIVE'").get();
      if (adminCount.count <= 1) {
        return res.status(400).json({ success: false, error: 'Não pode eliminar o último administrador' });
      }
    }
    
    // Soft delete via status (users table has no is_deleted)
    db.prepare("UPDATE users SET status = 'INACTIVE' WHERE id = ?").run(req.params.id);
    
    audit(req.user, 'DELETE', 'USER', req.params.id,
      `Utilizador desativado: ${user.name}`,
      { status: user.status }, { status: 'INACTIVE' });
    
    res.json({ success: true, data: { message: 'Utilizador desativado com sucesso' } });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Erro ao eliminar utilizador: ' + err.message });
  }
});

// PATCH /api/users/:id/password
router.patch('/:id/password', requireAuth, (req, res) => {
  try {
    const db = getDb();
    const { current_password, new_password } = req.body;
    
    if (!new_password || new_password.length < 4) {
      return res.status(400).json({ success: false, error: 'Nova senha deve ter pelo menos 4 caracteres' });
    }
    
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'Utilizador não encontrado' });
    }
    
    // Only self or admin can change password
    if (req.user.userId !== user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, error: 'Sem permissão para alterar esta senha' });
    }
    
    // If changing own password and not admin, verify current password
    if (req.user.userId === user.id && req.user.role !== 'ADMIN' && current_password) {
      const valid = bcrypt.compareSync(current_password, user.password_hash);
      if (!valid) {
        return res.status(401).json({ success: false, error: 'Senha atual incorreta' });
      }
    }
    
    const hashedPassword = bcrypt.hashSync(new_password, 10);
    db.prepare('UPDATE users SET password_hash = ? WHERE id = ?')
      .run(hashedPassword, req.params.id);
    
    audit(req.user, 'PASSWORD_CHANGE', 'USER', req.params.id,
      `Senha de ${user.name} alterada por ${req.user.name}`,
      null, { username: user.username });
    
    res.json({ success: true, data: { message: 'Senha alterada com sucesso' } });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Erro ao alterar senha: ' + err.message });
  }
});

module.exports = router;
