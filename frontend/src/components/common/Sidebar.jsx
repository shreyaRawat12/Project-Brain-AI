import { NavLink } from 'react-router-dom';
import { LayoutDashboard, FolderKanban, BookOpen, Bot } from 'lucide-react';

const navItems = [
  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { label: 'Projects', path: '/projects', icon: FolderKanban },
  { label: 'Project Knowledge', path: '/project-knowledge', icon: BookOpen },
  { label: 'AI Assistant', path: '/assistant', icon: Bot },
];

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-dot">PB</div>
        <span>Project Brain</span>
      </div>
      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
            >
              <Icon />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
      <div className="sidebar-footer">
        <span style={{ fontSize: 12, color: 'var(--muted)' }}>v1.0.0</span>
      </div>
    </aside>
  );
}
