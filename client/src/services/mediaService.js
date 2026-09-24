import api from './api';

export const mediaService = {
  list: (type) => api.get('/admin/media', { params: type ? { type } : {} }).then((r) => r.data),
  upload: (files) => {
    const fd = new FormData();
    Array.from(files).forEach((f) => fd.append('files', f));
    return api.post('/admin/media', fd, { headers: { 'Content-Type': 'multipart/form-data' } }).then((r) => r.data);
  },
  remove: (id) => api.delete(`/admin/media/${id}`).then((r) => r.data),
  attach: (id, attachedToType, attachedToId) =>
    api.post(`/admin/media/${id}/attach`, { attachedToType, attachedToId }).then((r) => r.data),
};
