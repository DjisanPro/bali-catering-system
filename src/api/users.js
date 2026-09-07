/**
 * Users API - user management (admin CRUD).
 */
import { get, post, put, del } from './client.js';

function getAll() {
  return get('/api/users');
}

function getById(id) {
  return get(`/api/users/${id}`);
}

function create(data) {
  return post('/api/users', data);
}

function update(id, data) {
  return put(`/api/users/${id}`, data);
}

function remove(id) {
  return del(`/api/users/${id}`);
}

function updatePassword(id, data) {
  return put(`/api/users/${id}/password`, data);
}

export {  getAll, getById, create, update, remove, updatePassword  };
