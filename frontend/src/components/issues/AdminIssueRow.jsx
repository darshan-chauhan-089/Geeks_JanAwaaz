import StatusBadge from '@components/ui/StatusBadge';

const CATEGORY_ICONS = {
  'road repair':    { icon: 'construction', bg: 'bg-blue-100 text-blue-600' },
  'street light':   { icon: 'lightbulb',    bg: 'bg-amber-100 text-amber-600' },
  waste:            { icon: 'delete_sweep',  bg: 'bg-red-100 text-red-600' },
  utilities:        { icon: 'water_drop',    bg: 'bg-cyan-100 text-cyan-600' },
  infrastructure:   { icon: 'engineering',   bg: 'bg-slate-100 text-slate-600' },
  environment:      { icon: 'park',          bg: 'bg-green-100 text-green-600' },
  vandalism:        { icon: 'brush',         bg: 'bg-pink-100 text-pink-600' },
};

function getIcon(category = '') {
  const key = category.toLowerCase();
  return (
    CATEGORY_ICONS[key] ?? { icon: 'report_problem', bg: 'bg-slate-100 text-slate-600' }
  );
}

/**
 * AdminIssueRow — one <tr> row in the admin issues table.
 *
 * Props:
 *  - issue         {object}  from API
 *  - onResolve     {fn}      (issueId) called when admin marks resolved
 *  - onDelete      {fn}      (issueId) called when admin deletes
 */
export default function AdminIssueRow({ issue = {}, onResolve, onDelete }) {
  const {
    _id,
    title    = 'Untitled',
    category = 'Other',
    status   = 'Pending',
    createdAt,
    user: reporter,
  } = issue;

  const { icon, bg } = getIcon(category);
  const dateStr = createdAt
    ? new Date(createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    : '—';
  const timeStr = createdAt
    ? new Date(createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
    : '';

  return (
    <tr className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors">
      {/* Issue ID */}
      <td className="px-6 py-4 font-mono text-xs font-bold text-[#1e3b8a]">
        #{typeof _id === 'string' ? _id.slice(-6).toUpperCase() : '——'}
      </td>

      {/* Date */}
      <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
        {dateStr}
        {timeStr && <><br /><span className="text-[10px] text-slate-400">{timeStr}</span></>}
      </td>

      {/* Category */}
      <td className="px-6 py-4">
        <div className="flex items-center gap-2">
          <span className={`size-8 rounded-lg flex items-center justify-center ${bg}`}>
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>{icon}</span>
          </span>
          <span className="text-sm font-semibold capitalize">{category}</span>
        </div>
      </td>

      {/* Reported by */}
      <td className="px-6 py-4">
        <div className="flex items-center gap-2">
          {reporter?.avatar ? (
            <img
              src={reporter.avatar}
              alt={reporter.name}
              className="size-8 rounded-full bg-cover bg-center"
            />
          ) : (
            <div className="size-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600">
              {reporter?.name?.[0] ?? 'U'}
            </div>
          )}
          <div>
            <p className="text-sm font-semibold">{reporter?.name ?? 'Unknown'}</p>
            <p className="text-[10px] text-slate-400">{reporter?.email ?? ''}</p>
          </div>
        </div>
      </td>

      {/* Status */}
      <td className="px-6 py-4">
        <StatusBadge status={status} size="md" />
      </td>

      {/* Actions */}
      <td className="px-6 py-4 text-right">
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={() => onResolve?.(_id)}
            title="Mark Resolved"
            className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 24 }}>check_circle</span>
          </button>
          <button
            onClick={() => onDelete?.(_id)}
            title="Delete"
            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 24 }}>delete</span>
          </button>
        </div>
      </td>
    </tr>
  );
}
