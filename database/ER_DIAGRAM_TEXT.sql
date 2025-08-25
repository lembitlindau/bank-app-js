-- ========================================================
-- ER-DIAGRAMMI TEKSTILINE ESITUS
-- Andmebaasi struktuur ja seosed
-- ========================================================

/*
=============================================================================
                         INTERNETIPANGA ANDMEBAASI ER-DIAGRAMM
=============================================================================

ENTITEEDID JA NENDE ATRIBUUDID:
═══════════════════════════════

┌─────────────────────┐
│       USERS         │ 🟦 (Kasutajad)
├─────────────────────┤
│ 🔑 id (PK)          │
│ 🔒 username (UK)    │
│ 🔒 email (UK)       │
│    password_hash    │
│    first_name       │
│    last_name        │
│    is_active        │
│    last_login       │
│    created_at       │
│    updated_at       │
└─────────────────────┘
           │
           │ 1:N (owner)
           ▼
┌─────────────────────┐
│      ACCOUNTS       │ 🟩 (Kontod)
├─────────────────────┤
│ 🔑 id (PK)          │
│ 🔗 owner_id (FK)    │
│ 🔒 account_number   │
│    account_name     │
│    balance          │
│    currency         │
│    is_active        │
│    created_at       │
│    updated_at       │
└─────────────────────┘
           │
           │ N:M (account references)
           ▼
┌─────────────────────┐
│    TRANSACTIONS     │ 🟨 (Tehingud)
├─────────────────────┤
│ 🔑 id (PK)          │
│ 🔒 transaction_id   │
│    from_account_num │
│    to_account_num   │
│    amount           │
│    currency         │
│    explanation      │
│    sender_name      │
│    receiver_name    │
│    status           │
│    transaction_type │
│    is_interbank     │
│    sender_bank_pref │
│    receiver_bank_prf│
│ 🔗 initiated_by(FK) │
│    completed_at     │
│    failed_at        │
│    received_at      │
│    created_at       │
│    updated_at       │
└─────────────────────┘
           ▲
           │ N:1 (initiator)
           │
┌─────────────────────┐
│       USERS         │ (sama tabel, erinev roll)
└─────────────────────┘

┌─────────────────────┐
│   USER_SESSIONS     │ 🟪 (Sessioonid)
├─────────────────────┤
│ 🔑 id (PK)          │
│ 🔗 user_id (FK)     │
│ 🔒 token_hash       │
│    expires_at       │
│    created_at       │
└─────────────────────┘
           ▲
           │ N:1
           │
┌─────────────────────┐
│       USERS         │
└─────────────────────┘

┌─────────────────────┐
│       BANKS         │ 🟫 (Pangad)
├─────────────────────┤
│ 🔑 id (PK)          │
│ 🔒 bank_prefix (UK) │
│    bank_name        │
│    base_url         │
│    jwks_url         │
│    api_key          │
│    is_active        │
│    last_contacted   │
│    created_at       │
│    updated_at       │
└─────────────────────┘
           │
           │ 1:N (interbank txns)
           ▼
┌─────────────────────┐
│    TRANSACTIONS     │
│ (interbank subset)  │
└─────────────────────┘

┌─────────────────────┐
│    AUDIT_LOGS       │ 🟧 (Auditilogid)
├─────────────────────┤
│ 🔑 id (PK)          │
│ 🔗 user_id (FK)     │
│    action           │
│    table_name       │
│    record_id        │
│    old_values (JSON)│
│    new_values (JSON)│
│    ip_address       │
│    user_agent       │
│    created_at       │
└─────────────────────┘
           ▲
           │ N:1 (optional)
           │
┌─────────────────────┐
│       USERS         │
└─────────────────────┘

┌─────────────────────┐
│   SYSTEM_CONFIG     │ ⬜ (Konfiguratsioon)
├─────────────────────┤
│ 🔑 id (PK)          │
│ 🔒 config_key (UK)  │
│    config_value     │
│    description      │
│    is_encrypted     │
│    created_at       │
│    updated_at       │
└─────────────────────┘
         (standalone)

SEOSTE KIRJELDUS:
═════════════════

1. USERS ←→ ACCOUNTS (1:N)
   - Iga kasutajal võib olla mitu kontot
   - Igal kontol on täpselt üks omanik
   - Kaskaaduv kustutamine: kasutaja kustutamisel kustuvad kontod

2. USERS ←→ USER_SESSIONS (1:N)
   - Kasutajal võib olla mitu aktiivset sessiooni
   - Iga sessioon kuulub ühele kasutajale
   - Kaskaaduv kustutamine: kasutaja kustutamisel kustuvad sessioonid

3. USERS ←→ TRANSACTIONS (1:N) [initiated_by]
   - Kasutaja saab algatada mitu tehingut
   - Iga tehing on algatatud ühe kasutaja poolt
   - SET NULL: kasutaja kustutamisel tehingud jäävad, kuid initiated_by = NULL

4. ACCOUNTS ←→ TRANSACTIONS (N:M)
   - Konto võib osaleda mitmes tehingus (saatja või saaja rollis)
   - Tehing seob täpselt kaks kontot (from_account, to_account)
   - Seotud läbi account_number väljatete

5. BANKS ←→ TRANSACTIONS (1:N) [interbank]
   - Pank võib osaleda mitmes pangavahelises tehingus
   - Iga pangavaheline tehing seob kaks panka
   - Seotud läbi bank_prefix väljatete

6. USERS ←→ AUDIT_LOGS (1:N) [optional]
   - Kasutaja tegevused logitakse audit_logs tabelis
   - Mõned logid võivad olla süsteemi poolt (user_id = NULL)
   - SET NULL: kasutaja kustutamisel logid säilivad

ANDMETÜÜBID JA PIIRANGUD:
═════════════════════════

📊 ANDMETÜÜBID:
   - INT: täisarvud (ID-d, kogused)
   - VARCHAR: tekstiväljad fikseeritud max pikkusega
   - TEXT: pikamat teksti (explanation, error_message)
   - DECIMAL(15,2): rahasummad (täpsed arvutused)
   - BOOLEAN: jah/ei väärtused
   - ENUM: eelmääratud valikud (status, currency)
   - TIMESTAMP: ajatemplid automaatse uuendamisega
   - DATETIME: käsitsi seatud kuupäevad/ajad
   - JSON: struktureeritud andmed (audit_logs)

🔒 PIIRANGUD:
   - PRIMARY KEY: unikaalne identifikaator
   - FOREIGN KEY: referentsiaalse tervikluse tagamine
   - UNIQUE: unikaalsuse tagamine (username, email, account_number)
   - NOT NULL: kohustuslikud väljad
   - CHECK: äriloogika piirangud (balance ≥ 0, amount > 0)
   - DEFAULT: vaikeväärtused

⚡ INDEKSID:
   - Primaarvõtmed: automaatselt indekseeritud
   - Välisvõtmed: automaatselt indekseeritud
   - Unikaalsed väljad: automaatselt indekseeritud
   - Otsinguvväljad: käsitsi loodud indeksid (username, email, account_number)
   - Filtreerimisväljad: composite indeksid (status + type, currency + balance)

NORMALISEERIMISE TASE:
═════════════════════

✅ 1NF (First Normal Form):
   - Kõik väljad sisaldavad atomaarseid väärtusi
   - Ei ole korduvaid gruppe ega järjendeid
   - Iga rea identifikaator (primaarvõti) on olemas

✅ 2NF (Second Normal Form):
   - 1NF + elimineeritud osalised funktsionaalsed sõltuvused
   - Kõik mitte-võtme atribuudid sõltuvad täielikult primaarvõtmest
   - Näide: user andmed on eraldi tablis, mitte accounts tabelis

✅ 3NF (Third Normal Form):
   - 2NF + elimineeritud transitiivsed sõltuvused
   - Mitte-võtme atribuudid ei sõltu üksteisest
   - Näide: bank_name ei ole dubleeritud transactions tabelis

ÄRILOOGIKA SEOSTE KAUDU:
════════════════════════

🏦 KASUTAJA → KONTOD:
   - Kasutaja registreerub süsteemi
   - Loob endale ühe või mitu kontot
   - Iga konto kuulub ainult ühele kasutajale

💳 KONTOD → TEHINGUD:
   - Tehingud toimuvad kontode vahel
   - Konto võib olla saatja või saaja rollis
   - Saldo uuendatakse tehingu alusel

🔄 PANGAVAHELINE SUHTLUS:
   - Tehingud võivad toimuda teiste pankade kontodele
   - Bank prefix määrab panga kuuluvuse
   - JWKS protokoll võtmete vahetamiseks

📊 AUDITEERIMINE:
   - Kõik olulised tegevused logitakse
   - Kasutaja tegevused on jälgitavad
   - Süsteemi tegevused (user_id = NULL) ka logitud

⚙️ KONFIGURATSIOON:
   - Dünaamiline süsteemi seadistus
   - Võimaldab muudatusi ilma koodi deploymentita
   - Tundlike andmete krüpteeritud salvestus

═══════════════════════════════════════════════════════════════════
                            DIAGRAMMI LEGEND
═══════════════════════════════════════════════════════════════════

🔑 PK = Primary Key (primaarvõti)
🔗 FK = Foreign Key (välisvõti)  
🔒 UK = Unique Key (unikaalne väli)
🟦🟩🟨🟪🟫🟧⬜ = Erinevad entiteedid värvidega eristatud

1:N = One-to-Many (üks-mitmele)
N:M = Many-to-Many (mitu-mitmele) 
N:1 = Many-to-One (mitu-ühele)

═══════════════════════════════════════════════════════════════════

*/
