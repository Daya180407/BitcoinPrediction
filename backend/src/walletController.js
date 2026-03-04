const Wallet = require('../models/Wallet');
const Transaction = require('../models/Transaction');
const WithdrawRequest = require('../models/WithdrawRequest');

// @desc    Get wallet balance and transactions
// @route   GET /api/wallet
const getWallet = async (req, res) => {
  try {
    const wallet = await Wallet.findOne({ userId: req.user._id });
    if (!wallet) return res.status(404).json({ error: 'Wallet not found' });

    const transactions = await Transaction.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({ wallet, transactions });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

// @desc    Get transactions
// @route   GET /api/wallet/transactions
const getTransactions = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const query = { userId: req.user._id };
    if (req.query.type) query.type = req.query.type;

    const transactions = await Transaction.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Transaction.countDocuments(query);

    res.json({
      transactions,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

// @desc    Create withdraw request
// @route   POST /api/wallet/withdraw
const requestWithdraw = async (req, res) => {
  const { amount, method, accountDetails } = req.body;

  if (!amount || amount < 10) {
    return res.status(400).json({ error: 'Minimum withdrawal is $10' });
  }

  try {
    const wallet = await Wallet.findOne({ userId: req.user._id });
    if (!wallet || wallet.balance < amount) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }

    // Check for pending withdrawal
    const pendingWithdraw = await WithdrawRequest.findOne({
      userId: req.user._id,
      status: 'pending'
    });
    if (pendingWithdraw) {
      return res.status(400).json({ error: 'You have a pending withdrawal request' });
    }

    // Hold the amount
    const balanceBefore = wallet.balance;
    wallet.balance -= amount;
    await wallet.save();

    await Transaction.create({
      userId: req.user._id,
      type: 'withdrawal',
      amount,
      balanceBefore,
      balanceAfter: wallet.balance,
      description: 'Withdrawal request submitted',
      status: 'pending'
    });

    const withdrawRequest = await WithdrawRequest.create({
      userId: req.user._id,
      amount,
      method,
      accountDetails
    });

    res.status(201).json({
      message: 'Withdrawal request submitted',
      request: withdrawRequest,
      walletBalance: wallet.balance
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

// @desc    Get user's withdraw requests
// @route   GET /api/wallet/withdrawals
const getWithdrawals = async (req, res) => {
  try {
    const requests = await WithdrawRequest.find({ userId: req.user._id })
      .sort({ createdAt: -1 });
    res.json({ requests });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { getWallet, getTransactions, requestWithdraw, getWithdrawals };
