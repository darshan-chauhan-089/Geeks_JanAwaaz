// Re-export from central auth middleware to avoid duplication.
const { authorize } = require('./authMiddleware');

/**
 * roleCheck(roles) — accepts an array OR spread args.
 * roleCheck(['admin', 'official'])  ✓
 * roleCheck('admin', 'official')    ✓
 */
const roleCheck = (...args) => {
  const roles = Array.isArray(args[0]) ? args[0] : args;
  return authorize(...roles);
};

module.exports = { authorize, roleCheck };
