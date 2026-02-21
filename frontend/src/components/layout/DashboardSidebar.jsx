import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@hooks/useAuth';

const CATEGORIES = [
  { icon: 'grid_view',         label: 'All Issues',    value: '' },
  { icon: 'engineering',       label: 'Infrastructure', value: 'infrastructure' },
  { icon: 'water_drop',        label: 'Water',          value: 'water' },
  { icon: 'bolt',              label: 'Electricity',    value: 'electricity' },
  { icon: 'cleaning_services', label: 'Sanitation',     value: 'sanitation' },
  { icon: 'shield',            label: 'Safety',         value: 'safety' },
  { icon: 'park',              label: 'Environment',    value: 'environment' },
  { icon: 'road',              label: 'Road',           value: 'road' },
  { icon: 'category',          label: 'Other',          value: 'other' },
];

const COLOR_MAP = {
  blue:   'bg-blue-50   text-blue-700   dark:bg-blue-900/30   dark:text-blue-300',
  green:  'bg-green-50  text-green-700  dark:bg-green-900/30  dark:text-green-300',
  purple: 'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  red:    'bg-red-50    text-red-700    dark:bg-red-900/30    dark:text-red-300',
};

function ActivityPill({ icon, label, value, loading, color = 'blue' }) {
  return (
    <div className={`rounded-xl p-3 flex flex-col gap-1 ${COLOR_MAP[color]}`}>
      <span className="material-symbols-outlined" style={{ fontSize: 18 }}>{icon}</span>
      {loading ? (
        <div className="h-5 w-8 rounded bg-current opacity-20 animate-pulse" />
      ) : (
        <span className="text-xl font-bold leading-none">{value ?? 0}</span>
      )}
      <span className="text-[11px] font-medium opacity-80">{label}</span>
    </div>
  );
}

/**
 * Dashboard sidebar — 2 sections: Categories, My Activity.
 *
 * Props:
 *  - activeCategory  {string}   current category filter (backend enum value)
 *  - setCategory     {fn}
 *  - userStats       {object}   { issueCount, resolvedCount }
 *  - statsLoading    {boolean}
 */
export default function DashboardSidebar({
  activeCategory = '',
  setCategory,
  userStats = null,
  statsLoading = false,
}) {
  const { logout } = useAuth();
  const navigate   = useNavigate();

  async function handleLogout() {
    await logout();
    navigate('/');
  }

  return (
    <aside className="w-64 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-y-auto hidden lg:flex flex-col">
      <div className="p-5 space-y-7 flex-1">

        {/* ── SECTION 1: CATEGORIES ─────────────────────────── */}
        <div>
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3 px-1">
            Categories
          </h3>
          <nav className="space-y-0.5">
            {CATEGORIES.map(({ icon, label, value }) => (
              <button
                key={value}
                onClick={() => setCategory?.(value)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-left transition-colors ${
                  activeCategory === value
                    ? 'bg-[#1e3b8a]/10 text-[#1e3b8a] dark:text-blue-300'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <span
                  className={`material-symbols-outlined flex-shrink-0 ${
                    activeCategory === value ? 'text-[#1e3b8a] dark:text-blue-300' : 'text-slate-400'
                  }`}
                  style={{ fontSize: 18 }}
                >
                  {icon}
                </span>
                {label}
              </button>
            ))}
          </nav>
        </div>

        {/* ── SECTION 2: MY ACTIVITY ────────────────────────── */}
        <div>
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3 px-1">
            My Activity
          </h3>
          <div className="grid grid-cols-2 gap-2">
            <ActivityPill icon="edit_note" label="Reported" value={userStats?.issueCount}   loading={statsLoading} color="blue"  />
            <ActivityPill icon="task_alt"  label="Resolved" value={userStats?.resolvedCount} loading={statsLoading} color="green" />
          </div>
        </div>
      </div>

      {/* ── BOTTOM ACTIONS ──────────────────────────────────── */}
      <div className="p-4 space-y-2 border-t border-slate-100 dark:border-slate-800">
        <Link
          to="/issues/new"
          className="w-full flex items-center justify-center gap-2 bg-[#1e3b8a] text-white py-2.5 rounded-lg font-bold text-sm hover:bg-[#1e3b8a]/90 transition-all shadow-lg shadow-[#1e3b8a]/20"
        >
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add_circle</span>
          Report New Issue
        </Link>
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 text-slate-500 hover:text-red-600 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>logout</span>
          Sign Out
        </button>
      </div>
    </aside>
  );
}
