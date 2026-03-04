const jwt = require('jsonwebtoken');
const User = require('../models/User');

let ioInstance = null;

const initializeSocket = (server) => {
  const { Server } = require('socket.io');
  const io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  ioInstance = io;

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (token) {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select('-password');
        if (user) {
          socket.userId = user._id.toString();
          socket.user = user;
        }
      }
      next();
    } catch (err) {
      next(); // Allow connection even without auth for public data
    }
  });

  io.on('connection', (socket) => {
    console.log(`Client connected: ${socket.id}${socket.userId ? ` (User: ${socket.userId})` : ' (Guest)'}`);

    // Join personal room if authenticated
    if (socket.userId) {
      socket.join(`user_${socket.userId}`);
    }

    // Subscribe to price updates for specific coin
    socket.on('subscribeCoin', (coinId) => {
      socket.join(`coin_${coinId}`);
    });

    socket.on('unsubscribeCoin', (coinId) => {
      socket.leave(`coin_${coinId}`);
    });

    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${socket.id}`);
    });
  });

  console.log('🔌 WebSocket server initialized');
  return io;
};

const getIO = () => ioInstance;

module.exports = { initializeSocket, getIO };
