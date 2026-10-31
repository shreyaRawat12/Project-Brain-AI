import { apiRequest } from './api';

const CONVERSATIONS_KEY = 'pb_assistant_conversations';

export async function askQuestion(question, projectId = null, conversationId = null) {
  return apiRequest('/assistant/ask', {
    method: 'POST',
    body: JSON.stringify({
      question,
      project_id: projectId || undefined,
      conversation_id: conversationId || undefined,
    }),
  });
}

export async function uploadDocument(file, projectId = null) {
  const formData = new FormData();
  formData.append('file', file);
  if (projectId) {
    formData.append('project_id', projectId);
  }

  return apiRequest('/assistant/upload', {
    method: 'POST',
    body: formData,
  });
}

export async function getDocuments(projectId = null) {
  const query = projectId ? `?project_id=${encodeURIComponent(projectId)}` : '';
  return apiRequest(`/assistant/documents${query}`);
}

export async function getDocumentStatus(documentId) {
  return apiRequest(`/assistant/documents/${encodeURIComponent(documentId)}/status`);
}

export async function getSourceDetails(sourceId) {
  return apiRequest(`/assistant/sources/${encodeURIComponent(sourceId)}`);
}

export function getStoredConversations(projectId = null) {
  try {
    const raw = localStorage.getItem(CONVERSATIONS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    if (projectId) {
      return parsed.filter((c) => !c.projectId || c.projectId === projectId);
    }
    return parsed;
  } catch (e) {
    return [];
  }
}

export function saveStoredConversation(conversation) {
  try {
    const all = getStoredConversations();
    const idx = all.findIndex((c) => c.id === conversation.id);
    let updated;
    if (idx >= 0) {
      updated = [...all];
      updated[idx] = conversation;
    } else {
      updated = [conversation, ...all];
    }
    localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(updated));
    return updated;
  } catch (e) {
    return [];
  }
}

export function deleteStoredConversation(conversationId) {
  try {
    const all = getStoredConversations();
    const filtered = all.filter((c) => c.id !== conversationId);
    localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(filtered));
    return filtered;
  } catch (e) {
    return [];
  }
}

export default {
  askQuestion,
  uploadDocument,
  getDocuments,
  getDocumentStatus,
  getSourceDetails,
  getStoredConversations,
  saveStoredConversation,
  deleteStoredConversation,
};
