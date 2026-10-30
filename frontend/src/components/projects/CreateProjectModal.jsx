import { useState, useEffect } from 'react';
import Modal from '../common/Modal';

export default function CreateProjectModal({ isOpen, onClose, onSubmit, initial, existingNames = [] }) {
  const isEdit = Boolean(initial);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('Active');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setName(initial?.name || '');
      setDescription(initial?.description || '');
      setStatus(initial?.status || 'Active');
      setError('');
      setSubmitting(false);
    }
  }, [isOpen, initial]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Project name is required.');
      return;
    }
    const duplicate = existingNames.some(
      (n) => n.trim().toLowerCase() === trimmed.toLowerCase() && n.trim().toLowerCase() !== (initial?.name || '').trim().toLowerCase()
    );
    if (duplicate) {
      setError('A project with this name already exists.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await onSubmit({ name: trimmed, description, status });
      onClose();
    } catch (err) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEdit ? 'Edit Project' : 'Create New Project'} subtitle={isEdit ? 'Update project details.' : 'Add a new project to your workspace.'}>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">Project Name *</label>
          <input
            className="form-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Project Brain AI"
            autoFocus
          />
          {error && <div className="form-error">{error}</div>}
        </div>
        <div className="form-group">
          <label className="form-label">Project Description</label>
          <textarea
            className="form-textarea"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Short description of the project..."
          />
        </div>
        <div className="form-group">
          <label className="form-label">Project Status</label>
          <select className="form-select" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="Active">Active</option>
            <option value="Archived">Archived</option>
          </select>
        </div>
        <div className="modal-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose} disabled={submitting}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Project'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
