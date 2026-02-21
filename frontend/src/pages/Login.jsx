import { useEffect, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@hooks/useAuth';
import { validators } from '@utils/validators';
import { authService } from '@services/authService';

/* ── Labelled input ───────────────────────────────────────────────────────── */
function FloatingInput({ id, label, type = 'text', value, onChange, autoComplete, rightSlot }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={id}
        className="text-sm font-medium text-slate-700 dark:text-slate-300"
      >
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          name={id}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={label}
          autoComplete={autoComplete}
          className="block w-full px-4 py-3 text-slate-900 dark:text-white bg-[#f6f6f8] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e3b8a]/20 focus:border-[#1e3b8a] transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
        />
        {rightSlot && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">{rightSlot}</div>
        )}
      </div>
    </div>
  );
}

export default function Login() {
  const { user, login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  const from = location.state?.from?.pathname || '/dashboard';
  const modeFromQuery = searchParams.get('mode') === 'signup' ? 'signup' : 'login';

  // Errors forwarded by OAuth callback redirect (?error=oauth_failed)
  const oauthError = searchParams.get('error') === 'oauth_failed'
    ? 'Google sign-in failed. Please try again or use email & password.'
    : null;

  const [mode, setMode]           = useState(modeFromQuery);
  const [showPw, setShowPw]       = useState(false);
  const [loading, setLoading]     = useState(false);
  const [apiError, setApiError]   = useState(oauthError ?? '');
  const [noAccount, setNoAccount] = useState(false);
  const [errors, setErrors]       = useState({});

  const [form, setForm] = useState({
    name: '', email: '', password: '', confirmPassword: '', role: 'citizen',
  });

  useEffect(() => {
    setMode(modeFromQuery);
  }, [modeFromQuery]);

  const switchMode = (nextMode) => {
    setMode(nextMode);
    const nextParams = new URLSearchParams(searchParams);
    if (nextMode === 'signup') nextParams.set('mode', 'signup');
    else nextParams.delete('mode');
    setSearchParams(nextParams, { replace: true });
  };

  if (user) return <Navigate to={from} replace />;

  const handle = (e) =>
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const clearErr = (field) =>
    setErrors((p) => ({ ...p, [field]: null }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');

    const rules =
      mode === 'login'
        ? {
            email:    () => validators.email(form.email),
            password: () => validators.required(form.password, 'Password'),
          }
        : {
            name:            () => validators.required(form.name, 'Full name'),
            email:           () => validators.email(form.email),
            password:        () => validators.password(form.password),
            confirmPassword: () => validators.confirmPassword(form.confirmPassword, form.password),
          };

    const errs = validators.runAll(rules);
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    setNoAccount(false);
    try {
      if (mode === 'login') {
        await login({ email: form.email, password: form.password });
      } else {
        await register({
          name: form.name,
          email: form.email,
          password: form.password,
          confirmPassword: form.confirmPassword,
          role: form.role,
        });
      }
      navigate(from, { replace: true });
    } catch (err) {
      const msg = err.message || (mode === 'login' ? 'Login failed.' : 'Registration failed.');
      if (mode === 'login' && (msg.toLowerCase().includes('no account') || msg.toLowerCase().includes('sign up'))) {
        setNoAccount(true);
      }
      setApiError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full font-display">
      {/* ── Left branding panel ── */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-[#1e3b8a] overflow-hidden flex-col justify-between p-12 text-white">
        <div className="z-10">
          <Link to="/" className="flex items-center gap-3 mb-12">
            <div className="bg-white/10 p-2 rounded-lg backdrop-blur-md">
              <span className="material-symbols-outlined" style={{ fontSize: 32 }}>location_city</span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight">JanAwaaz</h2>
          </Link>
          <div className="max-w-md">
            <h1 className="text-5xl font-bold leading-tight mb-6">Building a better community, together.</h1>
            <p className="text-xl text-blue-100 font-light leading-relaxed">
              Join your local civic initiative and track community improvements in real-time.
              Secure, transparent, and community-driven.
            </p>
          </div>
        </div>

        {/* Dot grid bg */}
        <div
          className="absolute inset-0 z-0 opacity-20 pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.1) 1px, transparent 0)', backgroundSize: '40px 40px' }}
        />

        <div className="relative z-10">
          <div className="flex -space-x-3 mb-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="size-10 rounded-full border-2 border-white/20 bg-white/10" />
            ))}
            <div className="size-10 rounded-full border-2 border-white/20 bg-blue-600 flex items-center justify-center text-xs font-bold">+12k</div>
          </div>
          <p className="text-sm font-medium text-blue-200 uppercase tracking-widest">Active citizens in your area</p>
        </div>
      </div>

      {/* ── Right auth form ── */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 bg-white dark:bg-[#121620]">
        <div className="w-full max-w-[440px] space-y-8">
          <div className="text-center lg:text-left">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Get Started</h2>
            <p className="mt-2 text-slate-500 dark:text-slate-400">Access your local government dashboard</p>
          </div>

          {/* Mode toggle */}
          <div className="bg-[#f6f6f8] dark:bg-slate-800/50 p-1.5 rounded-xl flex items-center">
            {['login', 'signup'].map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => { switchMode(m); setErrors({}); setApiError(''); setNoAccount(false); }}
                className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
                  mode === m
                    ? 'bg-white dark:bg-slate-700 shadow-sm text-[#1e3b8a] dark:text-white'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
                }`}
              >
                {m === 'login' ? 'Login' : 'Sign Up'}
              </button>
            ))}
          </div>

          {/* API error */}
          {apiError && (
            <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg text-sm">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined flex-shrink-0" style={{ fontSize: 18 }}>error</span>
                <span>{apiError}</span>
              </div>
              {noAccount && (
                <button
                  type="button"
                  onClick={() => { switchMode('signup'); setApiError(''); setNoAccount(false); setErrors({}); }}
                  className="mt-2 w-full text-center bg-[#1e3b8a] text-white text-sm font-bold py-2 rounded-lg hover:bg-[#1e3b8a]/90 transition-colors"
                >
                  Create a new account →
                </button>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            {/* Name (signup only) */}
            {mode === 'signup' && (
              <div>
                <FloatingInput
                  id="name"
                  label="Full Name"
                  value={form.name}
                  autoComplete="name"
                  onChange={(e) => { handle(e); clearErr('name'); }}
                />
                {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
              </div>
            )}

            {/* Email */}
            <div>
              <FloatingInput
                id="email"
                label="Email Address"
                type="email"
                value={form.email}
                autoComplete="email"
                onChange={(e) => { handle(e); clearErr('email'); }}
              />
              {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
            </div>

            {/* Password */}
            <div>
              <FloatingInput
                id="password"
                label="Password"
                type={showPw ? 'text' : 'password'}
                value={form.password}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                onChange={(e) => { handle(e); clearErr('password'); }}
                rightSlot={
                  <button
                    type="button"
                    onClick={() => setShowPw((p) => !p)}
                    className="text-slate-400 hover:text-[#1e3b8a]"
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 22 }}>
                      {showPw ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                }
              />
              {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password}</p>}
            </div>

            {/* Confirm password (signup only) */}
            {mode === 'signup' && (
              <div>
                <FloatingInput
                  id="confirmPassword"
                  label="Confirm Password"
                  type="password"
                  value={form.confirmPassword}
                  autoComplete="new-password"
                  onChange={(e) => { handle(e); clearErr('confirmPassword'); }}
                />
                {errors.confirmPassword && <p className="mt-1 text-xs text-red-600">{errors.confirmPassword}</p>}
              </div>
            )}

            {/* Role (signup only) */}
            {mode === 'signup' && (
              <div>
                <label htmlFor="role" className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Role
                </label>
                <select
                  id="role"
                  name="role"
                  value={form.role}
                  onChange={handle}
                  className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-transparent focus:outline-none focus:ring-2 focus:ring-[#1e3b8a]/20 focus:border-[#1e3b8a]"
                >
                  <option value="citizen">Citizen</option>
                  <option value="official">Official</option>
                </select>
              </div>
            )}

            {/* Login extras */}
            {mode === 'login' && (
              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="rounded border-slate-300 dark:border-slate-700 text-[#1e3b8a] focus:ring-[#1e3b8a]" />
                  <span className="text-slate-600 dark:text-slate-400">Remember me</span>
                </label>
                <a href="#" className="text-[#1e3b8a] font-semibold hover:underline">Forgot password?</a>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#1e3b8a] hover:bg-[#1e3b8a]/90 text-white font-bold py-4 rounded-lg shadow-lg shadow-[#1e3b8a]/20 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading ? (
                <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
              ) : (
                <>
                  {mode === 'login' ? 'Sign In' : 'Create Account'}
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_forward</span>
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative py-2">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200 dark:border-slate-800" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white dark:bg-[#121620] px-2 text-slate-500">Or continue with</span>
            </div>
          </div>

          {/* OAuth buttons */}
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => authService.loginWithGoogle()}
              className="flex items-center justify-center gap-2 px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <svg className="size-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              <span className="text-sm font-medium">Google</span>
            </button>
            <button
              type="button"
              onClick={() => navigate('/admin/login')}
              className="flex items-center justify-center gap-2 px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <span className="material-symbols-outlined" style={{ fontSize: 20, color: '#333' }}>account_balance</span>
              <span className="text-sm font-medium text-slate-900 dark:text-white">Admin</span>
            </button>
          </div>

          {/* Trust badges */}
          <div className="pt-4 flex flex-col items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 dark:bg-green-900/20 rounded-full border border-green-100 dark:border-green-900/30">
              <span className="material-symbols-outlined text-green-600" style={{ fontSize: 16 }}>verified_user</span>
              <span className="text-[11px] font-bold text-green-700 dark:text-green-400 uppercase tracking-wider">Secure &amp; Encrypted</span>
            </div>
            <div className="flex gap-4 text-xs text-slate-400 dark:text-slate-600">
              <Link to="/privacy" className="hover:text-[#1e3b8a] underline-offset-4 hover:underline">Privacy Policy</Link>
              <Link to="/terms" className="hover:text-[#1e3b8a] underline-offset-4 hover:underline">Terms of Service</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

