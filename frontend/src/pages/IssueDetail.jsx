import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { issueService } from '@services/issueService';
import { useAuth } from '@hooks/useAuth';
import { useSocket } from '@hooks/useSocket';
import Loader from '@components/common/Loader';
import { timeAgo, formatCount } from '@utils/formatters';
import { STATUS_COLORS } from '@utils/constants';

export default function IssueDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { onIssueVerified } = useSocket();

  const [issue,   setIssue]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');
  const [liking,  setLiking]  = useState(false);
  const [comment, setComment] = useState('');
  const [commenting, setCommenting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    issueService.getIssue(id)
      .then((data) => { if (!cancelled) { setIssue(data); setLoading(false); } })
      .catch((err) => { if (!cancelled) { setError(err.message); setLoading(false); } });
    return () => { cancelled = true; };
  }, [id]);

  // ─── Listen for issue:verified socket event ────────────────────────────────
  useEffect(() => {
    const unsubscribe = onIssueVerified((data) => {
      // Update verification count in state when issue is verified
      if (data?.issueId === id) {
        setIssue((prev) => ({
          ...prev,
          verificationCount: data.verificationCount || (prev?.verificationCount || 0) + 1,
          status: data.status || prev?.status,
          averageSeverity: data.averageSeverity ?? prev?.averageSeverity,
        }));
      }
    });

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [id, onIssueVerified]);

  const handleLike = async () => {
    if (!isAuthenticated) { navigate('/login'); return; }
    setLiking(true);
    try {
      const result = await issueService.likeIssue(id);
      setIssue((prev) => ({ ...prev, likeCount: result.likeCount }));
    } catch (err) {
      alert(err.message);
    } finally {
      setLiking(false);
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;
    setCommenting(true);
    try {
      const fd = new FormData();
      fd.append('text', comment.trim());
      const newComment = await issueService.addComment(id, fd);
      setIssue((prev) => ({ ...prev, comments: [...(prev.comments || []), newComment], commentCount: (prev.commentCount || 0) + 1 }));
      setComment('');
    } catch (err) {
      alert(err.message);
    } finally {
      setCommenting(false);
    }
  };

  if (loading) return <Loader fullScreen />;
  if (error)   return <p style={{ padding: '2rem', color: 'var(--color-danger)' }}>{error}</p>;
  if (!issue)  return null;

  return (
    <main style={{ maxWidth: 750, margin: '0 auto', padding: '2rem 1rem' }}>
      {/* Back */}
      <button onClick={() => navigate(-1)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--color-primary)', marginBottom: '1rem', fontSize: '0.9rem' }}>
        ← Back
      </button>

      {/* Cover image */}
      {issue.image?.url && (
        <img src={issue.image.url} alt={issue.title} style={{ width: '100%', maxHeight: 350, objectFit: 'cover', borderRadius: 'var(--radius)', marginBottom: '1.25rem' }} />
      )}

      {/* Title + status */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem', marginBottom: '0.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>{issue.title}</h1>
        <span style={{ background: STATUS_COLORS[issue.status], color: '#fff', padding: '0.25rem 0.75rem', borderRadius: 999, fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
          {issue.status}
        </span>
      </div>

      <p style={{ color: '#6b7280', fontSize: '0.88rem', marginBottom: '1rem' }}>
        {issue.category} · Reported {timeAgo(issue.createdAt)} by {issue.createdBy?.name ?? 'Unknown'}
      </p>

      {/* Location */}
      {(issue.location?.address || issue.location?.city) && (
        <p style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#6b7280', fontSize: '0.88rem', marginBottom: '1rem' }}>
          <span>\uD83D\uDCCD</span>
          <span>
            {issue.location.address
              ? `${issue.location.address}${issue.location.city ? ` — ${issue.location.city}` : ''}`
              : issue.location.city
            }
          </span>
        </p>
      )}

      <p style={{ lineHeight: 1.7, marginBottom: '1.5rem' }}>{issue.description}</p>

      {/* Stats */}
      <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <button onClick={handleLike} disabled={liking || !isAuthenticated} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', border: '1px solid var(--color-border)', padding: '0.45rem 0.9rem', borderRadius: 'var(--radius)', background: 'none', cursor: 'pointer' }}>
          ♥ {formatCount(issue.likeCount ?? 0)}
        </button>
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', border: '1px solid var(--color-border)', padding: '0.45rem 0.9rem', borderRadius: 'var(--radius)' }}>
          ✓ {issue.verificationCount ?? 0} verified
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', border: '1px solid var(--color-border)', padding: '0.45rem 0.9rem', borderRadius: 'var(--radius)' }}>
          ☆ {issue.averageSeverity?.toFixed(1) ?? '—'} / 5
        </span>
      </div>

      {/* Comments */}
      <section>
        <h2 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>Comments ({issue.commentCount ?? 0})</h2>
        {(issue.comments || []).map((c) => (
          <div key={c._id} style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: '0.75rem', marginBottom: '0.75rem' }}>
            <p style={{ fontSize: '0.85rem', fontWeight: 600 }}>{c.user?.name ?? 'Anonymous'} <span style={{ color: '#9ca3af', fontWeight: 400 }}>· {timeAgo(c.createdAt)}</span></p>
            <p style={{ marginTop: '0.25rem' }}>{c.text}</p>
          </div>
        ))}

        {isAuthenticated && (
          <form onSubmit={handleComment} style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
            <input
              type="text"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Add a comment…"
              style={{ flex: 1, padding: '0.6rem 0.85rem', border: '1.5px solid #d1d5db', borderRadius: 'var(--radius)', fontSize: '0.95rem', background: '#ffffff', color: '#111827', outline: 'none' }}
            />
            <button type="submit" disabled={commenting || !comment.trim()} style={{ padding: '0.55rem 1.1rem', background: 'var(--color-primary)', color: '#fff', border: 'none', borderRadius: 'var(--radius)', fontWeight: 600 }}>
              {commenting ? '…' : 'Post'}
            </button>
          </form>
        )}
      </section>
    </main>
  );
}
