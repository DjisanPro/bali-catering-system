/**
 * Backups API - create, list, and restore backups.
 */
import { get, post } from './client.js';

function getAll() {
  return get('/api/backups');
}

function getById(id) {
  return get(`/api/backups/${id}`);
}

function create(label) {
  return post('/api/backups', { label });
}

function restore(id) {
  return post(`/api/backups/${id}/restore`);
}

function download(id) {
  return get(`/api/backups/${id}/download`);
}

export {  getAll, getById, create, restore, download  };
