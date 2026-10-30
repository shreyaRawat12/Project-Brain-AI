import ProjectCard from './ProjectCard';

export default function ProjectGrid({ projects, view, onOpen, onEdit, onArchive, onDelete, isAdmin }) {
  return (
    <div className={`project-grid${view === 'list' ? ' list' : ''}`}>
      {projects.map((p) => (
        <ProjectCard
          key={p.id}
          project={p}
          view={view}
          onOpen={onOpen}
          onEdit={onEdit}
          onArchive={onArchive}
          onDelete={onDelete}
          isAdmin={isAdmin}
        />
      ))}
    </div>
  );
}
