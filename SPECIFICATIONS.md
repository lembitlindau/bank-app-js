# Pankadevaheliste Tehingute Spetsifikatsioon

## Ülevaade

See dokument kirjeldab pankadevaheliste tehingute protokolli, mida kasutatakse erinevate pankade vahel turvaliseks raha ülekandmiseks. Protokoll kasutab JWT (JSON Web Token) allkirjastamist ja JWKS (JSON Web Key Set) avalike võtmete vahetamiseks.

## Arhitektuur

### Osapooled
- **Keskpank**: Registreerib pangad ja haldab avalikke võtmeid
- **Saatja pank**: Algatab ülekande
- **Saaja pank**: Võtab vastu ülekande

### Autentimine ja turvalisus
- Iga pank omab unikaalset prefiksit, mida annab keskpank
- Iga pank omab privaat/avalik võtmepaari
- Avalikud võtmed on registreeritud keskpangas
- Kõik pangavahelised sõnumid on JWT allkirjastatud

## API Endpoints

### JWKS Endpoint (avalike võtmete avaldamine)
```
GET /.well-known/jwks.json
```

Tagastab panga avalikud võtmed JWKS formaadis:
```json
{
  "keys": [
    {
      "kty": "RSA",
      "use": "sig",
      "kid": "bank-key-1",
      "n": "...",
      "e": "AQAB"
    }
  ]
}
```

### Pangavaheline tehingu endpoint
```
POST /api/transactions/b2b
```

#### Päring
```json
{
  "jwt": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

JWT dekodeerituna sisaldab:
```json
{
  "iss": "ABC", // saatja panga prefiks
  "aud": "XYZ", // saaja panga prefiks
  "iat": 1640995200,
  "exp": 1640998800,
  "jti": "unique-transaction-id",
  "accountFrom": "ABC123456789",
  "accountTo": "XYZ987654321",
  "amount": 100.50,
  "currency": "EUR",
  "explanation": "Makse eest",
  "senderName": "John Doe",
  "receiverName": "Jane Smith"
}
```

#### Vastus
```json
{
  "status": "success",
  "receiverName": "Jane Smith",
  "message": "Transaction accepted"
}
```

#### Veakoodid
- `400` - Kehtetu JWT või puuduvad väljad
- `401` - Kehtetu allkiri
- `404` - Saaja konto ei leitud
- `422` - Tehingut ei saa töödelda (nt ebapiisav saldo)

## Tehingu töövoog

1. **Sisemise tehingu algatamine**
   - Kasutaja algatab tehingu oma pangas
   - Pank kontrollib saldo ja konto olemasolu
   - Kui saaja konto on teises pangas, alustatakse pangavahelist tehingut

2. **Pangavahelise tehingu saatmine**
   - Saatja pank loob JWT, mis sisaldab tehingu andmeid
   - JWT allkirjastatakse panga privaatvõtmega
   - Saatja pank saadab POST päringu saaja panga B2B endpointile

3. **Pangavahelise tehingu vastuvõtmine**
   - Saaja pank kontrollib JWT allkirja saatja avaliku võtme vastu
   - Valideeritakse tehingu andmeid
   - Kontrollitakse saaja konto olemasolu
   - Tehingu staatus uuendatakse

4. **Tehingu lõpetamine**
   - Kui kõik on korrektne, uuendatakse kontojääke
   - Tagastatakse vastus saatja pangale
   - Tehingu staatus uuendatakse mõlemas pangas

## Turvalisuse nõuded

### JWT Allkirjastamine
- Kasutada RSA-256 algoritmi
- JWT kehtivusaeg max 1 tund
- Iga tehingu jaoks unikaalne `jti` (JWT ID)

### Võtmete haldamine
- Privaatvõtmed hoitakse turvaliselt serveris
- Avalikud võtmed avaldatakse JWKS endpoints
- Võtmeid uuendatakse regulaarselt

### Valideerimise nõuded
- Kontrollida JWT allkirja saatja avaliku võtme vastu
- Valideerida JWT aegumist
- Kontrollida `aud` välja (pank peab olema õige saaja)
- Veenduda `jti` unikaalsuses (replay-rünnakute vastu)

## Keskpanga integratsioon

### Panga registreerimine
```
POST /api/banks/register
{
  "name": "My Bank",
  "prefix": "ABC",
  "jwksUrl": "https://mybank.com/.well-known/jwks.json"
}
```

### Pangade nimekiri
```
GET /api/banks
```

### Avaliku võtme hankimine
```
GET /api/banks/{prefix}/jwks
```

## Vea käsitlus

### Võrgu tõrked
- Rakendada retry logic exponential backoff-iga
- Timeout 30 sekundit
- Max 3 korduskatsed

### Keskpanga kättesaamatavus
- Kasutada lokaalselt cached avalikke võtmeid
- Logida hoiatused
- Jätkata tööd cached andmetega

### Kehtetud allkirjad
- Logida turvalisuse sündmus
- Tagastada 401 viga
- Teavitada administraatorit

## Monitooring

### Logitavad sündmused
- Kõik pangavahelised tehingud
- JWT valideerimise tõrked
- Keskpanga API kutsed
- Turvalisuse sündmused

### Meetrikad
- Tehingute arv ja summa
- API vastamise ajad
- Tõrgete määr
- JWT valideerimise edukus
