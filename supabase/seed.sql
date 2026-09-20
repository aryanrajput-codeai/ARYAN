-- ============================================================================
-- WEBRAJYA SUBSCRIPTION MANAGER - INITIAL SEED DATA
-- ============================================================================

-- 1. Insert Initial Products
INSERT INTO products (id, name, description, is_active) VALUES
('b1000000-0000-0000-0000-000000000001', 'WebRajya POS', 'Comprehensive cloud point-of-sale for retail and restaurants', true),
('b1000000-0000-0000-0000-000000000002', 'WebRajya Invoice', 'GST invoicing, billing, and accounting suite for businesses', true),
('b1000000-0000-0000-0000-000000000003', 'WebRajya Digital Menu', 'Contactless QR digital ordering & interactive menu system', true),
('b1000000-0000-0000-0000-000000000004', 'Custom Software', 'Bespoke internal web/mobile enterprise solutions', true),
('b1000000-0000-0000-0000-000000000005', 'Website', 'High-performance modern business web presence and portal', true),
('b1000000-0000-0000-0000-000000000006', 'Other', 'Maintenance, custom integration & add-on services', true)
ON CONFLICT (name) DO NOTHING;

-- 2. Insert Standard Plans
INSERT INTO plans (id, product_id, name, duration_months, price, description, is_active) VALUES
-- WebRajya POS Plans
('c1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000001', '1 Year License', 12, 5000.00, 'Single counter full POS access with cloud sync', true),
('c1000000-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000001', '2 Year License', 24, 10000.00, 'Two-year multi-device license with priority support', true),
('c1000000-0000-0000-0000-000000000003', 'b1000000-0000-0000-0000-000000000001', '3 Year Enterprise', 36, 15000.00, '3-year enterprise license with complimentary updates', true),

-- WebRajya Invoice Plans
('c1000000-0000-0000-0000-000000000004', 'b1000000-0000-0000-0000-000000000002', '1 Year Standard', 12, 6000.00, 'Unlimited e-invoicing & GST returns filing', true),
('c1000000-0000-0000-0000-000000000005', 'b1000000-0000-0000-0000-000000000002', '3 Year Pro', 36, 12000.00, 'Complete multi-user invoicing & customer ledger', true),

-- Digital Menu Plans
('c1000000-0000-0000-0000-000000000006', 'b1000000-0000-0000-0000-000000000003', '1 Year QR Menu', 12, 3500.00, 'Dynamic QR menu with instant pricing updates', true),

-- Website Plans
('c1000000-0000-0000-0000-000000000007', 'b1000000-0000-0000-0000-000000000005', 'Annual Hosting & Maintenance', 12, 8000.00, 'Domain renewal, SSL, hosting, and quarterly changes', true)
ON CONFLICT (id) DO NOTHING;

-- Base catalog (Products & Plans) ready for production usage.

