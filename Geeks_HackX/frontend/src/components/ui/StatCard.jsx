/**
 * StatCard — metric display card used on Landing stats section.
 *
 * Props:
 *  - value       {string|number}  e.g. "12,450+"
 *  - label       {string}         e.g. "Issues Reported"
 *  - trend       {string}         e.g. "12% this month"
 *  - trendIcon   {string}         Material Symbol icon name
 *  - bordered    {boolean}        adds left/right border (middle column)
 */
export default function StatCard({ value, label, trend, trendIcon = 'trending_up', bordered = false }) {
  return (
    <div
      className={`flex flex-col items-center p-6 text-center ${
        bordered ? 'border-x border-slate-100 dark:border-slate-800' : ''
      }`}
    >
      <span className="text-4xl font-black text-[#1e3b8a] mb-1">{value}</span>
      <span className="text-slate-500 font-medium uppercase text-xs tracking-widest">{label}</span>
      {trend && (
        <div className="mt-2 text-emerald-500 flex items-center gap-1 text-sm font-bold">
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>{trendIcon}</span>
          {trend}
        </div>
      )}
    </div>
  );
}
