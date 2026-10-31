import apiRequest from './api';

function toFrontendProject(project) {
  return {
    id: project.id,
    name: project.name,
    description: project.description || '',
    icon: 'folder',
    status: project.status || 'attention',
    repositories: 0,
    documents: 0,
    commits: 0,
    lastSynced: 'Never',
    indexingProgress: 0,
    createdAt: project.created_at,
    updatedAt: project.updated_at,
  };
}

export async function getProjects() {
  const projects = await apiRequest('/projects');
  return projects.map(toFrontendProject);
}

export async function getProject(id) {
  const project = await apiRequest(`/projects/${id}`);
  return toFrontendProject(project);
}

export async function createProject(data) {
  const project = await apiRequest('/projects', {
    method: 'POST',
    body: JSON.stringify({
      name: (data.name || '').trim(),
      description: (data.description || '').trim() || null,
    }),
  });
  return toFrontendProject(project);
}

export async function updateProject(id, data) {
  const project = await apiRequest(`/projects/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({
      name: data.name ? data.name.trim() : undefined,
      description: data.description !== undefined ? (data.description || '').trim() || null : undefined,
      status: data.status,
    }),
  });
  return toFrontendProject(project);
}

export async function archiveProject(id) {
  return updateProject(id, { status: 'Archived' });
}

export async function deleteProject(id) {
  await apiRequest(`/projects/${id}`, { method: 'DELETE' });
  return true;
}

export default {
  getProjects,
  getProject,
  createProject,
  updateProject,
  archiveProject,
  deleteProject,
};