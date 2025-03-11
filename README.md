# Bank Web Application

A comprehensive bank web application built with JavaScript, Express, and MongoDB that supports user registration, login/logout functionality, account management, and transaction processing.

## Features

### User Authentication
- User registration with validation for unique usernames and emails
- Secure password storage with bcrypt hashing
- JWT-based authentication for API access
- Session management with token-based authentication

### Account Management
- Create multiple accounts with unique account numbers
- Support for different currencies (EUR, USD, GBP)
- View account balances and transaction history
- Account details with recent transactions

### Transaction Processing
- Internal transfers between user accounts
- External transfers to other banks
- Transaction status tracking (pending, inProgress, completed, failed)
- Comprehensive transaction history with filtering options

### API Documentation
- SwaggerUI available at `/docs` endpoint
- Detailed documentation for all API endpoints
- Appropriate HTTP status codes and error handling

### Security Features
- JWT authentication for secure API access
- Password hashing with bcrypt
- Input validation and sanitization
- Robust error handling

## Technical Stack

### Backend
- **Node.js** - JavaScript runtime
- **Express** - Web framework
- **MongoDB** - Database
- **Mongoose** - MongoDB object modeling
- **JWT** - JSON Web Tokens for authentication
- **bcryptjs** - Password hashing
- **Swagger** - API documentation

### Frontend
- **HTML5/CSS3** - Structure and styling
- **Bootstrap 5** - Responsive design framework
- **JavaScript** - Client-side functionality
- **Fetch API** - AJAX requests

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/bank-app-js.git
cd bank-app-js
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory with the following variables:
```
PORT=3000
MONGODB_URI=mongodb://localhost:27017/bank-app
JWT_SECRET=your_jwt_secret_key_here
BANK_PREFIX=ABC
CENTRAL_BANK_URL=https://keskpank.herokuapp.com
CENTRAL_BANK_API_KEY=your_central_bank_api_key
PRIVATE_KEY_PATH=./keys/private.pem
PUBLIC_KEY_PATH=./keys/public.pem
```

4. Start the application:
```bash
npm start
```

5. Access the application at `http://localhost:3000`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Log in a user
- `POST /api/auth/logout` - Log out a user
- `GET /api/auth/me` - Get current user information

### User Management
- `GET /api/users/profile` - Get user profile
- `PATCH /api/users/profile` - Update user profile
- `POST /api/users/change-password` - Change user password

### Account Management
- `GET /api/accounts` - Get all user accounts
- `GET /api/accounts/:id` - Get account by ID
- `GET /api/accounts/:accountNumber/balance` - Get account balance
- `POST /api/accounts` - Create a new account
- `PATCH /api/accounts/:id` - Update account details

### Transaction Management
- `GET /api/transactions` - Get all user transactions
- `GET /api/transactions/:id` - Get transaction by ID
- `POST /api/transactions/internal` - Create an internal transaction
- `POST /api/transactions/external` - Create an external transaction

## Project Structure

```
bank-app-js/
├── public/                  # Static files
│   ├── css/                 # CSS stylesheets
│   ├── js/                  # Client-side JavaScript
│   └── index.html           # Main HTML file
├── src/
│   ├── middlewares/         # Express middlewares
│   ├── models/              # Mongoose models
│   ├── routes/              # API routes
│   └── server.js            # Main server file
├── .env                     # Environment variables
├── package.json             # Project dependencies
└── README.md                # Project documentation
```

## Development

### Running in Development Mode
```bash
npm run dev
```

### Testing
```bash
npm test
```

## Security Considerations

- All passwords are hashed before storing in the database
- JWT tokens are used for authentication
- Input validation is performed on all API endpoints
- HTTPS is recommended for production deployment

## Central Bank Integration

The application is designed to communicate with a Central Bank system for external transfers. This communication is secured using JWT-signed data packets.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- Express.js team for the excellent web framework
- MongoDB team for the robust database
- All open-source contributors whose libraries made this project possible