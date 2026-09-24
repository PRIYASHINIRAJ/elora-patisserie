import api from './api';

export const adminAuthService = {
  login: (data) => api.post('/admin/auth/login', data).then((r) => r.data),
  logout: () => api.post('/admin/auth/logout').then((r) => r.data),
  me: () => api.get('/admin/auth/me').then((r) => r.data),
};
