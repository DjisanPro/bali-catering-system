/**
 * Dashboard API - aggregated stats and metrics.
 */
import { get } from './client.js';

function getStats(params = {}) {
  const query = new URLSearchParams(params).toString();
  return get(`/api/dashboard/stats${query ? '?' + query : ''}`);
}

function getRecentActivity(limit = 20) {
  return get(`/api/dashboard/activity?limit=${limit}`);
}

function getSalesSummary(dateRange) {
  const query = new URLSearchParams(dateRange).toString();
  return get(`/api/dashboard/sales-summary${query ? '?' + query : ''}`);
}

function getTopProducts(limit = 10) {
  return get(`/api/dashboard/top-products?limit=${limit}`);
}

export {  getStats, getRecentActivity, getSalesSummary, getTopProducts  };
