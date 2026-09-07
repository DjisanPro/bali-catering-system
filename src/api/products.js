/**
 * Products API - CRUD operations.
 */
import { get, post, put, patch, del } from './client.js';

function getAll() {
  return get('/api/products');
}

function getById(id) {
  return get(`/api/products/${id}`);
}

function create(data) {
  return post('/api/products', data);
}

function update(id, data) {
  return put(`/api/products/${id}`, data);
}

function patchUpdate(id, data) {
  return patch(`/api/products/${id}`, data);
}

function remove(id) {
  return del(`/api/products/${id}`);
}

export {  getAll, getById, create, update, patchUpdate, remove  };
