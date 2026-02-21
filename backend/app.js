const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const mongoSanitize = require('express-mongo-sanitize');
const cookieParser = require('cookie-parser');
const passport = require('./config/passport');

const { globalRateLimiter } = require('./middleware/rateLimiter');
const errorHandler = require('./middleware/errorHandler');
const loadRoutes = require('./routes');

const app = express();

// ─── Security Headers ──────────────────────────────────────────────────────
app.use(helmet());

// ─── CORS ──────────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
);

// ─── Body Parsers ──────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─── Cookie Parser ────────────────────────────────────────────────────────
app.use(cookieParser());

// ─── Passport (Google OAuth / JWT) ───────────────────────────────────────
app.use(passport.initialize());

// ─── Data Sanitization ────────────────────────────────────────────────────
app.use(mongoSanitize());

// ─── HTTP Logging ─────────────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// ─── Global Rate Limiter ──────────────────────────────────────────────────
app.use('/api', globalRateLimiter);

// ─── Health Check ─────────────────────────────────────────────────────────
app.get('/health', (_req, res) =>
  res.status(200).json({ status: 'ok', service: 'CivicPulse API', timestamp: new Date().toISOString() })
);

// ─── API Routes ───────────────────────────────────────────────────────────
loadRoutes(app);

// ─── 404 Handler ──────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// ─── Global Error Handler ─────────────────────────────────────────────────
app.use(errorHandler);

module.exports = app;
