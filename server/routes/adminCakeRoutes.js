import { Router } from 'express';
import { requireAdmin } from '../middleware/auth.js';
import { uploadCakeMedia } from '../middleware/upload.js';
import {
  listAdminCakes,
  getAdminCake,
  createCake,
  updateCake,
  setCakeStatus,
  deleteCake,
  deleteCakeImage,
  deleteCakeVideo,
  setPrimaryImage,
} from '../controllers/adminCakeController.js';

const router = Router();

const mediaFields = uploadCakeMedia.fields([
  { name: 'mainImage', maxCount: 1 },
  { name: 'galleryImages', maxCount: 12 },
  { name: 'videos', maxCount: 4 },
]);

router.use(requireAdmin);

router.get('/', listAdminCakes);
router.get('/:id', getAdminCake);
router.post('/', mediaFields, createCake);
router.patch('/:id', mediaFields, updateCake);
router.patch('/:id/status', setCakeStatus);
router.delete('/:id', deleteCake);
router.delete('/:id/images/:imageId', deleteCakeImage);
router.delete('/:id/videos/:videoId', deleteCakeVideo);
router.patch('/:id/images/:imageId/primary', setPrimaryImage);

export default router;
