/**
 * Customers API - CRUD operations.
 */
import { get, post, put, del } from './client.js';

function getAll() {
  return get('/api/customers');
}

function getById(id) {
  return get(`/api/customers/${id}`);
}

function create(data) {
  return post('/api/customers', data);
}

function update(id, data) {
  return put(`/api/customers/${id}`, data);
}

function remove(id) {
  return del(`/api/customers/${id}`);
}

function search(query) {
  return get(`/api/customers/search?q=${encodeURIComponent(query)}`);
}

export {  getAll, getById, create, update, remove, search  };
