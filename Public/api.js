// api.js
// Centralized fetch wrapper for the Todo backend.
// Handles base URL, auth headers, JSON parsing, and error normalization.

const API_BASE_URL = 'http://localhost:3000/api/v1';

/**
 * Builds headers for a request, attaching the JWT if present.
 */
function buildHeaders(extra = {}) {
  const headers = { 'Content-Type': 'application/json', ...extra };
  const token = localStorage.getItem('token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

/**
 * Core request function. Throws an Error with a `.message` derived from
 * the backend's error payload so callers can show it directly to the user.
 */
async function request(path, { method = 'GET', body, params } = {}) {
  let url = `${API_BASE_URL}${path}`;

  if (params) {
    const query = buildQueryString(params);
    if (query) url += `?${query}`;
  }

  let response;
  try {
    response = await fetch(url, {
      method,
      headers: buildHeaders(),
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (networkErr) {
    throw new Error('Could not reach the server. Check your connection and try again.');
  }

  let data = null;
  const text = await response.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch (parseErr) {
      data = null;
    }
  }

  if (!response.ok) {
    const message =
      (data && (data.message || data.error || (data.errors && data.errors[0]))) ||
      `Request failed with status ${response.status}`;
    const err = new Error(message);
    err.status = response.status;
    throw err;
  }

  return data;
}

/**
 * Turns a params object into a query string, supporting the backend's
 * bracket-filter syntax, e.g. { dueDate: { gte: '2026-07-01' } } -> dueDate[gte]=2026-07-01
 */
function buildQueryString(params) {
  const parts = [];
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    if (typeof value === 'object') {
      Object.entries(value).forEach(([subKey, subValue]) => {
        if (subValue === undefined || subValue === null || subValue === '') return;
        parts.push(`${encodeURIComponent(key)}[${encodeURIComponent(subKey)}]=${encodeURIComponent(subValue)}`);
      });
    } else {
      parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
    }
  });
  return parts.join('&');
}

const api = {
  // Auth
  signup(payload) {
    return request('/auth/signup', { method: 'POST', body: payload });
  },
  login(payload) {
    return request('/auth/login', { method: 'POST', body: payload });
  },

  // Todos
  getTodos(params) {
    return request('/todo', { method: 'GET', params });
  },
  getTodo(id) {
    return request(`/todo/${id}`, { method: 'GET' });
  },
  createTodo(payload) {
    return request('/todo', { method: 'POST', body: payload });
  },
  updateTodo(id, payload) {
    return request(`/todo/${id}`, { method: 'PATCH', body: payload });
  },
  deleteTodo(id) {
    return request(`/todo/${id}`, { method: 'DELETE' });
  },
};
