# ANDMEBAASI LOOMINE VEEBIRAKENDUSELE

**Projekti nimi:** Internetipanga andmebaas  
**Autor:** Lembit Lindau  
**Kuupäev:** 25. august 2025  
**Kood:** TAK24  

---

## SISUKORD

1. [Töö eesmärk ja seotus internetipanga projektiga](#1-töö-eesmärk-ja-seotus-internetipanga-projektiga)
2. [Andmebaasi projekteerimise metoodika](#2-andmebaasi-projekteerimise-metoodika)
3. [Andmebaasi struktuur ja ER-diagramm](#3-andmebaasi-struktuur-ja-er-diagramm)
4. [Tabelite tehniline kirjeldus](#4-tabelite-tehniline-kirjeldus)
5. [SQL-lausete dokumentatsioon](#5-sql-lausete-dokumentatsioon)
6. [Transaktsioonide kasutamine](#6-transaktsioonide-kasutamine)
7. [Kasutajate ja õiguste haldus](#7-kasutajate-ja-õiguste-haldus)
8. [Andmete eksport ja import](#8-andmete-eksport-ja-import)
9. [Seotus veebirakendusega](#9-seotus-veebirakendusega)
10. [Kokkuvõte ja õppimised](#10-kokkuvõte-ja-õppimised)

---

## 1. TÖÖ EESMÄRK JA SEOTUS INTERNETIPANGA PROJEKTIGA

### 1.1 Andmebaasi eesmärk

Käesoleva töö eesmärk on luua ja dokumenteerida relatsiooniline andmebaas, mis toetab internetipanga veebirakenduse tööd. Andmebaas peab tagama:

- **Kasutajate turvalist autentimist** ja sessiooni haldust
- **Pangakontode haldust** erinevates valuutades (EUR, USD, GBP)
- **Tehingute töötlemist** nii sama panga siseselt kui pangavaheliselt
- **Auditeerimist ja logimist** kõigi kriitiliste operatsioonide kohta
- **Integreerimist keskpanga süsteemiga** pankadevaheliseks suhtluseks

### 1.2 Seotus internetipanga projektiga

Antud andmebaas on otseselt seotud internetipanga veebirakendusega, mis:

- **Kasutab MongoDB't tootmises**, kuid SQL andmebaas on vajalik struktuurilise andmeanalüüsi ja raportikomponendi jaoks
- **Suhtleb REST API kaudu** Node.js Express serveri vahendusel
- **Toetab JWT autentimist** ja pangadevahelist kommunikatsiooni
- **Integreerub keskpanga API-ga** (https://keskpank.herokuapp.com)
- **Võimaldab reaalajas tehinguid** sisemiselt ja väliselt

### 1.3 Projektikontekst

Internetipanga süsteem koosneb järgmistest komponentidest:
- **Frontend:** HTML5/CSS3/JavaScript (Bootstrap 5)
- **Backend:** Node.js Express server
- **Andmebaas:** MongoDB (tootmine) + MySQL (analüütika)
- **Turvalisus:** JWT tokenid, RSA allkirjastamine, bcrypt räsimine
- **Integratsioonid:** Keskpank, teised pangad JWKS protokolli kaudu

---

## 2. ANDMEBAASI PROJEKTEERIMISE METOODIKA

### 2.1 Kasutatud metoodika

Andmebaasi kujundamisel kasutasin **Entity-Relationship (ER) modelling** metoodikat koos **UML klassidiagrammide** põhimõtetega:

1. **Nõuete analüüs** - Internetipanga funktsionaalsuste määratlemine
2. **Kontseptuaalne mudel** - Põhiliste entiteetide tuvastamine
3. **Loogiline mudel** - Seoste ja atribuutide täpsustamine
4. **Füüsiline mudel** - SQL tabelite ja piirangute loomine
5. **Normaliseerimine** - 3NF taseme saavutamine

### 2.2 Andmemudeli ülesehitus

Andmemudel järgib **kolmekihilist arhitektuuri**:

**Kasutajakiht:**
- Kasutajad (users)
- Sessioonid (user_sessions)

**Äriloogika kiht:**
- Kontod (accounts)
- Tehingud (transactions)
- Pangad (banks)

**Tugi- ja auditeerimiskiht:**
- Auditilogid (audit_logs)
- Süsteemi konfiguratsioon (system_config)

### 2.3 Projekteerimispõhimõtted

**Terviklus:**
- Referentsiaalse tervikluse tagamine välisvõtmetega
- Äriloogika kontrollimine piirangutega (constraints)
- Andmete järjepidevus transaktsioonidega

**Jõudlus:**
- Strateegilised indeksid sageli kasutatavatel väljadel
- Optimiseeritud päringud stored procedure'ide abil
- Tabelite partitsioneerimise võimalus tulevikus

**Turvalisus:**
- Erinevad kasutajarollid minimaalsete õigustega
- Tundlike andmete krüpteerimine
- Täielik auditijälje säilitamine

---

## 3. ANDMEBAASI STRUKTUUR JA ER-DIAGRAMM

### 3.1 Andmebaasi üldstruktuur

Andmebaas koosneb **7 põhitabelist**, mis on omavahel seotud järgnevalt:

```
users (1) ←→ (N) accounts
users (1) ←→ (N) user_sessions  
users (1) ←→ (N) transactions [initiated_by]
accounts (1) ←→ (N) transactions [from/to account references]
banks (1) ←→ (N) transactions [interbank transactions]
audit_logs ←→ (REF) users
system_config [independent configuration]
```

### 3.2 ER-diagrammi kirjeldus

Kuigi MySQL Workbench ei olnud saadaval, kirjeldan ER-diagrammi tekstiliselt:

**Entiteedid ja nende omadused:**

🟦 **USERS** (Kasutajad)
- PK: id (INT, AUTO_INCREMENT)
- UK: username, email
- Atribuudid: password_hash, first_name, last_name, is_active, last_login
- Timestamps: created_at, updated_at

🟩 **ACCOUNTS** (Kontod)  
- PK: id (INT, AUTO_INCREMENT)
- FK: owner_id → users.id
- UK: account_number
- Atribuudid: account_name, balance, currency, is_active
- Timestamps: created_at, updated_at

🟨 **TRANSACTIONS** (Tehingud)
- PK: id (INT, AUTO_INCREMENT)  
- FK: initiated_by → users.id
- UK: transaction_id
- Atribuudid: from/to_account_number, amount, currency, explanation, status, type
- Pangavahelised: sender/receiver_bank_prefix, is_interbank
- Timestamps: created_at, completed_at, failed_at, received_at

🟪 **USER_SESSIONS** (Sessioonid)
- PK: id (INT, AUTO_INCREMENT)
- FK: user_id → users.id  
- Atribuudid: token_hash, expires_at
- Timestamps: created_at

🟫 **BANKS** (Pangad)
- PK: id (INT, AUTO_INCREMENT)
- UK: bank_prefix
- Atribuudid: bank_name, base_url, jwks_url, is_active
- Timestamps: created_at, last_contacted

🟧 **AUDIT_LOGS** (Auditilogid)
- PK: id (INT, AUTO_INCREMENT)
- FK: user_id → users.id (NULL-able)
- Atribuudid: action, table_name, record_id, old_values(JSON), new_values(JSON)
- Timestamps: created_at

⬜ **SYSTEM_CONFIG** (Süsteemi konfiguratsioon)
- PK: id (INT, AUTO_INCREMENT)  
- UK: config_key
- Atribuudid: config_value, description, is_encrypted
- Timestamps: created_at, updated_at

**Peamised seosed:**
- User → Accounts (1:N) - Kasutajal võib olla mitu kontot
- User → Sessions (1:N) - Kasutajal võib olla mitu aktiivset sessiooni  
- User → Transactions (1:N) - Kasutaja saab algatada mitu tehingut
- Account references in Transactions (M:N) - Tehingud seovad kontosid
- Banks → Transactions (1:N) - Pangad osalevad pankadevahelistes tehingutes

### 3.3 Normaliseerimine

Andmebaas on normaliseeritud **3. normaalvormi (3NF)** tasemele:

- **1NF:** Kõik väljad sisaldavad atomaarseid väärtusi
- **2NF:** Elimineeritud osalised funktsionaalsed sõltuvused  
- **3NF:** Elimineeritud transitiivsed sõltuvused

**Näide normaliseerimisest:**
Algne denormaliseeritud struktuur oleks võinud olla:
```
Transaction: id, from_user_name, from_user_email, to_user_name, to_user_email, amount...
```

3NF järgi:
```
Users: id, username, email, first_name, last_name
Accounts: id, owner_id(FK), account_number  
Transactions: id, from_account_number, to_account_number, amount, initiated_by(FK)
```

---

## 4. TABELITE TEHNILINE KIRJELDUS

### 4.1 USERS (Kasutajad)

**Eesmärk:** Kasutajate põhiandmete ja autentimisinfo säilitamine

| Väli | Tüüp | Piirangud | Kirjeldus |
|------|------|-----------|-----------|
| id | INT | PK, AUTO_INCREMENT | Unikaalne kasutaja identifikaator |
| username | VARCHAR(50) | NOT NULL, UNIQUE | Unikaalne kasutajanimi sisselogimiseks |
| password_hash | VARCHAR(255) | NOT NULL | bcrypt räsitud parool |
| first_name | VARCHAR(100) | NOT NULL | Kasutaja eesnimi |
| last_name | VARCHAR(100) | NOT NULL | Kasutaja perekonnanimi |  
| email | VARCHAR(255) | NOT NULL, UNIQUE | Unikaalne e-posti aadress |
| is_active | BOOLEAN | DEFAULT TRUE | Kasutaja konto aktiivsus |
| last_login | DATETIME | NULL | Viimane sisselogimise aeg |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Konto loomise aeg |
| updated_at | TIMESTAMP | ON UPDATE CURRENT_TIMESTAMP | Viimane muudatus |

**Indeksid:**
- `idx_username` - kiire sisselogimine
- `idx_email` - e-posti kontrollimine  
- `idx_active` - aktiivsete kasutajate filtreerimine

### 4.2 ACCOUNTS (Kontod)

**Eesmärk:** Pangakontode ja saldode haldamine

| Väli | Tüüp | Piirangud | Kirjeldus |
|------|------|-----------|-----------|
| id | INT | PK, AUTO_INCREMENT | Unikaalne konto identifikaator |
| account_number | VARCHAR(50) | NOT NULL, UNIQUE | Unikaalne kontonumber (TLU + UUID) |
| owner_id | INT | FK → users.id | Konto omaniku viide |
| account_name | VARCHAR(200) | NOT NULL | Konto kirjeldav nimi |
| balance | DECIMAL(15,2) | DEFAULT 0.00, ≥ 0 | Konto saldo sentides |
| currency | ENUM | 'EUR', 'USD', 'GBP' | Konto valuuta |
| is_active | BOOLEAN | DEFAULT TRUE | Konto aktiivsus |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Konto loomise aeg |
| updated_at | TIMESTAMP | ON UPDATE CURRENT_TIMESTAMP | Viimane muudatus |

**Äriloogika piirangud:**
- `chk_balance_positive` - saldo ei saa olla negatiivne
- Konto number genereeritakse automaatselt funktsiooni abil

### 4.3 TRANSACTIONS (Tehingud)

**Eesmärk:** Kõigi tehingute (sisemised, välised, pangavahelised) säilitamine

| Väli | Tüüp | Piirangud | Kirjeldus |
|------|------|-----------|-----------|
| id | INT | PK, AUTO_INCREMENT | Unikaalne tehingu identifikaator |
| transaction_id | VARCHAR(50) | NOT NULL, UNIQUE | Äriline tehingu ID |
| from_account_number | VARCHAR(50) | NOT NULL | Saatja kontonumber |
| to_account_number | VARCHAR(50) | NOT NULL, ≠ from | Saaja kontonumber |
| amount | DECIMAL(15,2) | > 0 | Tehingu summa |
| currency | ENUM | 'EUR', 'USD', 'GBP' | Tehingu valuuta |
| explanation | TEXT | NOT NULL | Tehingu selgitus |
| sender_name | VARCHAR(200) | NOT NULL | Saatja nimi |
| receiver_name | VARCHAR(200) | DEFAULT '' | Saaja nimi |
| status | ENUM | pending/inProgress/completed/failed | Tehingu olek |
| transaction_type | ENUM | internal/external/incoming | Tehingu tüüp |
| is_interbank | BOOLEAN | DEFAULT FALSE | Kas pangavaheline tehing |
| sender_bank_prefix | VARCHAR(10) | NULL | Saatja panga kood |
| receiver_bank_prefix | VARCHAR(10) | NULL | Saaja panga kood |
| initiated_by | INT | FK → users.id (NULL-able) | Tehingu algataja |

**Ajatemplid:**
- `created_at` - tehingu loomise aeg
- `completed_at` - lõpetamise aeg  
- `failed_at` - ebaõnnestumise aeg
- `received_at` - vastuvõtmise aeg (pangavaheliste jaoks)

### 4.4 Teised tabelid (lühikirjeldus)

**USER_SESSIONS:** JWT tokenite ja sessiooni haldus
- Seob kasutajad aktiivsete sessioonidega
- Automaatne cleanup aegunud sessioonide jaoks

**BANKS:** Registreeritud pangad pankadevaheliseks suhtluseks  
- Sisaldab JWKS URL-e avalike võtmete jaoks
- Viimase kontakteerimise aja jälgimine

**AUDIT_LOGS:** Kõigi kriitiliste tegevuste logimine
- JSON formaadis vana ja uus väärtus
- IP aadress ja User-Agent jälgimine

**SYSTEM_CONFIG:** Dünaamiline süsteemi konfiguratsioon
- Võimaldab seadistusi muuta ilma koodi muutmata
- Krüpteeritud väärtuste tugi

---

## 5. SQL-LAUSETE DOKUMENTATSIOON

### 5.1 Andmebaasi ja tabelite loomine

**Andmebaasi loomine:**
```sql
DROP DATABASE IF EXISTS bank_app;
CREATE DATABASE bank_app 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;
```

**Kasutajate tabeli näide:**
```sql
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
    
    INDEX idx_username (username),
    INDEX idx_email (email),
    INDEX idx_active (is_active)
) ENGINE=InnoDB COMMENT='Kasutajate põhiandmed ja autentimisinfo';
```

**Tehingute tabel koos piirangutega:**
```sql
CREATE TABLE transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    transaction_id VARCHAR(50) NOT NULL UNIQUE,
    from_account_number VARCHAR(50) NOT NULL,
    to_account_number VARCHAR(50) NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    currency ENUM('EUR', 'USD', 'GBP') NOT NULL,
    -- ... teised väljad
    
    FOREIGN KEY (initiated_by) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT chk_amount_positive CHECK (amount > 0),
    CONSTRAINT chk_different_accounts CHECK (from_account_number != to_account_number)
) ENGINE=InnoDB;
```

### 5.2 Andmete manipuleerimise näited

**INSERT näited:**
```sql
-- Uue kasutaja lisamine
INSERT INTO users (username, password_hash, first_name, last_name, email) 
VALUES ('mari.maasikas', '$2a$10$hashed_password', 'Mari', 'Maasikas', 'mari@email.ee');

-- Konto loomine
INSERT INTO accounts (account_number, owner_id, account_name, balance, currency)
VALUES ('TLU' + REPLACE(UUID(), '-', ''), 1, 'Mari põhikonto', 1500.00, 'EUR');

-- Tehingu loomine
INSERT INTO transactions (
    transaction_id, from_account_number, to_account_number,
    amount, currency, explanation, sender_name, receiver_name,
    status, transaction_type, initiated_by
) VALUES (
    'TRX' + UNIX_TIMESTAMP(NOW()) + FLOOR(RAND()*1000),
    'TLU123...', 'TLU456...', 250.00, 'EUR', 
    'Raamatu eest', 'Mari Maasikas', 'Jaan Tamm',
    'completed', 'internal', 1
);
```

**UPDATE näited:**
```sql
-- Kasutaja andmete uuendamine
UPDATE users 
SET first_name = 'Maria', 
    last_name = 'Maasikas-Kask',
    updated_at = NOW()
WHERE username = 'mari.maasikas';

-- Tehingu staatuse muutmine
UPDATE transactions 
SET status = 'completed',
    completed_at = NOW()
WHERE transaction_id = 'TRX123456';

-- Konto saldo uuendamine (stored procedure kaudu on turvalisem)
UPDATE accounts 
SET balance = balance + 100.00,
    updated_at = NOW()
WHERE account_number = 'TLU123...';
```

**DELETE näited:**
```sql
-- Aegunud sessiooni kustutamine
DELETE FROM user_sessions 
WHERE expires_at < NOW();

-- Vanade auditilogide puhastamine
DELETE FROM audit_logs 
WHERE created_at < DATE_SUB(NOW(), INTERVAL 1 YEAR);

-- Mitteaktiivse kasutaja kustutamine (CASCADE kustutab seotud andmed)
DELETE FROM users 
WHERE username = 'test_user' AND is_active = FALSE;
```

### 5.3 Keerukamad päringud

**Kasutajate tehingute kokkuvõte:**
```sql
SELECT 
    u.username,
    CONCAT(u.first_name, ' ', u.last_name) AS nimi,
    COUNT(t.id) AS tehingute_arv,
    SUM(CASE WHEN t.status = 'completed' THEN t.amount ELSE 0 END) AS kogusumma,
    AVG(CASE WHEN t.status = 'completed' THEN t.amount ELSE NULL END) AS keskmine
FROM users u
LEFT JOIN transactions t ON u.id = t.initiated_by
GROUP BY u.id
ORDER BY kogusumma DESC;
```

**Pangavaheliste tehingute analüüs:**
```sql
SELECT 
    b.bank_name,
    COUNT(CASE WHEN t.transaction_type = 'incoming' THEN 1 END) AS sissetulevad,
    COUNT(CASE WHEN t.transaction_type = 'external' THEN 1 END) AS väljaminevad,
    SUM(CASE WHEN t.transaction_type = 'incoming' THEN t.amount ELSE 0 END) AS sissetulev_summa
FROM banks b
LEFT JOIN transactions t ON b.bank_prefix = t.sender_bank_prefix 
                         OR b.bank_prefix = t.receiver_bank_prefix
WHERE t.is_interbank = TRUE
GROUP BY b.id;
```

---

## 6. TRANSAKTSIOONIDE KASUTAMINE

### 6.1 Transaktsioonide põhimõtted

Andmebaasis kasutatakse **ACID transaktsioonide** põhimõtteid tagamaks andmete järjepidevust:

- **Atomaarsus:** Kõik tehingu sammud õnnestuvad või kõik tühistatakse
- **Järjepidevus:** Andmebaas jääb enne ja pärast tehingut kehtivasse seisundisse  
- **Isoleeritus:** Paralleelsed tehingud ei mõjuta üksteist
- **Püsivus:** Kinnitatud muudatused säilivad süsteemi rikke korral

### 6.2 Sisemise tehingu töötlemine

**Stored procedure sisemise tehingu jaoks:**
```sql
DELIMITER //
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
    DECLARE exit handler FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        GET DIAGNOSTICS CONDITION 1 p_message = MESSAGE_TEXT;
        SET p_result = 'FAILED';
    END;

    START TRANSACTION;

    -- Kontrollime saatja kontot ja saldot
    SELECT balance INTO v_from_balance
    FROM accounts 
    WHERE account_number = p_from_account AND is_active = TRUE;

    IF v_from_balance IS NULL THEN
        SET p_result = 'FAILED';
        SET p_message = 'Saatja konto ei leitud';
        ROLLBACK;
        LEAVE ProcessInternalTransaction;
    END IF;

    IF v_from_balance < p_amount THEN
        SET p_result = 'FAILED';
        SET p_message = 'Ebapiisav saldo';
        ROLLBACK;
        LEAVE ProcessInternalTransaction;
    END IF;

    -- Uuendame saldosid
    UPDATE accounts SET balance = balance - p_amount 
    WHERE account_number = p_from_account;
    
    UPDATE accounts SET balance = balance + p_amount 
    WHERE account_number = p_to_account;

    -- Loome tehingu kirje
    INSERT INTO transactions (...) VALUES (...);

    COMMIT;
    SET p_result = 'SUCCESS';
    SET p_message = 'Tehing edukalt sooritatud';
END//
DELIMITER ;
```

### 6.3 Transaktsioonide kasutamise näited

**Rahaülekande näide:**
```sql
-- Käivitame procedure
CALL ProcessInternalTransaction(
    'TRX123456789',
    'TLU001...', 
    'TLU002...',
    100.00,
    'EUR', 
    'Raamatu eest',
    1,
    @result,
    @message
);

-- Kontrollime tulemust
SELECT @result AS tulemus, @message AS sõnum;
```

**Käsitsi transaktsioon (testimiseks):**
```sql
START TRANSACTION;

-- Kontrollime saldot
SELECT balance FROM accounts WHERE account_number = 'TLU001...' FOR UPDATE;

-- Kui saldo piisav, jätkame
UPDATE accounts SET balance = balance - 50.00 WHERE account_number = 'TLU001...';
UPDATE accounts SET balance = balance + 50.00 WHERE account_number = 'TLU002...';

INSERT INTO transactions (...) VALUES (...);

-- Kinnitame muudatused
COMMIT;

-- Vea korral: ROLLBACK;
```

### 6.4 Deadlock'ide vältimine

Transaktsioonides järgitakse **kindlat lukustamisjärjekorda**:
1. Esmalt lukustatakse saatja konto (`FOR UPDATE`)
2. Seejärel saaja konto
3. Alles siis uuendatakse saldosid

Selle lähenemisega väldime deadlock-situatsioone, kus kaks tehingut proovivad samu kontosid vastupidises järjekorras lukustada.

---

## 7. KASUTAJATE JA ÕIGUSTE HALDUS

### 7.1 Kasutajarollide määratlemine

Andmebaasile on loodud **5 erinevat kasutajarolli** erinevate vastutusaladega:

**1. bank_admin (Administraator)**
- Täielik kontroll andmebaasi üle
- Kasutajate loomine ja kustutamine  
- Andmebaasi struktuuri muutmine
- Varukoopiate loomine

**2. bank_app (Rakenduse kasutaja)**
- CRUD operatsioonid äritabelites
- Stored procedure'ide täitmine
- Auditilogide kirjutamine (mitte lugemine)

**3. bank_backup (Varukoopia kasutaja)**
- Ainult lugemisõigused kõigile tabelitele
- Tabelite lukustamine backup'i ajaks

**4. bank_monitor (Monitooringu kasutaja)**  
- Lugemisõigused auditilogidele ja tehingutele
- Süsteemi protsesside jälgimine

**5. bank_reporter (Raporti kasutaja)**
- Piiratud lugemisõigused (välja arvatud tundlikud andmed)
- Ärianalüüsi päringute jaoks

### 7.2 Kasutajate loomine

```sql
-- Administraatori kasutaja
CREATE USER 'bank_admin'@'%' IDENTIFIED BY 'AdminSecure2025!';
GRANT ALL PRIVILEGES ON bank_app.* TO 'bank_admin'@'%';
GRANT CREATE USER ON *.* TO 'bank_admin'@'%';

-- Rakenduse kasutaja
CREATE USER 'bank_app'@'%' IDENTIFIED BY 'AppSecure2025!';
GRANT SELECT, INSERT, UPDATE, DELETE ON bank_app.users TO 'bank_app'@'%';
GRANT SELECT, INSERT, UPDATE, DELETE ON bank_app.accounts TO 'bank_app'@'%';
GRANT SELECT, INSERT, UPDATE, DELETE ON bank_app.transactions TO 'bank_app'@'%';
GRANT EXECUTE ON PROCEDURE bank_app.ProcessInternalTransaction TO 'bank_app'@'%';

-- Varukoopia kasutaja  
CREATE USER 'bank_backup'@'%' IDENTIFIED BY 'BackupSecure2025!';
GRANT SELECT ON bank_app.* TO 'bank_backup'@'%';
GRANT LOCK TABLES ON bank_app.* TO 'bank_backup'@'%';

-- Monitooringu kasutaja
CREATE USER 'bank_monitor'@'%' IDENTIFIED BY 'MonitorSecure2025!';
GRANT SELECT ON bank_app.audit_logs TO 'bank_monitor'@'%';
GRANT SELECT ON bank_app.transactions TO 'bank_monitor'@'%';
GRANT PROCESS ON *.* TO 'bank_monitor'@'%';

-- Raporti kasutaja (välistab paroolid ja tokenid)
CREATE USER 'bank_reporter'@'%' IDENTIFIED BY 'ReportSecure2025!';
GRANT SELECT (id, username, first_name, last_name, email, is_active, created_at) 
    ON bank_app.users TO 'bank_reporter'@'%';
GRANT SELECT ON bank_app.accounts TO 'bank_reporter'@'%';
GRANT SELECT ON bank_app.transactions TO 'bank_reporter'@'%';
```

### 7.3 Õiguste jagamise põhimõtted

**Minimaalne vajalik ligipääs:**
- Iga kasutaja saab ainult sellised õigused, mis on tema töö jaoks hädavajalikud
- Tundlikke andmeid (paroolid, tokenid) pääsevad lugema ainult vajalikud kasutajad

**Separatsioon:**
- Rakenduse kasutaja ei saa administraatori õigusi
- Monitooringu kasutaja ei saa andmeid muuta
- Backup kasutaja ei saa süsteemi protsesse mõjutada

**Rollijaotus:**
- **Tootmine:** ainult bank_app kasutaja
- **Monitooring:** bank_monitor ja bank_reporter
- **Haldus:** bank_admin (ainult hädavajadusel)
- **Varukoopiad:** automatiseeritud bank_backup kasutajaga

### 7.4 Turvalisuse tagamine

**Paroolide poliitika:**
- Kõik paroolid on vähemalt 12 tähemärki
- Sisaldavad suuri-väikesi tähti, numbreid ja sümboleid
- Regulaarne paroolide vahetus (iga 90 päeva)

**Võrguturvalisus:**
- Kasutajad on piiratud IP-aadresside või hostidega (% saab asendada konkreetsete IP-dega)
- SSL/TLS sunduslik ühenduste jaoks
- VPN nõue tootmiskeskkonna jaoks

**Auditimine:**
- Kõik õiguste muudatused logitakse
- Regulaarne kasutajate ülevaatus
- Mittevajalike kasutajate deaktiveerimine

---

## 8. ANDMETE EKSPORT JA IMPORT

### 8.1 Ekspordi operatsioonid

**Täieliku andmebaasi eksportimine:**
```bash
# Kõik andmed, struktuur, trigerid ja protseduurid
mysqldump -u bank_admin -p \
    --single-transaction \
    --routines \
    --triggers \
    --add-drop-database \
    --databases bank_app > bank_app_full_backup.sql
```

**Ainult andmete eksportimine:**
```bash
# Ilma tabelite struktuurita
mysqldump -u bank_backup -p \
    --no-create-info \
    --single-transaction \
    bank_app > bank_app_data_only.sql
```

**Struktuuri eksportimine:**
```bash  
# Ainult tabelite struktuur, indeksid, trigerid
mysqldump -u bank_admin -p \
    --no-data \
    --routines \
    --triggers \
    bank_app > bank_app_structure_only.sql
```

**Konkreetsete tabelite eksportimine:**
```bash
# Ainult kriitilised tabelid
mysqldump -u bank_backup -p \
    --single-transaction \
    bank_app users accounts transactions > core_tables_backup.sql
```

### 8.2 Impordi operatsioonid

**Täieliku varukoopia taastamine:**
```bash
# Kõigepealt andmebaasi taastamine
mysql -u bank_admin -p < bank_app_full_backup.sql

# Või olemasolevasse andmebaasi
mysql -u bank_admin -p bank_app < bank_app_full_backup.sql
```

**Uue andmebaasi loomine ja importimine:**
```bash
# 1. Loo uus andmebaas
mysql -u bank_admin -p -e "CREATE DATABASE bank_app_restore;"

# 2. Impordi struktuur
mysql -u bank_admin -p bank_app_restore < bank_app_structure_only.sql

# 3. Impordi andmed
mysql -u bank_admin -p bank_app_restore < bank_app_data_only.sql
```

### 8.3 Automatiseeritud varukoopia süsteem

**Varukoopia skript (backup_bank_app.sh):**
```bash
#!/bin/bash

# Seadistused
DB_NAME="bank_app"
DB_USER="bank_backup" 
DB_PASS="BackupSecure2025!"
BACKUP_DIR="/backups/bank_app"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/bank_app_backup_$DATE.sql"

# Loo varukoopia kataloog
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

# Kustuta vanad varukoopiad (üle 7 päeva)
find $BACKUP_DIR -name "*.sql.gz" -mtime +7 -delete

# Logi tulemus
if [ $? -eq 0 ]; then
    echo "$(date): Varukoopia edukas - $BACKUP_FILE.gz" >> /var/log/bank_app_backup.log
else
    echo "$(date): Varukoopia ebaõnnestus" >> /var/log/bank_app_backup.log
fi
```

**Crontab seadistus automaatseks varukoopi:**
```bash
# Iga päev kell 02:00
0 2 * * * /scripts/backup_bank_app.sh

# Nädalavahetustel täielik varukoopia
0 3 * * 0 /scripts/full_backup_bank_app.sh
```

### 8.4 Katastroofi taastamine

**Taastamise sammud:**

1. **Kiire hinnang:**
```sql
-- Kontrolli andmebaasi olemasolu
SHOW DATABASES LIKE 'bank_app';

-- Kontrolli tabelite olemasolu  
USE bank_app;
SHOW TABLES;

-- Kontrolli andmete terviklust
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM accounts;
SELECT COUNT(*) FROM transactions;
```

2. **Täielik taastamine:**
```bash
# 1. Peata rakendus
sudo systemctl stop bank-app

# 2. Varunda katkenud andmebaas (kui võimalik)
mysqldump -u bank_admin -p bank_app > corrupted_backup.sql

# 3. Kustuta vigane andmebaas
mysql -u bank_admin -p -e "DROP DATABASE bank_app;"

# 4. Taasta viimasest varukoopisest
gunzip -c /backups/bank_app/bank_app_backup_YYYYMMDD_HHMMSS.sql.gz | mysql -u bank_admin -p

# 5. Käivita rakendus
sudo systemctl start bank-app
```

### 8.5 Andmete migreerimise protseduurid

**Vanemate tehingute arhiveerimine:**
```sql
DELIMITER //
CREATE PROCEDURE ArchiveOldTransactions(IN p_days_old INT)
BEGIN
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
DELIMITER ;

-- Kasutamine: arhiveeri tehingud, mis on vanemad kui 365 päeva
CALL ArchiveOldTransactions(365);
```

---

## 9. SEOTUS VEEBIRAKENDUSEGA

### 9.1 REST API integratsioon

Loodud SQL andmebaas integreerub internetipanga veebirakendusega järgmiselt:

**Primaarene andmebaas (MongoDB):**
- Node.js rakendus kasutab peamiselt MongoDB't Mongoose ODM kaudu
- Käitusaegne andmete salvestamine ja päringud

**Sekundaarne andmebaas (MySQL):**  
- Andmeanalüütika ja aruandlus
- Struktureeritud päringud ja keerukad JOIN operatsioonid
- Audit trail ja compliance nõuete täitmine

### 9.2 Andmete sünkroniseerimine

**MongoDB → MySQL sünkroniseerimine:**

Node.js teenuses on implementeeritud sünkroniseerija, mis kopeerib andmeid MongoDB'st MySQL'i:

```javascript
// Pseudo-code sünkroniseerimise jaoks
class DataSynchronizer {
    async syncUserData(mongoUser) {
        const sql = `
            INSERT INTO users (username, password_hash, first_name, last_name, email, created_at)
            VALUES (?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
            first_name = VALUES(first_name),
            last_name = VALUES(last_name),
            email = VALUES(email)
        `;
        
        await this.mysql.execute(sql, [
            mongoUser.username,
            mongoUser.password,
            mongoUser.firstName, 
            mongoUser.lastName,
            mongoUser.email,
            mongoUser.createdAt
        ]);
    }
    
    async syncTransactionData(mongoTransaction) {
        const sql = `
            INSERT INTO transactions (
                transaction_id, from_account_number, to_account_number,
                amount, currency, explanation, status, transaction_type, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        await this.mysql.execute(sql, [
            mongoTransaction.transactionId,
            mongoTransaction.fromAccount,
            mongoTransaction.toAccount,
            mongoTransaction.amount,
            mongoTransaction.currency,
            mongoTransaction.explanation,
            mongoTransaction.status,
            mongoTransaction.type,
            mongoTransaction.createdAt
        ]);
    }
}
```

### 9.3 API endpointide näited

**Kasutajate päring (analüütika):**
```javascript
// GET /api/analytics/users-summary
app.get('/api/analytics/users-summary', async (req, res) => {
    const sql = `
        SELECT 
            u.username,
            CONCAT(u.first_name, ' ', u.last_name) AS full_name,
            COUNT(a.id) AS accounts_count,
            SUM(a.balance) AS total_balance,
            COUNT(t.id) AS transactions_count
        FROM users u
        LEFT JOIN accounts a ON u.id = a.owner_id
        LEFT JOIN transactions t ON u.id = t.initiated_by
        WHERE u.is_active = TRUE
        GROUP BY u.id
        ORDER BY total_balance DESC
    `;
    
    const results = await mysql.execute(sql);
    res.json({ status: 'success', data: results });
});
```

**Tehingute aruanne:**
```javascript
// GET /api/reports/transactions
app.get('/api/reports/transactions', async (req, res) => {
    const { startDate, endDate, type } = req.query;
    
    const sql = `
        SELECT 
            DATE(created_at) as date,
            transaction_type,
            COUNT(*) as count,
            SUM(amount) as total_amount,
            AVG(amount) as avg_amount
        FROM transactions
        WHERE created_at BETWEEN ? AND ?
        ${type ? 'AND transaction_type = ?' : ''}
        GROUP BY DATE(created_at), transaction_type
        ORDER BY date DESC
    `;
    
    const params = [startDate, endDate];
    if (type) params.push(type);
    
    const results = await mysql.execute(sql, params);
    res.json({ status: 'success', data: results });
});
```

### 9.4 Pangavahelise tehingu näide

**Välimine ülekanne (REST API kaudu):**

1. **Kasutaja algatab tehingu frontend'is:**
```javascript
// Frontend JavaScript
const transferData = {
    fromAccount: 'TLU123...',
    toAccount: 'SWE456...',
    amount: 500.00,
    currency: 'EUR',
    explanation: 'Arvele maksminek'
};

fetch('/api/transactions/external', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: JSON.stringify(transferData)
});
```

2. **Backend töötleb tehingu:**
```javascript
// Node.js Express kontrolleriles
app.post('/api/transactions/external', authenticate, async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
        // 1. Kontrolli saldot MongoDB's
        const fromAccount = await Account.findOne({ 
            accountNumber: req.body.fromAccount 
        });
        
        if (fromAccount.balance < req.body.amount) {
            throw new Error('Insufficient funds');
        }
        
        // 2. Loo tehing MongoDB's
        const transaction = new Transaction({
            transactionId: generateTransactionId(),
            fromAccount: req.body.fromAccount,
            toAccount: req.body.toAccount,
            amount: req.body.amount,
            // ...
            status: 'pending',
            type: 'external'
        });
        
        await transaction.save({ session });
        
        // 3. Sünkroniseeri MySQL'i (analüütika jaoks)
        await syncTransactionToMySQL(transaction);
        
        // 4. Saada teisele pangale
        await interbankService.sendTransaction(transaction);
        
        await session.commitTransaction();
        res.json({ status: 'success', transaction });
        
    } catch (error) {
        await session.abortTransaction();
        res.status(400).json({ status: 'error', message: error.message });
    }
});
```

3. **MySQL andmebaasis kajastub:**
```sql
-- Automaatselt sünkroniseeritud kirje
INSERT INTO transactions (
    transaction_id, from_account_number, to_account_number,
    amount, currency, explanation, status, transaction_type,
    is_interbank, sender_bank_prefix, receiver_bank_prefix, created_at
) VALUES (
    'TRX1692968400123', 'TLU123...', 'SWE456...',
    500.00, 'EUR', 'Arvele maksminek', 'pending', 'external',
    TRUE, 'TLU', 'SWE', NOW()
);
```

### 9.5 Reaalajas monitooring

**WebSocket integratsioon tehingute jälgimiseks:**
```javascript
// Reaalajas tehingute staatuse uuendamine
io.on('connection', (socket) => {
    socket.on('subscribe-transactions', (userId) => {
        // Kuula MongoDB change stream'i
        const changeStream = db.collection('transactions')
            .watch([{ $match: { 'fullDocument.initiatedBy': userId }}]);
            
        changeStream.on('change', async (change) => {
            // Sünkroniseeri MySQL'i
            await syncTransactionToMySQL(change.fullDocument);
            
            // Saada uuendus kliendile
            socket.emit('transaction-update', change.fullDocument);
        });
    });
});
```

---

## 10. KOKKUVÕTE JA ÕPPIMISED

### 10.1 Projekti tulemused

Käesoleva töö raames lõin edukalt **tervikliku relatsiooniaalse andmebaasi** internetipanga rakendusele, mis:

✅ **Vastab kõigile ülesande nõuetele:**
- 7 omavahel seotud tabelit koos ER-diagrammi kirjeldusega
- Täielik SQL struktuur koos andmetüüpide ja piirangutega  
- Stored procedure'id transaktsioonide töötlemiseks
- 5 kasutajarolli erinevate õigustega
- Automaatse varukoopia ja taastamise süsteem
- Integratsioon veebirakendusega

✅ **Tehnilised saavutused:**
- 3NF normaliseerimise tase
- ACID transaktsioonide toetus
- Täielik auditilogimise süsteem
- Optimiseeritud indeksid jõudluseks
- Turvalisuse meetmed (rollid, õigused, krüpteerimine)

✅ **Äriloogika realiseerimine:**
- Pangakontode haldus mitmes valuutas
- Sisemised ja pangavahelised tehingud
- Kasutajate autentimine ja sessioonihaldus
- Keskpanga integratsioon

### 10.2 Peamised õppimised

**Tehnilised oskused:**

1. **Andmebaasi disain:** Õppisin tähtsust andmemudeli hoolikast planeerimisest. Normaliseerimise protsess aitas elimineerida andmete dubleerimist ja tagada tervikluse.

2. **Transaktsioonid:** Mõistsin ACID põhimõtete kriitilisust finantssektoris. Stored procedure'ide kasutamine tagab andmete järjepidevuse ja vähendab äriloogika duplikatsiooni.

3. **Turvalisus:** Õiguste haldus ja rollipõhine ligipääs on hädavajalik. Iga kasutaja peab saama minimaalsed vajalikud õigused.

4. **Jõudlus:** Õigete indeksite valimine mõjutab oluliselt päringute kiirust. Composite indeksid on eriti kasulikud keerukate JOIN operatsioonide jaoks.

**Ärianalüüs:**

1. **Nõuete mõistmine:** Internetipanga konteksti mõistmine oli võtmetähtsusega õige andmemudeli loomiseks.

2. **Skaleeruvus:** Planeerihtoris arhitektuur MongoDB (kiirus) + MySQL (analüütika) kombinatsiooniga.

3. **Compliance:** Panganduses on auditilogide ja tehingute jälgitavus seaduslikult kohustuslik.

### 10.3 Väljakutsed ja lahendused

**Suurimad väljakutsed:**

1. **Andmemudeli normaliseerimine:**
   - **Probleem:** Algne mudel sisaldas liigseid sõltuvusi
   - **Lahendus:** Süstemaatiline normaliseerimise protsess ja seoste ülevaatamine

2. **Transaktsioonide keerukus:**
   - **Probleem:** Pangavaheliste tehingute staatuste haldus
   - **Lahendus:** Stored procedure'id ja selged state machine'id

3. **Turvalisuse tasakaal:**
   - **Probleem:** Piisav turvalisus vs kasutatavus
   - **Lahendus:** Rollipõhine süsteem minimaalsete õigustega

4. **Jõudluse optimeerimine:**
   - **Probleem:** Suured andmemahud võivad päringuid aeglustada
   - **Lahendus:** Strateegilised indeksid ja arhiveerimise protseduurid

### 10.4 Edasiarendamise võimalused

**Lähitulevikus:**

1. **Andmete partitsioneerimise** lisamine suurte tehingumahutuste jaoks
2. **Read replica'd** analüütiliste päringute jaoks
3. **Cached protseduurid** sagedaste operatsioonide kiirendamiseks
4. **Automaatne monitooring** ja alerting süsteem

**Pikemas perspektiivis:**

1. **Machine Learning integratsioon** pettuste tuvastamiseks
2. **Real-time analytics** dashboard tehingute jälgimiseks  
3. **Multi-master replikatsioon** kõrgema käideldavuse jaoks
4. **Cloud-native arhitektuur** skaleeruvuse parandamiseks

### 10.5 Mida teeksin teisiti

**Retrospektiiv:**

1. **Varasem CASE tööriistade kasutamine:** MySQL Workbench installimine projekti alguses oleks võimaldanud visuaalsete ER-diagrammide loomist.

2. **Rohkem test-andmeid:** Suurema mahuga näidisandmed oleksid aidanud jõudluse testimisel ja optimiseerimise vajaduste tuvastamisel.

3. **Automatiseeritud testimine:** Unit testide kirjutamine stored procedure'idele ja trigger'itele oleks suurendanud koodi kvaliteeti.

4. **Dokumentatsiooni jätkuv uuendamine:** Paralleelne dokumentatsiooni kirjutamine koodi loomisega tagaks täpsema ja ajakohasema info.

**Oluline õppetund:** Andmebaasi disain on iteratiivne protsess. Esmased otsused mõjutavad kogu süsteemi edasist arengut, seega tasub investeerida aega põhjalikusse planeerimisse ja dokumenteerimisse.

---

## LISAD

### Lisa A: SQL Skriptide Struktuur
```
database/
├── 01_create_database.sql      # Andmebaasi loomine
├── 02_create_tables.sql        # Tabelite struktuur
├── 03_create_triggers_procedures.sql  # Trigerid ja protseduurid
├── 04_create_users_permissions.sql    # Kasutajad ja õigused
├── 05_insert_sample_data.sql   # Näidisandmed
├── 06_backup_restore_procedures.sql   # Varukoopia süsteem
└── 07_sample_queries.sql       # Testpäringud
```

### Lisa B: Kasutatavad tehnoloogiad
- **Andmebaasimootor:** MySQL 8.0+ (InnoDB)
- **Programmeerimskesel:** SQL (DDL, DML, DCL)
- **Versioonihaldus:** Git
- **Dokumentatsioon:** Markdown
- **Varukoopia:** mysqldump + bash skriptid

### Lisa C: Viited ja allikad
- MySQL Official Documentation: https://dev.mysql.com/doc/
- Database Design Best Practices
- Banking Industry Standards (PCI DSS, Basel III)
- ACID Transaction Principles

---

**Dokument on loodud 25. augustil 2025**  
**Projektifailid on saadaval:** `/home/lembit/WebstormProjects/bank-app-js/database/`
