import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, RefreshCw, FolderKanban, CheckCircle2, Loader2, AlertTriangle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useProjects } from '../context/ProjectContext';
import ProjectFilters from '../components/projects/ProjectFilters';
import ProjectGrid from '../components/projects/ProjectGrid';
import CreateProjectModal from '../components/projects/CreateProjectModal';
import RemoveProjectModal from '../components/projects/RemoveProjectModal';
import ProjectDetailsModal from '../components/projects/ProjectDetailsModal';
import PageHeader from '../components/common/PageHeader';
import './Projects.css';

export default function Projects() {
  const { isAdmin } = useAuth();
  const { projects, loading, error, fetchProjects, createProject, deleteProject, setProjects } = useProjects();
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [importOpen, setImportOpen] = useState(false);
  const [removeTarget, setRemoveTarget] = useState(null);
  const [removing, setRemoving] = useState(false);
  const [detailsProject, setDetailsProject] = useState(null);
  const [syncingIds, setSyncingIds] = useState(new Set());
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => setToast({ message, type });

  useEffect(() => { fetchProjects(); }, [fetchProjects]);

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  const stats = useMemo(() => ({
    total: projects.length,
    synced: projects.filter((p) => p.status === 'synced').length,
    processing: projects.filter((p) => p.status === 'processing').length,
    attention: projects.filter((p) => p.status === 'attention').length,
  }), [projects]);

  const filtered = useMemo(() => {
    let list = [...projects];
  const q = search.trim().toLowerCase();
  if (q) {
    list = list.filter((p) => p.name.toLowerCase().includes(q) || (p.description || '').toLowerCase().includes(q));
  }
  if (filter !== 'all') list = list.filter((p) => p.status === filter);
  return list;
}, [projects, search, filter]);

  const handleImport = async (data) => {
    await createProject(data);
    showToast('Project imported successfully', 'success');
  };

  const handleSync = async (project) => {
    if (syncingIds.has(project.id) || project.status === 'processing') return;
    setSyncingIds((prev) => new Set(prev).add(project.id));
    setProjects((prev) => prev.map((p) => p.id === project.id ? { ...p, status: 'processing', indexingProgress: Math.max(p.indexingProgress, 10), lastSynced: 'Syncing now' } : p));
    try {
      for (let i = 20; i <= 100; i += 20) {
        await new Promise((r) => setTimeout(r, 400));
        setProjects((prev) => prev.map((p) => p.id === project.id ? { ...p, indexingProgress: i } : p));
      }
      setProjects((prev) => prev.map((p) => p.id === project.id ? { ...p, status: 'synced', indexingProgress: 100, lastSynced: 'Just now' } : p));
      showToast('Sync completed', 'success');
    } catch (e) {
      showToast('Sync failed', 'error');
    } finally {
      setSyncingIds((prev) => { const n = new Set(prev); n.delete(project.id); return n; });
    }
  };

  const handleExplore = (project) => navigate(`/project-knowledge/${project.id}`);
  const handleManageSources = () => navigate('/knowledge');
  const handleViewDetails = (project) => setDetailsProject(project);
  const handleRemoveRequest = (project) => setRemoveTarget(project);

  const handleRemoveConfirm = async () => {
    if (!removeTarget) return;
    setRemoving(true);
    try {
      await deleteProject(removeTarget.id);
      showToast('Project removed from Brain AI', 'success');
      setRemoveTarget(null);
    } catch (e) {
      showToast(e.message || 'Failed to remove', 'error');
    } finally {
      setRemoving(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <PageHeader
        title="Projects"
        subtitle="Explore and organize your team's existing software project knowledge."
        actions={
          <button className="btn btn-primary" onClick={() => setImportOpen(true)}>
            <Plus size={16} /> Import Existing Project
          </button>
        }
      />

      <div className="overview-grid">
        {[
          { label: 'Total Registered Projects', value: stats.total, icon: FolderKanban },
          { label: 'Synced Projects', value: stats.synced, icon: CheckCircle2 },
          { label: 'Projects Processing', value: stats.processing, icon: Loader2 },
          { label: 'Projects Requiring Attention', value: stats.attention, icon: AlertTriangle },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <motion.div key={s.label} className="stat-card" whileHover={{ y: -2 }}>
              <div className="stat-icon"><Icon size={18} /></div>
              <div className="stat-value">{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </motion.div>
          );
        })}
      </div>

      {!loading && !error && projects.length > 0 && (
        <ProjectFilters
          search={search}
          setSearch={setSearch}
          filter={filter}
          setFilter={setFilter}
          count={filtered.length}
        />
      )}

      {loading && (
        <div className="project-grid">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton" />)}
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

      {!loading && !error && projects.length === 0 && (
        <div className="empty-state">
          <FolderKanban size={48} />
          <h3>No projects yet</h3>
          <p>Import an existing project to get started.</p>
          <button className="btn btn-primary" onClick={() => setImportOpen(true)} style={{ marginTop: 12 }}>
            <Plus size={16} /> Import Existing Project
          </button>
        </div>
      )}

      {!loading && !error && projects.length > 0 && (
        <ProjectGrid
          projects={filtered}
          onExplore={handleExplore}
          onSync={handleSync}
          onManageSources={handleManageSources}
          onViewDetails={handleViewDetails}
          onRemove={handleRemoveRequest}
          syncingIds={syncingIds}
        />
      )}

      <CreateProjectModal
        isOpen={importOpen}
        onClose={() => setImportOpen(false)}
        onSubmit={handleImport}
        existingNames={projects.map((p) => p.name)}
      />

      <RemoveProjectModal
        isOpen={!!removeTarget}
        project={removeTarget}
        onCancel={() => setRemoveTarget(null)}
        onConfirm={handleRemoveConfirm}
        loading={removing}
      />

      <ProjectDetailsModal
        isOpen={!!detailsProject}
        onClose={() => setDetailsProject(null)}
        project={detailsProject}
      />

      {toast && <div className={`toast ${toast.type}`}>{toast.message}</div>}
    </motion.div>
  );
}
