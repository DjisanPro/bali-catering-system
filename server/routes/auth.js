const express = require('express');
const bcrypt = require('bcryptjs');
const { getDb, uuid } = require('../database');
const { createSession, destroySession, requireAuth } = require('../middleware/auth');
const { audit } = require('../middleware/audit');

const router = express.Router();

// POST /api/auth/login
router.post('/login', (req, res) => {
  try {
    const { identifier, password } = req.body;
    if (!identifier || !password) {
      return res.status(400).json({ success: false, error: 'Identificador e senha são obrigatórios' });
    }
    
    const db = getDb();
    const user = db.prepare(
      `SELECT * FROM users 
       WHERE (username = ? OR name = ?) AND status = 'ACTIVE'`
    ).get(identifier, identifier);
    
    if (!user) {
      return res.status(401).json({ success: false, error: 'Credenciais inválidas' });
    }
    
    const validPassword = bcrypt.compareSync(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ success: false, error: 'Credenciais inválidas' });
    }
    
    const token = createSession(user);
    
    audit(user, 'LOGIN', 'USER', user.id, `Login de ${user.name}`, null, { username: user.username });
    
    const { password_hash, salt, pin_hash, pin_salt, ...userWithoutPassword } = user;
    res.json({ success: true, data: { token, user: userWithoutPassword } });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Erro ao fazer login: ' + err.message });
  }
});

// POST /api/auth/logout
router.post('/logout', requireAuth, (req, res) => {
  try {
    const db = getDb();
    audit(req.user, 'LOGOUT', 'USER', req.user.userId, `Logout de ${req.user.name}`, null, null);
    destroySession(req.token);
    res.json({ success: true, data: { message: 'Sessão encerrada com sucesso' } });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Erro ao encerrar sessão: ' + err.message });
  }
});

// GET /api/auth/me
router.get('/me', requireAuth, (req, res) => {
  try {
    const db = getDb();
    const user = db.prepare(
      `SELECT id, name, username, role, status, created_at, last_activity 
       FROM users WHERE id = ?`
    ).get(req.user.userId);
    
    if (!user) {
      return res.status(404).json({ success: false, error: 'Utilizador não encontrado' });
    }
    
    res.json({ success: true, data: user });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Erro ao obter dados do utilizador: ' + err.message });
  }
});

module.exports = router;
