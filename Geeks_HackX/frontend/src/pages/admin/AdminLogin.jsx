import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { adminService } from '@services/adminService';

export default function AdminLogin() {
  const navigate = useNavigate();
  const location = useLocation();
  const adminUser = adminService.getAdminUser();

  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const from = location.state?.from?.pathname || '/admin/dashboard';

  if (adminService.isAdminAuthenticated() && adminUser?.role === 'admin') {
    return <Navigate to={from} replace />;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await adminService.loginAdmin(form);
      if (user?.role !== 'admin') {
        throw new Error('Access denied. Admin credentials required.');
      }
      navigate('/admin/dashboard', { replace: true });
    } catch (err) {
      setError(err.message || 'Unable to login. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-background-light dark:bg-background-dark font-display min-h-screen flex flex-col">
      <div className="flex-1 flex flex-col justify-center items-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col items-center">
          <div className="flex items-center gap-2 mb-2">
            <div className="text-primary">
              <svg className="size-8" fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path
                  clipRule="evenodd"
                  d="M12.0799 24L4 19.2479L9.95537 8.75216L18.04 13.4961L18.0446 4H29.9554L29.96 13.4961L38.0446 8.75216L44 19.2479L35.92 24L44 28.7521L38.0446 39.2479L29.96 34.5039L29.9554 44H18.0446L18.04 34.5039L9.95537 39.2479L4 28.7521L12.0799 24Z"
                  fill="currentColor"
                  fillRule="evenodd"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 uppercase tracking-widest">JanAwaaz</h1>
          </div>
          <p className="text-slate-600 dark:text-slate-400 font-medium">Administrative Portal</p>
        </div>

        <div className="w-full max-w-md bg-white dark:bg-slate-900 shadow-xl rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800">
          <div className="p-8">
            <div className="flex justify-center mb-6">
              <div className="size-16 bg-primary/10 dark:bg-primary/20 rounded-full flex items-center justify-center text-primary">
                <span className="material-symbols-outlined text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>shield_person</span>
              </div>
            </div>

            <div className="text-center mb-8">
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Official Login</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Authorized Personnel Only</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1" htmlFor="email">Email Address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="material-symbols-outlined text-slate-400 text-xl">mail</span>
                  </div>
                  <input
                    id="email"
                    type="email"
                    value={form.email}
                    onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
                    required
                    placeholder="admin@civicpulse.gov"
                    className="block w-full pl-10 pr-3 py-3 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all sm:text-sm"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300" htmlFor="password">Password</label>
                  <Link to="/login" className="text-xs font-medium text-primary hover:underline">Forgot password?</Link>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="material-symbols-outlined text-slate-400 text-xl">lock</span>
                  </div>
                  <input
                    id="password"
                    type="password"
                    value={form.password}
                    onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
                    required
                    placeholder="••••••••"
                    className="block w-full pl-10 pr-3 py-3 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all sm:text-sm"
                  />
                </div>
              </div>

              {error && (
                <p className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors disabled:opacity-60"
              >
                {loading ? 'Signing in...' : 'Login to Dashboard'}
              </button>
            </form>

            <div className="relative my-8">
              <div aria-hidden="true" className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200 dark:border-slate-700" />
              </div>
              <div className="relative flex justify-center text-sm uppercase">
                <span className="px-2 bg-white dark:bg-slate-900 text-slate-500 font-medium">Identity Provider</span>
              </div>
            </div>

            <Link
              to="/admin/login"
              className="w-full flex items-center justify-center gap-3 py-3 px-4 border-2 border-primary rounded-lg text-sm font-bold text-primary hover:bg-primary/5 transition-colors mb-6"
            >
              <span className="material-symbols-outlined">verified_user</span>
              Login as Government Authority (GovID)
            </Link>

            <div className="text-center">
              <Link to="/login" className="inline-flex items-center gap-1 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-primary transition-colors group">
                <span className="material-symbols-outlined text-lg group-hover:-translate-x-1 transition-transform">arrow_back</span>
                Back to User Login
              </Link>
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/50 px-8 py-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-center gap-2">
            <span className="material-symbols-outlined text-slate-400 text-sm">info</span>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Trouble logging in? <Link to="/login" className="underline text-primary">Contact IT Support</Link>
            </p>
          </div>
        </div>

        <div className="mt-8 text-center max-w-sm">
          <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-relaxed uppercase tracking-wider">
            Unauthorized access to this system is strictly prohibited and subject to criminal prosecution.
            All activities on this system are logged and monitored.
          </p>
        </div>
      </div>

      <footer className="py-6 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 mt-auto">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center text-xs text-slate-500 dark:text-slate-400">
          <p>© 2026 CivicPulse Governance Systems. All Rights Reserved.</p>
          <div className="flex gap-4 mt-2 md:mt-0">
            <Link to="/privacy" className="hover:text-primary">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-primary">Terms of Service</Link>
            <Link to="/security" className="hover:text-primary">Security Disclosure</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
