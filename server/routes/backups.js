const express = require('express');
const fs = require('fs');
const path = require('path');
const { getDb, uuid, BACKUPS_DIR } = require('../database');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const { audit } = require('../middleware/audit');

const router = express.Router();

// List of all tables to backup (matching the actual schema)
const TABLES = [
  'users', 'categories', 'products', 'product_price_history',
  'ingredients', 'recipes', 'recipe_items', 'inventory_movements',
  'customers', 'customer_addresses', 'orders', 'order_items',
  'payments', 'debts', 'debt_payments', 'cash_registers',
  'cash_shifts', 'cash_movements', 'sellers', 'seller_sales',
  'audit_logs', 'security_events', 'backups', 'notifications',
  'restaurant_settings'
];

// Helper to dump all tables
function dumpAllTables(db) {
  const data = {};
  for (const table of TABLES) {
    try {
      const exists = db.prepare(
        "SELECT name FROM sqlite_master WHERE type='table' AND name=?"
      ).get(table);
      if (exists) {
        data[table] = db.prepare(`SELECT * FROM ${table}`).all();
      }
    } catch (e) {
      // Skip tables that don't exist yet
    }
  }
  return data;
}

// Helper to restore data into tables
function restoreAllTables(db, data) {
  // Runs INSIDE the handler's outer transaction (FKs already disabled outside).
  for (const table of TABLES) {
    if (!data[table] || !Array.isArray(data[table])) continue;

    try {
      const exists = db.prepare(
        "SELECT name FROM sqlite_master WHERE type='table' AND name=?"
      ).get(table);
      if (!exists) continue;

      const rows = data[table];
      if (rows.length === 0) continue;

      const columns = Object.keys(rows[0]);
      const colList = columns.join(', ');
      const placeholders = columns.map(() => '?').join(', ');

      db.prepare(`DELETE FROM ${table}`).run();

      const insertStmt = db.prepare(
        `INSERT INTO ${table} (${colList}) VALUES (${placeholders})`
      );

      for (const row of rows) {
        try {
          insertStmt.run(...columns.map((c) => row[c]));
        } catch (e) {
          console.warn(`[Backup Restore] Failed to restore row in ${table}: ${e.message}`);
        }
      }
    } catch (e) {
      console.warn(`[Backup Restore] Error restoring table ${table}: ${e.message}`);
    }
  }
}

// POST /api/backups/create
router.post('/create', requireAuth, requireAdmin, (req, res) => {
  try {
    const db = getDb();
    const { label } = req.body;
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupId = uuid();
    const filename = `${backupId}.json`;
    const filepath = path.join(BACKUPS_DIR, filename);
    
    const data = dumpAllTables(db);
    
    const backup = {
      id: backupId,
      label: label || `Backup ${new Date().toLocaleString('pt-BR')}`,
      created_by: req.user.username,
      created_at: new Date().toISOString(),
      data
    };
    
    fs.writeFileSync(filepath, JSON.stringify(backup, null, 2));
    const fileSize = fs.statSync(filepath).size;
    
    // Also insert a record in the backups table
    const seqNumber = (db.prepare('SELECT COALESCE(MAX(sequence_number), 0) as max FROM backups').get().max) + 1;
    const itemsCount = Object.values(data).reduce((s, arr) => s + (arr ? arr.length : 0), 0);
    
    db.prepare(`
      INSERT INTO backups (id, sequence_number, label, source, status, version,
        size_bytes, items_count, performed_by, file_path, created_at)
      VALUES (?, ?, ?, 'LOCAL', 'SUCCESS', '1.0', ?, ?, ?, ?, ?)
    `).run(
      backupId, seqNumber, backup.label, fileSize, String(itemsCount),
      req.user.username, filepath, new Date().toISOString()
    );
    
    audit(req.user, 'CREATE', 'BACKUP', backupId,
      `Backup criado: ${backup.label} (${fileSize} bytes)`,
      null, { filename, size: fileSize, tables: Object.keys(data).length });
    
    res.status(201).json({
      success: true,
      data: {
        id: backupId,
        label: backup.label,
        filename,
        created_at: backup.created_at,
        size_bytes: fileSize,
        item_count: itemsCount
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Erro ao criar backup: ' + err.message });
  }
});

// GET /api/backups
router.get('/', requireAuth, requireAdmin, (req, res) => {
  try {
    const db = getDb();
    
    // Also check the database backups table
    const dbBackups = db.prepare(`
      SELECT id, sequence_number, label, source, status, version,
        size_bytes, items_count, performed_by, file_path, created_at
      FROM backups
      ORDER BY created_at DESC
    `).all();
    
    // Check filesystem for backup files
    const fsBackups = [];
    if (fs.existsSync(BACKUPS_DIR)) {
      const files = fs.readdirSync(BACKUPS_DIR)
        .filter(f => f.endsWith('.json'))
        .map(f => {
          const filepath = path.join(BACKUPS_DIR, f);
          const stats = fs.statSync(filepath);
          let meta = { filename: f, size_bytes: stats.size, created_at: stats.mtime.toISOString() };
          try {
            const content = JSON.parse(fs.readFileSync(filepath, 'utf-8'));
            meta.id = content.id;
            meta.label = content.label;
            meta.created_by = content.created_by;
            meta.item_count = content.data ? Object.values(content.data).reduce((s, arr) => s + (arr ? arr.length : 0), 0) : 0;
          } catch (e) {
            meta.id = f.replace('.json', '');
          }
          return meta;
        })
        .sort((a, b) => b.created_at.localeCompare(a.created_at));
      fsBackups.push(...files);
    }
    
    // Merge: use fs backups preferentially (they're more detailed)
    const merged = [...fsBackups];
    
    // Add any db backups not in fs
    for (const dbB of dbBackups) {
      if (!merged.some(m => m.id === dbB.id)) {
        merged.push({
          id: dbB.id,
          label: dbB.label,
          created_at: dbB.created_at,
          size_bytes: dbB.size_bytes,
          created_by: dbB.performed_by,
          item_count: dbB.items_count ? parseInt(dbB.items_count) : undefined
        });
      }
    }
    
    merged.sort((a, b) => b.created_at.localeCompare(a.created_at));
    
    res.json({ success: true, data: merged });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Erro ao listar backups: ' + err.message });
  }
});

// POST /api/backups/:id/restore
router.post('/:id/restore', requireAuth, requireAdmin, (req, res) => {
  const db = getDb();
  try {
    // Find the backup file
    let filepath;
    if (fs.existsSync(path.join(BACKUPS_DIR, `${req.params.id}.json`))) {
      filepath = path.join(BACKUPS_DIR, `${req.params.id}.json`);
    } else {
      // Check from DB
      const dbBackup = db.prepare('SELECT * FROM backups WHERE id = ?').get(req.params.id);
      if (dbBackup && dbBackup.file_path && fs.existsSync(dbBackup.file_path)) {
        filepath = dbBackup.file_path;
      } else {
        return res.status(404).json({ success: false, error: 'Backup não encontrado' });
      }
    }
    
    const backup = JSON.parse(fs.readFileSync(filepath, 'utf-8'));
    
    // Create safety snapshot
    const safetyId = uuid();
    const safetyFile = path.join(BACKUPS_DIR, `${safetyId}.json`);
    const safeData = dumpAllTables(db);
    const safetyBackup = {
      id: safetyId,
      label: `Snapshot de segurança antes do restore de ${req.params.id}`,
      created_by: req.user.username,
      created_at: new Date().toISOString(),
      is_safety_snapshot: true,
      data: safeData
    };
    fs.writeFileSync(safetyFile, JSON.stringify(safetyBackup, null, 2));
    
    // Restore with transaction
    // PRAGMA foreign_keys must be toggled OUTSIDE the transaction.
    const wasForeignKeys = db.pragma('foreign_keys', { simple: true });
    db.pragma('foreign_keys = OFF');
    try {
      const restoreTx = db.transaction(() => {
        restoreAllTables(db, backup.data);
      });
      restoreTx();
    } finally {
      db.pragma(`foreign_keys = ${wasForeignKeys ? 'ON' : 'OFF'}`);
    }
    
    audit(req.user, 'RESTORE', 'BACKUP', req.params.id,
      `Backup ${req.params.id} restaurado. Snapshot de segurança: ${safetyId}`,
      { safety_snapshot: safetyId }, { backup: req.params.id });
    
    res.json({
      success: true,
      data: {
        restored: req.params.id,
        safety_snapshot_id: safetyId,
        message: 'Backup restaurado com sucesso. Foi criado um snapshot de segurança.'
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Erro ao restaurar backup: ' + err.message });
  }
});

// GET /api/backups/:id/download
router.get('/:id/download', requireAuth, requireAdmin, (req, res) => {
  try {
    let filepath;
    if (fs.existsSync(path.join(BACKUPS_DIR, `${req.params.id}.json`))) {
      filepath = path.join(BACKUPS_DIR, `${req.params.id}.json`);
    } else {
      const dbBackup = require('../database').getDb().prepare('SELECT * FROM backups WHERE id = ?').get(req.params.id);
      if (dbBackup && dbBackup.file_path && fs.existsSync(dbBackup.file_path)) {
        filepath = dbBackup.file_path;
      } else {
        return res.status(404).json({ success: false, error: 'Backup não encontrado' });
      }
    }
    
    res.download(filepath);
  } catch (err) {
    res.status(500).json({ success: false, error: 'Erro ao baixar backup: ' + err.message });
  }
});

module.exports = router;
