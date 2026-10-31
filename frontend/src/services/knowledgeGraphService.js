// Frontend integration point for the Knowledge Graph API.
// Backend endpoint is not available yet; this service falls back to a clearly
// labelled preview sample so the UI can be developed and tested without
// fabricating real project data.

import { apiRequest } from './api';

const SAMPLE_GRAPH = {
  project_id: 'preview-project',
  nodes: [
    { id: 'proj', type: 'project', label: 'Project Brain', description: 'AI delivery memory system' },
    { id: 'mod-auth', type: 'module', label: 'Auth module', description: 'Authentication and session handling' },
    { id: 'mod-checkout', type: 'module', label: 'Checkout module', description: 'Checkout flow and state machine' },
    { id: 'file-auth', type: 'file', label: 'auth.py', description: 'Authentication helpers', metadata: { path: 'backend/auth.py', module: 'Auth module' } },
    { id: 'file-checkout', type: 'file', label: 'checkout.py', description: 'Checkout state machine', metadata: { path: 'backend/checkout.py', module: 'Checkout module' } },
    { id: 'fn-validate', type: 'function', label: 'validate_token', description: 'Validate JWT tokens', metadata: { file: 'auth.py' } },
    { id: 'class-sm', type: 'class', label: 'CheckoutStateMachine', description: 'Checkout state machine implementation', metadata: { file: 'checkout.py' } },
    { id: 'doc-auth', type: 'document', label: 'Auth Design Doc', description: 'Architecture notes for authentication', metadata: { path: 'docs/auth.md' } },
    { id: 'dec-001', type: 'decision', label: 'Use state machine for checkout', description: 'Decision to model checkout as a state machine', metadata: {} },
    { id: 'commit-abc', type: 'commit', label: 'feat: checkout state machine', description: 'Introduced checkout state machine', metadata: { hash: 'abc123' } },
  ],
  edges: [
    { id: 'e1', source: 'proj', target: 'mod-auth', type: 'CONTAINS' },
    { id: 'e2', source: 'proj', target: 'mod-checkout', type: 'CONTAINS' },
    { id: 'e3', source: 'mod-auth', target: 'file-auth', type: 'CONTAINS' },
    { id: 'e4', source: 'mod-checkout', target: 'file-checkout', type: 'CONTAINS' },
    { id: 'e5', source: 'file-auth', target: 'fn-validate', type: 'CONTAINS' },
    { id: 'e6', source: 'file-checkout', target: 'class-sm', type: 'CONTAINS' },
    { id: 'e7', source: 'file-checkout', target: 'file-auth', type: 'IMPORTS' },
    { id: 'e8', source: 'doc-auth', target: 'mod-auth', type: 'DOCUMENTS' },
    { id: 'e9', source: 'dec-001', target: 'file-checkout', type: 'RELATED_TO' },
    { id: 'e10', source: 'commit-abc', target: 'file-checkout', type: 'MODIFIED_BY' },
  ],
  statistics: { total_nodes: 10, total_edges: 10, modules: 2, documents: 1 },
};

export async function getKnowledgeGraph(projectId) {
  if (!projectId) {
    const err = new Error('No project selected');
    err.code = 'NO_PROJECT';
    throw err;
  }
  try {
    const data = await apiRequest(`/knowledge-graph/${projectId}`);
    if (!data || !Array.isArray(data.nodes) || !Array.isArray(data.edges)) {
      const err = new Error('Invalid graph response');
      err.code = 'INVALID_RESPONSE';
      throw err;
    }
    return { ...data, demo: false };
  } catch (e) {
    // Fall back to clearly labelled preview data so the UI remains usable.
    return { ...SAMPLE_GRAPH, project_id: projectId, demo: true };
  }
}

export default { getKnowledgeGraph };
