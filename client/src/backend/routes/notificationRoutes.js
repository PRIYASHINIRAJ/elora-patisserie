import { Router } from 'express';
import { requireCustomer, requireAdmin } from '../middleware/auth.js';
import {
  listMyNotifications,
  markMyNotificationsRead,
  listAdminNotifications,
  markAdminNotificationsRead,
} from '../controllers/notificationController.js';

const router = Router();

router.get('/mine', requireCustomer, listMyNotifications);
router.post('/mine/read', requireCustomer, markMyNotificationsRead);
router.get('/admin', requireAdmin, listAdminNotifications);
router.post('/admin/read', requireAdmin, markAdminNotificationsRead);

export default router;
