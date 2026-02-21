/**
 * AdminRecentActivity — Shows recent activity, notifications, and quick actions
 */

function ActivityItem({ icon, title, description, timestamp, color = 'blue', actionLabel = null, onAction = null }) {
  const colorMap = {
    blue: 'bg-blue-50 text-blue-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    orange: 'bg-orange-50 text-orange-600',
    rose: 'bg-rose-50 text-rose-600',
    purple: 'bg-purple-50 text-purple-600',
  };

  return (
    <div className="border-b border-slate-100 last:border-b-0 py-3.5">
      <div className="flex gap-3">
        <div className={`${colorMap[color]} p-2 rounded-lg shrink-0`}>
          <span className="material-symbols-outlined text-sm">{icon}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-slate-800 text-sm">{title}</p>
          <p className="text-xs text-slate-600 mt-0.5 truncate">{description}</p>
        </div>
        {actionLabel && (
          <button
            onClick={onAction}
            className="ml-2 px-2.5 py-1 text-xs font-semibold text-[#1e3b8a] bg-[#1e3b8a]/10 rounded hover:bg-[#1e3b8a]/20 transition-colors shrink-0 hover:scale-105"
          >
            {actionLabel}
          </button>
        )}
        {!actionLabel && (
          <span className="text-xs text-slate-400 shrink-0">{timestamp}</span>
        )}
      </div>
    </div>
  );
}

export default function AdminRecentActivity({ activities = [] }) {
  // Demo activities if none provided
  const defaultActivities = [
    { 
      icon: 'verified_user', 
      title: 'Issue Verified', 
      description: 'Road pothole on Main St verified by 5 citizens', 
      timestamp: '2 min ago',
      color: 'emerald'
    },
    { 
      icon: 'flag', 
      title: 'New Report', 
      description: 'Broken traffic light reported at Central Intersection', 
      timestamp: '15 min ago',
      color: 'orange'
    },
    { 
      icon: 'check_circle', 
      title: 'Issue Resolved', 
      description: 'Water pipe repair completed by municipal team', 
      timestamp: '1 hour ago',
      color: 'emerald'
    },
    { 
      icon: 'warning', 
      title: 'Pending Review', 
      description: 'Critical safety issue requires immediate escalation', 
      timestamp: '2 hours ago',
      color: 'rose',
      actionLabel: 'Review',
      onAction: () => console.log('Review clicked')
    },
  ];

  const displayActivities = activities.length > 0 ? activities : defaultActivities;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Recent Activity Feed */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-semibold text-slate-800">Recent Activity</h3>
          <a href="#" className="text-xs font-semibold text-[#1e3b8a] hover:underline">
            View All
          </a>
        </div>
        <div className="space-y-0">
          {displayActivities.map((activity, idx) => (
            <ActivityItem key={idx} {...activity} />
          ))}
        </div>
      </div>

      {/* Quick Actions & System Status */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <h3 className="font-semibold text-slate-800 mb-5">Quick Actions</h3>
        
        <div className="space-y-3">
          {/* Action Button 1 */}
          <button className="w-full px-4 py-3 bg-[#1e3b8a] hover:bg-[#1e3b8a]/90 text-white rounded-lg font-semibold text-sm transition-colors flex items-center justify-between group">
            <span className="flex items-center gap-2">
              <span className="material-symbols-outlined text-base">add_circle</span>
              Create Maintenance Task
            </span>
            <span className="material-symbols-outlined text-base group-hover:translate-x-1 transition-transform">arrow_forward</span>
          </button>

          {/* Action Button 2 */}
          <button className="w-full px-4 py-3 bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 rounded-lg font-semibold text-sm transition-colors flex items-center justify-between group">
            <span className="flex items-center gap-2">
              <span className="material-symbols-outlined text-base">mail</span>
              Send Bulk Notification
            </span>
            <span className="material-symbols-outlined text-base group-hover:translate-x-1 transition-transform">arrow_forward</span>
          </button>

          {/* Action Button 3 */}
          <button className="w-full px-4 py-3 bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 rounded-lg font-semibold text-sm transition-colors flex items-center justify-between group">
            <span className="flex items-center gap-2">
              <span className="material-symbols-outlined text-base">settings</span>
              System Settings
            </span>
            <span className="material-symbols-outlined text-base group-hover:translate-x-1 transition-transform">arrow_forward</span>
          </button>

          {/* Action Button 4 */}
          <button className="w-full px-4 py-3 bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 rounded-lg font-semibold text-sm transition-colors flex items-center justify-between group">
            <span className="flex items-center gap-2">
              <span className="material-symbols-outlined text-base">download</span>
              Export Report
            </span>
            <span className="material-symbols-outlined text-base group-hover:translate-x-1 transition-transform">arrow_forward</span>
          </button>
        </div>

        {/* System Status Summary */}
        <div className="mt-6 pt-6 border-t border-slate-100">
          <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-3">System Status</p>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600">Server Status</span>
              <span className="flex items-center gap-1.5 text-emerald-600 font-semibold">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Operational
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600">Database</span>
              <span className="flex items-center gap-1.5 text-emerald-600 font-semibold">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Connected
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600">Notification Service</span>
              <span className="flex items-center gap-1.5 text-blue-600 font-semibold">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-500" />
                Active
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
