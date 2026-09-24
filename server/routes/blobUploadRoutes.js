import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { handleUpload } from '@vercel/blob/client';
import { IMAGE_TYPES, VIDEO_TYPES, MAX_UPLOAD_BYTES } from '../middleware/upload.js';

const router = Router();

// Issues short-lived tokens so the browser can upload a file straight to
// Vercel Blob. The resulting URL is then sent to the normal API endpoints,
// which still enforce their own auth and per-field size limits.
const tokenLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many uploads. Please wait a few minutes and try again.' },
});

// Lets the site know whether to upload straight to Blob or send files to the API.
router.get('/', (req, res) => {
  res.json({ enabled: Boolean(process.env.BLOB_READ_WRITE_TOKEN) });
});

router.post('/', tokenLimiter, async (req, res) => {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return res.status(503).json({ error: 'File storage is not configured.' });
  }
  try {
    const result = await handleUpload({
      body: req.body,
      request: req,
      onBeforeGenerateToken: async (pathname) => {
        if (!pathname.startsWith('elora/')) throw new Error('Invalid upload path.');
        return {
          allowedContentTypes: [...IMAGE_TYPES, ...VIDEO_TYPES],
          maximumSizeInBytes: MAX_UPLOAD_BYTES,
          addRandomSuffix: true,
        };
      },
    });
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
