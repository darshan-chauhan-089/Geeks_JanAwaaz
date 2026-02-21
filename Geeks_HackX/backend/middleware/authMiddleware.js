/**
 * authMiddleware.js
 * Central authentication & authorization middleware for CivicPulse.
 *
 * Reads JWT from:
 *   1. Authorization: Bearer <token>  header  (mobile / API clients)
 *   2. civicpulse_token httpOnly cookie        (browser clients)
 */

const jwt = require('jsonwebtoken');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const User = require('../models/User');

// ─── Constants ────────────────────────────────────────────────────────────────
const COOKIE_NAME = 'civicpulse_token';

const COOKIE_OPTIONS = (maxAgeMs = 7 * 24 * 60 * 60 * 1000) => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  maxAge: maxAgeMs,
});

const CLEAR_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
};

// ─── Token Helpers ────────────────────────────────────────────────────────────
const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

const setTokenCookie = (res, token) => {
  res.cookie(COOKIE_NAME, token, COOKIE_OPTIONS());
};

const clearTokenCookie = (res) => {
  res.clearCookie(COOKIE_NAME, CLEAR_COOKIE_OPTIONS);
};

// ─── protect ─────────────────────────────────────────────────────────────────
const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies?.[COOKIE_NAME]) {
    token = req.cookies[COOKIE_NAME];
  }

  if (!token) throw new ApiError(401, 'Authentication required. Please log in.');

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    clearTokenCookie(res);
    if (err.name === 'TokenExpiredError') {
      throw new ApiError(401, 'Session expired. Please log in again.');
    }
    throw new ApiError(401, 'Invalid token. Please log in again.');
  }

  const user = await User.findById(decoded.id).select('-password -pushTokens');
  if (!user || !user.isActive) {
    clearTokenCookie(res);
    throw new ApiError(401, 'Account not found or deactivated.');
  }

  req.user = user;
  next();
});

// ─── optionalAuth ─────────────────────────────────────────────────────────────
/**
 * Same as protect but does NOT throw if no token is present.
 * Useful for routes that serve both guests and authenticated users.
 */
const optionalAuth = asyncHandler(async (req, _res, next) => {
  let token;

  if (req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies?.[COOKIE_NAME]) {
    token = req.cookies[COOKIE_NAME];
  }

  if (!token) return next();

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password -pushTokens');
    if (user && user.isActive) req.user = user;
  } catch {
    // swallow — guest access allowed
  }

  next();
});

// ─── authorize ────────────────────────────────────────────────────────────────
/**
 * Role-based access guard. Must be placed AFTER protect.
 * Usage: router.delete('/', protect, authorize('admin', 'official'), handler)
 */
const authorize = (...roles) =>
  (req, _res, next) => {
    if (!req.user) return next(new ApiError(401, 'Authentication required.'));
    if (!roles.includes(req.user.role)) {
      return next(
        new ApiError(403, `Role '${req.user.role}' is not permitted for this action.`)
      );
    }
    next();
  };

// ─── selfOrAdmin ──────────────────────────────────────────────────────────────
/**
 * Allow if the requesting user IS the target user (req.params.id) OR is an admin.
 * Must be placed AFTER protect.
 */
const selfOrAdmin = (req, _res, next) => {
  if (!req.user) return next(new ApiError(401, 'Authentication required.'));
  const isSelf = req.user._id.toString() === req.params.id;
  const isAdmin = req.user.role === 'admin';
  if (!isSelf && !isAdmin) {
    return next(new ApiError(403, 'Access denied.'));
  }
  next();
};

module.exports = {
  protect,
  optionalAuth,
  authorize,
  selfOrAdmin,
  generateToken,
  setTokenCookie,
  clearTokenCookie,
  COOKIE_NAME,
};
