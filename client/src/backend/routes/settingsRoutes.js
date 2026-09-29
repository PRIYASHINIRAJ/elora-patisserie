import { Router } from 'express';
import { requireAdmin } from '../middleware/auth.js';
import { uploadGeneralMedia } from '../middleware/upload.js';
import { getPublicSettings, getAdminSettings, updateAdminSettings, uploadLogo, uploadBakerPhoto } from '../controllers/settingsController.js';

const router = Router();

router.get('/', getPublicSettings);
router.get('/admin', requireAdmin, getAdminSettings);
router.put('/admin', requireAdmin, updateAdminSettings);
router.post('/admin/logo', requireAdmin, uploadGeneralMedia.single('logo'), uploadLogo);
router.post('/admin/baker-photo', requireAdmin, uploadGeneralMedia.single('photo'), uploadBakerPhoto);

export default router;
