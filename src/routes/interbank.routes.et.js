// Estonian Swagger documentation for interbank routes
/**
 * @swagger
 * tags:
 *   name: Interbank
 *   description: Pangavaheline kommunikatsioon
 */

/**
 * @swagger
 * /api/transactions/b2b:
 *   post:
 *     summary: Töötle panganaheline tehing teisest pangast
 *     description: Võtab vastu ja töötleb JWT märgendiga allkirjastatud tehingu teisest pangast
 *     tags: [Interbank]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - jwt
 *             properties:
 *               jwt:
 *                 type: string
 *                 description: JWT märgend saatja panga poolt allkirjastatud tehingu andmetega
 *                 example: "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IjEifQ.eyJhY2NvdW50RnJvbSI6IkxWMTIzNDU2Nzg5MDEyMzQ1Njc4IiwiYWNjb3VudFRvIjoiRUUxMjM0NTY3ODkwMTIzNDU2NzgiLCJhbW91bnQiOjEwMDAwLCJjdXJyZW5jeSI6IkVVUiIsImV4cGxhbmF0aW9uIjoiUGFuZ2F2YWhlbGluZSDDvGxla2FuZGUiLCJzZW5kZXJOYW1lIjoiTGF0dmlqYXMgS2xpZW50cyIsImlhdCI6MTcwOTI5Mzg2MCwiZXhwIjoxNzA5Mjk0NDYwfQ.signature"
 *           examples:
 *             interbankTransaction:
 *               summary: Pangavaheline tehing
 *               value:
 *                 jwt: "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IjEifQ.eyJhY2NvdW50RnJvbSI6IkxWMTIzNDU2Nzg5MDEyMzQ1Njc4IiwiYWNjb3VudFRvIjoiRUUxMjM0NTY3ODkwMTIzNDU2NzgiLCJhbW91bnQiOjEwMDAwLCJjdXJyZW5jeSI6IkVVUiIsImV4cGxhbmF0aW9uIjoiUGFuZ2F2YWhlbGluZSDDvGxla2FuZGUiLCJzZW5kZXJOYW1lIjoiTGF0dmlqYXMgS2xpZW50cyIsImlhdCI6MTcwOTI5Mzg2MCwiZXhwIjoxNzA5Mjk0NDYwfQ.signature_here"
 *     responses:
 *       200:
 *         description: Tehing töödeldud edukalt
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "success"
 *                 receiverName:
 *                   type: string
 *                   description: Saaja täisnimi
 *                   example: "Mari Maasikas"
 *                 message:
 *                   type: string
 *                   description: Eduka töötlemise teade
 *                   example: "Tehing töödeldud edukalt"
 *             examples:
 *               successfulTransaction:
 *                 summary: Edukas tehing
 *                 value:
 *                   status: "success"
 *                   receiverName: "Mari Maasikas"
 *                   message: "Tehing töödeldud edukalt"
 *       400:
 *         description: Vigane päring või kehtetu JWT
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "error"
 *                 message:
 *                   type: string
 *               examples:
 *                 missingJWT:
 *                   summary: Puuduv JWT
 *                   value:
 *                     status: "error"
 *                     message: "JWT märgend on nõutav"
 *                 invalidJWT:
 *                   summary: Kehtetu JWT
 *                   value:
 *                     status: "error"
 *                     message: "JWT märgendi dekodeerimine ebaõnnestus"
 *                 wrongBank:
 *                   summary: Vale pank
 *                   value:
 *                     status: "error"
 *                     message: "Sihtkonto ei kuulu sellesse panka"
 *       401:
 *         description: Kehtetu allkiri
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "error"
 *                 message:
 *                   type: string
 *                   example: "Kehtetu JWT allkiri"
 *       404:
 *         description: Sihtkontot ei leitud
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "error"
 *                 message:
 *                   type: string
 *                   example: "Sihtkontot ei leitud"
 *       422:
 *         description: Tehingut ei saa töödelda
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "error"
 *                 message:
 *                   type: string
 *               examples:
 *                 accountInactive:
 *                   summary: Konto mitteaktiivne
 *                   value:
 *                     status: "error"
 *                     message: "Sihtkonto ei ole aktiivne"
 *                 currencyMismatch:
 *                   summary: Valuuta mittesobivus
 *                   value:
 *                     status: "error"
 *                     message: "Valuuta ei sobi sihtkontoga"
 *       500:
 *         description: Serveri viga
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "error"
 *                 message:
 *                   type: string
 *                   example: "Sisene serveri viga"
 */

/**
 * @swagger
 * /.well-known/jwks.json:
 *   get:
 *     summary: Hangi panga avalikud võtmed JWKS formaadis
 *     description: Tagastab panga avalikud võtmed JSON Web Key Set (JWKS) formaadis teiste pankade jaoks
 *     tags: [Interbank]
 *     responses:
 *       200:
 *         description: JWKS (JSON Web Key Set) panga avalike võtmetega
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 keys:
 *                   type: array
 *                   description: Avalike võtmete massiiv
 *                   items:
 *                     type: object
 *                     properties:
 *                       kty:
 *                         type: string
 *                         description: Võtme tüüp
 *                         example: "RSA"
 *                       use:
 *                         type: string
 *                         description: Võtme kasutamine
 *                         example: "sig"
 *                       kid:
 *                         type: string
 *                         description: Võtme identifikaator
 *                         example: "1"
 *                       alg:
 *                         type: string
 *                         description: Algoritm
 *                         example: "RS256"
 *                       n:
 *                         type: string
 *                         description: RSA võtme modulus
 *                         example: "0vx7agoebGcQSuuPiLJXZptN9nndrQmbXEps2aiAFbWhM78LhWx4cbbfAAtVT86zwu1RK7aPFFxuhDR1L6tSoc_BJECPebWKRXjBZCiFV4n3oknjhMstn64tZ_2W-5JsGY4Hc5n9yBXArwl93lqt7_RN5w6Cf0h4QyQ5v-65YGjQR0_FDW2QvzqY368QQMicAtaSqzs8KJZgnYb9c7d0zgdAZHzu6qMQvRL5hajrn1n91CbOpbISD08qNLyrdkt-bFTWhAI4vMQFh6WeZu0fM4lFd2NcRwr3XPksINHaQ-G_xBniIqbw0Ls1jF44-csFCur-kEgU8awapJzKnqDKgw"
 *                       e:
 *                         type: string
 *                         description: RSA võtme eksponent
 *                         example: "AQAB"
 *                       x5c:
 *                         type: array
 *                         description: X.509 sertifikaatide ahel
 *                         items:
 *                           type: string
 *             examples:
 *               jwksResponse:
 *                 summary: JWKS vastus
 *                 value:
 *                   keys:
 *                     - kty: "RSA"
 *                       use: "sig"
 *                       kid: "1"
 *                       alg: "RS256"
 *                       n: "0vx7agoebGcQSuuPiLJXZptN9nndrQmbXEps2aiAFbWhM78LhWx4cbbfAAtVT86zwu1RK7aPFFxuhDR1L6tSoc_BJECPebWKRXjBZCiFV4n3oknjhMstn64tZ_2W-5JsGY4Hc5n9yBXArwl93lqt7_RN5w6Cf0h4QyQ5v-65YGjQR0_FDW2QvzqY368QQMicAtaSqzs8KJZgnYb9c7d0zgdAZHzu6qMQvRL5hajrn1n91CbOpbISD08qNLyrdkt-bFTWhAI4vMQFh6WeZu0fM4lFd2NcRwr3XPksINHaQ-G_xBniIqbw0Ls1jF44-csFCur-kEgU8awapJzKnqDKgw"
 *                       e: "AQAB"
 *                       x5c:
 *                         - "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA0vx7agoebGcQSuuPiLJXZptN9nndrQmbXEps2aiAFbWhM78LhWx4cbbfAAtVT86zwu1RK7aPFFxuhDR1L6tSoc_BJECPebWKRXjBZCiFV4n3oknjhMstn64tZ_2W-5JsGY4Hc5n9yBXArwl93lqt7_RN5w6Cf0h4QyQ5v-65YGjQR0_FDW2QvzqY368QQMicAtaSqzs8KJZgnYb9c7d0zgdAZHzu6qMQvRL5hajrn1n91CbOpbISD08qNLyrdkt-bFTWhAI4vMQFh6WeZu0fM4lFd2NcRwr3XPksINHaQ-G_xBniIqbw0Ls1jF44-csFCur-kEgU8awapJzKnqDKgwIDAQAB"
 *       500:
 *         description: Serveri viga
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "error"
 *                 message:
 *                   type: string
 *                   example: "JWKS-i genereerimine ebaõnnestus"
 */

/**
 * @swagger
 * /api/transactions/jwks:
 *   get:
 *     summary: Hangi panga JSON Web Key Set (JWKS)
 *     description: Alternatiivne otspunkt panga avalike võtmete hankimiseks
 *     tags: [Interbank]
 *     responses:
 *       200:
 *         description: JWKS panga avalike võtmetega
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 keys:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       kty:
 *                         type: string
 *                         example: "RSA"
 *                       use:
 *                         type: string
 *                         example: "sig"
 *                       kid:
 *                         type: string
 *                         example: "1"
 *                       alg:
 *                         type: string
 *                         example: "RS256"
 *                       x5c:
 *                         type: array
 *                         items:
 *                           type: string
 *       500:
 *         description: Serveri viga
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "error"
 *                 message:
 *                   type: string
 *                   example: "JWKS-i hankimise viga"
 */

module.exports = {}; // This file is just for documentation
