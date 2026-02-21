import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@hooks/useAuth';
import Loader from './Loader';

/**
 * PublicRoute — the inverse of ProtectedRoute.
 *
 * Prevents authenticated users from reaching login / register pages.
 * While the session-restore call is in flight (`isLoading`) we show
 * a full-screen loader instead of rendering the auth form, so the user
 * never sees a flash of the login page before being redirected.
 *
 * Usage in App.jsx:
 *   <Route element={<PublicRoute />}>
 *     <Route path="/login"    element={<Login />} />
 *     <Route path="/register" element={<Register />} />
 *   </Route>
 *
 * Optional `redirectTo` prop (default "/dashboard") lets you customise the
 * destination for already-authenticated users:
 *   <Route element={<PublicRoute redirectTo="/dashboard" />}>
 *     ...
 *   </Route>
 */
export default function PublicRoute({ redirectTo = '/dashboard' }) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  // Wait for the initial /me session-restore so we don't flash the login form
  if (isLoading) return <Loader fullScreen />;

  // Authenticated → bounce to the intended destination (or default)
  if (isAuthenticated) {
    // Respect the `from` state set by ProtectedRoute so deep-links still work
    const destination = location.state?.from?.pathname ?? redirectTo;
    return <Navigate to={destination} replace />;
  }

  return <Outlet />;
}
