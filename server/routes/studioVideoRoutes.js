import { Router } from 'express';
import { requireAdmin } from '../middleware/auth.js';
import { uploadStudioVideo } from '../middleware/upload.js';
import {
  listPublicStudioVideos,
  listAdminStudioVideos,
  createStudioVideo,
  updateStudioVideo,
  deleteStudioVideo,
} from '../controllers/studioVideoController.js';

const router = Router();

router.get('/', listPublicStudioVideos);
router.get('/admin', requireAdmin, listAdminStudioVideos);
router.post('/admin', requireAdmin, uploadStudioVideo.single('video'), createStudioVideo);
router.patch('/admin/:id', requireAdmin, updateStudioVideo);
router.delete('/admin/:id', requireAdmin, deleteStudioVideo);

export default router;
