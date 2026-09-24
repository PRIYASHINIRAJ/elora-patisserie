import api from './api';

export const customRequestService = {
  create: (fields, imageFiles) => {
    const fd = new FormData();
    Object.entries(fields).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') fd.append(key, value);
    });
    (imageFiles || []).forEach((f) => fd.append('images', f));
    return api.post('/custom-requests', fd, { headers: { 'Content-Type': 'multipart/form-data' } }).then((r) => r.data);
  },
  get: (id) => api.get(`/custom-requests/${id}`).then((r) => r.data),
  mine: () => api.get('/custom-requests/mine').then((r) => r.data),
  respond: (id, action, message) => api.post(`/custom-requests/${id}/respond`, { action, message }).then((r) => r.data),

  // admin
  adminList: () => api.get('/custom-requests').then((r) => r.data),
  adminSendQuote: (id, data) => api.post(`/custom-requests/${id}/quote`, data).then((r) => r.data),
  adminSendMessage: (id, message) => api.post(`/custom-requests/${id}/message`, { message }).then((r) => r.data),
  adminConvert: (id) => api.post(`/custom-requests/${id}/convert`).then((r) => r.data),
};
