const dotenv = require('dotenv');
dotenv.config();

const mongoose = require('mongoose');
const User = require('../models/User');
const Wallet = require('../models/Wallet');
const GameConfig = require('../models/GameConfig');
const Transaction = require('../models/Transaction');

const connectDB = async () => {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/crypto_arena');
};

const seed = async () => {
  try {
    await connectDB();
    console.log('🌱 Starting seed...');

    // Create game config
    await GameConfig.deleteMany({});
    await GameConfig.create({
      payoutMultiplier: parseFloat(process.env.DEFAULT_PAYOUT_MULTIPLIER) || 1.8,
      minBetAmount: parseFloat(process.env.MIN_BET_AMOUNT) || 1,
      maxBetAmount: parseFloat(process.env.MAX_BET_AMOUNT) || 100,
      dailyLoginBonus: parseFloat(process.env.DAILY_LOGIN_BONUS) || 5
    });
    console.log('✅ Game config created');

    // Create admin user
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@cryptoarena.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123456';

    let admin = await User.findOne({ email: adminEmail });
    if (!admin) {
      admin = await User.create({
        username: 'admin',
        email: adminEmail,
        password: adminPassword,
        role: 'admin',
        isVerified: true
      });
      await Wallet.create({ userId: admin._id, balance: 0 });
      console.log('✅ Admin user created:', adminEmail);
    } else {
      console.log('ℹ️  Admin already exists');
    }

    // Create demo users
    const demoUsers = [
      { username: 'crypto_whale', email: 'whale@demo.com', password: 'Demo@1234' },
      { username: 'moon_trader', email: 'moon@demo.com', password: 'Demo@1234' },
      { username: 'satoshi_fan', email: 'satoshi@demo.com', password: 'Demo@1234' }
    ];

    for (const userData of demoUsers) {
      const exists = await User.findOne({ email: userData.email });
      if (!exists) {
        const user = await User.create({ ...userData, isVerified: true });
        const wallet = await Wallet.create({ userId: user._id, balance: 100 });
        await Transaction.create({
          userId: user._id,
          type: 'bonus',
          amount: 100,
          balanceBefore: 0,
          balanceAfter: 100,
          description: 'Demo account bonus'
        });

        // Add fake stats
        user.stats.totalBets = Math.floor(Math.random() * 50) + 10;
        user.stats.totalWins = Math.floor(user.stats.totalBets * 0.5);
        user.stats.totalLosses = user.stats.totalBets - user.stats.totalWins;
        user.stats.totalEarned = user.stats.totalWins * 18;
        user.stats.totalWagered = user.stats.totalBets * 10;
        user.updateStats();
        await user.save();
        console.log(`✅ Demo user created: ${userData.username}`);
      }
    }

    console.log('🎉 Seed complete!');
    console.log('\nAdmin credentials:');
    console.log('Email:', adminEmail);
    console.log('Password:', adminPassword);
    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
};

seed();
