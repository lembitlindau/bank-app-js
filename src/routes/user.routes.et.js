// Estonian Swagger documentation for user routes
/**
 * @swagger
 * tags:
 *   name: Users
 *   description: Kasutajaprofiili haldamine
 */

/**
 * @swagger
 * /api/users/profile:
 *   get:
 *     summary: Hangi kasutaja profiil
 *     description: Tagastab autenditud kasutaja profiili andmed
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Kasutaja profiil saadud edukalt
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
 *                     user:
 *                       allOf:
 *                         - $ref: '#/components/schemas/User'
 *                         - type: object
 *                           properties:
 *                             lastLogin:
 *                               type: string
 *                               format: date-time
 *                               description: Viimane sisselogimise aeg
 *                               example: "2025-03-01T09:15:00Z"
 *             examples:
 *               userProfile:
 *                 summary: Kasutaja profiil
 *                 value:
 *                   status: "success"
 *                   data:
 *                     user:
 *                       id: "507f1f77bcf86cd799439011"
 *                       username: "mari_maasikas"
 *                       firstName: "Mari"
 *                       lastName: "Maasikas"
 *                       email: "mari.maasikas@email.ee"
 *                       fullName: "Mari Maasikas"
 *                       lastLogin: "2025-03-01T09:15:00Z"
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
 * /api/users/profile:
 *   patch:
 *     summary: Uuenda kasutaja profiili
 *     description: Võimaldab muuta kasutaja ees- ja perekonnanime ning e-posti aadressi
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *                 description: Uus eesnimi
 *                 example: "Maria"
 *               lastName:
 *                 type: string
 *                 description: Uus perekonnanimi
 *                 example: "Maasikas-Kask"
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Uus e-posti aadress
 *                 example: "maria.maasikas@newmail.ee"
 *           examples:
 *             updateProfile:
 *               summary: Profiili uuendamine
 *               value:
 *                 firstName: "Maria"
 *                 lastName: "Maasikas-Kask"
 *                 email: "maria.maasikas@newmail.ee"
 *             partialUpdate:
 *               summary: Osaline uuendamine
 *               value:
 *                 email: "maria.maasikas@newmail.ee"
 *     responses:
 *       200:
 *         description: Profiil uuendatud edukalt
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
 *                   example: "Profiil uuendatud edukalt"
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *             examples:
 *               updatedProfile:
 *                 summary: Uuendatud profiil
 *                 value:
 *                   status: "success"
 *                   message: "Profiil uuendatud edukalt"
 *                   data:
 *                     user:
 *                       id: "507f1f77bcf86cd799439011"
 *                       username: "mari_maasikas"
 *                       firstName: "Maria"
 *                       lastName: "Maasikas-Kask"
 *                       email: "maria.maasikas@newmail.ee"
 *                       fullName: "Maria Maasikas-Kask"
 *       400:
 *         description: Valideerimise viga või e-post juba kasutusel
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
 *                 emailInUse:
 *                   summary: E-post juba kasutusel
 *                   value:
 *                     status: "error"
 *                     message: "E-post on juba kasutusel"
 *                 validationError:
 *                   summary: Valideerimise viga
 *                   value:
 *                     status: "error"
 *                     errors:
 *                       - field: "email"
 *                         message: "Palun sisestage kehtiv e-posti aadress"
 *       401:
 *         description: Pole autenditud
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Serveri viga
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /api/users/change-password:
 *   post:
 *     summary: Muuda kasutaja salasõna
 *     description: Võimaldab kasutajal muuta oma salasõna pärast praeguse salasõna kinnitamist
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 description: Praegune salasõna
 *                 example: "vanaSalasona123"
 *               newPassword:
 *                 type: string
 *                 minLength: 6
 *                 description: Uus salasõna (vähemalt 6 tähemärki)
 *                 example: "uusTeiseSalasona456"
 *           examples:
 *             changePassword:
 *               summary: Salasõna muutmine
 *               value:
 *                 currentPassword: "vanaSalasona123"
 *                 newPassword: "uusTeiseSalasona456"
 *     responses:
 *       200:
 *         description: Salasõna muudetud edukalt
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
 *                   example: "Salasõna muudetud edukalt"
 *             examples:
 *               passwordChanged:
 *                 summary: Salasõna muudetud
 *                 value:
 *                   status: "success"
 *                   message: "Salasõna muudetud edukalt"
 *       400:
 *         description: Valideerimise viga või vale praegune salasõna
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
 *                 wrongPassword:
 *                   summary: Vale praegune salasõna
 *                   value:
 *                     status: "error"
 *                     message: "Praegune salasõna on vale"
 *                 validationError:
 *                   summary: Valideerimise viga
 *                   value:
 *                     status: "error"
 *                     errors:
 *                       - field: "newPassword"
 *                         message: "Uus salasõna peab olema vähemalt 6 tähemärki pikk"
 *       401:
 *         description: Pole autenditud
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Serveri viga
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

module.exports = {}; // This file is just for documentation
