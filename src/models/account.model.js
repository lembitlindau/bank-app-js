const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const accountSchema = new mongoose.Schema(
  {
    accountNumber: {
      type: String,
      required: true,
      unique: true,
      immutable: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    accountName: {
      type: String,
      required: true,
      trim: true,
    },
    balance: {
      type: Number,
      default: 0,
      min: [0, 'Balance cannot be negative'],
    },
    currency: {
      type: String,
      required: true,
      enum: ['EUR', 'USD', 'GBP'],
      default: 'EUR',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Index for faster queries
accountSchema.index({ owner: 1 });
accountSchema.index({ accountNumber: 1 });

// Static method to generate account number
accountSchema.statics.generateAccountNumber = function () {
  const bankPrefix = process.env.BANK_PREFIX || 'ABC';
  const uniqueId = uuidv4().replace(/-/g, '');
  return `${bankPrefix}${uniqueId}`;
};

// Method to update balance
accountSchema.methods.updateBalance = async function (amount, operation) {
  if (operation === 'credit') {
    this.balance += amount;
  } else if (operation === 'debit') {
    if (this.balance < amount) {
      throw new Error('Insufficient funds');
    }
    this.balance -= amount;
  } else {
    throw new Error('Invalid operation');
  }
  
  this.updatedAt = Date.now();
  return this.save();
};

// Virtual for formatted balance
accountSchema.virtual('formattedBalance').get(function () {
  return `${(this.balance / 100).toFixed(2)} ${this.currency}`;
});

const Account = mongoose.model('Account', accountSchema);

module.exports = Account;
