import { Router } from 'express';
import { requireAdmin } from '../middleware/auth.js';
import { uploadGeneralMedia } from '../middleware/upload.js';
import { listMedia, uploadMedia, deleteMedia, attachMedia } from '../controllers/mediaController.js';

const router = Router();

router.use(requireAdmin);

router.get('/', listMedia);
router.post('/', uploadGeneralMedia.array('files', 20), uploadMedia);
router.delete('/:id', deleteMedia);
router.post('/:id/attach', attachMedia);

export default router;
