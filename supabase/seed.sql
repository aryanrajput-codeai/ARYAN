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

-- 3. Insert Demo Clients
INSERT INTO clients (id, business_name, owner_name, phone, whatsapp, email, address, city, state, pincode, gstin, status, notes) VALUES
('d1000000-0000-0000-0000-000000000001', 'THE XINGS KITCHEN', 'Rahul Sharma', '+91 98220 11223', '+91 98220 11223', 'rahul@xingskitchen.in', 'Shop 14, High Street, Baner', 'Pune', 'Maharashtra', '411045', '27AABCU9603R1ZM', 'ACTIVE', 'Multi-cuisine restaurant using WebRajya POS on 2 terminals.'),
('d1000000-0000-0000-0000-000000000002', 'Brew & Bites Cafe', 'Priya Deshmukh', '+91 94230 55667', '+91 94230 55667', 'priya@brewandbites.com', 'Lane 6, Koregaon Park', 'Pune', 'Maharashtra', '411001', '27BAPPD1234F1Z8', 'ACTIVE', 'Specialty coffee bar with POS + QR Menu.'),
('d1000000-0000-0000-0000-000000000003', 'Apex Industrial Supplies', 'Vikramaditya Patil', '+91 99700 88990', '+91 99700 88990', 'v.patil@apexindustrial.co', 'Plot 42, MIDC Bhosari', 'Pimpri-Chinchwad', 'Maharashtra', '411026', '27AACCA5678B1ZQ', 'ACTIVE', 'Wholesale manufacturing using WebRajya Invoice.'),
('d1000000-0000-0000-0000-000000000004', 'Golden Harvest Supermart', 'Anand Kulkarni', '+91 98900 44332', '+91 98900 44332', 'anand@goldenharvest.in', 'Station Road, Kothrud', 'Pune', 'Maharashtra', '411038', '27ABCFG7890C1ZW', 'ACTIVE', 'Grocery retail store. 1 Year POS plan nearing expiry.'),
('d1000000-0000-0000-0000-000000000005', 'Royal Bakehouse & Cafe', 'Farhan Merchant', '+91 97650 33221', '+91 97650 33221', 'farhan@royalbakehouse.com', 'MG Road, Camp', 'Pune', 'Maharashtra', '411001', NULL, 'INACTIVE', 'Subscription expired 2 months ago; branch renovation in progress.')
ON CONFLICT (id) DO NOTHING;

-- 4. Insert Subscriptions
INSERT INTO subscriptions (id, client_id, product_id, plan_id, amount, start_date, end_date, status, auto_renew, notes) VALUES
-- The Xings Kitchen (Expiring in 29 days from 19 Sep 2026: 18 Oct 2026)
('e1000000-0000-0000-0000-000000000001', 'd1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000003', 15000.00, '2023-10-19', '2026-10-18', 'EXPIRING_SOON', false, '3 Year Plan expiring soon; contacted Rahul regarding renewal.'),

-- Brew & Bites Cafe (Active)
('e1000000-0000-0000-0000-000000000002', 'd1000000-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000002', 10000.00, '2026-01-15', '2028-01-14', 'ACTIVE', false, '2 Year POS plan in good standing.'),
('e1000000-0000-0000-0000-000000000003', 'd1000000-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000003', 'c1000000-0000-0000-0000-000000000006', 3500.00, '2026-03-01', '2027-02-28', 'ACTIVE', true, 'Digital menu QR setup for 25 tables.'),

-- Apex Industrial Supplies (Active)
('e1000000-0000-0000-0000-000000000004', 'd1000000-0000-0000-0000-000000000003', 'b1000000-0000-0000-0000-000000000002', 'c1000000-0000-0000-0000-000000000005', 12000.00, '2026-06-01', '2029-05-31', 'ACTIVE', false, '3 Year Pro Invoicing.'),

-- Golden Harvest Supermart (Expiring in 6 days: 2026-09-25)
('e1000000-0000-0000-0000-000000000005', 'd1000000-0000-0000-0000-000000000004', 'b1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000001', 5000.00, '2025-09-26', '2026-09-25', 'EXPIRING_SOON', false, 'Renewal proposal shared via WhatsApp.'),

-- Royal Bakehouse (Expired)
('e1000000-0000-0000-0000-000000000006', 'd1000000-0000-0000-0000-000000000005', 'b1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000001', 5000.00, '2025-06-15', '2026-06-14', 'EXPIRED', false, 'Payment pending, client promised renewal next month.')
ON CONFLICT (id) DO NOTHING;

-- 5. Insert Payments
INSERT INTO payments (id, client_id, subscription_id, amount, payment_date, payment_method, transaction_reference, receipt_number, notes) VALUES
('f1000000-0000-0000-0000-000000000001', 'd1000000-0000-0000-0000-000000000001', 'e1000000-0000-0000-0000-000000000001', 15000.00, '2023-10-19', 'UPI', 'UPI/329201948201/XINGS', 'WR-PAY-00001', 'Initial 3-Year subscription payment in full.'),
('f1000000-0000-0000-0000-000000000002', 'd1000000-0000-0000-0000-000000000002', 'e1000000-0000-0000-0000-000000000002', 10000.00, '2026-01-15', 'BANK_TRANSFER', 'NEFT/HDFC0029104/BREW', 'WR-PAY-00002', '2-Year POS license payment received.'),
('f1000000-0000-0000-0000-000000000003', 'd1000000-0000-0000-0000-000000000002', 'e1000000-0000-0000-0000-000000000003', 3500.00, '2026-03-01', 'UPI', 'UPI/606110294812/PRIYA', 'WR-PAY-00003', 'Annual digital menu subscription.'),
('f1000000-0000-0000-0000-000000000004', 'd1000000-0000-0000-0000-000000000003', 'e1000000-0000-0000-0000-000000000004', 12000.00, '2026-06-01', 'BANK_TRANSFER', 'RTGS/ICIC9920194/APEX', 'WR-PAY-00004', '3-Year Invoicing license payment.'),
('f1000000-0000-0000-0000-000000000005', 'd1000000-0000-0000-0000-000000000004', 'e1000000-0000-0000-0000-000000000005', 3000.00, '2025-09-26', 'UPI', 'UPI/526910283741/ANAND', 'WR-PAY-00005', 'Partial payment of ₹3,000 received. Balance ₹2,000.')
ON CONFLICT (id) DO NOTHING;

-- 6. Insert Subscription Events (Timeline)
INSERT INTO subscription_events (subscription_id, client_id, event_type, description, created_at) VALUES
('e1000000-0000-0000-0000-000000000001', 'd1000000-0000-0000-0000-000000000001', 'SUBSCRIPTION_CREATED', 'WebRajya POS 3-Year Enterprise subscription created (₹15,000)', '2023-10-19 10:00:00+00'),
('e1000000-0000-0000-0000-000000000001', 'd1000000-0000-0000-0000-000000000001', 'PAYMENT_RECEIVED', 'Received payment ₹15,000 via UPI (WR-PAY-00001)', '2023-10-19 10:15:00+00'),
('e1000000-0000-0000-0000-000000000001', 'd1000000-0000-0000-0000-000000000001', 'REMINDER_SENT', '30-Day Renewal Reminder sent to Rahul Sharma', '2026-09-18 09:30:00+00'),
('e1000000-0000-0000-0000-000000000002', 'd1000000-0000-0000-0000-000000000002', 'SUBSCRIPTION_CREATED', 'WebRajya POS 2-Year subscription created (₹10,000)', '2026-01-15 11:30:00+00'),
('e1000000-0000-0000-0000-000000000002', 'd1000000-0000-0000-0000-000000000002', 'PAYMENT_RECEIVED', 'Received payment ₹10,000 via Bank Transfer (WR-PAY-00002)', '2026-01-15 12:00:00+00');

-- 7. Insert Client Notes
INSERT INTO client_notes (client_id, note, created_at) VALUES
('d1000000-0000-0000-0000-000000000001', 'Client requested kitchen printer integration upgrade alongside upcoming renewal.', '2026-09-15 14:20:00+00'),
('d1000000-0000-0000-0000-000000000004', 'Followed up for balance payment of ₹2,000; Anand agreed to clear during renewal.', '2026-09-10 11:00:00+00');

-- 8. Insert Reminders
INSERT INTO reminders (client_id, subscription_id, reminder_type, reminder_date, status, message) VALUES
('d1000000-0000-0000-0000-000000000001', 'e1000000-0000-0000-0000-000000000001', '30_DAYS', '2026-09-18', 'SENT', 'Renewal reminder: WebRajya POS expires on 18 Oct 2026'),
('d1000000-0000-0000-0000-000000000001', 'e1000000-0000-0000-0000-000000000001', '15_DAYS', '2026-10-03', 'PENDING', 'Renewal reminder: WebRajya POS expires on 18 Oct 2026'),
('d1000000-0000-0000-0000-000000000001', 'e1000000-0000-0000-0000-000000000001', '7_DAYS', '2026-10-11', 'PENDING', 'Critical reminder: 7 days left for WebRajya POS license'),
('d1000000-0000-0000-0000-000000000005', 'e1000000-0000-0000-0000-000000000005', '7_DAYS', '2026-09-18', 'SENT', 'Urgent renewal: Golden Harvest POS expires on 25 Sep 2026');
