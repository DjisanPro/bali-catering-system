/**
 * Orders API - CRUD and status operations.
 */
import { get, post, put, patch, del } from './client.js';

function getAll(params = {}) {
  const query = new URLSearchParams(params).toString();
  return get(`/api/orders${query ? '?' + query : ''}`);
}

function getById(id) {
  return get(`/api/orders/${id}`);
}

function create(data) {
  return post('/api/orders', data);
}

function update(id, data) {
  return put(`/api/orders/${id}`, data);
}

function updateStatus(id, status) {
  return patch(`/api/orders/${id}/status`, { status });
}

function cancel(id, reason, authorizedBy) {
  return post(`/api/orders/${id}/cancel`, { reason, authorizedBy });
}

function correct(id, correctionData) {
  return post(`/api/orders/${id}/correct`, correctionData);
}

function remove(id) {
  return del(`/api/orders/${id}`);
}

export {  getAll, getById, create, update, updateStatus, cancel, correct, remove  };
