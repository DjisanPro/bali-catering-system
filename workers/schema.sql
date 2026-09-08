-- ============================================================
-- BALI CATERING SYSTEM — D1 Schema (Cloudflare Workers)
-- Tabelas essenciais para o funcionamento público do sistema
-- ============================================================

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
  locked_until TEXT
);

CREATE TABLE IF NOT EXISTS restaurant_settings (
  key TEXT PRIMARY KEY,
  value TEXT,
  updated_at TEXT
);

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
  updated_at TEXT
);

CREATE TABLE IF NOT EXISTS customers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  whatsapp TEXT,
  email TEXT,
  address TEXT,
  notes TEXT,
  status TEXT DEFAULT 'ACTIVE',
  total_orders INTEGER DEFAULT 0,
  total_spent REAL DEFAULT 0,
  first_order_date TEXT,
  last_order_date TEXT,
  created_at TEXT,
  updated_at TEXT
);

CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  order_number TEXT NOT NULL UNIQUE,
  customer_name TEXT,
  customer_phone TEXT,
  customer_address TEXT,
  customer_id TEXT,
  order_type TEXT DEFAULT 'TAKEAWAY',
  table_number TEXT,
  status TEXT DEFAULT 'PENDING',
  subtotal REAL DEFAULT 0,
  delivery_fee REAL DEFAULT 0,
  discount REAL DEFAULT 0,
  total REAL DEFAULT 0,
  payment_status TEXT DEFAULT 'PENDING',
  payment_method TEXT,
  payment_reference TEXT,
  notes TEXT,
  seller_id TEXT,
  stock_deducted INTEGER DEFAULT 0,
  created_at TEXT,
  updated_at TEXT,
  cancelled_at TEXT,
  cancelled_by TEXT,
  cancellation_reason TEXT
);

CREATE TABLE IF NOT EXISTS order_items (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL,
  product_id TEXT,
  product_name TEXT,
  price REAL DEFAULT 0,
  quantity INTEGER DEFAULT 1,
  unit_cost REAL DEFAULT 0,
  notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_featured ON products(is_featured);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);