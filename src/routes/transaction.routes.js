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

const router = express.Router();

// Apply authentication middleware to all transaction routes except b2b
router.use((req, res, next) => {
  if (req.path === '/b2b') {
    return next();
  }
  authenticate(req, res, next);
});

/**
 * @swagger
 * /api/transactions:
 *   get:
 *     summary: Get all transactions for the authenticated user
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, inProgress, completed, failed]
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [internal, external, incoming]
 *       - in: query
 *         name: accountNumber
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of transactions
 *       401:
 *         description: Not authenticated
 *       500:
 *         description: Server error
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

      // Check if destination account is from another bank
      const bankPrefix = process.env.BANK_PREFIX;
      if (toAccount.startsWith(bankPrefix)) {
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
        initiatedBy: req.user._id,
      });

      // Save transaction
      await transaction.save();

      // Update transaction status to in progress
      await transaction.updateStatus('inProgress');

      try {
        // Debit the source account
        await sourceAccount.updateBalance(amountInCents, 'debit');

        // Get the destination bank prefix (first 3 characters)
        const destinationBankPrefix = toAccount.substring(0, 3);

        // Get the destination bank details from Central Bank
        const centralBankUrl = process.env.CENTRAL_BANK_URL;
        const centralBankApiKey = process.env.CENTRAL_BANK_API_KEY;

        const bankResponse = await fetch(`${centralBankUrl}/banks/${destinationBankPrefix}`, {
          headers: {
            'Authorization': `Bearer ${centralBankApiKey}`,
            'Content-Type': 'application/json',
          },
        });

        if (!bankResponse.ok) {
          throw new Error(`Failed to get destination bank details: ${bankResponse.statusText}`);
        }

        const bankData = await bankResponse.json();
        const destinationBankUrl = bankData.transactionUrl;

        // Create JWT payload
        const payload = {
          accountFrom: fromAccount,
          accountTo: toAccount,
          currency: sourceAccount.currency,
          amount: amountInCents,
          explanation,
          senderName: req.user.fullName,
        };

        // Sign the JWT with our private key
        const privateKeyPath = process.env.PRIVATE_KEY_PATH;
        const privateKey = fs.readFileSync(privateKeyPath, 'utf8');

        const jwtToken = jwt.sign(payload, privateKey, {
          algorithm: 'RS256',
          keyid: '1', // Key ID for JWKS
        });

        // Send the transaction to the destination bank
        const transactionResponse = await fetch(`${destinationBankUrl}/transactions/b2b`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ jwt: jwtToken }),
        });

        if (!transactionResponse.ok) {
          const errorData = await transactionResponse.json();
          throw new Error(`Transaction failed: ${errorData.message || transactionResponse.statusText}`);
        }

        const responseData = await transactionResponse.json();

        // Update transaction with receiver name
        transaction.receiverName = responseData.receiverName || 'Unknown';
        
        // Update transaction status to completed
        await transaction.updateStatus('completed');

        res.status(201).json({
          status: 'success',
          message: 'Transaction completed successfully',
          data: {
            transaction,
            receiverName: responseData.receiverName,
          },
        });
      } catch (error) {
        // If any error occurs during the transaction, update status to failed
        await transaction.updateStatus('failed', error.message);

        // If the source account was already debited, credit it back
        if (transaction.status === 'inProgress') {
          await sourceAccount.updateBalance(amountInCents, 'credit');
        }

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

module.exports = router;
