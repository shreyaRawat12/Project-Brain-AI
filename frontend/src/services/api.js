const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

export async function apiRequest(path, options = {}) {
  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
  const headers = isFormData
    ? { ...(options.headers || {}) }
    : { 'Content-Type': 'application/json', ...(options.headers || {}) };

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    let errMsg = `Request failed: ${res.status}`;
    try {
      const errJson = await res.json();
      errMsg = errJson.detail || errJson.message || errMsg;
    } catch {
      try {
        const text = await res.text();
        if (text) errMsg = text;
      } catch {}
    }
    throw new Error(errMsg);
  }

  return res.json();
}

export default apiRequest;
