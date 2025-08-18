const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

class JWTService {
  constructor() {
    this.privateKeyPath = process.env.PRIVATE_KEY_PATH || './keys/private.pem';
    this.publicKeyPath = process.env.PUBLIC_KEY_PATH || './keys/public.pem';
    this.keyPassphrase = process.env.KEY_PASSPHRASE || 'bankkey123';
    this.bankPrefix = process.env.BANK_PREFIX || 'ABC';
    this._publicKey = null;
    this._privateKey = null;
  }

  /**
   * Load private key
   */
  getPrivateKey() {
    if (!this._privateKey) {
      try {
        const keyPath = path.resolve(this.privateKeyPath);
        this._privateKey = fs.readFileSync(keyPath, 'utf8');
      } catch (error) {
        throw new Error(`Failed to load private key: ${error.message}`);
      }
    }
    return this._privateKey;
  }

  /**
   * Load public key
   */
  getPublicKey() {
    if (!this._publicKey) {
      try {
        const keyPath = path.resolve(this.publicKeyPath);
        this._publicKey = fs.readFileSync(keyPath, 'utf8');
      } catch (error) {
        throw new Error(`Failed to load public key: ${error.message}`);
      }
    }
    return this._publicKey;
  }

  /**
   * Create JWT for interbank transaction
   */
  createInterbankJWT(transactionData) {
    try {
      const privateKey = this.getPrivateKey();
      
      const payload = {
        iss: this.bankPrefix, // issuer (saatja pank)
        aud: transactionData.receiverBankPrefix, // audience (saaja pank)
        iat: Math.floor(Date.now() / 1000), // issued at
        exp: Math.floor(Date.now() / 1000) + (60 * 60), // expires in 1 hour
        jti: transactionData.transactionId, // JWT ID (unique transaction ID)
        accountFrom: transactionData.fromAccount,
        accountTo: transactionData.toAccount,
        amount: transactionData.amount,
        currency: transactionData.currency,
        explanation: transactionData.explanation,
        senderName: transactionData.senderName,
        receiverName: transactionData.receiverName || ''
      };

      const options = {
        algorithm: 'RS256',
        keyid: 'bank-key-1'
      };

      return jwt.sign(payload, privateKey, {
        ...options,
        passphrase: this.keyPassphrase
      });
    } catch (error) {
      throw new Error(`Failed to create JWT: ${error.message}`);
    }
  }

  /**
   * Verify JWT from another bank
   */
  async verifyInterbankJWT(token, senderBankPrefix) {
    try {
      // Get sender bank's public key from central bank or cache
      const senderPublicKey = await this.getSenderPublicKey(senderBankPrefix);
      
      const decoded = jwt.verify(token, senderPublicKey, {
        algorithms: ['RS256'],
        issuer: senderBankPrefix,
        audience: this.bankPrefix
      });

      return decoded;
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new Error('Transaction JWT has expired');
      } else if (error.name === 'JsonWebTokenError') {
        throw new Error('Invalid transaction JWT signature');
      } else {
        throw new Error(`JWT verification failed: ${error.message}`);
      }
    }
  }

  /**
   * Get public key from another bank via central bank
   */
  async getSenderPublicKey(bankPrefix) {
    try {
      // First try to get from cache
      const cachedKey = this.getCachedPublicKey(bankPrefix);
      if (cachedKey) {
        return cachedKey;
      }

      // Get from central bank
      const centralBankService = require('./centralBank.service');
      const publicKey = await centralBankService.getBankPublicKey(bankPrefix);
      
      // Cache the key
      this.cachePublicKey(bankPrefix, publicKey);
      
      return publicKey;
    } catch (error) {
      // If central bank is unavailable, try cached version
      const cachedKey = this.getCachedPublicKey(bankPrefix);
      if (cachedKey) {
        console.warn(`Using cached public key for bank ${bankPrefix} due to central bank error:`, error.message);
        return cachedKey;
      }
      throw new Error(`Failed to get public key for bank ${bankPrefix}: ${error.message}`);
    }
  }

  /**
   * Generate JWKS (JSON Web Key Set) for public key distribution
   */
  generateJWKS() {
    try {
      const publicKey = this.getPublicKey();
      const key = crypto.createPublicKey(publicKey);
      const keyData = key.export({ format: 'jwk' });

      return {
        keys: [
          {
            kty: keyData.kty,
            use: 'sig',
            kid: 'bank-key-1',
            n: keyData.n,
            e: keyData.e,
            alg: 'RS256'
          }
        ]
      };
    } catch (error) {
      throw new Error(`Failed to generate JWKS: ${error.message}`);
    }
  }

  /**
   * Cache public key locally
   */
  cachePublicKey(bankPrefix, publicKey) {
    // Simple in-memory cache (in production, use Redis or similar)
    if (!this.keyCache) {
      this.keyCache = new Map();
    }
    this.keyCache.set(bankPrefix, {
      key: publicKey,
      timestamp: Date.now()
    });
  }

  /**
   * Get cached public key
   */
  getCachedPublicKey(bankPrefix) {
    if (!this.keyCache) {
      return null;
    }
    
    const cached = this.keyCache.get(bankPrefix);
    if (!cached) {
      return null;
    }

    // Check if cache is older than 1 hour
    const cacheAge = Date.now() - cached.timestamp;
    if (cacheAge > 60 * 60 * 1000) {
      this.keyCache.delete(bankPrefix);
      return null;
    }

    return cached.key;
  }
}

module.exports = new JWTService();
