const mongoose = require('mongoose');

const betSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  gameRoundId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'GameRound'
  },
  coin: {
    type: String,
    enum: ['bitcoin', 'ethereum', 'solana', 'binancecoin'],
    required: true
  },
  coinSymbol: {
    type: String,
    enum: ['BTC', 'ETH', 'SOL', 'BNB'],
    required: true
  },
  direction: {
    type: String,
    enum: ['UP', 'DOWN'],
    required: true
  },
  betAmount: {
    type: Number,
    required: true,
    min: 1
  },
  duration: {
    type: Number,
    enum: [15, 30, 60],
    required: true
  },
  startPrice: {
    type: Number,
    required: true
  },
  endPrice: {
    type: Number
  },
  result: {
    type: String,
    enum: ['WIN', 'LOSS', 'PENDING']
  },
  payout: {
    type: Number,
    default: 0
  },
  payoutMultiplier: {
    type: Number,
    default: 1.8
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'cancelled'],
    default: 'active'
  },
  resolvedAt: {
    type: Date
  }
}, { timestamps: true });

betSchema.index({ userId: 1, createdAt: -1 });
betSchema.index({ status: 1 });
betSchema.index({ coin: 1, status: 1 });

module.exports = mongoose.model('Bet', betSchema);
