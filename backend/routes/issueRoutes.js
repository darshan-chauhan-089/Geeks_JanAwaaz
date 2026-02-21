const express = require('express');
const router = express.Router();
const multer = require('multer');

const {
  createIssue,
  getIssues,
  getNearbyIssues,
  getIssue,
  likeIssue,
  verifyIssue,
  rateIssue,
  getTrending,
  updateStatus,
  deleteIssue,
  addComment,
} = require('../controllers/issueController');

const {
  getComments,
  deleteComment,
} = require('../controllers/commentController');

const { protect, optionalAuth } = require('../middleware/authMiddleware');
const { authorize }              = require('../middleware/roleCheck');
const { uploadRateLimiter }      = require('../middleware/rateLimiter');
const validate                   = require('../middleware/validate');
const {
  createIssueRules,
  verifyIssueRules,
  addCommentRules,
  nearbyRules,
} = require('../middleware/validators/issueValidators');

// ─── Multer — memory storage, forwarded to Cloudinary ────────────────────────
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB per file
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed.'), false);
    }
    cb(null, true);
  },
});

// ─── Public Routes ────────────────────────────────────────────────────────────
// GET /api/v1/issues/trending?status=Verified&limit=20
router.get('/trending', getTrending);

// GET /api/v1/issues/nearby?lat=23.02&lng=72.57&radius=5&limit=20
router.get('/nearby', nearbyRules, validate, getNearbyIssues);

// GET /api/v1/issues?category=road&status=Verified&sort=liked&page=1&limit=20
router.get('/', optionalAuth, getIssues);

// GET /api/v1/issues/:id
router.get('/:id', optionalAuth, getIssue);

// ─── Authenticated ────────────────────────────────────────────────────────────
// POST /api/v1/issues  — up to 5 images (first = cover)
router.post(
  '/',
  protect,
  uploadRateLimiter,
  upload.array('images', 5),
  createIssueRules,
  validate,
  createIssue
);

// PATCH /api/v1/issues/:id/like  — toggle like
router.patch('/:id/like', protect, likeIssue);

// PATCH /api/v1/issues/:id/verify  — comment (required) + single image (optional) + rating
router.patch(
  '/:id/verify',
  protect,
  upload.single('image'),
  verifyIssueRules,
  validate,
  verifyIssue
);

// POST /api/v1/issues/:id/comments  — add comment with optional image
router.post(
  '/:id/comments',
  protect,
  upload.single('image'),
  addCommentRules,
  validate,
  addComment
);

// GET /api/v1/issues/:id/comments
router.get('/:id/comments', optionalAuth, getComments);

// DELETE /api/v1/issues/:id/comments/:commentId
router.delete('/:id/comments/:commentId', protect, deleteComment);

// DELETE /api/v1/issues/:id
router.delete('/:id', protect, deleteIssue);

// ─── Official / Admin only ────────────────────────────────────────────────────
// PATCH /api/v1/issues/:id/status
router.patch('/:id/status', protect, authorize('official', 'admin'), updateStatus);

module.exports = router;

