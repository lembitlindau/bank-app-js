/**
 * Transactions module for handling transaction operations
 */
class TransactionsService {
  constructor() {
    this.transactions = [];
    this.selectedTransaction = null;
  }

  /**
   * Load all transactions for the current user
   * @param {Object} params - Filter parameters
   * @returns {Promise} - Resolves with transactions data
   */
  async loadTransactions(params = {}) {
    try {
      const response = await api.getTransactions(params);
      this.transactions = response.data.transactions;
      return this.transactions;
    } catch (error) {
      console.error('Failed to load transactions:', error);
      throw error;
    }
  }

  /**
   * Get all transactions
   * @returns {Array} - List of transactions
   */
  getTransactions() {
    return this.transactions;
  }

  /**
   * Get transaction by ID
   * @param {string} id - Transaction ID
   * @returns {Object|null} - Transaction object or null if not found
   */
  getTransactionById(id) {
    return this.transactions.find(transaction => transaction._id === id) || null;
  }

  /**
   * Set the selected transaction
   * @param {string} id - Transaction ID
   */
  setSelectedTransaction(id) {
    this.selectedTransaction = this.getTransactionById(id);
    return this.selectedTransaction;
  }

  /**
   * Get the selected transaction
   * @returns {Object|null} - Selected transaction or null
   */
  getSelectedTransaction() {
    return this.selectedTransaction;
  }

  /**
   * Create a new internal transaction
   * @param {Object} transactionData - Transaction data
   * @returns {Promise} - Resolves with new transaction data
   */
  async createInternalTransaction(transactionData) {
    try {
      const response = await api.createInternalTransaction(transactionData);
      return response.data.transaction;
    } catch (error) {
      console.error('Failed to create internal transaction:', error);
      throw error;
    }
  }

  /**
   * Create a new external transaction
   * @param {Object} transactionData - Transaction data
   * @returns {Promise} - Resolves with new transaction data
   */
  async createExternalTransaction(transactionData) {
    try {
      const response = await api.createExternalTransaction(transactionData);
      return response.data.transaction;
    } catch (error) {
      console.error('Failed to create external transaction:', error);
      throw error;
    }
  }

  /**
   * Get transactions for a specific account
   * @param {string} accountNumber - Account number
   * @returns {Promise} - Resolves with account transactions
   */
  async getAccountTransactions(accountNumber) {
    try {
      return await this.loadTransactions({ accountNumber });
    } catch (error) {
      console.error('Failed to get account transactions:', error);
      throw error;
    }
  }

  /**
   * Format transaction date
   * @param {string} dateString - ISO date string
   * @returns {string} - Formatted date string
   */
  formatTransactionDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('et-EE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Get transaction status class
   * @param {string} status - Transaction status
   * @returns {string} - CSS class for the status
   */
  getStatusClass(status) {
    const statusClasses = {
      pending: 'status-pending',
      inProgress: 'status-inProgress',
      completed: 'status-completed',
      failed: 'status-failed'
    };
    
    return statusClasses[status] || '';
  }

  /**
   * Get transaction status text in Estonian
   * @param {string} status - Transaction status
   * @returns {string} - Status text in Estonian
   */
  getStatusText(status) {
    const statusTexts = {
      pending: 'Ootel',
      inProgress: 'Töötlemisel',
      completed: 'Teostatud',
      failed: 'Ebaõnnestunud'
    };
    
    return statusTexts[status] || status;
  }

  /**
   * Get transaction type text in Estonian
   * @param {string} type - Transaction type
   * @returns {string} - Type text in Estonian
   */
  getTypeText(type) {
    const typeTexts = {
      internal: 'Sisene',
      external: 'Väline',
      incoming: 'Sissetulev'
    };
    
    return typeTexts[type] || type;
  }

  /**
   * Determine if a transaction is a credit (incoming) for an account
   * @param {Object} transaction - Transaction object
   * @param {string} accountNumber - Account number
   * @returns {boolean} - True if credit, false if debit
   */
  isCredit(transaction, accountNumber) {
    return transaction.toAccount === accountNumber;
  }

  /**
   * Format transaction amount with appropriate sign
   * @param {Object} transaction - Transaction object
   * @param {string} accountNumber - Account number
   * @returns {string} - Formatted amount with sign
   */
  formatTransactionAmount(transaction, accountNumber) {
    const isCredit = this.isCredit(transaction, accountNumber);
    const amount = transaction.amount / 100; // Convert from cents
    
    const formatter = new Intl.NumberFormat('et-EE', {
      style: 'currency',
      currency: transaction.currency,
      minimumFractionDigits: 2
    });
    
    return isCredit ? `+${formatter.format(amount)}` : `-${formatter.format(amount)}`;
  }
}

// Create a singleton instance
const transactionsService = new TransactionsService();
