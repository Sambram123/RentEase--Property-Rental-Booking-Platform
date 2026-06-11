import { useState, useEffect, useRef, useCallback } from 'react';
import { FiSend, FiUser, FiArrowLeft, FiHome, FiCheck } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import MessageBubble, { DateSeparator } from './MessageBubble';
import Loader from './Loader';
import { fetchMessages, sendMessage, markMessagesRead, deleteMessage } from '../services/messageService';
import { useChat } from '../context/ChatContext';
import { onSocketEvent } from '../services/socketService';
import { getUserAvatar } from '../utils/avatar';
import toast from 'react-hot-toast';

const PLACEHOLDER = 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=200&q=40';

const formatLastSeen = (lastSeen) => {
  if (!lastSeen) return 'Offline';
  const date = new Date(lastSeen);
  const now = new Date();
  const diff = now - date;

  if (diff < 60000) return 'Online';
  if (diff < 3600000) {
    const mins = Math.floor(diff / 60000);
    return `Active ${mins}m ago`;
  }
  if (diff < 86400000) {
    const hrs = Math.floor(diff / 3600000);
    return `Active ${hrs}h ago`;
  }
  return `Last seen ${date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} at ${date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`;
};

const ChatWindow = ({
  conversation,
  currentUserId,
  onBack,
  onMessageSent,
}) => {
  const {
    onlineUsers,
    typingUsers,
    joinConversation,
    leaveConversation,
    emitTypingStart,
    emitTypingStop,
    emitMarkRead,
  } = useChat();

  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inputValue, setInputValue] = useState('');
  const [sending, setSending] = useState(false);
  
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const otherUser = conversation?.participants?.find(
    (p) => p._id !== currentUserId
  );
  const property = conversation?.property;

  // Real-time statuses
  const presence = onlineUsers.get(otherUser?._id?.toString());
  const isOnline = presence?.isOnline ?? false;
  const lastSeen = presence?.lastSeen;
  const isOtherUserTyping = typingUsers[conversation?._id]?.has(otherUser?._id);

  // Fetch messages
  const loadMessages = useCallback(async () => {
    if (!conversation?._id) return;
    try {
      const result = await fetchMessages(conversation._id);
      setMessages(result.messages || []);
      // Mark as read in DB via REST API
      await markMessagesRead(conversation._id).catch(() => {});
      // Also notify socket server
      emitMarkRead(conversation._id);
    } catch (err) {
      toast.error(err.message || 'Failed to load messages');
    } finally {
      setLoading(false);
    }
  }, [conversation?._id, emitMarkRead]);

  // Handle Room Joining / Leaving
  useEffect(() => {
    if (!conversation?._id) return;
    
    // Join conversation room
    joinConversation(conversation._id);
    setLoading(true);
    loadMessages();

    return () => {
      // Leave conversation room
      leaveConversation(conversation._id);
      
      // Stop typing if active
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        emitTypingStop(conversation._id, otherUser?._id);
      }
    };
  }, [conversation?._id, joinConversation, leaveConversation, loadMessages]);

  // Real-time socket event listeners for active chat window
  useEffect(() => {
    if (!conversation?._id) return;

    // Listen for incoming messages
    const unsubReceive = onSocketEvent('receive_message', (msg) => {
      if (msg.conversation === conversation._id) {
        setMessages((prev) => {
          // Avoid duplicate messages
          if (prev.some((m) => m._id === msg._id)) return prev;
          return [...prev, msg];
        });
        
        // Auto-mark as read if we are looking at it
        if (msg.sender?._id !== currentUserId && msg.sender !== currentUserId) {
          markMessagesRead(conversation._id).catch(() => {});
          emitMarkRead(conversation._id);
        }
      }
    });

    // Listen for read receipt events
    const unsubRead = onSocketEvent('messages_read', ({ conversationId, readBy }) => {
      if (conversationId === conversation._id && readBy !== currentUserId) {
        setMessages((prev) =>
          prev.map((m) =>
            m.sender?._id === currentUserId || m.sender === currentUserId
              ? { ...m, status: 'read', isRead: true }
              : m
          )
        );
      }
    });

    // Listen for message deletion events
    const unsubDelete = onSocketEvent('message_deleted', ({ messageId, conversationId }) => {
      if (conversationId === conversation._id) {
        setMessages((prev) => prev.filter((m) => m._id !== messageId));
      }
    });

    return () => {
      unsubReceive();
      unsubRead();
      unsubDelete();
    };
  }, [conversation?._id, currentUserId, onSocketEvent, emitMarkRead]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOtherUserTyping]);

  // Focus input on select
  useEffect(() => {
    inputRef.current?.focus();
  }, [conversation?._id]);

  // Handle typing emissions
  const handleInputChange = (e) => {
    setInputValue(e.target.value);
    
    // Emit typing_start event
    emitTypingStart(conversation._id, otherUser?._id);

    // Setup debounce/timeout to emit typing_stop
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      emitTypingStop(conversation._id, otherUser?._id);
    }, 3000);
  };

  // Send message
  const handleSend = async (e) => {
    e?.preventDefault();
    if (!inputValue.trim() || sending) return;

    // Stop typing indicator instantly on send
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    emitTypingStop(conversation._id, otherUser?._id);

    setSending(true);
    const content = inputValue.trim();
    setInputValue(''); // Optimistically clear input

    try {
      const newMsg = await sendMessage(conversation._id, content);
      setMessages((prev) => {
        if (prev.some((m) => m._id === newMsg._id)) return prev;
        return [...prev, newMsg];
      });
      onMessageSent?.();
    } catch (err) {
      toast.error(err.message || 'Failed to send message');
      setInputValue(content); // Restore input on error
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  // Delete message
  const handleDelete = async (messageId) => {
    if (!window.confirm('Delete this message? This cannot be undone.')) return;
    try {
      await deleteMessage(messageId);
      setMessages((prev) => prev.filter((m) => m._id !== messageId));
      toast.success('Message deleted');
      onMessageSent?.();
    } catch (err) {
      toast.error(err.message || 'Failed to delete message');
    }
  };

  // Key handler for Enter
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Group messages by date
  const groupedMessages = [];
  let lastDate = '';
  messages.forEach((msg) => {
    const msgDate = new Date(msg.createdAt).toDateString();
    if (msgDate !== lastDate) {
      groupedMessages.push({ type: 'date', date: msg.createdAt });
      lastDate = msgDate;
    }
    groupedMessages.push({ type: 'message', data: msg });
  });

  if (!conversation) {
    return (
      <div className="flex h-full items-center justify-center bg-gray-50/30">
        <div className="text-center">
          <FiMessageSquareIcon className="mx-auto h-16 w-16 text-gray-200" />
          <p className="mt-4 text-sm font-medium text-secondary">
            Select a conversation
          </p>
          <p className="mt-1 text-xs text-muted">
            Choose from your conversations on the left
          </p>
        </div>
      </div>
    );
  }

  const avatar = otherUser ? getUserAvatar(otherUser) : '';

  return (
    <div className="flex h-full flex-col bg-white">
      {/* Chat header */}
      <div className="flex items-center gap-3 border-b border-gray-100 px-4 py-3 shrink-0">
        {/* Back button (mobile) */}
        <button
          type="button"
          onClick={onBack}
          className="flex h-8 w-8 items-center justify-center rounded-full transition hover:bg-gray-100 lg:hidden"
          aria-label="Back to conversations"
        >
          <FiArrowLeft className="h-4 w-4 text-secondary" />
        </button>

        {/* User avatar & presence */}
        <div className="relative shrink-0">
          {avatar ? (
            <img
              src={avatar}
              alt={otherUser?.name}
              className="h-10 w-10 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <FiUser className="h-5 w-5 text-primary" />
            </div>
          )}
          {isOnline && (
            <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-white" />
          )}
        </div>
        
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-secondary truncate">{otherUser?.name || 'User'}</p>
          <p className="text-xs text-muted capitalize truncate">
            {isOnline ? (
              <span className="text-green-600 font-semibold">Online</span>
            ) : (
              formatLastSeen(lastSeen)
            )}
          </p>
        </div>

        {/* Property card link */}
        {property && (
          <Link
            to={`/properties/${property._id}`}
            className="hidden items-center gap-2 rounded-xl border border-gray-100 bg-gray-50/60 px-3 py-1.5 transition hover:bg-gray-50 sm:flex"
          >
            <img
              src={property.images?.[0] || PLACEHOLDER}
              alt={property.title}
              className="h-8 w-12 rounded-lg object-cover"
              onError={(e) => { e.currentTarget.src = PLACEHOLDER; }}
            />
            <div className="max-w-[140px]">
              <p className="truncate text-xs font-medium text-secondary">{property.title}</p>
              <p className="flex items-center gap-1 text-[10px] text-muted">
                <FiHome className="h-2.5 w-2.5" /> View property
              </p>
            </div>
          </Link>
        )}
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 bg-gray-50/30">
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <Loader />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <div className="rounded-full bg-primary/10 p-4">
              <FiSend className="h-8 w-8 text-primary" />
            </div>
            <p className="mt-4 text-sm font-medium text-secondary">
              Start the conversation
            </p>
            <p className="mt-1 text-xs text-muted">
              Send a message about {property?.title || 'this property'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {groupedMessages.map((item, idx) =>
              item.type === 'date' ? (
                <DateSeparator key={`date-${idx}`} date={item.date} />
              ) : (
                <MessageBubble
                  key={item.data._id}
                  message={item.data}
                  isOwn={
                    (item.data.sender?._id || item.data.sender) === currentUserId
                  }
                  onDelete={handleDelete}
                />
              )
            )}
            
            {/* Animated Typing Indicator bubble */}
            {isOtherUserTyping && (
              <div className="flex items-start gap-2.5 max-w-[75%] animate-fade-in">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <FiUser className="h-4 w-4 text-primary" />
                </div>
                <div className="rounded-2xl bg-white border border-gray-100 px-4 py-3 shadow-sm">
                  <div className="flex items-center gap-1">
                    <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400" style={{ animationDelay: '0ms' }} />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400" style={{ animationDelay: '150ms' }} />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input area */}
      <form
        onSubmit={handleSend}
        className="border-t border-gray-100 px-4 py-3 bg-white shrink-0"
      >
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            rows={1}
            placeholder="Type a message…"
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            maxLength={2000}
            className="flex-1 resize-none rounded-xl border border-gray-200 bg-gray-50/60 px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            style={{ maxHeight: '120px' }}
            id="message-input"
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || sending}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary text-white shadow-sm transition hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed"
            id="send-message-btn"
          >
            {sending ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            ) : (
              <FiSend className="h-4 w-4" />
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

const FiMessageSquareIcon = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

export default ChatWindow;
