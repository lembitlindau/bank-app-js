#!/bin/bash

# Bank Application Quick Setup Script
# This script sets up the bank application with all necessary dependencies and configurations

echo "🏦 Bank Application Setup Script"
echo "================================"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if MongoDB is running
if ! command -v mongod &> /dev/null; then
    echo "⚠️  MongoDB is not installed or not in PATH."
    echo "Please make sure MongoDB is installed and running."
fi

# Check if OpenSSL is available
if ! command -v openssl &> /dev/null; then
    echo "❌ OpenSSL is not installed. Please install OpenSSL first."
    exit 1
fi

echo "✅ Prerequisites check passed"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Generate RSA keys if they don't exist
if [ ! -f "keys/private.pem" ]; then
    echo "🔐 Generating RSA key pair..."
    mkdir -p keys
    cd keys
    openssl genpkey -algorithm RSA -out private.pem -pkcs8 -aes256 -pass pass:bankkey123
    openssl rsa -in private.pem -pubout -out public.pem -passin pass:bankkey123
    cd ..
    echo "✅ RSA keys generated"
else
    echo "✅ RSA keys already exist"
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "⚠️  .env file not found. Please create one based on the README instructions."
    echo "Example .env content:"
    echo ""
    echo "PORT=3000"
    echo "MONGODB_URI=mongodb://localhost:27017/bank-app"
    echo "JWT_SECRET=your_super_secure_jwt_secret_key_here"
    echo "BANK_NAME=My Test Bank"
    echo "BANK_PREFIX=ABC"
    echo "CENTRAL_BANK_URL=https://keskpank.herokuapp.com"
    echo "CENTRAL_BANK_API_KEY=your_central_bank_api_key"
    echo "PRIVATE_KEY_PATH=./keys/private.pem"
    echo "PUBLIC_KEY_PATH=./keys/public.pem"
    echo "KEY_PASSPHRASE=bankkey123"
    echo "BASE_URL=http://localhost:3000"
    echo ""
else
    echo "✅ .env file exists"
fi

echo ""
echo "🚀 Setup complete!"
echo ""
echo "To start the application:"
echo "  npm start"
echo ""
echo "To run in development mode:"
echo "  npm run dev"
echo ""
echo "Access points:"
echo "  🌐 Web Interface: http://localhost:3000"
echo "  📚 API Docs: http://localhost:3000/docs"
echo "  🔑 JWKS Endpoint: http://localhost:3000/.well-known/jwks.json"
echo ""
echo "📖 For detailed instructions, see README.md"
