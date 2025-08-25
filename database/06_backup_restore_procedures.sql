-- ========================================================
-- ANDMEBAASI HALDUSE OPERATSIOONID
-- Varukoopiad, import ja eksport
-- ========================================================

-- ========================================================
-- EKSPORDI SKRIPTID
-- ========================================================

-- 1. Täieliku andmebaasi eksportimine
-- Käsurealt käivitada:
-- mysqldump -u bank_admin -p --single-transaction --routines --triggers bank_app > bank_app_full_backup.sql

-- 2. Ainult andmete eksportimine (ilma struktuurita)
-- mysqldump -u bank_admin -p --no-create-info --single-transaction bank_app > bank_app_data_only.sql

-- 3. Ainult struktuuri eksportimine (ilma andmeteta)
-- mysqldump -u bank_admin -p --no-data --routines --triggers bank_app > bank_app_structure_only.sql

-- 4. Konkreetsete tabelite eksportimine
-- mysqldump -u bank_admin -p --single-transaction bank_app users accounts transactions > bank_app_core_tables.sql

-- ========================================================
-- IMPORDI SKRIPTID
-- ========================================================

-- 1. Täieliku varukoopia taastamine
-- mysql -u bank_admin -p bank_app < bank_app_full_backup.sql

-- 2. Andmete importimine (kui andmebaas on juba olemas)
-- mysql -u bank_admin -p bank_app < bank_app_data_only.sql

-- 3. Uue andmebaasi loomine ja struktuuri importimine
-- mysql -u bank_admin -p -e "CREATE DATABASE bank_app_restore;"
-- mysql -u bank_admin -p bank_app_restore < bank_app_structure_only.sql

-- ========================================================
-- AUTOMAATSE VARUKOOPIA SKRIPT (BASH)
-- ========================================================

/*
Loo fail: /scripts/backup_bank_app.sh

#!/bin/bash

# Seadistused
DB_NAME="bank_app"
DB_USER="bank_backup"
DB_PASS="BackupSecure2025!"
BACKUP_DIR="/backups/bank_app"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/bank_app_backup_$DATE.sql"

# Loo varukoopia kataloog kui ei eksisteeri
mkdir -p $BACKUP_DIR

# Täielik varukoopia
mysqldump -u $DB_USER -p$DB_PASS \
    --single-transaction \
    --routines \
    --triggers \
    --add-drop-database \
    --databases $DB_NAME > $BACKUP_FILE

# Kompresseeri fail
gzip $BACKUP_FILE

# Jäta alles ainult viimased 7 päeva varukoopiad
find $BACKUP_DIR -name "*.sql.gz" -mtime +7 -delete

# Logi tulemus
if [ $? -eq 0 ]; then
    echo "$(date): Varukoopia edukas - $BACKUP_FILE.gz" >> /var/log/bank_app_backup.log
else
    echo "$(date): Varukoopia ebaõnnestus" >> /var/log/bank_app_backup.log
fi

# Crontab seadistus (lisa root kasutaja crontab'i):
# 0 2 * * * /scripts/backup_bank_app.sh
*/

-- ========================================================
-- ANDMETE MIGREERIMISE PROTSEDUURID
-- ========================================================

DELIMITER //

-- Vanemate tehingute arhiveerimine
CREATE PROCEDURE ArchiveOldTransactions(IN p_days_old INT)
BEGIN
    DECLARE done INT DEFAULT 0;
    DECLARE v_count INT DEFAULT 0;
    
    -- Loo arhiivi tabel kui ei eksisteeri
    CREATE TABLE IF NOT EXISTS transactions_archive LIKE transactions;
    
    -- Kopeeri vanad tehingud arhiivi
    INSERT INTO transactions_archive 
    SELECT * FROM transactions 
    WHERE created_at < DATE_SUB(NOW(), INTERVAL p_days_old DAY)
    AND status IN ('completed', 'failed');
    
    SET v_count = ROW_COUNT();
    
    -- Kustuta originaaltabelist
    DELETE FROM transactions 
    WHERE created_at < DATE_SUB(NOW(), INTERVAL p_days_old DAY)
    AND status IN ('completed', 'failed');
    
    SELECT CONCAT('Arhiveeritud ', v_count, ' tehingut') AS result;
END//

-- Mitteaktiivsete kasutajate puhastamine
CREATE PROCEDURE CleanupInactiveUsers(IN p_days_inactive INT)
BEGIN
    DECLARE v_count INT DEFAULT 0;
    
    -- Märgi kasutajad mitteaktiivseks
    UPDATE users 
    SET is_active = FALSE 
    WHERE last_login < DATE_SUB(NOW(), INTERVAL p_days_inactive DAY)
    AND is_active = TRUE;
    
    SET v_count = ROW_COUNT();
    
    SELECT CONCAT('Märgitud mitteaktiivseks ', v_count, ' kasutajat') AS result;
END//

-- Sesooni puhastamine
CREATE PROCEDURE CleanupExpiredSessions()
BEGIN
    DECLARE v_count INT DEFAULT 0;
    
    DELETE FROM user_sessions 
    WHERE expires_at < NOW();
    
    SET v_count = ROW_COUNT();
    
    SELECT CONCAT('Kustutatud ', v_count, ' aegunud sessiooni') AS result;
END//

DELIMITER ;

-- ========================================================
-- ANDMEBAASI OPTIMISEERIMISE SKRIPTID
-- ========================================================

-- Tabelite optimiseerimine ja statistikate uuendamine
OPTIMIZE TABLE users;
OPTIMIZE TABLE accounts;
OPTIMIZE TABLE transactions;
OPTIMIZE TABLE audit_logs;
OPTIMIZE TABLE user_sessions;
OPTIMIZE TABLE banks;
OPTIMIZE TABLE system_config;

-- Indeksite analüüs
ANALYZE TABLE users;
ANALYZE TABLE accounts;
ANALYZE TABLE transactions;
ANALYZE TABLE audit_logs;

-- Fragmenteerimise kontroll
SELECT 
    table_name,
    data_length,
    index_length,
    data_free,
    (data_free / (data_length + index_length)) * 100 AS fragmentation_percent
FROM information_schema.tables
WHERE table_schema = 'bank_app'
AND data_length > 0;

-- ========================================================
-- MONITOORINGU PÄRINGUD
-- ========================================================

-- Andmebaasi suurus
SELECT 
    table_schema AS 'Andmebaas',
    ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) AS 'Suurus MB'
FROM information_schema.tables 
WHERE table_schema = 'bank_app'
GROUP BY table_schema;

-- Tabelite suurused
SELECT 
    table_name AS 'Tabel',
    table_rows AS 'Ridade arv',
    ROUND((data_length + index_length) / 1024 / 1024, 2) AS 'Suurus MB'
FROM information_schema.tables
WHERE table_schema = 'bank_app'
ORDER BY (data_length + index_length) DESC;
