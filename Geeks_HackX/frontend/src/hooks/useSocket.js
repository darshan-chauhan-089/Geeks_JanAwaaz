import { useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import { SOCKET_URL } from '@utils/constants';
import { useToast } from './useToast';

// ─── Module-level singleton ────────────────────────────────────────────────────
// One Socket.io connection for the whole app lifetime.  Multiple useSocket()
// callers share this single instance; the socket only disconnects when the
// last consumer unmounts.

/** @type {import('socket.io-client').Socket | null} */
let _socket     = null;
let _refCount   = 0;

function acquireSocket() {
  if (!_socket || _socket.disconnected) {
    _socket = io(SOCKET_URL, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      autoConnect: true,
    });

    _socket.on('connect',         () => console.debug('[Socket] connected',    _socket.id));
    _socket.on('disconnect',      (r) => console.debug('[Socket] disconnected', r));
    _socket.on('connect_error',   (e) => console.warn('[Socket] connect error', e.message));
    _socket.on('reconnect',       (n) => console.debug('[Socket] reconnected after', n, 'attempts'));
  }
  return _socket;
}

function releaseSocket() {
  _refCount -= 1;
  if (_refCount <= 0 && _socket) {
    _socket.disconnect();
    _socket    = null;
    _refCount  = 0;
  }
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
/**
 * Returns the shared Socket.io client instance and room-join helpers.
 * Also supports listening to "issue:verified" events to update UI state.
 *
 * Usage:
 *   const { socket, joinIssueRoom, leaveIssueRoom, onIssueVerified } = useSocket();
 *   
 *   // Option 1: Listen to issue verified events
 *   onIssueVerified((issueId, updateFn) => {
 *     updateFn(prev => ({ ...prev, verificationCount: prev.verificationCount + 1 }));
 *   });
 *   
 *   // Option 2: Manual event listener
 *   useEffect(() => {
 *     socket?.on('issueVerified', handler);
 *     return () => socket?.off('issueVerified', handler);
 *   }, [socket]);
 */
export function useSocket({ enabled = true } = {}) {
  const socketRef = useRef(null);
  const { success, info } = useToast();

  useEffect(() => {
    if (!enabled) return undefined;

    const socket = acquireSocket();
    socketRef.current = socket;
    _refCount += 1;

    const onNotification = (payload) => {
      if (payload?.title) {
        info(payload.title);
      }
    };

    const onNearbyIssue = (payload) => {
      const title = payload?.title ? `Nearby issue: ${payload.title}` : 'New issue reported nearby';
      info(title);
    };

    const onAdminVerified = (payload) => {
      const title = payload?.title ? `Verified issue: ${payload.title}` : 'An issue was verified';
      success(title);
    };

    socket.on('notification', onNotification);
    socket.on('issue:nearby', onNearbyIssue);
    socket.on('issue:verified-admin', onAdminVerified);

    return () => {
      socket.off('notification', onNotification);
      socket.off('issue:nearby', onNearbyIssue);
      socket.off('issue:verified-admin', onAdminVerified);
      releaseSocket();
    };
  }, [enabled, info, success]);

  // ─── Helper: Listen to issue:verified event ───────────────────────────────
  const onIssueVerified = useCallback((onVerified) => {
    if (!socketRef.current) return;

    const handler = (data) => {
      // Trigger success toast
      success('Issue has reached Verified status');
      
      // Call the callback with the verified data
      if (typeof onVerified === 'function') {
        onVerified(data);
      }
      
      console.debug('[Socket] issue:verified event received:', data);
    };

    socketRef.current.on('issue:verified', handler);

    // Cleanup: remove listener on unmount
    return () => {
      socketRef.current?.off('issue:verified', handler);
    };
  }, [success]);

  // ─── Room helpers (emit wrappers) ──────────────────────────────────────────
  const joinIssueRoom  = (id)   => socketRef.current?.emit('join_issue',  id);
  const leaveIssueRoom = (id)   => socketRef.current?.emit('leave_issue', id);
  const joinAreaRoom   = (city) => socketRef.current?.emit('join_area',   city);
  const leaveAreaRoom  = (city) => socketRef.current?.emit('leave_area',  city);

  return {
    socket:           socketRef.current,
    joinIssueRoom,
    leaveIssueRoom,
    joinAreaRoom,
    leaveAreaRoom,
    onIssueVerified,  // NEW: Listen to verified events
  };
}
