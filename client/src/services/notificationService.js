import api from './api';

export const notificationService = {
  mine: () => api.get('/notifications/mine').then((r) => r.data),
  markMineRead: () => api.post('/notifications/mine/read').then((r) => r.data),
  admin: () => api.get('/notifications/admin').then((r) => r.data),
  markAdminRead: () => api.post('/notifications/admin/read').then((r) => r.data),
};
