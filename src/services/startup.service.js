const centralBankService = require('./centralBank.service');

class StartupService {
  constructor() {
    this.bankName = process.env.BANK_NAME || 'My Bank';
    this.bankPrefix = process.env.BANK_PREFIX || 'ABC';
    this.serverPort = process.env.PORT || 3000;
  }

  /**
   * Initialize bank on startup
   */
  async initialize() {
    try {
      console.log(`Initializing bank ${this.bankName} (${this.bankPrefix})...`);

      // Wait a bit for server to be fully started
      await this.sleep(2000);

      await this.registerWithCentralBank();
      await this.verifyCentralBankConnection();

      console.log('Bank initialization completed successfully');
    } catch (error) {
      console.error('Bank initialization failed:', error.message);
      console.warn('Bank will continue to operate but may have limited interbank capabilities');
    }
  }

  /**
   * Register bank with central bank
   */
  async registerWithCentralBank() {
    try {
      const baseUrl = process.env.BASE_URL || `http://localhost:${this.serverPort}`;
      const registrationData = {
        name: this.bankName,
        jwksUrl: `${baseUrl}/.well-known/jwks.json`,
        apiUrl: `${baseUrl}/api`
      };

      console.log('Registering with central bank...');
      const result = await centralBankService.registerBank(registrationData);
      
      console.log('Successfully registered with central bank');
      return result;
    } catch (error) {
      // Don't throw error here - bank should work even if central bank is unavailable
      console.warn('Failed to register with central bank:', error.message);
      console.warn('Bank will operate in standalone mode');
    }
  }

  /**
   * Verify central bank connection
   */
  async verifyCentralBankConnection() {
    try {
      console.log('Verifying central bank connection...');
      const health = await centralBankService.healthCheck();
      
      if (health.status === 'connected') {
        console.log('Central bank connection verified');
      } else {
        console.warn('Central bank connection issues detected');
      }
      
      return health;
    } catch (error) {
      console.warn('Central bank connection verification failed:', error.message);
    }
  }

  /**
   * Sleep utility
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = new StartupService();
