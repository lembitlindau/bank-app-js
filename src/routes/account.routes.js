const express = require('express');
const { body, validationResult } = require('express-validator');
const Account = require('../models/account.model');
const { authenticate } = require('../middlewares/auth.middleware');

const router = express.Router();

// Apply authentication middleware to all account routes
router.use(authenticate);

/**
 * @swagger
 * /api/accounts:
 *   get:
 *     summary: Get all accounts for the authenticated user
 *     tags: [Accounts]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of user accounts
 *       401:
 *         description: Not authenticated
 *       500:
 *         description: Server error
 */
router.get('/', async (req, res) => {
  try {
    const accounts = await Account.find({ owner: req.user._id });

    res.status(200).json({
      status: 'success',
      results: accounts.length,
      data: {
        accounts,
      },
    });
  } catch (error) {
    console.error('Get accounts error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error',
    });
  }
});

/**
 * @swagger
 * /api/accounts/{id}:
 *   get:
 *     summary: Get a specific account by ID
 *     tags: [Accounts]
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
 *         description: Account details
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized to access this account
 *       404:
 *         description: Account not found
 *       500:
 *         description: Server error
 */
router.get('/:id', async (req, res) => {
  try {
    const account = await Account.findById(req.params.id);

    if (!account) {
      return res.status(404).json({
        status: 'error',
        message: 'Account not found',
      });
    }

    // Check if the account belongs to the authenticated user
    if (account.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        status: 'error',
        message: 'You are not authorized to access this account',
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        account,
      },
    });
  } catch (error) {
    console.error('Get account error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error',
    });
  }
});

/**
 * @swagger
 * /api/accounts:
 *   post:
 *     summary: Create a new account
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
 *               currency:
 *                 type: string
 *                 enum: [EUR, USD, GBP]
 *               initialBalance:
 *                 type: number
 *                 minimum: 0
 *     responses:
 *       201:
 *         description: Account created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Not authenticated
 *       500:
 *         description: Server error
 */
router.post(
  '/',
  [
    body('accountName')
      .trim()
      .notEmpty()
      .withMessage('Account name is required'),
    body('currency')
      .isIn(['EUR', 'USD', 'GBP'])
      .withMessage('Currency must be one of: EUR, USD, GBP'),
    body('initialBalance')
      .optional()
      .isNumeric()
      .withMessage('Initial balance must be a number')
      .custom((value) => value >= 0)
      .withMessage('Initial balance cannot be negative'),
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

      const { accountName, currency, initialBalance = 0 } = req.body;

      // Generate account number
      const accountNumber = Account.generateAccountNumber();

      // Create new account
      const account = new Account({
        accountNumber,
        owner: req.user._id,
        accountName,
        currency,
        balance: initialBalance * 100, // Store in cents
      });

      await account.save();

      res.status(201).json({
        status: 'success',
        message: 'Account created successfully',
        data: {
          account,
        },
      });
    } catch (error) {
      console.error('Create account error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Internal server error',
      });
    }
  }
);

/**
 * @swagger
 * /api/accounts/{id}:
 *   patch:
 *     summary: Update account details
 *     tags: [Accounts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               accountName:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Account updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized to update this account
 *       404:
 *         description: Account not found
 *       500:
 *         description: Server error
 */
router.patch(
  '/:id',
  [
    body('accountName')
      .optional()
      .trim()
      .notEmpty()
      .withMessage('Account name cannot be empty'),
    body('isActive').optional().isBoolean().withMessage('isActive must be a boolean'),
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

      // Find the account
      const account = await Account.findById(req.params.id);

      if (!account) {
        return res.status(404).json({
          status: 'error',
          message: 'Account not found',
        });
      }

      // Check if the account belongs to the authenticated user
      if (account.owner.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          status: 'error',
          message: 'You are not authorized to update this account',
        });
      }

      // Update account fields
      const { accountName, isActive } = req.body;

      if (accountName !== undefined) {
        account.accountName = accountName;
      }

      if (isActive !== undefined) {
        account.isActive = isActive;
      }

      account.updatedAt = Date.now();
      await account.save();

      res.status(200).json({
        status: 'success',
        message: 'Account updated successfully',
        data: {
          account,
        },
      });
    } catch (error) {
      console.error('Update account error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Internal server error',
      });
    }
  }
);

/**
 * @swagger
 * /api/accounts/{accountNumber}/balance:
 *   get:
 *     summary: Get account balance by account number
 *     tags: [Accounts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: accountNumber
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Account balance
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized to access this account
 *       404:
 *         description: Account not found
 *       500:
 *         description: Server error
 */
router.get('/:accountNumber/balance', async (req, res) => {
  try {
    const account = await Account.findOne({
      accountNumber: req.params.accountNumber,
    });

    if (!account) {
      return res.status(404).json({
        status: 'error',
        message: 'Account not found',
      });
    }

    // Check if the account belongs to the authenticated user
    if (account.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        status: 'error',
        message: 'You are not authorized to access this account',
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        accountNumber: account.accountNumber,
        balance: account.balance / 100, // Convert from cents to main unit
        formattedBalance: account.formattedBalance,
        currency: account.currency,
      },
    });
  } catch (error) {
    console.error('Get balance error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error',
    });
  }
});

module.exports = router;
