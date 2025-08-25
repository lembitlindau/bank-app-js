-- ========================================================
-- ANDMEBAASI KASUTAJATE LOOMINE JA ÕIGUSTE MÄÄRAMINE
-- Internetipanga Andmebaas
-- ========================================================

-- ========================================================
-- 1. ADMINISTRAATORI KASUTAJA (täielikud õigused)
-- ========================================================
CREATE USER IF NOT EXISTS 'bank_admin'@'%' IDENTIFIED BY 'AdminSecure123!';

-- Andmebaasi täielikud õigused
GRANT ALL PRIVILEGES ON bank_app.* TO 'bank_admin'@'%';

-- Kasutajate haldamise õigused
GRANT CREATE USER ON *.* TO 'bank_admin'@'%';
GRANT GRANT OPTION ON bank_app.* TO 'bank_admin'@'%';

-- ========================================================
-- 2. RAKENDUSE KASUTAJA (CUD õigused andmetabelitele)
-- ========================================================
CREATE USER IF NOT EXISTS 'bank_app_user'@'%' IDENTIFIED BY 'AppUser456!';

-- Põhilised andmetabelite õigused
GRANT SELECT, INSERT, UPDATE, DELETE ON bank_app.users TO 'bank_app_user'@'%';
GRANT SELECT, INSERT, UPDATE, DELETE ON bank_app.user_sessions TO 'bank_app_user'@'%';
GRANT SELECT, INSERT, UPDATE, DELETE ON bank_app.accounts TO 'bank_app_user'@'%';
GRANT SELECT, INSERT, UPDATE, DELETE ON bank_app.transactions TO 'bank_app_user'@'%';
GRANT SELECT, INSERT, UPDATE, DELETE ON bank_app.user_roles TO 'bank_app_user'@'%';
GRANT SELECT, INSERT, UPDATE, DELETE ON bank_app.user_role_assignments TO 'bank_app_user'@'%';

-- Audit logide kirjutamise õigus
GRANT INSERT, SELECT ON bank_app.audit_logs TO 'bank_app_user'@'%';
GRANT INSERT, SELECT ON bank_app.interbank_jwt_log TO 'bank_app_user'@'%';

-- ========================================================
-- 3. AUDITI KASUTAJA (ainult lugemisõigused)
-- ========================================================
CREATE USER IF NOT EXISTS 'bank_auditor'@'%' IDENTIFIED BY 'Auditor789!';

-- Ainult lugemisõigused kõigile tabelitele
GRANT SELECT ON bank_app.* TO 'bank_auditor'@'%';

-- ========================================================
-- 4. VARUKOOPIA KASUTAJA (backup ja restore õigused)
-- ========================================================
CREATE USER IF NOT EXISTS 'bank_backup'@'%' IDENTIFIED BY 'Backup321!';

-- Varukoopia õigused
GRANT SELECT, LOCK TABLES ON bank_app.* TO 'bank_backup'@'%';
GRANT RELOAD ON *.* TO 'bank_backup'@'%';
GRANT PROCESS ON *.* TO 'bank_backup'@'%';

-- ========================================================
-- 5. PANGAVAHELINE API KASUTAJA (piiratud õigused)
-- ========================================================
CREATE USER IF NOT EXISTS 'bank_interbank'@'%' IDENTIFIED BY 'Interbank999!';

-- Ainult pangavaheliste tehingute jaoks vajalikud õigused
GRANT SELECT ON bank_app.accounts TO 'bank_interbank'@'%';
GRANT SELECT, INSERT, UPDATE ON bank_app.transactions TO 'bank_interbank'@'%';
GRANT INSERT ON bank_app.interbank_jwt_log TO 'bank_interbank'@'%';

-- ========================================================
-- ÕIGUSTE RAKENDAMINE
-- ========================================================
FLUSH PRIVILEGES;

-- ========================================================
-- TURVALISUSE KONTROLL - KASUTAJATE NIMEKIRJA KUVAMINE
-- ========================================================
SELECT 
    User,
    Host,
    account_locked,
    password_expired
FROM mysql.user 
WHERE User LIKE 'bank_%';

-- ========================================================
-- KASUTAJATE ÕIGUSTE KONTROLL
-- ========================================================
SHOW GRANTS FOR 'bank_admin'@'%';
SHOW GRANTS FOR 'bank_app_user'@'%';
SHOW GRANTS FOR 'bank_auditor'@'%';
SHOW GRANTS FOR 'bank_backup'@'%';
SHOW GRANTS FOR 'bank_interbank'@'%';
