import api from './api';

export const portfolioService = {
  list: (params) => api.get('/portfolio', { params }).then((r) => r.data),
  get: (id) => api.get(`/portfolio/${id}`).then((r) => r.data),
};
