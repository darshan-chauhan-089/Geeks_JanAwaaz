/**
 * Wraps async route handlers and forwards errors to express error middleware.
 * Eliminates the need for try/catch in every controller.
 */
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

module.exports = asyncHandler;
