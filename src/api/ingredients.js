/**
 * Ingredients API - CRUD operations and stock movements.
 */
import { get, post, put, del } from './client.js';

function getAll() {
  return get('/api/ingredients');
}

function getById(id) {
  return get(`/api/ingredients/${id}`);
}

function create(data) {
  return post('/api/ingredients', data);
}

function update(id, data) {
  return put(`/api/ingredients/${id}`, data);
}

function remove(id) {
  return del(`/api/ingredients/${id}`);
}

function getMovements(ingredientId) {
  const query = ingredientId ? `?ingredientId=${ingredientId}` : '';
  return get(`/api/ingredients/movements${query}`);
}

function addMovement(data) {
  return post('/api/ingredients/movements', data);
}

export {  getAll, getById, create, update, remove, getMovements, addMovement  };
