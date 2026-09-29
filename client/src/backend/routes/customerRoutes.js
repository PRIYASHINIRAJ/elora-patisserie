import { Router } from 'express';
import { requireAdmin } from '../middleware/auth.js';
import { listCustomers, getCustomer, updateCustomerStatus } from '../controllers/customerController.js';

const router = Router();

router.use(requireAdmin);
router.get('/', listCustomers);
router.get('/:id', getCustomer);
router.patch('/:id/status', updateCustomerStatus);

export default router;
