// Base API client placeholder.
// When FastAPI backend is ready, set VITE_API_BASE_URL and replace mock service calls.
const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

export async function apiRequest(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Request failed: ${res.status}`);
  }
  return res.json();
}

export default apiRequest;
