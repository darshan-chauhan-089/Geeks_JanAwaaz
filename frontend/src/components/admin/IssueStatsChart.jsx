/**
 * IssueStatsChart — Visual breakdown of issue analytics (circular progress indicators)
 * Shows verification rate, resolution progress, and status breakdown
 */

export default function IssueStatsChart({ totalIssues = 0, verifiedIssues = 0, resolvedIssues = 0, pendingIssues = 0 }) {
  const verificationRate = totalIssues > 0 ? Math.round((verifiedIssues / totalIssues) * 100) : 0;
  const resolutionRate = totalIssues > 0 ? Math.round((resolvedIssues / totalIssues) * 100) : 0;
  const resolveDasharray = (resolutionRate / 100) * 283; // 283 = 2π * 45

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Verification Rate */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 flex flex-col items-center text-center">
        <div className="relative w-32 h-32 mb-4">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
            <circle
              cx="60"
              cy="60"
              r="45"
              fill="none"
              stroke="#e5e7eb"
              strokeWidth="8"
            />
            <circle
              cx="60"
              cy="60"
              r="45"
              fill="none"
              stroke="#10b981"
              strokeWidth="8"
              strokeDasharray={`${(verificationRate / 100) * 283} 283`}
              strokeLinecap="round"
              className="transition-all duration-700"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <p className="text-2xl font-bold text-emerald-600">{verificationRate}%</p>
              <p className="text-xs text-slate-500 mt-0.5">Verified</p>
            </div>
          </div>
        </div>
        <h4 className="font-semibold text-slate-800 mb-1">Verification Rate</h4>
        <p className="text-xs text-slate-600">{verifiedIssues} of {totalIssues} issues verified</p>
      </div>

      {/* Resolution Rate */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 flex flex-col items-center text-center">
        <div className="relative w-32 h-32 mb-4">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
            <circle
              cx="60"
              cy="60"
              r="45"
              fill="none"
              stroke="#e5e7eb"
              strokeWidth="8"
            />
            <circle
              cx="60"
              cy="60"
              r="45"
              fill="none"
              stroke="#3b82f6"
              strokeWidth="8"
              strokeDasharray={`${resolveDasharray} 283`}
              strokeLinecap="round"
              className="transition-all duration-700"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{resolutionRate}%</p>
              <p className="text-xs text-slate-500 mt-0.5">Resolved</p>
            </div>
          </div>
        </div>
        <h4 className="font-semibold text-slate-800 mb-1">Resolution Rate</h4>
        <p className="text-xs text-slate-600">{resolvedIssues} of {totalIssues} issues resolved</p>
      </div>

      {/* Pending Status */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 flex flex-col items-center text-center">
        <div className="relative w-32 h-32 mb-4">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
            <circle
              cx="60"
              cy="60"
              r="45"
              fill="none"
              stroke="#e5e7eb"
              strokeWidth="8"
            />
            <circle
              cx="60"
              cy="60"
              r="45"
              fill="none"
              stroke="#f97316"
              strokeWidth="8"
              strokeDasharray={`${totalIssues > 0 ? ((pendingIssues / totalIssues) * 283).toFixed(1) : 0} 283`}
              strokeLinecap="round"
              className="transition-all duration-700"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-600">{totalIssues > 0 ? Math.round((pendingIssues / totalIssues) * 100) : 0}%</p>
              <p className="text-xs text-slate-500 mt-0.5">Pending</p>
            </div>
          </div>
        </div>
        <h4 className="font-semibold text-slate-800 mb-1">Pending Issues</h4>
        <p className="text-xs text-slate-600">{pendingIssues} awaiting action</p>
      </div>
    </div>
  );
}
