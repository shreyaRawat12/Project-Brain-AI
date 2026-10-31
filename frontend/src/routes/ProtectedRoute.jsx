import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Development-only bypass: allow rendering the existing app without an auth session.
// Never active in production builds.
const DEV_AUTH_BYPASS = import.meta.env.DEV;

export default function ProtectedRoute() {
  const { user, loading } = useAuth();
  if (DEV_AUTH_BYPASS) return <Outlet />;
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return <Outlet />;
}
