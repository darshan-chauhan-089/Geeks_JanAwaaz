/**
 * socketHandlers.js
 * Registers all CLIENT-emitted event listeners for a single socket connection.
 * Called once per connection from socket/index.js.
 *
 * Rooms convention:
 *   user_<userId>       — personal notifications
 *   issue_<issueId>     — live updates for a specific issue
 *   area_<city|ward>    — geographic feed
 */

/**
 * @param {import('socket.io').Server} _io   — full server instance (available for broadcasts)
 * @param {import('socket.io').Socket} socket — individual connection
 */
const registerHandlers = (_io, socket) => {
  // ─── Issue Rooms ────────────────────────────────────────────────────────────
  socket.on('join_issue', (issueId) => {
    if (typeof issueId !== 'string' || !issueId.trim()) return;
    socket.join(`issue_${issueId}`);
    socket.emit('joined_issue', { room: `issue_${issueId}` });
  });

  socket.on('leave_issue', (issueId) => {
    if (typeof issueId !== 'string' || !issueId.trim()) return;
    socket.leave(`issue_${issueId}`);
  });

  // ─── Area Rooms (city / ward geographic feed) ────────────────────────────────
  socket.on('join_area', (areaId) => {
    if (typeof areaId !== 'string' || !areaId.trim()) return;
    socket.join(`area_${areaId}`);
    socket.emit('joined_area', { room: `area_${areaId}` });
  });

  socket.on('leave_area', (areaId) => {
    if (typeof areaId !== 'string' || !areaId.trim()) return;
    socket.leave(`area_${areaId}`);
  });

  // ─── Typing indicator (comments) ────────────────────────────────────────────
  socket.on('typing_comment', ({ issueId }) => {
    if (!issueId || !socket.userId) return;
    socket.to(`issue_${issueId}`).emit('user_typing', {
      issueId,
      userId: socket.userId,
    });
  });

  socket.on('stop_typing_comment', ({ issueId }) => {
    if (!issueId || !socket.userId) return;
    socket.to(`issue_${issueId}`).emit('user_stopped_typing', {
      issueId,
      userId: socket.userId,
    });
  });

  // ─── Ping / health ───────────────────────────────────────────────────────────
  socket.on('ping_server', (cb) => {
    if (typeof cb === 'function') cb({ status: 'ok', ts: Date.now() });
  });
};

module.exports = registerHandlers;
