import { useState, useEffect, useRef, useCallback } from 'react';
import { FiSend, FiUser, FiArrowLeft, FiHome, FiMapPin } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import MessageBubble, { DateSeparator } from './MessageBubble';
import Loader from './Loader';
import { fetchMessages, sendMessage, markMessagesRead, deleteMessage } from '../services/messageService';
import toast from 'react-hot-toast';

const PLACEHOLDER = 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=200&q=40';

const ChatWindow = ({
  conversation,
  currentUserId,
  onBack,
  onMessageSent,
}) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inputValue, setInputValue] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const otherUser = conversation?.participants?.find(
    (p) => p._id !== currentUserId
  );
  const property = conversation?.property;

  // Fetch messages
  const loadMessages = useCallback(async () => {
    if (!conversation?._id) return;
    try {
      const result = await fetchMessages(conversation._id);
      setMessages(result.messages || []);
      // Mark as read
      await markMessagesRead(conversation._id).catch(() => {});
    } catch (err) {
      toast.error(err.message || 'Failed to load messages');
    } finally {
      setLoading(false);
    }
  }, [conversation?._id]);

  useEffect(() => {
    setLoading(true);
    loadMessages();
  }, [loadMessages]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input
  useEffect(() => {
    inputRef.current?.focus();
  }, [conversation?._id]);

  // Send message
  const handleSend = async (e) => {
    e?.preventDefault();
    if (!inputValue.trim() || sending) return;

    setSending(true);
    try {
      const newMsg = await sendMessage(conversation._id, inputValue.trim());
      setMessages((prev) => [...prev, newMsg]);
      setInputValue('');
      onMessageSent?.();
    } catch (err) {
      toast.error(err.message || 'Failed to send message');
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  // Delete message
  const handleDelete = async (messageId) => {
    if (!window.confirm('Delete this message?')) return;
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

  return (
    <div className="flex h-full flex-col bg-white">
      {/* Chat header */}
      <div className="flex items-center gap-3 border-b border-gray-100 px-4 py-3">
        {/* Back button (mobile) */}
        <button
          type="button"
          onClick={onBack}
          className="flex h-8 w-8 items-center justify-center rounded-full transition hover:bg-gray-100 lg:hidden"
          aria-label="Back to conversations"
        >
          <FiArrowLeft className="h-4 w-4 text-secondary" />
        </button>

        {/* User info */}
        {otherUser?.avatar ? (
          <img
            src={otherUser.avatar}
            alt={otherUser.name}
            className="h-10 w-10 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <FiUser className="h-5 w-5 text-primary" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-secondary">{otherUser?.name || 'User'}</p>
          <p className="text-xs text-muted capitalize">{otherUser?.role || ''}</p>
        </div>

        {/* Property card */}
        {property && (
          <Link
            to={`/properties/${property._id}`}
            className="hidden items-center gap-2 rounded-xl border border-gray-100 bg-gray-50/60 px-3 py-2 transition hover:bg-gray-50 sm:flex"
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
      <div className="flex-1 overflow-y-auto px-4 py-4">
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
          <div className="space-y-3">
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
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input area */}
      <form
        onSubmit={handleSend}
        className="border-t border-gray-100 px-4 py-3"
      >
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            rows={1}
            placeholder="Type a message…"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            maxLength={2000}
            className="flex-1 resize-none rounded-xl border border-gray-200 bg-gray-50/60 px-4 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            style={{ maxHeight: '120px' }}
            id="message-input"
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || sending}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-white shadow-sm transition hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed"
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

// Fallback icon (used in the "no conversation selected" state)
const FiMessageSquareIcon = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

export default ChatWindow;
