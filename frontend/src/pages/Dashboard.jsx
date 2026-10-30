import { FolderKanban } from 'lucide-react';

export default function Dashboard() {
  return (
    <div>
      <h1 className="page-title">Dashboard</h1>
      <p className="page-subtitle">Platform overview (managed by another team member).</p>
      <div className="empty-state">
        <FolderKanban size={40} />
        <h3>Dashboard coming soon</h3>
        <p>This page is maintained by the platform team.</p>
      </div>
    </div>
  );
}
