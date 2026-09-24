import { Router } from 'express';
import { requireAdmin } from '../middleware/auth.js';
import { uploadPortfolioMedia } from '../middleware/upload.js';
import {
  listAdminPortfolio,
  getAdminPortfolioItem,
  createPortfolioItem,
  updatePortfolioItem,
  deletePortfolioItem,
  deletePortfolioImage,
} from '../controllers/adminPortfolioController.js';

const router = Router();

const mediaFields = uploadPortfolioMedia.fields([
  { name: 'images', maxCount: 12 },
  { name: 'videos', maxCount: 4 },
]);

router.use(requireAdmin);

router.get('/', listAdminPortfolio);
router.get('/:id', getAdminPortfolioItem);
router.post('/', mediaFields, createPortfolioItem);
router.patch('/:id', mediaFields, updatePortfolioItem);
router.delete('/:id', deletePortfolioItem);
router.delete('/:id/images/:imageId', deletePortfolioImage);

export default router;
