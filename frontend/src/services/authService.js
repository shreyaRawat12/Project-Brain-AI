import apiRequest from './api';

export async function login(credentials) {
  return apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  });
}

export async function signup(data) {
  return apiRequest('/auth/signup', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function me(token) {
  return apiRequest('/auth/me', {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
}

export async function logout(token) {
  try {
    await apiRequest('/auth/logout', {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  } catch {
    // Client-side logout still proceeds if the backend call fails.
  }
  return true;
}

export default { login, signup, me, logout };
