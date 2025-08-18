const fetch = require('node-fetch');

class CentralBankService {
  constructor() {
    this.baseUrl = process.env.CENTRAL_BANK_URL || 'https://keskpank.herokuapp.com';
    this.apiKey = process.env.CENTRAL_BANK_API_KEY;
    this.bankPrefix = process.env.BANK_PREFIX || 'ABC';
    this.retryCount = 3;
    this.retryDelay = 1000; // Start with 1 second
  }

  /**
   * Register bank with central bank
   */
  async registerBank(bankData) {
    try {
      const response = await this.makeRequest('/api/banks/register', {
        method: 'POST',
        body: JSON.stringify({
          name: bankData.name,
          prefix: this.bankPrefix,
          jwksUrl: bankData.jwksUrl,
          ...bankData
        })
      });

      return response;
    } catch (error) {
      throw new Error(`Failed to register bank: ${error.message}`);
    }
  }

  /**
   * Get list of all registered banks
   */
  async getBanks() {
    try {
      const response = await this.makeRequest('/api/banks');
      return response;
    } catch (error) {
      console.warn('Failed to get banks from central bank:', error.message);
      return this.getCachedBanks();
    }
  }

  /**
   * Get public key for a specific bank
   */
  async getBankPublicKey(bankPrefix) {
    try {
      // First try to get bank's JWKS URL from central bank
      const bank = await this.getBankInfo(bankPrefix);
      if (!bank || !bank.jwksUrl) {
        throw new Error(`No JWKS URL found for bank ${bankPrefix}`);
      }

      // Fetch JWKS from bank's endpoint
      const jwks = await this.makeRequest(bank.jwksUrl, {}, false);
      
      if (!jwks.keys || !jwks.keys[0]) {
        throw new Error(`Invalid JWKS format from bank ${bankPrefix}`);
      }

      // Convert JWK to PEM format
      const publicKey = this.jwkToPem(jwks.keys[0]);
      return publicKey;
    } catch (error) {
      throw new Error(`Failed to get public key for bank ${bankPrefix}: ${error.message}`);
    }
  }

  /**
   * Get information about a specific bank
   */
  async getBankInfo(bankPrefix) {
    try {
      const response = await this.makeRequest(`/api/banks/${bankPrefix}`);
      return response;
    } catch (error) {
      console.warn(`Failed to get bank info for ${bankPrefix}:`, error.message);
      return this.getCachedBankInfo(bankPrefix);
    }
  }

  /**
   * Update bank information
   */
  async updateBank(bankData) {
    try {
      const response = await this.makeRequest(`/api/banks/${this.bankPrefix}`, {
        method: 'PUT',
        body: JSON.stringify(bankData)
      });

      return response;
    } catch (error) {
      throw new Error(`Failed to update bank: ${error.message}`);
    }
  }

  /**
   * Make HTTP request with retry logic
   */
  async makeRequest(url, options = {}, useCentralBank = true) {
    const fullUrl = useCentralBank ? `${this.baseUrl}${url}` : url;
    
    const defaultOptions = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` })
      },
      timeout: 30000, // 30 second timeout
      ...options
    };

    let lastError;
    
    for (let i = 0; i < this.retryCount; i++) {
      try {
        console.log(`Making request to ${fullUrl} (attempt ${i + 1})`);
        
        const response = await fetch(fullUrl, defaultOptions);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        return data;
      } catch (error) {
        lastError = error;
        console.warn(`Request failed (attempt ${i + 1}):`, error.message);
        
        if (i < this.retryCount - 1) {
          const delay = this.retryDelay * Math.pow(2, i); // Exponential backoff
          console.log(`Retrying in ${delay}ms...`);
          await this.sleep(delay);
        }
      }
    }
    
    throw lastError;
  }

  /**
   * Convert JWK to PEM format
   */
  jwkToPem(jwk) {
    try {
      const crypto = require('crypto');
      
      // Create public key from JWK
      const publicKey = crypto.createPublicKey({
        key: jwk,
        format: 'jwk'
      });
      
      // Export as PEM
      return publicKey.export({
        type: 'spki',
        format: 'pem'
      });
    } catch (error) {
      throw new Error(`Failed to convert JWK to PEM: ${error.message}`);
    }
  }

  /**
   * Cache banks data locally (in production use Redis or database)
   */
  cacheBanks(banks) {
    if (!this.banksCache) {
      this.banksCache = {
        data: null,
        timestamp: null
      };
    }
    
    this.banksCache.data = banks;
    this.banksCache.timestamp = Date.now();
  }

  /**
   * Get cached banks data
   */
  getCachedBanks() {
    if (!this.banksCache || !this.banksCache.data) {
      return [];
    }
    
    // Check if cache is older than 1 hour
    const cacheAge = Date.now() - this.banksCache.timestamp;
    if (cacheAge > 60 * 60 * 1000) {
      return [];
    }
    
    console.log('Using cached banks data due to central bank unavailability');
    return this.banksCache.data;
  }

  /**
   * Get cached bank info
   */
  getCachedBankInfo(bankPrefix) {
    const banks = this.getCachedBanks();
    return banks.find(bank => bank.prefix === bankPrefix);
  }

  /**
   * Sleep utility function
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Health check
   */
  async healthCheck() {
    try {
      const response = await this.makeRequest('/health');
      return { status: 'connected', data: response };
    } catch (error) {
      return { status: 'disconnected', error: error.message };
    }
  }
}

module.exports = new CentralBankService();
