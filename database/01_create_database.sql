-- ========================================================
-- INTERNETIPANGA ANDMEBAASI LOOMINE
-- Projekti nimi: Bank Web Application
-- Autor: Lembit Lindau
-- Kuupäev: 25.08.2025
-- ========================================================

-- Andmebaasi loomine
DROP DATABASE IF EXISTS bank_app;
CREATE DATABASE bank_app 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE bank_app;

-- Kommentaar: Kasutame UTF8MB4 toetamaks täielikku Unicode'i, 
-- sealhulgas emojisid ja rahvusvahelisi tähemärke

-- ========================================================
-- KASUTAJATE TABEL (users)
-- ========================================================
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP NULL DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Indeksid
    INDEX idx_username (username),
    INDEX idx_email (email),
    INDEX idx_active (is_active),
    INDEX idx_created (created_at)
);

-- ========================================================
-- SESSIOONIDE TABEL (user_sessions)
-- ========================================================
CREATE TABLE user_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    token_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    
    -- Välisviit kasutajate tabelile
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    
    -- Indeksid
    INDEX idx_user_id (user_id),
    INDEX idx_token (token_hash),
    INDEX idx_expires (expires_at)
);

-- ========================================================
-- KONTODE TABEL (accounts)
-- ========================================================
CREATE TABLE accounts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    account_number VARCHAR(50) UNIQUE NOT NULL,
    user_id INT NOT NULL,
    account_name VARCHAR(100) NOT NULL,
    balance DECIMAL(15,2) DEFAULT 0.00,
    currency ENUM('EUR', 'USD', 'GBP') DEFAULT 'EUR',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Välisviit kasutajate tabelile
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    
    -- Kontrollid
    CHECK (balance >= 0),
    
    -- Indeksid
    INDEX idx_account_number (account_number),
    INDEX idx_user_id (user_id),
    INDEX idx_currency (currency),
    INDEX idx_active (is_active)
);

-- ========================================================
-- TEHINGUTE TABEL (transactions)
-- ========================================================
CREATE TABLE transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    transaction_id VARCHAR(100) UNIQUE NOT NULL,
    from_account VARCHAR(50) NOT NULL,
    to_account VARCHAR(50) NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    currency ENUM('EUR', 'USD', 'GBP') NOT NULL,
    explanation TEXT NOT NULL,
    sender_name VARCHAR(200) NOT NULL,
    receiver_name VARCHAR(200),
    status ENUM('pending', 'inProgress', 'completed', 'failed') DEFAULT 'pending',
    transaction_type ENUM('internal', 'external', 'incoming') NOT NULL,
    is_interbank BOOLEAN DEFAULT FALSE,
    sender_bank_prefix VARCHAR(10),
    receiver_bank_prefix VARCHAR(10),
    error_message TEXT,
    initiated_by INT,
    completed_at TIMESTAMP NULL,
    failed_at TIMESTAMP NULL,
    received_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Välisviit kasutajate tabelile (võib olla NULL incoming tehingute puhul)
    FOREIGN KEY (initiated_by) REFERENCES users(id) ON DELETE SET NULL,
    
    -- Kontrollid
    CHECK (amount > 0),
    
    -- Indeksid
    INDEX idx_transaction_id (transaction_id),
    INDEX idx_from_account (from_account),
    INDEX idx_to_account (to_account),
    INDEX idx_status (status),
    INDEX idx_type (transaction_type),
    INDEX idx_interbank (is_interbank),
    INDEX idx_initiated_by (initiated_by),
    INDEX idx_created (created_at),
    INDEX idx_sender_bank (sender_bank_prefix),
    INDEX idx_receiver_bank (receiver_bank_prefix)
);

-- ========================================================
-- ROLLIDE TABEL (user_roles)
-- ========================================================
CREATE TABLE user_roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    role_name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    permissions JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Indeksid
    INDEX idx_role_name (role_name)
);

-- ========================================================
-- KASUTAJA-ROLLIDE SEOSTE TABEL (user_role_assignments)
-- ========================================================
CREATE TABLE user_role_assignments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    role_id INT NOT NULL,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    assigned_by INT,
    
    -- Välisviited
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES user_roles(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE SET NULL,
    
    -- Unikaalne kombinatsioon
    UNIQUE KEY unique_user_role (user_id, role_id),
    
    -- Indeksid
    INDEX idx_user_id (user_id),
    INDEX idx_role_id (role_id)
);

-- ========================================================
-- AUDIT LOGIDE TABEL (audit_logs)
-- ========================================================
CREATE TABLE audit_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    action VARCHAR(100) NOT NULL,
    table_name VARCHAR(50) NOT NULL,
    record_id VARCHAR(50),
    old_values JSON,
    new_values JSON,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Välisviit kasutajate tabelile
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    
    -- Indeksid
    INDEX idx_user_id (user_id),
    INDEX idx_action (action),
    INDEX idx_table_name (table_name),
    INDEX idx_created (created_at),
    INDEX idx_record_id (record_id)
);

-- ========================================================
-- PANKADEVAHELISTE TEHINGUTE JWT TABEL (interbank_jwt_log)
-- ========================================================
CREATE TABLE interbank_jwt_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    jwt_id VARCHAR(255) UNIQUE NOT NULL,
    sender_bank VARCHAR(10) NOT NULL,
    receiver_bank VARCHAR(10) NOT NULL,
    transaction_id VARCHAR(100) NOT NULL,
    jwt_payload JSON NOT NULL,
    signature_valid BOOLEAN,
    processed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Välisviit tehingute tabelile
    FOREIGN KEY (transaction_id) REFERENCES transactions(transaction_id) ON DELETE CASCADE,
    
    -- Indeksid
    INDEX idx_jwt_id (jwt_id),
    INDEX idx_sender_bank (sender_bank),
    INDEX idx_receiver_bank (receiver_bank),
    INDEX idx_transaction_id (transaction_id),
    INDEX idx_processed (processed_at)
);
