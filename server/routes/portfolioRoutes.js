import { Router } from 'express';
import { listPortfolio, getPortfolioItem } from '../controllers/portfolioController.js';

const router = Router();

router.get('/', listPortfolio);
router.get('/:id', getPortfolioItem);

export default router;
