import multer from 'multer';
import path from 'path';
import os from 'os';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { del } from '@vercel/blob';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Vercel's filesystem is read-only apart from the temp dir.
export const uploadsRoot =
  process.env.UPLOADS_DIR ||
  (process.env.VERCEL ? path.join(os.tmpdir(), 'uploads') : path.join(__dirname, '..', 'uploads'));

const folders = {
  cakes: path.join(uploadsRoot, 'cakes'),
  portfolio: path.join(uploadsRoot, 'portfolio'),
  media: path.join(uploadsRoot, 'media'),
  avatars: path.join(uploadsRoot, 'avatars'),
  'custom-requests': path.join(uploadsRoot, 'custom-requests'),
  messages: path.join(uploadsRoot, 'messages'),
  'studio-videos': path.join(uploadsRoot, 'studio-videos'),
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

export const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'];
export const VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];
export const MAX_UPLOAD_BYTES = 80 * 1024 * 1024;

function fileFilter(req, file, cb) {
  if ([...IMAGE_TYPES, ...VIDEO_TYPES].includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Unsupported file type. Please upload an image or video.'));
  }
}

function isBlobUrl(url) {
  try {
    const { protocol, hostname } = new URL(url);
    return protocol === 'https:' && hostname.endsWith('.public.blob.vercel-storage.com');
  } catch {
    return false;
  }
}

// In production the browser uploads files straight to Vercel Blob (serverless
// requests are capped at 4.5 MB) and sends a JSON descriptor in place of each
// file: {"url","contentType","name","size"}. Turn those back into file objects.
function filesFromBody(req, field, maxBytes) {
  const raw = req.body?.[field];
  if (raw === undefined) return [];
  delete req.body[field];
  const values = Array.isArray(raw) ? raw : [raw];
  return values.map((value) => {
    let info;
    try {
      info = JSON.parse(value);
    } catch {
      throw Object.assign(new Error('Invalid upload.'), { status: 400, publicMessage: 'Invalid upload.' });
    }
    if (!isBlobUrl(info.url) || ![...IMAGE_TYPES, ...VIDEO_TYPES].includes(info.contentType)) {
      throw Object.assign(new Error('Unsupported file type. Please upload an image or video.'), { status: 400 });
    }
    if (Number(info.size) > maxBytes) {
      throw Object.assign(new Error('File too large.'), { status: 400, publicMessage: 'That file is too large. Please upload a smaller image or video.' });
    }
    return {
      fieldname: field,
      url: info.url,
      mimetype: info.contentType,
      originalname: info.name || path.basename(new URL(info.url).pathname),
      size: Number(info.size) || 0,
    };
  });
}

// Same interface as a multer instance (.single/.array/.fields), but every
// resulting file has a public `url`, whether it came from disk or Blob.
function uploader(subfolder, maxBytes) {
  const m = multer({ storage: storageFor(subfolder), fileFilter, limits: { fileSize: maxBytes } });
  const withUrl = (f) => ({ ...f, url: `/uploads/${subfolder}/${f.filename}` });
  const then = (collect) => (req, res, next) => {
    try {
      collect(req);
      next();
    } catch (err) {
      next(err);
    }
  };

  return {
    single: (field) => [
      m.single(field),
      then((req) => {
        req.file = req.file ? withUrl(req.file) : filesFromBody(req, field, maxBytes)[0];
      }),
    ],
    array: (field, maxCount) => [
      m.array(field, maxCount),
      then((req) => {
        const all = [...(req.files || []).map(withUrl), ...filesFromBody(req, field, maxBytes)];
        req.files = all.slice(0, maxCount);
      }),
    ],
    fields: (specs) => [
      m.fields(specs),
      then((req) => {
        const files = {};
        for (const { name, maxCount } of specs) {
          const all = [...(req.files?.[name] || []).map(withUrl), ...filesFromBody(req, name, maxBytes)];
          if (all.length) files[name] = maxCount ? all.slice(0, maxCount) : all;
        }
        req.files = files;
      }),
    ],
  };
}

export const uploadCakeMedia = uploader('cakes', 50 * 1024 * 1024); // 50MB (covers short videos)
export const uploadPortfolioMedia = uploader('portfolio', 50 * 1024 * 1024);
export const uploadGeneralMedia = uploader('media', 50 * 1024 * 1024);
export const uploadCustomRequestMedia = uploader('custom-requests', 50 * 1024 * 1024);
export const uploadMessageMedia = uploader('messages', 20 * 1024 * 1024);
export const uploadStudioVideo = uploader('studio-videos', MAX_UPLOAD_BYTES); // short vertical videos can run larger

// Deletes a stored upload (local file or Vercel Blob). Never throws.
export async function removeStoredFile(url) {
  if (!url) return;
  try {
    if (url.startsWith('/uploads/')) {
      await fs.promises.unlink(path.join(uploadsRoot, url.replace('/uploads/', '')));
    } else if (isBlobUrl(url) && process.env.BLOB_READ_WRITE_TOKEN) {
      await del(url);
    }
  } catch {
    // already gone, or not ours — nothing to do
  }
}

export function fileType(mimetype) {
  return VIDEO_TYPES.includes(mimetype) ? 'video' : 'image';
}
