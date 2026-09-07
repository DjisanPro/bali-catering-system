/**
 * Base HTTP client for Bali Catering Service API.
 * All API modules import from this client.
 * Uses localStorage('bali_auth_token') for auth.
 */

const TOKEN_KEY = 'bali_auth_token';

/**
 * Get the current auth token from localStorage.
 */
export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

/**
 * Set the auth token in localStorage.
 */
export function setToken(token) {
  try {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  } catch {
    // localStorage unavailable (SSR, private browsing edge case)
  }
}

/**
 * Clear the auth token and redirect to login.
 */
export function clearAuthAndRedirect() {
  setToken(null);
  // Dispatch a custom event so AppContext can react
  window.dispatchEvent(new CustomEvent('bali:auth-expired'));
}

/**
 * Core fetch wrapper.
 * @param {string} url - API endpoint (relative or absolute)
 * @param {object} options - fetch options
 * @returns {Promise<{success: boolean, data?: any, error?: string}>}
 */
export async function request(url, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    // Handle 401 Unauthorized
    if (response.status === 401) {
      clearAuthAndRedirect();
      return { success: false, error: 'Session expired. Please log in again.' };
    }

    // Handle other errors
    if (!response.ok) {
      let errorMessage = `Request failed with status ${response.status}`;
      try {
        const errorBody = await response.json();
        errorMessage = errorBody.error || errorBody.message || errorMessage;
      } catch {
        // Response body wasn't JSON
      }
      return { success: false, error: errorMessage };
    }

    // Handle 204 No Content
    if (response.status === 204) {
      return { success: true, data: null };
    }

    // Parse JSON response — unwrap the backend envelope {success, data, error}
    const body = await response.json();
    return {
      success: body.success !== false,
      data: body.data,
      error: body.error,
    };
  } catch (error) {
    console.error(`[API] Request failed: ${options.method || 'GET'} ${url}`, error);
    return { success: false, error: error.message || 'Network error. Please check your connection.' };
  }
}

/**
 * HTTP method helpers.
 */
export function get(url) {
  return request(url, { method: 'GET' });
}

export function post(url, data) {
  return request(url, {
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined,
  });
}

export function put(url, data) {
  return request(url, {
    method: 'PUT',
    body: data ? JSON.stringify(data) : undefined,
  });
}

export function patch(url, data) {
  return request(url, {
    method: 'PATCH',
    body: data ? JSON.stringify(data) : undefined,
  });
}

export function del(url) {
  return request(url, { method: 'DELETE' });
}
