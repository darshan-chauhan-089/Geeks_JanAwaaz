import { Link } from 'react-router-dom';
import StatusBadge from '@components/ui/StatusBadge';
import VerificationBar from '@components/ui/VerificationBar';
import { formatCount, timeAgo } from '@utils/formatters';

/**
 * IssueCard — used on Landing (variant="landing") and Dashboard (variant="dashboard").
 *
 * Props:
 *  - issue          {object}   issue data from API
 *  - variant        {'landing'|'dashboard'}
 *  - onLike         {fn}       (issueId) → called when the like button is clicked
 *  - isLiked        {boolean}  whether the current user has liked this issue
 *  - onVerify       {fn}       (issueId) → opens the verify modal; only for dashboard
 *  - verifyLoading  {boolean}  deprecated — kept for back-compat; unused
 */
export default function IssueCard({
  issue        = {},
  variant      = 'landing',
  onLike,
  isLiked      = false,
  onVerify,
  verifyLoading = false,
}) {
  const {
    _id,
    title      = 'Untitled Issue',
    description = '',
    image,
    images      = [],
    status      = 'Pending',
    location,
    verificationCount = 0,
    verifiedPercent   = 0,
    likeCount         = 0,
    commentCount      = 0,
    createdAt,
  } = issue;

  // Primary cover: use the dedicated `image` field first, then fall back to images array
  const coverImage = image?.url || images[0]?.url || images[0] || null;
  // Prefer specific address → city → area → fallback
  const locationLabel =
    location?.address ?? location?.city ?? location?.area ?? 'Unknown location';
  const isResolved = status?.toLowerCase() === 'resolved';

  return (
    <div className="bg-background-light dark:bg-slate-800/50 rounded-lg overflow-hidden border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-xl transition-all group flex flex-col">
      {/* ── Cover image ── */}
      <div className="relative h-48 overflow-hidden bg-slate-200 dark:bg-slate-700">
        {coverImage ? (
          <img
            src={coverImage}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-400">
            <span className="material-symbols-outlined" style={{ fontSize: 48 }}>image_not_supported</span>
          </div>
        )}
        <div className="absolute top-4 left-4">
          <StatusBadge status={status} />
        </div>
        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-2 py-1 rounded text-xs font-bold text-slate-900 flex items-center gap-1">
          <span className="material-symbols-outlined" style={{ fontSize: 14 }}>map</span>
          {locationLabel}
        </div>
      </div>

      {/* ── Body ── */}
      <div className="p-6 flex flex-col flex-1">
        <h4 className="font-bold text-lg mb-2 line-clamp-1">{title}</h4>
        <p className="text-slate-500 dark:text-slate-400 text-sm line-clamp-2 mb-4">{description}</p>

        {/* Verification row — differs by variant */}
        {variant === 'landing' ? (
          <VerificationBar percent={verifiedPercent} resolved={isResolved} />
        ) : (
          /* Dashboard: count + verify/reject buttons */
          <div className="flex items-center justify-between mb-4 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg">
            <div className="flex items-center gap-2">
              <span
                className="material-symbols-outlined text-green-600"
                style={{ fontSize: 20, fontVariationSettings: "'FILL' 1" }}
              >
                verified
              </span>
              <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                {formatCount(verificationCount)} verified
              </span>
            </div>
            <button
              onClick={() => onVerify?.(_id)}
              title="Verify this issue"
              className="flex items-center gap-1.5 px-3 h-8 rounded-lg bg-[#1e3b8a] text-white text-xs font-semibold hover:bg-[#162d6e] transition-colors"
            >
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>verified</span>
              Verify
            </button>
          </div>
        )}

        {/* ── Footer ── */}
        <div className="mt-auto pt-4 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
          {variant === 'landing' ? (
            /* Landing: avatar cluster + time */
            <>
              <div className="flex -space-x-2">
                {[0, 1].map((i) => (
                  <div
                    key={i}
                    className="w-8 h-8 rounded-full border-2 border-white dark:border-slate-800 bg-slate-300"
                  />
                ))}
                {verificationCount > 2 && (
                  <div className="w-8 h-8 rounded-full border-2 border-white dark:border-slate-800 bg-[#1e3b8a]/20 text-[#1e3b8a] text-[10px] flex items-center justify-center font-bold">
                    +{verificationCount - 2}
                  </div>
                )}
              </div>
              <span className="text-[11px] text-slate-400 font-medium">
                {createdAt ? `Reported ${timeAgo(createdAt)}` : 'Recently reported'}
              </span>
            </>
          ) : (
            /* Dashboard: like + comments + time + details link */
            <>
              <div className="flex items-center gap-4 text-slate-400">
                {/* Like button */}
                <button
                  type="button"
                  aria-label={isLiked ? 'Unlike issue' : 'Like issue'}
                  aria-pressed={isLiked}
                  onClick={() => onLike?.(_id)}
                  className="flex items-center gap-1.5 hover:text-amber-500 transition-colors"
                >
                  <span
                    className="material-symbols-outlined"
                    style={{
                      fontSize: 20,
                      fontVariationSettings: isLiked ? "'FILL' 1" : "'FILL' 0",
                      color: isLiked ? '#f59e0b' : 'inherit',
                    }}
                  >
                    favorite
                  </span>
                  <span className="text-sm font-medium">{formatCount(likeCount)}</span>
                </button>

                <div className="flex items-center gap-1.5 hover:text-[#1e3b8a] cursor-pointer transition-colors">
                  <span className="material-symbols-outlined" style={{ fontSize: 20 }}>chat_bubble</span>
                  <span className="text-sm font-medium">{commentCount ?? 0}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined" style={{ fontSize: 20 }}>schedule</span>
                  <span className="text-sm font-medium">{createdAt ? timeAgo(createdAt) : '—'}</span>
                </div>
              </div>
              <Link
                to={`/issues/${_id}`}
                className="text-[#1e3b8a] font-bold text-sm hover:underline"
              >
                {isResolved ? 'History' : 'Details'}
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
