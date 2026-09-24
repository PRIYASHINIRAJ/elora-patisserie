import api from './api';

function toFormData(fields, files) {
  const fd = new FormData();
  Object.entries(fields).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    if (Array.isArray(value) || typeof value === 'object') {
      fd.append(key, JSON.stringify(value));
    } else {
      fd.append(key, value);
    }
  });
  if (files) {
    Object.entries(files).forEach(([key, fileList]) => {
      if (!fileList) return;
      const arr = Array.isArray(fileList) ? fileList : [fileList];
      arr.forEach((file) => fd.append(key, file));
    });
  }
  return fd;
}

export const adminPortfolioService = {
  list: () => api.get('/admin/portfolio').then((r) => r.data),
  get: (id) => api.get(`/admin/portfolio/${id}`).then((r) => r.data),
  create: (fields, files) =>
    api
      .post('/admin/portfolio', toFormData(fields, files), { headers: { 'Content-Type': 'multipart/form-data' } })
      .then((r) => r.data),
  update: (id, fields, files) =>
    api
      .patch(`/admin/portfolio/${id}`, toFormData(fields, files), { headers: { 'Content-Type': 'multipart/form-data' } })
      .then((r) => r.data),
  remove: (id) => api.delete(`/admin/portfolio/${id}`).then((r) => r.data),
  removeImage: (id, imageId) => api.delete(`/admin/portfolio/${id}/images/${imageId}`).then((r) => r.data),
};
