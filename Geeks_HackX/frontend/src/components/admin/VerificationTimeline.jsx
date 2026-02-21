/**
 * VerificationTimeline — Shows the verification progression steps for issues
 * Visual representation of how an issue moves from Pending → Verified → Resolved
 */

export default function VerificationTimeline() {
  const steps = [
    {
      step: 1,
      title: 'Issue Reported',
      description: 'Citizen reports issue with GPS location, photos, and details',
      icon: 'add_a_photo',
      status: 'completed',
    },
    {
      step: 2,
      title: 'Geospatial Validation',
      description: 'System validates location within 10km radius for verification eligibility',
      icon: 'location_on',
      status: 'completed',
    },
    {
      step: 3,
      title: 'Community Verification',
      description: 'Nearby citizens within 10km verify the issue (minimum 3 required)',
      icon: 'verified_user',
      status: 'in-progress',
    },
    {
      step: 4,
      title: 'Admin Notification',
      description: 'Admin team receives notification when issue reaches verified status',
      icon: 'notifications_active',
      status: 'pending',
    },
    {
      step: 5,
      title: 'Authority Action',
      description: 'Municipal team assigns tasks and begins repair/resolution',
      icon: 'build',
      status: 'pending',
    },
    {
      step: 6,
      title: 'Issue Resolved',
      description: 'Work completed and marked as resolved by authorities',
      icon: 'check_circle',
      status: 'pending',
    },
  ];

  const statusConfig = {
    completed: { icon: 'check_circle', color: 'text-emerald-600 bg-emerald-50', line: 'bg-emerald-600' },
    'in-progress': { icon: 'progress_activity', color: 'text-blue-600 bg-blue-50', line: 'bg-slate-200' },
    pending: { icon: 'pending', color: 'text-slate-400 bg-slate-50', line: 'bg-slate-200' },
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
      <div className="mb-8">
        <h3 className="text-2xl font-bold text-slate-900">Issue Verification Flow</h3>
        <p className="text-slate-600 text-sm mt-2">
          Timeline showing how community-reported issues progress through verification and resolution
        </p>
      </div>

      <div className="relative">
        {/* Steps */}
        <div className="space-y-0">
          {steps.map((item, idx) => {
            const config = statusConfig[item.status];
            const isLast = idx === steps.length - 1;

            return (
              <div key={item.step} className="flex gap-6">
                {/* Timeline connector */}
                <div className="flex flex-col items-center">
                  {/* Circle with icon */}
                  <div className={`relative z-10 w-14 h-14 rounded-full flex items-center justify-center font-bold text-lg ${config.color} border-4 border-white shadow-lg`}>
                    <span className="material-symbols-outlined text-2xl">{item.icon}</span>
                  </div>
                  {/* Vertical line */}
                  {!isLast && (
                    <div className={`w-1 h-20 ${config.line} mt-2`} />
                  )}
                </div>

                {/* Content */}
                <div className="pb-8 pt-2 flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <h4 className="font-semibold text-slate-900">{item.title}</h4>
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                      item.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                      item.status === 'in-progress' ? 'bg-blue-100 text-blue-700' :
                      'bg-slate-100 text-slate-600'
                    }`}>
                      {item.status === 'completed' ? '✓ Complete' : item.status === 'in-progress' ? '◉ In Progress' : 'Pending'}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 max-w-md">{item.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Key Metrics Footer */}
      <div className="mt-10 pt-8 border-t border-slate-200 grid grid-cols-3 gap-4">
        <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-100">
          <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wider mb-1">Avg Verification Time</p>
          <p className="text-2xl font-bold text-emerald-700">2.5 hrs</p>
        </div>
        <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
          <p className="text-xs font-semibold text-blue-700 uppercase tracking-wider mb-1">Avg Resolution Time</p>
          <p className="text-2xl font-bold text-blue-700">14 days</p>
        </div>
        <div className="p-4 bg-[#1e3b8a]/5 rounded-lg border border-[#1e3b8a]/20">
          <p className="text-xs font-semibold text-[#1e3b8a] uppercase tracking-wider mb-1">Success Rate</p>
          <p className="text-2xl font-bold text-[#1e3b8a]">94.2%</p>
        </div>
      </div>
    </div>
  );
}
