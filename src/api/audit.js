/**
 * Audit Logs API - immutable audit trail.
 */
import { get } from './client.js';

function getAll(params = {}) {
  const query = new URLSearchParams(params).toString();
  return get(`/api/audit${query ? '?' + query : ''}`);
}

function getById(id) {
  return get(`/api/audit/${id}`);
}

function getByEntity(entity, entityId) {
  return get(`/api/audit/entity/${entity}/${entityId}`);
}

function getByUser(userId) {
  return get(`/api/audit/user/${userId}`);
}

export {  getAll, getById, getByEntity, getByUser  };
