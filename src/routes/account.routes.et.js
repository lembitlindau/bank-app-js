// Estonian Swagger documentation for account routes
/**
 * @swagger
 * tags:
 *   name: Accounts
 *   description: Pangakonto haldamine
 */

/**
 * @swagger
 * /api/accounts:
 *   get:
 *     summary: Hangi kõik autenditud kasutaja kontod
 *     description: Tagastab kõik kasutajale kuuluvad pangakontod
 *     tags: [Accounts]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Kasutaja kontode nimekiri
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "success"
 *                 results:
 *                   type: number
 *                   description: Kontode arv
 *                   example: 2
 *                 data:
 *                   type: object
 *                   properties:
 *                     accounts:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Account'
 *             examples:
 *               userAccounts:
 *                 summary: Kasutaja kontod
 *                 value:
 *                   status: "success"
 *                   results: 2
 *                   data:
 *                     accounts:
 *                       - id: "507f1f77bcf86cd799439011"
 *                         accountNumber: "EE123456789012345678"
 *                         accountName: "Põhikonto"
 *                         balance: 1500.50
 *                         currency: "EUR"
 *                         isActive: true
 *                       - id: "507f1f77bcf86cd799439012"
 *                         accountNumber: "EE123456789012345679"
 *                         accountName: "Säästukonto"
 *                         balance: 5000.00
 *                         currency: "EUR"
 *                         isActive: true
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
 * /api/accounts/{id}:
 *   get:
 *     summary: Hangi konkreetse konto andmed ID järgi
 *     description: Tagastab ühe konto detailsed andmed
 *     tags: [Accounts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Konto unikaalne identifikaator
 *         example: "507f1f77bcf86cd799439011"
 *     responses:
 *       200:
 *         description: Konto andmed
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
 *                     account:
 *                       $ref: '#/components/schemas/Account'
 *             examples:
 *               accountDetails:
 *                 summary: Konto andmed
 *                 value:
 *                   status: "success"
 *                   data:
 *                     account:
 *                       id: "507f1f77bcf86cd799439011"
 *                       accountNumber: "EE123456789012345678"
 *                       accountName: "Põhikonto"
 *                       balance: 1500.50
 *                       currency: "EUR"
 *                       isActive: true
 *       401:
 *         description: Pole autenditud
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Pole volitatud kontole ligipääsemiseks
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
 *                   example: "Teie ei ole volitatud sellele kontole ligipääsema"
 *       404:
 *         description: Kontot ei leitud
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
 *                   example: "Kontot ei leitud"
 *       500:
 *         description: Serveri viga
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /api/accounts:
 *   post:
 *     summary: Loo uus konto
 *     description: Loob kasutajale uue pangakonto
 *     tags: [Accounts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - accountName
 *               - currency
 *             properties:
 *               accountName:
 *                 type: string
 *                 description: Konto nimi
 *                 example: "Säästukonto"
 *               currency:
 *                 type: string
 *                 enum: [EUR, USD, GBP]
 *                 description: Konto valuuta
 *                 example: "EUR"
 *               initialBalance:
 *                 type: number
 *                 minimum: 0
 *                 description: Algne saldo (valikuline)
 *                 example: 100.00
 *           examples:
 *             newAccount:
 *               summary: Uus konto
 *               value:
 *                 accountName: "Säästukonto"
 *                 currency: "EUR"
 *                 initialBalance: 100.00
 *     responses:
 *       201:
 *         description: Konto loodud edukalt
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
 *                   example: "Konto loodud edukalt"
 *                 data:
 *                   type: object
 *                   properties:
 *                     account:
 *                       $ref: '#/components/schemas/Account'
 *             examples:
 *               createdAccount:
 *                 summary: Loodud konto
 *                 value:
 *                   status: "success"
 *                   message: "Konto loodud edukalt"
 *                   data:
 *                     account:
 *                       id: "507f1f77bcf86cd799439013"
 *                       accountNumber: "EE123456789012345680"
 *                       accountName: "Säästukonto"
 *                       balance: 100.00
 *                       currency: "EUR"
 *                       isActive: true
 *       400:
 *         description: Valideerimise viga
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
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
 * /api/accounts/{id}:
 *   patch:
 *     summary: Uuenda konto andmeid
 *     description: Võimaldab muuta konto nime ja staatust
 *     tags: [Accounts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Konto unikaalne identifikaator
 *         example: "507f1f77bcf86cd799439011"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               accountName:
 *                 type: string
 *                 description: Uus konto nimi
 *                 example: "Uuendatud põhikonto"
 *               isActive:
 *                 type: boolean
 *                 description: Konto aktiivsuse staatus
 *                 example: true
 *           examples:
 *             updateAccount:
 *               summary: Konto uuendamine
 *               value:
 *                 accountName: "Uuendatud põhikonto"
 *                 isActive: true
 *     responses:
 *       200:
 *         description: Konto uuendatud edukalt
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
 *                   example: "Konto uuendatud edukalt"
 *                 data:
 *                   type: object
 *                   properties:
 *                     account:
 *                       $ref: '#/components/schemas/Account'
 *       400:
 *         description: Valideerimise viga
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Pole autenditud
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Pole volitatud kontot uuendama
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
 *                   example: "Teie ei ole volitatud seda kontot uuendama"
 *       404:
 *         description: Kontot ei leitud
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
 *                   example: "Kontot ei leitud"
 *       500:
 *         description: Serveri viga
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /api/accounts/{accountNumber}/balance:
 *   get:
 *     summary: Hangi konto saldo kontonumbri järgi
 *     description: Tagastab konto saldo ja valuuta info
 *     tags: [Accounts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: accountNumber
 *         required: true
 *         schema:
 *           type: string
 *         description: Kontonumber
 *         example: "EE123456789012345678"
 *     responses:
 *       200:
 *         description: Konto saldo
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
 *                     accountNumber:
 *                       type: string
 *                       description: Kontonumber
 *                       example: "EE123456789012345678"
 *                     balance:
 *                       type: number
 *                       description: Konto saldo
 *                       example: 1500.50
 *                     formattedBalance:
 *                       type: string
 *                       description: Vormindatud saldo
 *                       example: "1,500.50 EUR"
 *                     currency:
 *                       type: string
 *                       description: Valuuta
 *                       example: "EUR"
 *             examples:
 *               accountBalance:
 *                 summary: Konto saldo
 *                 value:
 *                   status: "success"
 *                   data:
 *                     accountNumber: "EE123456789012345678"
 *                     balance: 1500.50
 *                     formattedBalance: "1,500.50 EUR"
 *                     currency: "EUR"
 *       401:
 *         description: Pole autenditud
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Pole volitatud kontole ligipääsemiseks
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
 *                   example: "Teie ei ole volitatud sellele kontole ligipääsema"
 *       404:
 *         description: Kontot ei leitud
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
 *                   example: "Kontot ei leitud"
 *       500:
 *         description: Serveri viga
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

module.exports = {}; // This file is just for documentation
