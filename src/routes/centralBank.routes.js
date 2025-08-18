const express = require('express');
const centralBankService = require('../services/centralBank.service');

const router = express.Router();

/**
 * @swagger
 * /api/central-bank/health:
 *   get:
 *     summary: Check central bank connection health
 *     tags: [Central Bank]
 *     responses:
 *       200:
 *         description: Central bank connection status
 *       500:
 *         description: Server error
 */
router.get('/health', async (req, res) => {
  try {
    const health = await centralBankService.healthCheck();
    
    res.status(200).json({
      status: 'success',
      data: health
    });
  } catch (error) {
    console.error('Central bank health check error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to check central bank health'
    });
  }
});

/**
 * @swagger
 * /api/central-bank/banks:
 *   get:
 *     summary: Get list of registered banks
 *     tags: [Central Bank]
 *     responses:
 *       200:
 *         description: List of banks retrieved successfully
 *       500:
 *         description: Server error
 */
router.get('/banks', async (req, res) => {
  try {
    const banks = await centralBankService.getBanks();
    
    res.status(200).json({
      status: 'success',
      data: {
        banks
      }
    });
  } catch (error) {
    console.error('Get banks error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get banks list'
    });
  }
});

/**
 * @swagger
 * /api/central-bank/banks/{prefix}:
 *   get:
 *     summary: Get information about a specific bank
 *     tags: [Central Bank]
 *     parameters:
 *       - in: path
 *         name: prefix
 *         required: true
 *         schema:
 *           type: string
 *         description: Bank prefix
 *     responses:
 *       200:
 *         description: Bank information retrieved successfully
 *       404:
 *         description: Bank not found
 *       500:
 *         description: Server error
 */
router.get('/banks/:prefix', async (req, res) => {
  try {
    const { prefix } = req.params;
    const bank = await centralBankService.getBankInfo(prefix);
    
    if (!bank) {
      return res.status(404).json({
        status: 'error',
        message: 'Bank not found'
      });
    }
    
    res.status(200).json({
      status: 'success',
      data: {
        bank
      }
    });
  } catch (error) {
    console.error('Get bank info error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get bank information'
    });
  }
});

/**
 * @swagger
 * /api/central-bank/register:
 *   post:
 *     summary: Register this bank with central bank
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
 *               jwksUrl:
 *                 type: string
 *               apiUrl:
 *                 type: string
 *     responses:
 *       200:
 *         description: Bank registered successfully
 *       400:
 *         description: Registration failed
 *       500:
 *         description: Server error
 */
router.post('/register', async (req, res) => {
  try {
    const { name, jwksUrl, apiUrl } = req.body;
    
    if (!name || !jwksUrl) {
      return res.status(400).json({
        status: 'error',
        message: 'Name and JWKS URL are required'
      });
    }
    
    const result = await centralBankService.registerBank({
      name,
      jwksUrl,
      apiUrl: apiUrl || `${req.protocol}://${req.get('host')}/api`
    });
    
    res.status(200).json({
      status: 'success',
      message: 'Bank registered successfully',
      data: result
    });
  } catch (error) {
    console.error('Bank registration error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to register bank'
    });
  }
});

module.exports = router;
