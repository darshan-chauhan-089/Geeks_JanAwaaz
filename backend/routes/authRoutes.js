const express = require('express');
const passport = require('passport');
const router = express.Router();

const {
  register,
  login,
  googleCallback,
  getMe,
  updateProfile,
  changePassword,
  logout,
  deleteAccount,
} = require('../controllers/authController');

const multer = require('multer');
const { protect } = require('../middleware/authMiddleware');
const { authRateLimiter } = require('../middleware/rateLimiter');
const validate = require('../middleware/validate');

// ─── Multer — memory storage for avatar uploads ───────────────────────────────
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files are allowed.'), false);
  },
});
const {
  registerRules,
  loginRules,
  changePasswordRules,
  updateProfileRules,
} = require('../middleware/validators/authValidators');

// ─── Email / Password ─────────────────────────────────────────────────────────
// POST /api/v1/auth/register
router.post('/register', authRateLimiter, registerRules, validate, register);

// POST /api/v1/auth/login
router.post('/login', authRateLimiter, loginRules, validate, login);

// POST /api/v1/auth/logout
router.post('/logout', logout);

// ─── Google OAuth 2.0 ─────────────────────────────────────────────────────────
// GET /api/v1/auth/google  →  redirect to Google consent screen
router.get(
  '/google',
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    session: false,
  })
);

// GET /api/v1/auth/google/callback  →  Google redirects back here
router.get(
  '/google/callback',
  passport.authenticate('google', {
    session: false,
    failureRedirect: `${process.env.CLIENT_URL}/login?error=google_auth_failed`,
  }),
  googleCallback
);

// ─── Protected ────────────────────────────────────────────────────────────────
// GET /api/v1/auth/me
router.get('/me', protect, getMe);

// PATCH /api/v1/auth/me
router.patch('/me', protect, upload.single('avatar'), updateProfileRules, validate, updateProfile);

// PATCH /api/v1/auth/change-password
router.patch('/change-password', protect, changePasswordRules, validate, changePassword);

// DELETE /api/v1/auth/account
router.delete('/account', protect, deleteAccount);

module.exports = router;
