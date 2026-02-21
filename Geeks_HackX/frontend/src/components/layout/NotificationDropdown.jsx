import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { notificationService } from '@services/notificationService';
import { useSocket } from '@hooks/useSocket';

const ICON_MAP = {
  new_issue_nearby: 'location_on',
  issue_verified:   'verified',
  issue_liked:      'favorite',
  issue_commented:  'comment',
  status_update:    'sync',
  issue_resolved:   'check_circle',
  system:           'info',
};

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function NotificationDropdown() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const { socket } = useSocket();

  // Fetch notifications from API
  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const data = await notificationService.getNotifications({ limit: 20 });
      setNotifications(data.notifications ?? []);
      setUnreadCount(data.unreadCount ?? 0);
    } catch {
      /* silent — bell still works */
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Listen for real-time notifications via socket
  useEffect(() => {
    if (!socket) return;

    const handleNew = (payload) => {
      setNotifications((prev) => [payload, ...prev].slice(0, 50));
      setUnreadCount((c) => c + 1);
    };

    socket.on('notification', handleNew);
    return () => socket.off('notification', handleNew);
  }, [socket]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch { /* silent */ }
  };

  const handleMarkRead = async (id) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch { /* silent */ }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell button */}
      <button
        onClick={() => { setOpen((v) => !v); if (!open) fetchNotifications(); }}
        className="flex h-10 w-10 items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 relative"
      >
        <span className="material-symbols-outlined" style={{ fontSize: 24 }}>notifications</span>
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute right-0 top-12 z-50 w-80 sm:w-96 max-h-[28rem] overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xl flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs text-[#1e3b8a] hover:underline font-medium"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto">
            {loading && notifications.length === 0 && (
              <div className="flex justify-center py-8 text-slate-400 text-sm">Loading…</div>
            )}

            {!loading && notifications.length === 0 && (
              <div className="flex flex-col items-center justify-center py-10 text-center px-4">
                <span className="material-symbols-outlined text-slate-300 mb-2" style={{ fontSize: 36 }}>notifications_off</span>
                <p className="text-sm text-slate-400">No notifications yet</p>
              </div>
            )}

            {notifications.map((n) => {
              // Extract issue ID — could be a populated object or a plain ObjectId string
              const issueId = typeof n.issue === 'object' ? n.issue?._id : n.issue;

              return (
              <div
                key={n._id || n.createdAt}
                onClick={() => {
                  if (!n.isRead && n._id) handleMarkRead(n._id);
                  if (issueId) {
                    setOpen(false);
                    navigate(`/issues/${issueId}`);
                  }
                }}
                className={`flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors border-b border-slate-50 dark:border-slate-800 ${
                  n.isRead
                    ? 'bg-white dark:bg-slate-900'
                    : 'bg-blue-50/60 dark:bg-blue-950/20'
                } hover:bg-slate-50 dark:hover:bg-slate-800`}
              >
                {/* Icon */}
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                  n.isRead ? 'bg-slate-100 dark:bg-slate-800 text-slate-400' : 'bg-[#1e3b8a]/10 text-[#1e3b8a]'
                }`}>
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                    {ICON_MAP[n.type] || 'notifications'}
                  </span>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm leading-snug ${n.isRead ? 'text-slate-600 dark:text-slate-400' : 'text-slate-900 dark:text-white font-medium'}`}>
                    {n.title}
                  </p>
                  {n.body && (
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 truncate">{n.body}</p>
                  )}
                  <p className="text-[11px] text-slate-400 mt-1">{timeAgo(n.createdAt)}</p>
                </div>

                {/* Unread dot */}
                {!n.isRead && (
                  <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-[#1e3b8a]" />
                )}
              </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
