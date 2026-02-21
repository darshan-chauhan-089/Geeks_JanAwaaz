import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@hooks/useAuth';
import Navbar from '@components/layout/Navbar';
import Footer from '@components/layout/Footer';
import ActivityItem from '@components/issues/ActivityItem';
import Loader from '@components/common/Loader';
import { issueService } from '@services/issueService';
import { timeAgo } from '@utils/formatters';

/* ── Stat pill ──────────────────────────────────────────────────────────────── */
function ProfileStat({ icon, value, label, color = 'text-[#1e3b8a]' }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm px-5 py-4 flex items-center gap-4">
      <div className={`size-11 rounded-xl bg-slate-50 flex items-center justify-center ${color}`}>
        <span className="material-symbols-outlined" style={{ fontSize: 22 }}>{icon}</span>
      </div>
      <div>
        <p className={`text-2xl font-bold ${color}`}>{value}</p>
        <p className="text-xs text-slate-500 uppercase tracking-wider mt-0.5">{label}</p>
      </div>
    </div>
  );
}

/* ── Badge chip ─────────────────────────────────────────────────────────────── */
function BadgeChip({ icon, label }) {
  return (
    <span className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-100 text-amber-700 text-xs font-semibold rounded-full">
      <span className="material-symbols-outlined" style={{ fontSize: 14 }}>{icon}</span>
      {label}
    </span>
  );
}

/* ── Modal shell ────────────────────────────────────────────────────────────── */
function Modal({ title, onClose, children }) {
  // Close on backdrop click
  const backdropRef = useRef(null);
  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
      onClick={(e) => { if (e.target === backdropRef.current) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-base font-bold text-slate-800">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="size-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>close</span>
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

/* ── Edit Profile modal ─────────────────────────────────────────────────────── */
function EditProfileModal({ user, onClose, onSave }) {
  const [name,       setName]       = useState(user.name ?? '');
  const [location,   setLocation]   = useState(
    user.locationName ?? (typeof user.location === 'string' ? user.location : '')
  );
  const [avatarFile,    setAvatarFile]    = useState(null);   // File object
  const [avatarPreview, setAvatarPreview] = useState(null);   // local object URL
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState('');
  const fileInputRef = useRef(null);

  // Clean up object URL on unmount to avoid memory leaks
  useEffect(() => {
    return () => { if (avatarPreview) URL.revokeObjectURL(avatarPreview); };
  }, [avatarPreview]);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setError('Photo must be under 5 MB.'); return; }
    if (!file.type.startsWith('image/')) { setError('Please select an image file.'); return; }
    setError('');
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) { setError('Name cannot be empty.'); return; }
    setSaving(true);
    setError('');
    try {
      // Always use FormData so the file is sent correctly
      const fd = new FormData();
      fd.append('name', name.trim());
      if (location.trim()) fd.append('locationName', location.trim());
      if (avatarFile) fd.append('avatar', avatarFile);
      // Send locationName (plain text) — never the GeoJSON 'location' field
      await onSave(fd);
      onClose();
    } catch (err) {
      setError(err?.message ?? 'Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Avatar display: preview > existing > initials
  const initials = user.name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) ?? '?';
  const displaySrc = avatarPreview ?? user.avatar?.url ?? null;

  return (
    <Modal title="Edit Profile" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">

        {/* Avatar picker */}
        <div className="flex flex-col items-center gap-2 pb-2">
          <div className="relative group">
            <div className="size-20 rounded-2xl overflow-hidden border-2 border-slate-200 bg-slate-50 flex items-center justify-center">
              {displaySrc ? (
                <img src={displaySrc} alt="avatar preview" className="size-full object-cover" />
              ) : (
                <span className="text-2xl font-bold text-[#1e3b8a]">{initials}</span>
              )}
            </div>
            {/* Camera overlay */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute inset-0 rounded-2xl bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
              title="Change photo"
            >
              <span className="material-symbols-outlined text-white" style={{ fontSize: 24 }}>photo_camera</span>
            </button>
          </div>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="text-xs text-[#1e3b8a] font-medium hover:underline"
          >
            {avatarFile ? 'Change photo' : 'Upload photo'}
          </button>
          {avatarFile && (
            <p className="text-xs text-slate-400 truncate max-w-[200px]">{avatarFile.name}</p>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Full Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3b8a]/30 focus:border-[#1e3b8a] transition-colors"
            placeholder="Your name"
            disabled={saving}
            autoFocus
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Location <span className="text-slate-400 font-normal">(optional)</span></label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3b8a]/30 focus:border-[#1e3b8a] transition-colors"
            placeholder="e.g. Mumbai, Maharashtra"
            disabled={saving}
          />
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
        <div className="flex gap-3 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2.5 border border-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
            disabled={saving}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex-1 px-4 py-2.5 bg-[#1e3b8a] text-white rounded-lg text-sm font-semibold hover:bg-[#1e3b8a]/90 transition-colors disabled:opacity-60"
            disabled={saving}
          >
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

/* ── Settings / Change-password modal ──────────────────────────────────────── */
function SettingsModal({ onClose, onChangePassword }) {
  const [tab,             setTab]             = useState('password');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword,     setNewPassword]     = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (newPassword !== confirmPassword) { setError('New passwords do not match.'); return; }
    if (newPassword.length < 8)          { setError('Password must be at least 8 characters.'); return; }
    setSaving(true);
    try {
      await onChangePassword({ currentPassword, newPassword, confirmPassword });
      setSuccess('Password changed successfully!');
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
    } catch (err) {
      setError(err?.message ?? 'Failed to change password.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title="Account Settings" onClose={onClose}>
      {/* Tab strip */}
      <div className="flex gap-1 bg-slate-100 rounded-lg p-1 mb-5">
        {['password'].map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`flex-1 py-1.5 rounded-md text-sm font-medium transition-colors capitalize ${
              tab === t ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {t === 'password' ? 'Change Password' : t}
          </button>
        ))}
      </div>

      {tab === 'password' && (
        <form onSubmit={handleSubmit} className="space-y-4">
          {[
            { label: 'Current Password', val: currentPassword, setter: setCurrentPassword },
            { label: 'New Password',     val: newPassword,     setter: setNewPassword     },
            { label: 'Confirm Password', val: confirmPassword, setter: setConfirmPassword },
          ].map(({ label, val, setter }) => (
            <div key={label}>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>
              <input
                type="password"
                value={val}
                onChange={(e) => setter(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3b8a]/30 focus:border-[#1e3b8a] transition-colors"
                disabled={saving}
                autoComplete="new-password"
              />
            </div>
          ))}
          {error   && <p className="text-sm text-red-500">{error}</p>}
          {success && <p className="text-sm text-emerald-600">{success}</p>}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
              disabled={saving}
            >
              Close
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2.5 bg-[#1e3b8a] text-white rounded-lg text-sm font-semibold hover:bg-[#1e3b8a]/90 transition-colors disabled:opacity-60"
              disabled={saving}
            >
              {saving ? 'Updating…' : 'Update Password'}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}

export default function Profile() {
  const { user, updateProfile, changePassword } = useAuth();

  const [activity,      setActivity]      = useState([]);
  const [stats,         setStats]         = useState(null);
  const [loadingStats,  setLoadingStats]  = useState(true);
  const [loadingAct,    setLoadingAct]    = useState(true);
  const [editOpen,      setEditOpen]      = useState(false);
  const [settingsOpen,  setSettingsOpen]  = useState(false);

  useEffect(() => {
    if (!user) return;

    /* Fetch user stats */
    issueService
      .getUserStats()
      .then((data) => setStats(data))
      .catch(() => setStats({ issueCount: 0, verificationCount: 0, resolvedCount: 0 }))
      .finally(() => setLoadingStats(false));

    /* Fetch recent activity */
    issueService
      .getUserActivity()
      .then((data) => setActivity(Array.isArray(data) ? data.slice(0, 8) : []))
      .catch(() => setActivity([]))
      .finally(() => setLoadingAct(false));
  }, [user]);

  if (!user) return null; // ProtectedRoute handles redirect

  const initials = user.name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) ?? '?';

  return (
    <div className="min-h-screen bg-[#f6f6f8] font-display flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-10 space-y-8">

        {/* ── Profile header card ── */}
        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Cover strip */}
          <div className="h-28 bg-gradient-to-br from-[#1e3b8a] to-blue-600" />

          <div className="px-6 pb-6">
            {/* Avatar row */}
            <div className="flex items-end justify-between -mt-12 mb-4 flex-wrap gap-4">
              {/* Avatar (click to open edit modal) */}
              <div className="relative group cursor-pointer" onClick={() => setEditOpen(true)}>
                <div className="size-24 rounded-2xl bg-white border-4 border-white shadow-lg flex items-center justify-center overflow-hidden">
                  {user.avatar?.url ? (
                    <img src={user.avatar.url} alt={user.name} className="size-full object-cover" />
                  ) : (
                    <span className="text-3xl font-bold text-[#1e3b8a]">{initials}</span>
                  )}
                </div>
                {/* Camera overlay on hover */}
                <div className="absolute inset-0 rounded-2xl bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="material-symbols-outlined text-white" style={{ fontSize: 22 }}>photo_camera</span>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setSettingsOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>settings</span>
                  Settings
                </button>
                <button
                  type="button"
                  onClick={() => setEditOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-[#1e3b8a] text-white rounded-lg text-sm font-semibold hover:bg-[#1e3b8a]/90 transition-colors shadow-sm shadow-[#1e3b8a]/20"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>edit</span>
                  Edit Profile
                </button>
              </div>
            </div>

            {/* Name + email + badges row */}
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-slate-900">{user.name}</h1>
                <p className="text-slate-500 text-sm mt-0.5">{user.email}</p>
                {user.locationName && (
                  <p className="flex items-center gap-1 text-slate-400 text-xs mt-2">
                    <span className="material-symbols-outlined" style={{ fontSize: 14 }}>location_on</span>
                    {user.locationName}
                  </p>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                <BadgeChip icon="verified" label="Verified Citizen" />
                {user.role === 'official' && <BadgeChip icon="shield" label="Official" />}
                <BadgeChip icon="emoji_events" label="Top Reporter" />
              </div>
            </div>
          </div>
        </section>

        {/* ── Stats row ── */}
        <section>
          <h2 className="text-lg font-bold text-slate-800 mb-4">Your Impact</h2>
          {loadingStats ? (
            <div className="flex justify-center py-8"><Loader /></div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <ProfileStat icon="campaign" value={stats?.issueCount ?? 0}        label="Issues Reported" />
              <ProfileStat icon="verified" value={stats?.verificationCount ?? 0} label="Verifications"    color="text-emerald-600" />
              <ProfileStat icon="task_alt" value={stats?.resolvedCount ?? 0}     label="Issues Resolved"  color="text-blue-500" />
            </div>
          )}
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ── Activity timeline ── */}
          <section className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h2 className="text-lg font-bold text-slate-800 mb-6">Recent Activity</h2>

            {loadingAct ? (
              <div className="flex justify-center py-8"><Loader /></div>
            ) : activity.length === 0 ? (
              <div className="flex flex-col items-center py-10 text-center">
                <span className="material-symbols-outlined text-slate-200 block mb-2" style={{ fontSize: 48 }}>history</span>
                <p className="text-slate-400 text-sm">No activity yet. Start by reporting an issue.</p>
              </div>
            ) : (
              <ul className="relative">
                {activity.map((item, i) => (
                  <ActivityItem
                    key={item._id ?? i}
                    type={item.type === 'reported' ? 'report' : (item.type ?? 'report')}
                    text={item.type === 'reported' ? 'Reported an issue:' : 'Activity:'}
                    issueId={String(item._id ?? '')}
                    issueTitle={typeof item.title === 'string' ? item.title : ''}
                    status={typeof item.status === 'string' ? item.status : undefined}
                    createdAt={item.createdAt ?? item.date}
                    isLast={i === activity.length - 1}
                  />
                ))}
              </ul>
            )}
          </section>

          {/* ── Sidebar cards ── */}
          <aside className="space-y-5">
            {/* Impact milestone */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-3">
                <span className="material-symbols-outlined text-amber-400" style={{ fontSize: 20 }}>emoji_events</span>
                <h3 className="font-semibold text-slate-800">Impact Milestone</h3>
              </div>
              <p className="text-sm text-slate-500 mb-4">
                You're {15 - (stats?.issueCount ?? 0 % 15)} reports away from the{' '}
                <span className="font-semibold text-[#1e3b8a]">Community Champion</span> badge.
              </p>
              <div className="relative h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="absolute inset-y-0 left-0 bg-[#1e3b8a] rounded-full transition-all"
                  style={{ width: `${Math.min(((stats?.issueCount ?? 0) % 15) / 15 * 100, 100)}%` }}
                />
              </div>
            </div>

            {/* Location impact */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-3">
                <span className="material-symbols-outlined text-[#1e3b8a]" style={{ fontSize: 20 }}>location_on</span>
                <h3 className="font-semibold text-slate-800">Local Impact</h3>
              </div>
              <p className="text-sm text-slate-500">
                Your reports contribute to improving your area. Keep reporting to raise community awareness.
              </p>
              <Link
                to="/dashboard"
                className="mt-4 flex items-center gap-1 text-sm font-semibold text-[#1e3b8a] hover:underline"
              >
                Browse local issues
                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>arrow_forward</span>
              </Link>
            </div>
          </aside>
        </div>
      </main>

      {/* ── Modals ── */}
      {editOpen && (
        <EditProfileModal
          user={user}
          onClose={() => setEditOpen(false)}
          onSave={updateProfile}
        />
      )}
      {settingsOpen && (
        <SettingsModal
          onClose={() => setSettingsOpen(false)}
          onChangePassword={changePassword}
        />
      )}

      <Footer />
    </div>
  );
}
