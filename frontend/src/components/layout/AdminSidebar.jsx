import { NavLink, Link } from 'react-router-dom';

const NAV_ITEMS = [
  { icon: 'dashboard', label: 'Dashboard Overview', to: '/admin' },
  { icon: 'report_problem', label: 'Issues Management', to: '/admin/issues' },
  { icon: 'group', label: 'User Reports', to: '/admin/users' },
  { icon: 'analytics', label: 'City Analytics', to: '/admin/analytics' },
  { icon: 'settings', label: 'Settings', to: '/admin/settings', divider: true },
];

/**
 * Admin panel sidebar — primary-colored, full-height.
 * Accepts `admin` prop: { name, email, avatar }.
 */
export default function AdminSidebar({ admin }) {
  return (
    <aside className="w-72 bg-[#1e3b8a] text-white flex flex-col shrink-0">
      {/* Logo */}
      <div className="p-6 flex items-center gap-3">
        <div className="bg-white/20 p-2 rounded-lg">
          <span className="material-symbols-outlined text-white" style={{ fontSize: 24 }}>account_balance</span>
        </div>
        <div>
          <h1 className="text-lg font-bold leading-none">City Admin</h1>
          <p className="text-white/60 text-xs font-medium uppercase tracking-wider mt-1">Civic Portal</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-4 space-y-1">
        {NAV_ITEMS.map(({ icon, label, to, divider }) => (
          <div key={to}>
            {divider && (
              <div className="pt-4 pb-2 px-3">
                <p className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em]">System</p>
              </div>
            )}
            <NavLink
              to={to}
              end={to === '/admin'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-white/10 text-white'
                    : 'text-white/70 hover:bg-white/10 hover:text-white'
                }`
              }
            >
              <span className="material-symbols-outlined" style={{ fontSize: 24 }}>{icon}</span>
              <span className="font-medium text-sm">{label}</span>
            </NavLink>
          </div>
        ))}
      </nav>

      {/* User profile footer */}
      <div className="p-4 mt-auto border-t border-white/10">
        <div className="flex items-center gap-3 p-2 rounded-lg bg-white/5">
          <div
            className="w-10 h-10 rounded-full bg-cover bg-center border-2 border-white/20 shrink-0 bg-white/20"
            style={admin?.avatar ? { backgroundImage: `url('${admin.avatar}')` } : {}}
          />
          <div className="overflow-hidden">
            <p className="text-sm font-semibold truncate">{admin?.name ?? 'Admin'}</p>
            <p className="text-xs text-white/50 truncate">{admin?.role ?? 'Super Admin'}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
