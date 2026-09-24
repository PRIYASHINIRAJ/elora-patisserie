import api from './api';

function toFormData(fields, imageFile) {
  const fd = new FormData();
  Object.entries(fields).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') fd.append(key, value);
  });
  if (imageFile) fd.append('image', imageFile);
  return fd;
}

export const messagingService = {
  mine: () => api.get('/messages/mine').then((r) => r.data),
  start: (fields, imageFile) =>
    api.post('/messages/mine', toFormData(fields, imageFile), { headers: { 'Content-Type': 'multipart/form-data' } }).then((r) => r.data),
  getConversation: (id) => api.get(`/messages/mine/${id}`).then((r) => r.data),
  reply: (id, body, imageFile) =>
    api.post(`/messages/mine/${id}/reply`, toFormData({ body }, imageFile), { headers: { 'Content-Type': 'multipart/form-data' } }).then((r) => r.data),

  // admin
  adminList: (status) => api.get('/messages/admin', { params: status ? { status } : {} }).then((r) => r.data),
  adminGetConversation: (id) => api.get(`/messages/admin/${id}`).then((r) => r.data),
  adminReply: (id, body, imageFile) =>
    api.post(`/messages/admin/${id}/reply`, toFormData({ body }, imageFile), { headers: { 'Content-Type': 'multipart/form-data' } }).then((r) => r.data),
  adminSetStatus: (id, status) => api.patch(`/messages/admin/${id}/status`, { status }).then((r) => r.data),
};
