/**
 * Authentication module for handling user authentication
 */
class AuthService {
  constructor() {
    this.currentUser = null;
    this.isAuthenticated = false;
    this.authListeners = [];
  }

  /**
   * Initialize the auth service
   * @returns {Promise} - Resolves when initialization is complete
   */
  async init() {
    const token = localStorage.getItem('token');
    
    if (token) {
      try {
        const response = await api.getCurrentUser();
        this.currentUser = response.user;
        this.isAuthenticated = true;
        this.notifyListeners();
        return true;
      } catch (error) {
        console.error('Failed to authenticate with stored token:', error);
        localStorage.removeItem('token');
        return false;
      }
    }
    
    return false;
  }

  /**
   * Register a new user
   * @param {Object} userData - User registration data
   * @returns {Promise} - Resolves with registration result
   */
  async register(userData) {
    try {
      return await api.register(userData);
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }

  /**
   * Log in a user
   * @param {Object} credentials - Login credentials
   * @returns {Promise} - Resolves with login result
   */
  async login(credentials) {
    try {
      const response = await api.login(credentials);
      this.currentUser = response.user;
      this.isAuthenticated = true;
      this.notifyListeners();
      return response;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  /**
   * Log out the current user
   * @returns {Promise} - Resolves when logout is complete
   */
  async logout() {
    try {
      await api.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      this.currentUser = null;
      this.isAuthenticated = false;
      api.clearToken();
      this.notifyListeners();
    }
  }

  /**
   * Get the current authenticated user
   * @returns {Object|null} - Current user or null if not authenticated
   */
  getCurrentUser() {
    return this.currentUser;
  }

  /**
   * Check if a user is authenticated
   * @returns {boolean} - True if authenticated, false otherwise
   */
  isUserAuthenticated() {
    return this.isAuthenticated;
  }

  /**
   * Add an authentication state change listener
   * @param {Function} listener - Callback function
   */
  addAuthStateListener(listener) {
    this.authListeners.push(listener);
  }

  /**
   * Remove an authentication state change listener
   * @param {Function} listener - Callback function to remove
   */
  removeAuthStateListener(listener) {
    this.authListeners = this.authListeners.filter(l => l !== listener);
  }

  /**
   * Notify all listeners of authentication state change
   */
  notifyListeners() {
    this.authListeners.forEach(listener => {
      listener(this.isAuthenticated, this.currentUser);
    });
  }
}

// Create a singleton instance
const auth = new AuthService();
