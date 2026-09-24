import { Router } from 'express';
import { requireCustomer } from '../middleware/auth.js';
import { listMyFavourites, addFavourite, removeFavourite } from '../controllers/favouriteController.js';

const router = Router();

router.use(requireCustomer);
router.get('/mine', listMyFavourites);
router.post('/', addFavourite);
router.delete('/:cakeId', removeFavourite);

export default router;
