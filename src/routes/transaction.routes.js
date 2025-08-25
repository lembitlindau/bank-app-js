const express = require('express');
const { body, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

const Account = require('../models/account.model');
const Transaction = require('../models/transaction.model');
const User = require('../models/user.model');
const { authenticate } = require('../middlewares/auth.middleware');

// Import services
const jwtService = require('../services/jwt.service');
const interbankService = require('../services/interbank.service');

const router = express.Router();

// Apply authentication middleware to all transaction routes except b2b
router.use((req, res, next) => {
  if (req.path === '/b2b') {
    return next();
  }

  if (req.path === '/jwks' || req.path === '/.well-known/jwks.json') {
    return next();
  }

  authenticate(req, res, next);
});

/**
 * @swagger
 * /api/transactions:
 *   get:
 *     summary: Get all transactions for the authenticated user
 *     description: Retrieves all transactions associated with the authenticated user's accounts with optional filtering
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, inProgress, completed, failed]
 *         description: Filter by transaction status
 *         example: "completed"
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [internal, external, incoming]
 *         description: Filter by transaction type
 *         example: "internal"
 *       - in: query
 *         name: accountNumber
 *         schema:
 *           type: string
 *         description: Filter by account number (source or destination)
 *         example: "EE123456789012345678"
 *     responses:
 *       200:
 *         description: List of transactions
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
 *                   description: Number of transactions returned
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
 *                 summary: User transaction list
 *                 value:
 *                   status: "success"
 *                   results: 3
 *                   data:
 *                     transactions:
 *                       - id: "613f5b46a47af9001c40f405"
 *                         transactionId: "TXN202425001"
 *                         fromAccount: "EE123456789012345678"
 *                         toAccount: "EE123456789012345679"
 *                         amount: 150.00
 *                         currency: "EUR"
 *                         explanation: "Monthly rent payment"
 *                         status: "completed"
 *                         type: "internal"
 *                         senderName: "John Doe"
 *                         receiverName: "Jane Smith"
 *                         createdAt: "2025-03-01T10:30:00Z"
 *                       - id: "613f5b46a47af9001c40f406"
 *                         transactionId: "TXN202425002"
 *                         fromAccount: "EE123456789012345678"
 *                         toAccount: "LV123456789012345678"
 *                         amount: 250.00
 *                         currency: "EUR"
 *                         explanation: "International transfer"
 *                         status: "completed"
 *                         type: "external"
 *                         senderName: "John Doe"
 *                         receiverName: "Foreign Account Holder"
 *                         createdAt: "2025-03-01T09:15:00Z"
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/', async (req, res) => {
  try {
    const { status, type, accountNumber } = req.query;
    
    // Build query
    const query = { initiatedBy: req.user._id };
    
    if (status) {
      query.status = status;
    }
    
    if (type) {
      query.type = type;
    }
    
    if (accountNumber) {
      query.$or = [
        { fromAccount: accountNumber },
        { toAccount: accountNumber }
      ];
    }
    
    const transactions = await Transaction.find(query)
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      status: 'success',
      results: transactions.length,
      data: {
        transactions,
      },
    });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error',
    });
  }
});

/**
 * @swagger
 * /api/transactions/internal:
 *   post:
 *     summary: Create a new internal transaction between accounts of the same bank
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
 *               toAccount:
 *                 type: string
 *               amount:
 *                 type: number
 *                 minimum: 0.01
 *               explanation:
 *                 type: string
 *     responses:
 *       201:
 *         description: Transaction created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized to access the source account
 *       404:
 *         description: Account not found
 *       500:
 *         description: Server error
 */
router.post(
  '/internal',
  [
    body('fromAccount').notEmpty().withMessage('Source account is required'),
    body('toAccount').notEmpty().withMessage('Destination account is required'),
    body('amount')
      .isFloat({ min: 0.01 })
      .withMessage('Amount must be greater than 0'),
    body('explanation').notEmpty().withMessage('Explanation is required'),
  ],
  async (req, res) => {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          status: 'error',
          errors: errors.array(),
        });
      }

      const { fromAccount, toAccount, amount, explanation } = req.body;

      // Check if accounts are the same
      if (fromAccount === toAccount) {
        return res.status(400).json({
          status: 'error',
          message: 'Source and destination accounts cannot be the same',
        });
      }

      // Find source account
      const sourceAccount = await Account.findOne({ accountNumber: fromAccount });
      if (!sourceAccount) {
        return res.status(404).json({
          status: 'error',
          message: 'Source account not found',
        });
      }

      // Check if the source account belongs to the authenticated user
      if (sourceAccount.owner.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          status: 'error',
          message: 'You are not authorized to access the source account',
        });
      }

      // Find destination account
      const destinationAccount = await Account.findOne({ accountNumber: toAccount });
      if (!destinationAccount) {
        return res.status(404).json({
          status: 'error',
          message: 'Destination account not found',
        });
      }

      // Check if both accounts have the same currency
      if (sourceAccount.currency !== destinationAccount.currency) {
        return res.status(400).json({
          status: 'error',
          message: 'Currency mismatch between accounts',
        });
      }

      // Check if source account has sufficient funds
      const amountInCents = Math.round(amount * 100);
      if (sourceAccount.balance < amountInCents) {
        return res.status(400).json({
          status: 'error',
          message: 'Insufficient funds',
        });
      }

      // Get destination account owner's name
      const destinationUser = await User.findById(destinationAccount.owner);
      if (!destinationUser) {
        return res.status(404).json({
          status: 'error',
          message: 'Destination account owner not found',
        });
      }

      // Create transaction
      const transaction = new Transaction({
        transactionId: Transaction.generateTransactionId(),
        fromAccount,
        toAccount,
        amount: amountInCents,
        currency: sourceAccount.currency,
        explanation,
        senderName: req.user.fullName,
        receiverName: destinationUser.fullName,
        status: 'pending',
        type: 'internal',
        initiatedBy: req.user._id,
      });

      // Save transaction
      await transaction.save();

      // Update transaction status to in progress
      await transaction.updateStatus('inProgress');

      try {
        // Update account balances
        await sourceAccount.updateBalance(amountInCents, 'debit');
        await destinationAccount.updateBalance(amountInCents, 'credit');

        // Update transaction status to completed
        await transaction.updateStatus('completed');

        res.status(201).json({
          status: 'success',
          message: 'Transaction completed successfully',
          data: {
            transaction,
          },
        });
      } catch (error) {
        // If any error occurs during the transaction, update status to failed
        await transaction.updateStatus('failed', error.message);

        throw error;
      }
    } catch (error) {
      console.error('Internal transaction error:', error);
      res.status(500).json({
        status: 'error',
        message: error.message || 'Internal server error',
      });
    }
  }
);

/**
 * @swagger
 * /api/transactions/external:
 *   post:
 *     summary: Create a new external transaction to another bank
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
 *               toAccount:
 *                 type: string
 *               amount:
 *                 type: number
 *                 minimum: 0.01
 *               explanation:
 *                 type: string
 *     responses:
 *       201:
 *         description: Transaction created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized to access the source account
 *       404:
 *         description: Account not found
 *       500:
 *         description: Server error
 */
router.post(
  '/external',
  [
    body('fromAccount').notEmpty().withMessage('Source account is required'),
    body('toAccount').notEmpty().withMessage('Destination account is required'),
    body('amount')
      .isFloat({ min: 0.01 })
      .withMessage('Amount must be greater than 0'),
    body('explanation').notEmpty().withMessage('Explanation is required'),
  ],
  async (req, res) => {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          status: 'error',
          errors: errors.array(),
        });
      }

      const { fromAccount, toAccount, amount, explanation } = req.body;

      // Find source account
      const sourceAccount = await Account.findOne({ accountNumber: fromAccount });
      if (!sourceAccount) {
        return res.status(404).json({
          status: 'error',
          message: 'Source account not found',
        });
      }

      // Check if the source account belongs to the authenticated user
      if (sourceAccount.owner.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          status: 'error',
          message: 'You are not authorized to access the source account',
        });
      }

      // Check if destination account is external (different bank)
      if (!interbankService.isExternalAccount(toAccount)) {
        return res.status(400).json({
          status: 'error',
          message: 'For internal transfers, use the internal transaction endpoint',
        });
      }

      // Check if source account has sufficient funds
      const amountInCents = Math.round(amount * 100);
      if (sourceAccount.balance < amountInCents) {
        return res.status(400).json({
          status: 'error',
          message: 'Insufficient funds',
        });
      }

      // Create transaction
      const transaction = new Transaction({
        transactionId: Transaction.generateTransactionId(),
        fromAccount,
        toAccount,
        amount: amountInCents,
        currency: sourceAccount.currency,
        explanation,
        senderName: req.user.fullName,
        status: 'pending',
        type: 'external',
        isInterbank: true,
        initiatedBy: req.user._id,
      });

      // Save transaction
      await transaction.save();

      try {
        // Debit the source account
        await sourceAccount.updateBalance(amountInCents, 'debit');

        // Process interbank transaction
        const result = await interbankService.processOutgoingTransaction(transaction);

        res.status(201).json({
          status: 'success',
          message: 'Transaction completed successfully',
          data: {
            transaction: await Transaction.findById(transaction._id), // Get updated transaction
            receiverName: result.receiverName,
          },
        });
      } catch (error) {
        // If any error occurs during the transaction, update status to failed
        await Transaction.findByIdAndUpdate(transaction._id, {
          status: 'failed',
          errorMessage: error.message,
          failedAt: new Date()
        });

        // Credit back the source account
        await sourceAccount.updateBalance(amountInCents, 'credit');

        throw error;
      }
    } catch (error) {
      console.error('External transaction error:', error);
      res.status(500).json({
        status: 'error',
        message: error.message || 'Internal server error',
      });
    }
  }
);

/**
 * @swagger
 * /api/transactions/b2b:
 *   post:
 *     summary: Endpoint for receiving transactions from other banks
 *     tags: [Transactions]
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
 *     responses:
 *       200:
 *         description: Transaction processed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 receiverName:
 *                   type: string
 *       400:
 *         description: Invalid request
 *       404:
 *         description: Account not found
 *       500:
 *         description: Server error
 */
router.post('/b2b', async (req, res) => {
  try {
    const { jwt: jwtToken } = req.body;

    if (!jwtToken) {
      return res.status(400).json({
        status: 'error',
        message: 'JWT token is required',
      });
    }

    // Decode the JWT (without verification) to get the sender bank prefix
    let decodedToken;
    try {
      decodedToken = jwt.decode(jwtToken, { complete: true });
      if (!decodedToken) {
        throw new Error('Invalid JWT token format');
      }
    } catch (error) {
      return res.status(400).json({
        status: 'error',
        message: 'Failed to decode JWT token',
      });
    }

    // Get the sender bank prefix from the source account
    const { accountFrom, accountTo, currency, amount, explanation, senderName } = decodedToken.payload;
    const senderBankPrefix = accountFrom.substring(0, 3);

    // Verify that the destination account belongs to our bank
    const bankPrefix = process.env.BANK_PREFIX;
    if (!accountTo.startsWith(bankPrefix)) {
      return res.status(400).json({
        status: 'error',
        message: 'Destination account does not belong to this bank',
      });
    }

    // Get the sender bank details from Central Bank
    const centralBankUrl = process.env.CENTRAL_BANK_URL;
    const centralBankApiKey = process.env.CENTRAL_BANK_API_KEY;

    const bankResponse = await fetch(`${centralBankUrl}/banks/${senderBankPrefix}`, {
      headers: {
        'Authorization': `Bearer ${centralBankApiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!bankResponse.ok) {
      return res.status(502).json({
        status: 'error',
        message: 'Failed to verify sender bank with Central Bank',
      });
    }

    const bankData = await bankResponse.json();
    const senderBankJwksUrl = bankData.jwksUrl;

    // Get the sender bank's public key from its JWKS endpoint
    const jwksResponse = await fetch(senderBankJwksUrl);
    if (!jwksResponse.ok) {
      return res.status(400).json({
        status: 'error',
        message: 'Failed to retrieve sender bank public key',
      });
    }

    const jwksData = await jwksResponse.json();
    const key = jwksData.keys.find(k => k.kid === decodedToken.header.kid);
    
    if (!key) {
      return res.status(400).json({
        status: 'error',
        message: 'Sender bank public key not found',
      });
    }

    // Convert JWK to PEM format for verification
    // This is a simplified approach - in a real app, you would use a library like 'jwk-to-pem'
    // For this example, we'll assume the key is already in PEM format
    const publicKey = key.x5c[0]; // This is simplified

    // Verify the JWT signature
    try {
      jwt.verify(jwtToken, publicKey, { algorithms: ['RS256'] });
    } catch (error) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid JWT signature',
      });
    }

    // Find destination account
    const destinationAccount = await Account.findOne({ accountNumber: accountTo });
    if (!destinationAccount) {
      return res.status(404).json({
        status: 'error',
        message: 'Destination account not found',
      });
    }

    // Get destination account owner
    const destinationUser = await User.findById(destinationAccount.owner);
    if (!destinationUser) {
      return res.status(404).json({
        status: 'error',
        message: 'Destination account owner not found',
      });
    }

    // Create transaction record
    const transaction = new Transaction({
      transactionId: Transaction.generateTransactionId(),
      fromAccount: accountFrom,
      toAccount: accountTo,
      amount,
      currency,
      explanation,
      senderName,
      receiverName: destinationUser.fullName,
      status: 'pending',
      type: 'incoming',
      initiatedBy: destinationUser._id, // Set the receiver as the initiator for incoming transactions
    });

    // Save transaction
    await transaction.save();

    // Update transaction status to in progress
    await transaction.updateStatus('inProgress');

    try {
      // Credit the destination account
      await destinationAccount.updateBalance(amount, 'credit');

      // Update transaction status to completed
      await transaction.updateStatus('completed');

      // Return the receiver's name
      res.status(200).json({
        receiverName: destinationUser.fullName,
      });
    } catch (error) {
      // If any error occurs during the transaction, update status to failed
      await transaction.updateStatus('failed', error.message);
      throw error;
    }
  } catch (error) {
    console.error('B2B transaction error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Internal server error',
    });
  }
});

/**
 * @swagger
 * /api/transactions/jwks:
 *   get:
 *     summary: Get the bank's JSON Web Key Set (JWKS)
 *     tags: [Transactions]
 *     responses:
 *       200:
 *         description: JWKS containing the bank's public key
 *       500:
 *         description: Server error
 */
router.get('/jwks', async (req, res) => {
  try {
    const publicKeyPath = process.env.PUBLIC_KEY_PATH;
    const publicKey = fs.readFileSync(publicKeyPath, 'utf8');

    // Convert PEM to JWK (simplified)
    // In a real app, you would use a library like 'pem-jwk'
    const jwks = {
      keys: [
        {
          kty: 'RSA',
          use: 'sig',
          kid: '1',
          alg: 'RS256',
          // This is simplified - in a real app, you would properly convert the PEM to JWK components
          x5c: [publicKey.replace(/-----BEGIN PUBLIC KEY-----|-----END PUBLIC KEY-----|\n/g, '')],
        },
      ],
    };

    res.status(200).json(jwks);
  } catch (error) {
    console.error('JWKS error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve JWKS',
    });
  }
});

/**
 * @swagger
 * /api/transactions/{id}:
 *   get:
 *     summary: Get a specific transaction by ID
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Transaction details
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized to access this transaction
 *       404:
 *         description: Transaction not found
 *       500:
 *         description: Server error
 */
router.get('/:id', async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id);

    if (!transaction) {
      return res.status(404).json({
        status: 'error',
        message: 'Transaction not found',
      });
    }

    // Check if the transaction was initiated by the authenticated user
    if (transaction.initiatedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        status: 'error',
        message: 'You are not authorized to access this transaction',
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        transaction,
      },
    });
  } catch (error) {
    console.error('Get transaction error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error',
    });
  }
});

/**
 * @swagger
 * /.well-known/jwks.json:
 *   get:
 *     summary: Get bank's public keys in JWKS format
 *     tags: [Interbank]
 *     responses:
 *       200:
 *         description: JWKS (JSON Web Key Set) containing bank's public keys
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 keys:
 *                   type: array
 *                   items:
 *                     type: object
 *       500:
 *         description: Server error
 */
router.get(['/.well-known/jwks.json', '/jwks'], async (req, res) => {
  try {
    const jwks = jwtService.generateJWKS();
    res.status(200).json(jwks);
  } catch (error) {
    console.error('JWKS generation error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to generate JWKS'
    });
  }
});

/**
 * @swagger
 * /api/transactions/b2b:
 *   post:
 *     summary: Process interbank transaction from another bank
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
 *                 description: JWT signed by sender bank containing transaction data
 *     responses:
 *       200:
 *         description: Transaction processed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 receiverName:
 *                   type: string
 *                 message:
 *                   type: string
 *       400:
 *         description: Bad request or invalid JWT
 *       401:
 *         description: Invalid signature
 *       404:
 *         description: Destination account not found
 *       422:
 *         description: Transaction cannot be processed
 *       500:
 *         description: Server error
 */
router.post('/b2b', [
  body('jwt')
    .notEmpty()
    .withMessage('JWT is required')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        errors: errors.array(),
      });
    }

    const { jwt: transactionJWT } = req.body;

    // Process incoming interbank transaction
    const result = await interbankService.processIncomingTransaction(transactionJWT);

    res.status(200).json(result);

  } catch (error) {
    console.error('B2B transaction error:', error);
    
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        status: 'error',
        message: error.message
      });
    }

    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
});

/**
 * @swagger
 * /api/transactions/status/{transactionId}:
 *   get:
 *     summary: Get transaction status by ID
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: transactionId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Transaction status retrieved successfully
 *       404:
 *         description: Transaction not found
 *       500:
 *         description: Server error
 */
router.get('/status/:transactionId', async (req, res) => {
  try {
    const { transactionId } = req.params;
    
    const status = await interbankService.getTransactionStatus(transactionId);
    
    if (status.status === 'not_found') {
      return res.status(404).json({
        status: 'error',
        message: 'Transaction not found'
      });
    }

    res.status(200).json({
      status: 'success',
      data: status
    });

  } catch (error) {
    console.error('Get transaction status error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
});

module.exports = router;
