import { Bell } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Topbar() {
  const { user, setRole } = useAuth();
  return (
    <header className="topbar">
      <div style={{ fontWeight: 600, fontSize: 15 }}>Project Brain AI</div>
      <div className="topbar-right">
        <select
          className="role-select"
          value={user.role}
          onChange={(e) => setRole(e.target.value)}
          title="Demo role switcher"
        >
          <option value="Admin">Admin</option>
          <option value="Developer">Developer</option>
        </select>
        <button className="icon-btn" aria-label="Notifications">
          <Bell size={18} />
        </button>
        <div className="user-chip">
          <div className="user-avatar">{user.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}</div>
          <div style={{ lineHeight: 1.2 }}>
            <div style={{ fontSize: 13, fontWeight: 600 }}>{user.name}</div>
            <div style={{ fontSize: 11, color: 'var(--muted)' }}>{user.role}</div>
          </div>
        </div>
      </div>
    </header>
  );
}
