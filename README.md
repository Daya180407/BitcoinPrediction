# 🏆 Crypto Prediction Arena

A production-ready crypto prediction game platform where users predict whether cryptocurrency prices will go UP or DOWN within a selected time window.

---

## 📁 Project Structure

```
crypto-arena/
├── backend/
│   ├── src/
│   │   ├── config/database.js
│   │   ├── controllers/
│   │   │   ├── authController.js
│   │   │   ├── gameController.js
│   │   │   ├── walletController.js
│   │   │   ├── paymentController.js
│   │   │   ├── adminController.js
│   │   │   └── leaderboardController.js
│   │   ├── middleware/auth.js
│   │   ├── models/
│   │   │   ├── User.js
│   │   │   ├── Wallet.js
│   │   │   ├── Transaction.js
│   │   │   ├── Bet.js
│   │   │   ├── GameRound.js
│   │   │   ├── WithdrawRequest.js
│   │   │   └── GameConfig.js
│   │   ├── routes/
│   │   │   ├── auth.js, game.js, wallet.js
│   │   │   ├── payment.js, admin.js, leaderboard.js
│   │   ├── services/
│   │   │   ├── priceService.js   (CoinGecko + fallback simulator)
│   │   │   └── gameEngine.js     (bet placement + resolution)
│   │   ├── websocket/socketHandler.js
│   │   └── utils/seeder.js
│   ├── .env.example
│   ├── Dockerfile
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/Layout.js   (Navbar + price ticker)
│   │   │   └── game/
│   │   │       ├── CoinSelector.js
│   │   │       ├── CountdownTimer.js
│   │   │       ├── BetResultModal.js
│   │   │       └── MiniChart.js
│   │   ├── context/
│   │   │   ├── AuthContext.js
│   │   │   └── PriceContext.js
│   │   ├── pages/
│   │   │   ├── LoginPage.js / SignupPage.js
│   │   │   ├── GamePage.js        (main arena)
│   │   │   ├── WalletPage.js
│   │   │   ├── HistoryPage.js
│   │   │   ├── LeaderboardPage.js
│   │   │   ├── ProfilePage.js
│   │   │   └── AdminPage.js
│   │   ├── services/
│   │   │   ├── api.js
│   │   │   └── socket.js
│   │   └── App.js
│   ├── .env.example
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
│
├── docker-compose.yml
└── README.md
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB running locally or MongoDB Atlas URI

### 1. Backend

```bash
cd backend
cp .env.example .env
# Edit .env — set MONGODB_URI and JWT_SECRET at minimum
npm install
npm run seed        # Creates admin user + demo accounts
npm run dev         # API on http://localhost:5000
```

### 2. Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm start           # App on http://localhost:3000
```

### Default Credentials (after seed)

| Role  | Email                      | Password       |
|-------|----------------------------|----------------|
| Admin | admin@cryptoarena.com      | Admin@123456   |
| User  | whale@demo.com             | Demo@1234      |
| User  | moon@demo.com              | Demo@1234      |

---

## 🐳 Docker Deployment

```bash
# 1. Set env vars
cp backend/.env.example backend/.env
nano backend/.env        # Set JWT_SECRET, payment keys, etc.

# 2. Start all services
docker-compose up -d --build

# 3. Seed database
docker exec crypto_arena_backend node src/utils/seeder.js

# 4. Access
# Frontend → http://localhost:3000
# Backend  → http://localhost:5000
# MongoDB  → localhost:27017
```

---

## 📡 API Reference

### Auth
```
POST /api/auth/signup    { username, email, password, referralCode? }
POST /api/auth/login     { email, password }
GET  /api/auth/me        → returns user + wallet
```

### Game
```
POST /api/game/bet       { coin, coinSymbol, direction, betAmount, duration }
GET  /api/game/history   ?page=1&limit=20
GET  /api/game/active    ?coin=bitcoin
GET  /api/game/prices    → live prices for all coins
GET  /api/game/config    → payout multiplier, bet limits
```

### Wallet
```
GET  /api/wallet
GET  /api/wallet/transactions  ?type=bet|win|deposit...
POST /api/wallet/withdraw      { amount, method, accountDetails }
GET  /api/wallet/withdrawals
```

### Payment
```
POST /api/payment/demo-deposit         { amount }
POST /api/payment/stripe/create-intent { amount }
POST /api/payment/stripe/confirm       { paymentIntentId, amount }
POST /api/payment/razorpay/create-order { amount }
POST /api/payment/razorpay/verify      { orderId, paymentId, amount }
```

### Admin (JWT + admin role required)
```
GET  /api/admin/stats
GET  /api/admin/users            ?page=1&limit=20
PUT  /api/admin/users/:id/toggle
GET  /api/admin/bets             ?page=1&limit=20
GET  /api/admin/withdrawals      ?status=pending
PUT  /api/admin/withdrawals/:id  { action: 'approve'|'reject', adminNote? }
GET  /api/admin/config
PUT  /api/admin/config           { payoutMultiplier, minBetAmount, ... }
POST /api/admin/credit           { userId, amount, reason }
```

---

## 🔌 WebSocket Events

### Server → Client
| Event         | Description                           |
|---------------|---------------------------------------|
| `priceUpdate` | Live price data broadcast every 5s    |
| `betPlaced`   | Confirmation after bet is accepted    |
| `betResult`   | WIN/LOSS result when timer expires    |

### Client → Server
| Event             | Description                    |
|-------------------|--------------------------------|
| `subscribeCoin`   | Subscribe to a coin's updates  |
| `unsubscribeCoin` | Unsubscribe from a coin        |

---

## 🎮 Game Rules

- Supported coins: BTC, ETH, SOL, BNB
- Time durations: 15s / 30s / 60s
- Bet amounts: $1 / $5 / $10 / $25 / $50 / $100 (or custom)
- **Win condition:** Predict correct price direction
- **Payout:** 1.8× bet amount on win (configurable by admin)
- **Anti-cheat:** One active bet per coin per user at a time
- **Daily bonus:** $5 credited on first login each day
- **Referral bonus:** $10 for each friend you invite

---

## 💰 Wallet Features

| Feature           | Details                                   |
|-------------------|-------------------------------------------|
| Demo Deposit      | Instant for testing (no real money)       |
| Stripe            | Card payments (set STRIPE_SECRET_KEY)     |
| Razorpay          | UPI/card (set RAZORPAY keys)              |
| Withdrawal        | Submitted to admin for approval           |
| Transaction log   | Full history: deposits, bets, wins, bonus |

---

## 🔒 Security

- Passwords hashed with bcrypt (12 rounds)
- JWT tokens with 7-day expiry
- Rate limiting: 100 req/15min per IP
- Helmet.js HTTP headers
- Input validation with express-validator
- Admin role required for admin routes
- Anti-cheat: prevents duplicate active bets
- Withdrawal funds held until admin approval

---

## ⚙️ Admin Panel Features

- **Dashboard** — revenue stats, active users, recent bets
- **User Management** — view all users, ban/unban
- **All Bets** — complete bet history with results
- **Withdrawals** — approve/reject with auto-refund on rejection
- **Game Config** — payout multiplier, bet limits, bonuses, maintenance mode
- **Manual Credit** — credit any user's wallet directly

---

## 🌐 Production Checklist

- [ ] Change `JWT_SECRET` to a strong random string
- [ ] Set real `MONGODB_URI` (Atlas recommended)
- [ ] Configure Stripe with live keys
- [ ] Configure Razorpay with live keys
- [ ] Set `FRONTEND_URL` to your domain for CORS
- [ ] Add CoinGecko API key for higher rate limits
- [ ] Set up SSL/TLS (use Caddy or nginx + certbot)
- [ ] Configure MongoDB authentication
- [ ] Set up automated MongoDB backups
- [ ] Enable process monitoring (PM2 or Docker restart policy)

---

## 📦 Tech Stack

| Layer       | Technology                              |
|-------------|-----------------------------------------|
| Frontend    | React 18, Tailwind CSS, Framer Motion   |
| Backend     | Node.js, Express.js                     |
| Database    | MongoDB + Mongoose ODM                  |
| Auth        | JWT (jsonwebtoken + bcryptjs)           |
| Real-time   | Socket.io (WebSockets)                  |
| Prices      | CoinGecko API (with price simulator)    |
| Payments    | Stripe + Razorpay                       |
| DevOps      | Docker + Docker Compose                 |
| UI Charts   | SVG-based mini charts (custom)          |

---

## 📝 License

MIT License — Free to use and modify for personal/commercial projects.
