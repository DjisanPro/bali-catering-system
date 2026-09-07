/**
 * Cash Register / Cash Shift API.
 */
import { get, post, patch } from './client.js';

function getAllShifts() {
  return get('/api/cash/shifts');
}

function getShift(id) {
  return get(`/api/cash/shifts/${id}`);
}

function openShift(data) {
  // Backend expects { initial_cash_float, notes } at POST /api/cash/shifts/open
  return post('/api/cash/shifts/open', data);
}

function closeShift(id, data) {
  // Backend closes the current open shift at PATCH /api/cash/shifts/current/close
  return patch('/api/cash/shifts/current/close', data);
}

function getCurrentShift() {
  return get('/api/cash/shifts/current');
}

function getShiftSummary(id) {
  return get(`/api/cash/shifts/${id}/summary`);
}

export { getAllShifts, getShift, openShift, closeShift, getCurrentShift, getShiftSummary };
