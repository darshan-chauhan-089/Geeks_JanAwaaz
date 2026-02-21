import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@hooks/useAuth';
import Loader from './Loader';

/**
 * ProtectedRoute
 *
 * Redirects unauthenticated users to /login, preserving the attempted URL
 * so they are returned there after a successful login.
 *
 * Usage in App.jsx:
 *   <Route element={<ProtectedRoute />}>
 *     <Route path="/dashboard" element={<Dashboard />} />
 *   </Route>
 *
 * Optional `roles` prop restricts to specific user roles:
 *   <Route element={<ProtectedRoute roles={['admin', 'official']} />}>
 *     ...
 *   </Route>
 *
 * Optional `redirectTo` prop customises the not-found / unauthorized redirect:
 *   <Route element={<ProtectedRoute roles={['admin']} redirectTo="/dashboard" />}>
 *     ...
 *   </Route>
 */
export default function ProtectedRoute({ roles, redirectTo = '/404' }) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  // Wait for the session-restore call (/auth/me) to complete before deciding
  if (isLoading) return <Loader fullScreen />;

  // Not logged in → send to /login, remember where they were trying to go
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Role-based guard — wrong role → configurable redirect (default /404)
  if (roles && roles.length > 0 && !roles.includes(user?.role)) {
    return <Navigate to={redirectTo} replace />;
  }

  return <Outlet />;
}
