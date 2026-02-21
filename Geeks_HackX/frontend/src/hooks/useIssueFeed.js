import { useCallback, useEffect, useRef, useState } from 'react';
import { useIssues } from './useIssues';
import { useSocket } from './useSocket';
import { useAuth } from './useAuth';
import { issueService } from '@services/issueService';

/**
 * Master hook that wires together:
 *  - paginated issue fetching         (useIssues)
 *  - real-time Socket.io updates      (useSocket)
 *  - optimistic Like toggle           (handleLike)
 *  - Verify-modal state + submission  (openVerifyModal / handleVerifySubmit)
 *
 * @param {object} params   Query params forwarded to GET /api/v1/issues
 * @param {object} options  Options forwarded to useIssues  { fetchOnMount?, deps?, fetcher? }
 */
export function useIssueFeed(params = {}, options = {}) {
  // ─── Core data + pagination ──────────────────────────────────────────────
  const {
    issues,
    setIssues,
    updateIssue,
    pagination,
    isLoading,
    error,
    refetch,
    nextPage,
    prevPage,
  } = useIssues(params, options);

  // ─── Socket & auth ───────────────────────────────────────────────────────
  const { socket, joinIssueRoom, leaveIssueRoom } = useSocket();
  const { user } = useAuth();

  // ─── Like state ──────────────────────────────────────────────────────────
  /** @type {[Set<string>, React.Dispatch<React.SetStateAction<Set<string>>>]} */
  const [likedIds, setLikedIds] = useState(() => new Set());

  // ─── Verify modal state ──────────────────────────────────────────────────
  const [verifyTargetId, setVerifyTargetId] = useState(null);
  const [verifyForm,     setVerifyForm]     = useState({ comment: '', rating: 3, image: null });
  const [verifyLoading,  setVerifyLoading]  = useState(false);
  const [verifyError,    setVerifyError]    = useState('');

  // ─── Track which issue rooms we've joined ────────────────────────────────
  const joinedRoomsRef = useRef(/** @type {Set<string>} */ new Set());

  // ─── Join/leave issue rooms when the list changes ────────────────────────
  useEffect(() => {
    if (!socket || !issues.length) return;

    issues.forEach(({ _id }) => {
      if (!joinedRoomsRef.current.has(_id)) {
        joinIssueRoom(_id);
        joinedRoomsRef.current.add(_id);
      }
    });

    return () => {
      joinedRoomsRef.current.forEach((id) => leaveIssueRoom(id));
      joinedRoomsRef.current.clear();
    };
  }, [socket, issues, joinIssueRoom, leaveIssueRoom]);

  // ─── Socket event listeners ───────────────────────────────────────────────
  useEffect(() => {
    if (!socket) return;

    /** New issue created — prepend to first page only */
    const onIssueCreated = ({ data }) => {
      if (!data) return;
      if (pagination?.currentPage !== 1) return;          // don't mutate non-first pages
      setIssues((prev) => {
        if (prev.some((i) => i._id === data.issueId)) return prev;
        const stub = {
          _id:               data.issueId,
          title:             data.title    ?? 'Untitled',
          category:          data.category ?? 'General',
          location:          data.location ?? {},
          status:            'Pending',
          likeCount:         0,
          verificationCount: 0,
          averageSeverity:   0,
          createdAt:         new Date().toISOString(),
        };
        return [stub, ...prev];
      });
    };

    /** Like toggled by anyone */
    const onIssueLiked = ({ issueId, data }) => {
      if (!issueId || !data) return;
      updateIssue(issueId, (i) => ({ ...i, likeCount: data.likeCount }));
      // Only update our local "liked" set if the event was triggered by current user
      if (user && data.userId === String(user._id)) {
        setLikedIds((prev) => {
          const next = new Set(prev);
          data.liked ? next.add(issueId) : next.delete(issueId);
          return next;
        });
      }
    };

    /** Issue verified by someone */
    const onIssueVerified = ({ issueId, data }) => {
      if (!issueId || !data) return;
      updateIssue(issueId, (i) => ({
        ...i,
        verificationCount: data.verificationCount ?? i.verificationCount,
        averageSeverity:   data.averageSeverity   ?? i.averageSeverity,
        status:            data.status            ?? i.status,
      }));
    };

    /** Issue status changed by admin */
    const onStatusUpdate = ({ issueId, data }) => {
      if (!issueId || !data?.status) return;
      updateIssue(issueId, (i) => ({ ...i, status: data.status }));
    };

    socket.on('issueCreated',      onIssueCreated);
    socket.on('issueLiked',        onIssueLiked);
    socket.on('issueVerified',     onIssueVerified);
    socket.on('issueStatusUpdate', onStatusUpdate);

    return () => {
      socket.off('issueCreated',      onIssueCreated);
      socket.off('issueLiked',        onIssueLiked);
      socket.off('issueVerified',     onIssueVerified);
      socket.off('issueStatusUpdate', onStatusUpdate);
    };
  }, [socket, pagination, updateIssue, setIssues, user]);

  // ─── Optimistic Like toggle ───────────────────────────────────────────────
  const handleLike = useCallback(
    async (issueId) => {
      if (!user) return;                                   // guard — must be logged in

      const wasLiked = likedIds.has(issueId);
      const delta    = wasLiked ? -1 : 1;

      // Optimistic update
      setLikedIds((prev) => {
        const next = new Set(prev);
        wasLiked ? next.delete(issueId) : next.add(issueId);
        return next;
      });
      updateIssue(issueId, (i) => ({
        ...i,
        likeCount: Math.max(0, (i.likeCount ?? 0) + delta),
      }));

      try {
        const result = await issueService.likeIssue(issueId);
        // Reconcile with server truth
        updateIssue(issueId, (i) => ({ ...i, likeCount: result.likeCount }));
        setLikedIds((prev) => {
          const next = new Set(prev);
          result.liked ? next.add(issueId) : next.delete(issueId);
          return next;
        });
      } catch {
        // Revert optimistic change on failure
        setLikedIds((prev) => {
          const next = new Set(prev);
          wasLiked ? next.add(issueId) : next.delete(issueId);
          return next;
        });
        updateIssue(issueId, (i) => ({
          ...i,
          likeCount: Math.max(0, (i.likeCount ?? 0) - delta),
        }));
      }
    },
    [user, likedIds, updateIssue],
  );

  // ─── Verify modal helpers ─────────────────────────────────────────────────
  const openVerifyModal = useCallback((id) => {
    setVerifyTargetId(id);
    setVerifyForm({ comment: '', rating: 3, image: null });
    setVerifyError('');
  }, []);

  const closeVerifyModal = useCallback(() => {
    setVerifyTargetId(null);
    setVerifyError('');
  }, []);

  const handleVerifySubmit = useCallback(async () => {
    if (!verifyTargetId) return;

    if (!verifyForm.comment.trim()) {
      setVerifyError('Verification comment is required.');
      return;
    }
    if (verifyForm.rating < 1 || verifyForm.rating > 5) {
      setVerifyError('Please select a severity rating (1–5).');
      return;
    }

    setVerifyLoading(true);
    setVerifyError('');

    const fd = new FormData();
    fd.append('comment',           verifyForm.comment.trim());
    fd.append('seriousnessRating', String(verifyForm.rating));
    if (verifyForm.image) fd.append('image', verifyForm.image);

    try {
      const result = await issueService.verifyIssue(verifyTargetId, fd);
      if (result?.issue) {
        updateIssue(verifyTargetId, () => ({ ...result.issue }));
      } else {
        updateIssue(verifyTargetId, (i) => ({
          ...i,
          verificationCount: (i.verificationCount ?? 0) + 1,
        }));
      }
      closeVerifyModal();
    } catch (err) {
      setVerifyError(err?.message || 'Verification failed. Please try again.');
    } finally {
      setVerifyLoading(false);
    }
  }, [verifyTargetId, verifyForm, updateIssue, closeVerifyModal]);

  // ─── Public API ───────────────────────────────────────────────────────────
  return {
    // Feed
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
  };
}
