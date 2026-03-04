const mongoose = require('mongoose');

const withdrawRequestSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 10
  },
  method: {
    type: String,
    enum: ['bank_transfer', 'crypto', 'paypal'],
    required: true
  },
  accountDetails: {
    accountName: String,
    accountNumber: String,
    bankName: String,
    cryptoAddress: String,
    cryptoNetwork: String,
    paypalEmail: String
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'processing', 'completed'],
    default: 'pending'
  },
  adminNote: {
    type: String
  },
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  processedAt: {
    type: Date
  },
  transactionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Transaction'
  }
}, { timestamps: true });

withdrawRequestSchema.index({ userId: 1, createdAt: -1 });
withdrawRequestSchema.index({ status: 1 });

module.exports = mongoose.model('WithdrawRequest', withdrawRequestSchema);
