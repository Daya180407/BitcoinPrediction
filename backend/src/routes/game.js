const express = require('express');
const router = express.Router();
const { createBet, getBetHistory, getActiveBet, getPrices, getConfig } = require('../controllers/gameController');
const { protect } = require('../middleware/auth');

router.post('/bet', protect, createBet);
router.get('/history', protect, getBetHistory);
router.get('/active', protect, getActiveBet);
router.get('/prices', getPrices);
router.get('/config', getConfig);

module.exports = router;
