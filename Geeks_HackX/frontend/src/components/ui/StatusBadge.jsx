/**
 * StatusBadge — coloured pill for issue status.
 *
 * Props:
 *  - status  {string}  'Pending' | 'In Progress' | 'Resolved' | 'Verified' | 'Critical' | 'Rejected' | 'Urgent' | 'Open'
 *  - size    {'sm'|'md'}
 */

const STATUS_MAP = {
  pending:     { bg: 'bg-orange-100 text-orange-700',    label: 'Pending' },
  open:        { bg: 'bg-amber-100  text-amber-700',     label: 'Open'    },
  urgent:      { bg: 'bg-orange-500 text-white',         label: 'Urgent'  },
  'in progress': { bg: 'bg-blue-100 text-blue-700',      label: 'In Progress' },
  verified:    { bg: 'bg-[#1e3b8a]/10 text-[#1e3b8a]',  label: 'Verified' },
  critical:    { bg: 'bg-red-100    text-red-700',       label: 'Critical' },
  resolved:    { bg: 'bg-emerald-500 text-white',        label: 'Resolved' },
  rejected:    { bg: 'bg-slate-200  text-slate-600',     label: 'Rejected' },
};

export default function StatusBadge({ status = 'pending', size = 'sm' }) {
  const key    = status.toLowerCase();
  const config = STATUS_MAP[key] ?? STATUS_MAP.pending;
  const sizeClass = size === 'md'
    ? 'px-3 py-1 text-xs font-bold'
    : 'px-2.5 py-0.5 text-[10px] font-black';

  return (
    <span className={`inline-flex items-center rounded ${sizeClass} uppercase tracking-wider ${config.bg}`}>
      {config.label}
    </span>
  );
}
