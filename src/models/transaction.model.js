const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema(
  {
    transactionId: {
      type: String,
      required: true,
      unique: true,
    },
    fromAccount: {
      type: String,
      required: true,
    },
    toAccount: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: [1, 'Amount must be positive'],
    },
    currency: {
      type: String,
      required: true,
      enum: ['EUR', 'USD', 'GBP'],
    },
    explanation: {
      type: String,
      required: true,
      trim: true,
    },
    senderName: {
      type: String,
      required: true,
    },
    receiverName: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['pending', 'inProgress', 'completed', 'failed'],
      default: 'pending',
    },
    type: {
      type: String,
      enum: ['internal', 'external', 'incoming'],
      required: true,
    },
    errorMessage: {
      type: String,
      default: '',
    },
    initiatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
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
  }
);

// Indexes for faster queries
transactionSchema.index({ initiatedBy: 1 });
transactionSchema.index({ fromAccount: 1 });
transactionSchema.index({ toAccount: 1 });
transactionSchema.index({ status: 1 });
transactionSchema.index({ transactionId: 1 });

// Method to update transaction status
transactionSchema.methods.updateStatus = function (status, errorMessage = '') {
  this.status = status;
  if (errorMessage) {
    this.errorMessage = errorMessage;
  }
  this.updatedAt = Date.now();
  return this.save();
};

// Static method to generate transaction ID
transactionSchema.statics.generateTransactionId = function () {
  const timestamp = new Date().getTime();
  const random = Math.floor(Math.random() * 1000000);
  return `TRX${timestamp}${random}`;
};

const Transaction = mongoose.model('Transaction', transactionSchema);

module.exports = Transaction;
