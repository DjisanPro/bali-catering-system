-- ==============================================================================
-- BALI CATERING SERVICE - ESQUEMA DE BANCO DE DADOS POSTGRESQL (SUPABASE)
-- Cidade de Tete, Moçambique
-- ==============================================================================

-- Habilita extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Função utilitária para atualizar updated_at
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 1. TABELA DE UTILIZADORES E CONTROLE DE ACESSO (RBAC)
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL,
  username TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('ADMIN', 'SELLER')),
  password_hash TEXT NOT NULL,
  salt TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'SUSPENDED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_activity TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- 2. TABELA DE CATEGORIAS DO CARDÁPIO
CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  icon_name TEXT NOT NULL DEFAULT 'Utensils',
  description TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. TABELA DE INSUMOS E MATÉRIAS-PRIMAS (ESTOQUE)
CREATE TABLE IF NOT EXISTS ingredients (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  unit TEXT NOT NULL CHECK (unit IN ('kg', 'g', 'l', 'ml', 'un', 'porcao')),
  current_stock NUMERIC(12, 3) NOT NULL DEFAULT 0,
  minimum_stock NUMERIC(12, 3) NOT NULL DEFAULT 0,
  cost_per_unit NUMERIC(12, 2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  last_restocked TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ingredients_status ON ingredients(status);
CREATE INDEX IF NOT EXISTS idx_ingredients_stock ON ingredients(current_stock);

-- 4. TABELA DE PRODUTOS E PRATOS DO CARDÁPIO
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  category_id TEXT NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  price NUMERIC(12, 2) NOT NULL DEFAULT 0,
  cost_price NUMERIC(12, 2) DEFAULT 0,
  image_url TEXT NOT NULL DEFAULT '',
  is_available BOOLEAN NOT NULL DEFAULT TRUE,
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  is_specialty BOOLEAN NOT NULL DEFAULT FALSE,
  is_featured BOOLEAN NOT NULL DEFAULT FALSE,
  is_seasonal BOOLEAN NOT NULL DEFAULT FALSE,
  preparation_time_minutes INTEGER NOT NULL DEFAULT 20,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_available ON products(is_available);

-- 5. TABELA DE FICHAS TÉCNICAS (RECEITA / INGREDIENTES VINCULADOS)
CREATE TABLE IF NOT EXISTS recipe_ingredients (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  ingredient_id TEXT NOT NULL REFERENCES ingredients(id) ON DELETE RESTRICT,
  quantity NUMERIC(12, 3) NOT NULL,
  unit TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(product_id, ingredient_id)
);

CREATE INDEX IF NOT EXISTS idx_recipe_product ON recipe_ingredients(product_id);
CREATE INDEX IF NOT EXISTS idx_recipe_ingredient ON recipe_ingredients(ingredient_id);

-- 6. TABELA DE CLIENTES
CREATE TABLE IF NOT EXISTS customers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  address TEXT,
  total_orders INTEGER NOT NULL DEFAULT 0,
  total_spent NUMERIC(12, 2) NOT NULL DEFAULT 0,
  first_order_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_order_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'ARCHIVED')),
  is_archived BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);

-- 7. TABELA DE PEDIDOS E COMANDAS
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  order_number TEXT NOT NULL UNIQUE,
  idempotency_key TEXT UNIQUE,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_address TEXT,
  order_type TEXT NOT NULL CHECK (order_type IN ('DINE_IN', 'TAKEAWAY', 'DELIVERY', 'EVENT_CATERING')),
  table_number TEXT,
  status TEXT NOT NULL CHECK (status IN ('PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'DELIVERED', 'CANCELLED')),
  subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0,
  delivery_fee NUMERIC(12, 2) NOT NULL DEFAULT 0,
  discount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  total NUMERIC(12, 2) NOT NULL DEFAULT 0,
  payment_status TEXT NOT NULL CHECK (payment_status IN ('PENDING', 'PAID', 'PARTIALLY_PAID')),
  payment_method TEXT NOT NULL CHECK (payment_method IN ('CASH', 'MPESA', 'EMOLA', 'POS_CARD', 'BANK_TRANSFER')),
  payment_reference TEXT,
  notes TEXT,
  stock_deducted BOOLEAN NOT NULL DEFAULT FALSE,
  cancellation_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_payment ON orders(payment_status, payment_method);

-- 8. TABELA DE ITENS DOS PEDIDOS
CREATE TABLE IF NOT EXISTS order_items (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  product_name TEXT NOT NULL,
  price NUMERIC(12, 2) NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_cost NUMERIC(12, 2) DEFAULT 0,
  notes TEXT,
  total_price NUMERIC(12, 2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);

-- 9. TABELA DE TURNOS DE CAIXA
CREATE TABLE IF NOT EXISTS cash_shifts (
  id TEXT PRIMARY KEY,
  shift_number INTEGER NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('OPEN', 'IN_OPERATION', 'CLOSED')),
  opened_by TEXT NOT NULL,
  opened_by_user_id TEXT,
  opened_by_role TEXT NOT NULL DEFAULT 'ADMIN',
  opened_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  closed_by TEXT,
  closed_by_user_id TEXT,
  closed_at TIMESTAMPTZ,
  initial_cash_float NUMERIC(12, 2) NOT NULL DEFAULT 0,
  expected_cash NUMERIC(12, 2) NOT NULL DEFAULT 0,
  counted_cash NUMERIC(12, 2),
  cash_discrepancy NUMERIC(12, 2),
  total_sales_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  orders_count INTEGER NOT NULL DEFAULT 0,
  payment_breakdown JSONB NOT NULL DEFAULT '{"cash":0,"mpesa":0,"emola":0,"posCard":0,"bankTransfer":0}'::jsonb,
  notes TEXT,
  discrepancy_justification TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cash_shifts_status ON cash_shifts(status);

-- 10. TABELA DE TRANSAÇÕES DE CAIXA (SANGRIA / SUPRIMENTO)
CREATE TABLE IF NOT EXISTS cash_transactions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  shift_id TEXT NOT NULL REFERENCES cash_shifts(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('SUPPLY', 'BLEED', 'FLOAT', 'SALE')),
  amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  reason TEXT NOT NULL,
  performed_by TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cash_transactions_shift ON cash_transactions(shift_id);

-- 11. TABELA DE HISTÓRICO DE PAGAMENTOS
CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  order_number TEXT NOT NULL,
  amount NUMERIC(12, 2) NOT NULL,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('CASH', 'MPESA', 'EMOLA', 'POS_CARD', 'BANK_TRANSFER')),
  payment_status TEXT NOT NULL CHECK (payment_status IN ('PAID', 'PENDING', 'PARTIALLY_PAID')),
  payment_reference TEXT,
  customer_name TEXT NOT NULL,
  performed_by TEXT,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_payments_order ON payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_method ON payments(payment_method);

-- 12. TABELA DE MOVIMENTAÇÕES DE ESTOQUE
CREATE TABLE IF NOT EXISTS stock_movements (
  id TEXT PRIMARY KEY,
  ingredient_id TEXT NOT NULL REFERENCES ingredients(id) ON DELETE RESTRICT,
  ingredient_name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('ENTRY', 'EXIT_ORDER', 'EXIT_WASTE', 'ADJUSTMENT')),
  quantity NUMERIC(12, 3) NOT NULL,
  previous_stock NUMERIC(12, 3) NOT NULL,
  new_stock NUMERIC(12, 3) NOT NULL,
  unit TEXT NOT NULL,
  reason TEXT NOT NULL,
  reference_id TEXT,
  performed_by TEXT NOT NULL,
  authorized_by TEXT,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stock_movements_ing ON stock_movements(ingredient_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_time ON stock_movements(timestamp DESC);

-- 13. TABELA DE LOGS DE AUDITORIA IMUTÁVEL
CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  action TEXT NOT NULL,
  entity TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  description TEXT NOT NULL,
  user_name TEXT NOT NULL,
  user_id TEXT,
  user_role TEXT,
  previous_value TEXT,
  new_value TEXT,
  status TEXT NOT NULL DEFAULT 'SUCCESS',
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp DESC);

-- 14. TABELA DE ALERTAS DE SEGURANÇA
CREATE TABLE IF NOT EXISTS security_alerts (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  user_name TEXT,
  user_role TEXT,
  metadata JSONB,
  status TEXT NOT NULL DEFAULT 'UNREAD' CHECK (status IN ('UNREAD', 'ACKNOWLEDGED', 'DISMISSED')),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_security_alerts_status ON security_alerts(status, timestamp DESC);

-- TRIGGERS PARA ATUALIZAÇÃO AUTOMÁTICA DE TIMESTAMP
CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER trg_ingredients_updated_at BEFORE UPDATE ON ingredients FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER trg_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER trg_customers_updated_at BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER trg_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_timestamp();
