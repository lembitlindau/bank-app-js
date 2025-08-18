# Bank Web Application

A comprehensive interbank transaction system built with JavaScript, Express, and MongoDB that supports secure communication between banks, user management, account handling, and both internal and external transactions with full JWT-based security.

## 🌟 Features

### 👤 User Authentication & Management
- User registration with validation for unique usernames and emails
- Secure password storage with bcrypt hashing
- JWT-based authentication with session management
- Multi-session support with token tracking
- User profile management and password changes

### 🏦 Account Management
- Multiple accounts per user with different currencies (EUR, USD, GBP)
- Unique account numbers generated with bank prefix
- Real-time balance tracking
- Account activity monitoring
- Support for account activation/deactivation

### 💸 Transaction Processing
- **Internal transfers** - Between accounts within the same bank
- **External transfers** - To accounts in other banks via interbank protocol
- **Incoming transfers** - From other banks via B2B API
- Real-time status tracking (pending → inProgress → completed/failed)
- Comprehensive transaction history with filtering and search
- Automatic balance updates and rollback on failures

### 🔄 Interbank Communication
- **JWT-signed transactions** using RSA-256 encryption
- **JWKS endpoint** for public key distribution (`.well-known/jwks.json`)
- **B2B API** for receiving transactions from other banks
- **Central Bank integration** for bank registration and discovery
- **Signature validation** for incoming transactions
- **Replay attack protection** with unique transaction IDs

### 📚 API Documentation
- **SwaggerUI** available at `/docs` endpoint
- Complete documentation for all API endpoints
- Interactive API testing interface
- Proper HTTP status codes and error responses
- Authentication requirements clearly marked

### 🔒 Security Features
- RSA key pair generation for transaction signing
- JWT authentication for API access
- Password protection for private keys
- Input validation and sanitization
- Robust error handling and logging
- Protection against common security vulnerabilities

### 🛡️ Fault Tolerance
- Graceful degradation when Central Bank is unavailable
- Retry logic with exponential backoff
- Cached public keys for offline operation
- Comprehensive error handling and recovery

## 🛠️ Technical Stack

### Backend
- **Node.js** - JavaScript runtime
- **Express** - Web framework
- **MongoDB** - Database with Mongoose ODM
- **JWT** - JSON Web Tokens for authentication and interbank communication
- **bcryptjs** - Password hashing
- **node-fetch** - HTTP client for external API calls
- **crypto** - Built-in cryptographic functionality
- **OpenSSL** - RSA key generation and management

### Frontend
- **HTML5/CSS3** - Structure and styling
- **Bootstrap 5** - Responsive design framework
- **JavaScript ES6+** - Client-side functionality
- **Fetch API** - AJAX requests

### Security & Cryptography
- **RSA-256** - Digital signatures for interbank transactions
- **JWKS** - JSON Web Key Set for public key distribution
- **TLS/HTTPS** - Transport layer security (recommended for production)

### Documentation & Testing
- **Swagger/OpenAPI 3.0** - API documentation
- **Jest** - Testing framework (configured)
- **Supertest** - HTTP assertion library

## ⚡ Quick Start

1. **Clone the repository:**
```bash
git clone https://github.com/lembitlindau/bank-app-js.git
cd bank-app-js
```

2. **Install dependencies:**
```bash
npm install
```

3. **Generate RSA key pair:**
```bash
mkdir keys
cd keys
openssl genpkey -algorithm RSA -out private.pem -pkcs8 -aes256 -pass pass:bankkey123
openssl rsa -in private.pem -pubout -out public.pem -passin pass:bankkey123
cd ..
```

4. **Create environment configuration:**
Create a `.env` file in the root directory:
```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/bank-app
JWT_SECRET=your_super_secure_jwt_secret_key_here
BANK_NAME=My Test Bank
BANK_PREFIX=ABC
CENTRAL_BANK_URL=https://keskpank.herokuapp.com
CENTRAL_BANK_API_KEY=your_central_bank_api_key
PRIVATE_KEY_PATH=./keys/private.pem
PUBLIC_KEY_PATH=./keys/public.pem
KEY_PASSPHRASE=bankkey123
BASE_URL=http://localhost:3000
```

5. **Start MongoDB:**
```bash
# Make sure MongoDB is running on your system
mongod
```

6. **Start the application:**
```bash
npm start
```

7. **Access the application:**
- **Web Interface:** http://localhost:3000
- **API Documentation:** http://localhost:3000/docs
- **JWKS Endpoint:** http://localhost:3000/.well-known/jwks.json

## 📡 API Endpoints

### 🔐 Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Log in a user  
- `POST /api/auth/logout` - Log out a user
- `GET /api/auth/me` - Get current user information

### 👤 User Management
- `GET /api/users/profile` - Get user profile
- `PATCH /api/users/profile` - Update user profile
- `POST /api/users/change-password` - Change user password

### 🏦 Account Management
- `GET /api/accounts` - Get all user accounts
- `GET /api/accounts/:id` - Get account by ID
- `POST /api/accounts` - Create a new account
- `PATCH /api/accounts/:id` - Update account details

### 💸 Transaction Management
- `GET /api/transactions` - Get all user transactions with filtering
- `GET /api/transactions/:id` - Get transaction by ID
- `POST /api/transactions/internal` - Create internal transaction
- `POST /api/transactions/external` - Create external/interbank transaction
- `GET /api/transactions/status/:transactionId` - Get transaction status

### 🔄 Interbank API (B2B)
- `POST /api/transactions/b2b` - Receive transaction from another bank
- `GET /.well-known/jwks.json` - Public keys for signature verification

### 🏛️ Central Bank Integration
- `GET /api/central-bank/health` - Check Central Bank connection
- `GET /api/central-bank/banks` - Get registered banks list
- `GET /api/central-bank/banks/:prefix` - Get specific bank information
- `POST /api/central-bank/register` - Register this bank with Central Bank

## 📁 Project Structure

```
bank-app-js/
├── public/                     # Static frontend files
│   ├── css/
│   │   └── styles.css         # Application styles
│   ├── js/
│   │   ├── api.js             # API client
│   │   ├── auth.js            # Authentication logic
│   │   ├── accounts.js        # Account management
│   │   └── transactions.js    # Transaction handling
│   └── index.html             # Main application page
├── src/
│   ├── middlewares/           # Express middlewares
│   │   └── auth.middleware.js # JWT authentication
│   ├── models/                # Mongoose data models
│   │   ├── user.model.js      # User schema
│   │   ├── account.model.js   # Account schema
│   │   └── transaction.model.js # Transaction schema
│   ├── routes/                # API route handlers
│   │   ├── auth.routes.js     # Authentication endpoints
│   │   ├── user.routes.js     # User management
│   │   ├── account.routes.js  # Account operations
│   │   ├── transaction.routes.js # Transaction processing
│   │   └── centralBank.routes.js # Central Bank integration
│   ├── services/              # Business logic services
│   │   ├── jwt.service.js     # JWT signing and verification
│   │   ├── centralBank.service.js # Central Bank API client
│   │   ├── interbank.service.js # Interbank transaction processing
│   │   └── startup.service.js # Application initialization
│   └── server.js              # Main application entry point
├── keys/                      # RSA cryptographic keys
│   ├── private.pem           # Private key (DO NOT COMMIT)
│   └── public.pem            # Public key
├── .env                      # Environment variables (DO NOT COMMIT)
├── .gitignore               # Git ignore rules
├── SPECIFICATIONS.md        # Interbank protocol documentation
├── IMPLEMENTATION_STATUS.md # Feature completion checklist
├── package.json            # Dependencies and scripts
└── README.md               # This file
```

## 🚀 Development

### Running in Development Mode
```bash
npm run dev  # Uses nodemon for auto-restart
```

### Testing
```bash
npm test    # Run Jest test suite
```

### Code Quality
```bash
npm run lint    # Check code style (if configured)
```

### Database Management
```bash
# Reset database (development only)
mongo bank-app --eval "db.dropDatabase()"
```

## 🔒 Security Implementation

### Cryptographic Security
- **RSA-256 signatures** for interbank transaction verification
- **Password-protected private keys** with configurable passphrases
- **JWT tokens** with configurable expiration times
- **bcrypt hashing** for password storage with salt rounds

### API Security
- **Authentication required** for all user-specific endpoints
- **Input validation** using express-validator
- **Rate limiting** (recommended for production)
- **CORS configuration** for cross-origin requests

### Data Protection
- **No sensitive data in logs** (passwords, keys, tokens)
- **Private keys excluded** from version control
- **Environment variables** for configuration
- **Secure error messages** without internal details

## 🌐 Interbank Protocol

The application implements a secure interbank transaction protocol as specified in `SPECIFICATIONS.md`:

### Transaction Flow
1. **Internal validation** - Check user permissions and account balance
2. **JWT creation** - Sign transaction data with bank's private key
3. **Bank discovery** - Find recipient bank via Central Bank API
4. **Secure transmission** - Send JWT to recipient bank's B2B endpoint
5. **Signature verification** - Recipient validates sender's signature
6. **Processing** - Update balances and send confirmation
7. **Status tracking** - Monitor transaction completion

### Key Features
- **Automatic retries** with exponential backoff
- **Replay attack protection** using unique transaction IDs
- **Graceful degradation** when external services are unavailable
- **Comprehensive logging** for audit and debugging

## 🌍 Deployment

### Production Environment Variables
```env
NODE_ENV=production
PORT=443
MONGODB_URI=mongodb://your-production-db
JWT_SECRET=your-ultra-secure-production-secret
BASE_URL=https://your-bank-domain.com
```

### Docker Deployment (Optional)
```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

### Security Checklist for Production
- [ ] Use HTTPS/TLS certificates
- [ ] Set secure JWT secrets
- [ ] Configure firewall rules
- [ ] Enable MongoDB authentication
- [ ] Implement rate limiting
- [ ] Set up monitoring and alerting
- [ ] Regular security updates

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📞 Support

For support and questions:
- Create an issue on GitHub
- Check the API documentation at `/docs`
- Review the interbank protocol in `SPECIFICATIONS.md`

## 🙏 Acknowledgements

- **Express.js team** for the excellent web framework
- **MongoDB team** for the robust database solution
- **JWT.io** for authentication standards
- **OpenSSL project** for cryptographic tools
- **Bootstrap team** for the responsive UI framework
- **Swagger/OpenAPI** for API documentation standards

## 📊 Features Status

See `IMPLEMENTATION_STATUS.md` for a complete checklist of implemented features and their current status.

---

**Note**: This application is designed for educational and development purposes. For production deployment, ensure proper security auditing, monitoring, and compliance with banking regulations.