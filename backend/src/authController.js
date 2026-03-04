const User = require('../models/User');
const Wallet = require('../models/Wallet');
const Transaction = require('../models/Transaction');
const GameConfig = require('../models/GameConfig');
const { generateToken } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

// @desc    Register user
// @route   POST /api/auth/signup
const signup = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { username, email, password, referralCode } = req.body;

  try {
    // Check existing user
    const exists = await User.findOne({ $or: [{ email }, { username }] });
    if (exists) {
      return res.status(400).json({
        error: exists.email === email ? 'Email already registered' : 'Username taken'
      });
    }

    // Handle referral
    let referredBy = null;
    if (referralCode) {
      const referrer = await User.findOne({ referralCode: referralCode.toUpperCase() });
      if (referrer) referredBy = referrer._id;
    }

    // Create user
    const user = await User.create({
      username,
      email,
      password,
      referredBy
    });

    // Create wallet
    const config = await GameConfig.getConfig();
    const wallet = await Wallet.create({ userId: user._id, balance: 0 });

    // Daily login bonus on signup
    const signupBonus = config.dailyLoginBonus;
    wallet.balance += signupBonus;
    wallet.totalDeposited += signupBonus;
    await wallet.save();

    await Transaction.create({
      userId: user._id,
      type: 'bonus',
      amount: signupBonus,
      balanceBefore: 0,
      balanceAfter: signupBonus,
      description: 'Welcome bonus'
    });

    // Credit referrer
    if (referredBy) {
      const referrerWallet = await Wallet.findOne({ userId: referredBy });
      if (referrerWallet) {
        const refBonus = config.referralBonus;
        const refBalBefore = referrerWallet.balance;
        referrerWallet.balance += refBonus;
        await referrerWallet.save();
        await Transaction.create({
          userId: referredBy,
          type: 'referral',
          amount: refBonus,
          balanceBefore: refBalBefore,
          balanceAfter: referrerWallet.balance,
          description: `Referral bonus for inviting ${username}`
        });
        await User.findByIdAndUpdate(referredBy, { $inc: { referralCount: 1 } });
      }
    }

    const token = generateToken(user._id);
    res.status(201).json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        referralCode: user.referralCode
      },
      wallet: { balance: wallet.balance }
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Server error during signup' });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (!user.isActive) {
      return res.status(403).json({ error: 'Account is deactivated' });
    }

    // Daily login bonus
    const config = await GameConfig.getConfig();
    let loginBonus = 0;
    const now = new Date();
    const lastBonus = user.lastLoginBonus;

    if (!lastBonus || (now - lastBonus) > 24 * 60 * 60 * 1000) {
      const wallet = await Wallet.findOne({ userId: user._id });
      if (wallet) {
        const balBefore = wallet.balance;
        loginBonus = config.dailyLoginBonus;
        wallet.balance += loginBonus;
        await wallet.save();

        await Transaction.create({
          userId: user._id,
          type: 'bonus',
          amount: loginBonus,
          balanceBefore: balBefore,
          balanceAfter: wallet.balance,
          description: 'Daily login bonus'
        });
      }

      user.lastLoginBonus = now;
      user.loginStreak = (lastBonus && (now - lastBonus) < 48 * 60 * 60 * 1000)
        ? user.loginStreak + 1 : 1;
      await user.save();
    }

    const wallet = await Wallet.findOne({ userId: user._id });
    const token = generateToken(user._id);

    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        referralCode: user.referralCode,
        stats: user.stats,
        loginStreak: user.loginStreak
      },
      wallet: { balance: wallet?.balance || 0 },
      loginBonus
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error during login' });
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const wallet = await Wallet.findOne({ userId: req.user._id });

    res.json({
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        referralCode: user.referralCode,
        stats: user.stats,
        loginStreak: user.loginStreak
      },
      wallet: { balance: wallet?.balance || 0 }
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { signup, login, getMe };
