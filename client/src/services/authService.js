import api, { setAuthToken } from './api';

const keepToken = (data) => {
  setAuthToken('customer', data.token);
  return data;
};

export const authService = {
  register: (data) => api.post('/auth/register', data).then((r) => keepToken(r.data)),
  login: (data) => api.post('/auth/login', data).then((r) => keepToken(r.data)),
  logout: () => api.post('/auth/logout').finally(() => setAuthToken('customer', null)).then((r) => r.data),
  me: () =>
    api.get('/auth/me').then(
      (r) => r.data,
      (err) => {
        // Drop a stored token the server no longer accepts (expired/invalid).
        if (err.response?.status === 401) setAuthToken('customer', null);
        throw err;
      }
    ),
  updateProfile: (data) => api.patch('/auth/profile', data).then((r) => r.data),
};
