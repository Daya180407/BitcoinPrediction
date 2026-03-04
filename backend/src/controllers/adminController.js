const User = require('../models/User');
const Wallet = require('../models/Wallet');
const Bet = require('../models/Bet');
const Transaction = require('../models/Transaction');
const WithdrawRequest = require('../models/WithdrawRequest');
const GameConfig = require('../models/GameConfig');

// @desc    Get admin dashboard stats
// @route   GET /api/admin/stats
const getDashboardStats = async (req, res) => {
  try {
    const [
      totalUsers,
      totalBets,
      pendingWithdrawals,
      totalTransactions
    ] = await Promise.all([
      User.countDocuments({ role: 'user' }),
      Bet.countDocuments(),
      WithdrawRequest.countDocuments({ status: 'pending' }),
      Transaction.countDocuments()
    ]);

    const betsAgg = await Bet.aggregate([
      {
        $group: {
          _id: null,
          totalWagered: { $sum: '$betAmount' },
          totalPayout: { $sum: '$payout' },
          wins: { $sum: { $cond: [{ $eq: ['$result', 'WIN'] }, 1, 0] } },
          losses: { $sum: { $cond: [{ $eq: ['$result', 'LOSS'] }, 1, 0] } }
        }
      }
    ]);

    const betsStats = betsAgg[0] || { totalWagered: 0, totalPayout: 0, wins: 0, losses: 0 };
    const houseRevenue = betsStats.totalWagered - betsStats.totalPayout;

    const walletAgg = await Wallet.aggregate([
      { $group: { _id: null, totalBalance: { $sum: '$balance' } } }
    ]);

    const recentBets = await Bet.find()
      .populate('userId', 'username email')
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({
      stats: {
        totalUsers,
        totalBets,
        pendingWithdrawals,
        totalTransactions,
        totalWagered: betsStats.totalWagered,
        totalPayout: betsStats.totalPayout,
        houseRevenue,
        totalBalance: walletAgg[0]?.totalBalance || 0,
        wins: betsStats.wins,
        losses: betsStats.losses
      },
      recentBets
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

// @desc    Get all users
// @route   GET /api/admin/users
const getUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const users = await User.find({ role: 'user' })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const usersWithWallets = await Promise.all(users.map(async (user) => {
      const wallet = await Wallet.findOne({ userId: user._id });
      return { ...user.toObject(), wallet };
    }));

    const total = await User.countDocuments({ role: 'user' });

    res.json({
      users: usersWithWallets,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

// @desc    Toggle user active status
// @route   PUT /api/admin/users/:id/toggle
const toggleUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    user.isActive = !user.isActive;
    await user.save();

    res.json({ message: `User ${user.isActive ? 'activated' : 'deactivated'}`, isActive: user.isActive });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

// @desc    Get all bets (admin)
// @route   GET /api/admin/bets
const getAllBets = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const bets = await Bet.find()
      .populate('userId', 'username email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Bet.countDocuments();

    res.json({ bets, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

// @desc    Get withdrawal requests
// @route   GET /api/admin/withdrawals
const getWithdrawalRequests = async (req, res) => {
  try {
    const status = req.query.status || 'pending';
    const requests = await WithdrawRequest.find({ status })
      .populate('userId', 'username email')
      .sort({ createdAt: -1 });

    res.json({ requests });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

// @desc    Approve/reject withdrawal
// @route   PUT /api/admin/withdrawals/:id
const processWithdrawal = async (req, res) => {
  const { action, adminNote } = req.body; // 'approve' or 'reject'

  try {
    const request = await WithdrawRequest.findById(req.params.id).populate('userId');
    if (!request) return res.status(404).json({ error: 'Request not found' });
    if (request.status !== 'pending') return res.status(400).json({ error: 'Request already processed' });

    if (action === 'approve') {
      request.status = 'approved';
    } else if (action === 'reject') {
      request.status = 'rejected';
      // Refund the amount
      const wallet = await Wallet.findOne({ userId: request.userId._id });
      if (wallet) {
        wallet.balance += request.amount;
        await wallet.save();
        await Transaction.create({
          userId: request.userId._id,
          type: 'withdrawal',
          amount: request.amount,
          balanceBefore: wallet.balance - request.amount,
          balanceAfter: wallet.balance,
          description: 'Withdrawal request rejected - amount refunded',
          status: 'cancelled'
        });
      }
    } else {
      return res.status(400).json({ error: 'Invalid action' });
    }

    request.adminNote = adminNote;
    request.processedBy = req.user._id;
    request.processedAt = new Date();
    await request.save();

    res.json({ message: `Withdrawal ${action}d`, request });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

// @desc    Get/Update game config
// @route   GET/PUT /api/admin/config
const getGameConfig = async (req, res) => {
  try {
    const config = await GameConfig.getConfig();
    res.json({ config });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

const updateGameConfig = async (req, res) => {
  try {
    const config = await GameConfig.getConfig();
    const allowed = ['payoutMultiplier', 'minBetAmount', 'maxBetAmount', 'maxWithdrawalAmount', 'minWithdrawalAmount', 'dailyLoginBonus', 'referralBonus', 'maintenanceMode'];

    for (const key of allowed) {
      if (req.body[key] !== undefined) config[key] = req.body[key];
    }

    await config.save();
    res.json({ message: 'Config updated', config });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

// @desc    Credit wallet manually
// @route   POST /api/admin/credit
const creditWallet = async (req, res) => {
  const { userId, amount, reason } = req.body;
  try {
    const wallet = await Wallet.findOne({ userId });
    if (!wallet) return res.status(404).json({ error: 'Wallet not found' });

    const balanceBefore = wallet.balance;
    wallet.balance += parseFloat(amount);
    await wallet.save();

    await Transaction.create({
      userId,
      type: 'bonus',
      amount: parseFloat(amount),
      balanceBefore,
      balanceAfter: wallet.balance,
      description: reason || 'Admin credit'
    });

    res.json({ message: 'Wallet credited', balance: wallet.balance });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = {
  getDashboardStats, getUsers, toggleUser, getAllBets,
  getWithdrawalRequests, processWithdrawal, getGameConfig,
  updateGameConfig, creditWallet
};
