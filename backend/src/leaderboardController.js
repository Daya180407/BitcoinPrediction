const User = require('../models/User');
const Bet = require('../models/Bet');

// @desc    Get leaderboard
// @route   GET /api/leaderboard
const getLeaderboard = async (req, res) => {
  try {
    const type = req.query.type || 'wins'; // 'wins', 'earnings', 'winrate'

    let sortField;
    if (type === 'wins') sortField = 'stats.totalWins';
    else if (type === 'earnings') sortField = 'stats.totalEarned';
    else if (type === 'winrate') sortField = 'stats.winRate';
    else sortField = 'stats.totalWins';

    const users = await User.find({ role: 'user', 'stats.totalBets': { $gt: 0 } })
      .select('username stats avatar createdAt')
      .sort({ [sortField]: -1 })
      .limit(50);

    const leaderboard = users.map((user, index) => ({
      rank: index + 1,
      username: user.username,
      avatar: user.avatar,
      totalWins: user.stats.totalWins,
      totalBets: user.stats.totalBets,
      totalEarned: user.stats.totalEarned,
      winRate: user.stats.winRate,
      memberSince: user.createdAt
    }));

    res.json({ leaderboard, type });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { getLeaderboard };
