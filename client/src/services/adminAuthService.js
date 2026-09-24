import api, { setAuthToken } from './api';

export const adminAuthService = {
  login: (data) =>
    api.post('/admin/auth/login', data).then((r) => {
      setAuthToken('admin', r.data.token);
      return r.data;
    }),
  logout: () => api.post('/admin/auth/logout').finally(() => setAuthToken('admin', null)).then((r) => r.data),
  me: () =>
    api.get('/admin/auth/me').then(
      (r) => r.data,
      (err) => {
        // Drop a stored token the server no longer accepts (expired/invalid).
        if (err.response?.status === 401) setAuthToken('admin', null);
        throw err;
      }
    ),
};
