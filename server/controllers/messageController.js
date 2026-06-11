import asyncHandler from '../utils/asyncHandler.js';
import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import Property from '../models/Property.js';
import User from '../models/User.js';
import { emitToUser, isUserOnline } from '../socket/socketServer.js';

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/messages/conversation — Create or get existing conversation
// ─────────────────────────────────────────────────────────────────────────────
export const createConversation = asyncHandler(async (req, res) => {
  const { propertyId, receiverId } = req.body;
  const senderId = req.user._id.toString();

  if (!propertyId || !receiverId) {
    res.status(400);
    throw new Error('propertyId and receiverId are required');
  }

  // Prevent self-messaging
  if (senderId === receiverId) {
    res.status(400);
    throw new Error('You cannot message yourself');
  }

  // Verify property exists
  const property = await Property.findById(propertyId);
  if (!property) {
    res.status(404);
    throw new Error('Property not found');
  }

  // Check for existing conversation between these users for this property
  const existing = await Conversation.findOne({
    property: propertyId,
    participants: { $all: [senderId, receiverId] },
  })
    .populate('participants', 'name email avatar role lastSeen')
    .populate('property', 'title images price city');

  if (existing) {
    // If archived by either user, unarchive it
    if (existing.archivedBy && existing.archivedBy.length > 0) {
      existing.archivedBy = [];
      await existing.save();
    }

    return res.status(200).json({
      success: true,
      message: 'Conversation found',
      data: existing,
    });
  }

  // Create new conversation
  const conversation = await Conversation.create({
    participants: [senderId, receiverId],
    property: propertyId,
    unreadCounts: new Map([
      [senderId, 0],
      [receiverId, 0],
    ]),
    archivedBy: [],
  });

  const populated = await Conversation.findById(conversation._id)
    .populate('participants', 'name email avatar role lastSeen')
    .populate('property', 'title images price city');

  res.status(201).json({
    success: true,
    message: 'Conversation created',
    data: populated,
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/messages/conversations — List user's conversations
// ─────────────────────────────────────────────────────────────────────────────
export const getConversations = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { search, archived = 'false' } = req.query;

  const filter = { participants: userId };

  // Apply archive filtering
  if (archived === 'true') {
    filter.archivedBy = userId;
  } else {
    filter.archivedBy = { $ne: userId };
  }

  const conversations = await Conversation.find(filter)
    .populate('participants', 'name email avatar role lastSeen')
    .populate('property', 'title images price city')
    .sort({ lastMessageAt: -1 })
    .lean();

  // Apply search filter on populated data
  let filtered = conversations;
  if (search) {
    const q = search.toLowerCase();
    filtered = conversations.filter((c) => {
      const otherUser = c.participants.find(
        (p) => p._id.toString() !== userId.toString()
      );
      const matchUser = otherUser?.name?.toLowerCase().includes(q);
      const matchProperty = c.property?.title?.toLowerCase().includes(q);
      return matchUser || matchProperty;
    });
  }

  // Compute total unread
  const totalUnread = filtered.reduce((sum, c) => {
    const count = c.unreadCounts?.get?.(userId.toString()) ??
      c.unreadCounts?.[userId.toString()] ?? 0;
    return sum + count;
  }, 0);

  res.status(200).json({
    success: true,
    data: {
      conversations: filtered,
      totalUnread,
    },
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/messages/conversation/:id — Get messages for a conversation
// ─────────────────────────────────────────────────────────────────────────────
export const getConversationMessages = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { id } = req.params;
  const { page = 1, limit = 50, search } = req.query;

  // Verify user is a participant
  const conversation = await Conversation.findById(id)
    .populate('participants', 'name email avatar role lastSeen')
    .populate('property', 'title images price city');

  if (!conversation) {
    res.status(404);
    throw new Error('Conversation not found');
  }

  const isParticipant = conversation.participants.some(
    (p) => p._id.toString() === userId.toString()
  );
  if (!isParticipant) {
    res.status(403);
    throw new Error('You are not a participant of this conversation');
  }

  const filter = { conversation: id };
  if (search) {
    filter.$text = { $search: search };
  }

  const skip = (Number(page) - 1) * Number(limit);
  const total = await Message.countDocuments(filter);

  const messages = await Message.find(filter)
    .populate('sender', 'name email avatar')
    .populate('receiver', 'name email avatar')
    .sort({ createdAt: 1 })
    .skip(skip)
    .limit(Number(limit))
    .lean();

  res.status(200).json({
    success: true,
    data: {
      conversation,
      messages,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    },
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/messages/send — Send a message
// ─────────────────────────────────────────────────────────────────────────────
export const sendMessage = asyncHandler(async (req, res) => {
  const senderId = req.user._id;
  const { conversationId, message } = req.body;

  if (!conversationId || !message?.trim()) {
    res.status(400);
    throw new Error('conversationId and message are required');
  }

  // Verify conversation and participation
  const conversation = await Conversation.findById(conversationId);
  if (!conversation) {
    res.status(404);
    throw new Error('Conversation not found');
  }

  const isParticipant = conversation.participants.some(
    (p) => p.toString() === senderId.toString()
  );
  if (!isParticipant) {
    res.status(403);
    throw new Error('You are not a participant of this conversation');
  }

  // Determine receiver
  const receiverId = conversation.participants.find(
    (p) => p.toString() !== senderId.toString()
  );

  if (!receiverId) {
    res.status(400);
    throw new Error('Receiver not found in conversation participants');
  }

  const receiverOnline = isUserOnline(receiverId.toString());

  // Create message
  const newMessage = await Message.create({
    conversation: conversationId,
    sender: senderId,
    receiver: receiverId,
    message: message.trim(),
    status: receiverOnline ? 'delivered' : 'sent',
  });

  // Update conversation last message details, unread counts, and reset archives
  const receiverKey = receiverId.toString();
  const currentUnread = conversation.unreadCounts?.get?.(receiverKey) ??
    conversation.unreadCounts?.[receiverKey] ?? 0;

  conversation.lastMessage = message.trim().substring(0, 100);
  conversation.lastMessageAt = new Date();
  if (!conversation.unreadCounts) {
    conversation.unreadCounts = new Map();
  }
  conversation.unreadCounts.set(receiverKey, currentUnread + 1);
  conversation.archivedBy = []; // Unarchive for both upon new message

  await conversation.save();

  // Populate for response
  const populated = await Message.findById(newMessage._id)
    .populate('sender', 'name email avatar')
    .populate('receiver', 'name email avatar')
    .lean();

  // Real-time notifications via Socket.IO
  const io = req.app.get('io');
  if (io) {
    // Emit receive_message event to the conversation room
    io.to(`conversation_${conversationId}`).emit('receive_message', populated);

    // Notify receiver about conversation updates (for sidebar preview)
    emitToUser(io, receiverId.toString(), 'conversation_updated', {
      conversationId,
      message: populated,
      unreadCount: currentUnread + 1,
    });

    // Notify sender about conversation updates (for sidebar preview sync on other tabs)
    emitToUser(io, senderId.toString(), 'conversation_updated', {
      conversationId,
      message: populated,
      unreadCount: 0,
    });

    // Emit updated total unread count to receiver
    const receiverConversations = await Conversation.find({ participants: receiverId }).lean();
    const receiverTotalUnread = receiverConversations.reduce((sum, c) => {
      const count = c.unreadCounts?.get?.(receiverKey) ??
        c.unreadCounts?.[receiverKey] ?? 0;
      return sum + count;
    }, 0);
    emitToUser(io, receiverId.toString(), 'unread_count', { count: receiverTotalUnread });
  }

  res.status(201).json({
    success: true,
    message: 'Message sent',
    data: populated,
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/messages/read/:conversationId — Mark messages as read
// ─────────────────────────────────────────────────────────────────────────────
export const markMessagesRead = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { conversationId } = req.params;

  const conversation = await Conversation.findById(conversationId);
  if (!conversation) {
    res.status(404);
    throw new Error('Conversation not found');
  }

  const isParticipant = conversation.participants.some(
    (p) => p.toString() === userId.toString()
  );
  if (!isParticipant) {
    res.status(403);
    throw new Error('You are not a participant of this conversation');
  }

  // Mark all messages sent TO this user in this conversation as read
  await Message.updateMany(
    { conversation: conversationId, receiver: userId, isRead: false },
    { $set: { isRead: true, status: 'read' } }
  );

  // Reset unread count for this user
  const userKey = userId.toString();
  if (!conversation.unreadCounts) {
    conversation.unreadCounts = new Map();
  }
  conversation.unreadCounts.set(userKey, 0);
  await conversation.save();

  // Notify sender that messages were read
  const io = req.app.get('io');
  if (io) {
    io.to(`conversation_${conversationId}`).emit('messages_read', {
      conversationId,
      readBy: userId.toString(),
    });

    // Also emit global unread count update to user
    const userConversations = await Conversation.find({ participants: userId }).lean();
    const totalUnread = userConversations.reduce((sum, c) => {
      const count = c.unreadCounts?.get?.(userKey) ??
        c.unreadCounts?.[userKey] ?? 0;
      return sum + count;
    }, 0);
    emitToUser(io, userId.toString(), 'unread_count', { count: totalUnread });
  }

  res.status(200).json({
    success: true,
    message: 'Messages marked as read',
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/messages/:messageId — Delete a message
// ─────────────────────────────────────────────────────────────────────────────
export const deleteMessage = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { messageId } = req.params;

  const message = await Message.findById(messageId);
  if (!message) {
    // If not found, return 200/404 safely
    res.status(404);
    throw new Error('Message not found');
  }

  // Only the sender can delete their own message
  if (message.sender.toString() !== userId.toString()) {
    res.status(403);
    throw new Error('You can only delete your own messages');
  }

  const conversationId = message.conversation;
  await Message.findByIdAndDelete(messageId);

  // Update lastMessage on conversation if this was the last message
  const latestMessage = await Message.findOne({
    conversation: conversationId,
  })
    .sort({ createdAt: -1 })
    .lean();

  if (latestMessage) {
    await Conversation.findByIdAndUpdate(conversationId, {
      lastMessage: latestMessage.message.substring(0, 100),
      lastMessageAt: latestMessage.createdAt,
    });
  } else {
    await Conversation.findByIdAndUpdate(conversationId, {
      lastMessage: '',
      lastMessageAt: new Date(),
    });
  }

  // Notify receiver about message deletion in real-time
  const io = req.app.get('io');
  if (io) {
    io.to(`conversation_${conversationId}`).emit('message_deleted', {
      messageId,
      conversationId,
    });
  }

  res.status(200).json({
    success: true,
    message: 'Message deleted',
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/messages/unread-count — Get total unread message count
// ─────────────────────────────────────────────────────────────────────────────
export const getUnreadCount = asyncHandler(async (req, res) => {
  const userId = req.user._id.toString();

  const conversations = await Conversation.find({ participants: req.user._id }).lean();

  const totalUnread = conversations.reduce((sum, c) => {
    const count = c.unreadCounts?.get?.(userId) ??
      c.unreadCounts?.[userId] ?? 0;
    return sum + count;
  }, 0);

  res.status(200).json({
    success: true,
    data: { count: totalUnread },
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/messages/conversation/:conversationId — Delete conversation
// ─────────────────────────────────────────────────────────────────────────────
export const deleteConversation = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { conversationId } = req.params;

  const conversation = await Conversation.findById(conversationId);
  if (!conversation) {
    res.status(404);
    throw new Error('Conversation not found');
  }

  // Verify participation
  const isParticipant = conversation.participants.some(
    (p) => p.toString() === userId.toString()
  );
  if (!isParticipant) {
    res.status(403);
    throw new Error('You are not authorized to delete this conversation');
  }

  // Delete all messages in the conversation
  await Message.deleteMany({ conversation: conversationId });

  // Delete the conversation itself
  await Conversation.findByIdAndDelete(conversationId);

  // Notify other participant about deletion
  const io = req.app.get('io');
  if (io) {
    const otherUserId = conversation.participants.find(
      (p) => p.toString() !== userId.toString()
    );
    if (otherUserId) {
      emitToUser(io, otherUserId.toString(), 'conversation_deleted', {
        conversationId,
      });
    }
  }

  res.status(200).json({
    success: true,
    message: 'Conversation and all associated messages deleted successfully',
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/messages/conversation/:conversationId/archive — Archive conversation
// ─────────────────────────────────────────────────────────────────────────────
export const archiveConversation = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { conversationId } = req.params;
  const { archive = true } = req.body;

  const conversation = await Conversation.findById(conversationId);
  if (!conversation) {
    res.status(404);
    throw new Error('Conversation not found');
  }

  // Verify participation
  const isParticipant = conversation.participants.some(
    (p) => p.toString() === userId.toString()
  );
  if (!isParticipant) {
    res.status(403);
    throw new Error('You are not authorized to modify this conversation');
  }

  if (archive) {
    // Add to archivedBy list if not present
    if (!conversation.archivedBy.includes(userId)) {
      conversation.archivedBy.push(userId);
    }
  } else {
    // Remove from archivedBy list
    conversation.archivedBy = conversation.archivedBy.filter(
      (id) => id.toString() !== userId.toString()
    );
  }

  await conversation.save();

  res.status(200).json({
    success: true,
    message: archive ? 'Conversation archived successfully' : 'Conversation unarchived successfully',
    data: conversation,
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/messages/presence/:userId — Get target user online presence & last seen
// ─────────────────────────────────────────────────────────────────────────────
export const getUserPresence = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  const targetUser = await User.findById(userId).select('name avatar role lastSeen');
  if (!targetUser) {
    res.status(404);
    throw new Error('User not found');
  }

  const online = isUserOnline(userId);

  res.status(200).json({
    success: true,
    data: {
      userId: targetUser._id,
      name: targetUser.name,
      avatar: targetUser.avatar,
      role: targetUser.role,
      isOnline: online,
      lastSeen: targetUser.lastSeen,
    },
  });
});
