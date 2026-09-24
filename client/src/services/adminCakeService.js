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

export const adminCakeService = {
  list: (params) => api.get('/admin/cakes', { params }).then((r) => r.data),
  get: (id) => api.get(`/admin/cakes/${id}`).then((r) => r.data),
  create: (fields, files) =>
    api
      .post('/admin/cakes', toFormData(fields, files), { headers: { 'Content-Type': 'multipart/form-data' } })
      .then((r) => r.data),
  update: (id, fields, files) =>
    api
      .patch(`/admin/cakes/${id}`, toFormData(fields, files), { headers: { 'Content-Type': 'multipart/form-data' } })
      .then((r) => r.data),
  setStatus: (id, status) => api.patch(`/admin/cakes/${id}/status`, { status }).then((r) => r.data),
  remove: (id) => api.delete(`/admin/cakes/${id}`).then((r) => r.data),
  removeImage: (id, imageId) => api.delete(`/admin/cakes/${id}/images/${imageId}`).then((r) => r.data),
  removeVideo: (id, videoId) => api.delete(`/admin/cakes/${id}/videos/${videoId}`).then((r) => r.data),
  setPrimaryImage: (id, imageId) => api.patch(`/admin/cakes/${id}/images/${imageId}/primary`).then((r) => r.data),
};
