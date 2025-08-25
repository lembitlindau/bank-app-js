-- ========================================================
-- TRIGGERITE JA INDEKSITE LOOMINE
-- Internetipanga Andmebaas
-- ========================================================

USE bank_app;

-- ========================================================
-- TRIGGERID
-- ========================================================

-- 1. AUDIT TRIGGER - Jälgib kõiki muudatusi kasutajate tabelis
DELIMITER //
CREATE TRIGGER audit_users_changes
AFTER UPDATE ON users
FOR EACH ROW
BEGIN
    INSERT INTO audit_logs (
        user_id, action, table_name, record_id,
        old_values, new_values, created_at
    ) VALUES (
        NEW.id, 'UPDATE', 'users', NEW.id,
        JSON_OBJECT(
            'username', OLD.username,
            'email', OLD.email,
            'is_active', OLD.is_active,
            'last_login', OLD.last_login
        ),
        JSON_OBJECT(
            'username', NEW.username,
            'email', NEW.email,
            'is_active', NEW.is_active,
            'last_login', NEW.last_login
        ),
        NOW()
    );
END//
DELIMITER ;

-- 2. SALDO TRIGGER - Kontrollida saldo piisavust enne tehingu loomist
DELIMITER //
CREATE TRIGGER check_balance_before_transaction
BEFORE INSERT ON transactions
FOR EACH ROW
BEGIN
    DECLARE current_balance DECIMAL(15,2);
    DECLARE bank_prefix VARCHAR(10);
    
    -- Kontrollime ainult väljaminevaid tehinguid
    IF NEW.transaction_type IN ('internal', 'external') THEN
        -- Leiame panga prefiksi
        SET bank_prefix = LEFT(NEW.from_account, 3);
        
        -- Kontrollime, kas konto kuulub meie panka
        IF bank_prefix = 'ABC' THEN
            SELECT balance INTO current_balance
            FROM accounts
            WHERE account_number = NEW.from_account AND is_active = TRUE;
            
            -- Kui saldo pole piisav, viskame vea
            IF current_balance < NEW.amount THEN
                SIGNAL SQLSTATE '45000'
                SET MESSAGE_TEXT = 'Insufficient funds for transaction';
            END IF;
        END IF;
    END IF;
END//
DELIMITER ;

-- 3. KONTO NUMBRI GENEREERIMISE TRIGGER
DELIMITER //
CREATE TRIGGER generate_account_number
BEFORE INSERT ON accounts
FOR EACH ROW
BEGIN
    DECLARE bank_prefix VARCHAR(10) DEFAULT 'ABC';
    DECLARE random_suffix VARCHAR(40);
    
    -- Kui konto number pole määratud, genereerime selle
    IF NEW.account_number IS NULL OR NEW.account_number = '' THEN
        SET random_suffix = REPLACE(UUID(), '-', '');
        SET NEW.account_number = CONCAT(bank_prefix, LEFT(random_suffix, 10));
    END IF;
END//
DELIMITER ;

-- 4. AUTOMATIC TIMESTAMP TRIGGER
DELIMITER //
CREATE TRIGGER update_transaction_timestamp
BEFORE UPDATE ON transactions
FOR EACH ROW
BEGIN
    SET NEW.updated_at = NOW();
    
    -- Kui staatus muutub 'completed'-ks, määrame completed_at
    IF OLD.status != 'completed' AND NEW.status = 'completed' THEN
        SET NEW.completed_at = NOW();
    END IF;
    
    -- Kui staatus muutub 'failed'-ks, määrame failed_at
    IF OLD.status != 'failed' AND NEW.status = 'failed' THEN
        SET NEW.failed_at = NOW();
    END IF;
END//
DELIMITER ;

-- ========================================================
-- TÄIENDAVAD INDEKSID JÕUDLUSE PARANDAMISEKS
-- ========================================================

-- 1. Composite indeks kasutajate otsinguks
CREATE INDEX idx_users_search ON users(last_name, first_name, is_active);

-- 2. Indeks kontode otsingute kiirendamiseks
CREATE INDEX idx_accounts_user_currency ON accounts(user_id, currency, is_active);

-- 3. Composite indeks tehingute filtreerimiseks
CREATE INDEX idx_transactions_filter ON transactions(status, transaction_type, created_at);

-- 4. Indeks pangavaheliste tehingute jaoks
CREATE INDEX idx_interbank_search ON transactions(is_interbank, sender_bank_prefix, receiver_bank_prefix);

-- 5. Indeks audit logide kiiremaks otsinguks
CREATE INDEX idx_audit_search ON audit_logs(table_name, action, created_at);

-- 6. Indeks JWT logide otsinguks
CREATE INDEX idx_jwt_search ON interbank_jwt_log(sender_bank, receiver_bank, processed_at);

-- 7. Partial indeks aktiivsete kasutajate jaoks
CREATE INDEX idx_active_users ON users(username, email) WHERE is_active = TRUE;

-- 8. Indeks sessioonide kiireks otsinguks
CREATE INDEX idx_sessions_search ON user_sessions(user_id, expires_at);

-- ========================================================
-- VAADETE (VIEWS) LOOMINE
-- ========================================================

-- 1. Vaade kasutajate ja nende rollide nägemiseks
CREATE VIEW user_roles_view AS
SELECT 
    u.id,
    u.username,
    u.first_name,
    u.last_name,
    u.email,
    u.is_active,
    GROUP_CONCAT(r.role_name) AS roles,
    u.last_login,
    u.created_at
FROM users u
LEFT JOIN user_role_assignments ura ON u.id = ura.user_id
LEFT JOIN user_roles r ON ura.role_id = r.id
GROUP BY u.id;

-- 2. Vaade kontode koondinfoks
CREATE VIEW account_summary_view AS
SELECT 
    a.id,
    a.account_number,
    a.account_name,
    a.balance,
    a.currency,
    a.is_active,
    u.username,
    u.first_name,
    u.last_name,
    COUNT(t.id) AS transaction_count,
    MAX(t.created_at) AS last_transaction
FROM accounts a
JOIN users u ON a.user_id = u.id
LEFT JOIN transactions t ON (a.account_number = t.from_account OR a.account_number = t.to_account)
GROUP BY a.id;

-- 3. Vaade tehingute ülevaateks
CREATE VIEW transaction_details_view AS
SELECT 
    t.id,
    t.transaction_id,
    t.from_account,
    t.to_account,
    t.amount,
    t.currency,
    t.explanation,
    t.sender_name,
    t.receiver_name,
    t.status,
    t.transaction_type,
    t.is_interbank,
    u.username AS initiated_by_username,
    t.created_at,
    t.completed_at
FROM transactions t
LEFT JOIN users u ON t.initiated_by = u.id;

-- ========================================================
-- SALVESTATUD PROTSEDUURID
-- ========================================================

-- 1. Protseduur rahaülekande tegemiseks
DELIMITER //
CREATE PROCEDURE TransferMoney(
    IN p_from_account VARCHAR(50),
    IN p_to_account VARCHAR(50),
    IN p_amount DECIMAL(15,2),
    IN p_currency VARCHAR(3),
    IN p_explanation TEXT,
    IN p_sender_name VARCHAR(200),
    IN p_receiver_name VARCHAR(200),
    IN p_initiated_by INT,
    OUT p_transaction_id VARCHAR(100),
    OUT p_result VARCHAR(20)
)
BEGIN
    DECLARE v_balance DECIMAL(15,2);
    DECLARE v_trans_id VARCHAR(100);
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SET p_result = 'ERROR';
    END;
    
    START TRANSACTION;
    
    -- Kontrollime lähte konto saldot
    SELECT balance INTO v_balance
    FROM accounts
    WHERE account_number = p_from_account AND is_active = TRUE
    FOR UPDATE;
    
    IF v_balance >= p_amount THEN
        -- Genereerime tehingu ID
        SET v_trans_id = CONCAT('TRX', UNIX_TIMESTAMP(), FLOOR(RAND()*10000));
        
        -- Lisame tehingu kirje
        INSERT INTO transactions (
            transaction_id, from_account, to_account, amount, currency,
            explanation, sender_name, receiver_name, status, transaction_type,
            initiated_by, created_at
        ) VALUES (
            v_trans_id, p_from_account, p_to_account, p_amount, p_currency,
            p_explanation, p_sender_name, p_receiver_name, 'pending', 'internal',
            p_initiated_by, NOW()
        );
        
        -- Uuendame saldosid
        UPDATE accounts SET balance = balance - p_amount WHERE account_number = p_from_account;
        UPDATE accounts SET balance = balance + p_amount WHERE account_number = p_to_account;
        
        -- Uuendame tehingu staatust
        UPDATE transactions SET status = 'completed', completed_at = NOW() 
        WHERE transaction_id = v_trans_id;
        
        SET p_transaction_id = v_trans_id;
        SET p_result = 'SUCCESS';
        
        COMMIT;
    ELSE
        SET p_result = 'INSUFFICIENT_FUNDS';
        ROLLBACK;
    END IF;
END//
DELIMITER ;

-- 2. Protseduur kasutaja statistika saamiseks
DELIMITER //
CREATE PROCEDURE GetUserStatistics(IN p_user_id INT)
BEGIN
    SELECT 
        u.username,
        u.first_name,
        u.last_name,
        COUNT(DISTINCT a.id) AS account_count,
        SUM(a.balance) AS total_balance,
        COUNT(DISTINCT t.id) AS transaction_count,
        MAX(t.created_at) AS last_transaction_date
    FROM users u
    LEFT JOIN accounts a ON u.id = a.user_id
    LEFT JOIN transactions t ON t.initiated_by = u.id
    WHERE u.id = p_user_id
    GROUP BY u.id;
END//
DELIMITER ;

-- ========================================================
-- INDEKSITE JA TRIGGERITE KONTROLL
-- ========================================================

-- Kuvame kõik indeksid
SELECT 
    TABLE_NAME,
    INDEX_NAME,
    COLUMN_NAME,
    NON_UNIQUE
FROM information_schema.STATISTICS 
WHERE TABLE_SCHEMA = 'bank_app'
ORDER BY TABLE_NAME, INDEX_NAME;

-- Kuvame kõik triggerid
SELECT 
    TRIGGER_NAME,
    EVENT_MANIPULATION,
    EVENT_OBJECT_TABLE,
    TRIGGER_SCHEMA
FROM information_schema.TRIGGERS 
WHERE TRIGGER_SCHEMA = 'bank_app';
