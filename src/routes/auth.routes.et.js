// Estonian Swagger documentation for auth routes
/**
 * @swagger
 * tags:
 *   name: Authentication
 *   description: Kasutaja autentimine ja autoriseerimine
 */

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Registreeri uus kasutaja
 *     description: Loob uue kasutajakonto süsteemis koos kõigi vajalike andmetega
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *               - firstName
 *               - lastName
 *               - email
 *             properties:
 *               username:
 *                 type: string
 *                 minLength: 3
 *                 description: Kasutajanimi (vähemalt 3 tähemärki)
 *                 example: "kasutaja123"
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 description: Salasõna (vähemalt 6 tähemärki)
 *                 example: "turvalisSalasona"
 *               firstName:
 *                 type: string
 *                 description: Eesnimi
 *                 example: "Mari"
 *               lastName:
 *                 type: string
 *                 description: Perekonnanimi
 *                 example: "Maasikas"
 *               email:
 *                 type: string
 *                 format: email
 *                 description: E-posti aadress
 *                 example: "mari.maasikas@email.ee"
 *           examples:
 *             validUser:
 *               summary: Kehtiv kasutaja
 *               value:
 *                 username: "mari_maasikas"
 *                 password: "turvalisSalasona123"
 *                 firstName: "Mari"
 *                 lastName: "Maasikas"
 *                 email: "mari.maasikas@email.ee"
 *     responses:
 *       201:
 *         description: Kasutaja registreeritud edukalt
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
 *                   example: "Kasutaja registreeritud edukalt"
 *       400:
 *         description: Valideerimise viga
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             examples:
 *               validationError:
 *                 summary: Valideerimise viga
 *                 value:
 *                   status: "error"
 *                   errors:
 *                     - field: "username"
 *                       message: "Kasutajanimi peab olema vähemalt 3 tähemärki pikk"
 *       409:
 *         description: Kasutaja on juba olemas
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
 *                   example: "Kasutajanimi või e-post on juba kasutusel"
 *       500:
 *         description: Serveri viga
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Logi kasutaja sisse
 *     description: Autendib kasutaja ja tagastab JWT märgendi
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 description: Kasutajanimi
 *                 example: "mari_maasikas"
 *               password:
 *                 type: string
 *                 description: Salasõna
 *                 example: "turvalisSalasona123"
 *           examples:
 *             validLogin:
 *               summary: Kehtiv sisselogimine
 *               value:
 *                 username: "mari_maasikas"
 *                 password: "turvalisSalasona123"
 *     responses:
 *       200:
 *         description: Sisselogimine edukas
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "success"
 *                 token:
 *                   type: string
 *                   description: JWT märgend
 *                   example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *             examples:
 *               successfulLogin:
 *                 summary: Edukas sisselogimine
 *                 value:
 *                   status: "success"
 *                   token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                   user:
 *                     id: "507f1f77bcf86cd799439011"
 *                     username: "mari_maasikas"
 *                     firstName: "Mari"
 *                     lastName: "Maasikas"
 *                     email: "mari.maasikas@email.ee"
 *       400:
 *         description: Vigased andmed
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
 *                   example: "Vale kasutajanimi või salasõna"
 *       500:
 *         description: Serveri viga
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Logi kasutaja välja
 *     description: Tühistab kasutaja praeguse sessiooni
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Väljalogimine edukas
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
 *                   example: "Edukalt välja logitud"
 *       401:
 *         description: Pole autenditud
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
 *                   example: "Juurdepääs keelatud"
 *       500:
 *         description: Serveri viga
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Hangi praeguse kasutaja andmed
 *     description: Tagastab autenditud kasutaja profiili andmed
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Kasutaja andmed saadud edukalt
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "success"
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *             examples:
 *               userInfo:
 *                 summary: Kasutaja andmed
 *                 value:
 *                   status: "success"
 *                   user:
 *                     id: "507f1f77bcf86cd799439011"
 *                     username: "mari_maasikas"
 *                     firstName: "Mari"
 *                     lastName: "Maasikas"
 *                     email: "mari.maasikas@email.ee"
 *                     fullName: "Mari Maasikas"
 *       401:
 *         description: Pole autenditud
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
 *                   example: "Juurdepääs keelatud"
 *       500:
 *         description: Serveri viga
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

module.exports = {}; // This file is just for documentation
