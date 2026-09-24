import { Router } from 'express';
import { requireCustomer, requireAdmin } from '../middleware/auth.js';
import { uploadMessageMedia } from '../middleware/upload.js';
import {
  listMyConversations,
  createConversation,
  getMyConversation,
  replyAsCustomer,
  listAllConversations,
  getConversationAdmin,
  replyAsAdmin,
  setConversationStatus,
} from '../controllers/messagingController.js';

const router = Router();

// Customer routes
router.get('/mine', requireCustomer, listMyConversations);
router.post('/mine', requireCustomer, uploadMessageMedia.single('image'), createConversation);
router.get('/mine/:id', requireCustomer, getMyConversation);
router.post('/mine/:id/reply', requireCustomer, uploadMessageMedia.single('image'), replyAsCustomer);

// Admin routes
router.get('/admin', requireAdmin, listAllConversations);
router.get('/admin/:id', requireAdmin, getConversationAdmin);
router.post('/admin/:id/reply', requireAdmin, uploadMessageMedia.single('image'), replyAsAdmin);
router.patch('/admin/:id/status', requireAdmin, setConversationStatus);

export default router;
