// Base API client.
// Attaches the stored bearer token automatically when available.
const API_BASE = import.meta.env.VITE_API_BASE_URL || '';
const TOKEN_KEY = 'pb_auth_token';

function getStoredToken() {
  const direct = localStorage.getItem(TOKEN_KEY);
  if (direct) return direct;

  try {
    const legacy = localStorage.getItem('pb_auth_session');
    if (legacy) {
      const session = JSON.parse(legacy);
      if (session?.token) return session.token;
    }
  } catch {
    // Ignore malformed legacy session data.
  }

  return null;
}

export async function apiRequest(path, options = {}) {
  const token = getStoredToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token && !headers.Authorization) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (res.status === 401) {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem('pb_auth_user');
    localStorage.removeItem('pb_auth_session');
    throw new Error('Your session has expired. Please sign in again.');
  }

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Request failed: ${res.status}`);
  }

  if (res.status === 204) return null;
  return res.json();
}

export default apiRequest;
