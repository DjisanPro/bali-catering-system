const { getDb, uuid } = require('../database');

/**
 * Helper to write an audit log entry matching the audit_logs schema.
 * Columns: id (TEXT), action, entity, entity_id, description, user_name,
 *          user_id, user_role, previous_value, new_value, result, created_at
 */
function audit(user, action, entity, entityId, description, previousValue, newValue, result = 'SUCCESS') {
  try {
    const db = getDb();
    db.prepare(`
      INSERT INTO audit_logs (id, action, entity, entity_id, description, user_name,
        user_id, user_role, previous_value, new_value, result, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      uuid(),
      action,
      entity,
      entityId ? String(entityId) : null,
      description || null,
      user ? user.name || user.username : null,
      user ? user.userId : null,
      user ? user.role : null,
      previousValue !== undefined ? (typeof previousValue === 'object' ? JSON.stringify(previousValue) : String(previousValue)) : null,
      newValue !== undefined ? (typeof newValue === 'object' ? JSON.stringify(newValue) : String(newValue)) : null,
      result,
      new Date().toISOString()
    );
  } catch (e) {
    console.warn('[Audit] Failed to write audit log:', e.message);
  }
}

module.exports = { audit };
