import apiRequest, { getAuthToken } from './api';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

export async function getRepositories(projectId) {
  if (!projectId) return [];
  return apiRequest(`/projects/${projectId}/repositories`);
}

export async function connectRepository(projectId, data) {
  return apiRequest(`/projects/${projectId}/repositories`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function deleteRepository(projectId, repositoryId) {
  return apiRequest(`/projects/${projectId}/repositories/${repositoryId}`, {
    method: 'DELETE',
  });
}

export async function getDocuments(projectId) {
  if (!projectId) return [];
  return apiRequest(`/projects/${projectId}/documents`);
}

export async function uploadDocument(projectId, file) {
  const token = getAuthToken();
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${API_BASE}/projects/${projectId}/documents`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Upload failed: ${res.status}`);
  }
  return res.json();
}

export default {
  getRepositories,
  connectRepository,
  deleteRepository,
  getDocuments,
  uploadDocument,
};