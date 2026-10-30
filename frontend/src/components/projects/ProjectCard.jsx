import { motion } from 'framer-motion';
import { Folder, Landmark, ShoppingCart, HeartPulse, BarChart3, GitBranch, FileText, GitCommit, Clock, Zap } from 'lucide-react';
import './ProjectCard.css';
import ProjectActionsMenu from './ProjectActionsMenu';

const ICONS = {
  landmark: Landmark,
  'shopping-cart': ShoppingCart,
  'heart-pulse': HeartPulse,
  'bar-chart-3': BarChart3,
  folder: Folder,
};

const STATUS_LABELS = {
  synced: { badge: 'Synced', text: 'Knowledge Base Ready' },
  processing: { badge: 'Processing', text: 'Indexing Project Knowledge...' },
  attention: { badge: 'Needs Attention', text: 'Connect a Repository to Begin' },
};

export default function ProjectCard({ project, onExplore, onSync, onManageSources, onViewDetails, onRemove, isSyncing }) {
  const Icon = ICONS[project.icon] || Folder;
  const status = STATUS_LABELS[project.status] || STATUS_LABELS.attention;

  return (
    <motion.div
      className="project-card"
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -4 }}
      transition={{ type: 'spring', stiffness: 260, damping: 20 }}
    >
      <div className="card-top">
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div className="project-icon">
            <Icon size={20} />
          </div>
          <div>
            <h3 className="project-name">{project.name}</h3>
            <span className={`status-badge status-${project.status}`}>{status.badge}</span>
          </div>
        </div>
        <ProjectActionsMenu
          onExplore={onExplore}
          onManageSources={onManageSources}
          onViewDetails={onViewDetails}
          onRemove={onRemove}
        />
      </div>

      <p className="project-desc">{project.description}</p>

      <div className="card-meta">
        <span><GitBranch size={13} /> {project.repositories} repos</span>
        <span><FileText size={13} /> {project.documents} docs</span>
        <span><GitCommit size={13} /> {project.commits} commits</span>
      </div>

      <div className="indexing-info">
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--muted)', marginBottom: 6 }}>
          <span>{status.text}</span>
          <span>{project.indexingProgress}%</span>
        </div>
        <div className="progress-track">
          <motion.div
            className={`progress-bar status-${project.status}`}
            initial={{ width: 0 }}
            animate={{ width: `${project.indexingProgress}%` }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          />
        </div>
        <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
          <Clock size={11} /> Last synced: {project.lastSynced}
        </div>
      </div>

      <div className="card-footer">
        <button className="btn btn-primary" onClick={onExplore} style={{ flex: 1 }}>
          <Zap size={14} /> Explore Knowledge
        </button>
        <button
          className="btn btn-secondary"
          onClick={onSync}
          disabled={isSyncing || project.status === 'processing'}
          style={{ flex: 1 }}
        >
          {isSyncing || project.status === 'processing' ? 'Syncing...' : 'Sync Now'}
        </button>
      </div>
    </motion.div>
  );
}
