const Issue = require('../models/Issue');
const User  = require('../models/User');
const ApiError    = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');

// ─── Projection reused for list views ─────────────────────────────────────────────────
const LIST_PROJECTION =
  'title category status location.coordinates location.address location.city location.ward ' +
  'image likeCount verificationCount averageSeverity createdAt createdBy';

// ─── PATCH /api/v1/users/me/location ────────────────────────────────────────────
exports.updateMyLocation = asyncHandler(async (req, res) => {
  const { lat, lng } = req.body;
  const latNum = Number(lat);
  const lngNum = Number(lng);

  if (!Number.isFinite(latNum) || !Number.isFinite(lngNum)) {
    throw new ApiError(400, 'lat and lng must be finite numbers.');
  }
  if (lngNum < -180 || lngNum > 180) throw new ApiError(400, 'Longitude must be −180 to 180.');
  if (latNum < -90  || latNum > 90)  throw new ApiError(400, 'Latitude must be −90 to 90.');

  await User.findByIdAndUpdate(req.user._id, {
    'location.type': 'Point',
    'location.coordinates': [lngNum, latNum],
  });

  res.status(200).json(new ApiResponse(200, null, 'Location updated.'));
});


// ─── GET /api/v1/users/me/stats ───────────────────────────────────────────────
exports.getMyStats = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const [issueCount, resolvedCount, verifiedCount, criticalCount] = await Promise.all([
    Issue.countDocuments({ createdBy: userId }),
    Issue.countDocuments({ createdBy: userId, status: 'Resolved' }),
    Issue.countDocuments({ createdBy: userId, status: 'Verified' }),
    Issue.countDocuments({ createdBy: userId, status: 'Critical' }),
  ]);

  res.status(200).json(
    new ApiResponse(200, {
      issueCount,
      resolvedCount,
      verifiedCount,
      criticalCount,
      verificationCount: req.user.verificationCount ?? 0,
      credibilityScore:  req.user.credibilityScore  ?? 0,
    })
  );
});

// ─── GET /api/v1/users/me/issues  — paginated ─────────────────────────────────
exports.getMyIssues = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const {
    page     = 1,
    limit    = 12,
    status,
    category,
    sort     = 'recent',
  } = req.query;

  const filter = { createdBy: userId };
  if (status) {
    const statuses = status.split(',').map((s) => s.trim()).filter(Boolean);
    filter.status = statuses.length === 1 ? statuses[0] : { $in: statuses };
  }
  if (category) {
    const cats = category.split(',').map((s) => s.trim()).filter(Boolean);
    filter.category = cats.length === 1 ? cats[0] : { $in: cats };
  }

  const SORT_MAP = {
    recent:   { createdAt: -1 },
    liked:    { likeCount: -1, createdAt: -1 },
    severity: { averageSeverity: -1, createdAt: -1 },
  };
  const sortOption = SORT_MAP[sort] || SORT_MAP.recent;

  const pageNum  = Math.max(1, parseInt(page));
  const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
  const skip     = (pageNum - 1) * limitNum;

  const [docs, total] = await Promise.all([
    Issue.find(filter)
      .select(LIST_PROJECTION)
      .populate('createdBy', 'name avatar credibilityScore')
      .sort(sortOption)
      .skip(skip)
      .limit(limitNum)
      .lean(),
    Issue.countDocuments(filter),
  ]);

  res.status(200).json(
    new ApiResponse(200, {
      issues: docs,
      pagination: {
        total,
        page:    pageNum,
        limit:   limitNum,
        pages:   Math.ceil(total / limitNum),
        hasNext: pageNum * limitNum < total,
        hasPrev: pageNum > 1,
      },
    })
  );
});

// ─── GET /api/v1/users/me/activity ────────────────────────────────────────────
exports.getMyActivity = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const reported = await Issue.find({ createdBy: userId })
    .select('title status category createdAt')
    .sort({ createdAt: -1 })
    .limit(15)
    .lean();

  const activity = reported.map((i) => ({ ...i, type: 'reported', date: i.createdAt }));

  res.status(200).json(new ApiResponse(200, activity));
});

// ─── GET /api/v1/users/me/verification-requests ───────────────────────────────
// Issues with status Pending/Verified (not yet resolved/rejected), not created by
// the requesting user (so they can verify other people's issues).
exports.getVerificationRequests = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const {
    page     = 1,
    limit    = 12,
    category,
    sort     = 'recent',
  } = req.query;

  const filter = {
    status:    { $in: ['Pending', 'Verified'] },
    createdBy: { $ne: userId },                  // can't verify own issues
  };
  if (category) {
    const cats = category.split(',').map((s) => s.trim()).filter(Boolean);
    filter.category = cats.length === 1 ? cats[0] : { $in: cats };
  }

  const SORT_MAP = {
    recent:   { createdAt: -1 },
    severity: { averageSeverity: -1, createdAt: -1 },
    least:    { verificationCount: 1, createdAt: -1 },  // fewest verifications first
  };
  const sortOption = SORT_MAP[sort] || SORT_MAP.recent;

  const pageNum  = Math.max(1, parseInt(page));
  const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
  const skip     = (pageNum - 1) * limitNum;

  const [docs, total] = await Promise.all([
    Issue.find(filter)
      .select(LIST_PROJECTION)
      .populate('createdBy', 'name avatar credibilityScore')
      .sort(sortOption)
      .skip(skip)
      .limit(limitNum)
      .lean(),
    Issue.countDocuments(filter),
  ]);

  res.status(200).json(
    new ApiResponse(200, {
      issues: docs,
      pagination: {
        total,
        page:    pageNum,
        limit:   limitNum,
        pages:   Math.ceil(total / limitNum),
        hasNext: pageNum * limitNum < total,
        hasPrev: pageNum > 1,
      },
    })
  );
});
