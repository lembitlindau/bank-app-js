/**
 * API Service for handling all API requests
 */
class ApiService {
  constructor() {
    this.baseUrl = '/api';
    this.token = localStorage.getItem('token');
  }

  /**
   * Set the authentication token
   * @param {string} token - JWT token
   */
  setToken(token) {
    this.token = token;
    localStorage.setItem('token', token);
  }

  /**
   * Clear the authentication token
   */
  clearToken() {
    this.token = null;
    localStorage.removeItem('token');
  }

  /**
   * Get the authentication headers
   * @returns {Object} - Headers object with Authorization
   */
  getHeaders() {
    const headers = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    return headers;
  }

  /**
   * Handle API response
   * @param {Response} response - Fetch API response
   * @returns {Promise} - Resolved with response data or rejected with error
   */
  async handleResponse(response) {
    const data = await response.json();

    if (!response.ok) {
      const error = new Error(data.message || 'Something went wrong');
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  }

  /**
   * Make a GET request
   * @param {string} endpoint - API endpoint
   * @returns {Promise} - Resolved with response data
   */
  async get(endpoint) {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    return this.handleResponse(response);
  }

  /**
   * Make a POST request
   * @param {string} endpoint - API endpoint
   * @param {Object} data - Request body data
   * @returns {Promise} - Resolved with response data
   */
  async post(endpoint, data) {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });

    return this.handleResponse(response);
  }

  /**
   * Make a PATCH request
   * @param {string} endpoint - API endpoint
   * @param {Object} data - Request body data
   * @returns {Promise} - Resolved with response data
   */
  async patch(endpoint, data) {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });

    return this.handleResponse(response);
  }

  /**
   * Make a DELETE request
   * @param {string} endpoint - API endpoint
   * @returns {Promise} - Resolved with response data
   */
  async delete(endpoint) {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });

    return this.handleResponse(response);
  }

  // Auth API endpoints
  async register(userData) {
    return this.post('/auth/register', userData);
  }

  async login(credentials) {
    const data = await this.post('/auth/login', credentials);
    if (data.token) {
      this.setToken(data.token);
    }
    return data;
  }

  async logout() {
    const data = await this.post('/auth/logout');
    this.clearToken();
    return data;
  }

  async getCurrentUser() {
    return this.get('/auth/me');
  }

  // User API endpoints
  async getUserProfile() {
    return this.get('/users/profile');
  }

  async updateUserProfile(profileData) {
    return this.patch('/users/profile', profileData);
  }

  async changePassword(passwordData) {
    return this.post('/users/change-password', passwordData);
  }

  // Account API endpoints
  async getAccounts() {
    return this.get('/accounts');
  }

  async getAccount(id) {
    return this.get(`/accounts/${id}`);
  }

  async getAccountBalance(accountNumber) {
    return this.get(`/accounts/${accountNumber}/balance`);
  }

  async createAccount(accountData) {
    return this.post('/accounts', accountData);
  }

  async updateAccount(id, accountData) {
    return this.patch(`/accounts/${id}`, accountData);
  }

  // Transaction API endpoints
  async getTransactions(params = {}) {
    const queryParams = new URLSearchParams();
    
    if (params.status) {
      queryParams.append('status', params.status);
    }
    
    if (params.type) {
      queryParams.append('type', params.type);
    }
    
    if (params.accountNumber) {
      queryParams.append('accountNumber', params.accountNumber);
    }
    
    const queryString = queryParams.toString();
    const endpoint = queryString ? `/transactions?${queryString}` : '/transactions';
    
    return this.get(endpoint);
  }

  async getTransaction(id) {
    return this.get(`/transactions/${id}`);
  }

  async createInternalTransaction(transactionData) {
    return this.post('/transactions/internal', transactionData);
  }

  async createExternalTransaction(transactionData) {
    return this.post('/transactions/external', transactionData);
  }
}

// Create a singleton instance
const api = new ApiService();
