import { Navigate } from 'react-router-dom';

/**
 * Register is folded into the Login page's signup tab.
 * Any direct link to /register bounces cleanly to /login?mode=signup.
 */
export default function Register() {
  return <Navigate to="/login?mode=signup" replace />;
}
