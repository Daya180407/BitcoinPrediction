const express = require('express');
const router = express.Router();
const { getDashboardStats, getUsers, toggleUser, getAllBets, getWithdrawalRequests, processWithdrawal, getGameConfig, updateGameConfig, creditWallet } = require('../controllers/adminController');
const { protect, adminOnly } = require('../middleware/auth');

router.use(protect, adminOnly);
router.get('/stats', getDashboardStats);
router.get('/users', getUsers);
router.put('/users/:id/toggle', toggleUser);
router.get('/bets', getAllBets);
router.get('/withdrawals', getWithdrawalRequests);
router.put('/withdrawals/:id', processWithdrawal);
router.get('/config', getGameConfig);
router.put('/config', updateGameConfig);
router.post('/credit', creditWallet);

module.exports = router;
