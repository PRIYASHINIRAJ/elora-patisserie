import api from './api';

export const settingsService = {
  public: () => api.get('/settings').then((r) => r.data),
  admin: () => api.get('/settings/admin').then((r) => r.data),
  update: (updates) => api.put('/settings/admin', updates).then((r) => r.data),
  uploadLogo: (file) => {
    const fd = new FormData();
    fd.append('logo', file);
    return api.post('/settings/admin/logo', fd, { headers: { 'Content-Type': 'multipart/form-data' } }).then((r) => r.data);
  },
  uploadBakerPhoto: (file) => {
    const fd = new FormData();
    fd.append('photo', file);
    return api.post('/settings/admin/baker-photo', fd, { headers: { 'Content-Type': 'multipart/form-data' } }).then((r) => r.data);
  },
};
