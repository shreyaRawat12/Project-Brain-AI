import { Folder, FileText, GitBranch, Calendar, ArrowRight } from 'lucide-react';
import ProjectActions from './ProjectActions';

function formatDate(iso) {
  try {
    return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  } catch (e) {
    return iso;
  }
}

export default function ProjectCard({ project, view, onOpen, onEdit, onArchive, onDelete, isAdmin }) {
  return (
    <div className={`project-card${view === 'list' ? ' list' : ''}`}>
      <div className="card-top">
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div className="project-icon">
            <Folder size={20} />
          </div>
          <div>
            <h3 className="project-name">{project.name}</h3>
            <span className={`status-badge ${project.status === 'Active' ? 'status-active' : 'status-archived'}`}>
              {project.status}
            </span>
          </div>
        </div>
        <ProjectActions
          project={project}
          onEdit={onEdit}
          onArchive={onArchive}
          onDelete={onDelete}
          isAdmin={isAdmin}
        />
      </div>

      <p className="project-desc">{project.description || 'No description provided.'}</p>

      <div className="card-meta">
        <span><FileText size={13} /> {project.documents} docs</span>
        <span><GitBranch size={13} /> {project.repositories} repos</span>
        <span><Calendar size={13} /> Updated {formatDate(project.updatedAt)}</span>
      </div>

      <div className="card-footer">
        <span style={{ fontSize: 12, color: 'var(--muted)' }}>Created {formatDate(project.createdAt)}</span>
        <button className="btn btn-primary" onClick={() => onOpen(project)} style={{ padding: '8px 12px', fontSize: 13 }}>
          Open Project <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
}
