const { validationResult } = require('express-validator');
const ApiError = require('../utils/ApiError');

/**
 * Run after a chain of express-validator checks.
 * Collects all errors and throws a 422 ApiError with all messages.
 */
const validate = (req, _res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const messages = errors.array().map((e) => e.msg);
    throw new ApiError(422, messages.join('. '), errors.array());
  }
  next();
};

module.exports = validate;
