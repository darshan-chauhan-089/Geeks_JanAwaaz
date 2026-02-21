import { useState, useEffect, useRef } from 'react';
import { issueService } from '@services/issueService';
import { Link } from 'react-router-dom';
import { useAuth } from '@hooks/useAuth';
import { useIssueFeed } from '@hooks/useIssueFeed';
import AppHeader from '@components/layout/AppHeader';
import DashboardSidebar from '@components/layout/DashboardSidebar';
import IssueCard from '@components/issues/IssueCard';
import VerifyModal from '@components/issues/VerifyModal';
import Loader from '@components/common/Loader';
import { SORT_PRESETS } from '@utils/constants';

const HEADER_NAV = [
  { label: 'Home',                  to: '/dashboard',       icon: 'home'          },
  { label: 'Verification Requests', to: '/verify-requests',  icon: 'verified_user' },
  { label: 'My Issues',             to: '/my-issues',        icon: 'article'       },
  { label: 'Profile',               to: '/profile',          icon: 'person'        },
];

export default function Dashboard() {
  const { user } = useAuth();

  const [activeCategory, setCategory]   = useState('');
  const [userStats,  setUserStats]   = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    issueService.getUserStats()
      .then(setUserStats)
      .catch(() => {})
      .finally(() => setStatsLoading(false));
  }, []);
  const [sort, setSort] = useState('recent');

  const {
    issues,
    pagination,
    isLoading,
    error,
    refetch,
    nextPage,
    prevPage,
    // Like
    likedIds,
    handleLike,
    // Verify modal
    verifyTargetId,
    verifyForm,
    setVerifyForm,
    verifyLoading,
    verifyError,
    openVerifyModal,
    closeVerifyModal,
    handleVerifySubmit,
  } = useIssueFeed(
    {
      sort,
      category: activeCategory || undefined,
      limit:    12,
    },
    { fetchOnMount: true },
  );

  // ── Refetch when category filter changes (skip initial mount — fetchOnMount handles it)
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    refetch({ category: activeCategory || undefined, page: 1 });
  }, [activeCategory]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="min-h-screen bg-[#f6f6f8] font-display flex flex-col">
      <AppHeader
        logoTo="/dashboard"
        logoText="JanAwaaz"
        navLinks={HEADER_NAV}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="hidden lg:flex flex-col w-64 shrink-0">
          <DashboardSidebar
            activeCategory={activeCategory}
            setCategory={setCategory}
            userStats={userStats}
            statsLoading={statsLoading}
          />
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto px-6 py-8">
          {/* Welcome + sort row */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                Welcome back, {user?.name?.split(' ')[0] ?? 'Citizen'} 👋
              </h1>
              <p className="text-slate-500 text-sm mt-1">
                Showing community issues in your area
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-2 shadow-sm">
                <span className="material-symbols-outlined text-slate-400" style={{ fontSize: 18 }}>sort</span>
                <select
                  value={sort}
                  onChange={(e) => { setSort(e.target.value); refetch({ sort: e.target.value, page: 1 }); }}
                  className="text-sm text-slate-700 bg-transparent focus:outline-none pr-1"
                >
                  {SORT_PRESETS.map((p) => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </select>
              </div>

              <Link
                to="/issues/new"
                className="flex items-center gap-2 bg-[#1e3b8a] hover:bg-[#1e3b8a]/90 text-white text-sm font-semibold px-4 py-2 rounded-lg shadow-sm shadow-[#1e3b8a]/20 transition-colors"
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add</span>
                Report Issue
              </Link>
            </div>
          </div>

          {/* Issue grid */}
          {isLoading && (
            <div className="flex justify-center py-16"><Loader /></div>
          )}

          {error && (
            <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>error</span>
              {error}
            </div>
          )}

          {!isLoading && !error && issues.length === 0 && (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="bg-white size-20 rounded-2xl flex items-center justify-center shadow-sm mb-4">
                <span className="material-symbols-outlined text-slate-300" style={{ fontSize: 40 }}>inbox</span>
              </div>
              <h3 className="text-lg font-semibold text-slate-700 mb-2">No issues found</h3>
              <p className="text-slate-400 text-sm mb-6">
                {activeCategory !== '' ? 'Try a different category or clear filters.' : 'Be the first to report a civic issue.'}
              </p>
              <Link to="/issues/new" className="text-[#1e3b8a] font-semibold text-sm hover:underline">
                + Report the first one
              </Link>
            </div>
          )}

          <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
            {issues.map((issue) => (
              <IssueCard
                key={issue._id}
                issue={issue}
                variant="dashboard"
                onLike={handleLike}
                isLiked={likedIds.has(issue._id)}
                onVerify={openVerifyModal}
              />
            ))}
          </div>

          {/* Verify modal — mounted outside the grid to avoid z-index issues */}
          {verifyTargetId && (
            <VerifyModal
              onClose={closeVerifyModal}
              onSubmit={handleVerifySubmit}
              form={verifyForm}
              setForm={setVerifyForm}
              loading={verifyLoading}
              error={verifyError}
            />
          )}

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-10">
              <button
                onClick={prevPage}
                disabled={!pagination.hasPrevPage}
                className="flex items-center gap-1 px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_back</span>
                Prev
              </button>
              <span className="text-sm text-slate-500">
                Page {pagination.currentPage} / {pagination.totalPages}
              </span>
              <button
                onClick={nextPage}
                disabled={!pagination.hasNextPage}
                className="flex items-center gap-1 px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Next
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_forward</span>
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
