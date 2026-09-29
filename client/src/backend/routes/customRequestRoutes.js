import { Router } from 'express';
import {
  createCustomRequest,
  listCustomRequests,
  getCustomRequest,
  listMyCustomRequests,
  sendQuote,
  sendAdminMessage,
  respondToQuote,
  convertToOrder,
} from '../controllers/customRequestController.js';
import { optionalCustomer, requireAdmin, requireCustomer } from '../middleware/auth.js';
import { uploadCustomRequestMedia } from '../middleware/upload.js';

const router = Router();

router.post('/', optionalCustomer, uploadCustomRequestMedia.array('images', 8), createCustomRequest);
router.get('/mine', requireCustomer, listMyCustomRequests);
router.get('/', requireAdmin, listCustomRequests);
router.get('/:id', optionalCustomer, getCustomRequest);
router.post('/:id/quote', requireAdmin, sendQuote);
router.post('/:id/message', requireAdmin, sendAdminMessage);
router.post('/:id/respond', optionalCustomer, respondToQuote);
router.post('/:id/convert', requireAdmin, convertToOrder);

export default router;
