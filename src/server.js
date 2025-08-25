require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const mongoose = require('mongoose');
const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const path = require('path');

// Import routes
const authRoutes = require('./routes/auth.routes');
const accountRoutes = require('./routes/account.routes');
const transactionRoutes = require('./routes/transaction.routes');
const userRoutes = require('./routes/user.routes');
const centralBankRoutes = require('./routes/centralBank.routes');

// Import services
const startupService = require('./services/startup.service');

// Initialize express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));
app.use(express.static(path.join(__dirname, '../public')));

// Swagger configuration for English
const swaggerOptionsEn = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Bank API',
      version: '1.0.0',
      description: 'Comprehensive API documentation for the interbank transaction system',
      contact: {
        name: 'Bank Development Team',
        email: 'dev@bank.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: `http://localhost:${PORT}`,
        description: 'Development server',
      },
      {
        url: 'https://api.yourbank.com',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT token obtained from login endpoint'
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'User unique identifier'
            },
            username: {
              type: 'string',
              description: 'Username for authentication'
            },
            firstName: {
              type: 'string',
              description: 'User first name'
            },
            lastName: {
              type: 'string',
              description: 'User last name'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'User email address'
            },
            fullName: {
              type: 'string',
              description: 'Full name (first + last)'
            }
          }
        },
        Account: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Account unique identifier'
            },
            accountNumber: {
              type: 'string',
              description: 'Unique account number'
            },
            accountName: {
              type: 'string',
              description: 'Account display name'
            },
            balance: {
              type: 'number',
              description: 'Account balance in main currency unit'
            },
            currency: {
              type: 'string',
              enum: ['EUR', 'USD', 'GBP'],
              description: 'Account currency'
            },
            isActive: {
              type: 'boolean',
              description: 'Account status'
            }
          }
        },
        Transaction: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Transaction unique identifier'
            },
            transactionId: {
              type: 'string',
              description: 'Human-readable transaction ID'
            },
            fromAccount: {
              type: 'string',
              description: 'Source account number'
            },
            toAccount: {
              type: 'string',
              description: 'Destination account number'
            },
            amount: {
              type: 'number',
              description: 'Transaction amount'
            },
            currency: {
              type: 'string',
              description: 'Transaction currency'
            },
            explanation: {
              type: 'string',
              description: 'Transaction description'
            },
            status: {
              type: 'string',
              enum: ['pending', 'inProgress', 'completed', 'failed'],
              description: 'Transaction status'
            },
            type: {
              type: 'string',
              enum: ['internal', 'external', 'incoming'],
              description: 'Transaction type'
            },
            senderName: {
              type: 'string',
              description: 'Sender full name'
            },
            receiverName: {
              type: 'string',
              description: 'Receiver full name'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Transaction creation timestamp'
            }
          }
        },
        Error: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              example: 'error'
            },
            message: {
              type: 'string',
              description: 'Error message'
            },
            errors: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  field: {
                    type: 'string'
                  },
                  message: {
                    type: 'string'
                  }
                }
              }
            }
          }
        }
      }
    },
    tags: [
      {
        name: 'Authentication',
        description: 'User authentication and authorization endpoints'
      },
      {
        name: 'Users',
        description: 'User profile management'
      },
      {
        name: 'Accounts',
        description: 'Bank account management'
      },
      {
        name: 'Transactions',
        description: 'Transaction processing and history'
      },
      {
        name: 'Central Bank',
        description: 'Central bank integration endpoints'
      },
      {
        name: 'Interbank',
        description: 'Interbank communication endpoints'
      }
    ]
  },
  apis: ['./src/routes/*.js'],
};

// Swagger configuration for Estonian
const swaggerOptionsEt = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Panga API',
      version: '1.0.0',
      description: 'Terviklik API dokumentatsioon pangavahelise tehingute süsteemi jaoks',
      contact: {
        name: 'Panga Arendusmeeskond',
        email: 'dev@pank.ee'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: `http://localhost:${PORT}`,
        description: 'Arendusserver',
      },
      {
        url: 'https://api.teiebank.ee',
        description: 'Toodanguserver',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT märgend saadud sisselogimise otspunktist'
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Kasutaja unikaalne identifikaator'
            },
            username: {
              type: 'string',
              description: 'Kasutajanimi autentimiseks'
            },
            firstName: {
              type: 'string',
              description: 'Kasutaja eesnimi'
            },
            lastName: {
              type: 'string',
              description: 'Kasutaja perekonnanimi'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'Kasutaja e-posti aadress'
            },
            fullName: {
              type: 'string',
              description: 'Täisnimi (ees- + perekonnanimi)'
            }
          }
        },
        Account: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Konto unikaalne identifikaator'
            },
            accountNumber: {
              type: 'string',
              description: 'Unikaalne kontonumber'
            },
            accountName: {
              type: 'string',
              description: 'Konto kuvatav nimi'
            },
            balance: {
              type: 'number',
              description: 'Konto saldo põhivaluuta ühikutes'
            },
            currency: {
              type: 'string',
              enum: ['EUR', 'USD', 'GBP'],
              description: 'Konto valuuta'
            },
            isActive: {
              type: 'boolean',
              description: 'Konto staatus'
            }
          }
        },
        Transaction: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Tehingu unikaalne identifikaator'
            },
            transactionId: {
              type: 'string',
              description: 'Loetav tehingu ID'
            },
            fromAccount: {
              type: 'string',
              description: 'Lähte kontonumber'
            },
            toAccount: {
              type: 'string',
              description: 'Siht kontonumber'
            },
            amount: {
              type: 'number',
              description: 'Tehingu summa'
            },
            currency: {
              type: 'string',
              description: 'Tehingu valuuta'
            },
            explanation: {
              type: 'string',
              description: 'Tehingu kirjeldus'
            },
            status: {
              type: 'string',
              enum: ['pending', 'inProgress', 'completed', 'failed'],
              description: 'Tehingu staatus'
            },
            type: {
              type: 'string',
              enum: ['internal', 'external', 'incoming'],
              description: 'Tehingu tüüp'
            },
            senderName: {
              type: 'string',
              description: 'Saatja täisnimi'
            },
            receiverName: {
              type: 'string',
              description: 'Saaja täisnimi'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Tehingu loomise ajatempel'
            }
          }
        },
        Error: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              example: 'error'
            },
            message: {
              type: 'string',
              description: 'Veateade'
            },
            errors: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  field: {
                    type: 'string'
                  },
                  message: {
                    type: 'string'
                  }
                }
              }
            }
          }
        }
      }
    },
    tags: [
      {
        name: 'Authentication',
        description: 'Kasutaja autentimine ja autoriseerimine'
      },
      {
        name: 'Users',
        description: 'Kasutajaprofiili haldamine'
      },
      {
        name: 'Accounts',
        description: 'Pangakonto haldamine'
      },
      {
        name: 'Transactions',
        description: 'Tehingute töötlemine ja ajalugu'
      },
      {
        name: 'Central Bank',
        description: 'Keskpanga integratsioon'
      },
      {
        name: 'Interbank',
        description: 'Pangavaheline kommunikatsioon'
      }
    ]
  },
  apis: ['./src/routes/*.et.js'],
};

const swaggerDocsEn = swaggerJsDoc(swaggerOptionsEn);
const swaggerDocsEt = swaggerJsDoc(swaggerOptionsEt);

// Setup English documentation
app.use('/docs', swaggerUi.serve);
app.get('/docs', swaggerUi.setup(swaggerDocsEn, {
  customSiteTitle: 'Bank API Documentation',
  customCss: '.swagger-ui .topbar { display: none }'
}));

// Setup Estonian documentation  
app.get('/docs/et', swaggerUi.setup(swaggerDocsEt, {
  customSiteTitle: 'Panga API Dokumentatsioon',
  customCss: '.swagger-ui .topbar { display: none }'
}));

// Also support /api-docs endpoints as mentioned in requirements
app.get('/api-docs', swaggerUi.setup(swaggerDocsEn, {
  customSiteTitle: 'Bank API Documentation',
  customCss: '.swagger-ui .topbar { display: none }'
}));

app.get('/api-docs/et', swaggerUi.setup(swaggerDocsEt, {
  customSiteTitle: 'Panga API Dokumentatsioon', 
  customCss: '.swagger-ui .topbar { display: none }'
}));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/accounts', accountRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/users', userRoutes);
app.use('/api/central-bank', centralBankRoutes);

// JWKS endpoint for other banks
app.use('/.well-known', transactionRoutes);

// Serve the main application
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.statusCode || 500).json({
    status: 'error',
    message: err.message || 'Internal Server Error',
  });
});

// Connect to MongoDB and start server
mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Swagger documentation available at http://localhost:${PORT}/docs`);
      
      // Initialize bank services
      startupService.initialize();
    });
  })
  .catch((err) => {
    console.error('Failed to connect to MongoDB', err);
    process.exit(1);
  });

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
});

module.exports = app; // For testing purposes
