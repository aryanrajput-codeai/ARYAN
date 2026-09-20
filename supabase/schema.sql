-- ============================================================================
-- WEBRAJYA SUBSCRIPTION MANAGER - POSTGRESQL SCHEMA (SUPABASE)
-- ============================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Sequence for automated payment receipts (WR-PAY-00001)
CREATE SEQUENCE IF NOT EXISTS payment_receipt_seq START 1;

-- ============================================================================
-- 3. CLIENTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_name TEXT NOT NULL,
    owner_name TEXT,
    phone TEXT,
    whatsapp TEXT,
    email TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    pincode TEXT,
    gstin TEXT,
    status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(status);
CREATE INDEX IF NOT EXISTS idx_clients_search ON clients(business_name, owner_name, phone, email);

-- ============================================================================
-- 4. PRODUCTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 5. PLANS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    duration_months INTEGER NOT NULL CHECK (duration_months > 0),
    price NUMERIC(12,2) NOT NULL CHECK (price >= 0),
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_plans_product_id ON plans(product_id);

-- ============================================================================
-- 6. SUBSCRIPTIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id),
    plan_id UUID REFERENCES plans(id) ON DELETE SET NULL,
    amount NUMERIC(12,2) NOT NULL CHECK (amount >= 0),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'EXPIRING_SOON', 'EXPIRED', 'CANCELLED')),
    auto_renew BOOLEAN NOT NULL DEFAULT false,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_dates CHECK (end_date >= start_date)
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_client ON subscriptions(client_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_product ON subscriptions(product_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status_expiry ON subscriptions(status, end_date);

-- ============================================================================
-- 7. PAYMENTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
    amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    payment_method TEXT NOT NULL CHECK (payment_method IN ('UPI', 'CASH', 'BANK_TRANSFER', 'CARD', 'OTHER')),
    transaction_reference TEXT,
    receipt_number TEXT UNIQUE NOT NULL,
    status TEXT NOT NULL DEFAULT 'COMPLETED' CHECK (status IN ('COMPLETED', 'VOIDED')),
    voided_at TIMESTAMPTZ,
    void_reason TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_client ON payments(client_id);
CREATE INDEX IF NOT EXISTS idx_payments_subscription ON payments(subscription_id);
CREATE INDEX IF NOT EXISTS idx_payments_date ON payments(payment_date);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);

-- Automated receipt number generator function
CREATE OR REPLACE FUNCTION generate_receipt_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.receipt_number IS NULL OR NEW.receipt_number = '' THEN
        NEW.receipt_number := 'WR-PAY-' || LPAD(nextval('payment_receipt_seq')::TEXT, 5, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_set_receipt_number ON payments;
CREATE TRIGGER trg_set_receipt_number
BEFORE INSERT ON payments
FOR EACH ROW
EXECUTE FUNCTION generate_receipt_number();

-- ============================================================================
-- 8. REMINDERS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS reminders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES subscriptions(id) ON DELETE CASCADE,
    reminder_type TEXT NOT NULL CHECK (reminder_type IN ('90_DAYS', '60_DAYS', '30_DAYS', '15_DAYS', '7_DAYS', '3_DAYS', '1_DAY', 'EXPIRY_DAY')),
    reminder_date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'READY', 'OPENED', 'SENT', 'FAILED', 'DISMISSED')),
    message TEXT,
    sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_reminder UNIQUE (subscription_id, reminder_type)
);

CREATE INDEX IF NOT EXISTS idx_reminders_date_status ON reminders(reminder_date, status);

-- ============================================================================
-- 9. CLIENT NOTES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS client_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    note TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_client_notes_client ON client_notes(client_id);

-- ============================================================================
-- 10. SUBSCRIPTION EVENTS TABLE (Timeline audit)
-- ============================================================================
CREATE TABLE IF NOT EXISTS subscription_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subscription_id UUID REFERENCES subscriptions(id) ON DELETE CASCADE,
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL CHECK (event_type IN (
        'CLIENT_CREATED',
        'CLIENT_UPDATED',
        'SUBSCRIPTION_CREATED',
        'PAYMENT_RECEIVED',
        'PAYMENT_VOIDED',
        'REMINDER_CREATED',
        'REMINDER_OPENED',
        'REMINDER_SENT',
        'SUBSCRIPTION_RENEWED',
        'SUBSCRIPTION_EXPIRED',
        'PLAN_CHANGED',
        'STATUS_CHANGED'
    )),
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_events_client ON subscription_events(client_id);
CREATE INDEX IF NOT EXISTS idx_events_subscription ON subscription_events(subscription_id);

-- ============================================================================
-- 11. USER PROFILES & ROLES
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'STAFF' CHECK (role IN ('ADMIN', 'STAFF')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 12. BUSINESS SETTINGS
-- ============================================================================
CREATE TABLE IF NOT EXISTS business_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_name TEXT NOT NULL DEFAULT 'WebRajya Solutions',
    email TEXT NOT NULL DEFAULT 'contact@webrajya.com',
    phone TEXT NOT NULL DEFAULT '+91 98765 43210',
    address TEXT NOT NULL DEFAULT 'Pune, Maharashtra, India',
    gstin TEXT DEFAULT '27AAAAA0000A1Z5',
    logo_url TEXT,
    currency_symbol TEXT DEFAULT '₹',
    enabled_reminder_intervals TEXT[] DEFAULT ARRAY['90_DAYS', '60_DAYS', '30_DAYS', '15_DAYS', '7_DAYS', '3_DAYS', '1_DAY', 'EXPIRY_DAY'],
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 14. USER DEVICES (EXPO PUSH NOTIFICATIONS)
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_devices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    expo_push_token TEXT NOT NULL UNIQUE,
    platform TEXT NOT NULL CHECK (platform IN ('ios', 'android', 'web')),
    device_name TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_devices_token ON user_devices(expo_push_token);
CREATE INDEX IF NOT EXISTS idx_user_devices_user ON user_devices(user_id);

-- Helper function to check if current user is an authenticated ADMIN (or default owner)
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    -- If no user profile exists yet or role is ADMIN / OWNER, grant admin permissions
    IF auth.uid() IS NULL THEN
        RETURN true;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid()) THEN
        RETURN true;
    END IF;

    RETURN EXISTS (
        SELECT 1 FROM user_profiles
        WHERE id = auth.uid() AND (role = 'ADMIN' OR role = 'OWNER')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

ALTER TABLE user_devices ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Auth users can view devices" ON user_devices;
DROP POLICY IF EXISTS "Auth users can register devices" ON user_devices;
DROP POLICY IF EXISTS "Auth users can update own devices" ON user_devices;
DROP POLICY IF EXISTS "Admins can manage devices" ON user_devices;

CREATE POLICY "Auth users can view devices" ON user_devices FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users can register devices" ON user_devices FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth users can update own devices" ON user_devices FOR UPDATE TO authenticated USING (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "Admins can manage devices" ON user_devices FOR ALL TO authenticated USING (is_admin());

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_settings ENABLE ROW LEVEL SECURITY;

-- Clients: All authenticated users can read/insert/update. Only ADMIN can delete.
DROP POLICY IF EXISTS "Auth users can view clients" ON clients;
DROP POLICY IF EXISTS "Auth users can insert clients" ON clients;
DROP POLICY IF EXISTS "Auth users can update clients" ON clients;
DROP POLICY IF EXISTS "Only admins can delete clients" ON clients;

CREATE POLICY "Auth users can view clients" ON clients FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users can insert clients" ON clients FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth users can update clients" ON clients FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Only admins can delete clients" ON clients FOR DELETE TO authenticated USING (is_admin());

-- Products & Plans: All auth users can view. Admins can insert/update/delete.
DROP POLICY IF EXISTS "Auth users can view products" ON products;
DROP POLICY IF EXISTS "Admins can manage products" ON products;
DROP POLICY IF EXISTS "Auth users can view plans" ON plans;
DROP POLICY IF EXISTS "Admins can manage plans" ON plans;

CREATE POLICY "Auth users can view products" ON products FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage products" ON products FOR ALL TO authenticated USING (is_admin());

CREATE POLICY "Auth users can view plans" ON plans FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage plans" ON plans FOR ALL TO authenticated USING (is_admin());

-- Subscriptions: Auth users can view, insert, update. Admins can delete.
DROP POLICY IF EXISTS "Auth users can view subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Auth users can create subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Auth users can update subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Only admins can delete subscriptions" ON subscriptions;

CREATE POLICY "Auth users can view subscriptions" ON subscriptions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users can create subscriptions" ON subscriptions FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth users can update subscriptions" ON subscriptions FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Only admins can delete subscriptions" ON subscriptions FOR DELETE TO authenticated USING (is_admin());

-- Payments: Auth users can view and insert payments. Financial auditability prevents casual deletion.
DROP POLICY IF EXISTS "Auth users can view payments" ON payments;
DROP POLICY IF EXISTS "Auth users can insert payments" ON payments;
DROP POLICY IF EXISTS "Only admins can update payments" ON payments;
DROP POLICY IF EXISTS "Only admins can delete payments" ON payments;

CREATE POLICY "Auth users can view payments" ON payments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users can insert payments" ON payments FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Only admins can update payments" ON payments FOR UPDATE TO authenticated USING (is_admin());
CREATE POLICY "Only admins can delete payments" ON payments FOR DELETE TO authenticated USING (is_admin());

-- Reminders, Notes, Events:
DROP POLICY IF EXISTS "Auth users can view reminders" ON reminders;
DROP POLICY IF EXISTS "Auth users can manage reminders" ON reminders;
DROP POLICY IF EXISTS "Auth users can view notes" ON client_notes;
DROP POLICY IF EXISTS "Auth users can insert notes" ON client_notes;
DROP POLICY IF EXISTS "Auth users can update own notes" ON client_notes;
DROP POLICY IF EXISTS "Auth users can view events" ON subscription_events;
DROP POLICY IF EXISTS "Auth users can insert events" ON subscription_events;

CREATE POLICY "Auth users can view reminders" ON reminders FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users can manage reminders" ON reminders FOR ALL TO authenticated USING (true);

CREATE POLICY "Auth users can view notes" ON client_notes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users can insert notes" ON client_notes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth users can update own notes" ON client_notes FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Auth users can view events" ON subscription_events FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users can insert events" ON subscription_events FOR INSERT TO authenticated WITH CHECK (true);

-- User profiles:
DROP POLICY IF EXISTS "Auth users can view profiles" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Admins can manage profiles" ON user_profiles;

CREATE POLICY "Auth users can view profiles" ON user_profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own profile" ON user_profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Admins can manage profiles" ON user_profiles FOR ALL TO authenticated USING (is_admin());

-- Settings:
DROP POLICY IF EXISTS "Auth users can view settings" ON business_settings;
DROP POLICY IF EXISTS "Admins can update settings" ON business_settings;

CREATE POLICY "Auth users can view settings" ON business_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can update settings" ON business_settings FOR UPDATE TO authenticated USING (is_admin());
