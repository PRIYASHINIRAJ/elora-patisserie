import api from './api';

export const cakeService = {
  list: (params) => api.get('/cakes', { params }).then((r) => r.data),
  getBySlug: (slug) => api.get(`/cakes/${slug}`).then((r) => r.data),
  categories: () => api.get('/cakes/categories/all').then((r) => r.data),
};

export const dashboardService = {
  stats: () => api.get('/admin/dashboard/stats').then((r) => r.data),
};
