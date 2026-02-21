const ApiError = require('../utils/ApiError');

// ── Mongoose CastError (invalid ObjectId) ──────────────────────────────────
const handleCastError = (err) =>
  new ApiError(400, `Invalid value for field '${err.path}': ${err.value}`);

// ── Mongoose Duplicate Key ─────────────────────────────────────────────────
const handleDuplicateKey = (err) => {
  const field = Object.keys(err.keyValue)[0];
  return new ApiError(409, `'${err.keyValue[field]}' is already in use for field '${field}'.`);
};

// ── Mongoose Validation Error ─────────────────────────────────────────────
const handleValidationError = (err) => {
  const messages = Object.values(err.errors).map((e) => e.message);
  return new ApiError(422, messages.join('. '));
};

// ── JWT Errors ────────────────────────────────────────────────────────────
const handleJWTError = () => new ApiError(401, 'Invalid token. Please log in again.');
const handleJWTExpired = () => new ApiError(401, 'Your session has expired. Please log in again.');

// ─── Central Error Handler ────────────────────────────────────────────────
const errorHandler = (err, req, res, _next) => {
  let error = err instanceof ApiError ? err : new ApiError(500, err.message || 'Internal Server Error');

  if (err.name === 'CastError') error = handleCastError(err);
  if (err.code === 11000) error = handleDuplicateKey(err);
  if (err.name === 'ValidationError') error = handleValidationError(err);
  if (err.name === 'JsonWebTokenError') error = handleJWTError();
  if (err.name === 'TokenExpiredError') error = handleJWTExpired();

  if (process.env.NODE_ENV !== 'production' && error.statusCode === 500) {
    console.error('[ERROR]', err);
  }

  res.status(error.statusCode).json({
    success: false,
    message: error.message,
    ...(process.env.NODE_ENV !== 'production' && error.statusCode === 500 && { stack: err.stack }),
  });
};

module.exports = errorHandler;
