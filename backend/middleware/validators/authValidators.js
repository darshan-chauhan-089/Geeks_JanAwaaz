const { body } = require('express-validator');

// ─── Register ───────────────────────────────────────────────────────────────
const registerRules = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required.')
    .isLength({ min: 2, max: 80 }).withMessage('Name must be between 2 and 80 characters.'),

  body('email')
    .trim()
    .notEmpty().withMessage('Email is required.')
    .isEmail().withMessage('Please provide a valid email address.')
    .toLowerCase(),

  body('password')
    .notEmpty().withMessage('Password is required.')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters.')
    .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter.')
    .matches(/[0-9]/).withMessage('Password must contain at least one number.'),

  body('confirmPassword')
    .notEmpty().withMessage('Please confirm your password.')
    .custom((value, { req }) => {
      if (value !== req.body.password) throw new Error('Passwords do not match.');
      return true;
    }),

  body('role')
    .optional()
    .isIn(['user', 'citizen', 'official'])
    .withMessage("Role must be 'user', 'citizen', or 'official'."),
];

// ─── Login ───────────────────────────────────────────────────────────────────
const loginRules = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required.')
    .isEmail().withMessage('Please provide a valid email address.')
    .toLowerCase(),

  body('password')
    .notEmpty().withMessage('Password is required.'),
];

// ─── Change Password ──────────────────────────────────────────────────────────
const changePasswordRules = [
  body('currentPassword')
    .notEmpty().withMessage('Current password is required.'),

  body('newPassword')
    .notEmpty().withMessage('New password is required.')
    .isLength({ min: 8 }).withMessage('New password must be at least 8 characters.')
    .matches(/[A-Z]/).withMessage('New password must contain at least one uppercase letter.')
    .matches(/[0-9]/).withMessage('New password must contain at least one number.')
    .custom((value, { req }) => {
      if (value === req.body.currentPassword) throw new Error('New password must differ from current password.');
      return true;
    }),

  body('confirmNewPassword')
    .notEmpty().withMessage('Please confirm your new password.')
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) throw new Error('Passwords do not match.');
      return true;
    }),
];

// ─── Update Profile ───────────────────────────────────────────────────────────
const updateProfileRules = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 80 }).withMessage('Name must be between 2 and 80 characters.'),  body('locationName')
    .optional()
    .trim()
    .isLength({ max: 120 }).withMessage('Location name cannot exceed 120 characters.'),];

module.exports = { registerRules, loginRules, changePasswordRules, updateProfileRules };
