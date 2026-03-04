const Bet = require('../models/Bet');
const GameRound = require('../models/GameRound');
const Wallet = require('../models/Wallet');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const GameConfig = require('../models/GameConfig');
const { getPrice } = require('./priceService');

// Track active game timers
const activeTimers = new Map();

// Resolve a bet when timer ends
const resolveBet = async (betId, io) => {
  try {
    const bet = await Bet.findById(betId).populate('userId');
    if (!bet || bet.status !== 'active') return;

    const config = await GameConfig.getConfig();
    const endPrice = getPrice(bet.coin);

    if (!endPrice || endPrice === 0) {
      console.error(`Could not get price for ${bet.coin}`);
      return;
    }

    const priceChange = endPrice - bet.startPrice;
    const priceMovement = priceChange > 0 ? 'UP' : 'DOWN';
    const isWin = bet.direction === priceMovement;

    const payout = isWin ? parseFloat((bet.betAmount * config.payoutMultiplier).toFixed(2)) : 0;

    // Update bet
    bet.endPrice = endPrice;
    bet.result = isWin ? 'WIN' : 'LOSS';
    bet.payout = payout;
    bet.status = 'completed';
    bet.resolvedAt = new Date();
    await bet.save();

    // Update wallet if win
    const wallet = await Wallet.findOne({ userId: bet.userId._id });
    if (wallet) {
      const balanceBefore = wallet.balance;

      if (isWin) {
        wallet.balance = parseFloat((wallet.balance + payout).toFixed(2));
        wallet.totalWon += payout;

        await Transaction.create({
          userId: bet.userId._id,
          type: 'win',
          amount: payout,
          balanceBefore,
          balanceAfter: wallet.balance,
          description: `Won bet on ${bet.coinSymbol} - ${bet.direction}`,
          metadata: { betId: bet._id }
        });
      }

      wallet.totalWagered += bet.betAmount;
      await wallet.save();
    }

    // Update user stats
    const user = await User.findById(bet.userId._id);
    if (user) {
      user.stats.totalBets += 1;
      if (isWin) {
        user.stats.totalWins += 1;
        user.stats.totalEarned += payout;
      } else {
        user.stats.totalLosses += 1;
      }
      user.stats.totalWagered += bet.betAmount;
      user.updateStats();
      await user.save();
    }

    // Emit result to user
    if (io) {
      io.to(`user_${bet.userId._id}`).emit('betResult', {
        betId: bet._id,
        result: bet.result,
        endPrice,
        startPrice: bet.startPrice,
        payout,
        coin: bet.coin,
        coinSymbol: bet.coinSymbol,
        direction: bet.direction,
        walletBalance: wallet?.balance || 0
      });
    }

    // Clean up timer
    activeTimers.delete(betId.toString());

    return bet;
  } catch (error) {
    console.error('Error resolving bet:', error);
  }
};

// Place a bet and start timer
const placeBet = async (betData, io) => {
  const { userId, coin, coinSymbol, direction, betAmount, duration } = betData;
  const config = await GameConfig.getConfig();

  // Check for active bet (anti-cheat)
  const existingActiveBet = await Bet.findOne({
    userId,
    coin,
    status: 'active'
  });

  if (existingActiveBet) {
    throw new Error('You already have an active bet on this coin');
  }

  // Check bet limits
  if (betAmount < config.minBetAmount || betAmount > config.maxBetAmount) {
    throw new Error(`Bet amount must be between $${config.minBetAmount} and $${config.maxBetAmount}`);
  }

  const startPrice = getPrice(coin);
  if (!startPrice || startPrice === 0) {
    throw new Error('Unable to get current price. Please try again.');
  }

  // Debit wallet
  const wallet = await Wallet.findOne({ userId });
  if (!wallet || wallet.balance < betAmount) {
    throw new Error('Insufficient balance');
  }

  const balanceBefore = wallet.balance;
  wallet.balance = parseFloat((wallet.balance - betAmount).toFixed(2));
  await wallet.save();

  // Create transaction
  await Transaction.create({
    userId,
    type: 'bet',
    amount: betAmount,
    balanceBefore,
    balanceAfter: wallet.balance,
    description: `Bet placed on ${coinSymbol} - ${direction}`,
  });

  // Create bet
  const endsAt = new Date(Date.now() + duration * 1000);
  const bet = await Bet.create({
    userId,
    coin,
    coinSymbol,
    direction,
    betAmount,
    duration,
    startPrice,
    result: 'PENDING',
    payoutMultiplier: config.payoutMultiplier,
    status: 'active'
  });

  // Start timer to resolve bet
  const timerId = setTimeout(async () => {
    await resolveBet(bet._id, io);
  }, duration * 1000);

  activeTimers.set(bet._id.toString(), timerId);

  // Emit bet placed event
  if (io) {
    io.to(`user_${userId}`).emit('betPlaced', {
      betId: bet._id,
      coin,
      coinSymbol,
      direction,
      betAmount,
      duration,
      startPrice,
      endsAt,
      walletBalance: wallet.balance
    });
  }

  return { bet, walletBalance: wallet.balance };
};

// Start game engine
const startGameEngine = async (io) => {
  console.log('🎮 Game engine started');

  // Re-queue any active bets that were pending when server restarted
  try {
    const activeBets = await Bet.find({ status: 'active' });
    for (const bet of activeBets) {
      const timeLeft = new Date(bet.createdAt).getTime() + (bet.duration * 1000) - Date.now();
      if (timeLeft <= 0) {
        await resolveBet(bet._id, io);
      } else {
        const timerId = setTimeout(async () => {
          await resolveBet(bet._id, io);
        }, timeLeft);
        activeTimers.set(bet._id.toString(), timerId);
      }
    }
    if (activeBets.length > 0) {
      console.log(`Re-queued ${activeBets.length} active bets`);
    }
  } catch (err) {
    console.error('Error re-queuing bets:', err);
  }
};

module.exports = { startGameEngine, placeBet, resolveBet };
