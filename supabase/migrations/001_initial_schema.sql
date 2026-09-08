-- ============================================================
-- BALI CATERING SERVICE — Supabase Schema
-- Postgres migration — all tables for the full system
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. RESTAURANT SETTINGS (key-value store)
-- ============================================================
CREATE TABLE IF NOT EXISTS restaurant_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 2. USERS (auth via Supabase Auth + profiles)
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  username TEXT UNIQUE NOT NULL,
  email TEXT,
  role TEXT NOT NULL DEFAULT 'SELLER' CHECK (role IN ('SUPER_ADMIN','ADMIN','SELLER')),
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','INACTIVE')),
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  last_activity TIMESTAMPTZ,
  created_by_id UUID REFERENCES users(id),
  failed_login_attempts INT DEFAULT 0,
  locked_until TIMESTAMPTZ
);

-- ============================================================
-- 3. CATEGORIES
-- ============================================================
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  icon_name TEXT DEFAULT 'UtensilsCrossed',
  description TEXT,
  display_order INT DEFAULT 0,
  status TEXT DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','INACTIVE')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 4. PRODUCTS
-- ============================================================
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  slug TEXT,
  description TEXT DEFAULT '',
  short_description TEXT,
  full_description TEXT,
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  promotional_price NUMERIC(10,2),
  cost_price NUMERIC(10,2) DEFAULT 0,
  image_url TEXT DEFAULT '/placeholder.svg',
  gallery_images TEXT[] DEFAULT '{}',
  is_available BOOLEAN DEFAULT true,
  status TEXT DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','INACTIVE','ARCHIVED')),
  is_specialty BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  is_seasonal BOOLEAN DEFAULT false,
  availability_days TEXT[] DEFAULT '{}',
  preparation_time_minutes INT DEFAULT 15,
  additional_info TEXT,
  display_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 5. INGREDIENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS ingredients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  category TEXT DEFAULT 'Geral',
  unit TEXT NOT NULL DEFAULT 'kg' CHECK (unit IN ('kg','g','l','ml','un','porcao')),
  current_stock NUMERIC(10,2) DEFAULT 0,
  minimum_stock NUMERIC(10,2) DEFAULT 0,
  cost_per_unit NUMERIC(10,2) DEFAULT 0,
  supplier TEXT,
  status TEXT DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','INACTIVE')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 6. RECIPES (product ↔ ingredient relation)
-- ============================================================
CREATE TABLE IF NOT EXISTS recipes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  ingredient_id UUID NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
  quantity NUMERIC(10,2) NOT NULL DEFAULT 1,
  unit TEXT NOT NULL DEFAULT 'kg',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(product_id, ingredient_id)
);

-- ============================================================
-- 7. STOCK MOVEMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS stock_movements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ingredient_id UUID NOT NULL REFERENCES ingredients(id),
  ingredient_name TEXT NOT NULL,
  unit TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('ENTRY','EXIT_ORDER','EXIT_WASTE','ADJUSTMENT')),
  quantity NUMERIC(10,2) NOT NULL,
  previous_stock NUMERIC(10,2) NOT NULL DEFAULT 0,
  new_stock NUMERIC(10,2) NOT NULL DEFAULT 0,
  reason TEXT NOT NULL,
  reference_order_id UUID,
  reference_order_number TEXT,
  performed_by TEXT NOT NULL,
  authorized_by TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 8. CUSTOMERS
-- ============================================================
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  phone TEXT,
  whatsapp TEXT,
  email TEXT,
  address TEXT,
  notes TEXT,
  status TEXT DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','ARCHIVED')),
  total_orders INT DEFAULT 0,
  total_spent NUMERIC(10,2) DEFAULT 0,
  first_order_date TIMESTAMPTZ,
  last_order_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 9. ORDERS
-- ============================================================
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number TEXT UNIQUE NOT NULL,
  customer_name TEXT NOT NULL DEFAULT 'Cliente',
  customer_phone TEXT DEFAULT '',
  customer_address TEXT,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  order_type TEXT DEFAULT 'TAKEAWAY' CHECK (order_type IN ('DINE_IN','TAKEAWAY','DELIVERY','EVENT_CATERING')),
  table_number TEXT,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','CONFIRMED','PREPARING','READY','DELIVERED','CANCELLED')),
  subtotal NUMERIC(10,2) NOT NULL DEFAULT 0,
  delivery_fee NUMERIC(10,2) DEFAULT 0,
  discount NUMERIC(10,2) DEFAULT 0,
  total NUMERIC(10,2) NOT NULL DEFAULT 0,
  payment_status TEXT DEFAULT 'PENDING' CHECK (payment_status IN ('PENDING','PAID','PARTIALLY_PAID')),
  payment_method TEXT DEFAULT 'CASH' CHECK (payment_method IN ('CASH','MPESA','EMOLA','POS_CARD','BANK_TRANSFER')),
  payment_reference TEXT,
  notes TEXT,
  stock_deducted BOOLEAN DEFAULT false,
  cancellation_reason TEXT,
  cancelled_by TEXT,
  cancelled_at TIMESTAMPTZ,
  authorized_by TEXT,
  created_by UUID REFERENCES users(id),
  shift_id UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 10. ORDER ITEMS (stored as JSONB array on orders for simplicity)
-- We also keep a separate table for queries
-- ============================================================
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  product_name TEXT NOT NULL,
  price NUMERIC(10,2) NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  unit_cost NUMERIC(10,2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 11. PAYMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  order_number TEXT NOT NULL,
  customer_name TEXT,
  amount NUMERIC(10,2) NOT NULL,
  method TEXT NOT NULL CHECK (method IN ('CASH','MPESA','EMOLA','POS_CARD','BANK_TRANSFER')),
  reference TEXT,
  receipt_number TEXT,
  status TEXT DEFAULT 'COMPLETED' CHECK (status IN ('COMPLETED','PENDING','REFUNDED','PAID')),
  notes TEXT,
  received_by TEXT,
  shift_id UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 12. DEBTS (customer credit)
-- ============================================================
CREATE TABLE IF NOT EXISTS debts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  order_number TEXT,
  original_amount NUMERIC(10,2) NOT NULL,
  paid_amount NUMERIC(10,2) DEFAULT 0,
  remaining_amount NUMERIC(10,2) NOT NULL,
  status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING','PARTIAL','PAID','OVERDUE')),
  due_date TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 13. DEBT PAYMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS debt_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  debt_id UUID NOT NULL REFERENCES debts(id) ON DELETE CASCADE,
  amount NUMERIC(10,2) NOT NULL,
  method TEXT NOT NULL CHECK (method IN ('CASH','MPESA','EMOLA','POS_CARD','BANK_TRANSFER')),
  reference TEXT,
  received_by TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 14. CASH REGISTERS
-- ============================================================
CREATE TABLE IF NOT EXISTS cash_registers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL DEFAULT 'Caixa Principal',
  location TEXT,
  status TEXT DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','INACTIVE')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 15. CASH SHIFTS
-- ============================================================
CREATE TABLE IF NOT EXISTS cash_shifts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shift_number INT NOT NULL,
  status TEXT DEFAULT 'OPEN' CHECK (status IN ('OPEN','IN_OPERATION','CLOSED')),
  opened_by TEXT NOT NULL,
  opened_by_user_id UUID REFERENCES users(id),
  opened_by_role TEXT DEFAULT 'SELLER',
  opened_at TIMESTAMPTZ DEFAULT now(),
  initial_cash_float NUMERIC(10,2) DEFAULT 0,
  closed_by TEXT,
  closed_by_user_id UUID REFERENCES users(id),
  closed_at TIMESTAMPTZ,
  expected_cash NUMERIC(10,2) DEFAULT 0,
  counted_cash NUMERIC(10,2),
  cash_discrepancy NUMERIC(10,2),
  total_sales_amount NUMERIC(10,2) DEFAULT 0,
  orders_count INT DEFAULT 0,
  payment_breakdown JSONB DEFAULT '{"cash":0,"mpesa":0,"emola":0,"posCard":0,"bankTransfer":0}',
  notes TEXT,
  discrepancy_justification TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 16. CASH MOVEMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS cash_movements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shift_id UUID REFERENCES cash_shifts(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('SALE','ENTRY','EXIT','ADJUSTMENT','REFUND')),
  amount NUMERIC(10,2) NOT NULL,
  method TEXT CHECK (method IN ('CASH','MPESA','EMOLA','POS_CARD','BANK_TRANSFER')),
  reference TEXT,
  description TEXT,
  performed_by TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 17. AUDIT LOGS
-- ============================================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  action TEXT NOT NULL,
  entity TEXT NOT NULL,
  entity_id TEXT,
  description TEXT NOT NULL,
  "user" TEXT,
  user_id UUID,
  user_role TEXT,
  previous_value TEXT,
  new_value TEXT,
  result TEXT DEFAULT 'SUCCESS' CHECK (result IN ('SUCCESS','REJECTED_UNAUTHORIZED','FAILED')),
  timestamp TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 18. SECURITY EVENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS security_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT NOT NULL,
  severity TEXT DEFAULT 'LOW' CHECK (severity IN ('LOW','MEDIUM','HIGH','CRITICAL')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  "user" TEXT,
  user_role TEXT,
  acknowledged BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 19. NOTIFICATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT NOT NULL DEFAULT 'INFO',
  title TEXT NOT NULL,
  message TEXT,
  read BOOLEAN DEFAULT false,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 20. PRODUCT IMAGES
-- ============================================================
CREATE TABLE IF NOT EXISTS product_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  alt_text TEXT,
  display_order INT DEFAULT 0,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_ingredient ON stock_movements(ingredient_id);
CREATE INDEX IF NOT EXISTS idx_cash_shifts_status ON cash_shifts(status);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_debts_customer ON debts(customer_id);
CREATE INDEX IF NOT EXISTS idx_payments_order ON payments(order_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- ============================================================
-- ENABLE ROW LEVEL SECURITY (RLS)
-- ============================================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE debts ENABLE ROW LEVEL SECURITY;
ALTER TABLE debt_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_registers ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurant_settings ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- RLS POLICIES
-- ============================================================

-- Public read access for public-facing data
CREATE POLICY "Public can read settings" ON restaurant_settings FOR SELECT USING (true);
CREATE POLICY "Public can read categories" ON categories FOR SELECT USING (status = 'ACTIVE');
CREATE POLICY "Public can read active products" ON products FOR SELECT USING (status = 'ACTIVE');
CREATE POLICY "Public can read active ingredients" ON ingredients FOR SELECT USING (status = 'ACTIVE');
CREATE POLICY "Public can read recipes" ON recipes FOR SELECT USING (true);

-- Authenticated users can read/write their own data
CREATE POLICY "Users can read own profile" ON users FOR SELECT USING (auth.uid() = auth_user_id);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = auth_user_id);

-- Admin policies (via JWT claim or user role)
-- We use a function to check admin status
CREATE OR REPLACE FUNCTION is_admin_or_above()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users
    WHERE auth_user_id = auth.uid()
    AND role IN ('ADMIN', 'SUPER_ADMIN')
    AND status = 'ACTIVE'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION is_authenticated()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN auth.uid() IS NOT NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Admin can do everything
CREATE POLICY "Admin full access users" ON users FOR ALL USING (is_admin_or_above());
CREATE POLICY "Admin full access categories" ON categories FOR ALL USING (is_admin_or_above());
CREATE POLICY "Admin full access products" ON products FOR ALL USING (is_admin_or_above());
CREATE POLICY "Admin full access ingredients" ON ingredients FOR ALL USING (is_admin_or_above());
CREATE POLICY "Admin full access recipes" ON recipes FOR ALL USING (is_admin_or_above());
CREATE POLICY "Admin full access stock_movements" ON stock_movements FOR ALL USING (is_admin_or_above());
CREATE POLICY "Admin full access customers" ON customers FOR ALL USING (is_admin_or_above());
CREATE POLICY "Admin full access orders" ON orders FOR ALL USING (is_admin_or_above());
CREATE POLICY "Admin full access order_items" ON order_items FOR ALL USING (is_admin_or_above());
CREATE POLICY "Admin full access payments" ON payments FOR ALL USING (is_admin_or_above());
CREATE POLICY "Admin full access debts" ON debts FOR ALL USING (is_admin_or_above());
CREATE POLICY "Admin full access debt_payments" ON debt_payments FOR ALL USING (is_admin_or_above());
CREATE POLICY "Admin full access cash_registers" ON cash_registers FOR ALL USING (is_admin_or_above());
CREATE POLICY "Admin full access cash_shifts" ON cash_shifts FOR ALL USING (is_admin_or_above());
CREATE POLICY "Admin full access cash_movements" ON cash_movements FOR ALL USING (is_admin_or_above());
CREATE POLICY "Admin full access audit_logs" ON audit_logs FOR ALL USING (is_admin_or_above());
CREATE POLICY "Admin full access security_events" ON security_events FOR ALL USING (is_admin_or_above());
CREATE POLICY "Admin full access settings" ON restaurant_settings FOR ALL USING (is_admin_or_above());
CREATE POLICY "Admin full access product_images" ON product_images FOR ALL USING (is_admin_or_above());
CREATE POLICY "Admin full access notifications" ON notifications FOR ALL USING (is_admin_or_above());

-- Seller policies (limited access)
CREATE POLICY "Seller read products" ON products FOR SELECT USING (is_authenticated());
CREATE POLICY "Seller create orders" ON orders FOR INSERT WITH CHECK (is_authenticated());
CREATE POLICY "Seller read orders" ON orders FOR SELECT USING (is_authenticated());
CREATE POLICY "Seller update orders" ON orders FOR UPDATE USING (is_authenticated());
CREATE POLICY "Seller read order_items" ON order_items FOR SELECT USING (is_authenticated());
CREATE POLICY "Seller create order_items" ON order_items FOR INSERT WITH CHECK (is_authenticated());
CREATE POLICY "Seller read customers" ON customers FOR SELECT USING (is_authenticated());
CREATE POLICY "Seller create customers" ON customers FOR INSERT WITH CHECK (is_authenticated());
CREATE POLICY "Seller update customers" ON customers FOR UPDATE USING (is_authenticated());
CREATE POLICY "Seller read payments" ON payments FOR SELECT USING (is_authenticated());
CREATE POLICY "Seller create payments" ON payments FOR INSERT WITH CHECK (is_authenticated());
CREATE POLICY "Seller read ingredients" ON ingredients FOR SELECT USING (is_authenticated());
CREATE POLICY "Seller read recipes" ON recipes FOR SELECT USING (is_authenticated());
CREATE POLICY "Seller read cash_shifts" ON cash_shifts FOR SELECT USING (is_authenticated());
CREATE POLICY "Seller update cash_shifts" ON cash_shifts FOR UPDATE USING (is_authenticated());
CREATE POLICY "Seller create cash_shifts" ON cash_shifts FOR INSERT WITH CHECK (is_authenticated());
CREATE POLICY "Seller read settings" ON restaurant_settings FOR SELECT USING (true);

-- ============================================================
-- STORAGE BUCKETS
-- ============================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('products', 'products', true, 5242880, ARRAY['image/jpeg','image/png','image/webp','image/gif']),
  ('portfolio', 'portfolio', true, 10485760, ARRAY['image/jpeg','image/png','image/webp','image/gif','video/mp4']),
  ('avatars', 'avatars', false, 2097152, ARRAY['image/jpeg','image/png','image/webp'])
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Storage policies
CREATE POLICY "Public read products" ON storage.objects FOR SELECT USING (bucket_id = 'products');
CREATE POLICY "Authenticated upload products" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'products' AND is_authenticated());
CREATE POLICY "Admin delete products" ON storage.objects FOR DELETE USING (bucket_id = 'products' AND is_admin_or_above());

CREATE POLICY "Public read portfolio" ON storage.objects FOR SELECT USING (bucket_id = 'portfolio');
CREATE POLICY "Authenticated upload portfolio" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'portfolio' AND is_admin_or_above());
CREATE POLICY "Admin delete portfolio" ON storage.objects FOR DELETE USING (bucket_id = 'portfolio' AND is_admin_or_above());

CREATE POLICY "Auth read own avatars" ON storage.objects FOR SELECT USING (bucket_id = 'avatars' AND is_authenticated());
CREATE POLICY "Auth upload avatars" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND is_authenticated());