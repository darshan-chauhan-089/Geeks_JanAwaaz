export default function IssueDetailModal({ isOpen, issue, onClose, onStatusChange, isUpdating }) {
  if (!isOpen || !issue) return null;

  return (
    <div className="fixed inset-0 z-[60] bg-slate-900/50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xl">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wider text-slate-500">Issue #{issue.publicId || issue._id?.slice(-6)}</p>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">{issue.title}</h3>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="px-6 py-5 space-y-4 text-sm text-slate-600 dark:text-slate-300">
          <p>{issue.description || 'No description provided.'}</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3">
              <p className="text-xs text-slate-500 uppercase">Category</p>
              <p className="font-semibold mt-1">{issue.category || 'General'}</p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3">
              <p className="text-xs text-slate-500 uppercase">Severity</p>
              <p className="font-semibold mt-1 capitalize">{issue.severity || 'medium'}</p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3">
              <p className="text-xs text-slate-500 uppercase">Reporter</p>
              <p className="font-semibold mt-1">{issue.reportedByName || issue.reportedBy?.name || 'Citizen'}</p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3">
              <p className="text-xs text-slate-500 uppercase">Verifications</p>
              <p className="font-semibold mt-1">{issue.verificationCount ?? 0}</p>
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3">
            <p className="text-xs text-slate-500 uppercase">Location</p>
            <p className="font-semibold mt-1">{issue.locationLabel || issue.location?.address || 'Not available'}</p>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex flex-wrap gap-2 justify-end">
          <button
            type="button"
            onClick={() => onStatusChange(issue, 'In Working Progress')}
            disabled={isUpdating}
            className="px-3 py-2 rounded-lg text-xs font-bold bg-amber-100 text-amber-700 hover:bg-amber-200 disabled:opacity-50"
          >
            Mark In Progress
          </button>
          <button
            type="button"
            onClick={() => onStatusChange(issue, 'Issue Resolved')}
            disabled={isUpdating}
            className="px-3 py-2 rounded-lg text-xs font-bold bg-green-100 text-green-700 hover:bg-green-200 disabled:opacity-50"
          >
            Mark Resolved
          </button>
          <button
            type="button"
            onClick={() => onStatusChange(issue, 'Issue Rejected')}
            disabled={isUpdating}
            className="px-3 py-2 rounded-lg text-xs font-bold bg-rose-100 text-rose-700 hover:bg-rose-200 disabled:opacity-50"
          >
            Reject
          </button>
        </div>
      </div>
    </div>
  );
}
