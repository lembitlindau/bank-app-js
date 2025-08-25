-- ========================================================
-- ANDMETE MUUTMISE JA KUSTUTAMISE NÄITED (UPDATE/DELETE)
-- Internetipanga Andmebaas
-- ========================================================

USE bank_app;

-- ========================================================
-- UPDATE NÄITED
-- ========================================================

-- 1. Kasutaja andmete uuendamine
UPDATE users 
SET last_login = NOW(), 
    updated_at = NOW()
WHERE username = 'mari.kask';

-- 2. Konto aktiivse oleku muutmine
UPDATE accounts 
SET is_active = FALSE,
    updated_at = NOW()
WHERE account_number = 'ABC1234567895' 
    AND user_id = 5;

-- 3. Tehingu staatuse uuendamine
UPDATE transactions 
SET status = 'completed',
    completed_at = NOW(),
    updated_at = NOW()
WHERE transaction_id = 'TRX20250825004';

-- 4. Kasutaja rolli uuendamine
UPDATE user_role_assignments 
SET role_id = 2,  -- muudame manager rolliks
    assigned_at = NOW()
WHERE user_id = 3 AND role_id = 3;

-- 5. Konto saldo uuendamine (tehingu järel)
UPDATE accounts 
SET balance = balance - 100.00,
    updated_at = NOW()
WHERE account_number = 'ABC1234567890';

UPDATE accounts 
SET balance = balance + 100.00,
    updated_at = NOW()
WHERE account_number = 'ABC1234567892';

-- 6. Massiline kasutajate aktiivsuse uuendamine
UPDATE users 
SET is_active = TRUE,
    updated_at = NOW()
WHERE last_login < DATE_SUB(NOW(), INTERVAL 30 DAY);

-- ========================================================
-- DELETE NÄITED
-- ========================================================

-- 1. Aegunud sessioonide kustutamine
DELETE FROM user_sessions 
WHERE expires_at < NOW();

-- 2. Vana audit logi kustutamine (üle 1 aasta)
DELETE FROM audit_logs 
WHERE created_at < DATE_SUB(NOW(), INTERVAL 1 YEAR);

-- 3. Ebaõnnestunud tehingute kustutamine (üle 7 päeva)
DELETE FROM transactions 
WHERE status = 'failed' 
    AND created_at < DATE_SUB(NOW(), INTERVAL 7 DAY);

-- 4. Kasutaja rolli eemaldamine
DELETE FROM user_role_assignments 
WHERE user_id = 5 AND role_id = 4;

-- 5. Mitteaktiivse kasutaja sessioonide kustutamine
DELETE s FROM user_sessions s
INNER JOIN users u ON s.user_id = u.id
WHERE u.is_active = FALSE;

-- 6. Pangavaheliste JWT logide puhastamine (üle 90 päeva)
DELETE FROM interbank_jwt_log 
WHERE processed_at < DATE_SUB(NOW(), INTERVAL 90 DAY);

-- ========================================================
-- KEERUKAMAD UPDATE NÄITED LIITUMISTEGA
-- ========================================================

-- 1. Kasutajate viimase tehingu aja uuendamine
UPDATE users u
SET u.updated_at = (
    SELECT MAX(t.created_at)
    FROM transactions t
    WHERE t.initiated_by = u.id
)
WHERE u.id IN (
    SELECT DISTINCT initiated_by 
    FROM transactions 
    WHERE initiated_by IS NOT NULL
);

-- 2. Kontode tehingute arvu uuendamine (lisades uue välja)
-- Esmalt lisame välja (see oleks eraldi migratsioonis)
ALTER TABLE accounts ADD COLUMN transaction_count INT DEFAULT 0;

UPDATE accounts a
SET a.transaction_count = (
    SELECT COUNT(*)
    FROM transactions t
    WHERE t.from_account = a.account_number 
       OR t.to_account = a.account_number
);

-- ========================================================
-- CONDITIONAL DELETE NÄITED
-- ========================================================

-- 1. Kustutame kasutajad, kellel pole ühtegi kontot
DELETE u FROM users u
LEFT JOIN accounts a ON u.id = a.user_id
WHERE a.id IS NULL 
    AND u.username != 'admin';

-- 2. Kustutame tühjad kontod (saldo 0 ja pole aktiivsed)
DELETE FROM accounts 
WHERE balance = 0.00 
    AND is_active = FALSE 
    AND created_at < DATE_SUB(NOW(), INTERVAL 6 MONTH);

-- ========================================================
-- TRANSAKTSIOONIGA UPDATE/DELETE NÄIDE
-- ========================================================

START TRANSACTION;

-- Rahaülekande simulatsioon transaktsiooniga
SET @from_account = 'ABC1234567890';
SET @to_account = 'ABC1234567892';
SET @amount = 150.00;

-- Kontrollime, kas saldod on piisavad
SELECT balance FROM accounts WHERE account_number = @from_account;

-- Kui saldo on piisav, teeme ülekande
UPDATE accounts 
SET balance = balance - @amount,
    updated_at = NOW()
WHERE account_number = @from_account 
    AND balance >= @amount;

-- Kontrollime, kas update õnnestus
IF ROW_COUNT() = 1 THEN
    UPDATE accounts 
    SET balance = balance + @amount,
        updated_at = NOW()
    WHERE account_number = @to_account;
    
    -- Lisame tehingu kirje
    INSERT INTO transactions (
        transaction_id, from_account, to_account, amount, currency,
        explanation, sender_name, receiver_name, status, transaction_type,
        initiated_by, completed_at
    ) VALUES (
        CONCAT('TRX', UNIX_TIMESTAMP(), FLOOR(RAND()*1000)),
        @from_account, @to_account, @amount, 'EUR',
        'Transaktsiooniga ülekanne', 'Mari Kask', 'Jaan Tamm', 
        'completed', 'internal', 2, NOW()
    );
    
    COMMIT;
ELSE
    ROLLBACK;
END IF;

-- ========================================================
-- KONTROLLPÄRINGUD MUUDATUSTE KINNITAMISEKS
-- ========================================================

SELECT 'UUENDATUD KASUTAJAD:' as Info;
SELECT id, username, last_login, updated_at FROM users WHERE last_login IS NOT NULL;

SELECT 'KONTODE OLEKUD:' as Info;
SELECT account_number, user_id, is_active, transaction_count FROM accounts;

SELECT 'TEHINGUTE STAATUSED:' as Info;
SELECT transaction_id, status, completed_at FROM transactions WHERE status = 'completed';
