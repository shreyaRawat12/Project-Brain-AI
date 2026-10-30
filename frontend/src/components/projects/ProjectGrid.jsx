import { motion, AnimatePresence } from 'framer-motion';
import './ProjectGrid.css';
import ProjectCard from './ProjectCard';

export default function ProjectGrid({ projects, onExplore, onSync, onManageSources, onViewDetails, onRemove, syncingIds }) {
  if (!projects.length) {
    return (
      <div className="empty-state">
        <h3>No matching projects</h3>
        <p>Try adjusting your search or filters.</p>
      </div>
    );
  }
  return (
    <motion.div className="project-grid" layout>
      <AnimatePresence>
        {projects.map((p) => (
          <ProjectCard
            key={p.id}
            project={p}
            onExplore={() => onExplore(p)}
            onSync={() => onSync(p)}
            onManageSources={() => onManageSources(p)}
            onViewDetails={() => onViewDetails(p)}
            onRemove={() => onRemove(p)}
            isSyncing={syncingIds.has(p.id)}
          />
        ))}
      </AnimatePresence>
    </motion.div>
  );
}
