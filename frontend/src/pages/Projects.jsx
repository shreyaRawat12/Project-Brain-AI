import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, RefreshCw, FolderKanban } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useProjects } from '../context/ProjectContext';
import ProjectFilters from '../components/projects/ProjectFilters';
import ProjectGrid from '../components/projects/ProjectGrid';
import CreateProjectModal from '../components/projects/CreateProjectModal';
import DeleteConfirmDialog from '../components/projects/DeleteConfirmDialog';

export default function Projects() {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();

  const { projects, loading, error, fetchProjects, createProject, updateProject, archiveProject, deleteProject } = useProjects();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sort, setSort] = useState('updated');
  const [view, setView] = useState('grid');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => setToast({ message, type });

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  const visibleProjects = useMemo(() => {
    if (isAdmin) return projects;
    return projects.filter((p) => (p.members || []).includes(user?.id));
  }, [projects, isAdmin, user]);

  const filtered = useMemo(() => {
    let list = [...visibleProjects];
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.description || '').toLowerCase().includes(q)
      );
    }
    if (statusFilter !== 'All') {
      list = list.filter((p) => p.status === statusFilter);
    }
    if (sort === 'updated') {
      list.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    } else if (sort === 'created') {
      list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else if (sort === 'name') {
      list.sort((a, b) => a.name.localeCompare(b.name));
    }
    return list;
  }, [visibleProjects, search, statusFilter, sort]);

  const handleOpen = (project) => {
    navigate(`/project-knowledge/${project.id}`);
  };

  const handleModalSubmit = async (data) => {
    if (editingProject) {
      const updated = await updateProject(editingProject.id, data);
      showToast('Project updated successfully', 'success');
    } else {
      await createProject(data);
      showToast('Project created successfully', 'success');
    }
  };

  const handleEdit = (project) => {
    setEditingProject(project);
    setModalOpen(true);
  };

  const handleArchive = async (project) => {
    try {
      await archiveProject(project.id);
      showToast('Project archived', 'success');
    } catch (e) {
      showToast(e.message || 'Failed to archive', 'error');
    }
  };

  const handleDeleteRequest = (project) => {
    setDeleteTarget(project);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteProject(deleteTarget.id);
      showToast('Project deleted', 'success');
      setDeleteTarget(null);
    } catch (e) {
      showToast(e.message || 'Failed to delete', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const openCreateModal = () => {
    setEditingProject(null);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingProject(null);
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Projects</h1>
          <p className="page-subtitle">Create, organize and manage all your projects in one place.</p>
        </div>
        {isAdmin && (
          <button className="btn btn-primary" onClick={openCreateModal}>
            <Plus size={16} /> New Project
          </button>
        )}
      </div>

      {!loading && !error && visibleProjects.length > 0 && (
        <ProjectFilters
          search={search}
          setSearch={setSearch}
          status={statusFilter}
          setStatus={setStatusFilter}
          sort={sort}
          setSort={setSort}
          view={view}
          setView={setView}
        />
      )}

      {loading && (
        <div className="project-grid">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton" />
          ))}
        </div>
      )}

      {!loading && error && (
        <div className="error-state">
          <RefreshCw size={40} />
          <h3>Something went wrong</h3>
          <p>{error}</p>
          <button className="btn btn-primary" onClick={fetchProjects} style={{ marginTop: 12 }}>
            <RefreshCw size={14} /> Retry
          </button>
        </div>
      )}

      {!loading && !error && visibleProjects.length === 0 && (
        <div className="empty-state">
          <FolderKanban size={48} />
          <h3>No projects yet</h3>
          <p>{isAdmin ? 'Create your first project to get started.' : 'You have no assigned projects.'}</p>
          {isAdmin && (
            <button className="btn btn-primary" onClick={openCreateModal} style={{ marginTop: 12 }}>
              <Plus size={16} /> Create Project
            </button>
          )}
        </div>
      )}

      {!loading && !error && visibleProjects.length > 0 && filtered.length === 0 && (
        <div className="no-results">
          <FolderKanban size={40} />
          <h3>No matching projects</h3>
          <p>Try adjusting your search or filters.</p>
        </div>
      )}

      {!loading && !error && filtered.length > 0 && (
        <ProjectGrid
          projects={filtered}
          view={view}
          onOpen={handleOpen}
          onEdit={handleEdit}
          onArchive={handleArchive}
          onDelete={handleDeleteRequest}
          isAdmin={isAdmin}
        />
      )}

      <CreateProjectModal
        isOpen={modalOpen}
        onClose={closeModal}
        onSubmit={handleModalSubmit}
        initial={editingProject}
        existingNames={projects.map((p) => p.name)}
      />

      <DeleteConfirmDialog
        project={deleteTarget}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        loading={deleting}
      />

      {toast && <div className={`toast ${toast.type}`}>{toast.message}</div>}
    </>
  );
}
