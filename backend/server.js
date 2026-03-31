require('dotenv').config();
require('express-async-errors');

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const rateLimit = require('express-rate-limit');

const connectDB = require('./config/db');
const { globalErrorHandler, notFound } = require('./middleware/errorHandler');
const Chat = require('./models/Chat');
const User = require('./models/User');

// ── App setup ─────────────────────────────────────────────
const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// ── Connect DB ────────────────────────────────────────────
connectDB();

// ── Middleware ────────────────────────────────────────────
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Rate limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  message: { success: false, message: 'Too many requests. Please try again later.' },
});
app.use('/api/', limiter);

// Stricter limiter for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: 'Too many login attempts. Please wait 15 minutes.' },
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// ── Static files ──────────────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ── Routes ────────────────────────────────────────────────
app.use('/api/auth', require('./routes/auth'));
app.use('/api/courses', require('./routes/courses'));
app.use('/api/enrollments', require('./routes/enrollments'));
app.use('/api/quiz', require('./routes/quiz'));
app.use('/api/payment', require('./routes/payment'));
app.use('/api/chat', require('./routes/chat'));
app.use('/api/admin', require('./routes/admin'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Learnify API is running 🚀', env: process.env.NODE_ENV });
});

// ── Socket.io ─────────────────────────────────────────────
const onlineUsers = new Map(); // userId → socketId

io.on('connection', (socket) => {
  console.log(`🔌 Socket connected: ${socket.id}`);

  // User joins with their userId
  socket.on('user:join', async (userId) => {
    onlineUsers.set(userId, socket.id);
    socket.userId = userId;
    // Update lastSeen
    await User.findByIdAndUpdate(userId, { lastSeen: new Date() }).catch(() => {});
    // Broadcast online users
    io.emit('users:online', Array.from(onlineUsers.keys()));
    console.log(`👤 User ${userId} online`);
  });

  // Send private message
  socket.on('chat:send', async (data) => {
    try {
      const { senderId, receiverId, message } = data;
      if (!senderId || !receiverId || !message?.trim()) return;

      // Save to DB
      const chat = await Chat.create({
        sender: senderId,
        receiver: receiverId,
        message: message.trim(),
      });

      const populated = await Chat.findById(chat._id).populate([
        { path: 'sender', select: 'name avatar role' },
        { path: 'receiver', select: 'name avatar role' },
      ]);

      // Emit to sender
      socket.emit('chat:message', populated);

      // Emit to receiver if online
      const receiverSocketId = onlineUsers.get(receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('chat:message', populated);
      }
    } catch (err) {
      socket.emit('chat:error', { message: 'Failed to send message.' });
    }
  });

  // Typing indicator
  socket.on('chat:typing', ({ senderId, receiverId, isTyping }) => {
    const receiverSocketId = onlineUsers.get(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('chat:typing', { senderId, isTyping });
    }
  });

  // Mark messages as read
  socket.on('chat:read', async ({ senderId, receiverId }) => {
    await Chat.updateMany(
      { sender: senderId, receiver: receiverId, isRead: false },
      { isRead: true }
    ).catch(() => {});
    const senderSocket = onlineUsers.get(senderId);
    if (senderSocket) {
      io.to(senderSocket).emit('chat:read', { receiverId });
    }
  });

  socket.on('disconnect', async () => {
    if (socket.userId) {
      onlineUsers.delete(socket.userId);
      await User.findByIdAndUpdate(socket.userId, { lastSeen: new Date() }).catch(() => {});
      io.emit('users:online', Array.from(onlineUsers.keys()));
      console.log(`❌ User ${socket.userId} offline`);
    }
  });
});

// ── Error handling ────────────────────────────────────────
app.use(notFound);
app.use(globalErrorHandler);

// ── Start server ──────────────────────────────────────────
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`\n🚀 Learnify server running on port ${PORT}`);
  console.log(`📌 Environment: ${process.env.NODE_ENV}`);
  console.log(`🌐 Client URL: ${process.env.CLIENT_URL}\n`);
});

module.exports = { app, server };
