/**
 * Bali Catering Service — SQLite Schema Migrations
 * -------------------------------------------------
 * Creates all tables for the restaurant operating system.
 * Reuses the connection from server/database.js (getDb).
 *
 * Runs standalone:  node server/database/migrations.js
 */

const { getDb, closeDb } = require('../database.js');

const SCHEMA_VERSION = 1;

// ---------------------------------------------------------------------------
// Schema definitions
// ---------------------------------------------------------------------------

const TABLES = `
-- Users / Authentication
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  username TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'SELLER',
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  password_hash TEXT NOT NULL,
  salt TEXT,
  pin_hash TEXT,
  pin_salt TEXT,
  created_at TEXT NOT NULL,
  last_activity TEXT,
  created_by_id TEXT,
  failed_login_attempts INTEGER NOT NULL DEFAULT 0,
  locked_until TEXT,
  FOREIGN KEY (created_by_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS restaurant_settings (
  key TEXT PRIMARY KEY,
  value TEXT,
  updated_at TEXT
);

-- Catalog
CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT,
  icon_name TEXT,
  description TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TEXT,
  updated_at TEXT
);

CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  category_id TEXT,
  name TEXT NOT NULL,
  description TEXT,
  price REAL NOT NULL DEFAULT 0,
  cost_price REAL DEFAULT 0,
  image_url TEXT,
  is_available INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  is_specialty INTEGER NOT NULL DEFAULT 0,
  is_featured INTEGER NOT NULL DEFAULT 0,
  is_seasonal INTEGER NOT NULL DEFAULT 0,
  availability_days TEXT,
  preparation_time_minutes INTEGER NOT NULL DEFAULT 10,
  created_at TEXT,
  updated_at TEXT,
  FOREIGN KEY (category_id) REFERENCES categories(id)
);

CREATE TABLE IF NOT EXISTS product_price_history (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL,
  price REAL NOT NULL,
  previous_price REAL,
  changed_by TEXT,
  changed_at TEXT,
  reason TEXT,
  FOREIGN KEY (product_id) REFERENCES products(id)
);

-- Inventory / Recipes
CREATE TABLE IF NOT EXISTS ingredients (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT,
  unit TEXT,
  current_stock REAL NOT NULL DEFAULT 0,
  minimum_stock REAL NOT NULL DEFAULT 0,
  cost_per_unit REAL NOT NULL DEFAULT 0,
  supplier TEXT,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  last_updated TEXT
);

CREATE TABLE IF NOT EXISTS recipes (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL UNIQUE,
  created_at TEXT,
  updated_at TEXT,
  FOREIGN KEY (product_id) REFERENCES products(id)
);

CREATE TABLE IF NOT EXISTS recipe_items (
  id TEXT PRIMARY KEY,
  recipe_id TEXT NOT NULL,
  ingredient_id TEXT NOT NULL,
  quantity REAL NOT NULL DEFAULT 0,
  unit TEXT,
  FOREIGN KEY (recipe_id) REFERENCES recipes(id),
  FOREIGN KEY (ingredient_id) REFERENCES ingredients(id)
);

CREATE TABLE IF NOT EXISTS inventory_movements (
  id TEXT PRIMARY KEY,
  ingredient_id TEXT,
  ingredient_name TEXT,
  unit TEXT,
  type TEXT NOT NULL,
  quantity REAL NOT NULL,
  previous_stock REAL,
  new_stock REAL,
  reason TEXT,
  reference_order_id TEXT,
  reference_order_number TEXT,
  performed_by TEXT,
  authorized_by TEXT,
  created_at TEXT,
  FOREIGN KEY (ingredient_id) REFERENCES ingredients(id)
);

-- Customers
CREATE TABLE IF NOT EXISTS customers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  whatsapp TEXT,
  email TEXT,
  address TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  total_orders INTEGER NOT NULL DEFAULT 0,
  total_spent REAL NOT NULL DEFAULT 0,
  first_order_date TEXT,
  last_order_date TEXT,
  created_at TEXT,
  updated_at TEXT
);

CREATE TABLE IF NOT EXISTS customer_addresses (
  id TEXT PRIMARY KEY,
  customer_id TEXT NOT NULL,
  label TEXT,
  address TEXT,
  is_default INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (customer_id) REFERENCES customers(id)
);

-- Orders / Payments
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  order_number TEXT NOT NULL UNIQUE,
  customer_name TEXT NOT NULL,
  customer_phone TEXT,
  customer_address TEXT,
  customer_id TEXT,
  order_type TEXT NOT NULL DEFAULT 'TAKEAWAY',
  table_number TEXT,
  status TEXT NOT NULL DEFAULT 'PENDING',
  subtotal REAL NOT NULL DEFAULT 0,
  delivery_fee REAL NOT NULL DEFAULT 0,
  discount REAL NOT NULL DEFAULT 0,
  total REAL NOT NULL DEFAULT 0,
  payment_status TEXT NOT NULL DEFAULT 'PENDING',
  payment_method TEXT NOT NULL DEFAULT 'CASH',
  payment_reference TEXT,
  notes TEXT,
  stock_deducted INTEGER NOT NULL DEFAULT 0,
  seller_id TEXT,
  cancellation_reason TEXT,
  cancelled_by TEXT,
  cancelled_at TEXT,
  authorized_by TEXT,
  created_at TEXT,
  updated_at TEXT,
  FOREIGN KEY (customer_id) REFERENCES customers(id),
  FOREIGN KEY (seller_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS order_items (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL,
  product_id TEXT,
  product_name TEXT NOT NULL,
  price REAL NOT NULL DEFAULT 0,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_cost REAL,
  notes TEXT,
  FOREIGN KEY (order_id) REFERENCES orders(id),
  FOREIGN KEY (product_id) REFERENCES products(id)
);

CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY,
  order_id TEXT,
  order_number TEXT,
  customer_name TEXT,
  customer_id TEXT,
  amount REAL NOT NULL,
  method TEXT NOT NULL,
  reference TEXT,
  receipt_number TEXT,
  status TEXT NOT NULL DEFAULT 'COMPLETED',
  notes TEXT,
  created_at TEXT,
  received_by TEXT,
  shift_id TEXT,
  FOREIGN KEY (order_id) REFERENCES orders(id),
  FOREIGN KEY (customer_id) REFERENCES customers(id)
);

-- Debts (fiado)
CREATE TABLE IF NOT EXISTS debts (
  id TEXT PRIMARY KEY,
  customer_id TEXT,
  customer_name TEXT NOT NULL,
  order_id TEXT,
  order_number TEXT,
  original_amount REAL NOT NULL,
  amount_paid REAL NOT NULL DEFAULT 0,
  balance REAL NOT NULL,
  due_date TEXT,
  status TEXT NOT NULL DEFAULT 'PENDENTE',
  notes TEXT,
  created_at TEXT,
  updated_at TEXT,
  FOREIGN KEY (customer_id) REFERENCES customers(id),
  FOREIGN KEY (order_id) REFERENCES orders(id)
);

CREATE TABLE IF NOT EXISTS debt_payments (
  id TEXT PRIMARY KEY,
  debt_id TEXT,
  amount REAL NOT NULL,
  method TEXT,
  reference TEXT,
  notes TEXT,
  created_at TEXT,
  received_by TEXT,
  FOREIGN KEY (debt_id) REFERENCES debts(id)
);

-- Cash management
CREATE TABLE IF NOT EXISTS cash_registers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  created_at TEXT
);

CREATE TABLE IF NOT EXISTS cash_shifts (
  id TEXT PRIMARY KEY,
  shift_number INTEGER NOT NULL,
  register_id TEXT,
  status TEXT NOT NULL DEFAULT 'OPEN',
  opened_by TEXT,
  opened_at TEXT,
  initial_cash_float REAL NOT NULL DEFAULT 0,
  closed_by TEXT,
  closed_at TEXT,
  expected_cash REAL NOT NULL DEFAULT 0,
  counted_cash REAL,
  cash_discrepancy REAL,
  total_sales_amount REAL NOT NULL DEFAULT 0,
  orders_count INTEGER NOT NULL DEFAULT 0,
  payment_breakdown TEXT,
  notes TEXT,
  discrepancy_justification TEXT,
  FOREIGN KEY (register_id) REFERENCES cash_registers(id)
);

CREATE TABLE IF NOT EXISTS cash_movements (
  id TEXT PRIMARY KEY,
  shift_id TEXT,
  type TEXT NOT NULL,
  amount REAL NOT NULL,
  description TEXT,
  reference_id TEXT,
  reference_type TEXT,
  created_at TEXT,
  performed_by TEXT,
  FOREIGN KEY (shift_id) REFERENCES cash_shifts(id)
);

-- Sellers / Commission
CREATE TABLE IF NOT EXISTS sellers (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE,
  commission_rate REAL NOT NULL DEFAULT 0,
  target_monthly REAL NOT NULL DEFAULT 0,
  created_at TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS seller_sales (
  id TEXT PRIMARY KEY,
  seller_id TEXT NOT NULL,
  order_id TEXT NOT NULL,
  sale_amount REAL NOT NULL DEFAULT 0,
  commission_amount REAL NOT NULL DEFAULT 0,
  created_at TEXT,
  FOREIGN KEY (seller_id) REFERENCES sellers(id),
  FOREIGN KEY (order_id) REFERENCES orders(id)
);

-- Audit / Security / Backup / Notifications
CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  action TEXT NOT NULL,
  entity TEXT,
  entity_id TEXT,
  description TEXT,
  user_name TEXT,
  user_id TEXT,
  user_role TEXT,
  previous_value TEXT,
  new_value TEXT,
  result TEXT NOT NULL DEFAULT 'SUCCESS',
  created_at TEXT
);

CREATE TABLE IF NOT EXISTS security_events (
  id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  severity TEXT NOT NULL,
  title TEXT,
  message TEXT,
  user_name TEXT,
  user_role TEXT,
  metadata TEXT,
  acknowledged INTEGER NOT NULL DEFAULT 0,
  acknowledged_by TEXT,
  acknowledged_at TEXT,
  created_at TEXT
);

CREATE TABLE IF NOT EXISTS backups (
  id TEXT PRIMARY KEY,
  sequence_number INTEGER,
  label TEXT,
  source TEXT,
  status TEXT NOT NULL DEFAULT 'SUCCESS',
  version TEXT,
  size_bytes INTEGER,
  checksum TEXT,
  items_count TEXT,
  performed_by TEXT,
  file_path TEXT,
  created_at TEXT
);

CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  type TEXT,
  title TEXT,
  message TEXT,
  user_id TEXT,
  is_read INTEGER NOT NULL DEFAULT 0,
  metadata TEXT,
  created_at TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
`;

// ---------------------------------------------------------------------------
// Indexes
// ---------------------------------------------------------------------------

const INDEXES = [
  // products
  'CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id)',
  'CREATE INDEX IF NOT EXISTS idx_products_name ON products(name)',
  'CREATE INDEX IF NOT EXISTS idx_products_status ON products(status)',
  'CREATE INDEX IF NOT EXISTS idx_products_available ON products(is_available)',
  'CREATE INDEX IF NOT EXISTS idx_products_specialty ON products(is_specialty)',
  'CREATE INDEX IF NOT EXISTS idx_products_featured ON products(is_featured)',
  // product_price_history
  'CREATE INDEX IF NOT EXISTS idx_price_history_product ON product_price_history(product_id)',
  'CREATE INDEX IF NOT EXISTS idx_price_history_changed_at ON product_price_history(changed_at)',
  // recipe_items
  'CREATE INDEX IF NOT EXISTS idx_recipe_items_recipe ON recipe_items(recipe_id)',
  'CREATE INDEX IF NOT EXISTS idx_recipe_items_ingredient ON recipe_items(ingredient_id)',
  // ingredients
  'CREATE INDEX IF NOT EXISTS idx_ingredients_category ON ingredients(category)',
  'CREATE INDEX IF NOT EXISTS idx_ingredients_status ON ingredients(status)',
  'CREATE INDEX IF NOT EXISTS idx_ingredients_name ON ingredients(name)',
  // inventory_movements
  'CREATE INDEX IF NOT EXISTS idx_inventory_movements_ingredient ON inventory_movements(ingredient_id)',
  'CREATE INDEX IF NOT EXISTS idx_inventory_movements_created ON inventory_movements(created_at)',
  'CREATE INDEX IF NOT EXISTS idx_inventory_movements_type ON inventory_movements(type)',
  'CREATE INDEX IF NOT EXISTS idx_inventory_movements_ref_order ON inventory_movements(reference_order_id)',
  // customers
  'CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone)',
  'CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(name)',
  'CREATE INDEX IF NOT EXISTS idx_customers_last_order ON customers(last_order_date)',
  // customer_addresses
  'CREATE INDEX IF NOT EXISTS idx_customer_addresses_customer ON customer_addresses(customer_id)',
  // orders
  'CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status)',
  'CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at)',
  'CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id)',
  'CREATE INDEX IF NOT EXISTS idx_orders_seller ON orders(seller_id)',
  'CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status)',
  'CREATE INDEX IF NOT EXISTS idx_orders_customer_name ON orders(customer_name)',
  'CREATE INDEX IF NOT EXISTS idx_orders_updated ON orders(updated_at)',
  // order_items
  'CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id)',
  'CREATE INDEX IF NOT EXISTS idx_order_items_product ON order_items(product_id)',
  // payments
  'CREATE INDEX IF NOT EXISTS idx_payments_order ON payments(order_id)',
  'CREATE INDEX IF NOT EXISTS idx_payments_created ON payments(created_at)',
  'CREATE INDEX IF NOT EXISTS idx_payments_method ON payments(method)',
  'CREATE INDEX IF NOT EXISTS idx_payments_customer ON payments(customer_id)',
  // debts
  'CREATE INDEX IF NOT EXISTS idx_debts_customer ON debts(customer_id)',
  'CREATE INDEX IF NOT EXISTS idx_debts_status ON debts(status)',
  'CREATE INDEX IF NOT EXISTS idx_debts_order ON debts(order_id)',
  // debt_payments
  'CREATE INDEX IF NOT EXISTS idx_debt_payments_debt ON debt_payments(debt_id)',
  'CREATE INDEX IF NOT EXISTS idx_debt_payments_created ON debt_payments(created_at)',
  // cash_shifts
  'CREATE INDEX IF NOT EXISTS idx_cash_shifts_register ON cash_shifts(register_id)',
  'CREATE INDEX IF NOT EXISTS idx_cash_shifts_status ON cash_shifts(status)',
  'CREATE INDEX IF NOT EXISTS idx_cash_shifts_opened ON cash_shifts(opened_at)',
  // cash_movements
  'CREATE INDEX IF NOT EXISTS idx_cash_movements_shift ON cash_movements(shift_id)',
  'CREATE INDEX IF NOT EXISTS idx_cash_movements_created ON cash_movements(created_at)',
  // seller_sales
  'CREATE INDEX IF NOT EXISTS idx_seller_sales_seller ON seller_sales(seller_id)',
  'CREATE INDEX IF NOT EXISTS idx_seller_sales_order ON seller_sales(order_id)',
  'CREATE INDEX IF NOT EXISTS idx_seller_sales_created ON seller_sales(created_at)',
  // audit_logs
  'CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at)',
  'CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity, entity_id)',
  'CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id)',
  // security_events
  'CREATE INDEX IF NOT EXISTS idx_security_events_created ON security_events(created_at)',
  'CREATE INDEX IF NOT EXISTS idx_security_events_severity ON security_events(severity)',
  'CREATE INDEX IF NOT EXISTS idx_security_events_ack ON security_events(acknowledged)',
  // backups
  'CREATE INDEX IF NOT EXISTS idx_backups_created ON backups(created_at)',
  // notifications
  'CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id)',
  'CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read)',
  // users
  'CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)',
  'CREATE INDEX IF NOT EXISTS idx_users_status ON users(status)',
];

// ---------------------------------------------------------------------------
// Run
// ---------------------------------------------------------------------------

function runMigrations() {
  const db = getDb();
  db.exec('BEGIN');
  try {
    db.exec(TABLES);
    INDEXES.forEach(idx => db.exec(idx));
    db.prepare(
      `INSERT INTO restaurant_settings (key, value, updated_at) VALUES (?, ?, ?)
       ON CONFLICT(key) DO NOTHING`
    ).run('schema_version', String(SCHEMA_VERSION), new Date().toISOString());
    db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
  return db;
}

// Run standalone
if (require.main === module) {
  try {
    const db = runMigrations();
    const tables = db.prepare(
      `SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name`
    ).all();
    console.log('✓ Migrations applied. Tables (' + tables.length + '):');
    tables.forEach(t => console.log('  - ' + t.name));
    closeDb();
    process.exit(0);
  } catch (err) {
    console.error('✗ Migration failed:', err.message);
    process.exit(1);
  }
}

module.exports = { runMigrations, SCHEMA_VERSION };
