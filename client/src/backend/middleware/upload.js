// Browser version of the upload middleware: files arrive as File objects from
// the page's FormData, are stored in IndexedDB, and get a `local-file:` url.
import { saveFile, removeFile } from '../storage.js';

export const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'];
export const VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];

function httpError(message) {
  return Object.assign(new Error(message), { status: 400, publicMessage: message });
}

async function store(file, maxBytes) {
  if (![...IMAGE_TYPES, ...VIDEO_TYPES].includes(file.type)) {
    throw httpError('Unsupported file type. Please upload an image or video.');
  }
  if (file.size > maxBytes) {
    throw httpError('That file is too large. Please upload a smaller image or video.');
  }
  return { fieldname: '', url: await saveFile(file), mimetype: file.type, originalname: file.name, size: file.size };
}

function uploader(maxBytes) {
  const take = (req, field) => {
    const files = req.rawFiles?.[field] || [];
    delete req.rawFiles?.[field];
    return files;
  };
  return {
    single: (field) => async (req, res, next) => {
      const [file] = take(req, field);
      req.file = file ? await store(file, maxBytes) : undefined;
      next();
    },
    array: (field, maxCount) => async (req, res, next) => {
      const files = take(req, field).slice(0, maxCount);
      req.files = [];
      for (const f of files) req.files.push(await store(f, maxBytes));
      next();
    },
    fields: (specs) => async (req, res, next) => {
      req.files = {};
      for (const { name, maxCount } of specs) {
        const files = take(req, name).slice(0, maxCount || Infinity);
        if (!files.length) continue;
        req.files[name] = [];
        for (const f of files) req.files[name].push(await store(f, maxBytes));
      }
      next();
    },
  };
}

const MB = 1024 * 1024;
export const uploadCakeMedia = uploader(50 * MB);
export const uploadPortfolioMedia = uploader(50 * MB);
export const uploadGeneralMedia = uploader(50 * MB);
export const uploadCustomRequestMedia = uploader(50 * MB);
export const uploadMessageMedia = uploader(20 * MB);
export const uploadStudioVideo = uploader(80 * MB);

export async function removeStoredFile(url) {
  try {
    await removeFile(url);
  } catch {
    // already gone
  }
}

export function fileType(mimetype) {
  return VIDEO_TYPES.includes(mimetype) ? 'video' : 'image';
}
