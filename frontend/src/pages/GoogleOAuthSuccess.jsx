import { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@hooks/useAuth';
import Loader from '@components/common/Loader';

/**
 * GoogleOAuthSuccess
 *
 * Landing page for the Google OAuth callback flow.
 *
 * Flow:
 *   1. User clicks "Continue with Google" on the Login page.
 *   2. Browser is redirected to  GET /api/v1/auth/google  (backend).
 *   3. After Google verifies, the backend sets the httpOnly JWT cookie and
 *      redirects to:  CLIENT_URL/auth/google/success?verified=true|false
 *   4. This component mounts.  AuthProvider is already in the tree and
 *      fires its startup  GET /auth/me  call (reads the fresh cookie).
 *   5. Once isLoading settles, we navigate the user to their destination.
 *
 * No manual token wiring needed — the httpOnly cookie is read automatically.
 */
export default function GoogleOAuthSuccess() {
  const { isAuthenticated, isLoading, refreshSession } = useAuth();
  const navigate      = useNavigate();
  const [searchParams] = useSearchParams();

  // Guard against the edge-case where the component remounts (StrictMode double
  // effect) and fires a second refreshSession while the first is still in flight.
  const refreshedRef = useRef(false);

  useEffect(() => {
    // If AuthProvider already resolved the session (cookie valid), just navigate.
    if (!isLoading) {
      navigate(isAuthenticated ? '/dashboard' : '/login?error=oauth_failed', { replace: true });
      return;
    }

    // If still loading (e.g., page hard-refresh), manually call refreshSession
    // once to accelerate the resolution.
    if (!refreshedRef.current) {
      refreshedRef.current = true;
      refreshSession()
        .then((user) => {
          navigate(user ? '/dashboard' : '/login?error=oauth_failed', { replace: true });
        })
        .catch(() => {
          navigate('/login?error=oauth_failed', { replace: true });
        });
    }
  }, [isLoading, isAuthenticated, navigate, refreshSession]);

  // Show a branded full-screen loader while the session resolves.
  // Never render the login form on this route to avoid flicker.
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-[#f6f6f8] font-display">
      <div className="flex items-center gap-3 mb-2">
        <div className="bg-[#1e3b8a] p-3 rounded-xl shadow-md">
          <span className="material-symbols-outlined text-white" style={{ fontSize: 28 }}>
            location_city
          </span>
        </div>
        <span className="text-2xl font-bold text-slate-900 tracking-tight">JanAwaaz</span>
      </div>

      <Loader />

      <p className="text-sm text-slate-500 mt-2">
        {searchParams.get('verified') === 'true'
          ? 'Verified account — signing you in…'
          : 'Completing sign-in…'}
      </p>
    </div>
  );
}
