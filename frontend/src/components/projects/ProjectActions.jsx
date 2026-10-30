import { useState, useRef, useEffect } from 'react';
import { MoreVertical, Pencil, Archive, Trash2 } from 'lucide-react';

export default function ProjectActions({ project, onEdit, onArchive, onDelete, isAdmin }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  if (!isAdmin) return null;

  return (
    <div className="menu-wrap" ref={ref}>
      <button className="menu-btn" onClick={() => setOpen((v) => !v)} aria-label="Project actions">
        <MoreVertical size={16} />
      </button>
      {open && (
        <div className="menu-dropdown">
          <button
            className="menu-item"
            onClick={() => { setOpen(false); onEdit(project); }}
          >
            <Pencil size={14} /> Edit
          </button>
          <button
            className="menu-item"
            onClick={() => { setOpen(false); onArchive(project); }}
          >
            <Archive size={14} /> Archive
          </button>
          <button
            className="menu-item danger"
            onClick={() => { setOpen(false); onDelete(project); }}
          >
            <Trash2 size={14} /> Delete
          </button>
        </div>
      )}
    </div>
  );
}
