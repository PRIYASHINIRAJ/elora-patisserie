import { Router } from 'express';
import { listCakes, getCakeBySlug, listCategories } from '../controllers/cakeController.js';

const router = Router();

router.get('/', listCakes);
router.get('/categories/all', listCategories);
router.get('/:slug', getCakeBySlug);

export default router;
