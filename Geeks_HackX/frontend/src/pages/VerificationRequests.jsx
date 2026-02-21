import { useState } from 'react';
import { useIssueFeed } from '@hooks/useIssueFeed';
import AppHeader from '@components/layout/AppHeader';
import IssueCard from '@components/issues/IssueCard';
import VerifyModal from '@components/issues/VerifyModal';
import Loader from '@components/common/Loader';
import { issueService } from '@services/issueService';

const HEADER_NAV = [
  { label: 'Home',                  to: '/dashboard',       icon: 'home'          },
  { label: 'Verification Requests', to: '/verify-requests', icon: 'verified_user' },
  { label: 'My Issues',             to: '/my-issues',       icon: 'article'       },
  { label: 'Profile',               to: '/profile',         icon: 'person'        },
];

const SORT_OPTIONS = [
  { value: 'recent',   label: 'Most Recent'       },
  { value: 'severity', label: 'Highest Severity'  },
  { value: 'least',    label: 'Fewest Verifications' },
];

const CATEGORIES = [
  { value: '',              label: 'All Categories' },
  { value: 'infrastructure', label: 'Infrastructure' },
  { value: 'water',         label: 'Water'          },
  { value: 'electricity',   label: 'Electricity'    },
  { value: 'sanitation',    label: 'Sanitation'     },
  { value: 'safety',        label: 'Safety'         },
  { value: 'environment',   label: 'Environment'    },
  { value: 'road',          label: 'Road'           },
  { value: 'other',         label: 'Other'          },
];

export default function VerificationRequests() {
  const [sort,     setSort]     = useState('recent');
  const [category, setCategory] = useState('');

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
      category: category || undefined,
      limit: 12,
    },
    {
      fetchOnMount: true,
      fetcher: issueService.getVerificationRequests,
    },
  );

  function handleSortChange(e) {
    const v = e.target.value;
    setSort(v);
    refetch({ sort: v, page: 1 });
  }

  function handleCategoryChange(e) {
    const v = e.target.value;
    setCategory(v);
    refetch({ category: v || undefined, page: 1 });
  }

  return (
    <div className="min-h-screen bg-[#f6f6f8] font-display flex flex-col">
      <AppHeader logoTo="/dashboard" logoText="JanAwaaz" navLinks={HEADER_NAV} />

      <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-8">
        {/* Page header */}
        <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Verification Requests</h1>
            <p className="text-slate-500 text-sm mt-0.5">
              Help verify open civic issues reported by your community
            </p>
          </div>

          {/* Info badge */}
          <div className="flex items-center gap-2 bg-blue-50 text-blue-700 border border-blue-100 rounded-lg px-3 py-2 text-sm">
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>info</span>
            Verify only issues you have personally observed
          </div>
        </div>

        {/* Filters row */}
        <div className="flex flex-wrap gap-3 mb-6">
          {/* Category */}
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-2 shadow-sm">
            <span className="material-symbols-outlined text-slate-400" style={{ fontSize: 16 }}>filter_list</span>
            <select
              value={category}
              onChange={handleCategoryChange}
              className="text-sm text-slate-700 bg-transparent focus:outline-none"
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>

          {/* Sort */}
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-2 shadow-sm">
            <span className="material-symbols-outlined text-slate-400" style={{ fontSize: 16 }}>sort</span>
            <select
              value={sort}
              onChange={handleSortChange}
              className="text-sm text-slate-700 bg-transparent focus:outline-none"
            >
              {SORT_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>

          {pagination && (
            <span className="ml-auto flex items-center text-sm text-slate-500">
              {pagination.total} issue{pagination.total !== 1 ? 's' : ''} awaiting verification
            </span>
          )}
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
              <span className="material-symbols-outlined text-slate-300" style={{ fontSize: 40 }}>verified_user</span>
            </div>
            <h3 className="text-lg font-semibold text-slate-700 mb-2">All caught up!</h3>
            <p className="text-slate-400 text-sm">No pending verification requests right now.</p>
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
