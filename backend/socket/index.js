const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const registerHandlers = require('./socketHandlers');

const COOKIE_NAME = 'civicpulse_token';

const getCookieValue = (cookieHeader = '', name) => {
  if (!cookieHeader || !name) return null;
  const parts = cookieHeader.split(';').map((part) => part.trim());
  const match = parts.find((part) => part.startsWith(`${name}=`));
  if (!match) return null;
  const [, rawValue = ''] = match.split('=');
  return decodeURIComponent(rawValue);
};

// ─── Singleton ────────────────────────────────────────────────────────────────
let io = null;

// ─── JWT Auth Middleware ───────────────────────────────────────────────────────
const jwtSocketMiddleware = (socket, next) => {
  if (!process.env.JWT_SECRET) {
    return next(new Error('JWT_SECRET is not configured on the server.'));
  }

  const token =
    socket.handshake.auth?.token ||
    socket.handshake.headers?.authorization?.replace('Bearer ', '') ||
    getCookieValue(socket.handshake.headers?.cookie, COOKIE_NAME);

  if (!token) {
    // Allow anonymous — public feed is read-only
    socket.userId = null;
    socket.userRole = null;
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId   = decoded.id;
    socket.userRole = decoded.role || null;
    next();
  } catch (err) {
    // Invalid / expired token — demote to anonymous rather than block
    socket.userId   = null;
    socket.userRole = null;
    next();
  }
};

// ─── Error handler for uncaught socket errors ────────────────────────────────
const socketErrorHandler = (socket) => {
  socket.on('error', (err) => {
    console.error(`[SOCKET ERROR] ${socket.id}:`, err.message);
  });
};

// ─── initSocket ───────────────────────────────────────────────────────────────
/**
 * Attach Socket.io to the HTTP server.
 * Called once from server.js before server.listen().
 * @param {import('http').Server} httpServer
 * @returns {import('socket.io').Server}
 */
const initSocket = (httpServer) => {
  if (io) return io; // guard against double-init

  const origin = process.env.CLIENT_URL
    ? process.env.CLIENT_URL.split(',').map((o) => o.trim())
    : ['http://localhost:3000'];

  io = new Server(httpServer, {
    cors: {
      origin,
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingTimeout: 60_000,
    pingInterval: 25_000,
    transports: ['websocket', 'polling'],
  });

  // Middleware
  io.use(jwtSocketMiddleware);

  // Connection handler
  io.on('connection', (socket) => {
    console.log(
      `[SOCKET] + connected  id=${socket.id}  user=${socket.userId ?? 'anon'}`
    );

    socketErrorHandler(socket);

    // Auto-join personal room for authenticated users
    if (socket.userId) {
      socket.join(`user_${socket.userId}`);
    }

    // Register all client-side event listeners
    registerHandlers(io, socket);

    socket.on('disconnect', (reason) => {
      console.log(
        `[SOCKET] - disconnected id=${socket.id}  reason=${reason}`
      );
    });
  });

  console.log('[SOCKET] Socket.io initialised');
  return io;
};

// ─── getIO ────────────────────────────────────────────────────────────────────
/**
 * Returns the Socket.io singleton.
 * Throws if called before initSocket().
 */
const getIO = () => {
  if (!io) throw new Error('[SOCKET] Socket.io not initialised — call initSocket(server) first.');
  return io;
};

module.exports = initSocket;
module.exports.getIO = getIO;

