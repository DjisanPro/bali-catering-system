/**
 * Auth API - login, logout, session management.
 */
import { post, get, setToken } from './client.js';

async function login(identifier, password) {
  const result = await post('/api/auth/login', { identifier, password });
  if (result.success && result.data && result.data.token) {
    setToken(result.data.token);
  }
  return result;
}

async function logout() {
  const result = await post('/api/auth/logout');
  setToken(null);
  return result;
}

async function getMe() {
  return await get('/api/auth/me');
}

export {  login, logout, getMe  };
