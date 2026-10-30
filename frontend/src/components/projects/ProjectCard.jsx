import { useState, useRef, useEffect } from 'react';
import { Folder, FileText, GitBranch, Calendar, ArrowRight, MoreVertical, Pencil, Archive, Trash2 } from 'lucide-react';
import { formatDate } from '../../utils/formatDate';

export default function ProjectCard({ project, view, onOpen, onEdit, onArchive, onDelete, isAdmin }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

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
        {isAdmin && (
          <div className="menu-wrap" ref={ref}>
            <button className="menu-btn" onClick={() => setOpen((v) => !v)} aria-label="Project actions">
              <MoreVertical size={16} />
            </button>
            {open && (
              <div className="menu-dropdown">
                <button className="menu-item" onClick={() => { setOpen(false); onEdit(project); }}>
                  <Pencil size={14} /> Edit
                </button>
                <button className="menu-item" onClick={() => { setOpen(false); onArchive(project); }}>
                  <Archive size={14} /> Archive
                </button>
                <button className="menu-item danger" onClick={() => { setOpen(false); onDelete(project); }}>
                  <Trash2 size={14} /> Delete
                </button>
              </div>
            )}
          </div>
        )}
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
