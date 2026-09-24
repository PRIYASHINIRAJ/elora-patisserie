import axios from 'axios';
import { upload } from '@vercel/blob/client';

// Production (Vercel): the site and API share a domain, so the API is at /api.
const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '/api' : 'http://localhost:4000/api');

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

// Vercel caps a request to the API at 4.5 MB, too small for cake videos. So in
// production each file is uploaded straight from the browser to Vercel Blob,
// and the API receives a small JSON descriptor (url/type/name/size) in its place.
const DIRECT_UPLOADS = import.meta.env.PROD && import.meta.env.VITE_DIRECT_UPLOADS !== 'false';

async function uploadFilesToBlob(formData) {
  const entries = [...formData.entries()];
  const resolved = await Promise.all(
    entries.map(async ([key, value]) => {
      if (!(value instanceof Blob)) return [key, value];
      const name = value.name || 'upload';
      const blob = await upload(`elora/${name}`, value, {
        access: 'public',
        handleUploadUrl: `${API_URL}/uploads/blob`,
        contentType: value.type || undefined,
      });
      const descriptor = { url: blob.url, contentType: blob.contentType || value.type, name, size: value.size };
      return [key, JSON.stringify(descriptor)];
    })
  );
  const next = new FormData();
  resolved.forEach(([key, value]) => next.append(key, value));
  return next;
}

// Only when the server has Blob storage configured (it isn't when running locally).
let blobEnabled;
function isBlobEnabled() {
  blobEnabled ??= axios
    .get(`${API_URL}/uploads/blob`)
    .then((r) => Boolean(r.data?.enabled))
    .catch(() => false);
  return blobEnabled;
}

if (DIRECT_UPLOADS) {
  api.interceptors.request.use(async (config) => {
    if (config.data instanceof FormData && (await isBlobEnabled())) {
      config.data = await uploadFilesToBlob(config.data);
    }
    return config;
  });
}

export default api;
