const express = require('express');
const router = express.Router();
const { createStripeIntent, confirmStripePayment, createRazorpayOrder, verifyRazorpayPayment, demoDeposit } = require('../controllers/paymentController');
const { protect } = require('../middleware/auth');

router.post('/stripe/create-intent', protect, createStripeIntent);
router.post('/stripe/confirm', protect, confirmStripePayment);
router.post('/razorpay/create-order', protect, createRazorpayOrder);
router.post('/razorpay/verify', protect, verifyRazorpayPayment);
router.post('/demo-deposit', protect, demoDeposit);

module.exports = router;
