/**
 * VerificationBar — horizontal progress bar showing verification %.
 *
 * Props:
 *  - percent  {number}   0-100
 *  - resolved {boolean}  if true renders green "Fix Confirmed" variant
 */
export default function VerificationBar({ percent = 0, resolved = false }) {
  const clamped = Math.min(100, Math.max(0, percent));

  if (resolved) {
    return (
      <div className="space-y-3">
        <div className="flex justify-between text-xs font-bold mb-1">
          <span className="text-emerald-500">Fix Confirmed</span>
          <span className="text-emerald-500">100%</span>
        </div>
        <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
          <div className="bg-emerald-500 h-full w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-between text-xs font-bold mb-1">
        <span className="text-slate-400">Verification Progress</span>
        <span className="text-[#1e3b8a]">{clamped}%</span>
      </div>
      <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
        <div
          className="bg-[#1e3b8a] h-full transition-all duration-500"
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}
