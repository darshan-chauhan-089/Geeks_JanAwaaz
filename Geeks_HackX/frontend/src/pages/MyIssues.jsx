import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@hooks/useAuth';
import { useIssueFeed } from '@hooks/useIssueFeed';
import AppHeader from '@components/layout/AppHeader';
import IssueCard from '@components/issues/IssueCard';
import VerifyModal from '@components/issues/VerifyModal';
import Loader from '@components/common/Loader';
import { SORT_PRESETS } from '@utils/constants';
import { issueService } from '@services/issueService';

const HEADER_NAV = [
  { label: 'Home',                  to: '/dashboard',       icon: 'home'          },
  { label: 'Verification Requests', to: '/verify-requests', icon: 'verified_user' },
  { label: 'My Issues',             to: '/my-issues',       icon: 'article'       },
  { label: 'Profile',               to: '/profile',         icon: 'person'        },
];

const STATUS_OPTIONS = ['All', 'Resolved', 'Rejected', 'Pending'];

export default function MyIssues() {
  const { user } = useAuth();
  const [sort,       setSort]       = useState('recent');
  const [statusTab,  setStatusTab]  = useState('All');

  // Re-use useIssueFeed but scoped to the current user via the /users/me/issues endpoint.
  // We pass a custom fetcher so the hook uses the right URL.
  const {
    issues,
    pagination,
    isLoading,
    error,
    refetch,
    nextPage,
    prevPage,
    likedIds,
    handleLike,
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
      status: statusTab === 'All' ? undefined : statusTab,
      limit: 12,
    },
    {
      fetchOnMount: true,
      fetcher: issueService.getMyIssues,   // override with /users/me/issues
    },
  );

  function handleSortChange(e) {
    const newSort = e.target.value;
    setSort(newSort);
    refetch({ sort: newSort, page: 1 });
  }

  function handleTabChange(tab) {
    setStatusTab(tab);
    refetch({ status: tab === 'All' ? undefined : tab, page: 1 });
  }

  return (
    <div className="min-h-screen bg-[#f6f6f8] font-display flex flex-col">
      <AppHeader logoTo="/dashboard" logoText="JanAwaaz" navLinks={HEADER_NAV} />

      <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-8">
        {/* Page header */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">My Issues</h1>
            <p className="text-slate-500 text-sm mt-0.5">All issues reported by you</p>
          </div>
          <Link
            to="/issues/new"
            className="flex items-center gap-2 bg-[#1e3b8a] hover:bg-[#1e3b8a]/90 text-white text-sm font-semibold px-4 py-2 rounded-lg shadow-sm shadow-[#1e3b8a]/20 transition-colors"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add</span>
            Report Issue
          </Link>
        </div>

        {/* Status tabs */}
        <div className="flex gap-2 flex-wrap mb-5">
          {STATUS_OPTIONS.map((s) => (
            <button
              key={s}
              onClick={() => handleTabChange(s)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                statusTab === s
                  ? 'bg-[#1e3b8a] text-white border-[#1e3b8a]'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-[#1e3b8a]/40'
              }`}
            >
              {s}
            </button>
          ))}

          {/* Sort */}
          <div className="ml-auto flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-1.5 shadow-sm">
            <span className="material-symbols-outlined text-slate-400" style={{ fontSize: 16 }}>sort</span>
            <select
              value={sort}
              onChange={handleSortChange}
              className="text-sm text-slate-700 bg-transparent focus:outline-none"
            >
              {SORT_PRESETS.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Content */}
        {isLoading && <div className="flex justify-center py-16"><Loader /></div>}

        {error && (
          <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>error</span>
            {error}
          </div>
        )}

        {!isLoading && !error && issues.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="bg-white size-20 rounded-2xl flex items-center justify-center shadow-sm mb-4">
              <span className="material-symbols-outlined text-slate-300" style={{ fontSize: 40 }}>article</span>
            </div>
            <h3 className="text-lg font-semibold text-slate-700 mb-2">No issues yet</h3>
            <p className="text-slate-400 text-sm mb-6">
              {statusTab !== 'All'
                ? `No ${statusTab.toLowerCase()} issues found.`
                : "You haven't reported any issues yet."}
            </p>
            <Link to="/issues/new" className="text-[#1e3b8a] font-semibold text-sm hover:underline">
              + Report your first issue
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
              showDelete
            />
          ))}
        </div>

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
  );
}
