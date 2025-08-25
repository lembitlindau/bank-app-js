-- ========================================================
-- TABELITE LOOMINE
-- Internetipanga andmebaasi struktuur
-- ========================================================

USE bank_app;

-- ========================================================
-- 1. KASUTAJATE TABEL (users)
-- ========================================================
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    is_active BOOLEAN DEFAULT TRUE,
    last_login DATETIME DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Indeksid kiirema otsingु के लिए
    INDEX idx_username (username),
    INDEX idx_email (email),
    INDEX idx_active (is_active),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB COMMENT='Kasutajate põhiandmed ja autentimisinfo';

-- ========================================================
-- 2. KASUTAJATE SESSIOONI TABEL (user_sessions)
-- ========================================================
CREATE TABLE user_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    token_hash VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    
    -- Välisvõti kasutajate tabeliga
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    
    -- Indeksid
    INDEX idx_user_id (user_id),
    INDEX idx_token_hash (token_hash),
    INDEX idx_expires_at (expires_at)
) ENGINE=InnoDB COMMENT='JWT tokenite ja sessiooni haldus';

-- ========================================================
-- 3. PANGAKONTODE TABEL (accounts)
-- ========================================================
CREATE TABLE accounts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    account_number VARCHAR(50) NOT NULL UNIQUE,
    owner_id INT NOT NULL,
    account_name VARCHAR(200) NOT NULL,
    balance DECIMAL(15,2) DEFAULT 0.00,
    currency ENUM('EUR', 'USD', 'GBP') DEFAULT 'EUR',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Välisvõti kasutajate tabeliga
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE,
    
    -- Piirangud
    CONSTRAINT chk_balance_positive CHECK (balance >= 0),
    
    -- Indeksid
    INDEX idx_account_number (account_number),
    INDEX idx_owner_id (owner_id),
    INDEX idx_currency (currency),
    INDEX idx_active (is_active),
    INDEX idx_balance (balance)
) ENGINE=InnoDB COMMENT='Pangakontod ja nende saldod';

-- ========================================================
-- 4. TEHINGUTE TABEL (transactions)
-- ========================================================
CREATE TABLE transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    transaction_id VARCHAR(50) NOT NULL UNIQUE,
    from_account_number VARCHAR(50) NOT NULL,
    to_account_number VARCHAR(50) NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    currency ENUM('EUR', 'USD', 'GBP') NOT NULL,
    explanation TEXT NOT NULL,
    sender_name VARCHAR(200) NOT NULL,
    receiver_name VARCHAR(200) DEFAULT '',
    status ENUM('pending', 'inProgress', 'completed', 'failed') DEFAULT 'pending',
    transaction_type ENUM('internal', 'external', 'incoming') NOT NULL,
    is_interbank BOOLEAN DEFAULT FALSE,
    sender_bank_prefix VARCHAR(10) DEFAULT NULL,
    receiver_bank_prefix VARCHAR(10) DEFAULT NULL,
    error_message TEXT DEFAULT NULL,
    initiated_by INT DEFAULT NULL,
    completed_at DATETIME DEFAULT NULL,
    failed_at DATETIME DEFAULT NULL,
    received_at DATETIME DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Välisvõtmed
    FOREIGN KEY (initiated_by) REFERENCES users(id) ON DELETE SET NULL,
    
    -- Piirangud
    CONSTRAINT chk_amount_positive CHECK (amount > 0),
    CONSTRAINT chk_different_accounts CHECK (from_account_number != to_account_number),
    
    -- Indeksid
    INDEX idx_transaction_id (transaction_id),
    INDEX idx_from_account (from_account_number),
    INDEX idx_to_account (to_account_number),
    INDEX idx_status (status),
    INDEX idx_type (transaction_type),
    INDEX idx_initiated_by (initiated_by),
    INDEX idx_interbank (is_interbank),
    INDEX idx_sender_bank (sender_bank_prefix),
    INDEX idx_receiver_bank (receiver_bank_prefix),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB COMMENT='Kõik tehingud (sisemised, välised, pangavahelised)';

-- ========================================================
-- 5. PANGADE TABEL (banks)
-- ========================================================
CREATE TABLE banks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    bank_name VARCHAR(200) NOT NULL,
    bank_prefix VARCHAR(10) NOT NULL UNIQUE,
    base_url VARCHAR(500) NOT NULL,
    jwks_url VARCHAR(500) NOT NULL,
    api_key VARCHAR(255) DEFAULT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    last_contacted DATETIME DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Indeksid
    INDEX idx_bank_prefix (bank_prefix),
    INDEX idx_bank_name (bank_name),
    INDEX idx_active (is_active),
    INDEX idx_last_contacted (last_contacted)
) ENGINE=InnoDB COMMENT='Registreeritud pangad pankadevaheliseks suhtluseks';

-- ========================================================
-- 6. AUDITILOGIDE TABEL (audit_logs)
-- ========================================================
CREATE TABLE audit_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT DEFAULT NULL,
    action VARCHAR(100) NOT NULL,
    table_name VARCHAR(50) NOT NULL,
    record_id INT DEFAULT NULL,
    old_values JSON DEFAULT NULL,
    new_values JSON DEFAULT NULL,
    ip_address VARCHAR(45) DEFAULT NULL,
    user_agent TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Välisvõti
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    
    -- Indeksid
    INDEX idx_user_id (user_id),
    INDEX idx_action (action),
    INDEX idx_table_name (table_name),
    INDEX idx_record_id (record_id),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB COMMENT='Auditilogid kõigi oluliste tegevuste jälgimiseks';

-- ========================================================
-- 7. SÜSTEEMI KONFIGURATSIOON (system_config)
-- ========================================================
CREATE TABLE system_config (
    id INT AUTO_INCREMENT PRIMARY KEY,
    config_key VARCHAR(100) NOT NULL UNIQUE,
    config_value TEXT NOT NULL,
    description TEXT DEFAULT NULL,
    is_encrypted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Indeksid
    INDEX idx_config_key (config_key)
) ENGINE=InnoDB COMMENT='Süsteemi konfiguratsioonide salvestamine';
