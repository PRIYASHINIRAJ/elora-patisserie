import { Router } from 'express';
import { register, login, logout, me, updateProfile } from '../controllers/authController.js';
import { requireCustomer } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimit.js';

const router = Router();

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.post('/logout', logout);
router.get('/me', requireCustomer, me);
router.patch('/profile', requireCustomer, updateProfile);

export default router;
