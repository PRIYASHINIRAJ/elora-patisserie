import { Router } from 'express';
import { requireCustomer } from '../middleware/auth.js';
import {
  createOrder,
  createCheckoutSession,
  getMyOrder,
  listMyOrders,
} from '../controllers/orderController.js';
const router = Router();

router.post('/', requireCustomer, createOrder);
router.get('/mine', requireCustomer, listMyOrders);
router.get('/:id', requireCustomer, getMyOrder);
router.post('/:id/checkout-session', requireCustomer, createCheckoutSession);

export default router;
