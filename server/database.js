const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_PATH = path.join(DATA_DIR, 'bali.db');
const UPLOADS_DIR = path.join(DATA_DIR, 'uploads', 'products');
const BACKUPS_DIR = path.join(DATA_DIR, 'backups');

// Ensure directories exist
[DATA_DIR, UPLOADS_DIR, BACKUPS_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

let db;

function getDb() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    db.pragma('busy_timeout = 5000');
  }
  return db;
}

function closeDb() {
  if (db) {
    db.close();
    db = null;
  }
}

// Helper to generate a UUID
function uuid() {
  return require('uuid').v4();
}

module.exports = { getDb, closeDb, DATA_DIR, DB_PATH, UPLOADS_DIR, BACKUPS_DIR, uuid };
