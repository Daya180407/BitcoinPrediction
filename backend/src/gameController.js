const Bet = require('../models/Bet');
const Wallet = require('../models/Wallet');
const GameConfig = require('../models/GameConfig');
const { placeBet } = require('../services/gameEngine');
const { getAllPrices } = require('../services/priceService');

let io;
const setIO = (socketIO) => { io = socketIO; };

// @desc    Place a bet
// @route   POST /api/game/bet
const createBet = async (req, res) => {
  const { coin, coinSymbol, direction, betAmount, duration } = req.body;

  // Validate inputs
  const validCoins = ['bitcoin', 'ethereum', 'solana', 'binancecoin'];
  const validDirections = ['UP', 'DOWN'];
  const validDurations = [15, 30, 60];

  if (!validCoins.includes(coin)) {
    return res.status(400).json({ error: 'Invalid coin' });
  }
  if (!validDirections.includes(direction)) {
    return res.status(400).json({ error: 'Invalid direction' });
  }
  if (!validDurations.includes(Number(duration))) {
    return res.status(400).json({ error: 'Invalid duration' });
  }
  if (!betAmount || betAmount <= 0) {
    return res.status(400).json({ error: 'Invalid bet amount' });
  }

  try {
    const result = await placeBet({
      userId: req.user._id,
      coin,
      coinSymbol,
      direction,
      betAmount: Number(betAmount),
      duration: Number(duration)
    }, io);

    res.status(201).json({
      message: 'Bet placed successfully',
      bet: result.bet,
      walletBalance: result.walletBalance
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// @desc    Get user's bet history
// @route   GET /api/game/history
const getBetHistory = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const bets = await Bet.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Bet.countDocuments({ userId: req.user._id });

    res.json({
      bets,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

// @desc    Get active bet
// @route   GET /api/game/active
const getActiveBet = async (req, res) => {
  try {
    const { coin } = req.query;
    const query = { userId: req.user._id, status: 'active' };
    if (coin) query.coin = coin;

    const bet = await Bet.findOne(query).sort({ createdAt: -1 });
    res.json({ bet });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

// @desc    Get current prices
// @route   GET /api/game/prices
const getPrices = async (req, res) => {
  try {
    const prices = getAllPrices();
    res.json({ prices });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

// @desc    Get game config
// @route   GET /api/game/config
const getConfig = async (req, res) => {
  try {
    const config = await GameConfig.getConfig();
    res.json({ config });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { createBet, getBetHistory, getActiveBet, getPrices, getConfig, setIO };
