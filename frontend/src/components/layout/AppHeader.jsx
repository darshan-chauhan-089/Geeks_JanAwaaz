import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@hooks/useAuth';
import NotificationDropdown from './NotificationDropdown';

/**
 * Top header bar for interior app pages (Dashboard, Admin).
 *
 * Props:
 *  - logoTo    {string}  where logo links to
 *  - logoText  {string}  brand text
 *  - navLinks  {Array}   [{ label, to, icon? }]
 */
export default function AppHeader({
  logoTo = '/dashboard',
  logoText = 'JanAwaaz',
  navLinks = [],
}) {
  const { user } = useAuth();

  return (
    <header className="flex h-16 w-full items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-6 shrink-0 z-20">
      {/* Left: logo + nav */}
      <div className="flex items-center gap-8">
        <Link to={logoTo} className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#1e3b8a] text-white">
            <span className="material-symbols-outlined" style={{ fontSize: 24 }}>account_balance</span>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">{logoText}</h2>
        </Link>

        {navLinks.length > 0 && (
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map(({ label, to, icon }) => (
              <NavLink
                key={to}
                to={to}
                end
                className={({ isActive }) =>
                  `flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-[#1e3b8a]/10 text-[#1e3b8a]'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-[#1e3b8a]'
                  }`
                }
              >
                {icon && (
                  <span className="material-symbols-outlined" style={{ fontSize: 17 }}>{icon}</span>
                )}
                {label}
              </NavLink>
            ))}
          </nav>
        )}
      </div>

      {/* Right: search + notifications + avatar */}
      <div className="flex items-center gap-4">
        <div className="relative hidden sm:block">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" style={{ fontSize: 18 }}>
            search
          </span>
          <input
            type="text"
            placeholder="Search issues..."
            className="h-10 w-64 rounded-lg border-none bg-slate-100 dark:bg-slate-800 pl-10 pr-4 text-sm focus:ring-2 focus:ring-[#1e3b8a]/50 transition-all outline-none"
          />
        </div>

        <NotificationDropdown />

        <Link
          to="/profile"
          className="h-10 w-10 rounded-full border-2 border-[#1e3b8a]/20 bg-[#1e3b8a]/10 flex items-center justify-center overflow-hidden"
        >
          {user?.avatar?.url ? (
            <img src={user.avatar.url} alt="Profile" className="h-full w-full object-cover" />
          ) : (
            <span className="text-[#1e3b8a] text-xs font-bold uppercase">
              {user?.name?.[0] ?? 'U'}
            </span>
          )}
        </Link>
      </div>
    </header>
  );
}
