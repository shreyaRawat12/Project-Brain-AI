import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../supabase';
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
    let mounted = true;

    async function initSession() {
      if (isSupabaseConfigured && supabase) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user && mounted) {
            const u = {
              id: session.user.id,
              name: session.user.user_metadata?.name || session.user.email?.split('@')[0],
              email: session.user.email,
              role: session.user.user_metadata?.role || 'Developer',
            };
            setUser(u);
            setToken(session.access_token);
            localStorage.setItem(TOKEN_KEY, session.access_token);
            localStorage.setItem(USER_KEY, JSON.stringify(u));
          }
        } catch (e) {
          console.error('Failed to get Supabase session:', e);
        } finally {
          if (mounted) setLoading(false);
        }

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
          if (session?.user) {
            const u = {
              id: session.user.id,
              name: session.user.user_metadata?.name || session.user.email?.split('@')[0],
              email: session.user.email,
              role: session.user.user_metadata?.role || 'Developer',
            };
            setUser(u);
            setToken(session.access_token);
            localStorage.setItem(TOKEN_KEY, session.access_token);
            localStorage.setItem(USER_KEY, JSON.stringify(u));
          } else {
            setUser(null);
            setToken(null);
            localStorage.removeItem(TOKEN_KEY);
            localStorage.removeItem(USER_KEY);
          }
        });

        return () => subscription?.unsubscribe();
      } else {
        const storedToken = localStorage.getItem(TOKEN_KEY);
        if (storedToken) {
          authService
            .me(storedToken)
            .then((me) => {
              if (mounted) {
                setUser(me);
                setToken(storedToken);
              }
            })
            .catch(() => {
              if (mounted) {
                setUser(null);
                setToken(null);
                localStorage.removeItem(TOKEN_KEY);
                localStorage.removeItem(USER_KEY);
              }
            })
            .finally(() => {
              if (mounted) setLoading(false);
            });
        } else {
          setLoading(false);
        }
      }
    }

    initSession();

    return () => {
      mounted = false;
    };
  }, []);

  const signup = useCallback(async (name, email, password) => {
    if (isSupabaseConfigured && supabase) {
      const redirectUrl = `${window.location.origin}/auth/callback`;
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: { name: name.trim() },
          emailRedirectTo: redirectUrl,
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      const requiresVerification = !data.session;
      return {
        user: data.user,
        requiresVerification,
      };
    } else {
      const data = await authService.signup({ name, email, password });
      setUser(data.user);
      setToken(data.access_token);
      localStorage.setItem(TOKEN_KEY, data.access_token);
      localStorage.setItem(USER_KEY, JSON.stringify(data.user));
      return { user: data.user, requiresVerification: false };
    }
  }, []);

  const login = useCallback(async (email, password) => {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        if (error.message?.toLowerCase().includes('email not confirmed')) {
          throw new Error('Please verify your email address before signing in. Check your inbox for the verification link.');
        }
        throw new Error(error.message || 'Invalid email or password.');
      }

      if (!data.session) {
        throw new Error('Authentication failed. No session created.');
      }

      const u = {
        id: data.user.id,
        name: data.user.user_metadata?.name || data.user.email?.split('@')[0],
        email: data.user.email,
        role: data.user.user_metadata?.role || 'Developer',
      };
      setUser(u);
      setToken(data.session.access_token);
      localStorage.setItem(TOKEN_KEY, data.session.access_token);
      localStorage.setItem(USER_KEY, JSON.stringify(u));
      return u;
    } else {
      const data = await authService.login({ email, password });
      setUser(data.user);
      setToken(data.access_token);
      localStorage.setItem(TOKEN_KEY, data.access_token);
      localStorage.setItem(USER_KEY, JSON.stringify(data.user));
      return data.user;
    }
  }, []);

  const forgotPassword = useCallback(async (email) => {
    if (isSupabaseConfigured && supabase) {
      const redirectUrl = `${window.location.origin}/reset-password`;
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: redirectUrl,
      });
      if (error) throw new Error(error.message);
      return true;
    } else {
      throw new Error(
        'Supabase authentication is not configured with an anon key. Please configure VITE_SUPABASE_ANON_KEY to send password reset emails.'
      );
    }
  }, []);

  const resetPassword = useCallback(async (newPassword) => {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (error) throw new Error(error.message);
      return data.user;
    } else {
      throw new Error('Supabase authentication is not configured.');
    }
  }, []);

  const logout = useCallback(async () => {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
    } else {
      const currentToken = localStorage.getItem(TOKEN_KEY);
      await authService.logout(currentToken);
    }
    setUser(null);
    setToken(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(INTRO_KEY);
  }, []);

  const isAdmin = user?.role === 'Admin';
  const introSeen = () => false;
  const markIntroSeen = () => localStorage.setItem(INTRO_KEY, 'true');

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        signup,
        forgotPassword,
        resetPassword,
        logout,
        isAdmin,
        introSeen,
        markIntroSeen,
        isSupabaseConfigured,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
