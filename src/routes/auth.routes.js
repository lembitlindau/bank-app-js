const express = require('express');
const { body, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const { authenticate } = require('../middlewares/auth.middleware');

const router = express.Router();

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     description: Creates a new user account in the system with full validation and security checks
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *               - firstName
 *               - lastName
 *               - email
 *             properties:
 *               username:
 *                 type: string
 *                 minLength: 3
 *                 description: Username for login (minimum 3 characters)
 *                 example: "john_doe"
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 description: Password (minimum 6 characters)
 *                 example: "securePassword123"
 *               firstName:
 *                 type: string
 *                 description: User's first name
 *                 example: "John"
 *               lastName:
 *                 type: string
 *                 description: User's last name
 *                 example: "Doe"
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Valid email address
 *                 example: "john.doe@email.com"
 *           examples:
 *             validUser:
 *               summary: Valid user registration
 *               value:
 *                 username: "john_doe"
 *                 password: "securePassword123"
 *                 firstName: "John"
 *                 lastName: "Doe"
 *                 email: "john.doe@email.com"
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "success"
 *                 message:
 *                   type: string
 *                   example: "User registered successfully"
 *             examples:
 *               successfulRegistration:
 *                 summary: Successful registration
 *                 value:
 *                   status: "success"
 *                   message: "User registered successfully"
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             examples:
 *               validationError:
 *                 summary: Validation error
 *                 value:
 *                   status: "error"
 *                   errors:
 *                     - field: "username"
 *                       message: "Username must be at least 3 characters long"
 *                     - field: "email"
 *                       message: "Please provide a valid email address"
 *       409:
 *         description: User already exists
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "error"
 *                 message:
 *                   type: string
 *                   example: "Username or email already in use"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post(
  '/register',
  [
    body('username')
      .trim()
      .isLength({ min: 3 })
      .withMessage('Username must be at least 3 characters long'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters long'),
    body('firstName').trim().notEmpty().withMessage('First name is required'),
    body('lastName').trim().notEmpty().withMessage('Last name is required'),
    body('email')
      .isEmail()
      .withMessage('Please provide a valid email address')
      .normalizeEmail(),
  ],
  async (req, res) => {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          status: 'error',
          errors: errors.array(),
        });
      }

      const { username, password, firstName, lastName, email } = req.body;

      // Check if user already exists
      const existingUser = await User.findOne({
        $or: [{ username }, { email }],
      });

      if (existingUser) {
        return res.status(409).json({
          status: 'error',
          message: 'Username or email already in use',
        });
      }

      // Create new user
      const user = new User({
        username,
        password,
        firstName,
        lastName,
        email,
      });

      await user.save();

      res.status(201).json({
        status: 'success',
        message: 'User registered successfully',
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Internal server error',
      });
    }
  }
);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login a user
 *     description: Authenticates user credentials and returns a JWT token for subsequent requests
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 description: Username for authentication
 *                 example: "john_doe"
 *               password:
 *                 type: string
 *                 description: User password
 *                 example: "securePassword123"
 *           examples:
 *             validLogin:
 *               summary: Valid login credentials
 *               value:
 *                 username: "john_doe"
 *                 password: "securePassword123"
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "success"
 *                 token:
 *                   type: string
 *                   description: JWT authentication token
 *                   example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjYxM2Y1YjQ2YTQ3YWY5MDAxYzQwZjQwNCIsImlhdCI6MTYzMTU0MDYxNCwiZXhwIjoxNjMxNjI3MDE0fQ.KjZWG8x5HZt7YF1Fzl9BqZHQoV2xZ3Q4W5R9YG8Z5Zs"
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *             examples:
 *               successfulLogin:
 *                 summary: Successful login
 *                 value:
 *                   status: "success"
 *                   token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                   user:
 *                     id: "613f5b46a47af9001c40f404"
 *                     username: "john_doe"
 *                     firstName: "John"
 *                     lastName: "Doe"
 *                     email: "john.doe@email.com"
 *       400:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "error"
 *                 message:
 *                   type: string
 *                   example: "Invalid username or password"
 *             examples:
 *               invalidCredentials:
 *                 summary: Invalid login credentials
 *                 value:
 *                   status: "error"
 *                   message: "Invalid username or password"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post(
  '/login',
  [
    body('username').trim().notEmpty().withMessage('Username is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  async (req, res) => {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          status: 'error',
          errors: errors.array(),
        });
      }

      const { username, password } = req.body;

      // Find user by username
      const user = await User.findOne({ username }).select('+password');

      if (!user || !(await user.comparePassword(password))) {
        return res.status(400).json({
          status: 'error',
          message: 'Invalid username or password',
        });
      }

      // Generate JWT token
      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
        expiresIn: '24h',
      });

      // Add token to user's sessions
      await user.addSession(token);

      // Update last login
      user.lastLogin = Date.now();
      await user.save();

      // Remove password from response
      user.password = undefined;

      res.status(200).json({
        status: 'success',
        token,
        user: {
          id: user._id,
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
        },
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Internal server error',
      });
    }
  }
);

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Logout a user
 *     description: Terminates the current user session and invalidates the JWT token
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logout successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "success"
 *                 message:
 *                   type: string
 *                   example: "Logged out successfully"
 *             examples:
 *               successfulLogout:
 *                 summary: Successful logout
 *                 value:
 *                   status: "success"
 *                   message: "Logged out successfully"
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "error"
 *                 message:
 *                   type: string
 *                   example: "Access denied"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/logout', authenticate, async (req, res) => {
  try {
    // Remove the current session token
    await req.user.removeSession(req.token);

    res.status(200).json({
      status: 'success',
      message: 'Logged out successfully',
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error',
    });
  }
});

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get current user information
 *     description: Returns the authenticated user's profile information
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User information retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "success"
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *             examples:
 *               userInfo:
 *                 summary: Current user information
 *                 value:
 *                   status: "success"
 *                   user:
 *                     id: "613f5b46a47af9001c40f404"
 *                     username: "john_doe"
 *                     firstName: "John"
 *                     lastName: "Doe"
 *                     email: "john.doe@email.com"
 *                     fullName: "John Doe"
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "error"
 *                 message:
 *                   type: string
 *                   example: "Access denied"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/me', authenticate, async (req, res) => {
  try {
    res.status(200).json({
      status: 'success',
      user: {
        id: req.user._id,
        username: req.user.username,
        firstName: req.user.firstName,
        lastName: req.user.lastName,
        email: req.user.email,
        fullName: req.user.fullName,
      },
    });
  } catch (error) {
    console.error('Get user info error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error',
    });
  }
});

module.exports = router;
