import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Message from '../models/Message.js';
import Conversation from '../models/Conversation.js';

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
    const isNewConnection = !connectedUsers.has(userId);
    if (isNewConnection) {
      connectedUsers.set(userId, new Set());
    }
    connectedUsers.get(userId).add(socket.id);

    // Notify client of successful connection
    socket.emit('connected', { userId, message: 'Socket connected' });

    // If this is the user's first socket tab/device, broadcast user_online event
    if (isNewConnection) {
      console.log(`🟢 User online: ${userId}`);
      socket.broadcast.emit('user_online', { userId });
    }

    // ── Chat room events ───────────────────────────────────────────────────────
    
    // Join a conversation room
    socket.on('join_conversation', ({ conversationId }) => {
      if (!conversationId) return;
      socket.join(`conversation_${conversationId}`);
      console.log(`👤 User ${userId} joined room: conversation_${conversationId}`);
    });

    // Leave a conversation room
    socket.on('leave_conversation', ({ conversationId }) => {
      if (!conversationId) return;
      socket.leave(`conversation_${conversationId}`);
      console.log(`👤 User ${userId} left room: conversation_${conversationId}`);
    });

    // Typing start indicator
    socket.on('typing_start', ({ conversationId, receiverId }) => {
      if (!conversationId) return;
      socket.to(`conversation_${conversationId}`).emit('typing_start', {
        conversationId,
        userId,
      });
    });

    // Typing stop indicator
    socket.on('typing_stop', ({ conversationId, receiverId }) => {
      if (!conversationId) return;
      socket.to(`conversation_${conversationId}`).emit('typing_stop', {
        conversationId,
        userId,
      });
    });

    // Mark messages read socket event
    socket.on('mark_read', async ({ conversationId }) => {
      if (!conversationId) return;
      try {
        const conversation = await Conversation.findById(conversationId);
        if (!conversation) return;

        // Check if user is participant
        const isParticipant = conversation.participants.some(
          (p) => p.toString() === userId
        );
        if (!isParticipant) return;

        // Mark all messages sent TO this user in this conversation as read
        await Message.updateMany(
          { conversation: conversationId, receiver: userId, isRead: false },
          { $set: { isRead: true, status: 'read' } }
        );

        // Reset unread count for this user
        conversation.unreadCounts.set(userId, 0);
        await conversation.save();

        // Notify other participants in the room
        socket.to(`conversation_${conversationId}`).emit('messages_read', {
          conversationId,
          readBy: userId,
        });

        // Send unread count update to user
        const userConversations = await Conversation.find({ participants: userId }).lean();
        const totalUnread = userConversations.reduce((sum, c) => {
          const count = c.unreadCounts?.get?.(userId) ?? c.unreadCounts?.[userId] ?? 0;
          return sum + count;
        }, 0);
        socket.emit('unread_count', { count: totalUnread });

      } catch (err) {
        console.error('Socket mark_read error:', err);
      }
    });

    // ── Disconnect ─────────────────────────────────────────────────────────
    socket.on('disconnect', async (reason) => {
      console.log(`🔌 Socket disconnected: ${userId} (${reason})`);
      const userSockets = connectedUsers.get(userId);
      if (userSockets) {
        userSockets.delete(socket.id);
        if (userSockets.size === 0) {
          connectedUsers.delete(userId);
          console.log(`🔴 User offline: ${userId}`);

          const lastSeenDate = new Date();
          // Update user's lastSeen timestamp in DB
          try {
            await User.findByIdAndUpdate(userId, { lastSeen: lastSeenDate });
          } catch (err) {
            console.error('Failed to update user lastSeen:', err);
          }

          // Broadcast user_offline presence update to all other connected clients
          socket.broadcast.emit('user_offline', {
            userId,
            lastSeen: lastSeenDate,
          });
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
