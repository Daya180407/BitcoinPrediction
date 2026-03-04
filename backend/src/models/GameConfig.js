const mongoose = require('mongoose');

const gameConfigSchema = new mongoose.Schema({
  payoutMultiplier: {
    type: Number,
    default: 1.8
  },
  minBetAmount: {
    type: Number,
    default: 1
  },
  maxBetAmount: {
    type: Number,
    default: 100
  },
  maxWithdrawalAmount: {
    type: Number,
    default: 1000
  },
  minWithdrawalAmount: {
    type: Number,
    default: 10
  },
  supportedCoins: {
    type: [String],
    default: ['bitcoin', 'ethereum', 'solana', 'binancecoin']
  },
  supportedDurations: {
    type: [Number],
    default: [15, 30, 60]
  },
  dailyLoginBonus: {
    type: Number,
    default: 5
  },
  referralBonus: {
    type: Number,
    default: 10
  },
  maintenanceMode: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

// Singleton pattern
gameConfigSchema.statics.getConfig = async function() {
  let config = await this.findOne();
  if (!config) {
    config = await this.create({});
  }
  return config;
};

module.exports = mongoose.model('GameConfig', gameConfigSchema);
