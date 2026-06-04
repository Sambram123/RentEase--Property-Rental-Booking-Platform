import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
import { connectSocket, disconnectSocket, onSocketEvent } from '../services/socketService';
import { fetchUnreadCount } from '../services/notificationService';
import toast from 'react-hot-toast';

const NotificationContext = createContext(null);

// ─── Notification type → icon/color config ───────────────────────────────────
const NOTIF_CONFIG = {
  booking_created:   { emoji: '📋', label: 'New Booking' },
  booking_confirmed: { emoji: '✅', label: 'Booking Confirmed' },
  booking_cancelled: { emoji: '❌', label: 'Booking Cancelled' },
  booking_completed: { emoji: '🏁', label: 'Booking Completed' },
  payment_success:   { emoji: '💰', label: 'Payment Received' },
  payment_failed:    { emoji: '⚠️', label: 'Payment Failed' },
  review_added:      { emoji: '⭐', label: 'New Review' },
  system:            { emoji: '🔔', label: 'System' },
};

export const getNotifConfig = (type) => NOTIF_CONFIG[type] || NOTIF_CONFIG.system;

export const NotificationProvider = ({ children }) => {
  const { token, isAuthenticated } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [recentNotifications, setRecentNotifications] = useState([]);
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const cleanupRef = useRef([]);

  // ── Load initial unread count on auth ─────────────────────────────────────
  useEffect(() => {
    if (!isAuthenticated || !token) {
      setUnreadCount(0);
      setRecentNotifications([]);
      return;
    }

    const loadCount = async () => {
      try {
        const count = await fetchUnreadCount();
        setUnreadCount(count);
      } catch {
        // silently skip
      }
    };
    loadCount();
  }, [isAuthenticated, token]);

  // ── Socket connection lifecycle ───────────────────────────────────────────
  useEffect(() => {
    if (!isAuthenticated || !token) {
      disconnectSocket();
      setIsSocketConnected(false);
      return;
    }

    const socket = connectSocket(token);

    // Track connection state
    const onConnect = () => setIsSocketConnected(true);
    const onDisconnect = () => setIsSocketConnected(false);
    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    if (socket.connected) setIsSocketConnected(true);

    // ── Real-time notification handler ────────────────────────────────────
    const unsubNotification = onSocketEvent('notification', (data) => {
      const notif = data.notification;
      const config = getNotifConfig(notif.type);

      // Show toast
      toast(
        `${config.emoji}  ${notif.title}\n${notif.message}`,
        {
          duration: 5000,
          style: {
            borderRadius: '16px',
            background: '#1a1a2e',
            color: '#fff',
            border: '1px solid rgba(255,255,255,0.1)',
          },
        }
      );

      // Prepend to recent list (keep max 20)
      setRecentNotifications((prev) => [notif, ...prev].slice(0, 20));
    });

    // ── Unread count updates ──────────────────────────────────────────────
    const unsubCount = onSocketEvent('unread_count', (data) => {
      setUnreadCount(data.count);
    });

    cleanupRef.current = [unsubNotification, unsubCount];

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      cleanupRef.current.forEach((unsub) => unsub());
      disconnectSocket();
      setIsSocketConnected(false);
    };
  }, [isAuthenticated, token]);

  // ── Manual refresh ────────────────────────────────────────────────────────
  const refreshUnreadCount = useCallback(async () => {
    try {
      const count = await fetchUnreadCount();
      setUnreadCount(count);
    } catch {
      // silently skip
    }
  }, []);

  const decrementUnread = useCallback(() => {
    setUnreadCount((prev) => Math.max(0, prev - 1));
  }, []);

  const clearUnreadCount = useCallback(() => {
    setUnreadCount(0);
  }, []);

  const value = {
    unreadCount,
    setUnreadCount,
    recentNotifications,
    isSocketConnected,
    refreshUnreadCount,
    decrementUnread,
    clearUnreadCount,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotifications must be used within NotificationProvider');
  return context;
};

export default NotificationContext;
