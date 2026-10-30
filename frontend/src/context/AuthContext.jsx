import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

const STORAGE_KEY = 'pb_auth_user';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      // ignore
    }
    return { id: 'u1', name: 'Alex Morgan', email: 'alex@projectbrain.ai', role: 'Admin' };
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  }, [user]);

  const setRole = (role) => setUser((prev) => ({ ...prev, role }));
  const isAdmin = user?.role === 'Admin';

  return (
    <AuthContext.Provider value={{ user, setUser, setRole, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
