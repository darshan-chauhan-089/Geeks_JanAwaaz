import { Link } from 'react-router-dom';
import { timeAgo } from '@utils/formatters';

const TYPE_CONFIG = {
  verified:  { bg: 'bg-green-500',  icon: 'check' },
  report:    { bg: 'bg-[#1e3b8a]', icon: 'report' },
  badge:     { bg: 'bg-slate-100 dark:bg-slate-800', icon: 'emoji_events', iconColor: 'text-slate-500' },
  resolved:  { bg: 'bg-emerald-500', icon: 'task_alt' },
};

/**
 * ActivityItem — one entry in the profile activity timeline.
 *
 * Props:
 *  - type        {'verified'|'report'|'badge'|'resolved'}
 *  - text        {string}   main description (can contain issueTitle)
 *  - issueId     {string}   for linking to issue
 *  - issueTitle  {string}
 *  - badge       {string}   badge name (type=badge)
 *  - badgeDesc   {string}
 *  - status      {string}   optional status tag
 *  - createdAt   {string}
 *  - isLast      {boolean}  omit the tail line connector
 */
export default function ActivityItem({
  type = 'report',
  text,
  issueId,
  issueTitle,
  badge,
  badgeDesc,
  status,
  createdAt,
  isLast = false,
}) {
  const { bg, icon, iconColor = 'text-white' } = TYPE_CONFIG[type] ?? TYPE_CONFIG.report;

  return (
    <li>
      <div className={`relative ${isLast ? '' : 'pb-8'}`}>
        {!isLast && (
          <span
            className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-slate-200 dark:bg-slate-800"
            aria-hidden="true"
          />
        )}
        <div className="relative flex space-x-3">
          {/* Icon bubble */}
          <div>
            <span className={`h-8 w-8 rounded-full ${bg} flex items-center justify-center ring-8 ring-white dark:ring-slate-900`}>
              <span className={`material-symbols-outlined ${iconColor} text-sm`} style={{ fontSize: 16 }}>
                {icon}
              </span>
            </span>
          </div>

          {/* Content */}
          <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
            <div>
              {type === 'badge' ? (
                <>
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    Earned a new badge:{' '}
                    <span className="font-medium text-slate-900 dark:text-white">{badge}</span>
                  </p>
                  {badgeDesc && (
                    <p className="mt-1 text-xs text-slate-500">{badgeDesc}</p>
                  )}
                </>
              ) : (
                <>
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    {text}{' '}
                    {issueId && issueTitle && (
                      <Link
                        to={`/issues/${issueId}`}
                        className="font-medium text-slate-900 dark:text-white hover:text-[#1e3b8a]"
                      >
                        {issueTitle}
                      </Link>
                    )}
                  </p>
                  {status && (
                    <div className="mt-2 flex gap-2">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">
                        {status}
                      </span>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Timestamp */}
            <div className="whitespace-nowrap text-right text-xs text-slate-500">
              <time>{createdAt ? timeAgo(createdAt) : '—'}</time>
            </div>
          </div>
        </div>
      </div>
    </li>
  );
}
