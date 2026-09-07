/**
 * Settings / Config API - restaurant configuration management.
 */
import { get, put } from './client.js';

function getConfig() {
  return get('/api/settings');
}

function updateConfig(data) {
  return put('/api/settings', data);
}

function resetConfig() {
  return put('/api/settings/reset');
}

export {  getConfig, updateConfig, resetConfig  };
