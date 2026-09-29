import { Router } from 'express';
import { requireCustomer } from '../middleware/auth.js';
import { listMyAddresses, createAddress, updateAddress, deleteAddress } from '../controllers/addressController.js';

const router = Router();

router.use(requireCustomer);
router.get('/mine', listMyAddresses);
router.post('/', createAddress);
router.patch('/:id', updateAddress);
router.delete('/:id', deleteAddress);

export default router;
