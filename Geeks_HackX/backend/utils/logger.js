/**
 * Lightweight structured logger.
 *
 * In development: coloured console output with timestamps.
 * In production:  JSON lines — pipe to any log aggregator (Datadog, Logtail, etc.)
 *
 * Usage:
 *   const logger = require('./utils/logger');
 *   logger.info ('Server started', { port: 5000 });
 *   logger.warn ('Rate limit hit', { ip: '1.2.3.4' });
 *   logger.error('Uncaught rejection', err);
 */

const isProd = process.env.NODE_ENV === 'production';

const LEVELS = { error: 0, warn: 1, info: 2, debug: 3 };
const COLORS = {
  error: '\x1b[31m', // red
  warn:  '\x1b[33m', // yellow
  info:  '\x1b[36m', // cyan
  debug: '\x1b[90m', // grey
  reset: '\x1b[0m',
};

function formatDev(level, message, meta) {
  const ts    = new Date().toISOString();
  const color = COLORS[level] ?? '';
  const metaStr = meta ? ' ' + JSON.stringify(meta) : '';
  return `${COLORS.reset}[${ts}] ${color}${level.toUpperCase().padEnd(5)}${COLORS.reset} ${message}${metaStr}`;
}

function formatProd(level, message, meta, err) {
  return JSON.stringify({
    ts:      new Date().toISOString(),
    level,
    message,
    ...(meta  ? { meta }            : {}),
    ...(err   ? { error: { message: err.message, stack: err.stack } } : {}),
  });
}

function log(level, message, metaOrErr) {
  const minLevel = LEVELS[process.env.LOG_LEVEL ?? 'debug'] ?? 3;
  if (LEVELS[level] > minLevel) return;

  const isError = metaOrErr instanceof Error;
  const meta    = !isError ? metaOrErr : undefined;
  const err     = isError  ? metaOrErr : undefined;

  const line = isProd
    ? formatProd(level, message, meta, err)
    : formatDev(level, message, meta ?? (err ? { stack: err.stack } : undefined));

  if (level === 'error') {
    console.error(line);
  } else if (level === 'warn') {
    console.warn(line);
  } else {
    console.log(line);
  }
}

const logger = {
  error: (msg, metaOrErr) => log('error', msg, metaOrErr),
  warn:  (msg, meta)      => log('warn',  msg, meta),
  info:  (msg, meta)      => log('info',  msg, meta),
  debug: (msg, meta)      => log('debug', msg, meta),

  /** Express/Socket.io request logger middleware */
  httpMiddleware: (req, _res, next) => {
    if (process.env.NODE_ENV !== 'test') {
      log('debug', `${req.method} ${req.originalUrl}`, { ip: req.ip });
    }
    next();
  },
};

module.exports = logger;
