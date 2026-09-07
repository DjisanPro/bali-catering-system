/**
 * Payments API - CRUD operations.
 */
import { get, post, put, del } from './client.js';

function getAll(params = {}) {
  const query = new URLSearchParams(params).toString();
  return get(`/api/payments${query ? '?' + query : ''}`);
}

function getById(id) {
  return get(`/api/payments/${id}`);
}

function create(data) {
  return post('/api/payments', data);
}

function update(id, data) {
  return put(`/api/payments/${id}`, data);
}

function remove(id) {
  return del(`/api/payments/${id}`);
}

function getByOrder(orderId) {
  return get(`/api/payments/order/${orderId}`);
}

export {  getAll, getById, create, update, remove, getByOrder  };
