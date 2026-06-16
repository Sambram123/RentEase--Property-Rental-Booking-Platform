import { Router } from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { messageLimiter } from '../middleware/rateLimiter.js';
import {
  createConversation,
  getConversations,
  getConversationMessages,
  sendMessage,
  markMessagesRead,
  deleteMessage,
  getUnreadCount,
  deleteConversation,
  archiveConversation,
  getUserPresence,
} from '../controllers/messageController.js';

const router = Router();

// All routes require authentication
router.use(protect);

router.post('/conversation', messageLimiter, createConversation);
router.get('/conversations', getConversations);
router.get('/conversation/:id', getConversationMessages);
router.post('/send', messageLimiter, sendMessage);
router.put('/read/:conversationId', markMessagesRead);
router.get('/unread-count', getUnreadCount);
router.delete('/:messageId', deleteMessage);

// New chat platform routes
router.delete('/conversation/:conversationId', deleteConversation);
router.put('/conversation/:conversationId/archive', archiveConversation);
router.get('/presence/:userId', getUserPresence);

export default router;
