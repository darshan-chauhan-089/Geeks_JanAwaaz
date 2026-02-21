import { Link } from 'react-router-dom';

function severityClasses(severity) {
  const key = String(severity || '').toLowerCase();
  const map = {
    emergency: 'bg-red-100 text-red-700',
    high: 'bg-orange-100 text-orange-700',
    medium: 'bg-yellow-100 text-yellow-700',
    low: 'bg-blue-100 text-blue-700',
  };
  return map[key] || 'bg-slate-100 text-slate-600';
}

function TableSkeletonRows() {
  return Array.from({ length: 5 }).map((_, index) => (
    <tr key={`skeleton-${index}`} className="animate-pulse">
      <td className="px-4 py-3"><div className="h-4 w-20 bg-slate-200 rounded" /></td>
      <td className="px-4 py-3"><div className="h-4 w-48 bg-slate-200 rounded" /></td>
      <td className="px-4 py-3"><div className="h-4 w-24 bg-slate-200 rounded" /></td>
      <td className="px-4 py-3"><div className="h-5 w-20 bg-slate-200 rounded-full" /></td>
      <td className="px-4 py-3"><div className="h-4 w-24 bg-slate-200 rounded" /></td>
      <td className="px-4 py-3"><div className="h-4 w-16 bg-slate-200 rounded" /></td>
    </tr>
  ));
}

export default function IssueTable({
  issues,
  filters,
  onFilterChange,
  onViewDetails,
  isLoading,
}) {
  return (
    <section className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm mb-8">
      <div className="mb-4 flex flex-wrap items-center gap-4">
        <div className="flex-1 min-w-[280px]">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">search</span>
            <input
              type="text"
              value={filters.search}
              onChange={(event) => onFilterChange({ search: event.target.value })}
              placeholder="Search issues by title, ID, or reporter..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border-none rounded-lg focus:ring-2 focus:ring-primary text-sm"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={filters.severity}
            onChange={(event) => onFilterChange({ severity: event.target.value })}
            className="bg-slate-50 dark:bg-slate-800 border-none rounded-lg text-sm px-4 py-2 focus:ring-2 focus:ring-primary"
          >
            <option value="all">Severity: All</option>
            <option value="emergency">Emergency</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          <select
            value={filters.category}
            onChange={(event) => onFilterChange({ category: event.target.value })}
            className="bg-slate-50 dark:bg-slate-800 border-none rounded-lg text-sm px-4 py-2 focus:ring-2 focus:ring-primary"
          >
            <option value="all">Category: All</option>
            <option value="Infrastructure">Infrastructure</option>
            <option value="Sanitation">Sanitation</option>
            <option value="Safety">Safety</option>
            <option value="Utilities">Utilities</option>
          </select>

          <select
            value={filters.sortBy}
            onChange={(event) => onFilterChange({ sortBy: event.target.value })}
            className="bg-slate-50 dark:bg-slate-800 border-none rounded-lg text-sm px-4 py-2 focus:ring-2 focus:ring-primary"
          >
            <option value="date">Sort by: Date</option>
            <option value="verifications">Sort by: Verification Count</option>
            <option value="severity">Sort by: Severity</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[#f6f6f8] dark:bg-slate-800 text-left">
              <th className="px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wider">Issue ID</th>
              <th className="px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wider">Title</th>
              <th className="px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wider">Category</th>
              <th className="px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wider">Severity</th>
              <th className="px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wider">Status</th>
              <th className="px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wider">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {isLoading ? (
              <TableSkeletonRows />
            ) : issues.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-slate-500">No issues found for selected filters.</td>
              </tr>
            ) : (
              issues.map((issue) => (
                <tr key={issue._id}>
                  <td className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">#{issue.publicId || issue._id?.slice(-6)}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{issue.title}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{issue.category || 'General'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${severityClasses(issue.severity)}`}>
                      {issue.severity || 'medium'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400 capitalize">{(issue.status || 'pending').replace(/_/g, ' ')}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => onViewDetails(issue)}
                        className="text-primary hover:underline font-medium"
                      >
                        View
                      </button>
                      {issue._id && (
                        <Link to={`/issues/${issue._id}`} className="text-slate-500 hover:text-primary transition-colors">
                          Open
                        </Link>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
