const ASSISTANT_API_BASE = (
  import.meta.env.VITE_ASSISTANT_API_BASE_URL ||
  (import.meta.env.DEV ? 'http://192.168.137.1:8000' : '')
).replace(/\/+$/, '');

export async function askQuestion(question) {
  const res = await fetch(`${ASSISTANT_API_BASE}/ask`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Request failed: ${res.status}`);
  }

  const data = await res.json();
  return {
    answer: data?.answer ?? 'No answer returned.',
    sources: Array.isArray(data?.sources) ? data.sources : [],
    found: data?.found,
    confidence: data?.confidence,
  };
}

export async function getConversations() {
  return [];
}

export default { askQuestion, getConversations };
