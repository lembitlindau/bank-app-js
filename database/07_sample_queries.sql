-- ========================================================
-- NÄIDISPÄRINGUD JA TESTID
-- Andmebaasi funktsionaalsuse demonstreerimine
-- ========================================================

USE bank_app;

-- ========================================================
-- SELECT PÄRINGUD
-- ========================================================

-- 1. Kõik kasutajad koos kontode arvuga
SELECT 
    u.id,
    u.username,
    u.first_name,
    u.last_name,
    u.email,
    COUNT(a.id) AS kontode_arv,
    u.created_at
FROM users u
LEFT JOIN accounts a ON u.id = a.owner_id
WHERE u.is_active = TRUE
GROUP BY u.id
ORDER BY u.last_name, u.first_name;

-- 2. Kontod koos omanike andmetega
SELECT 
    a.account_number,
    a.account_name,
    CONCAT(u.first_name, ' ', u.last_name) AS omanik,
    a.balance,
    a.currency,
    a.is_active,
    a.created_at
FROM accounts a
JOIN users u ON a.owner_id = u.id
ORDER BY a.balance DESC;

-- 3. Tehingute kokkuvõte kasutajate kaupa
SELECT 
    u.username,
    CONCAT(u.first_name, ' ', u.last_name) AS nimi,
    COUNT(t.id) AS tehingute_arv,
    SUM(CASE WHEN t.status = 'completed' THEN t.amount ELSE 0 END) AS kogusumma,
    AVG(CASE WHEN t.status = 'completed' THEN t.amount ELSE NULL END) AS keskmine_summa
FROM users u
LEFT JOIN transactions t ON u.id = t.initiated_by
GROUP BY u.id
HAVING tehingute_arv > 0
ORDER BY kogusumma DESC;

-- 4. Viimased 10 tehingut
SELECT 
    t.transaction_id,
    t.from_account_number,
    t.to_account_number,
    t.amount,
    t.currency,
    t.explanation,
    t.status,
    t.transaction_type,
    t.created_at
FROM transactions t
ORDER BY t.created_at DESC
LIMIT 10;

-- 5. Pangavahelised tehingud
SELECT 
    t.transaction_id,
    t.sender_bank_prefix AS saatja_pank,
    t.receiver_bank_prefix AS saaja_pank,
    t.amount,
    t.currency,
    t.status,
    t.created_at
FROM transactions t
WHERE t.is_interbank = TRUE
ORDER BY t.created_at DESC;

-- ========================================================
-- INSERT NÄITED
-- ========================================================

-- Uue kasutaja lisamine
INSERT INTO users (username, password_hash, first_name, last_name, email) 
VALUES 
('test.kasutaja', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 
 'Test', 'Kasutaja', 'test@example.com');

-- Uue konto lisamine
INSERT INTO accounts (account_number, owner_id, account_name, balance, currency)
VALUES 
(GenerateAccountNumber('TLU'), LAST_INSERT_ID(), 'Test põhikonto', 1000.00, 'EUR');

-- Uue tehingu lisamine
INSERT INTO transactions (
    transaction_id, from_account_number, to_account_number,
    amount, currency, explanation, sender_name, receiver_name,
    status, transaction_type, initiated_by
)
VALUES (
    GenerateTransactionId(),
    (SELECT account_number FROM accounts WHERE owner_id = 2 LIMIT 1),
    (SELECT account_number FROM accounts WHERE owner_id = 3 LIMIT 1),
    100.00, 'EUR', 'Test ülekanne', 'Mari Maasikas', 'Jaan Tamm',
    'pending', 'internal', 2
);

-- ========================================================
-- UPDATE NÄITED
-- ========================================================

-- Kasutaja andmete uuendamine
UPDATE users 
SET first_name = 'Maria', 
    last_name = 'Maasikas-Kask',
    updated_at = NOW()
WHERE username = 'mari.maasikas';

-- Konto nime muutmine
UPDATE accounts 
SET account_name = 'Maria uus põhikonto',
    updated_at = NOW()
WHERE account_number = (
    SELECT account_number FROM (
        SELECT a.account_number 
        FROM accounts a 
        JOIN users u ON a.owner_id = u.id 
        WHERE u.username = 'mari.maasikas' 
        LIMIT 1
    ) AS temp
);

-- Tehingu staatuse uuendamine
UPDATE transactions 
SET status = 'completed',
    completed_at = NOW(),
    updated_at = NOW()
WHERE status = 'pending' 
AND transaction_type = 'internal'
LIMIT 1;

-- ========================================================
-- DELETE NÄITED
-- ========================================================

-- Aegunud sessiooni kustutamine
DELETE FROM user_sessions 
WHERE expires_at < NOW();

-- Vana test kasutaja kustutamine
DELETE FROM users 
WHERE username = 'test.kasutaja';

-- Vanade auditilogide kustutamine (vanemad kui 1 aasta)
DELETE FROM audit_logs 
WHERE created_at < DATE_SUB(NOW(), INTERVAL 1 YEAR);

-- ========================================================
-- KOMPLEKSSEMAD PÄRINGUD
-- ========================================================

-- Kasutajate mieseline tehingute statistika
SELECT 
    DATE_FORMAT(t.created_at, '%Y-%m') AS kuu,
    COUNT(t.id) AS tehingute_arv,
    SUM(t.amount) AS kogusumma,
    AVG(t.amount) AS keskmine_summa,
    COUNT(DISTINCT t.initiated_by) AS aktiivseid_kasutajaid
FROM transactions t
WHERE t.status = 'completed'
AND t.created_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
GROUP BY DATE_FORMAT(t.created_at, '%Y-%m')
ORDER BY kuu DESC;

-- Kõige aktiivsemad kontod
SELECT 
    a.account_number,
    a.account_name,
    CONCAT(u.first_name, ' ', u.last_name) AS omanik,
    COUNT(DISTINCT t1.id) + COUNT(DISTINCT t2.id) AS tehingute_arv,
    a.balance AS praegune_saldo
FROM accounts a
JOIN users u ON a.owner_id = u.id
LEFT JOIN transactions t1 ON a.account_number = t1.from_account_number
LEFT JOIN transactions t2 ON a.account_number = t2.to_account_number
GROUP BY a.id
ORDER BY tehingute_arv DESC
LIMIT 10;

-- Sissetulevad vs väljaminevad tehingud panga kaupa
SELECT 
    b.bank_name,
    b.bank_prefix,
    COUNT(CASE WHEN t.transaction_type = 'incoming' THEN 1 END) AS sissetulevad,
    COUNT(CASE WHEN t.transaction_type = 'external' THEN 1 END) AS väljaminevad,
    SUM(CASE WHEN t.transaction_type = 'incoming' THEN t.amount ELSE 0 END) AS sissetulev_summa,
    SUM(CASE WHEN t.transaction_type = 'external' THEN t.amount ELSE 0 END) AS väljaminev_summa
FROM banks b
LEFT JOIN transactions t ON (
    b.bank_prefix = t.sender_bank_prefix OR 
    b.bank_prefix = t.receiver_bank_prefix
)
WHERE t.is_interbank = TRUE
GROUP BY b.id
ORDER BY (sissetulev_summa + väljaminev_summa) DESC;

-- ========================================================
-- TRANSAKTSIOONIDE TESTIMINE
-- ========================================================

-- Test 1: Sisemise tehingu töötlemine stored procedure'iga
CALL ProcessInternalTransaction(
    GenerateTransactionId(),
    (SELECT account_number FROM accounts WHERE owner_id = 2 LIMIT 1),
    (SELECT account_number FROM accounts WHERE owner_id = 3 LIMIT 1),
    50.00,
    'EUR',
    'Test ülekanne procedure kaudu',
    2,
    @result,
    @message
);

SELECT @result AS tulemus, @message AS sõnum;

-- Test 2: Konto saldo kontrollimine
CALL CheckAccountBalance(
    (SELECT account_number FROM accounts WHERE owner_id = 2 LIMIT 1),
    @balance,
    @currency,
    @is_active
);

SELECT @balance AS saldo, @currency AS valuuta, @is_active AS aktiivne;

-- Test 3: Ebapiisava saldoga tehingu testimine
CALL ProcessInternalTransaction(
    GenerateTransactionId(),
    (SELECT account_number FROM accounts WHERE owner_id = 4 LIMIT 1),
    (SELECT account_number FROM accounts WHERE owner_id = 5 LIMIT 1),
    99999.00,
    'EUR',
    'Liiga suur ülekanne',
    4,
    @result_fail,
    @message_fail
);

SELECT @result_fail AS tulemus, @message_fail AS veateade;
