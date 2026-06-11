import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
import { connectSocket, disconnectSocket, onSocketEvent, getSocket } from '../services/socketService';
import { fetchMessageUnreadCount, fetchConversations } from '../services/messageService';

const ChatContext = createContext(null);

export const ChatProvider = ({ children }) => {
  const { token, isAuthenticated } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState(new Map()); // userId -> { isOnline: boolean, lastSeen: Date }
  const [typingUsers, setTypingUsers] = useState({}); // conversationId -> Set of userIds
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const cleanupRef = useRef([]);

  // ── Load initial data ──────────────────────────────────────────────────────
  const loadInitialData = useCallback(async () => {
    if (!isAuthenticated || !token) {
      setConversations([]);
      setUnreadChatCount(0);
      return;
    }
    setLoadingConversations(true);
    try {
      const data = await fetchConversations('', false);
      setConversations(data.conversations || []);
      setUnreadChatCount(data.totalUnread || 0);

      // Initialize initial online users map from conversations list
      const initialPresence = new Map();
      data.conversations.forEach((c) => {
        c.participants.forEach((p) => {
          initialPresence.set(p._id.toString(), {
            isOnline: false, // will update via socket or manual presence check
            lastSeen: p.lastSeen || null,
          });
        });
      });
      setOnlineUsers(initialPresence);
    } catch (err) {
      console.error('Failed to load initial chat data:', err);
    } finally {
      setLoadingConversations(false);
    }
  }, [isAuthenticated, token]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // ── Socket lifecycle and event listeners ──────────────────────────────────
  useEffect(() => {
    if (!isAuthenticated || !token) {
      setIsSocketConnected(false);
      return;
    }

    const socket = connectSocket(token);

    const onConnect = () => setIsSocketConnected(true);
    const onDisconnect = () => setIsSocketConnected(false);

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    if (socket.connected) setIsSocketConnected(true);

    // 1. User Online Broadcast
    const unsubOnline = onSocketEvent('user_online', ({ userId }) => {
      setOnlineUsers((prev) => {
        const next = new Map(prev);
        next.set(userId, { isOnline: true, lastSeen: new Date() });
        return next;
      });
    });

    // 2. User Offline Broadcast
    const unsubOffline = onSocketEvent('user_offline', ({ userId, lastSeen }) => {
      setOnlineUsers((prev) => {
        const next = new Map(prev);
        next.set(userId, { isOnline: false, lastSeen: lastSeen || new Date() });
        return next;
      });
    });

    // 3. Typing Start
    const unsubTypingStart = onSocketEvent('typing_start', ({ conversationId, userId }) => {
      setTypingUsers((prev) => {
        const currentSet = prev[conversationId] ? new Set(prev[conversationId]) : new Set();
        currentSet.add(userId);
        return { ...prev, [conversationId]: currentSet };
      });
    });

    // 4. Typing Stop
    const unsubTypingStop = onSocketEvent('typing_stop', ({ conversationId, userId }) => {
      setTypingUsers((prev) => {
        const currentSet = prev[conversationId] ? new Set(prev[conversationId]) : new Set();
        currentSet.delete(userId);
        const next = { ...prev };
        if (currentSet.size === 0) {
          delete next[conversationId];
        } else {
          next[conversationId] = currentSet;
        }
        return next;
      });
    });

    // 5. Total Unread Chat Count Update
    const unsubUnreadCount = onSocketEvent('unread_count', ({ count }) => {
      setUnreadChatCount(count);
    });

    // 6. Conversation Updates (on new messages, preview changes, etc.)
    const unsubConversationUpdated = onSocketEvent('conversation_updated', ({ conversationId, message, unreadCount }) => {
      setConversations((prev) => {
        // Find existing conversation in list
        const existsIdx = prev.findIndex((c) => c._id === conversationId);
        if (existsIdx > -1) {
          const updatedConv = {
            ...prev[existsIdx],
            lastMessage: message.message,
            lastMessageAt: message.createdAt,
          };
          // Update unread count for current user
          if (updatedConv.unreadCounts) {
            // Check if we are sender or receiver
            const myId = socket.userId;
            const updatedUnread = { ...updatedConv.unreadCounts };
            if (message.receiver?._id === myId || message.receiver === myId) {
              updatedUnread[myId] = unreadCount;
            }
            updatedConv.unreadCounts = updatedUnread;
          }
          
          const nextConvs = [...prev];
          nextConvs.splice(existsIdx, 1); // remove
          return [updatedConv, ...nextConvs]; // prepend to top
        } else {
          // If conversation is new/re-activated, trigger a reload to get full details
          loadInitialData();
          return prev;
        }
      });
    });

    // 7. Messages Read notification
    const unsubMessagesRead = onSocketEvent('messages_read', ({ conversationId, readBy }) => {
      setConversations((prev) =>
        prev.map((c) => {
          if (c._id === conversationId) {
            const updatedUnread = { ...c.unreadCounts };
            updatedUnread[readBy] = 0;
            return { ...c, unreadCounts: updatedUnread };
          }
          return c;
        })
      );
    });

    // 8. Conversation Deleted
    const unsubConversationDeleted = onSocketEvent('conversation_deleted', ({ conversationId }) => {
      setConversations((prev) => prev.filter((c) => c._id !== conversationId));
      loadInitialData();
    });

    cleanupRef.current = [
      unsubOnline,
      unsubOffline,
      unsubTypingStart,
      unsubTypingStop,
      unsubUnreadCount,
      unsubConversationUpdated,
      unsubMessagesRead,
      unsubConversationDeleted,
    ];

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      cleanupRef.current.forEach((unsub) => unsub());
    };
  }, [isAuthenticated, token, loadInitialData]);

  // ── Emit socket helpers ───────────────────────────────────────────────────
  const joinConversation = useCallback((conversationId) => {
    if (!conversationId) return;
    const socket = getSocket();
    if (socket?.connected) {
      socket.emit('join_conversation', { conversationId });
    }
  }, []);

  const leaveConversation = useCallback((conversationId) => {
    if (!conversationId) return;
    const socket = getSocket();
    if (socket?.connected) {
      socket.emit('leave_conversation', { conversationId });
    }
  }, []);

  const emitTypingStart = useCallback((conversationId, receiverId) => {
    const socket = getSocket();
    if (socket?.connected) {
      socket.emit('typing_start', { conversationId, receiverId });
    }
  }, []);

  const emitTypingStop = useCallback((conversationId, receiverId) => {
    const socket = getSocket();
    if (socket?.connected) {
      socket.emit('typing_stop', { conversationId, receiverId });
    }
  }, []);

  const emitMarkRead = useCallback((conversationId) => {
    const socket = getSocket();
    if (socket?.connected) {
      socket.emit('mark_read', { conversationId });
    }
  }, []);

  const updateUserPresence = useCallback((userId, isOnline, lastSeen) => {
    setOnlineUsers((prev) => {
      const next = new Map(prev);
      next.set(userId, { isOnline, lastSeen });
      return next;
    });
  }, []);

  const value = {
    conversations,
    setConversations,
    loadingConversations,
    onlineUsers,
    typingUsers,
    unreadChatCount,
    isSocketConnected,
    refreshConversations: loadInitialData,
    joinConversation,
    leaveConversation,
    emitTypingStart,
    emitTypingStop,
    emitMarkRead,
    updateUserPresence,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) throw new Error('useChat must be used within ChatProvider');
  return context;
};

export default ChatContext;
