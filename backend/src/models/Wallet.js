const mongoose = require('mongoose');

const walletSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  balance: {
    type: Number,
    default: 0,
    min: 0
  },
  totalDeposited: {
    type: Number,
    default: 0
  },
  totalWithdrawn: {
    type: Number,
    default: 0
  },
  totalWagered: {
    type: Number,
    default: 0
  },
  totalWon: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

walletSchema.methods.credit = async function(amount, session) {
  this.balance += amount;
  return this.save({ session });
};

walletSchema.methods.debit = async function(amount, session) {
  if (this.balance < amount) throw new Error('Insufficient balance');
  this.balance -= amount;
  return this.save({ session });
};

module.exports = mongoose.model('Wallet', walletSchema);
