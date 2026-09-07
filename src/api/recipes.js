/**
 * Recipes API - product recipe/ingredient mapping.
 */
import { get, put } from './client.js';

function getByProduct(productId) {
  return get(`/api/recipes/${productId}`);
}

function updateRecipe(productId, ingredients) {
  return put(`/api/recipes/${productId}`, { ingredients });
}

function getAll() {
  return get('/api/recipes');
}

export {  getByProduct, updateRecipe, getAll  };
