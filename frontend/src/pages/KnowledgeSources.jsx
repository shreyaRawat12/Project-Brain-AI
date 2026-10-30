import { BookOpen } from 'lucide-react';

export default function KnowledgeSources() {
  return (
    <div>
      <h1 className="page-title">Knowledge Sources</h1>
      <p className="page-subtitle">Manage documents and repositories (separate module).</p>
      <div className="empty-state">
        <BookOpen size={40} />
        <h3>Coming soon</h3>
        <p>Document and repository management lives here.</p>
      </div>
    </div>
  );
}
