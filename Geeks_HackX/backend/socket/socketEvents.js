/**
 * socketEvents.js
 * Named server-to-client emitter functions.
 *
 * Import this module from controllers / services — never from socket/index.js
 * to avoid circular dependencies.
 *
 * Emitted events (client subscribes to these):
 *   issueCreated    — broadcast to all connected clients
 *   issueLiked      — broadcast to issue_<id> room
 *   issueVerified   — broadcast to issue_<id> room
 *   issueStatusUpdate — broadcast to issue_<id> room + any area rooms
 *   newComment      — broadcast to issue_<id> room
 *   severityUpdate  — broadcast to issue_<id> room
 *   userNotification — personal notification to user_<id> room
 */

const { getIO } = require('./index');

// ─── Helper ───────────────────────────────────────────────────────────────────
const safeEmit = (emitFn) => {
  try {
    const io = getIO();
    emitFn(io);
  } catch (err) {
    // Socket.io not initialised yet — skip silently (e.g. during tests)
    if (process.env.NODE_ENV !== 'test') {
      console.warn('[SocketEvents] getIO failed:', err.message);
    }
  }
};

// ─── Public emitters ──────────────────────────────────────────────────────────

/**
 * Broadcast a newly created issue to ALL connected clients.
 * @param {object} issueData — lean issue document (LIST_PROJECTION fields)
 */
const emitIssueCreated = (issueData) => {
  safeEmit((io) => {
    io.emit('issueCreated', {
      event: 'issueCreated',
      data: issueData,
      ts: Date.now(),
    });
  });
};

/**
 * Notify subscribers of a specific issue that its like count changed.
 * @param {string} issueId
 * @param {{ likeCount: number, liked: boolean, userId: string }} data
 */
const emitIssueLiked = (issueId, data) => {
  safeEmit((io) => {
    io.to(`issue_${issueId}`).emit('issueLiked', {
      event: 'issueLiked',
      issueId,
      data,
      ts: Date.now(),
    });
  });
};

/**
 * Notify subscribers that a new verification was added.
 * @param {string} issueId
 * @param {{ verificationCount: number, averageSeverity: number, status: string, comment: string, verifiedBy: object }} data
 */
const emitIssueVerified = (issueId, data) => {
  safeEmit((io) => {
    io.to(`issue_${issueId}`).emit('issueVerified', {
      event: 'issueVerified',
      issueId,
      data,
      ts: Date.now(),
    });
  });
};

/**
 * Notify subscribers that an issue's status was changed by an official/admin.
 * @param {string} issueId
 * @param {{ status: string, updatedBy: string, cityId?: string }} data
 */
const emitStatusUpdate = (issueId, data) => {
  safeEmit((io) => {
    const payload = {
      event: 'issueStatusUpdate',
      issueId,
      data,
      ts: Date.now(),
    };
    io.to(`issue_${issueId}`).emit('issueStatusUpdate', payload);
    // Also push to the geographic area room if provided
    if (data.cityId) {
      io.to(`area_${data.cityId}`).emit('issueStatusUpdate', payload);
    }
  });
};

/**
 * Push a new comment to all users viewing the issue.
 * @param {string} issueId
 * @param {{ _id: string, text: string, user: object, image?: object, createdAt: string }} commentData
 */
const emitNewComment = (issueId, commentData) => {
  safeEmit((io) => {
    io.to(`issue_${issueId}`).emit('newComment', {
      event: 'newComment',
      issueId,
      data: commentData,
      ts: Date.now(),
    });
  });
};

/**
 * Notify subscribers that the average severity score recalculated.
 * @param {string} issueId
 * @param {{ averageSeverity: number, seriousnessRatingsCount: number }} data
 */
const emitSeverityUpdate = (issueId, data) => {
  safeEmit((io) => {
    io.to(`issue_${issueId}`).emit('severityUpdate', {
      event: 'severityUpdate',
      issueId,
      data,
      ts: Date.now(),
    });
  });
};

/**
 * Send a personal notification to a specific user.
 * @param {string} userId
 * @param {{ type: string, message: string, [key: string]: any }} notification
 */
const emitUserNotification = (userId, notification) => {
  safeEmit((io) => {
    io.to(`user_${userId}`).emit('userNotification', {
      event: 'userNotification',
      data: notification,
      ts: Date.now(),
    });
  });
};

module.exports = {
  emitIssueCreated,
  emitIssueLiked,
  emitIssueVerified,
  emitStatusUpdate,
  emitNewComment,
  emitSeverityUpdate,
  emitUserNotification,
};
