/**
 * Accounts module for handling account operations
 */
class AccountsService {
  constructor() {
    this.accounts = [];
    this.selectedAccount = null;
  }

  /**
   * Load all accounts for the current user
   * @returns {Promise} - Resolves with accounts data
   */
  async loadAccounts() {
    try {
      const response = await api.getAccounts();
      this.accounts = response.data.accounts;
      return this.accounts;
    } catch (error) {
      console.error('Failed to load accounts:', error);
      throw error;
    }
  }

  /**
   * Get all accounts
   * @returns {Array} - List of accounts
   */
  getAccounts() {
    return this.accounts;
  }

  /**
   * Get account by ID
   * @param {string} id - Account ID
   * @returns {Object|null} - Account object or null if not found
   */
  getAccountById(id) {
    return this.accounts.find(account => account._id === id) || null;
  }

  /**
   * Get account by account number
   * @param {string} accountNumber - Account number
   * @returns {Object|null} - Account object or null if not found
   */
  getAccountByNumber(accountNumber) {
    return this.accounts.find(account => account.accountNumber === accountNumber) || null;
  }

  /**
   * Set the selected account
   * @param {string} id - Account ID
   */
  setSelectedAccount(id) {
    this.selectedAccount = this.getAccountById(id);
    return this.selectedAccount;
  }

  /**
   * Get the selected account
   * @returns {Object|null} - Selected account or null
   */
  getSelectedAccount() {
    return this.selectedAccount;
  }

  /**
   * Create a new account
   * @param {Object} accountData - Account data
   * @returns {Promise} - Resolves with new account data
   */
  async createAccount(accountData) {
    try {
      const response = await api.createAccount(accountData);
      this.accounts.push(response.data.account);
      return response.data.account;
    } catch (error) {
      console.error('Failed to create account:', error);
      throw error;
    }
  }

  /**
   * Update an account
   * @param {string} id - Account ID
   * @param {Object} accountData - Updated account data
   * @returns {Promise} - Resolves with updated account data
   */
  async updateAccount(id, accountData) {
    try {
      const response = await api.updateAccount(id, accountData);
      
      // Update the account in the local array
      const index = this.accounts.findIndex(account => account._id === id);
      if (index !== -1) {
        this.accounts[index] = response.data.account;
      }
      
      // Update selected account if it's the one being updated
      if (this.selectedAccount && this.selectedAccount._id === id) {
        this.selectedAccount = response.data.account;
      }
      
      return response.data.account;
    } catch (error) {
      console.error('Failed to update account:', error);
      throw error;
    }
  }

  /**
   * Get account balance
   * @param {string} accountNumber - Account number
   * @returns {Promise} - Resolves with account balance data
   */
  async getAccountBalance(accountNumber) {
    try {
      const response = await api.getAccountBalance(accountNumber);
      
      // Update the balance in the local account object
      const account = this.getAccountByNumber(accountNumber);
      if (account) {
        account.balance = response.data.balance * 100; // Convert to cents
        account.formattedBalance = response.data.formattedBalance;
      }
      
      return response.data;
    } catch (error) {
      console.error('Failed to get account balance:', error);
      throw error;
    }
  }

  /**
   * Format currency amount
   * @param {number} amount - Amount in cents
   * @param {string} currency - Currency code
   * @returns {string} - Formatted currency string
   */
  formatCurrency(amount, currency) {
    const formatter = new Intl.NumberFormat('et-EE', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2
    });
    
    return formatter.format(amount / 100);
  }
}

// Create a singleton instance
const accountsService = new AccountsService();
