import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// ─── Connected users map: userId → Set<socketId> ────────────────────────────
const connectedUsers = new Map();

/**
 * Initialize Socket.IO on the given HTTP server
 * @param {import('http').Server} httpServer
 * @returns {import('socket.io').Server}
 */
const initializeSocket = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // ── Auth middleware — verify JWT on handshake ───────────────────────────────
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('Authentication required'));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password').lean();
      if (!user) return next(new Error('User not found'));

      socket.userId = user._id.toString();
      socket.user = user;
      next();
    } catch {
      next(new Error('Invalid or expired token'));
    }
  });

  // ── Connection handler ─────────────────────────────────────────────────────
  io.on('connection', (socket) => {
    const userId = socket.userId;
    console.log(`🔌 Socket connected: ${userId} (${socket.id})`);

    // Register user → socket mapping (supports multiple tabs)
    if (!connectedUsers.has(userId)) {
      connectedUsers.set(userId, new Set());
    }
    connectedUsers.get(userId).add(socket.id);

    // Notify client of successful connection
    socket.emit('connected', { userId, message: 'Socket connected' });

    // ── Disconnect ─────────────────────────────────────────────────────────
    socket.on('disconnect', (reason) => {
      console.log(`🔌 Socket disconnected: ${userId} (${reason})`);
      const userSockets = connectedUsers.get(userId);
      if (userSockets) {
        userSockets.delete(socket.id);
        if (userSockets.size === 0) {
          connectedUsers.delete(userId);
        }
      }
    });

    // ── Ping/pong for keep-alive ───────────────────────────────────────────
    socket.on('ping_server', () => {
      socket.emit('pong_server');
    });
  });

  return io;
};

/**
 * Send a real-time event to a specific user (all their tabs/devices)
 */
const emitToUser = (io, userId, event, data) => {
  const userSockets = connectedUsers.get(userId.toString());
  if (userSockets && userSockets.size > 0) {
    for (const socketId of userSockets) {
      io.to(socketId).emit(event, data);
    }
    return true;
  }
  return false; // user offline
};

/**
 * Get count of connected users
 */
const getOnlineCount = () => connectedUsers.size;

/**
 * Check if a user is online
 */
const isUserOnline = (userId) => connectedUsers.has(userId.toString());

export { initializeSocket, emitToUser, getOnlineCount, isUserOnline, connectedUsers };
