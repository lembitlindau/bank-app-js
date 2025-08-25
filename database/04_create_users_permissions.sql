-- ========================================================
-- KASUTAJATE JA ÕIGUSTE HALDUS
-- Turvalisuse seadistamine
-- ========================================================

USE bank_app;

-- ========================================================
-- KASUTAJATE LOOMINE
-- ========================================================

-- 1. Administraatori kasutaja (täielikud õigused)
CREATE USER IF NOT EXISTS 'bank_admin'@'%' IDENTIFIED BY 'AdminSecure2025!';

-- 2. Rakenduse kasutaja (piiratud õigused)
CREATE USER IF NOT EXISTS 'bank_app'@'%' IDENTIFIED BY 'AppSecure2025!';

-- 3. Varukoopia kasutaja (ainult lugemisõigused)
CREATE USER IF NOT EXISTS 'bank_backup'@'%' IDENTIFIED BY 'BackupSecure2025!';

-- 4. Monitooringu kasutaja (ainult vajalikud õigused)
CREATE USER IF NOT EXISTS 'bank_monitor'@'%' IDENTIFIED BY 'MonitorSecure2025!';

-- 5. Raporti kasutaja (ainult lugemisõigused)
CREATE USER IF NOT EXISTS 'bank_reporter'@'%' IDENTIFIED BY 'ReportSecure2025!';

-- ========================================================
-- ÕIGUSTE JAGAMINE
-- ========================================================

-- Administraatori õigused (täielik kontroll)
GRANT ALL PRIVILEGES ON bank_app.* TO 'bank_admin'@'%';
GRANT CREATE USER ON *.* TO 'bank_admin'@'%';
GRANT RELOAD ON *.* TO 'bank_admin'@'%';
GRANT PROCESS ON *.* TO 'bank_admin'@'%';

-- Rakenduse kasutaja õigused (CRUD operatsioonid)
GRANT SELECT, INSERT, UPDATE, DELETE ON bank_app.users TO 'bank_app'@'%';
GRANT SELECT, INSERT, UPDATE, DELETE ON bank_app.user_sessions TO 'bank_app'@'%';
GRANT SELECT, INSERT, UPDATE, DELETE ON bank_app.accounts TO 'bank_app'@'%';
GRANT SELECT, INSERT, UPDATE, DELETE ON bank_app.transactions TO 'bank_app'@'%';
GRANT SELECT, INSERT, UPDATE, DELETE ON bank_app.banks TO 'bank_app'@'%';
GRANT SELECT, INSERT ON bank_app.audit_logs TO 'bank_app'@'%';
GRANT SELECT, UPDATE ON bank_app.system_config TO 'bank_app'@'%';

-- Stored procedure'ide täitmise õigused
GRANT EXECUTE ON PROCEDURE bank_app.ProcessInternalTransaction TO 'bank_app'@'%';
GRANT EXECUTE ON PROCEDURE bank_app.CheckAccountBalance TO 'bank_app'@'%';
GRANT EXECUTE ON FUNCTION bank_app.GenerateTransactionId TO 'bank_app'@'%';
GRANT EXECUTE ON FUNCTION bank_app.GenerateAccountNumber TO 'bank_app'@'%';

-- Varukoopia kasutaja õigused (ainult lugemine)
GRANT SELECT ON bank_app.* TO 'bank_backup'@'%';
GRANT LOCK TABLES ON bank_app.* TO 'bank_backup'@'%';

-- Monitooringu kasutaja õigused
GRANT SELECT ON bank_app.audit_logs TO 'bank_monitor'@'%';
GRANT SELECT ON bank_app.transactions TO 'bank_monitor'@'%';
GRANT SELECT ON bank_app.user_sessions TO 'bank_monitor'@'%';
GRANT PROCESS ON *.* TO 'bank_monitor'@'%';

-- Raporti kasutaja õigused (ainult lugemine, välja arvatud tundlikud andmed)
GRANT SELECT (id, username, first_name, last_name, email, is_active, created_at) 
    ON bank_app.users TO 'bank_reporter'@'%';
GRANT SELECT ON bank_app.accounts TO 'bank_reporter'@'%';
GRANT SELECT ON bank_app.transactions TO 'bank_reporter'@'%';
GRANT SELECT ON bank_app.banks TO 'bank_reporter'@'%';

-- ========================================================
-- TURVALISUSE SEADISTUSED
-- ========================================================

-- Õiguste rakendamine
FLUSH PRIVILEGES;

-- Kontrollime loodud kasutajaid
SELECT User, Host FROM mysql.user WHERE User LIKE 'bank_%';

-- Näitame kasutajate õigusi
SHOW GRANTS FOR 'bank_admin'@'%';
SHOW GRANTS FOR 'bank_app'@'%';
SHOW GRANTS FOR 'bank_backup'@'%';
SHOW GRANTS FOR 'bank_monitor'@'%';
SHOW GRANTS FOR 'bank_reporter'@'%';
