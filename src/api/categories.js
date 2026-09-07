/**
 * Categories API - CRUD operations.
 */
import { get, post, put, del } from './client.js';

function getAll() {
  return get('/api/categories');
}

function getById(id) {
  return get(`/api/categories/${id}`);
}

function create(data) {
  return post('/api/categories', data);
}

function update(id, data) {
  return put(`/api/categories/${id}`, data);
}

function remove(id) {
  return del(`/api/categories/${id}`);
}

export {  getAll, getById, create, update, remove  };
