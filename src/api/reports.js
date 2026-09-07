/**
 * Reports API - sales, financial, and operational reports.
 */
import { get } from './client.js';

function getDailyReport(date) {
  return get(`/api/reports/daily${date ? '?date=' + date : ''}`);
}

function getSalesReport(params = {}) {
  const query = new URLSearchParams(params).toString();
  return get(`/api/reports/sales${query ? '?' + query : ''}`);
}

function getFinancialReport(params = {}) {
  const query = new URLSearchParams(params).toString();
  return get(`/api/reports/financial${query ? '?' + query : ''}`);
}

function getInventoryReport() {
  return get('/api/reports/stock');
}

function getCustomerReport(params = {}) {
  const query = new URLSearchParams(params).toString();
  return get(`/api/reports/customers${query ? '?' + query : ''}`);
}

export { 
  getDailyReport,
  getSalesReport,
  getFinancialReport,
  getInventoryReport,
  getCustomerReport,
 };
