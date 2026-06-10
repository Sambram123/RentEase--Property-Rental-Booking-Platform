import api from './api';

// ─── Create or get conversation ───────────────────────────────────────────────
export const createConversation = async (propertyId, receiverId) => {
  const { data } = await api.post('/messages/conversation', { propertyId, receiverId });
  return data.data;
};

// ─── Fetch conversations ──────────────────────────────────────────────────────
export const fetchConversations = async (search = '') => {
  const params = {};
  if (search) params.search = search;
  const { data } = await api.get('/messages/conversations', { params });
  return data.data; // { conversations, totalUnread }
};

// ─── Fetch messages for a conversation ────────────────────────────────────────
export const fetchMessages = async (conversationId, { page = 1, limit = 50, search } = {}) => {
  const params = { page, limit };
  if (search) params.search = search;
  const { data } = await api.get(`/messages/conversation/${conversationId}`, { params });
  return data.data; // { conversation, messages, pagination }
};

// ─── Send message ─────────────────────────────────────────────────────────────
export const sendMessage = async (conversationId, message) => {
  const { data } = await api.post('/messages/send', { conversationId, message });
  return data.data;
};

// ─── Mark messages as read ────────────────────────────────────────────────────
export const markMessagesRead = async (conversationId) => {
  const { data } = await api.put(`/messages/read/${conversationId}`);
  return data;
};

// ─── Delete message ───────────────────────────────────────────────────────────
export const deleteMessage = async (messageId) => {
  const { data } = await api.delete(`/messages/${messageId}`);
  return data;
};

// ─── Get unread count ─────────────────────────────────────────────────────────
export const fetchMessageUnreadCount = async () => {
  const { data } = await api.get('/messages/unread-count');
  return data.data.count;
};
