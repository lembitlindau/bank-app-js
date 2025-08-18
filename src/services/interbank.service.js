const fetch = require('node-fetch');
const jwtService = require('./jwt.service');
const centralBankService = require('./centralBank.service');
const Transaction = require('../models/transaction.model');
const Account = require('../models/account.model');

class InterbankService {
  constructor() {
    this.maxRetries = 3;
    this.retryDelay = 1000;
  }

  /**
   * Process outgoing interbank transaction
   */
  async processOutgoingTransaction(transaction) {
    try {
      console.log(`Processing outgoing interbank transaction: ${transaction.transactionId}`);

      // Extract receiver bank prefix from account number
      const receiverBankPrefix = this.extractBankPrefix(transaction.toAccount);
      
      if (!receiverBankPrefix) {
        throw new Error('Invalid receiver account number format');
      }

      // Get receiver bank information
      const receiverBank = await centralBankService.getBankInfo(receiverBankPrefix);
      if (!receiverBank) {
        throw new Error(`Receiver bank ${receiverBankPrefix} not found`);
      }

      // Create JWT for the transaction
      const transactionJWT = jwtService.createInterbankJWT({
        transactionId: transaction.transactionId,
        fromAccount: transaction.fromAccount,
        toAccount: transaction.toAccount,
        amount: transaction.amount,
        currency: transaction.currency,
        explanation: transaction.explanation,
        senderName: transaction.senderName,
        receiverName: transaction.receiverName,
        receiverBankPrefix: receiverBankPrefix
      });

      // Update transaction status
      await Transaction.findByIdAndUpdate(transaction._id, {
        status: 'inProgress',
        receiverBankPrefix: receiverBankPrefix
      });

      // Send transaction to receiver bank
      const result = await this.sendTransactionToBank(receiverBank, transactionJWT);

      // Update transaction with result
      await Transaction.findByIdAndUpdate(transaction._id, {
        status: 'completed',
        receiverName: result.receiverName,
        completedAt: new Date()
      });

      console.log(`Outgoing transaction ${transaction.transactionId} completed successfully`);
      return result;

    } catch (error) {
      console.error(`Outgoing transaction ${transaction.transactionId} failed:`, error.message);
      
      // Update transaction status to failed
      await Transaction.findByIdAndUpdate(transaction._id, {
        status: 'failed',
        errorMessage: error.message,
        failedAt: new Date()
      });

      throw error;
    }
  }

  /**
   * Process incoming interbank transaction
   */
  async processIncomingTransaction(jwtToken) {
    try {
      console.log('Processing incoming interbank transaction');

      // Decode and verify JWT
      const decoded = await this.verifyIncomingJWT(jwtToken);
      
      console.log(`Incoming transaction from ${decoded.iss}: ${decoded.jti}`);

      // Check if transaction already exists (prevent replay attacks)
      const existingTransaction = await Transaction.findOne({
        transactionId: decoded.jti
      });

      if (existingTransaction) {
        throw new Error('Transaction already processed');
      }

      // Find destination account
      const destinationAccount = await Account.findOne({
        accountNumber: decoded.accountTo,
        isActive: true
      }).populate('owner', 'firstName lastName');

      if (!destinationAccount) {
        throw new Error('Destination account not found');
      }

      // Create transaction record
      const transaction = new Transaction({
        transactionId: decoded.jti,
        fromAccount: decoded.accountFrom,
        toAccount: decoded.accountTo,
        amount: decoded.amount,
        currency: decoded.currency,
        explanation: decoded.explanation,
        senderName: decoded.senderName,
        receiverName: decoded.receiverName || destinationAccount.owner.fullName,
        status: 'completed',
        type: 'incoming',
        senderBankPrefix: decoded.iss,
        isInterbank: true,
        receivedAt: new Date()
      });

      await transaction.save();

      // Update destination account balance
      destinationAccount.balance += decoded.amount;
      destinationAccount.updatedAt = new Date();
      await destinationAccount.save();

      console.log(`Incoming transaction ${decoded.jti} processed successfully`);

      return {
        status: 'success',
        receiverName: destinationAccount.owner.fullName,
        message: 'Transaction accepted'
      };

    } catch (error) {
      console.error('Incoming transaction failed:', error.message);
      
      if (error.message.includes('JWT') || error.message.includes('signature')) {
        throw { statusCode: 401, message: error.message };
      } else if (error.message.includes('not found')) {
        throw { statusCode: 404, message: error.message };
      } else if (error.message.includes('already processed')) {
        throw { statusCode: 400, message: error.message };
      } else {
        throw { statusCode: 422, message: error.message };
      }
    }
  }

  /**
   * Send transaction to receiver bank
   */
  async sendTransactionToBank(receiverBank, transactionJWT) {
    const url = `${receiverBank.apiUrl || receiverBank.baseUrl}/api/transactions/b2b`;
    
    let lastError;
    
    for (let i = 0; i < this.maxRetries; i++) {
      try {
        console.log(`Sending transaction to ${receiverBank.prefix} (attempt ${i + 1})`);
        
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            jwt: transactionJWT
          }),
          timeout: 30000
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        const result = await response.json();
        return result;

      } catch (error) {
        lastError = error;
        console.warn(`Transaction send failed (attempt ${i + 1}):`, error.message);
        
        if (i < this.maxRetries - 1) {
          const delay = this.retryDelay * Math.pow(2, i);
          console.log(`Retrying in ${delay}ms...`);
          await this.sleep(delay);
        }
      }
    }
    
    throw lastError;
  }

  /**
   * Verify incoming JWT
   */
  async verifyIncomingJWT(jwtToken) {
    try {
      // First decode without verification to get issuer
      const unverified = require('jsonwebtoken').decode(jwtToken);
      if (!unverified || !unverified.iss) {
        throw new Error('Invalid JWT format');
      }

      // Verify with sender bank's public key
      const verified = await jwtService.verifyInterbankJWT(jwtToken, unverified.iss);
      return verified;
      
    } catch (error) {
      throw new Error(`JWT verification failed: ${error.message}`);
    }
  }

  /**
   * Extract bank prefix from account number
   */
  extractBankPrefix(accountNumber) {
    if (!accountNumber || accountNumber.length < 3) {
      return null;
    }
    
    // Bank prefix is first 3 characters
    return accountNumber.substring(0, 3).toUpperCase();
  }

  /**
   * Check if account belongs to another bank
   */
  isExternalAccount(accountNumber) {
    const bankPrefix = process.env.BANK_PREFIX || 'ABC';
    const accountBankPrefix = this.extractBankPrefix(accountNumber);
    return accountBankPrefix && accountBankPrefix !== bankPrefix;
  }

  /**
   * Get transaction status
   */
  async getTransactionStatus(transactionId) {
    try {
      const transaction = await Transaction.findOne({
        transactionId: transactionId
      });

      if (!transaction) {
        return { status: 'not_found' };
      }

      return {
        status: transaction.status,
        transactionId: transaction.transactionId,
        amount: transaction.amount,
        currency: transaction.currency,
        createdAt: transaction.createdAt,
        completedAt: transaction.completedAt,
        errorMessage: transaction.errorMessage
      };
    } catch (error) {
      console.error('Get transaction status error:', error);
      throw error;
    }
  }

  /**
   * Sleep utility function
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = new InterbankService();
