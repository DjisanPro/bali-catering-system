const { v4: uuidv4 } = require('uuid');

// In-memory token store: token -> {userId, username, role, name, loginTime}
const sessions = new Map();
const SESSION_EXPIRY_MS = 8 * 60 * 60 * 1000; // 8 hours

function createSession(user) {
  const token = uuidv4();
  sessions.set(token, {
    userId: user.id,
    username: user.username,
    role: user.role,
    name: user.name,
    loginTime: new Date().toISOString()
  });
  return token;
}

function destroySession(token) {
  return sessions.delete(token);
}

function getSession(token) {
  const session = sessions.get(token);
  if (!session) return null;
  
  const loginTime = new Date(session.loginTime).getTime();
  if (Date.now() - loginTime > SESSION_EXPIRY_MS) {
    sessions.delete(token);
    return null;
  }
  return session;
}

function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Token de autenticação necessário' });
  }
  
  const token = authHeader.substring(7);
  const session = getSession(token);
  
  if (!session) {
    return res.status(401).json({ success: false, error: 'Sessão expirada ou token inválido' });
  }
  
  req.user = session;
  req.token = token;
  next();
}

function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'ADMIN') {
    return res.status(403).json({ success: false, error: 'Acesso restrito a administradores' });
  }
  next();
}

// Cleanup expired sessions periodically (every 30 minutes)
const cleanupInterval = setInterval(() => {
  const now = Date.now();
  for (const [token, session] of sessions.entries()) {
    const loginTime = new Date(session.loginTime).getTime();
    if (now - loginTime > SESSION_EXPIRY_MS) {
      sessions.delete(token);
    }
  }
}, 30 * 60 * 1000);

// Allow process to exit even with the interval running
cleanupInterval.unref();

module.exports = { createSession, destroySession, getSession, requireAuth, requireAdmin };
