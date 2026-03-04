const mongoose = require('mongoose');

const gameRoundSchema = new mongoose.Schema({
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
  priceChange: {
    type: Number
  },
  priceChangePercent: {
    type: Number
  },
  result: {
    type: String,
    enum: ['UP', 'DOWN', 'PENDING'],
    default: 'PENDING'
  },
  status: {
    type: String,
    enum: ['active', 'resolving', 'completed'],
    default: 'active'
  },
  startedAt: {
    type: Date,
    default: Date.now
  },
  endsAt: {
    type: Date,
    required: true
  },
  resolvedAt: {
    type: Date
  },
  totalBets: {
    type: Number,
    default: 0
  },
  totalUpBets: {
    type: Number,
    default: 0
  },
  totalDownBets: {
    type: Number,
    default: 0
  },
  totalWagered: {
    type: Number,
    default: 0
  },
  totalPayout: {
    type: Number,
    default: 0
  },
  houseProfit: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

gameRoundSchema.index({ coin: 1, status: 1 });
gameRoundSchema.index({ endsAt: 1, status: 1 });

module.exports = mongoose.model('GameRound', gameRoundSchema);
