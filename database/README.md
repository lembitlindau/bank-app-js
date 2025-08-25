# Internetipanga Andmebaasi Projekt

Täielik SQL andmebaasi implementatsioon internetipanga veebirakendusele vastavalt ülesande nõuetele.

## 📁 Projektifailide struktuur

```
database/
├── 01_create_database.sql              # Andmebaasi loomine
├── 02_create_tables.sql                # 7 tabeli struktuur
├── 03_create_triggers_procedures.sql   # Triggerid ja stored procedures
├── 04_create_users_permissions.sql     # 5 kasutajarolli ja õigused
├── 05_insert_sample_data.sql           # Näidisandmed testimiseks
├── 06_backup_restore_procedures.sql    # Varukoopia süsteem
├── 07_sample_queries.sql               # Testpäringud ja näited
├── ER_DIAGRAM_TEXT.sql                 # ER-diagrammi tekstiline esitus
├── install_database.sh                 # Automaatne paigaldamise skript
├── ANDMEBAASI_DOKUMENTATSIOON.md       # Täielik dokumentatsioon
└── README.md                           # See fail
```

## 🚀 Kiire alustamine

### 1. Automaatne paigaldamine

```bash
# 1. Mine andmebaasi kataloogi
cd database/

# 2. Käivita automaatne paigaldamise skript
./install_database.sh
```

### 2. Käsitsi paigaldamine

```bash
# Käivita skriptid järjekorras:
mysql -u root -p < 01_create_database.sql
mysql -u root -p < 02_create_tables.sql  
mysql -u root -p < 03_create_triggers_procedures.sql
mysql -u root -p < 04_create_users_permissions.sql
mysql -u root -p < 05_insert_sample_data.sql
mysql -u root -p < 06_backup_restore_procedures.sql
```

## 📊 Andmebaasi struktuur

### Tabelid (7 tk)
1. **users** - Kasutajate põhiandmed ja autentimine
2. **user_sessions** - JWT tokenite ja sessiooni haldus  
3. **accounts** - Pangakontod erinevates valuutades
4. **transactions** - Kõik tehingud (sisemised, välised, pangavahelised)
5. **banks** - Registreeritud pangad pankadevaheliseks suhtluseks
6. **audit_logs** - Täielik auditijälje logimine
7. **system_config** - Dünaamiline süsteemi konfiguratsioon

### Kasutajarollid (5 tk)
- **bank_admin** - Täielik kontroll (parool: AdminSecure2025!)
- **bank_app** - Rakenduse kasutaja CRUD õigustega (parool: AppSecure2025!)
- **bank_backup** - Varukoopia kasutaja (parool: BackupSecure2025!)
- **bank_monitor** - Monitooringu kasutaja (parool: MonitorSecure2025!)
- **bank_reporter** - Raporti kasutaja (parool: ReportSecure2025!)

## 🔧 Funktsioonid

### Stored Procedures
- `ProcessInternalTransaction()` - Sisemiste tehingute turvaline töötlemine
- `CheckAccountBalance()` - Konto saldo kontrollimine
- `ArchiveOldTransactions()` - Vanemate tehingute arhiveerimine
- `CleanupInactiveUsers()` - Mitteaktiivsete kasutajate puhastamine

### Functions
- `GenerateTransactionId()` - Unikaalse tehingu ID genereerimine
- `GenerateAccountNumber()` - Kontonumbri genereerimine

### Triggers
- Automaatne auditilogide loomine (users, accounts, transactions)
- Andmete tervikluse kontrollimine

## 💾 Varukoopia ja taastamine

### Varukoopia loomine
```bash
# Täielik varukoopia
mysqldump -u bank_backup -p --single-transaction --routines --triggers bank_app > backup.sql

# Automaatne varukoopia (crontab)
0 2 * * * /scripts/backup_bank_app.sh
```

### Taastamine  
```bash
# Täielik taastamine
mysql -u bank_admin -p bank_app < backup.sql
```

## 🔍 Testimine

### Testpäringud
```bash
# Käivita testpäringud
mysql -u bank_app -p bank_app < 07_sample_queries.sql
```

### Näidisandmed
- 5 test kasutajat koos kontodega
- Erinevat tüüpi tehingud (sisemised, välised, pangavahelised)
- 5 registreeritud panka
- Süsteemi konfiguratsioon

## 📈 Jõudlus ja skaleeruvus

### Indeksid
- Kõik primaarvõtmed ja välisvõtmed
- Unikaalsed väljad (username, email, account_number)
- Otsinguvväljad (status, currency, bank_prefix)
- Composite indeksid sagedastele päringutele

### Optimeerimine
- InnoDB mootor ACID transaktsioonide jaoks
- Partitsioneerimise võimalus suurte andmemahtude jaoks
- Arhiveerimise protseduurid jõudluse säilitamiseks

## 🔒 Turvalisus

### Õiguste haldus
- Minimaalsete õiguste põhimõte
- Rollijaotus vastutusalade järgi
- Tundlike andmete kaitse

### Auditimine
- Kõik kriitilised tegevused logitud
- JSON formaadis vana/uus väärtus
- IP aadress ja User-Agent jälgimine

### Andmete terviklus
- Referentsiaalse tervikluse piirangud
- Äriloogika CHECK constraints
- Transaktsioonide kasutamine

## 🌐 Integratsioon veebirakendusega

### REST API tugi
- MongoDB (peamine) + MySQL (analüütika) arhitektuur
- Reaalajas andmete sünkroniseerimine
- Struktureeritud päringute tugi

### Pangavaheline protokoll
- JWT allkirjastamise tugi
- JWKS võtmete vahetus
- Keskpanga integratsioon

## 📚 Dokumentatsioon

### Põhiline dokumentatsioon
- `ANDMEBAASI_DOKUMENTATSIOON.md` - Täielik 10-peatükiga dokumentatsioon
- `ER_DIAGRAM_TEXT.sql` - Tekstiline ER-diagramm koos selgitustega

### Vastavus ülesande nõuetele
✅ Vähemalt 5 seostatud tabelit (7 tk)  
✅ Sobivad andmetüübid ja suurused  
✅ ER-diagramm (tekstiline esitus)  
✅ UML/ER metoodika kasutamine  
✅ CREATE TABLE lauseid  
✅ INSERT/UPDATE/DELETE näited  
✅ Transaktsioonide kasutamine  
✅ Kasutajad ja õiguste haldus  
✅ Eksport/import operatsioonid  
✅ Seotus veebirakendusega  
✅ Täielik dokumentatsioon  

## 🎯 Eesmärk

See andmebaas toetab internetipanga veebirakendust, võimaldades:
- Kasutajate turvalist autentimist
- Pangakontode haldamist mitmes valuutas
- Sisemisi ja pangavahelisi tehinguid
- Täielikku auditilogimist
- Integreerimist keskpanga süsteemiga

## 👥 Autor

**Lembit Lindau**  
TAK24 grupp  
25. august 2025

---

**Märkus:** See projekt on loodud hariduslikel eesmärkidel ja vastab kõigile ülesande kriteeriumidele.
