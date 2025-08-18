# Bank Application - Funktsioonide Kontrolli Test

## ✅ Peamised Funktsioonid

### Kasutajate haldus
- [x] Kasutajad saavad registreeruda kehtiva kasutajanime ja parooliga
- [x] Registreerimisel kontrollitakse nõutud välju ja välditakse duplikaate  
- [x] Kasutajad saavad sisse logida (saavad sessiooni tokeni)
- [x] Kasutajad saavad välja logida (sessiooni token kustutatakse serverist)
- [x] Kasutajad pääsevad ligi ainult oma andmetele

### Kontode haldus
- [x] Igal kasutajal võib olla mitu kontot erinevates valuutades
- [x] Kontod luuakse unikaalse kontonumbriga, kasutades panga prefiksit
- [x] Kasutajad saavad vaadata oma kontojääke
- [x] Kontojäägid uuendatakse õigesti pärast tehinguid

### Tehingud
- [x] Kasutajad saavad algatada sisemisi tehinguid sama panga kontode vahel
- [x] Kasutajad saavad algatada väliseid tehinguid teiste pankade kontodele
- [x] Tehingud sisaldavad vajalikke välju (fromAccount, toAccount, amount, currency)
- [x] Tehingu olekut jälgitakse täpselt (pending, inProgress, completed, failed)
- [x] Kasutajad saavad vaadata oma tehinguajalugu

### Pangavaheline suhtlus
- [x] Pank on registreeritud Keskpangas ja Keskpanga poolt antud unikaalne prefiks on panga konfiguratsioonifailis (.env)
- [x] Pank suudab töödelda sissetulevaid tehinguid teistest pankadest, vastavalt SPECIFICATIONS.md failile
- [x] Pank suhtleb turvaliselt teiste pankadega, kasutades JWT-allkirjastatud andmepakette
- [x] Pank valideerib sissetulevate tehingute allkirju ja ei võta tehingut vastu, kui see pole allkirjastatud Keskpanga poolt antud teise panga avaliku võtmega
- [x] Tehingud allkirjastatakse panga privaatvõtmega, mille avalik võti on registreeritud Keskpangas
- [x] Pangal on JWKS lõpp-punkt avalike võtmete avaldamiseks, mis on registreeritud Keskpangas
- [x] Pank valideerib sissetulevate tehingute allkirjad saatja avaliku võtme alusel

### API dokumentatsioon
- [x] Aadressil /docs on SwaggerUI, mis dokumenteerib kõik panga API lõpp-punktid
- [x] Kõik Swagger dokumentatsioonis määratletud API lõpp-punktid on rakendatud ja vastavad dokumentatsioonile
- [x] API lõpp-punktid tagastavad asjakohased HTTP staatusekoodid
- [x] API lõpp-punktid käsitlevad vigu robustselt ja annavad kirjeldavaid veateateid
- [x] API lõpp-punktid nõuavad korrektset autentimist, kui see on vajalik

### Tõrke käsitlus
- [x] Rakendus taastub sujuvalt väliste teenuste tõrgetest (kui keskpank ei vasta nt)

## 🔧 Loodud failid ja teenused

### Mudelid
- `src/models/user.model.js` - Kasutaja mudel (juba oli)
- `src/models/account.model.js` - Konto mudel (juba oli)  
- `src/models/transaction.model.js` - Tehingu mudel (uuendatud)

### Teenused
- `src/services/jwt.service.js` - JWT allkirjastamine ja valideerimine
- `src/services/centralBank.service.js` - Keskpanga API integratsioon
- `src/services/interbank.service.js` - Pangavaheliste tehingute töötlemine
- `src/services/startup.service.js` - Serveri käivitamise teenus

### API marsruudid
- `src/routes/auth.routes.js` - Autentimise API (juba oli)
- `src/routes/account.routes.js` - Kontode API (juba oli)
- `src/routes/transaction.routes.js` - Tehingute API (uuendatud)
- `src/routes/user.routes.js` - Kasutajate API (juba oli)
- `src/routes/centralBank.routes.js` - Keskpanga API

### Konfiguratsioon
- `SPECIFICATIONS.md` - Pangavaheliste tehingute spetsifikatsioon
- `.env` - Keskkonnamuutujad (uuendatud)
- `keys/private.pem` - Panga privaatvõti
- `keys/public.pem` - Panga avalik võti
- `.gitignore` - Turvalisuse tagamiseks

## 🚀 Uued API endpoints

### JWKS (avalike võtmete avaldamine)
- `GET /.well-known/jwks.json` - Panga avalikud võtmed JWKS formaadis

### Pangavaheline API
- `POST /api/transactions/b2b` - Sissetulevad tehingud teistest pankadest
- `GET /api/transactions/status/:transactionId` - Tehingu staatuse kontroll

### Keskpanga integratsioon
- `GET /api/central-bank/health` - Keskpanga ühenduse kontroll
- `GET /api/central-bank/banks` - Registreeritud pankade nimekiri
- `GET /api/central-bank/banks/:prefix` - Konkreetse panga info
- `POST /api/central-bank/register` - Panga registreerimine keskpangas

## 🔒 Turvalisuse omadused

1. **JWT allkirjastamine**: Kõik pangavahelised sõnumid on RSA-256 allkirjastatud
2. **Võtmete haldus**: Privaatvõtmed on parooliga kaitstud
3. **Valideerimised**: Täielik JWT ja allkirjade valideerimine
4. **Replay-rünnakute vastane kaitse**: Unikaalsed transaction ID-d
5. **Tõrgete käsitlus**: Graceful degradation kui keskpank pole kättesaadav

## 📊 Monitooring ja logimise

- Kõik pangavahelised tehingud logitakse
- JWT valideerimise tõrked logitakse
- Keskpanga API kutsed logitakse  
- Turvalisuse sündmused logitakse

## 🧪 Testimiseks

1. Käivita server: `npm start`
2. Vaata dokumentatsiooni: http://localhost:3000/docs
3. Testi JWKS: http://localhost:3000/.well-known/jwks.json
4. Kasuta frontend-i: http://localhost:3000

Server töötab standalone režiimis, isegi kui keskpank pole kättesaadav, kasutades cache'itud andmeid ja graceful error handling'ut.
