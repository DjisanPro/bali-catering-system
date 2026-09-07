/**
 * Inventory API - stock movements and inventory reports.
 */
import { get, post } from './client.js';

function getMovements(params = {}) {
  const query = new URLSearchParams(params).toString();
  return get(`/api/inventory/movements${query ? '?' + query : ''}`);
}

function addMovement(data) {
  return post('/api/inventory/movements', data);
}

function getStockLevels() {
  return get('/api/inventory/stock-levels');
}

function getLowStockItems() {
  return get('/api/inventory/low-stock');
}

function deductStock(orderId) {
  return post(`/api/inventory/deduct/${orderId}`);
}

export {  getMovements, addMovement, getStockLevels, getLowStockItems, deductStock  };
