import api from './api';

export const favouriteService = {
  mine: () => api.get('/favourites/mine').then((r) => r.data),
  add: (cakeId) => api.post('/favourites', { cakeId }).then((r) => r.data),
  remove: (cakeId) => api.delete(`/favourites/${cakeId}`).then((r) => r.data),
};

export const addressService = {
  mine: () => api.get('/addresses/mine').then((r) => r.data),
  create: (data) => api.post('/addresses', data).then((r) => r.data),
  update: (id, data) => api.patch(`/addresses/${id}`, data).then((r) => r.data),
  remove: (id) => api.delete(`/addresses/${id}`).then((r) => r.data),
};
