// Estonian Swagger documentation for transaction routes
/**
 * @swagger
 * tags:
 *   name: Transactions
 *   description: Tehingute töötlemine ja ajalugu
 */

/**
 * @swagger
 * /api/transactions:
 *   get:
 *     summary: Hangi kõik autenditud kasutaja tehingud
 *     description: Tagastab kasutaja kõik tehingud koos filtreerimise võimalustega
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, inProgress, completed, failed]
 *         description: Filtreeri tehingu staatuse järgi
 *         example: "completed"
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [internal, external, incoming]
 *         description: Filtreeri tehingu tüübi järgi
 *         example: "internal"
 *       - in: query
 *         name: accountNumber
 *         schema:
 *           type: string
 *         description: Filtreeri kontonumbri järgi
 *         example: "EE123456789012345678"
 *     responses:
 *       200:
 *         description: Tehingute nimekiri
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
 *                   description: Tehingute arv
 *                   example: 5
 *                 data:
 *                   type: object
 *                   properties:
 *                     transactions:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Transaction'
 *             examples:
 *               userTransactions:
 *                 summary: Kasutaja tehingud
 *                 value:
 *                   status: "success"
 *                   results: 2
 *                   data:
 *                     transactions:
 *                       - id: "507f1f77bcf86cd799439014"
 *                         transactionId: "TXN202425001"
 *                         fromAccount: "EE123456789012345678"
 *                         toAccount: "EE123456789012345679"
 *                         amount: 100.00
 *                         currency: "EUR"
 *                         explanation: "Üüri makse"
 *                         status: "completed"
 *                         type: "internal"
 *                         senderName: "Mari Maasikas"
 *                         receiverName: "Jaan Tamm"
 *                         createdAt: "2025-03-01T10:30:00Z"
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
 * /api/transactions/internal:
 *   post:
 *     summary: Loo uus sisetehing sama panga kontode vahel
 *     description: Teostab raha ülekande kahe sama panga konto vahel
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fromAccount
 *               - toAccount
 *               - amount
 *               - explanation
 *             properties:
 *               fromAccount:
 *                 type: string
 *                 description: Lähte kontonumber
 *                 example: "EE123456789012345678"
 *               toAccount:
 *                 type: string
 *                 description: Siht kontonumber
 *                 example: "EE123456789012345679"
 *               amount:
 *                 type: number
 *                 minimum: 0.01
 *                 description: Tehingu summa
 *                 example: 150.75
 *               explanation:
 *                 type: string
 *                 description: Tehingu selgitus
 *                 example: "Üüri makse märtsiks"
 *           examples:
 *             internalTransfer:
 *               summary: Sisetehing
 *               value:
 *                 fromAccount: "EE123456789012345678"
 *                 toAccount: "EE123456789012345679"
 *                 amount: 150.75
 *                 explanation: "Üüri makse märtsiks"
 *     responses:
 *       201:
 *         description: Tehing loodud edukalt
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
 *                   example: "Tehing õnnestus"
 *                 data:
 *                   type: object
 *                   properties:
 *                     transaction:
 *                       $ref: '#/components/schemas/Transaction'
 *             examples:
 *               successfulTransaction:
 *                 summary: Edukas tehing
 *                 value:
 *                   status: "success"
 *                   message: "Tehing õnnestus"
 *                   data:
 *                     transaction:
 *                       id: "507f1f77bcf86cd799439015"
 *                       transactionId: "TXN202425002"
 *                       fromAccount: "EE123456789012345678"
 *                       toAccount: "EE123456789012345679"
 *                       amount: 150.75
 *                       currency: "EUR"
 *                       explanation: "Üüri makse märtsiks"
 *                       status: "completed"
 *                       type: "internal"
 *                       senderName: "Mari Maasikas"
 *                       receiverName: "Jaan Tamm"
 *       400:
 *         description: Valideerimise viga või ebapiisav saldo
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
 *                 insufficientFunds:
 *                   summary: Ebapiisav saldo
 *                   value:
 *                     status: "error"
 *                     message: "Ebapiisav saldo"
 *                 sameAccount:
 *                   summary: Sama konto
 *                   value:
 *                     status: "error"
 *                     message: "Lähte- ja sihtkonto ei või olla samad"
 *       401:
 *         description: Pole autenditud
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Pole volitatud lähtekontole ligipääsemiseks
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
 *                   example: "Teie ei ole volitatud lähtekontole ligipääsema"
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
 *                   example: "Lähtekontot ei leitud"
 *       500:
 *         description: Serveri viga
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /api/transactions/external:
 *   post:
 *     summary: Loo uus välistehing teise panka
 *     description: Teostab raha ülekande teise panga kontole
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fromAccount
 *               - toAccount
 *               - amount
 *               - explanation
 *             properties:
 *               fromAccount:
 *                 type: string
 *                 description: Lähte kontonumber (meie pank)
 *                 example: "EE123456789012345678"
 *               toAccount:
 *                 type: string
 *                 description: Siht kontonumber (teine pank)
 *                 example: "LV123456789012345678"
 *               amount:
 *                 type: number
 *                 minimum: 0.01
 *                 description: Tehingu summa
 *                 example: 250.00
 *               explanation:
 *                 type: string
 *                 description: Tehingu selgitus
 *                 example: "Pangavaheline ülekanne"
 *           examples:
 *             externalTransfer:
 *               summary: Välistehing
 *               value:
 *                 fromAccount: "EE123456789012345678"
 *                 toAccount: "LV123456789012345678"
 *                 amount: 250.00
 *                 explanation: "Pangavaheline ülekanne"
 *     responses:
 *       201:
 *         description: Tehing loodud edukalt
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
 *                   example: "Tehing õnnestus"
 *                 data:
 *                   type: object
 *                   properties:
 *                     transaction:
 *                       $ref: '#/components/schemas/Transaction'
 *                     receiverName:
 *                       type: string
 *                       description: Saaja nimi
 *                       example: "Latvijas Banka Klient"
 *       400:
 *         description: Valideerimise viga või ebapiisav saldo
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
 *                 notExternal:
 *                   summary: Mitte väline konto
 *                   value:
 *                     status: "error"
 *                     message: "Siseste tehingute jaoks kasutage sisetehing otspunkti"
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
 * /api/transactions/{id}:
 *   get:
 *     summary: Hangi konkreetse tehingu andmed ID järgi
 *     description: Tagastab ühe tehingu detailsed andmed
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Tehingu unikaalne identifikaator
 *         example: "507f1f77bcf86cd799439014"
 *     responses:
 *       200:
 *         description: Tehingu andmed
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
 *                     transaction:
 *                       $ref: '#/components/schemas/Transaction'
 *             examples:
 *               transactionDetails:
 *                 summary: Tehingu andmed
 *                 value:
 *                   status: "success"
 *                   data:
 *                     transaction:
 *                       id: "507f1f77bcf86cd799439014"
 *                       transactionId: "TXN202425001"
 *                       fromAccount: "EE123456789012345678"
 *                       toAccount: "EE123456789012345679"
 *                       amount: 100.00
 *                       currency: "EUR"
 *                       explanation: "Üüri makse"
 *                       status: "completed"
 *                       type: "internal"
 *                       senderName: "Mari Maasikas"
 *                       receiverName: "Jaan Tamm"
 *                       createdAt: "2025-03-01T10:30:00Z"
 *       401:
 *         description: Pole autenditud
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Pole volitatud tehingule ligipääsemiseks
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
 *                   example: "Teie ei ole volitatud sellele tehingule ligipääsema"
 *       404:
 *         description: Tehingut ei leitud
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
 *                   example: "Tehingut ei leitud"
 *       500:
 *         description: Serveri viga
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /api/transactions/status/{transactionId}:
 *   get:
 *     summary: Hangi tehingu staatus ID järgi
 *     description: Tagastab tehingu praeguse staatuse
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: transactionId
 *         required: true
 *         schema:
 *           type: string
 *         description: Tehingu identifikaator
 *         example: "TXN202425001"
 *     responses:
 *       200:
 *         description: Tehingu staatus saadud edukalt
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
 *                     transactionId:
 *                       type: string
 *                       example: "TXN202425001"
 *                     status:
 *                       type: string
 *                       example: "completed"
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *                       example: "2025-03-01T10:30:00Z"
 *       404:
 *         description: Tehingut ei leitud
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
 *                   example: "Tehingut ei leitud"
 *       500:
 *         description: Serveri viga
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

module.exports = {}; // This file is just for documentation
