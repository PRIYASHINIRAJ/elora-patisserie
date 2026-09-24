import api from './api';

export const orderService = {
  create: (payload) => api.post('/orders', payload).then((r) => r.data),
  createCheckoutSession: (orderId) => api.post(`/orders/${orderId}/checkout-session`).then((r) => r.data),
  get: (orderId) => api.get(`/orders/${orderId}`).then((r) => r.data),
  mine: () => api.get('/orders/mine').then((r) => r.data),

  // admin
  adminList: (params) => api.get('/admin/orders', { params }).then((r) => r.data),
  adminGet: (orderId) => api.get(`/admin/orders/${orderId}`).then((r) => r.data),
  adminUpdateStatus: (orderId, status) => api.patch(`/admin/orders/${orderId}/status`, { status }).then((r) => r.data),
};
