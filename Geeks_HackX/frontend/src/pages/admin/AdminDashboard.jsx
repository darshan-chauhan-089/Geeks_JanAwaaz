import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminNavbar from '@components/admin/AdminNavbar';
import AdminSidebar from '@components/admin/AdminSidebar';
import IssueTable from '@components/admin/IssueTable';
import IssueCard from '@components/admin/IssueCard';
import IssueDetailModal from '@components/admin/IssueDetailModal';
import { adminService } from '@services/adminService';
import { useToast } from '@hooks/useToast';
import { useSocket } from '@hooks/useSocket';

const severityWeight = { emergency: 4, high: 3, medium: 2, low: 1 };

const normalizeStatus = (status) => String(status || '').trim().toLowerCase().replace(/\s+/g, ' ');

const toSeverityLabel = (issue) => {
  const explicit = String(issue?.severity || '').trim().toLowerCase();
  if (explicit && ['low', 'medium', 'high', 'emergency'].includes(explicit)) {
    return explicit;
  }

  const avg = Number(issue?.averageSeverity || 0);
  if (avg >= 4.5) return 'emergency';
  if (avg >= 3.5) return 'high';
  if (avg >= 2.5) return 'medium';
  return 'low';
};

const toLocationLabel = (issue) => {
  if (issue?.locationLabel) return issue.locationLabel;
  const pieces = [issue?.location?.ward, issue?.location?.city, issue?.location?.address]
    .filter(Boolean)
    .map((v) => String(v).trim())
    .filter(Boolean);
  return pieces.length ? pieces.join(', ') : 'Location unavailable';
};

const normalizeIssueForView = (issue) => ({
  ...issue,
  severity: toSeverityLabel(issue),
  locationLabel: toLocationLabel(issue),
  publicId: issue?.publicId || issue?._id?.slice(-6)?.toUpperCase(),
  reportedByName: issue?.reportedByName || issue?.createdBy?.name || issue?.reportedBy?.name || 'Citizen',
});

function SummaryCard({ title, value, tone = 'slate' }) {
  const tones = {
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    rose: 'bg-rose-50 text-rose-700 border-rose-200',
    slate: 'bg-slate-50 text-slate-700 border-slate-200',
  };

  return (
    <div className={`rounded-xl border px-4 py-3 shadow-sm ${tones[tone] || tones.slate}`}>
      <p className="text-[11px] uppercase tracking-widest font-bold opacity-80">{title}</p>
      <p className="text-2xl font-black mt-1">{value}</p>
    </div>
  );
}

function SummaryCardSkeleton() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm animate-pulse">
      <div className="h-3 w-24 bg-slate-200 rounded" />
      <div className="h-8 w-12 bg-slate-200 rounded mt-2" />
    </div>
  );
}

function IssueCardSkeleton() {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 animate-pulse">
      <div className="h-5 w-24 bg-slate-200 dark:bg-slate-700 rounded" />
      <div className="h-6 w-3/4 bg-slate-200 dark:bg-slate-700 rounded mt-4" />
      <div className="space-y-3 mt-4">
        <div className="h-4 w-full bg-slate-200 dark:bg-slate-700 rounded" />
        <div className="h-4 w-5/6 bg-slate-200 dark:bg-slate-700 rounded" />
        <div className="h-4 w-2/3 bg-slate-200 dark:bg-slate-700 rounded" />
      </div>
      <div className="h-8 w-28 bg-slate-200 dark:bg-slate-700 rounded mt-6" />
    </div>
  );
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { success, error: toastError } = useToast();
  const { socket } = useSocket();
  const adminUser = adminService.getAdminUser();

  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('Verified');
  const [isUpdating, setIsUpdating] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [pendingStatusAction, setPendingStatusAction] = useState(null);
  const [stats, setStats] = useState({ totalIssues: 0, totalVerifiedIssues: 0 });
  const [loadError, setLoadError] = useState('');
  const [filters, setFilters] = useState({
    search: '',
    severity: 'all',
    category: 'all',
    sortBy: 'date',
  });

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setLoadError('');

    try {
      const [statsRes, issuesRes] = await Promise.all([
        adminService.getDashboardStats(),
        adminService.getIssues({ status: statusFilter === 'all' ? undefined : statusFilter, limit: 24 }),
      ]);

      setStats(statsRes || {});

      const list = Array.isArray(issuesRes?.issues) ? issuesRes.issues : [];
      setIssues(list.map(normalizeIssueForView));
    } catch (err) {
      setLoadError(err.message || 'Failed to load dashboard data.');
      setIssues([]);
      setStats({ totalIssues: 0, totalVerifiedIssues: 0, issues: {} });
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      loadDashboard();
    }, 15000);

    return () => window.clearInterval(intervalId);
  }, [loadDashboard]);

  useEffect(() => {
    if (!socket) return undefined;

    const refreshFromRealtime = () => {
      loadDashboard();
    };

    socket.on('issueCreated', refreshFromRealtime);
    socket.on('issue:verified', refreshFromRealtime);
    socket.on('issueVerified', refreshFromRealtime);
    socket.on('issueStatusUpdate', refreshFromRealtime);

    return () => {
      socket.off('issueCreated', refreshFromRealtime);
      socket.off('issue:verified', refreshFromRealtime);
      socket.off('issueVerified', refreshFromRealtime);
      socket.off('issueStatusUpdate', refreshFromRealtime);
    };
  }, [socket, loadDashboard]);

  const handleLogout = () => {
    adminService.logoutAdmin();
    navigate('/admin/login', { replace: true });
  };

  const applyStatusChange = async (issue, nextStatus) => {
    if (!issue?._id) return;

    const prevStatus = issue.status;

    setIssues((prev) => prev.map((item) => (item._id === issue._id ? { ...item, status: nextStatus } : item)));
    setSelectedIssue((prev) => (prev?._id === issue._id ? { ...prev, status: nextStatus } : prev));

    setIsUpdating(true);
    try {
      const updated = await adminService.updateIssueStatus(issue._id, nextStatus);
      const persistedStatus = updated?.status || nextStatus;
      setIssues((prev) => prev.map((item) => (item._id === issue._id ? { ...item, status: persistedStatus } : item)));
      setSelectedIssue((prev) => (prev?._id === issue._id ? { ...prev, status: persistedStatus } : prev));
      success('Issue status updated successfully.');
    } catch (err) {
      setIssues((prev) => prev.map((item) => (item._id === issue._id ? { ...item, status: prevStatus } : item)));
      setSelectedIssue((prev) => (prev?._id === issue._id ? { ...prev, status: prevStatus } : prev));
      toastError(err.message || 'Unable to update issue status.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleStatusChange = (issue, nextStatus) => {
    setPendingStatusAction({ issue, nextStatus });
  };

  const handleConfirmStatusChange = async () => {
    if (!pendingStatusAction) return;
    await applyStatusChange(pendingStatusAction.issue, pendingStatusAction.nextStatus);
    setPendingStatusAction(null);
  };

  const filteredIssues = useMemo(() => {
    const search = filters.search.trim().toLowerCase();

    let result = issues.filter((issue) => {
      const bySearch =
        !search ||
        issue.title?.toLowerCase().includes(search) ||
        issue.reportedByName?.toLowerCase().includes(search) ||
        issue.publicId?.toLowerCase().includes(search);

      const bySeverity = filters.severity === 'all' || issue.severity === filters.severity;
      const byCategory = filters.category === 'all' || issue.category === filters.category;

      return bySearch && bySeverity && byCategory;
    });

    if (filters.sortBy === 'verifications') {
      result = [...result].sort((a, b) => (b.verificationCount || 0) - (a.verificationCount || 0));
    } else if (filters.sortBy === 'severity') {
      result = [...result].sort((a, b) => (severityWeight[b.severity] || 0) - (severityWeight[a.severity] || 0));
    }

    return result;
  }, [issues, filters]);

  const statusSummary = useMemo(() => {
    const countFromList = (targetStatus) =>
      issues.filter((issue) => normalizeStatus(issue.status) === normalizeStatus(targetStatus)).length;

    return {
      verified: Number(stats?.issues?.verified ?? countFromList('Verified')),
      inProgress: Number(stats?.issues?.inProgress ?? countFromList('In Progress')),
      resolved: Number(stats?.issues?.resolved ?? countFromList('Resolved')),
      rejected: Number(countFromList('Rejected')),
    };
  }, [issues, stats]);

  return (
    <div className="bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-slate-100 antialiased min-h-screen">
      <AdminNavbar
        adminUser={{
          name: adminUser?.name || 'Admin',
          designation: 'Municipal Oversight',
          avatar: adminUser?.avatar,
        }}
        onLogout={handleLogout}
      />

      <div className="flex min-h-[calc(100vh-64px)]">
        <AdminSidebar activeFilter={statusFilter} onFilterChange={setStatusFilter} />

        <main className="flex-1 overflow-y-auto p-8">
          {loadError && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {loadError}
            </div>
          )}

          <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h2 className="text-3xl font-black tracking-tight mb-2">Verified Issues Management</h2>
              <p className="text-slate-600 dark:text-slate-400 max-w-2xl">
                Monitor and coordinate rapid response to high-impact civic reports from the community.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Status Filter</span>
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm px-3 py-2 focus:ring-2 focus:ring-primary"
              >
                <option value="Verified">Verified</option>
                <option value="In Progress">In Progress</option>
                <option value="Resolved">Resolved</option>
                <option value="Rejected">Rejected</option>
                <option value="Critical">Critical</option>
                <option value="all">All</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            {loading ? (
              <>
                <SummaryCardSkeleton />
                <SummaryCardSkeleton />
                <SummaryCardSkeleton />
                <SummaryCardSkeleton />
              </>
            ) : (
              <>
                <SummaryCard title="Total Verified" value={statusSummary.verified} tone="blue" />
                <SummaryCard title="In Progress" value={statusSummary.inProgress} tone="amber" />
                <SummaryCard title="Resolved" value={statusSummary.resolved} tone="emerald" />
                <SummaryCard title="Rejected" value={statusSummary.rejected} tone="rose" />
              </>
            )}
          </div>

          <IssueTable
            issues={filteredIssues}
            filters={filters}
            onFilterChange={(delta) => setFilters((prev) => ({ ...prev, ...delta }))}
            onViewDetails={setSelectedIssue}
            isLoading={loading}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {loading
              ? Array.from({ length: 6 }).map((_, index) => <IssueCardSkeleton key={index} />)
              : filteredIssues.slice(0, 6).map((issue) => (
                  <IssueCard key={issue._id} issue={issue} onViewDetails={setSelectedIssue} />
                ))}
          </div>
        </main>
      </div>

      <IssueDetailModal
        isOpen={Boolean(selectedIssue)}
        issue={selectedIssue}
        onClose={() => setSelectedIssue(null)}
        onStatusChange={handleStatusChange}
        isUpdating={isUpdating}
      />

      {pendingStatusAction && (
        <div className="fixed inset-0 z-[70] bg-slate-900/50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xl">
            <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Confirm Status Update</h3>
            </div>
            <div className="px-5 py-4 text-sm text-slate-600 dark:text-slate-300">
              You are about to change <span className="font-semibold">{pendingStatusAction.issue.title}</span> to
              <span className="font-semibold"> {pendingStatusAction.nextStatus}</span>. Continue?
            </div>
            <div className="px-5 py-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setPendingStatusAction(null)}
                className="px-4 py-2 rounded-lg text-sm font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmStatusChange}
                disabled={isUpdating}
                className="px-4 py-2 rounded-lg text-sm font-semibold bg-primary text-white hover:bg-primary/90 disabled:opacity-60"
              >
                {isUpdating ? 'Updating...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
