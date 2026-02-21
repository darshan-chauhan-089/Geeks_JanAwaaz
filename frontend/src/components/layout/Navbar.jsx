import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '@hooks/useAuth';

/**
 * Public top navigation bar — Landing page, Profile, etc.
 * Adapts CTA based on auth state.
 */
export default function Navbar() {
  const { user } = useAuth();

  return (
    <nav className="sticky top-0 z-50 bg-white/80 dark:bg-[#121620]/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="bg-[#1e3b8a] p-1.5 rounded-lg text-white">
              <span className="material-symbols-outlined block" style={{ fontSize: 24 }}>location_city</span>
            </div>
            <span className="text-xl font-bold tracking-tight text-[#1e3b8a]">JanAwaaz</span>
          </Link>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#how-it-works" className="text-sm font-medium hover:text-[#1e3b8a] transition-colors">
              How It Works
            </a>
            <a href="#explore" className="text-sm font-medium hover:text-[#1e3b8a] transition-colors">
              Explore Issues
            </a>
            <a href="#stats" className="text-sm font-medium hover:text-[#1e3b8a] transition-colors">
              Statistics
            </a>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-4">
            <button className="hidden sm:flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-[#1e3b8a]">
              <span className="material-symbols-outlined" style={{ fontSize: 20 }}>search</span>
              Search
            </button>

            {user ? (
              <div className="flex items-center gap-3">
                <Link
                  to="/dashboard"
                  className="text-sm font-medium text-[#1e3b8a] hover:underline"
                >
                  Dashboard
                </Link>
                <Link
                  to="/profile"
                  className="h-8 w-8 rounded-full bg-[#1e3b8a]/10 border border-[#1e3b8a]/20 flex items-center justify-center overflow-hidden"
                >
                  {user.avatar?.url ? (
                    <img src={user.avatar.url} alt={user.name} className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-[#1e3b8a] text-xs font-bold uppercase">
                      {user.name?.[0] ?? 'U'}
                    </span>
                  )}
                </Link>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="border border-[#1e3b8a] text-[#1e3b8a] px-4 py-2 rounded-lg text-sm font-bold hover:bg-[#1e3b8a]/5 transition-all"
                >
                  Login
                </Link>
                <Link
                  to="/login?mode=signup"
                  className="bg-[#1e3b8a] text-white px-4 py-2 rounded-lg text-sm font-bold shadow-lg shadow-[#1e3b8a]/20 hover:bg-[#1e3b8a]/90 transition-all"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
