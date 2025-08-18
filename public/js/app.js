/**
 * Main application controller
 */
class App {
  constructor() {
    this.currentView = null;
    this.initialized = false;
  }

  /**
   * Initialize the application
   */
  async init() {
    try {
      console.log('Initializing application...');
      
      // Initialize authentication
      const isAuthenticated = await auth.init();
      
      // Set up authentication state listener
      auth.addAuthStateListener(this.handleAuthStateChange.bind(this));
      
      // Show initial view based on authentication status
      if (isAuthenticated) {
        await this.showDashboard();
      } else {
        this.showLogin();
      }
      
      this.initialized = true;
      console.log('Application initialized successfully');
    } catch (error) {
      console.error('Failed to initialize application:', error);
      this.showError('Rakenduse käivitamine ebaõnnestus. Palun laadige lehekülg uuesti.');
    }
  }

  /**
   * Handle authentication state changes
   * @param {boolean} isAuthenticated - Authentication status
   * @param {Object} user - Current user object
   */
  handleAuthStateChange(isAuthenticated, user) {
    if (isAuthenticated) {
      this.updateNavigation(true, user);
    } else {
      this.updateNavigation(false);
      this.showLogin();
    }
  }

  /**
   * Update navigation based on authentication status
   * @param {boolean} isAuthenticated - Authentication status
   * @param {Object} user - Current user object
   */
  updateNavigation(isAuthenticated, user = null) {
    const navLinks = document.getElementById('navLinks');
    
    if (isAuthenticated && user) {
      navLinks.innerHTML = `
        <li class="nav-item">
          <a class="nav-link" href="#" id="dashboardLink">
            <i class="bi bi-house me-1"></i>Avaleht
          </a>
        </li>
        <li class="nav-item">
          <a class="nav-link" href="#" id="accountsLink">
            <i class="bi bi-wallet me-1"></i>Kontod
          </a>
        </li>
        <li class="nav-item">
          <a class="nav-link" href="#" id="transactionsLink">
            <i class="bi bi-arrow-left-right me-1"></i>Tehingud
          </a>
        </li>
        <li class="nav-item dropdown">
          <a class="nav-link dropdown-toggle" href="#" id="userDropdown" role="button" data-bs-toggle="dropdown">
            <i class="bi bi-person me-1"></i>${user.firstName} ${user.lastName}
          </a>
          <ul class="dropdown-menu" aria-labelledby="userDropdown">
            <li><a class="dropdown-item" href="#" id="profileLink">
              <i class="bi bi-person-gear me-2"></i>Profiil
            </a></li>
            <li><hr class="dropdown-divider"></li>
            <li><a class="dropdown-item" href="#" id="logoutLink">
              <i class="bi bi-box-arrow-right me-2"></i>Logi välja
            </a></li>
          </ul>
        </li>
      `;
      
      // Add event listeners
      document.getElementById('dashboardLink').addEventListener('click', (e) => {
        e.preventDefault();
        this.showDashboard();
      });
      
      document.getElementById('accountsLink').addEventListener('click', (e) => {
        e.preventDefault();
        this.showDashboard();
      });
      
      document.getElementById('transactionsLink').addEventListener('click', (e) => {
        e.preventDefault();
        this.showTransactionHistory();
      });
      
      document.getElementById('logoutLink').addEventListener('click', (e) => {
        e.preventDefault();
        this.logout();
      });
    } else {
      navLinks.innerHTML = `
        <li class="nav-item">
          <a class="nav-link" href="#" id="loginNavLink">Sisselogimine</a>
        </li>
        <li class="nav-item">
          <a class="nav-link" href="#" id="registerNavLink">Registreerimine</a>
        </li>
      `;
      
      // Add event listeners for non-authenticated navigation
      const loginNavLink = document.getElementById('loginNavLink');
      const registerNavLink = document.getElementById('registerNavLink');
      
      if (loginNavLink) {
        loginNavLink.addEventListener('click', (e) => {
          e.preventDefault();
          this.showLogin();
        });
      }
      
      if (registerNavLink) {
        registerNavLink.addEventListener('click', (e) => {
          e.preventDefault();
          this.showRegister();
        });
      }
    }
  }

  /**
   * Show login view
   */
  showLogin() {
    this.currentView = 'login';
    const template = document.getElementById('login-template');
    const content = document.getElementById('content');
    content.innerHTML = template.innerHTML;
    
    // Add event listeners
    document.getElementById('loginForm').addEventListener('submit', this.handleLogin.bind(this));
    document.getElementById('showRegister').addEventListener('click', (e) => {
      e.preventDefault();
      this.showRegister();
    });
  }

  /**
   * Show register view
   */
  showRegister() {
    this.currentView = 'register';
    const template = document.getElementById('register-template');
    const content = document.getElementById('content');
    content.innerHTML = template.innerHTML;
    
    // Add event listeners
    document.getElementById('registerForm').addEventListener('submit', this.handleRegister.bind(this));
    document.getElementById('showLogin').addEventListener('click', (e) => {
      e.preventDefault();
      this.showLogin();
    });
  }

  /**
   * Show dashboard view
   */
  async showDashboard() {
    try {
      this.currentView = 'dashboard';
      const template = document.getElementById('dashboard-template');
      const content = document.getElementById('content');
      content.innerHTML = template.innerHTML;
      
      // Update user name
      const user = auth.getCurrentUser();
      if (user) {
        document.getElementById('userFullName').textContent = user.firstName + ' ' + user.lastName;
      }
      
      // Load and display accounts
      await this.loadAndDisplayAccounts();
      
      // Load and display recent transactions
      await this.loadAndDisplayRecentTransactions();
      
      // Add event listeners
      document.getElementById('createAccountBtn').addEventListener('click', () => {
        this.showNewAccount();
      });
      
      document.getElementById('newTransferBtn').addEventListener('click', () => {
        this.showNewTransfer();
      });
      
      document.getElementById('externalTransferBtn').addEventListener('click', () => {
        this.showNewTransfer('external');
      });
      
      document.getElementById('viewAllTransactions').addEventListener('click', (e) => {
        e.preventDefault();
        this.showTransactionHistory();
      });
      
    } catch (error) {
      console.error('Failed to show dashboard:', error);
      this.showError('Armatuurlaua laadimine ebaõnnestus.');
    }
  }

  /**
   * Load and display accounts
   */
  async loadAndDisplayAccounts() {
    try {
      const accounts = await accountsService.loadAccounts();
      const accountsList = document.getElementById('accountsList');
      
      if (accounts.length === 0) {
        accountsList.innerHTML = `
          <div class="list-group-item text-center py-4">
            <p class="text-muted mb-2">Teil pole veel ühtegi kontot</p>
            <button class="btn btn-primary btn-sm" onclick="app.showNewAccount()">
              Loo esimene konto
            </button>
          </div>
        `;
        return;
      }
      
      accountsList.innerHTML = accounts.map(account => `
        <div class="list-group-item list-group-item-action" data-account-id="${account._id}">
          <div class="d-flex w-100 justify-content-between align-items-center">
            <div>
              <h6 class="mb-1">${account.accountName}</h6>
              <p class="mb-1 text-muted small">${account.accountNumber}</p>
            </div>
            <div class="text-end">
              <span class="fs-5 fw-bold">${accountsService.formatCurrency(account.balance, account.currency)}</span>
              <div class="small text-muted">${account.currency}</div>
            </div>
          </div>
        </div>
      `).join('');
      
      // Add click listeners to accounts
      accountsList.querySelectorAll('.list-group-item').forEach(item => {
        item.addEventListener('click', () => {
          const accountId = item.dataset.accountId;
          this.showAccountDetails(accountId);
        });
      });
      
    } catch (error) {
      console.error('Failed to load accounts:', error);
      document.getElementById('accountsList').innerHTML = `
        <div class="list-group-item text-center py-4">
          <p class="text-danger">Kontode laadimine ebaõnnestus</p>
        </div>
      `;
    }
  }

  /**
   * Load and display recent transactions
   */
  async loadAndDisplayRecentTransactions() {
    try {
      const transactions = await transactionsService.loadTransactions();
      const recentTransactionsList = document.getElementById('recentTransactionsList');
      
      if (transactions.length === 0) {
        recentTransactionsList.innerHTML = `
          <div class="list-group-item text-center py-4">
            <p class="text-muted">Tehinguid pole veel tehtud</p>
          </div>
        `;
        return;
      }
      
      // Show only the 5 most recent transactions
      const recentTransactions = transactions.slice(0, 5);
      
      recentTransactionsList.innerHTML = recentTransactions.map(transaction => {
        const statusClass = transactionsService.getStatusClass(transaction.status);
        const statusText = transactionsService.getStatusText(transaction.status);
        const date = transactionsService.formatTransactionDate(transaction.createdAt);
        
        return `
          <div class="list-group-item list-group-item-action" data-transaction-id="${transaction._id}">
            <div class="d-flex w-100 justify-content-between align-items-center">
              <div>
                <h6 class="mb-1">${transaction.explanation}</h6>
                <p class="mb-1 small text-muted">${transaction.fromAccount} → ${transaction.toAccount}</p>
                <p class="mb-0 small text-muted">${date}</p>
              </div>
              <div class="text-end">
                <span class="fs-6 fw-bold">${accountsService.formatCurrency(transaction.amount, transaction.currency)}</span>
                <div class="small ${statusClass}">${statusText}</div>
              </div>
            </div>
          </div>
        `;
      }).join('');
      
      // Add click listeners to transactions
      recentTransactionsList.querySelectorAll('.list-group-item').forEach(item => {
        item.addEventListener('click', () => {
          const transactionId = item.dataset.transactionId;
          this.showTransactionDetails(transactionId);
        });
      });
      
    } catch (error) {
      console.error('Failed to load recent transactions:', error);
      document.getElementById('recentTransactionsList').innerHTML = `
        <div class="list-group-item text-center py-4">
          <p class="text-danger">Tehingute laadimine ebaõnnestus</p>
        </div>
      `;
    }
  }

  /**
   * Show account details view
   */
  async showAccountDetails(accountId) {
    try {
      this.currentView = 'account-details';
      const template = document.getElementById('account-details-template');
      const content = document.getElementById('content');
      content.innerHTML = template.innerHTML;
      
      const account = accountsService.setSelectedAccount(accountId);
      if (!account) {
        this.showError('Kontot ei leitud');
        return;
      }
      
      // Update account details
      document.getElementById('accountName').textContent = account.accountName;
      document.getElementById('accountNumber').textContent = account.accountNumber;
      document.getElementById('accountBalance').textContent = accountsService.formatCurrency(account.balance, account.currency);
      
      // Load account transactions
      await this.loadAndDisplayAccountTransactions(account.accountNumber);
      
      // Add event listeners
      document.getElementById('backToDashboard').addEventListener('click', () => {
        this.showDashboard();
      });
      
      document.getElementById('accountTransferBtn').addEventListener('click', () => {
        this.showNewTransfer('internal', account.accountNumber);
      });
      
      document.getElementById('accountHistoryBtn').addEventListener('click', () => {
        this.showTransactionHistory(account.accountNumber);
      });
      
    } catch (error) {
      console.error('Failed to show account details:', error);
      this.showError('Konto detailide laadimine ebaõnnestus.');
    }
  }

  /**
   * Load and display account transactions
   */
  async loadAndDisplayAccountTransactions(accountNumber) {
    try {
      const transactions = await transactionsService.getAccountTransactions(accountNumber);
      const accountTransactionsList = document.getElementById('accountTransactionsList');
      
      if (transactions.length === 0) {
        accountTransactionsList.innerHTML = `
          <div class="list-group-item text-center py-4">
            <p class="text-muted">Selle kontoga pole veel tehinguid tehtud</p>
          </div>
        `;
        return;
      }
      
      // Show only the 10 most recent transactions
      const recentTransactions = transactions.slice(0, 10);
      
      accountTransactionsList.innerHTML = recentTransactions.map(transaction => {
        const statusClass = transactionsService.getStatusClass(transaction.status);
        const statusText = transactionsService.getStatusText(transaction.status);
        const date = transactionsService.formatTransactionDate(transaction.createdAt);
        const amount = transactionsService.formatTransactionAmount(transaction, accountNumber);
        const isCredit = transactionsService.isCredit(transaction, accountNumber);
        
        return `
          <div class="list-group-item list-group-item-action" data-transaction-id="${transaction._id}">
            <div class="d-flex w-100 justify-content-between align-items-center">
              <div>
                <h6 class="mb-1">${transaction.explanation}</h6>
                <p class="mb-1 small text-muted">
                  ${isCredit ? 'Saatja:' : 'Saaja:'} ${isCredit ? transaction.senderName : transaction.receiverName}
                </p>
                <p class="mb-0 small text-muted">${date}</p>
              </div>
              <div class="text-end">
                <span class="fs-6 fw-bold ${isCredit ? 'text-success' : 'text-danger'}">${amount}</span>
                <div class="small ${statusClass}">${statusText}</div>
              </div>
            </div>
          </div>
        `;
      }).join('');
      
      // Add click listeners to transactions
      accountTransactionsList.querySelectorAll('.list-group-item').forEach(item => {
        item.addEventListener('click', () => {
          const transactionId = item.dataset.transactionId;
          this.showTransactionDetails(transactionId);
        });
      });
      
    } catch (error) {
      console.error('Failed to load account transactions:', error);
      document.getElementById('accountTransactionsList').innerHTML = `
        <div class="list-group-item text-center py-4">
          <p class="text-danger">Tehingute laadimine ebaõnnestus</p>
        </div>
      `;
    }
  }

  /**
   * Show new transfer form
   */
  async showNewTransfer(type = 'internal', fromAccountNumber = null) {
    try {
      this.currentView = 'new-transfer';
      const template = document.getElementById('new-transfer-template');
      const content = document.getElementById('content');
      content.innerHTML = template.innerHTML;
      
      // Load user accounts for the from account dropdown
      const accounts = await accountsService.loadAccounts();
      const fromAccountSelect = document.getElementById('fromAccount');
      
      fromAccountSelect.innerHTML = accounts.map(account => `
        <option value="${account.accountNumber}" data-currency="${account.currency}" ${fromAccountNumber === account.accountNumber ? 'selected' : ''}>
          ${account.accountName} (${account.accountNumber}) - ${accountsService.formatCurrency(account.balance, account.currency)}
        </option>
      `).join('');
      
      // Update currency display when source account changes
      fromAccountSelect.addEventListener('change', () => {
        const selectedOption = fromAccountSelect.selectedOptions[0];
        const currency = selectedOption ? selectedOption.dataset.currency : 'EUR';
        document.getElementById('transferCurrency').textContent = currency;
      });
      
      // Set initial currency
      if (fromAccountSelect.selectedOptions[0]) {
        const currency = fromAccountSelect.selectedOptions[0].dataset.currency;
        document.getElementById('transferCurrency').textContent = currency;
      }
      
      // Add event listeners
      document.getElementById('backFromTransfer').addEventListener('click', () => {
        this.showDashboard();
      });
      
      document.getElementById('transferForm').addEventListener('submit', (e) => {
        this.handleTransfer(e, type);
      });
      
    } catch (error) {
      console.error('Failed to show transfer form:', error);
      this.showError('Ülekande vormi laadimine ebaõnnestus.');
    }
  }

  /**
   * Show new account form
   */
  showNewAccount() {
    this.currentView = 'new-account';
    const template = document.getElementById('new-account-template');
    const content = document.getElementById('content');
    content.innerHTML = template.innerHTML;
    
    // Update currency symbol when currency changes
    document.getElementById('newAccountCurrency').addEventListener('change', (e) => {
      document.getElementById('newAccountCurrencySymbol').textContent = e.target.value;
    });
    
    // Add event listeners
    document.getElementById('backFromNewAccount').addEventListener('click', () => {
      this.showDashboard();
    });
    
    document.getElementById('newAccountForm').addEventListener('submit', this.handleNewAccount.bind(this));
  }

  /**
   * Show transaction history
   */
  async showTransactionHistory(accountNumber = null) {
    try {
      this.currentView = 'transaction-history';
      const template = document.getElementById('transaction-history-template');
      const content = document.getElementById('content');
      content.innerHTML = template.innerHTML;
      
      // Load transactions
      const params = accountNumber ? { accountNumber } : {};
      await this.loadAndDisplayTransactionHistory(params);
      
      // Add event listeners
      document.getElementById('backFromHistory').addEventListener('click', () => {
        this.showDashboard();
      });
      
      // Add filter listeners
      document.querySelectorAll('.filter-option').forEach(option => {
        option.addEventListener('click', (e) => {
          e.preventDefault();
          const filter = e.target.dataset.filter;
          this.applyTransactionFilter(filter, accountNumber);
        });
      });
      
    } catch (error) {
      console.error('Failed to show transaction history:', error);
      this.showError('Tehingute ajaloo laadimine ebaõnnestus.');
    }
  }

  /**
   * Load and display transaction history
   */
  async loadAndDisplayTransactionHistory(params = {}) {
    try {
      const transactions = await transactionsService.loadTransactions(params);
      const transactionHistoryList = document.getElementById('transactionHistoryList');
      
      if (transactions.length === 0) {
        transactionHistoryList.innerHTML = `
          <div class="list-group-item text-center py-4">
            <p class="text-muted">Tehinguid ei leitud</p>
          </div>
        `;
        return;
      }
      
      transactionHistoryList.innerHTML = transactions.map(transaction => {
        const statusClass = transactionsService.getStatusClass(transaction.status);
        const statusText = transactionsService.getStatusText(transaction.status);
        const typeText = transactionsService.getTypeText(transaction.type);
        const date = transactionsService.formatTransactionDate(transaction.createdAt);
        
        return `
          <div class="list-group-item list-group-item-action" data-transaction-id="${transaction._id}">
            <div class="d-flex w-100 justify-content-between align-items-center">
              <div>
                <h6 class="mb-1">${transaction.explanation}</h6>
                <p class="mb-1 small text-muted">${transaction.fromAccount} → ${transaction.toAccount}</p>
                <p class="mb-0 small text-muted">${date} • ${typeText}</p>
              </div>
              <div class="text-end">
                <span class="fs-6 fw-bold">${accountsService.formatCurrency(transaction.amount, transaction.currency)}</span>
                <div class="small ${statusClass}">${statusText}</div>
              </div>
            </div>
          </div>
        `;
      }).join('');
      
      // Add click listeners to transactions
      transactionHistoryList.querySelectorAll('.list-group-item').forEach(item => {
        item.addEventListener('click', () => {
          const transactionId = item.dataset.transactionId;
          this.showTransactionDetails(transactionId);
        });
      });
      
    } catch (error) {
      console.error('Failed to load transaction history:', error);
      document.getElementById('transactionHistoryList').innerHTML = `
        <div class="list-group-item text-center py-4">
          <p class="text-danger">Tehingute laadimine ebaõnnestus</p>
        </div>
      `;
    }
  }

  /**
   * Apply transaction filter
   */
  async applyTransactionFilter(filter, accountNumber = null) {
    const params = accountNumber ? { accountNumber } : {};
    
    if (filter !== 'all') {
      params.type = filter;
    }
    
    await this.loadAndDisplayTransactionHistory(params);
  }

  /**
   * Show transaction details in modal
   */
  showTransactionDetails(transactionId) {
    const transaction = transactionsService.getTransactionById(transactionId);
    if (!transaction) {
      this.showError('Tehingut ei leitud');
      return;
    }
    
    // Populate modal with transaction details
    document.getElementById('modalTransactionId').textContent = transaction.transactionId || transaction._id;
    document.getElementById('modalStatus').innerHTML = `
      <span class="badge bg-primary ${transactionsService.getStatusClass(transaction.status)}">
        ${transactionsService.getStatusText(transaction.status)}
      </span>
    `;
    document.getElementById('modalSender').textContent = transaction.senderName;
    document.getElementById('modalReceiver').textContent = transaction.receiverName || 'N/A';
    document.getElementById('modalAmount').textContent = accountsService.formatCurrency(transaction.amount, transaction.currency);
    document.getElementById('modalDate').textContent = transactionsService.formatTransactionDate(transaction.createdAt);
    document.getElementById('modalExplanation').textContent = transaction.explanation;
    
    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('transactionModal'));
    modal.show();
  }

  /**
   * Handle login form submission
   */
  async handleLogin(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    try {
      this.showLoading('Sisselogimine...');
      await auth.login({ username, password });
      this.hideLoading();
      // Navigation will be handled by auth state change listener
    } catch (error) {
      this.hideLoading();
      this.showError(error.message || 'Sisselogimine ebaõnnestus');
    }
  }

  /**
   * Handle register form submission
   */
  async handleRegister(e) {
    e.preventDefault();
    
    const firstName = document.getElementById('firstName').value;
    const lastName = document.getElementById('lastName').value;
    const username = document.getElementById('regUsername').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('regPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    // Validate passwords match
    if (password !== confirmPassword) {
      this.showError('Paroolid ei kattu');
      return;
    }
    
    try {
      this.showLoading('Registreerimine...');
      await auth.register({
        firstName,
        lastName,
        username,
        email,
        password
      });
      this.hideLoading();
      this.showSuccess('Registreerimine õnnestus! Saate nüüd sisse logida.');
      this.showLogin();
    } catch (error) {
      this.hideLoading();
      this.showError(error.message || 'Registreerimine ebaõnnestus');
    }
  }

  /**
   * Handle transfer form submission
   */
  async handleTransfer(e, type = 'internal') {
    e.preventDefault();
    
    const fromAccount = document.getElementById('fromAccount').value;
    const toAccount = document.getElementById('toAccount').value;
    const amount = parseFloat(document.getElementById('amount').value);
    const explanation = document.getElementById('explanation').value;
    
    try {
      this.showLoading('Ülekande töötlemine...');
      
      const transactionData = {
        fromAccount,
        toAccount,
        amount,
        explanation
      };
      
      let transaction;
      if (type === 'external' || !toAccount.startsWith(process.env.BANK_PREFIX || 'ABC')) {
        transaction = await transactionsService.createExternalTransaction(transactionData);
      } else {
        transaction = await transactionsService.createInternalTransaction(transactionData);
      }
      
      this.hideLoading();
      this.showSuccess('Ülekanne edukalt teostatud!');
      this.showDashboard();
    } catch (error) {
      this.hideLoading();
      this.showError(error.message || 'Ülekanne ebaõnnestus');
    }
  }

  /**
   * Handle new account form submission
   */
  async handleNewAccount(e) {
    e.preventDefault();
    
    const accountName = document.getElementById('newAccountName').value;
    const currency = document.getElementById('newAccountCurrency').value;
    const initialBalance = parseFloat(document.getElementById('initialBalance').value) || 0;
    
    try {
      this.showLoading('Konto loomine...');
      await accountsService.createAccount({
        accountName,
        currency,
        initialBalance: Math.round(initialBalance * 100) // Convert to cents
      });
      this.hideLoading();
      this.showSuccess('Konto edukalt loodud!');
      this.showDashboard();
    } catch (error) {
      this.hideLoading();
      this.showError(error.message || 'Konto loomine ebaõnnestus');
    }
  }

  /**
   * Handle logout
   */
  async logout() {
    try {
      this.showLoading('Väljalogimine...');
      await auth.logout();
      this.hideLoading();
      // Navigation will be handled by auth state change listener
    } catch (error) {
      this.hideLoading();
      console.error('Logout error:', error);
      // Force logout even if API call fails
      auth.logout();
    }
  }

  /**
   * Show loading spinner
   */
  showLoading(message = 'Laadimine...') {
    // Create loading overlay if it doesn't exist
    let overlay = document.getElementById('loadingOverlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'loadingOverlay';
      overlay.className = 'loading-overlay';
      overlay.innerHTML = `
        <div class="loading-spinner">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Loading...</span>
          </div>
          <div class="loading-message mt-2">${message}</div>
        </div>
      `;
      document.body.appendChild(overlay);
    } else {
      overlay.querySelector('.loading-message').textContent = message;
    }
    
    overlay.style.display = 'flex';
  }

  /**
   * Hide loading spinner
   */
  hideLoading() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
      overlay.style.display = 'none';
    }
  }

  /**
   * Show error message
   */
  showError(message) {
    this.showAlert(message, 'danger');
  }

  /**
   * Show success message
   */
  showSuccess(message) {
    this.showAlert(message, 'success');
  }

  /**
   * Show alert message
   */
  showAlert(message, type = 'info') {
    // Remove existing alerts
    document.querySelectorAll('.app-alert').forEach(alert => alert.remove());
    
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show app-alert`;
    alertDiv.innerHTML = `
      ${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    
    // Insert at the beginning of content
    const content = document.getElementById('content');
    content.insertBefore(alertDiv, content.firstChild);
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
      if (alertDiv.parentNode) {
        alertDiv.remove();
      }
    }, 5000);
  }
}

// Create global app instance
const app = new App();

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  app.init();
});
