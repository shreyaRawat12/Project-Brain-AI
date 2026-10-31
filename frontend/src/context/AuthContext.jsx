import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as authService from '../services/authService';

const AuthContext = createContext(null);
const TOKEN_KEY = 'pb_auth_token';
const USER_KEY = 'pb_auth_user';
const INTRO_KEY = 'pb_intro_seen';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem(TOKEN_KEY);
    if (!storedToken) {
      setLoading(false);
      return;
    }

    setToken(storedToken);

    authService
      .me(storedToken)
      .then((me) => {
        setUser(me);
        localStorage.setItem(USER_KEY, JSON.stringify(me));
      })
      .catch(() => {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        localStorage.removeItem('pb_auth_session');
        setToken(null);
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const persistSession = (u, t) => {
    setUser(u);
    setToken(t);
    localStorage.setItem(TOKEN_KEY, t);
    localStorage.setItem(USER_KEY, JSON.stringify(u));
  };

  const login = useCallback(async (email, password) => {
    const data = await authService.login({ email, password });
    persistSession(data.user, data.access_token);
    return data.user;
  }, []);

  const signup = useCallback(async (name, email, password) => {
    const data = await authService.signup({ name, email, password });
    persistSession(data.user, data.access_token);
    return data.user;
  }, []);

  const logout = useCallback(async () => {
    const currentToken = localStorage.getItem(TOKEN_KEY);
    await authService.logout(currentToken);
    setUser(null);
    setToken(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem('pb_auth_session');
    localStorage.removeItem(INTRO_KEY);
  }, []);

  const isAdmin = user?.role === 'Admin';

  const introSeen = () => localStorage.getItem(INTRO_KEY) === 'true';
  const markIntroSeen = () => localStorage.setItem(INTRO_KEY, 'true');

  return (
    <AuthContext.Provider value={{ user, token, loading, login, signup, logout, isAdmin, introSeen, markIntroSeen }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}