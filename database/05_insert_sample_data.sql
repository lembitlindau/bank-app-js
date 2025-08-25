-- ========================================================
-- NÄIDISANDMETE LISAMINE
-- Testimiseks ja demonstreerimiseks
-- ========================================================

USE bank_app;

-- ========================================================
-- SÜSTEEMI KONFIGURATSIOON
-- ========================================================

INSERT INTO system_config (config_key, config_value, description) VALUES
('bank_name', 'TLU Test Bank', 'Panga ametlik nimi'),
('bank_prefix', 'TLU', 'Panga prefiksi kood'),
('default_currency', 'EUR', 'Vaikimisi valuuta'),
('min_transfer_amount', '0.01', 'Minimaalne ülekande summa'),
('max_transfer_amount', '50000.00', 'Maksimaalne ülekande summa päevas'),
('session_timeout_hours', '24', 'Sessiooni kehtivusaeg tundides'),
('interbank_timeout_seconds', '30', 'Pangavahelise tehingu timeout sekundites'),
('central_bank_url', 'https://keskpank.herokuapp.com', 'Keskpanga API URL'),
('jwt_expiry_hours', '1', 'JWT tokeni kehtivusaeg tundides');

-- ========================================================
-- NÄIDIS KASUTAJAD
-- ========================================================

-- Kasutaja 1: Administrator
INSERT INTO users (username, password_hash, first_name, last_name, email, is_active) VALUES
('admin', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Admin', 'Administraator', 'admin@tlubank.ee', TRUE);

-- Kasutaja 2: Mari Maasikas
INSERT INTO users (username, password_hash, first_name, last_name, email, is_active) VALUES
('mari.maasikas', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Mari', 'Maasikas', 'mari.maasikas@email.ee', TRUE);

-- Kasutaja 3: Jaan Tamm
INSERT INTO users (username, password_hash, first_name, last_name, email, is_active) VALUES
('jaan.tamm', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Jaan', 'Tamm', 'jaan.tamm@email.ee', TRUE);

-- Kasutaja 4: Liisa Lepik
INSERT INTO users (username, password_hash, first_name, last_name, email, is_active) VALUES
('liisa.lepik', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Liisa', 'Lepik', 'liisa.lepik@email.ee', TRUE);

-- Kasutaja 5: Peeter Saar
INSERT INTO users (username, password_hash, first_name, last_name, email, is_active) VALUES
('peeter.saar', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Peeter', 'Saar', 'peeter.saar@email.ee', TRUE);

-- ========================================================
-- NÄIDIS KONTOD
-- ========================================================

-- Mari Maasikas kontod
INSERT INTO accounts (account_number, owner_id, account_name, balance, currency) VALUES
('TLU' + REPLACE(UUID(), '-', ''), 2, 'Mari põhikonto', 1500.00, 'EUR'),
('TLU' + REPLACE(UUID(), '-', ''), 2, 'Mari säästukonto', 5000.00, 'EUR'),
('TLU' + REPLACE(UUID(), '-', ''), 2, 'Mari USD konto', 800.00, 'USD');

-- Jaan Tamm kontod
INSERT INTO accounts (account_number, owner_id, account_name, balance, currency) VALUES
('TLU' + REPLACE(UUID(), '-', ''), 3, 'Jaan põhikonto', 2300.50, 'EUR'),
('TLU' + REPLACE(UUID(), '-', ''), 3, 'Jaan ärikonto', 15000.00, 'EUR');

-- Liisa Lepik kontod
INSERT INTO accounts (account_number, owner_id, account_name, balance, currency) VALUES
('TLU' + REPLACE(UUID(), '-', ''), 4, 'Liisa põhikonto', 750.25, 'EUR'),
('TLU' + REPLACE(UUID(), '-', ''), 4, 'Liisa GBP konto', 1200.00, 'GBP');

-- Peeter Saar kontod
INSERT INTO accounts (account_number, owner_id, account_name, balance, currency) VALUES
('TLU' + REPLACE(UUID(), '-', ''), 5, 'Peeter põhikonto', 3200.00, 'EUR'),
('TLU' + REPLACE(UUID(), '-', ''), 5, 'Peeter investeeringute konto', 25000.00, 'EUR');

-- ========================================================
-- TEISTE PANKADE REGISTREERIMINE
-- ========================================================

INSERT INTO banks (bank_name, bank_prefix, base_url, jwks_url, is_active) VALUES
('Swedbank', 'SWE', 'https://swedbank-api.example.com', 'https://swedbank-api.example.com/.well-known/jwks.json', TRUE),
('SEB Pank', 'SEB', 'https://seb-api.example.com', 'https://seb-api.example.com/.well-known/jwks.json', TRUE),
('LHV Pank', 'LHV', 'https://lhv-api.example.com', 'https://lhv-api.example.com/.well-known/jwks.json', TRUE),
('Luminor', 'LUM', 'https://luminor-api.example.com', 'https://luminor-api.example.com/.well-known/jwks.json', TRUE),
('Coop Pank', 'COP', 'https://coop-api.example.com', 'https://coop-api.example.com/.well-known/jwks.json', TRUE);

-- ========================================================
-- NÄIDIS TEHINGUD
-- ========================================================

-- Sisemised tehingud (sama panga kontode vahel)
INSERT INTO transactions (
    transaction_id, from_account_number, to_account_number, 
    amount, currency, explanation, sender_name, receiver_name,
    status, transaction_type, initiated_by, completed_at
) 
SELECT 
    CONCAT('TRX', UNIX_TIMESTAMP(NOW()), FLOOR(RAND() * 1000)),
    (SELECT account_number FROM accounts WHERE owner_id = 2 LIMIT 1),
    (SELECT account_number FROM accounts WHERE owner_id = 3 LIMIT 1),
    250.00, 'EUR', 'Raamatu eest', 'Mari Maasikas', 'Jaan Tamm',
    'completed', 'internal', 2, NOW() - INTERVAL 5 DAY;

INSERT INTO transactions (
    transaction_id, from_account_number, to_account_number, 
    amount, currency, explanation, sender_name, receiver_name,
    status, transaction_type, initiated_by, completed_at
) 
SELECT 
    CONCAT('TRX', UNIX_TIMESTAMP(NOW()), FLOOR(RAND() * 1000)),
    (SELECT account_number FROM accounts WHERE owner_id = 3 LIMIT 1),
    (SELECT account_number FROM accounts WHERE owner_id = 4 LIMIT 1),
    75.50, 'EUR', 'Kinno eest', 'Jaan Tamm', 'Liisa Lepik',
    'completed', 'internal', 3, NOW() - INTERVAL 3 DAY;

-- Välised tehingud (teistesse pankadesse)
INSERT INTO transactions (
    transaction_id, from_account_number, to_account_number, 
    amount, currency, explanation, sender_name, receiver_name,
    status, transaction_type, is_interbank, sender_bank_prefix, 
    receiver_bank_prefix, initiated_by, completed_at
) 
SELECT 
    CONCAT('TRX', UNIX_TIMESTAMP(NOW()), FLOOR(RAND() * 1000)),
    (SELECT account_number FROM accounts WHERE owner_id = 5 LIMIT 1),
    'SWE123456789012345',
    500.00, 'EUR', 'Üür eest', 'Peeter Saar', 'Anna Kask',
    'completed', 'external', TRUE, 'TLU', 'SWE', 5, NOW() - INTERVAL 2 DAY;

-- Sissetulevad tehingud (teistest pankadest)
INSERT INTO transactions (
    transaction_id, from_account_number, to_account_number, 
    amount, currency, explanation, sender_name, receiver_name,
    status, transaction_type, is_interbank, sender_bank_prefix, 
    receiver_bank_prefix, received_at, completed_at
) 
SELECT 
    CONCAT('TRX', UNIX_TIMESTAMP(NOW()), FLOOR(RAND() * 1000)),
    'LHV987654321098765',
    (SELECT account_number FROM accounts WHERE owner_id = 2 LIMIT 1),
    1200.00, 'EUR', 'Palga ülekanne', 'OÜ Näidis', 'Mari Maasikas',
    'completed', 'incoming', TRUE, 'LHV', 'TLU', NOW() - INTERVAL 1 DAY, NOW() - INTERVAL 1 DAY;

-- Ootel tehingud
INSERT INTO transactions (
    transaction_id, from_account_number, to_account_number, 
    amount, currency, explanation, sender_name, receiver_name,
    status, transaction_type, initiated_by
) 
SELECT 
    CONCAT('TRX', UNIX_TIMESTAMP(NOW()), FLOOR(RAND() * 1000)),
    (SELECT account_number FROM accounts WHERE owner_id = 4 LIMIT 1),
    (SELECT account_number FROM accounts WHERE owner_id = 5 LIMIT 1),
    150.00, 'EUR', 'Sünnipäeva kingitus', 'Liisa Lepik', 'Peeter Saar',
    'pending', 'internal', 4;
