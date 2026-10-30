import { Bot } from 'lucide-react';

export default function Assistant() {
  return (
    <div>
      <h1 className="page-title">AI Assistant</h1>
      <p className="page-subtitle">Ask questions about your project knowledge (separate module).</p>
      <div className="empty-state">
        <Bot size={40} />
        <h3>Assistant coming soon</h3>
        <p>RAG-powered Q&A will be available here.</p>
      </div>
    </div>
  );
}
