const Wallet = require('../models/Wallet');
const Transaction = require('../models/Transaction');

// @desc    Create Stripe payment intent
// @route   POST /api/payment/stripe/create-intent
const createStripeIntent = async (req, res) => {
  const { amount } = req.body; // amount in USD

  if (!amount || amount < 5) {
    return res.status(400).json({ error: 'Minimum deposit is $5' });
  }

  try {
    if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY.startsWith('sk_test_your')) {
      // Mock response for demo
      return res.json({
        clientSecret: 'pi_demo_' + Math.random().toString(36).substr(2, 9) + '_secret_demo',
        amount: amount * 100,
        currency: 'usd',
        demo: true
      });
    }

    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // cents
      currency: 'usd',
      metadata: { userId: req.user._id.toString(), type: 'deposit' }
    });

    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    console.error('Stripe error:', error);
    res.status(500).json({ error: 'Payment initialization failed' });
  }
};

// @desc    Confirm Stripe payment and credit wallet
// @route   POST /api/payment/stripe/confirm
const confirmStripePayment = async (req, res) => {
  const { paymentIntentId, amount } = req.body;

  try {
    // In production, verify with Stripe
    // For demo, directly credit
    const wallet = await Wallet.findOne({ userId: req.user._id });
    if (!wallet) return res.status(404).json({ error: 'Wallet not found' });

    const balanceBefore = wallet.balance;
    const depositAmount = parseFloat(amount);

    wallet.balance = parseFloat((wallet.balance + depositAmount).toFixed(2));
    wallet.totalDeposited += depositAmount;
    await wallet.save();

    await Transaction.create({
      userId: req.user._id,
      type: 'deposit',
      amount: depositAmount,
      balanceBefore,
      balanceAfter: wallet.balance,
      description: 'Stripe deposit',
      reference: paymentIntentId,
      status: 'completed'
    });

    res.json({
      message: 'Deposit successful',
      amount: depositAmount,
      walletBalance: wallet.balance
    });
  } catch (error) {
    console.error('Confirm payment error:', error);
    res.status(500).json({ error: 'Payment confirmation failed' });
  }
};

// @desc    Create Razorpay order
// @route   POST /api/payment/razorpay/create-order
const createRazorpayOrder = async (req, res) => {
  const { amount } = req.body;

  if (!amount || amount < 5) {
    return res.status(400).json({ error: 'Minimum deposit is $5' });
  }

  try {
    if (!process.env.RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID.startsWith('your_')) {
      return res.json({
        orderId: 'order_demo_' + Math.random().toString(36).substr(2, 9),
        amount: amount * 100,
        currency: 'USD',
        keyId: 'rzp_demo',
        demo: true
      });
    }

    const Razorpay = require('razorpay');
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET
    });

    const order = await razorpay.orders.create({
      amount: Math.round(amount * 100),
      currency: 'USD',
      notes: { userId: req.user._id.toString() }
    });

    res.json({ orderId: order.id, amount: order.amount, currency: order.currency, keyId: process.env.RAZORPAY_KEY_ID });
  } catch (error) {
    console.error('Razorpay error:', error);
    res.status(500).json({ error: 'Payment initialization failed' });
  }
};

// @desc    Verify Razorpay and credit wallet
// @route   POST /api/payment/razorpay/verify
const verifyRazorpayPayment = async (req, res) => {
  const { orderId, paymentId, amount } = req.body;

  try {
    const wallet = await Wallet.findOne({ userId: req.user._id });
    if (!wallet) return res.status(404).json({ error: 'Wallet not found' });

    const balanceBefore = wallet.balance;
    const depositAmount = parseFloat(amount);

    wallet.balance = parseFloat((wallet.balance + depositAmount).toFixed(2));
    wallet.totalDeposited += depositAmount;
    await wallet.save();

    await Transaction.create({
      userId: req.user._id,
      type: 'deposit',
      amount: depositAmount,
      balanceBefore,
      balanceAfter: wallet.balance,
      description: 'Razorpay deposit',
      reference: paymentId,
      status: 'completed'
    });

    res.json({
      message: 'Deposit successful',
      amount: depositAmount,
      walletBalance: wallet.balance
    });
  } catch (error) {
    res.status(500).json({ error: 'Payment verification failed' });
  }
};

// @desc    Demo deposit (for testing)
// @route   POST /api/payment/demo-deposit
const demoDeposit = async (req, res) => {
  const { amount } = req.body;

  if (!amount || amount < 1 || amount > 1000) {
    return res.status(400).json({ error: 'Amount must be between $1 and $1000' });
  }

  try {
    const wallet = await Wallet.findOne({ userId: req.user._id });
    if (!wallet) return res.status(404).json({ error: 'Wallet not found' });

    const balanceBefore = wallet.balance;
    const depositAmount = parseFloat(amount);

    wallet.balance = parseFloat((wallet.balance + depositAmount).toFixed(2));
    wallet.totalDeposited += depositAmount;
    await wallet.save();

    await Transaction.create({
      userId: req.user._id,
      type: 'deposit',
      amount: depositAmount,
      balanceBefore,
      balanceAfter: wallet.balance,
      description: 'Demo deposit',
      reference: 'demo_' + Date.now(),
      status: 'completed'
    });

    res.json({
      message: `$${depositAmount} added to your wallet`,
      walletBalance: wallet.balance
    });
  } catch (error) {
    res.status(500).json({ error: 'Deposit failed' });
  }
};

module.exports = {
  createStripeIntent, confirmStripePayment,
  createRazorpayOrder, verifyRazorpayPayment,
  demoDeposit
};
