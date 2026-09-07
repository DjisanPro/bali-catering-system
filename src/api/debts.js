/**
 * Debts API - customer debt management.
 */
import { get, post, patch } from './client.js';

function getAll(params = {}) {
  const query = new URLSearchParams(params).toString();
  return get(`/api/debts${query ? '?' + query : ''}`);
}

function getById(id) {
  return get(`/api/debts/${id}`);
}

function getByCustomer(customerId) {
  return get(`/api/debts/customer/${customerId}`);
}

function record(data) {
  return post('/api/debts', data);
}

function pay(debtId, paymentData) {
  return post(`/api/debts/${debtId}/pay`, paymentData);
}

function updateStatus(id, status) {
  return patch(`/api/debts/${id}`, { status });
}

export {  getAll, getById, getByCustomer, record, pay, updateStatus  };
