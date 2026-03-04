import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 15000
});

// Request interceptor - attach token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth
export const authAPI = {
  signup: (data) => api.post('/auth/signup', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me')
};

// Game
export const gameAPI = {
  placeBet: (data) => api.post('/game/bet', data),
  getHistory: (params) => api.get('/game/history', { params }),
  getActiveBet: (coin) => api.get('/game/active', { params: { coin } }),
  getPrices: () => api.get('/game/prices'),
  getConfig: () => api.get('/game/config')
};

// Wallet
export const walletAPI = {
  getWallet: () => api.get('/wallet'),
  getTransactions: (params) => api.get('/wallet/transactions', { params }),
  requestWithdraw: (data) => api.post('/wallet/withdraw', data),
  getWithdrawals: () => api.get('/wallet/withdrawals')
};

// Payment
export const paymentAPI = {
  demoDeposit: (amount) => api.post('/payment/demo-deposit', { amount }),
  createStripeIntent: (amount) => api.post('/payment/stripe/create-intent', { amount }),
  confirmStripe: (data) => api.post('/payment/stripe/confirm', data),
  createRazorpayOrder: (amount) => api.post('/payment/razorpay/create-order', { amount }),
  verifyRazorpay: (data) => api.post('/payment/razorpay/verify', data)
};

// Admin
export const adminAPI = {
  getStats: () => api.get('/admin/stats'),
  getUsers: (params) => api.get('/admin/users', { params }),
  toggleUser: (id) => api.put(`/admin/users/${id}/toggle`),
  getBets: (params) => api.get('/admin/bets', { params }),
  getWithdrawals: (status) => api.get('/admin/withdrawals', { params: { status } }),
  processWithdrawal: (id, data) => api.put(`/admin/withdrawals/${id}`, data),
  getConfig: () => api.get('/admin/config'),
  updateConfig: (data) => api.put('/admin/config', data),
  creditWallet: (data) => api.post('/admin/credit', data)
};

// Leaderboard
export const leaderboardAPI = {
  get: (type) => api.get('/leaderboard', { params: { type } })
};

export default api;
