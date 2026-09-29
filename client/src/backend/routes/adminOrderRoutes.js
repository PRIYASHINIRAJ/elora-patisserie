import { Router } from 'express';
import { requireAdmin } from '../middleware/auth.js';
import { adminListOrders, adminGetOrder, adminUpdateStatus, adminUpdateNotes } from '../controllers/orderController.js';
import { adminContactCustomerForOrder } from '../controllers/messagingController.js';

const router = Router();

router.use(requireAdmin);
router.get('/', adminListOrders);
router.get('/:id', adminGetOrder);
router.patch('/:id/status', adminUpdateStatus);
router.patch('/:id/notes', adminUpdateNotes);
router.post('/:id/message', adminContactCustomerForOrder);

export default router;
