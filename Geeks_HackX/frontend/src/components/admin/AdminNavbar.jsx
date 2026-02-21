import { Link } from 'react-router-dom';

export default function AdminNavbar({ adminUser, onLogout }) {
  return (
    <header className="sticky top-0 z-50 w-full bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="bg-primary text-white p-2 rounded-lg flex items-center justify-center">
          <span className="material-symbols-outlined text-2xl">account_balance</span>
        </div>
        <Link to="/admin/dashboard" className="text-xl font-bold tracking-tight text-primary">
          CivicPulse
        </Link>
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3 border-r border-slate-200 dark:border-slate-700 pr-6">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold leading-none">{adminUser?.name ?? 'Admin User'}</p>
            <p className="text-xs text-slate-500 mt-1">{adminUser?.designation ?? 'Municipal Oversight'}</p>
          </div>
          <div className="size-10 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden border-2 border-primary/20">
            {adminUser?.avatar ? (
              <img className="w-full h-full object-cover" src={adminUser.avatar} alt="Admin avatar" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-500 dark:text-slate-300 font-bold">
                {(adminUser?.name ?? 'A').charAt(0).toUpperCase()}
              </div>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={onLogout}
          className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 px-4 py-2 rounded-lg transition-colors text-sm font-bold"
        >
          <span className="material-symbols-outlined text-sm">logout</span>
          Logout
        </button>
      </div>
    </header>
  );
}
