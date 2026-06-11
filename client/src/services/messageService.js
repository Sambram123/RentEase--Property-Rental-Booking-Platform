import api from './api';

// ─── Create or get conversation ───────────────────────────────────────────────
export const createConversation = async (propertyId, receiverId) => {
  const { data } = await api.post('/messages/conversation', { propertyId, receiverId });
  return data.data;
};

// ─── Fetch conversations ──────────────────────────────────────────────────────
export const fetchConversations = async (search = '', archived = false) => {
  const params = { archived: archived ? 'true' : 'false' };
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

// ─── Delete conversation ──────────────────────────────────────────────────────
export const deleteConversationApi = async (conversationId) => {
  const { data } = await api.delete(`/messages/conversation/${conversationId}`);
  return data;
};

// ─── Archive/Unarchive conversation ───────────────────────────────────────────
export const archiveConversationApi = async (conversationId, archive = true) => {
  const { data } = await api.put(`/messages/conversation/${conversationId}/archive`, { archive });
  return data;
};

// ─── Fetch user presence and last seen ────────────────────────────────────────
export const fetchUserPresence = async (userId) => {
  const { data } = await api.get(`/messages/presence/${userId}`);
  return data.data; // { userId, name, avatar, role, isOnline, lastSeen }
};
