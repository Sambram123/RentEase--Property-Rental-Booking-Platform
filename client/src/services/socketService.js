import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

let socket = null;
let reconnectTimer = null;

/**
 * Connect to the Socket.IO server with the given auth token.
 * Returns the socket instance; safe to call multiple times (idempotent).
 */
export const connectSocket = (token) => {
  if (socket?.connected) return socket;

  // Disconnect any stale socket first
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
  }

  socket = io(SOCKET_URL, {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 10000,
    timeout: 20000,
  });

  socket.on('connect', () => {
    console.log('🔌 Socket connected:', socket.id);
    clearTimeout(reconnectTimer);
  });

  socket.on('disconnect', (reason) => {
    console.log('🔌 Socket disconnected:', reason);
  });

  socket.on('connect_error', (err) => {
    console.warn('🔌 Socket connection error:', err.message);
  });

  return socket;
};

/**
 * Disconnect and clean up the socket.
 */
export const disconnectSocket = () => {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }
  clearTimeout(reconnectTimer);
};

/**
 * Get the current socket instance (may be null).
 */
export const getSocket = () => socket;

/**
 * Subscribe to a socket event. Returns an unsubscribe function.
 */
export const onSocketEvent = (event, callback) => {
  if (!socket) return () => {};
  socket.on(event, callback);
  return () => socket?.off(event, callback);
};

/**
 * Emit an event to the server.
 */
export const emitSocketEvent = (event, data) => {
  if (socket?.connected) {
    socket.emit(event, data);
  }
};

export default {
  connectSocket,
  disconnectSocket,
  getSocket,
  onSocketEvent,
  emitSocketEvent,
};
