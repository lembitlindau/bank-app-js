-- ========================================================
-- NÄIDISANDMETE SISESTAMINE (INSERT)
-- Internetipanga Andmebaas
-- ========================================================

USE bank_app;

-- ========================================================
-- 1. KASUTAJAROLLIDE SISESTAMINE
-- ========================================================
INSERT INTO user_roles (role_name, description, permissions) VALUES
('admin', 'Süsteemi administraator', JSON_OBJECT(
    'users', JSON_ARRAY('create', 'read', 'update', 'delete'),
    'accounts', JSON_ARRAY('create', 'read', 'update', 'delete'),
    'transactions', JSON_ARRAY('create', 'read', 'update', 'delete'),
    'system', JSON_ARRAY('backup', 'restore', 'audit')
)),
('manager', 'Pangajuht', JSON_OBJECT(
    'users', JSON_ARRAY('read', 'update'),
    'accounts', JSON_ARRAY('read', 'update'),
    'transactions', JSON_ARRAY('read', 'update'),
    'reports', JSON_ARRAY('read')
)),
('user', 'Tavaline kasutaja', JSON_OBJECT(
    'accounts', JSON_ARRAY('read'),
    'transactions', JSON_ARRAY('create', 'read'),
    'profile', JSON_ARRAY('read', 'update')
)),
('auditor', 'Auditor', JSON_OBJECT(
    'accounts', JSON_ARRAY('read'),
    'transactions', JSON_ARRAY('read'),
    'audit_logs', JSON_ARRAY('read')
));

-- ========================================================
-- 2. KASUTAJATE SISESTAMINE
-- ========================================================
INSERT INTO users (username, password_hash, first_name, last_name, email, is_active) VALUES
('admin', '$2a$10$8K1p/a0dPxKU2M5pGY.1/.K9WxgY5KLQV8SHrCQ1V5cM2YZH0FkF2', 'Admin', 'Kasutaja', 'admin@bank.ee', TRUE),
('mari.kask', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Mari', 'Kask', 'mari.kask@email.ee', TRUE),
('jaan.tamm', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Jaan', 'Tamm', 'jaan.tamm@email.ee', TRUE),
('anna.sepp', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Anna', 'Sepp', 'anna.sepp@email.ee', TRUE),
('peter.mets', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Peter', 'Mets', 'peter.mets@email.ee', TRUE);

-- ========================================================
-- 3. KASUTAJA-ROLLIDE MÄÄRAMINE
-- ========================================================
INSERT INTO user_role_assignments (user_id, role_id, assigned_by) VALUES
(1, 1, 1), -- admin -> admin
(2, 3, 1), -- mari.kask -> user
(3, 3, 1), -- jaan.tamm -> user
(4, 2, 1), -- anna.sepp -> manager
(5, 4, 1); -- peter.mets -> auditor

-- ========================================================
-- 4. KONTODE SISESTAMINE
-- ========================================================
INSERT INTO accounts (account_number, user_id, account_name, balance, currency) VALUES
('ABC1234567890', 2, 'Mari põhikonto', 1500.50, 'EUR'),
('ABC1234567891', 2, 'Mari säästukonto', 5000.00, 'EUR'),
('ABC1234567892', 3, 'Jaan igapäevane', 2300.75, 'EUR'),
('ABC1234567893', 3, 'Jaan USD konto', 1200.00, 'USD'),
('ABC1234567894', 4, 'Anna ärikonto', 15000.25, 'EUR'),
('ABC1234567895', 5, 'Peter pensionikonto', 8750.00, 'EUR');

-- ========================================================
-- 5. TEHINGUTE SISESTAMINE
-- ========================================================
INSERT INTO transactions (
    transaction_id, from_account, to_account, amount, currency, 
    explanation, sender_name, receiver_name, status, transaction_type, 
    initiated_by, completed_at
) VALUES
('TRX20250825001', 'ABC1234567890', 'ABC1234567892', 100.00, 'EUR', 
 'Raha tagastamine', 'Mari Kask', 'Jaan Tamm', 'completed', 'internal', 
 2, NOW()),
 
('TRX20250825002', 'ABC1234567892', 'ABC1234567891', 250.50, 'EUR', 
 'Säästude täiendamine', 'Jaan Tamm', 'Mari Kask', 'completed', 'internal', 
 3, NOW()),
 
('TRX20250825003', 'ABC1234567894', 'ABC1234567890', 500.00, 'EUR', 
 'Palgamakse', 'Anna Sepp', 'Mari Kask', 'completed', 'internal', 
 4, NOW()),
 
('TRX20250825004', 'ABC1234567890', 'XYZ9876543210', 75.25, 'EUR', 
 'Ostumakse välispanka', 'Mari Kask', 'Välispartner', 'pending', 'external', 
 2, NULL),
 
('TRX20250825005', 'DEF1111111111', 'ABC1234567892', 200.00, 'EUR', 
 'Ülekanne välispangast', 'Välisosapool', 'Jaan Tamm', 'completed', 'incoming', 
 NULL, NOW());

-- ========================================================
-- 6. PANGAVAHELISTE JWT LOGIDE SISESTAMINE
-- ========================================================
INSERT INTO interbank_jwt_log (
    jwt_id, sender_bank, receiver_bank, transaction_id, 
    jwt_payload, signature_valid
) VALUES
('jwt_20250825_001', 'ABC', 'XYZ', 'TRX20250825004', 
 JSON_OBJECT(
     'iss', 'ABC',
     'aud', 'XYZ', 
     'amount', 75.25,
     'currency', 'EUR',
     'accountFrom', 'ABC1234567890',
     'accountTo', 'XYZ9876543210'
 ), TRUE),
 
('jwt_20250825_002', 'DEF', 'ABC', 'TRX20250825005',
 JSON_OBJECT(
     'iss', 'DEF',
     'aud', 'ABC',
     'amount', 200.00, 
     'currency', 'EUR',
     'accountFrom', 'DEF1111111111',
     'accountTo', 'ABC1234567892'
 ), TRUE);

-- ========================================================
-- 7. AUDIT LOGIDE SISESTAMINE
-- ========================================================
INSERT INTO audit_logs (
    user_id, action, table_name, record_id, 
    new_values, ip_address, user_agent
) VALUES
(2, 'CREATE', 'transactions', 'TRX20250825001', 
 JSON_OBJECT('amount', 100.00, 'status', 'pending'), 
 '192.168.1.100', 'Mozilla/5.0 Bank App'),
 
(3, 'CREATE', 'transactions', 'TRX20250825002',
 JSON_OBJECT('amount', 250.50, 'status', 'pending'),
 '192.168.1.101', 'Mozilla/5.0 Bank App'),
 
(4, 'CREATE', 'transactions', 'TRX20250825003',
 JSON_OBJECT('amount', 500.00, 'status', 'pending'),
 '192.168.1.102', 'Mozilla/5.0 Bank App');

-- ========================================================
-- ANDMETE KONTROLL - KUVAME SISESTATUD ANDMED
-- ========================================================

SELECT 'KASUTAJAD:' as Info;
SELECT id, username, first_name, last_name, email, is_active FROM users;

SELECT 'KONTOD:' as Info;
SELECT id, account_number, user_id, account_name, balance, currency FROM accounts;

SELECT 'TEHINGUD:' as Info;
SELECT id, transaction_id, from_account, to_account, amount, status, transaction_type FROM transactions;

SELECT 'ROLLID:' as Info;
SELECT id, role_name, description FROM user_roles;
