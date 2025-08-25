-- ========================================================
-- ANDMEBAASI EKSPORT JA IMPORT SKRIPTID
-- Internetipanga Andmebaas
-- ========================================================

-- ========================================================
-- EKSPORT PROTSEDUURID
-- ========================================================

-- 1. TÄIELIK ANDMEBAASI VARUKOOPIA
-- Käsk terminalis:
-- mysqldump -u bank_admin -p --single-transaction --routines --triggers bank_app > bank_app_full_backup_$(date +%Y%m%d_%H%M%S).sql

-- 2. AINULT ANDMETE VARUKOOPIA (ilma struktuurita)
-- mysqldump -u bank_admin -p --no-create-info --single-transaction bank_app > bank_app_data_backup_$(date +%Y%m%d_%H%M%S).sql

-- 3. AINULT STRUKTUURI VARUKOOPIA (ilma andmeteta)
-- mysqldump -u bank_admin -p --no-data --routines --triggers bank_app > bank_app_structure_backup_$(date +%Y%m%d_%H%M%S).sql

-- ========================================================
-- BASH SKRIPT AUTOMAATSEKS VARUNDAMISEKS
-- ========================================================

/*
#!/bin/bash
# Salvesta see fail kui backup_script.sh

# Muutujad
DB_NAME="bank_app"
DB_USER="bank_backup"
DB_PASS="Backup321!"
BACKUP_DIR="/var/backups/bank_app"
DATE=$(date +%Y%m%d_%H%M%S)

# Loo backup kataloog kui see pole olemas
mkdir -p $BACKUP_DIR

# Täielik varukoopia
echo "Creating full backup..."
mysqldump -u $DB_USER -p$DB_PASS \
    --single-transaction \
    --routines \
    --triggers \
    --lock-tables=false \
    $DB_NAME > $BACKUP_DIR/full_backup_$DATE.sql

# Kompresseeri varukoopia
gzip $BACKUP_DIR/full_backup_$DATE.sql

# Kustuta vanad varukoopiaid (üle 30 päeva)
find $BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete

echo "Backup completed: $BACKUP_DIR/full_backup_$DATE.sql.gz"

# Kontrolli varukoopia suurust
ls -lh $BACKUP_DIR/full_backup_$DATE.sql.gz
*/

-- ========================================================
-- IMPORT PROTSEDUURID
-- ========================================================

-- 1. TÄIELIK TAASTAMINE VARUKOOPIAST
-- Käsk terminalis:
-- mysql -u bank_admin -p bank_app < bank_app_full_backup_20250825_120000.sql

-- 2. AINULT ANDMETE TAASTAMINE
-- mysql -u bank_admin -p bank_app < bank_app_data_backup_20250825_120000.sql

-- ========================================================
-- SQL SKRIPT VARUNDAMISE AUTOMATISEERIMISEKS
-- ========================================================

USE bank_app;

-- Loome tabeli backup logide jaoks
CREATE TABLE IF NOT EXISTS backup_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    backup_type ENUM('full', 'data', 'structure') NOT NULL,
    backup_file VARCHAR(255) NOT NULL,
    backup_size BIGINT,
    status ENUM('started', 'completed', 'failed') DEFAULT 'started',
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    error_message TEXT,
    
    INDEX idx_backup_date (started_at),
    INDEX idx_backup_status (status)
);

-- Protseduur backup logi lisamiseks
DELIMITER //
CREATE PROCEDURE LogBackup(
    IN p_backup_type VARCHAR(20),
    IN p_backup_file VARCHAR(255),
    IN p_status VARCHAR(20),
    IN p_error_message TEXT
)
BEGIN
    IF p_status = 'started' THEN
        INSERT INTO backup_logs (backup_type, backup_file, status)
        VALUES (p_backup_type, p_backup_file, p_status);
    ELSE
        UPDATE backup_logs 
        SET status = p_status,
            completed_at = NOW(),
            error_message = p_error_message
        WHERE backup_file = p_backup_file
        ORDER BY id DESC LIMIT 1;
    END IF;
END//
DELIMITER ;

-- ========================================================
-- SELECTIVE EXPORT NÄITED
-- ========================================================

-- 1. Ekspordime ainult kasutajate andmed
SELECT 'KASUTAJATE EKSPORT' AS section;
SELECT * FROM users 
INTO OUTFILE '/tmp/users_export.csv'
FIELDS TERMINATED BY ','
ENCLOSED BY '"'
LINES TERMINATED BY '\n';

-- 2. Ekspordime tehingud kuupäeva järgi
SELECT 'TEHINGUTE EKSPORT (VIIMASED 30 PÄEVA)' AS section;
SELECT 
    transaction_id,
    from_account,
    to_account,
    amount,
    currency,
    explanation,
    status,
    created_at
FROM transactions 
WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
INTO OUTFILE '/tmp/recent_transactions.csv'
FIELDS TERMINATED BY ','
ENCLOSED BY '"'
LINES TERMINATED BY '\n';

-- 3. Ekspordime kontode kokkuvõtte
SELECT 'KONTODE KOKKUVÕTE' AS section;
SELECT 
    a.account_number,
    u.username,
    a.account_name,
    a.balance,
    a.currency,
    a.is_active,
    COUNT(t.id) as transaction_count
FROM accounts a
JOIN users u ON a.user_id = u.id
LEFT JOIN transactions t ON (a.account_number = t.from_account OR a.account_number = t.to_account)
GROUP BY a.id
INTO OUTFILE '/tmp/accounts_summary.csv'
FIELDS TERMINATED BY ','
ENCLOSED BY '"'
LINES TERMINATED BY '\n';

-- ========================================================
-- IMPORT VALIDATION PROTSEDUURID
-- ========================================================

-- Protseduur andmete terviklikkuse kontrollimiseks peale importi
DELIMITER //
CREATE PROCEDURE ValidateDataIntegrity()
BEGIN
    DECLARE integrity_errors INT DEFAULT 0;
    
    -- Kontrollime foreign key constraints
    SELECT COUNT(*) INTO integrity_errors
    FROM accounts a
    LEFT JOIN users u ON a.user_id = u.id
    WHERE u.id IS NULL;
    
    IF integrity_errors > 0 THEN
        SELECT CONCAT('ERROR: ', integrity_errors, ' accounts have invalid user_id') AS result;
    END IF;
    
    -- Kontrollime tehingud
    SELECT COUNT(*) INTO integrity_errors
    FROM transactions t
    LEFT JOIN users u ON t.initiated_by = u.id
    WHERE t.initiated_by IS NOT NULL AND u.id IS NULL;
    
    IF integrity_errors > 0 THEN
        SELECT CONCAT('ERROR: ', integrity_errors, ' transactions have invalid initiated_by') AS result;
    END IF;
    
    -- Kontrollime saldode kooskõla
    SELECT 
        'SALDODE KONTROLL' AS check_type,
        COUNT(*) AS negative_balances
    FROM accounts 
    WHERE balance < 0;
    
    SELECT 'DATA INTEGRITY CHECK COMPLETED' AS result;
END//
DELIMITER ;

-- ========================================================
-- DISASTER RECOVERY PROTSEDUURID
-- ========================================================

-- Protseduur andmebaasi taastamiseks
DELIMITER //
CREATE PROCEDURE RestoreDatabase(
    IN p_backup_file VARCHAR(255)
)
BEGIN
    DECLARE backup_exists INT DEFAULT 0;
    
    -- Logime taastamise alguse
    CALL LogBackup('full', p_backup_file, 'started', NULL);
    
    -- Kontrollime, kas backup fail eksisteerib
    -- (seda peaks tegema välise skriptiga)
    
    -- Taastamise järel valideerime andmed
    CALL ValidateDataIntegrity();
    
    -- Logime taastamise lõpu
    CALL LogBackup('full', p_backup_file, 'completed', NULL);
    
    SELECT 'Database restore completed successfully' AS result;
END//
DELIMITER ;

-- ========================================================
-- BACKUP MONITOORINGU PÄRINGUD
-- ========================================================

-- Viimased backupid
SELECT 
    backup_type,
    backup_file,
    status,
    started_at,
    completed_at,
    TIMESTAMPDIFF(MINUTE, started_at, completed_at) AS duration_minutes
FROM backup_logs 
ORDER BY started_at DESC 
LIMIT 10;

-- Backup suurused
SELECT 
    backup_type,
    AVG(backup_size) / 1024 / 1024 AS avg_size_mb,
    MAX(backup_size) / 1024 / 1024 AS max_size_mb,
    COUNT(*) AS backup_count
FROM backup_logs 
WHERE status = 'completed'
GROUP BY backup_type;

-- Ebaõnnestunud backupid
SELECT * FROM backup_logs 
WHERE status = 'failed' 
ORDER BY started_at DESC;

-- ========================================================
-- CLEANUP PROTSEDUURID
-- ========================================================

-- Protseduur vanade backup logide kustutamiseks
DELIMITER //
CREATE PROCEDURE CleanupBackupLogs(
    IN p_days_to_keep INT
)
BEGIN
    DELETE FROM backup_logs 
    WHERE started_at < DATE_SUB(NOW(), INTERVAL p_days_to_keep DAY);
    
    SELECT ROW_COUNT() AS deleted_records;
END//
DELIMITER ;

-- Cleanup'i käivitamine (hoiame 90 päeva jagu logisid)
-- CALL CleanupBackupLogs(90);
