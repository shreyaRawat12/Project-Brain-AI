import { uploadDocument as assistantUpload, getDocuments } from './assistantService';
import { mockRepositories } from '../data/mockRepositories';
import { mockDocuments } from '../data/mockDocuments';

export async function getKnowledgeSources(projectId = null) {
  try {
    const realDocs = await getDocuments(projectId);
    if (realDocs && realDocs.length > 0) {
      // Map backend documents to table row shape
      const formatted = realDocs.map((d) => ({
        id: d.id,
        name: d.filename,
        source: d.project_id || 'Global Context',
        updated: d.updated_at ? new Date(d.updated_at).toLocaleDateString() : 'Just now',
        score: d.chunk_count > 0 ? Math.min(100, 70 + d.chunk_count * 5) : 80,
        category: 'Architecture',
        status: d.status,
      }));
      return [...formatted, ...mockDocuments];
    }
  } catch (e) {
    // Fallback if backend offline
  }
  return mockDocuments;
}

export async function uploadDocument(file, projectId = null) {
  return assistantUpload(file, projectId);
}

export async function connectRepository(repo) {
  return repo;
}

export default {
  getKnowledgeSources,
  uploadDocument,
  connectRepository,
};
