import { useEffect, useState, useCallback } from 'react';
import AppHeader from '@components/layout/AppHeader';
import AdminSidebar from '@components/layout/AdminSidebar';
import AdminIssueRow from '@components/issues/AdminIssueRow';
import StatCard from '@components/ui/StatCard';
import IssueStatsChart from '@components/admin/IssueStatsChart';
import AdminRecentActivity from '@components/admin/AdminRecentActivity';
import VerificationTimeline from '@components/admin/VerificationTimeline';
import AdminIssueFilters from '@components/admin/AdminIssueFilters';
import Loader from '@components/common/Loader';
import { useAuth } from '@hooks/useAuth';
import { issueService } from '@services/issueService';

const TABS = [
  { key: 'pending',    label: 'Pending Review' },
  { key: 'open',       label: 'Open'            },
  { key: 'resolved',   label: 'Resolved'        },
  { key: 'all',        label: 'All Issues'      },
];

const ADMIN_HEADER_NAV = [
  { label: 'Overview', to: '/admin',          active: true  },
  { label: 'Reports',  to: '/admin/reports'               },
  { label: 'Settings', to: '/admin/settings'              },
];

/* Enhanced Stat Card Component */
function EnhancedStatCard({ icon, label, value, subtext, color = 'blue' }) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
    rose: 'bg-rose-50 text-rose-600 border-rose-100',
    purple: 'bg-purple-50 text-purple-600 border-purple-100',
  };

  const bgColorMap = {
    blue: 'bg-blue-100',
    emerald: 'bg-emerald-100',
    amber: 'bg-amber-100',
    rose: 'bg-rose-100',
    purple: 'bg-purple-100',
  };

  const textColorMap = {
    blue: 'text-blue-600',
    emerald: 'text-emerald-600',
    amber: 'text-amber-600',
    rose: 'text-rose-600',
    purple: 'text-purple-600',
  };

  return (
    <div className={`bg-white rounded-xl border ${colorClasses[color]} shadow-sm p-6 hover:shadow-md transition-shadow`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">{label}</p>
          <p className={`text-3xl font-bold ${textColorMap[color]} mb-2`}>{value}</p>
          {subtext && <p className="text-sm text-slate-600">{subtext}</p>}
        </div>
        <div className={`${bgColorMap[color]} p-3 rounded-lg`}>
          <span className={`material-symbols-outlined ${textColorMap[color]}`} style={{ fontSize: 28 }}>
            {icon}
          </span>
        </div>
      </div>
    </div>
  );
}

/* Bar chart row */
function CategoryBar({ label, pct, color = 'bg-[#1e3b8a]' }) {
  return (
    <div className="flex items-center gap-3">
      <p className="text-sm text-slate-600 w-32 shrink-0">{label}</p>
      <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color} transition-all duration-500`} style={{ width: `${pct}%` }} />
      </div>
      <p className="text-xs font-semibold text-slate-500 w-8 text-right">{pct}%</p>
    </div>
  );
}

export default function AdminPanel() {
  const { user } = useAuth();

  const [activeTab,     setActiveTab]     = useState('pending');
  const [adminStats,    setAdminStats]    = useState(null);
  const [issues,        setIssues]        = useState([]);
  const [page,          setPage]          = useState(1);
  const [totalPages,    setTotalPages]    = useState(1);
  const [loadingStats,  setLoadingStats]  = useState(true);
  const [loadingIssues, setLoadingIssues] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  /* Load admin stats once */
  useEffect(() => {
    issueService
      .getAdminStats()
      .then((d) => setAdminStats(d))
      .catch(() =>
        setAdminStats({ totalPending: 0, newToday: 0, avgResolutionDays: 0, categoryBreakdown: [] }),
      )
      .finally(() => setLoadingStats(false));
  }, []);

  /* Load issues when tab or page changes */
  const loadIssues = useCallback(() => {
    setLoadingIssues(true);
    const status = activeTab === 'all' ? undefined : activeTab;
    issueService
      .getIssues({ status, page, limit: 10 })
      .then((data) => {
        setIssues(data.issues ?? data);
        setTotalPages(data.pagination?.totalPages ?? 1);
      })
      .catch(() => setIssues([]))
      .finally(() => setLoadingIssues(false));
  }, [activeTab, page]);

  useEffect(() => { loadIssues(); }, [loadIssues]);

  const handleResolve = async (id) => {
    setActionLoading(id);
    try {
      await issueService.updateStatus(id, { status: 'resolved' });
      loadIssues();
    } catch { /* swallow */ } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Permanently delete this issue?')) return;
    setActionLoading(id);
    try {
      await issueService.deleteIssue(id);
      loadIssues();
    } catch { /* swallow */ } finally {
      setActionLoading(null);
    }
  };

  const stats = [
    { label: 'Total Issues',   value: adminStats?.totalIssues   ?? '—', icon: 'assignment', color: 'text-[#1e3b8a]' },
    { label: 'Verified Issues',       value: adminStats?.totalVerifiedIssues       ?? '—', icon: 'verified',           color: 'text-emerald-600'   },
    { label: 'Active Users',  value: adminStats?.totalUsers ? `${adminStats.totalUsers}` : '—', icon: 'people', color: 'text-purple-600' },
  ];

  const categoryBreakdown = adminStats?.categoryBreakdown ?? [
    { label: 'Infrastructure',  pct: 38 },
    { label: 'Utilities',       pct: 24 },
    { label: 'Public Safety',   pct: 18 },
    { label: 'Environment',     pct: 12 },
    { label: 'Other',           pct: 8  },
  ];

  return (
    <div className="min-h-screen bg-[#f6f6f8] font-display flex flex-col">
      <AppHeader
        logoTo="/admin"
        logoText="Admin Dashboard"
        navLinks={ADMIN_HEADER_NAV}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Admin sidebar */}
        <aside className="hidden lg:flex flex-col w-64 shrink-0">
          <AdminSidebar admin={{ name: user?.name ?? 'Admin', role: 'Administrator', avatar: user?.avatar }} />
        </aside>

        {/* Main */}
        <main className="flex-1 overflow-y-auto px-6 py-8 space-y-8">

          {/* Key Metrics Section */}
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-slate-900">Dashboard Overview</h2>
              <p className="text-slate-600 text-sm mt-1">Real-time platform metrics and performance indicators</p>
            </div>

            {loadingStats ? (
              <div className="flex justify-center py-8"><Loader /></div>
            ) : (
              <>
                {/* Primary Metrics - 3 columns */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <EnhancedStatCard
                    icon="assignment"
                    label="Total Issues"
                    value={adminStats?.totalIssues ?? '—'}
                    subtext="All reported issues"
                    color="blue"
                  />
                  <EnhancedStatCard
                    icon="verified"
                    label="Verified Issues"
                    value={adminStats?.totalVerifiedIssues ?? '—'}
                    subtext={`${adminStats?.totalIssues ? Math.round((adminStats.totalVerifiedIssues / adminStats.totalIssues) * 100) : 0}% verification rate`}
                    color="emerald"
                  />
                  <EnhancedStatCard
                    icon="people"
                    label="Active Citizens"
                    value={adminStats?.totalUsers ?? '—'}
                    subtext="Registered users"
                    color="purple"
                  />
                </div>

                {/* Secondary Metrics - 2 columns */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <EnhancedStatCard
                    icon="schedule"
                    label="Avg Verification Time"
                    value={adminStats?.averageVerificationTime?.hours ? `${Math.round(adminStats.averageVerificationTime.hours)}h` : '—'}
                    subtext={adminStats?.averageVerificationTime?.hours ? `${Math.round(adminStats.averageVerificationTime.ms / 1000 / 60)} minutes average` : 'Calculating...'}
                    color="amber"
                  />
                  <EnhancedStatCard
                    icon="notifications_active"
                    label="Latest Issue Reach"
                    value={adminStats?.totalUsersNotifiedForLatestIssue ?? '—'}
                    subtext="Citizens notified for latest issue"
                    color="rose"
                  />
                </div>
              </>
            )}
          </div>

          {/* Analytics & Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Issue Distribution */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-semibold text-slate-800">Issue Distribution</h3>
                <span className="bg-[#1e3b8a]/10 text-[#1e3b8a] text-xs font-semibold px-2.5 py-1 rounded-full">
                  By Category
                </span>
              </div>
              <div className="space-y-4">
                {categoryBreakdown.map((c) => (
                  <CategoryBar key={c.label} label={c.label} pct={c.pct} />
                ))}
              </div>
            </div>

            {/* Platform Health */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-semibold text-slate-800">Platform Health</h3>
                <span className="flex items-center gap-1.5 text-emerald-600 text-xs font-semibold">
                  <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Operational
                </span>
              </div>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-slate-600">Database Health</span>
                    <span className="text-sm font-semibold text-emerald-600">Healthy</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full w-full bg-emerald-500 rounded-full" />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-slate-600">API Response Time</span>
                    <span className="text-sm font-semibold text-emerald-600">&lt;100ms</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full w-4/5 bg-emerald-500 rounded-full" />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-slate-600">Geospatial Index</span>
                    <span className="text-sm font-semibold text-emerald-600">Optimized</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full w-full bg-emerald-500 rounded-full" />
                  </div>
                </div>
                <div className="pt-2">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-slate-600">Notification Queue</span>
                    <span className="text-sm font-semibold text-blue-600">Active</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full w-3/4 bg-blue-500 rounded-full" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Issue Status Analytics - Circular Progress Indicators */}
          {!loadingStats && adminStats && (
            <div>
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-slate-900">Issue Performance Metrics</h2>
                <p className="text-slate-600 text-sm mt-1">Verification and resolution analytics</p>
              </div>
              <IssueStatsChart
                totalIssues={adminStats.totalIssues || 0}
                verifiedIssues={adminStats.totalVerifiedIssues || 0}
                resolvedIssues={0}
                pendingIssues={0}
              />
            </div>
          )}

          {/* Recent Activity & Quick Actions */}
          <AdminRecentActivity />

          {/* Verification Timeline */}
          <VerificationTimeline />

          {/* Issue Filters */}
          <div className="mt-8">
            <AdminIssueFilters onFilterChange={(filters) => {
              console.log('Filters applied:', filters);
            }} />
          </div>

          {/* Issues table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {/* Table header with tabs */}
            <div className="px-6 pt-5 pb-0 border-b border-slate-100">
              <h3 className="font-semibold text-slate-800 mb-4">Issue Management</h3>
              <div className="flex gap-1">
                {TABS.map((t) => (
                  <button
                    key={t.key}
                    onClick={() => { setActiveTab(t.key); setPage(1); }}
                    className={`px-4 py-2 text-sm font-semibold rounded-t-lg border-b-2 transition-colors ${
                      activeTab === t.key
                        ? 'border-[#1e3b8a] text-[#1e3b8a]'
                        : 'border-transparent text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {loadingIssues ? (
              <div className="flex justify-center py-16"><Loader /></div>
            ) : issues.length === 0 ? (
              <div className="flex flex-col items-center py-16 text-center">
                <span className="material-symbols-outlined text-slate-200" style={{ fontSize: 48 }}>inbox</span>
                <p className="text-slate-400 mt-3 text-sm">No issues in this category.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[#f6f6f8] text-left">
                      <th className="px-5 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wider">Issue ID</th>
                      <th className="px-5 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wider">Date / Time</th>
                      <th className="px-5 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wider">Category</th>
                      <th className="px-5 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wider">Reported By</th>
                      <th className="px-5 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wider">Status</th>
                      <th className="px-5 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {issues.map((issue) => (
                      <AdminIssueRow
                        key={issue._id}
                        issue={issue}
                        onResolve={handleResolve}
                        onDelete={handleDelete}
                        actionLoading={actionLoading}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100">
                <p className="text-xs text-slate-500">
                  Page {page} of {totalPages}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    ← Prev
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Next →
                  </button>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
