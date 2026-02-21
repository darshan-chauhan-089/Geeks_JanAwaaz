function statusBadge(status) {
  const key = String(status || '').trim().toLowerCase().replace(/\s+/g, '_');
  const map = {
    in_progress: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
    resolved: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
    rejected: 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400',
    verified: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
    pending: 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400',
  };
  return map[key] || map.pending;
}

function severityBadge(severity) {
  const key = (severity || '').toLowerCase();
  const map = {
    emergency: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
    high: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400',
    medium: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400',
    low: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
  };
  return map[key] || map.medium;
}

export default function IssueCard({ issue, onViewDetails }) {
  return (
    <article className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden hover:shadow-lg transition-shadow">
      <div className="p-5">
        <div className="flex justify-between items-start mb-4">
          <span className={`px-2.5 py-1 text-[10px] font-black uppercase tracking-widest rounded-full ${severityBadge(issue.severity)}`}>
            {issue.severity || 'Medium'}
          </span>
          <span className="text-xs text-slate-400">ID: #{issue.publicId || issue._id?.slice(-6)}</span>
        </div>

        <h3 className="text-lg font-bold mb-2 leading-snug line-clamp-1">{issue.title}</h3>

        <div className="space-y-2 mb-6 text-sm text-slate-600 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">location_on</span>
            <span className="truncate">{issue.locationLabel || issue.location?.address || 'Location unavailable'}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">category</span>
            <span>{issue.category || 'General'}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">person</span>
            <span>Reported by: {issue.reportedByName || issue.reportedBy?.name || 'Citizen'}</span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-1 text-primary">
            <span className="material-symbols-outlined text-sm">verified_user</span>
            <span className="text-xs font-bold">{issue.verificationCount ?? 0} Verifications</span>
          </div>
          <button
            type="button"
            onClick={() => onViewDetails(issue)}
            className={`px-3 py-1 text-xs font-bold rounded-lg capitalize ${statusBadge(issue.status)}`}
          >
            {(issue.status || 'pending').replace(/_/g, ' ')}
          </button>
        </div>
      </div>
    </article>
  );
}
