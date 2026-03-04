const express = require('express');
const router = express.Router();
const { getWallet, getTransactions, requestWithdraw, getWithdrawals } = require('../controllers/walletController');
const { protect } = require('../middleware/auth');

router.get('/', protect, getWallet);
router.get('/transactions', protect, getTransactions);
router.post('/withdraw', protect, requestWithdraw);
router.get('/withdrawals', protect, getWithdrawals);

module.exports = router;
