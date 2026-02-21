require('dotenv').config();
const http = require('http');
const app = require('./app');
const connectDB = require('./config/db');
const initSocket = require('./socket');

const PORT = process.env.PORT || 5000;
const isProd = process.env.NODE_ENV === 'production';

const server = http.createServer(app);

// Attach Socket.io
initSocket(server);

let isShuttingDown = false;

const gracefulShutdown = (signalOrReason, exitCode = 0) => {
  if (isShuttingDown) return;
  isShuttingDown = true;

  console.log(`[SERVER] Shutdown initiated (${signalOrReason})`);
  server.close(() => process.exit(exitCode));

  // Force close if something hangs
  setTimeout(() => process.exit(exitCode), 5000).unref();
};

const bootstrap = async () => {
  try {
    await connectDB();

    server.listen(PORT, () => {
      console.log(`[SERVER] CivicPulse running on port ${PORT} [${process.env.NODE_ENV}]`);
    });

    server.on('error', (err) => {
      console.error('[SERVER ERROR]', err?.stack || err?.message || err);
      if (isProd) {
        gracefulShutdown('server-error', 1);
      }
    });
  } catch (err) {
    console.error('[BOOTSTRAP ERROR]', err?.stack || err?.message || err);
    process.exit(1);
  }
};

bootstrap();

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('[SERVER] SIGTERM received. Shutting down gracefully...');
  gracefulShutdown('SIGTERM', 0);
});

process.on('SIGINT', () => {
  console.log('[SERVER] SIGINT received. Shutting down gracefully...');
  gracefulShutdown('SIGINT', 0);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[UNHANDLED REJECTION]', reason?.stack || reason?.message || reason);
  if (!isProd) {
    // In development, keep process alive so transient async issues don't
    // crash nodemon repeatedly; logs will expose the offending promise.
    console.error('[UNHANDLED REJECTION] Promise:', promise);
    return;
  }
  gracefulShutdown('unhandledRejection', 1);
});

process.on('uncaughtException', (err) => {
  console.error('[UNCAUGHT EXCEPTION]', err?.stack || err?.message || err);
  if (!isProd) {
    // During development we keep server alive to prevent crash loops.
    // The stack trace above provides the root cause for targeted fixes.
    return;
  }
  gracefulShutdown('uncaughtException', 1);
});
