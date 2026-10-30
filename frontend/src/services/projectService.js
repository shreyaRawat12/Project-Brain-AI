// Mock project service layer.
// Clearly separated so it can be swapped with real FastAPI calls later.

const STORAGE_KEY = 'pb_projects';
const DELAY = 500;

const SEED_PROJECTS = [
  {
    id: 'p1',
    name: 'Project Brain AI',
    description: 'AI-powered institutional knowledge management system combining documents and GitHub repositories.',
    status: 'Active',
    documents: 12,
    repositories: 2,
    members: ['u1', 'u2'],
    createdAt: '2026-09-01T10:00:00.000Z',
    updatedAt: '2026-10-28T14:30:00.000Z',
  },
  {
    id: 'p2',
    name: 'Onboarding Portal',
    description: 'Centralized onboarding knowledge base for new engineers and product teams.',
    status: 'Active',
    documents: 8,
    repositories: 1,
    members: ['u1'],
    createdAt: '2026-09-15T09:00:00.000Z',
    updatedAt: '2026-10-20T11:15:00.000Z',
  },
  {
    id: 'p3',
    name: 'Legacy Migration',
    description: 'Archive of legacy system documentation and migration notes.',
    status: 'Archived',
    documents: 24,
    repositories: 0,
    members: ['u2'],
    createdAt: '2026-07-01T08:00:00.000Z',
    updatedAt: '2026-08-12T16:45:00.000Z',
  },
  {
    id: 'p4',
    name: 'Customer Support KB',
    description: 'Knowledge base for support agents with troubleshooting guides and runbooks.',
    status: 'Active',
    documents: 16,
    repositories: 3,
    members: ['u1', 'u2'],
    createdAt: '2026-08-10T12:00:00.000Z',
    updatedAt: '2026-10-25T09:20:00.000Z',
  },
];

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length) return parsed;
    }
  } catch (e) {
    // ignore
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_PROJECTS));
  return [...SEED_PROJECTS];
}

function save(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

function delay(ms = DELAY) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function getProjects() {
  await delay();
  return load();
}

export async function getProject(id) {
  await delay(200);
  const list = load();
  const project = list.find((p) => p.id === id);
  if (!project) throw new Error('Project not found');
  return project;
}

export async function createProject(data) {
  await delay();
  const list = load();
  const name = (data.name || '').trim();
  if (!name) throw new Error('Project name is required');
  const duplicate = list.some(
    (p) => p.name.trim().toLowerCase() === name.toLowerCase()
  );
  if (duplicate) throw new Error('A project with this name already exists');
  const now = new Date().toISOString();
  const project = {
    id: `p_${Date.now()}`,
    name,
    description: (data.description || '').trim(),
    status: data.status || 'Active',
    documents: 0,
    repositories: 0,
    members: data.members || ['u1'],
    createdAt: now,
    updatedAt: now,
  };
  list.unshift(project);
  save(list);
  return project;
}

export async function updateProject(id, data) {
  await delay();
  const list = load();
  const idx = list.findIndex((p) => p.id === id);
  if (idx === -1) throw new Error('Project not found');
  const name = (data.name || '').trim();
  if (!name) throw new Error('Project name is required');
  const duplicate = list.some(
    (p) => p.id !== id && p.name.trim().toLowerCase() === name.toLowerCase()
  );
  if (duplicate) throw new Error('A project with this name already exists');
  const updated = {
    ...list[idx],
    name,
    description: (data.description || '').trim(),
    status: data.status || list[idx].status,
    updatedAt: new Date().toISOString(),
  };
  list[idx] = updated;
  save(list);
  return updated;
}

export async function archiveProject(id) {
  await delay();
  const list = load();
  const idx = list.findIndex((p) => p.id === id);
  if (idx === -1) throw new Error('Project not found');
  list[idx] = { ...list[idx], status: 'Archived', updatedAt: new Date().toISOString() };
  save(list);
  return list[idx];
}

export async function deleteProject(id) {
  await delay();
  const list = load();
  const idx = list.findIndex((p) => p.id === id);
  if (idx === -1) throw new Error('Project not found');
  list.splice(idx, 1);
  save(list);
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
