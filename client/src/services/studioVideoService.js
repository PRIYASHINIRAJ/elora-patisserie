import api from './api';

export const studioVideoService = {
  public: () => api.get('/studio-videos').then((r) => r.data),

  adminList: () => api.get('/studio-videos/admin').then((r) => r.data),
  adminCreate: (file, { caption, tiktokUrl }) => {
    const fd = new FormData();
    fd.append('video', file);
    if (caption) fd.append('caption', caption);
    if (tiktokUrl) fd.append('tiktokUrl', tiktokUrl);
    return api.post('/studio-videos/admin', fd, { headers: { 'Content-Type': 'multipart/form-data' } }).then((r) => r.data);
  },
  adminUpdate: (id, updates) => api.patch(`/studio-videos/admin/${id}`, updates).then((r) => r.data),
  adminDelete: (id) => api.delete(`/studio-videos/admin/${id}`).then((r) => r.data),
};
