export default function AdminSidebar({ activeFilter, onFilterChange }) {
  const navItems = [
    { key: 'Verified', label: 'All Verified Issues', icon: 'checklist' },
    { key: 'In Progress', label: 'In Progress', icon: 'pending_actions' },
    { key: 'Resolved', label: 'Resolved', icon: 'check_circle' },
    { key: 'Rejected', label: 'Rejected', icon: 'cancel' },
    { key: 'all', label: 'All Issues', icon: 'view_list' },
  ];

  return (
    <aside className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex-shrink-0 flex flex-col p-4">
      <nav className="space-y-1 flex-1">
        {navItems.map((item) => {
          const isActive = activeFilter === item.key;
          return (
            <button
              type="button"
              key={item.key}
              onClick={() => onFilterChange(item.key)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left ${
                isActive
                  ? 'bg-primary text-white font-medium shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-primary/5 hover:text-primary'
              }`}
            >
              <span className="material-symbols-outlined">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          );
        })}

        <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800" />
      </nav>

      <div className="mt-auto p-4 bg-primary/5 rounded-xl">
        <p className="text-xs font-bold text-primary uppercase tracking-wider mb-2">System Status</p>
        <div className="flex items-center gap-2">
          <span className="size-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-sm text-slate-600 dark:text-slate-400">All services online</span>
        </div>
      </div>
    </aside>
  );
}
