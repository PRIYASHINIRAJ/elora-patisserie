import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsRoot = process.env.UPLOADS_DIR || path.join(__dirname, '..', 'uploads');

const folders = {
  cakes: path.join(uploadsRoot, 'cakes'),
  portfolio: path.join(uploadsRoot, 'portfolio'),
  media: path.join(uploadsRoot, 'media'),
  avatars: path.join(uploadsRoot, 'avatars'),
  customRequests: path.join(uploadsRoot, 'custom-requests'),
  messages: path.join(uploadsRoot, 'messages'),
  studioVideos: path.join(uploadsRoot, 'studio-videos'),
};

Object.values(folders).forEach((dir) => fs.mkdirSync(dir, { recursive: true }));

function storageFor(subfolder) {
  return multer.diskStorage({
    destination: (req, file, cb) => cb(null, folders[subfolder]),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      const safeName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
      cb(null, safeName);
    },
  });
}

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'];
const VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];

function fileFilter(req, file, cb) {
  if ([...IMAGE_TYPES, ...VIDEO_TYPES].includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Unsupported file type. Please upload an image or video.'));
  }
}

export const uploadCakeMedia = multer({
  storage: storageFor('cakes'),
  fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB (covers short videos)
});

export const uploadPortfolioMedia = multer({
  storage: storageFor('portfolio'),
  fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 },
});

export const uploadGeneralMedia = multer({
  storage: storageFor('media'),
  fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 },
});

export const uploadCustomRequestMedia = multer({
  storage: storageFor('customRequests'),
  fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 },
});

export const uploadMessageMedia = multer({
  storage: storageFor('messages'),
  fileFilter,
  limits: { fileSize: 20 * 1024 * 1024 },
});

export const uploadStudioVideo = multer({
  storage: storageFor('studioVideos'),
  fileFilter,
  limits: { fileSize: 80 * 1024 * 1024 }, // short vertical videos can run larger
});

export function publicUrlFor(subfolder, filename) {
  return `/uploads/${subfolder}/${filename}`;
}

export function fileType(mimetype) {
  return VIDEO_TYPES.includes(mimetype) ? 'video' : 'image';
}
