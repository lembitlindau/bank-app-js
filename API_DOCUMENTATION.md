# Bank API Documentation

This project provides comprehensive OpenAPI documentation for the interbank transaction system in both English and Estonian languages.

## Accessing Documentation

### English Documentation
- **Swagger UI**: http://localhost:3000/docs
- **Alternative URL**: http://localhost:3000/api-docs

### Estonian Documentation  
- **Swagger UI**: http://localhost:3000/docs/et
- **Alternative URL**: http://localhost:3000/api-docs/et

## Features

The API documentation includes:

✅ **Complete endpoint coverage** - All API endpoints are documented  
✅ **Detailed request/response examples** - Working request body examples with sample data  
✅ **Status code documentation** - All possible response status codes with example responses  
✅ **Authentication documentation** - Security requirements clearly marked  
✅ **Resource grouping** - Endpoints grouped by tags (Authentication, Accounts, Transactions, etc.)  
✅ **Bilingual support** - Available in both English and Estonian  
✅ **Interactive testing** - Try out endpoints directly from the documentation  

## Endpoint Categories

### 🔐 Authentication
- User registration and login
- Session management
- JWT token handling

### 👤 Users  
- Profile management
- Password changes
- User information

### 🏦 Accounts
- Account creation and management
- Balance inquiries
- Account status updates

### 💸 Transactions
- Internal transfers (same bank)
- External transfers (interbank)
- Transaction history and status

### 🏛️ Central Bank
- Bank registration
- Bank directory
- Health checks

### 🔄 Interbank
- B2B transaction processing
- JWKS key exchange
- Cross-bank communication

## Running the Application

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. Start the server:
   ```bash
   npm start
   ```

4. Access documentation at:
   - English: http://localhost:3000/docs
   - Estonian: http://localhost:3000/docs/et

## API Testing

All endpoints can be tested directly from the Swagger UI interface. For endpoints requiring authentication:

1. First register a user at `/api/auth/register`
2. Login at `/api/auth/login` to get a JWT token
3. Click the "Authorize" button in Swagger UI
4. Enter `Bearer YOUR_JWT_TOKEN` 
5. Now you can test protected endpoints

## Documentation Standards

This documentation follows OpenAPI 3.0 specification and includes:

- Comprehensive schema definitions
- Request/response examples
- Error response documentation  
- Security scheme definitions
- Tag-based organization
- Multilingual descriptions

The documentation is automatically generated from code annotations and served via Swagger UI for an interactive experience.
