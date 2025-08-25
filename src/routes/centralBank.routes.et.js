// Estonian Swagger documentation for central bank routes
/**
 * @swagger
 * tags:
 *   name: Central Bank
 *   description: Keskpanga integratsioon
 */

/**
 * @swagger
 * /api/central-bank/health:
 *   get:
 *     summary: Kontrolli keskpanga ühenduse seisundit
 *     description: Tagastab keskpanga teenuse kättesaadavuse staatuse
 *     tags: [Central Bank]
 *     responses:
 *       200:
 *         description: Keskpanga ühenduse staatus
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "success"
 *                 data:
 *                   type: object
 *                   properties:
 *                     isConnected:
 *                       type: boolean
 *                       description: Kas ühendus on aktiivne
 *                       example: true
 *                     responseTime:
 *                       type: number
 *                       description: Vastuse aeg millisekundites
 *                       example: 45
 *                     centralBankUrl:
 *                       type: string
 *                       description: Keskpanga URL
 *                       example: "https://central-bank.gov.ee"
 *                     lastChecked:
 *                       type: string
 *                       format: date-time
 *                       description: Viimane kontrollimise aeg
 *                       example: "2025-03-01T10:30:00Z"
 *             examples:
 *               healthyConnection:
 *                 summary: Terve ühendus
 *                 value:
 *                   status: "success"
 *                   data:
 *                     isConnected: true
 *                     responseTime: 45
 *                     centralBankUrl: "https://central-bank.gov.ee"
 *                     lastChecked: "2025-03-01T10:30:00Z"
 *               unhealthyConnection:
 *                 summary: Probleemne ühendus
 *                 value:
 *                   status: "success"
 *                   data:
 *                     isConnected: false
 *                     responseTime: null
 *                     centralBankUrl: "https://central-bank.gov.ee"
 *                     lastChecked: "2025-03-01T10:30:00Z"
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
 *                   example: "Keskpanga seisundi kontrollimise viga"
 */

/**
 * @swagger
 * /api/central-bank/banks:
 *   get:
 *     summary: Hangi registreeritud pankade nimekiri
 *     description: Tagastab kõik keskpangas registreeritud pankade nimekirja
 *     tags: [Central Bank]
 *     responses:
 *       200:
 *         description: Pankade nimekiri saadud edukalt
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "success"
 *                 data:
 *                   type: object
 *                   properties:
 *                     banks:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           prefix:
 *                             type: string
 *                             description: Panga prefiksi kood
 *                             example: "EE1"
 *                           name:
 *                             type: string
 *                             description: Panga nimi
 *                             example: "Eesti Pank"
 *                           apiUrl:
 *                             type: string
 *                             description: Panga API URL
 *                             example: "https://api.eestipank.ee"
 *                           jwksUrl:
 *                             type: string
 *                             description: Panga JWKS otspunkti URL
 *                             example: "https://api.eestipank.ee/.well-known/jwks.json"
 *                           isActive:
 *                             type: boolean
 *                             description: Kas pank on aktiivne
 *                             example: true
 *                           registeredAt:
 *                             type: string
 *                             format: date-time
 *                             description: Registreerimise aeg
 *                             example: "2025-01-15T08:00:00Z"
 *             examples:
 *               banksList:
 *                 summary: Pankade nimekiri
 *                 value:
 *                   status: "success"
 *                   data:
 *                     banks:
 *                       - prefix: "EE1"
 *                         name: "Eesti Pank"
 *                         apiUrl: "https://api.eestipank.ee"
 *                         jwksUrl: "https://api.eestipank.ee/.well-known/jwks.json"
 *                         isActive: true
 *                         registeredAt: "2025-01-15T08:00:00Z"
 *                       - prefix: "LV1"
 *                         name: "Latvijas Banka"
 *                         apiUrl: "https://api.latvijasbank.lv"
 *                         jwksUrl: "https://api.latvijasbank.lv/.well-known/jwks.json"
 *                         isActive: true
 *                         registeredAt: "2025-01-20T10:15:00Z"
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
 *                   example: "Pankade nimekirja hankimise viga"
 */

/**
 * @swagger
 * /api/central-bank/banks/{prefix}:
 *   get:
 *     summary: Hangi konkreetse panga andmed
 *     description: Tagastab ühe panga detailsed andmed prefiksi koodiga
 *     tags: [Central Bank]
 *     parameters:
 *       - in: path
 *         name: prefix
 *         required: true
 *         schema:
 *           type: string
 *         description: Panga prefiksi kood
 *         example: "EE1"
 *     responses:
 *       200:
 *         description: Panga andmed saadud edukalt
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "success"
 *                 data:
 *                   type: object
 *                   properties:
 *                     bank:
 *                       type: object
 *                       properties:
 *                         prefix:
 *                           type: string
 *                           description: Panga prefiksi kood
 *                           example: "EE1"
 *                         name:
 *                           type: string
 *                           description: Panga nimi
 *                           example: "Eesti Pank"
 *                         apiUrl:
 *                           type: string
 *                           description: Panga API URL
 *                           example: "https://api.eestipank.ee"
 *                         jwksUrl:
 *                           type: string
 *                           description: Panga JWKS otspunkti URL
 *                           example: "https://api.eestipank.ee/.well-known/jwks.json"
 *                         isActive:
 *                           type: boolean
 *                           description: Kas pank on aktiivne
 *                           example: true
 *                         registeredAt:
 *                           type: string
 *                           format: date-time
 *                           description: Registreerimise aeg
 *                           example: "2025-01-15T08:00:00Z"
 *                         lastSeen:
 *                           type: string
 *                           format: date-time
 *                           description: Viimane aktiivsuse aeg
 *                           example: "2025-03-01T09:45:00Z"
 *             examples:
 *               bankInfo:
 *                 summary: Panga andmed
 *                 value:
 *                   status: "success"
 *                   data:
 *                     bank:
 *                       prefix: "EE1"
 *                       name: "Eesti Pank"
 *                       apiUrl: "https://api.eestipank.ee"
 *                       jwksUrl: "https://api.eestipank.ee/.well-known/jwks.json"
 *                       isActive: true
 *                       registeredAt: "2025-01-15T08:00:00Z"
 *                       lastSeen: "2025-03-01T09:45:00Z"
 *       404:
 *         description: Panka ei leitud
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
 *                   example: "Panka ei leitud"
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
 *                   example: "Panga andmete hankimise viga"
 */

/**
 * @swagger
 * /api/central-bank/register:
 *   post:
 *     summary: Registreeri see pank keskpangas
 *     description: Registreerib praeguse panga keskpanga süsteemis
 *     tags: [Central Bank]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - jwksUrl
 *             properties:
 *               name:
 *                 type: string
 *                 description: Panga nimi
 *                 example: "Minu Pank OÜ"
 *               jwksUrl:
 *                 type: string
 *                 description: Panga JWKS otspunkti URL
 *                 example: "https://api.minupank.ee/.well-known/jwks.json"
 *               apiUrl:
 *                 type: string
 *                 description: Panga API URL (valikuline)
 *                 example: "https://api.minupank.ee/api"
 *           examples:
 *             registerBank:
 *               summary: Panga registreerimine
 *               value:
 *                 name: "Minu Pank OÜ"
 *                 jwksUrl: "https://api.minupank.ee/.well-known/jwks.json"
 *                 apiUrl: "https://api.minupank.ee/api"
 *     responses:
 *       200:
 *         description: Pank registreeritud edukalt
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "success"
 *                 message:
 *                   type: string
 *                   example: "Pank registreeritud edukalt"
 *                 data:
 *                   type: object
 *                   properties:
 *                     prefix:
 *                       type: string
 *                       description: Määratud panga prefiksi kood
 *                       example: "EE2"
 *                     name:
 *                       type: string
 *                       description: Panga nimi
 *                       example: "Minu Pank OÜ"
 *                     apiUrl:
 *                       type: string
 *                       description: Panga API URL
 *                       example: "https://api.minupank.ee/api"
 *                     jwksUrl:
 *                       type: string
 *                       description: Panga JWKS URL
 *                       example: "https://api.minupank.ee/.well-known/jwks.json"
 *                     registeredAt:
 *                       type: string
 *                       format: date-time
 *                       description: Registreerimise aeg
 *                       example: "2025-03-01T10:30:00Z"
 *             examples:
 *               registeredBank:
 *                 summary: Registreeritud pank
 *                 value:
 *                   status: "success"
 *                   message: "Pank registreeritud edukalt"
 *                   data:
 *                     prefix: "EE2"
 *                     name: "Minu Pank OÜ"
 *                     apiUrl: "https://api.minupank.ee/api"
 *                     jwksUrl: "https://api.minupank.ee/.well-known/jwks.json"
 *                     registeredAt: "2025-03-01T10:30:00Z"
 *       400:
 *         description: Registreerimine ebaõnnestus
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
 *                 missingFields:
 *                   summary: Puuduvad väljad
 *                   value:
 *                     status: "error"
 *                     message: "Nimi ja JWKS URL on nõutavad"
 *                 alreadyRegistered:
 *                   summary: Juba registreeritud
 *                   value:
 *                     status: "error"
 *                     message: "Pank on juba registreeritud"
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
 *                   example: "Panga registreerimise viga"
 */

module.exports = {}; // This file is just for documentation
