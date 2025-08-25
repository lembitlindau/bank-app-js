-- ========================================================
-- TRIGGERITE JA PROTSEDUURIDE LOOMINE
-- Äriloogika ja andmete terviklus
-- ========================================================

USE bank_app;

-- ========================================================
-- TRIGGER: Auditilogide automaatne loomine
-- ========================================================

DELIMITER //

-- Kasutajate muudatuste logimine
CREATE TRIGGER tr_users_audit_insert
    AFTER INSERT ON users
    FOR EACH ROW
BEGIN
    INSERT INTO audit_logs (user_id, action, table_name, record_id, new_values, created_at)
    VALUES (NEW.id, 'INSERT', 'users', NEW.id, 
            JSON_OBJECT(
                'username', NEW.username,
                'first_name', NEW.first_name,
                'last_name', NEW.last_name,
                'email', NEW.email,
                'is_active', NEW.is_active
            ), NOW());
END//

CREATE TRIGGER tr_users_audit_update
    AFTER UPDATE ON users
    FOR EACH ROW
BEGIN
    INSERT INTO audit_logs (user_id, action, table_name, record_id, old_values, new_values, created_at)
    VALUES (NEW.id, 'UPDATE', 'users', NEW.id,
            JSON_OBJECT(
                'username', OLD.username,
                'first_name', OLD.first_name,
                'last_name', OLD.last_name,
                'email', OLD.email,
                'is_active', OLD.is_active
            ),
            JSON_OBJECT(
                'username', NEW.username,
                'first_name', NEW.first_name,
                'last_name', NEW.last_name,
                'email', NEW.email,
                'is_active', NEW.is_active
            ), NOW());
END//

-- Kontode muudatuste logimine
CREATE TRIGGER tr_accounts_audit_insert
    AFTER INSERT ON accounts
    FOR EACH ROW
BEGIN
    INSERT INTO audit_logs (user_id, action, table_name, record_id, new_values, created_at)
    VALUES (NEW.owner_id, 'INSERT', 'accounts', NEW.id,
            JSON_OBJECT(
                'account_number', NEW.account_number,
                'account_name', NEW.account_name,
                'balance', NEW.balance,
                'currency', NEW.currency,
                'is_active', NEW.is_active
            ), NOW());
END//

CREATE TRIGGER tr_accounts_audit_update
    AFTER UPDATE ON accounts
    FOR EACH ROW
BEGIN
    INSERT INTO audit_logs (user_id, action, table_name, record_id, old_values, new_values, created_at)
    VALUES (NEW.owner_id, 'UPDATE', 'accounts', NEW.id,
            JSON_OBJECT(
                'account_number', OLD.account_number,
                'account_name', OLD.account_name,
                'balance', OLD.balance,
                'currency', OLD.currency,
                'is_active', OLD.is_active
            ),
            JSON_OBJECT(
                'account_number', NEW.account_number,
                'account_name', NEW.account_name,
                'balance', NEW.balance,
                'currency', NEW.currency,
                'is_active', NEW.is_active
            ), NOW());
END//

-- Tehingute logimine
CREATE TRIGGER tr_transactions_audit_insert
    AFTER INSERT ON transactions
    FOR EACH ROW
BEGIN
    INSERT INTO audit_logs (user_id, action, table_name, record_id, new_values, created_at)
    VALUES (NEW.initiated_by, 'INSERT', 'transactions', NEW.id,
            JSON_OBJECT(
                'transaction_id', NEW.transaction_id,
                'from_account_number', NEW.from_account_number,
                'to_account_number', NEW.to_account_number,
                'amount', NEW.amount,
                'currency', NEW.currency,
                'status', NEW.status,
                'transaction_type', NEW.transaction_type
            ), NOW());
END//

-- ========================================================
-- STORED PROCEDURE: Sisemise tehingu töötlemine
-- ========================================================

CREATE PROCEDURE ProcessInternalTransaction(
    IN p_transaction_id VARCHAR(50),
    IN p_from_account VARCHAR(50),
    IN p_to_account VARCHAR(50),
    IN p_amount DECIMAL(15,2),
    IN p_currency VARCHAR(3),
    IN p_explanation TEXT,
    IN p_initiated_by INT,
    OUT p_result VARCHAR(20),
    OUT p_message TEXT
)
BEGIN
    DECLARE v_from_balance DECIMAL(15,2);
    DECLARE v_to_balance DECIMAL(15,2);
    DECLARE v_from_owner INT;
    DECLARE v_to_owner INT;
    DECLARE v_sender_name VARCHAR(200);
    DECLARE v_receiver_name VARCHAR(200);
    DECLARE exit handler FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        GET DIAGNOSTICS CONDITION 1
            p_message = MESSAGE_TEXT;
        SET p_result = 'FAILED';
    END;

    START TRANSACTION;

    -- Kontrollime saatja kontot
    SELECT balance, owner_id INTO v_from_balance, v_from_owner
    FROM accounts 
    WHERE account_number = p_from_account AND is_active = TRUE;

    IF v_from_balance IS NULL THEN
        SET p_result = 'FAILED';
        SET p_message = 'Saatja konto ei leitud või on mitteaktiivne';
        ROLLBACK;
        LEAVE ProcessInternalTransaction;
    END IF;

    -- Kontrollime saaja kontot
    SELECT balance, owner_id INTO v_to_balance, v_to_owner
    FROM accounts 
    WHERE account_number = p_to_account AND is_active = TRUE;

    IF v_to_balance IS NULL THEN
        SET p_result = 'FAILED';
        SET p_message = 'Saaja konto ei leitud või on mitteaktiivne';
        ROLLBACK;
        LEAVE ProcessInternalTransaction;
    END IF;

    -- Kontrollime saldot
    IF v_from_balance < p_amount THEN
        SET p_result = 'FAILED';
        SET p_message = 'Ebapiisav saldo';
        ROLLBACK;
        LEAVE ProcessInternalTransaction;
    END IF;

    -- Hangime kasutajate nimed
    SELECT CONCAT(first_name, ' ', last_name) INTO v_sender_name
    FROM users WHERE id = v_from_owner;

    SELECT CONCAT(first_name, ' ', last_name) INTO v_receiver_name
    FROM users WHERE id = v_to_owner;

    -- Uuendame saldosid
    UPDATE accounts 
    SET balance = balance - p_amount 
    WHERE account_number = p_from_account;

    UPDATE accounts 
    SET balance = balance + p_amount 
    WHERE account_number = p_to_account;

    -- Loome tehingu kirje
    INSERT INTO transactions (
        transaction_id, from_account_number, to_account_number,
        amount, currency, explanation, sender_name, receiver_name,
        status, transaction_type, initiated_by, completed_at
    ) VALUES (
        p_transaction_id, p_from_account, p_to_account,
        p_amount, p_currency, p_explanation, v_sender_name, v_receiver_name,
        'completed', 'internal', p_initiated_by, NOW()
    );

    COMMIT;
    SET p_result = 'SUCCESS';
    SET p_message = 'Tehing edukalt sooritatud';

END//

-- ========================================================
-- STORED PROCEDURE: Konto saldo kontroll
-- ========================================================

CREATE PROCEDURE CheckAccountBalance(
    IN p_account_number VARCHAR(50),
    OUT p_balance DECIMAL(15,2),
    OUT p_currency VARCHAR(3),
    OUT p_is_active BOOLEAN
)
BEGIN
    SELECT balance, currency, is_active 
    INTO p_balance, p_currency, p_is_active
    FROM accounts 
    WHERE account_number = p_account_number;
END//

-- ========================================================
-- FUNCTION: Tehingu ID genereerimine
-- ========================================================

CREATE FUNCTION GenerateTransactionId() 
RETURNS VARCHAR(50)
READS SQL DATA
DETERMINISTIC
BEGIN
    DECLARE v_timestamp BIGINT;
    DECLARE v_random INT;
    DECLARE v_transaction_id VARCHAR(50);
    
    SET v_timestamp = UNIX_TIMESTAMP(NOW());
    SET v_random = FLOOR(RAND() * 1000000);
    SET v_transaction_id = CONCAT('TRX', v_timestamp, v_random);
    
    RETURN v_transaction_id;
END//

-- ========================================================
-- FUNCTION: Konto numbri genereerimine
-- ========================================================

CREATE FUNCTION GenerateAccountNumber(p_bank_prefix VARCHAR(10)) 
RETURNS VARCHAR(50)
READS SQL DATA
DETERMINISTIC
BEGIN
    DECLARE v_unique_id VARCHAR(32);
    DECLARE v_account_number VARCHAR(50);
    
    SET v_unique_id = REPLACE(UUID(), '-', '');
    SET v_account_number = CONCAT(p_bank_prefix, v_unique_id);
    
    RETURN v_account_number;
END//

DELIMITER ;
