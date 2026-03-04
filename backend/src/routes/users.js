const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const User = require('../models/User');

router.get('/profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/profile', protect, async (req, res) => {
  const { username } = req.body;
  try {
    const user = await User.findById(req.user._id);
    if (username) user.username = username;
    await user.save();
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
