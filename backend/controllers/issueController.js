const Issue = require('../models/Issue');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const cloudinaryService = require('../services/cloudinaryService');
const notificationService = require('../services/notificationService');
const {
  emitIssueCreated,
  emitIssueLiked,
  emitIssueVerified,
  emitStatusUpdate,
  emitNewComment,
  emitSeverityUpdate,
} = require('../socket/socketEvents');

// ─── Projection: fields needed for list views (saves bandwidth) ───────────────
const LIST_PROJECTION =
  'title category status location.coordinates location.address location.city location.ward ' +
  'image images likeCount verificationCount averageSeverity createdAt createdBy';

// ─── 1. Create Issue ──────────────────────────────────────────────────────────
exports.createIssue = asyncHandler(async (req, res) => {
  const { title, description, category, seriousnessRating } = req.body;

  // ── Parse location — accepts both GeoJSON and flat { latitude, longitude } ─
  let location;
  try {
    location = typeof req.body.location === 'string'
      ? JSON.parse(req.body.location)
      : req.body.location;
  } catch {
    throw new ApiError(400, 'Invalid location format. Send a JSON string.');
  }

  if (!location || typeof location !== 'object') {
    throw new ApiError(400, 'Location must be a JSON object.');
  }

  let lngNum, latNum;

  // GeoJSON format: { type: "Point", coordinates: [lng, lat] }
  if (Array.isArray(location.coordinates) && location.coordinates.length === 2) {
    lngNum = Number(location.coordinates[0]);
    latNum = Number(location.coordinates[1]);
  }
  // Flat format: { latitude, longitude }
  else if (location.latitude !== undefined && location.longitude !== undefined) {
    latNum = Number(location.latitude);
    lngNum = Number(location.longitude);
  }
  else {
    throw new ApiError(400, 'Location must include coordinates [lng, lat] or latitude + longitude fields.');
  }

  if (!Number.isFinite(lngNum) || !Number.isFinite(latNum)) {
    throw new ApiError(400, 'Location coordinates must be finite numbers. Please allow location access and try again.');
  }
  if (lngNum < -180 || lngNum > 180) throw new ApiError(400, 'Longitude must be between -180 and 180.');
  if (latNum < -90  || latNum > 90)  throw new ApiError(400, 'Latitude must be between -90 and 90.');

  // ── Upload cover image (first file) + extras (remaining files)
  let image = { url: '', publicId: '' };
  let images = [];

  if (req.files?.length) {
    const [cover, ...rest] = req.files;
    image = await cloudinaryService.uploadBuffer(cover.buffer, 'civicpulse/issues');
    if (rest.length) {
      images = await cloudinaryService.uploadMultiple(rest, 'civicpulse/issues');
    }
  }

  // ── Build initial seriousnessRatings array
  const rating = parseInt(seriousnessRating, 10);
  const seriousnessRatings = rating >= 1 && rating <= 5 ? [rating] : [];

  // Build location explicitly — never spread the raw parsed object to
  // avoid Mongoose misinterpreting extra keys or a missing `type` field.
  const locationDoc = {
    type:        'Point',
    coordinates: [lngNum, latNum],
    ...(location.address && { address: location.address }),
    ...(location.city    && { city:    location.city    }),
    ...(location.ward    && { ward:    location.ward    }),
  };

  const issue = await Issue.create({
    title,
    description,
    category,
    location: locationDoc,
    image,
    images,
    seriousnessRatings,
    averageSeverity: seriousnessRatings.length ? seriousnessRatings[0] : 0,
    createdBy: req.user._id,
  });

  // ── Real-time broadcast to all clients
  emitIssueCreated({
    issueId: issue._id,
    category,
    location: issue.location,
    title: issue.title,
  });

  // ── Notify users within 10 km and capture count
  const notifiedCount = await notificationService.notifyNearbyUsers(issue, 10).catch(() => 0);
  
  // ── Update issue with notification count
  await Issue.findByIdAndUpdate(issue._id, { notifiedCount }, { new: true });
  issue.notifiedCount = notifiedCount;

  res.status(201).json(new ApiResponse(201, issue, 'Issue reported successfully.'));
});

// ─── 2. Get All Issues — paginated + sortable ─────────────────────────────────
exports.getIssues = asyncHandler(async (req, res) => {
  const {
    category,
    status,
    page = 1,
    limit = 20,
    sort = 'recent',
    city,
    ward,
  } = req.query;

  const filter = {};
  if (category) {
    const cats = category.split(',').map(s => s.trim()).filter(Boolean);
    filter.category = cats.length === 1 ? cats[0] : { $in: cats };
  }
  if (status) {
    const statuses = status.split(',').map(s => s.trim()).filter(Boolean);
    filter.status = statuses.length === 1 ? statuses[0] : { $in: statuses };
  }
  if (city) filter['location.city'] = new RegExp(city, 'i');
  if (ward) filter['location.ward'] = new RegExp(ward, 'i');

  // ── Sort presets
  const SORT_MAP = {
    verified:  { verificationCount: -1, createdAt: -1 }, // Most Verified
    severity:  { averageSeverity: -1, createdAt: -1 },   // Highest Severity
    liked:     { likeCount: -1, createdAt: -1 },          // Most Liked
    recent:    { createdAt: -1 },                          // Recent (default)
  };
  const sortOption = SORT_MAP[sort] || SORT_MAP.recent;

  const pageNum  = Math.max(1, parseInt(page));
  const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
  const skip = (pageNum - 1) * limitNum;

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
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum),
        hasNext: pageNum * limitNum < total,
        hasPrev: pageNum > 1,
      },
    })
  );
});

// ─── 3. Get Nearby Issues — geospatial ───────────────────────────────────────
exports.getNearbyIssues = asyncHandler(async (req, res) => {
  const { lat, lng, radius = 5, limit = 20, status, category } = req.query;

  if (!lat || !lng) throw new ApiError(400, 'lat and lng query parameters are required.');

  const latitude  = parseFloat(lat);
  const longitude = parseFloat(lng);
  const radiusKm  = parseFloat(radius);

  if (isNaN(latitude) || isNaN(longitude)) {
    throw new ApiError(400, 'lat and lng must be valid numbers.');
  }
  if (radiusKm <= 0 || radiusKm > 100) {
    throw new ApiError(400, 'radius must be between 0 and 100 km.');
  }

  const match = {};
  if (status) match.status = status;
  if (category) match.category = category;

  // $geoNear must be first stage in aggregation
  const pipeline = [
    {
      $geoNear: {
        near: { type: 'Point', coordinates: [longitude, latitude] },
        distanceField: 'distanceMeters',
        maxDistance: radiusKm * 1000, // km → metres
        spherical: true,
        query: match,
      },
    },
    {
      $addFields: {
        distanceKm: { $round: [{ $divide: ['$distanceMeters', 1000] }, 2] },
      },
    },
    {
      $lookup: {
        from: 'users',
        localField: 'createdBy',
        foreignField: '_id',
        as: 'createdBy',
        pipeline: [{ $project: { name: 1, avatar: 1, credibilityScore: 1 } }],
      },
    },
    { $unwind: { path: '$createdBy', preserveNullAndEmpty: true } },
    {
      $project: {
        title: 1, category: 1, status: 1,
        'location.coordinates': 1, 'location.address': 1, 'location.city': 1,
        image: 1, likeCount: 1, verificationCount: 1, averageSeverity: 1,
        createdAt: 1, createdBy: 1, distanceKm: 1,
      },
    },
    { $sort: { distanceMeters: 1 } },
    { $limit: Math.min(50, Math.max(1, parseInt(limit))) },
  ];

  const issues = await Issue.aggregate(pipeline);

  res.status(200).json(
    new ApiResponse(200, {
      issues,
      meta: { latitude, longitude, radiusKm, count: issues.length },
    })
  );
});

// ─── 4. Get Single Issue (full detail) ───────────────────────────────────────
exports.getIssue = asyncHandler(async (req, res) => {
  const issue = await Issue.findById(req.params.id)
    .populate('createdBy', 'name avatar credibilityScore verificationCount')
    .populate('assignedTo', 'name email')
    .populate('comments.user', 'name avatar');

  if (!issue) throw new ApiError(404, 'Issue not found.');

  res.status(200).json(new ApiResponse(200, issue));
});

// ─── 5. Like Issue — toggle, duplicate-safe ──────────────────────────────────
exports.likeIssue = asyncHandler(async (req, res) => {
  const issue = await Issue.findById(req.params.id).select('likes likeCount title');
  if (!issue) throw new ApiError(404, 'Issue not found.');

  const userId = req.user._id.toString();
  const alreadyLiked = issue.likes.some((id) => id.toString() === userId);

  // Atomic update — no race conditions
  const update = alreadyLiked
    ? { $pull: { likes: req.user._id }, $inc: { likeCount: -1 } }
    : { $addToSet: { likes: req.user._id }, $inc: { likeCount: 1 } };

  const updated = await Issue.findByIdAndUpdate(req.params.id, update, {
    new: true,
    select: 'likeCount',
  });

  res.status(200).json(
    new ApiResponse(
      200,
      { likeCount: updated.likeCount, liked: !alreadyLiked },
      alreadyLiked ? 'Like removed.' : 'Issue liked.'
    )
  );
});

// ─── 6. Verify Issue — comment + optional image + rating ─────────────────────
exports.verifyIssue = asyncHandler(async (req, res) => {
  const { comment, seriousnessRating } = req.body;

  // ── Mandatory comment
  if (!comment?.trim()) throw new ApiError(400, 'A verification comment is required.');

  const rating = parseInt(seriousnessRating, 10);
  if (!rating || rating < 1 || rating > 5) {
    throw new ApiError(400, 'seriousnessRating must be an integer between 1 and 5.');
  }

  const issue = await Issue.findById(req.params.id);
  if (!issue) throw new ApiError(404, 'Issue not found.');

  if (['Resolved', 'Rejected'].includes(issue.status)) {
    throw new ApiError(400, `Cannot verify a ${issue.status.toLowerCase()} issue.`);
  }

  // ── Prevent duplicate verifications from the same user
  const alreadyVerified = issue.comments.some(
    (c) => c.user?.toString() === req.user._id.toString()
  );
  if (alreadyVerified) {
    throw new ApiError(409, 'You have already verified this issue.');
  }

  // ── Check if current user is within 10km of issue location
  const user = await User.findById(req.user._id);
  if (!user) throw new ApiError(404, 'User not found.');

  const [issueLng, issueLat] = issue.location?.coordinates ?? [];
  const [userLng, userLat] = user.location?.coordinates ?? [0, 0];

  // Validate coordinates are finite
  if (!Number.isFinite(issueLng) || !Number.isFinite(issueLat) ||
      !Number.isFinite(userLng) || !Number.isFinite(userLat)) {
    throw new ApiError(400, 'Invalid location coordinates.');
  }

  // Convert 10km to radians for $geoWithin query
  const RADIUS_KM = 10;
  const radiusInRadians = RADIUS_KM / 6378.1;

  // Use $geoWithin to check if user is within 10km radius
  const usersWithinRadius = await User.countDocuments({
    _id: req.user._id,
    location: {
      $geoWithin: {
        $centerSphere: [[issueLng, issueLat], radiusInRadians],
      },
    },
  });

  if (usersWithinRadius === 0) {
    throw new ApiError(403, 'You are outside verification radius');
  }

  // ── Optional comment image
  let commentImage = { url: '', publicId: '' };
  if (req.file) {
    commentImage = await cloudinaryService.uploadBuffer(
      req.file.buffer,
      'civicpulse/verifications'
    );
  }

  // ── Store verification status before changes
  const wasVerified = issue.status === 'Verified';

  // ── Apply all changes in one save
  issue.comments.push({
    user: req.user._id,
    text: comment.trim(),
    image: commentImage,
  });
  issue.commentCount = issue.comments.length;
  issue.verificationCount += 1;
  issue.seriousnessRatings.push(rating);
  issue.recalculateAverageSeverity();

  // ── Override: Set status to "Verified" if verificationCount >= 3
  if (issue.verificationCount >= 3) {
    issue.status = 'Verified';
  } else {
    issue.updateStatus();
  }

  await issue.save();

  // ── Credibility milestones for the reporter
  const MILESTONES = [5, 10, 25];
  if (MILESTONES.includes(issue.verificationCount)) {
    const delta = issue.verificationCount === 25 ? 20 : 10;
    const creator = await User.findById(issue.createdBy);
    if (creator) await creator.adjustCredibility(delta);
  }

  // ── Real-time update: Emit issue:verified socket event
  const io = require('../socket/index').getIO();
  if (io) {
    io.emit('issue:verified', {
      issueId: issue._id.toString(),
      verificationCount: issue.verificationCount,
      averageSeverity: issue.averageSeverity,
      status: issue.status,
      timestamp: new Date(),
    });
  }

  // ── Also emit via existing emitIssueVerified for subscribed clients
  emitIssueVerified(issue._id, {
    verificationCount: issue.verificationCount,
    averageSeverity: issue.averageSeverity,
    status: issue.status,
  });

  // ── Notify admin users if issue just became Verified
  if (!wasVerified && issue.status === 'Verified') {
    await notificationService.notifyAdminsOnVerification(issue);
  }

  // ── Notify creator
  if (issue.createdBy.toString() !== req.user._id.toString()) {
    await notificationService.sendPushNotification([issue.createdBy.toString()], {
      title: 'New Verification',
      body: `Someone verified your issue "${issue.title}". Status: ${issue.status}`,
      data: { issueId: issue._id.toString() },
    });
  }

  res.status(200).json(
    new ApiResponse(
      200,
      {
        issueId: issue._id,
        verificationCount: issue.verificationCount,
        averageSeverity: issue.averageSeverity,
        status: issue.status,
        commentCount: issue.commentCount,
        withinRadius: true,
      },
      'Issue verified successfully.'
    )
  );
});

// ─── 7. Get Trending Issues ───────────────────────────────────────────────────
exports.getTrending = asyncHandler(async (req, res) => {
  const { status, limit = 20 } = req.query;
  const filter = {};
  if (status) filter.status = status;

  const issues = await Issue.trending(filter, Math.min(50, parseInt(limit)));
  res.status(200).json(new ApiResponse(200, issues));
});

// ─── 8. Update Issue Status (official / admin) ───────────────────────────────
exports.updateStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const ALLOWED = ['Pending', 'Verified', 'Critical', 'Resolved', 'Rejected'];
  if (!ALLOWED.includes(status)) {
    throw new ApiError(400, `Invalid status. Allowed: ${ALLOWED.join(', ')}`);
  }

  const issue = await Issue.findByIdAndUpdate(
    req.params.id,
    { status, ...(status === 'Resolved' && { resolvedAt: new Date() }) },
    { new: true, runValidators: true }
  );

  if (!issue) throw new ApiError(404, 'Issue not found.');

  await notificationService.sendPushNotification([issue.createdBy.toString()], {
    title: 'Issue Status Update',
    body: `Your issue "${issue.title}" is now marked as ${status}.`,
    data: { issueId: issue._id.toString() },
  });

  emitStatusUpdate(issue._id, { status, updatedBy: req.user._id });

  res.status(200).json(new ApiResponse(200, issue, 'Status updated.'));
});

// ─── 9. Delete Issue ─────────────────────────────────────────────────────────
exports.deleteIssue = asyncHandler(async (req, res) => {
  const issue = await Issue.findById(req.params.id);
  if (!issue) throw new ApiError(404, 'Issue not found.');

  const isOwner = issue.createdBy.toString() === req.user._id.toString();
  if (!isOwner && req.user.role !== 'admin') {
    throw new ApiError(403, 'Not authorized to delete this issue.');
  }

  // Delete all cloudinary assets
  const publicIds = [
    ...(issue.image?.publicId ? [issue.image.publicId] : []),
    ...(issue.images?.map((img) => img.publicId) || []),
    ...(issue.comments?.flatMap((c) => c.image?.publicId ? [c.image.publicId] : []) || []),
  ];
  if (publicIds.length) await cloudinaryService.deleteMultiple(publicIds);

  await issue.deleteOne();
  res.status(200).json(new ApiResponse(200, null, 'Issue deleted.'));
});

// ─── 10. Add Comment ─────────────────────────────────────────────────────────
exports.addComment = asyncHandler(async (req, res) => {
  const { text } = req.body;
  if (!text?.trim()) throw new ApiError(400, 'Comment text is required.');

  let commentImage = { url: '', publicId: '' };
  if (req.file) {
    commentImage = await cloudinaryService.uploadBuffer(req.file.buffer, 'civicpulse/comments');
  }

  const issue = await Issue.findByIdAndUpdate(
    req.params.id,
    {
      $push: { comments: { user: req.user._id, text: text.trim(), image: commentImage } },
      $inc: { commentCount: 1 },
    },
    { new: true, runValidators: true }
  ).populate('comments.user', 'name avatar');

  if (!issue) throw new ApiError(404, 'Issue not found.');

  const newComment = issue.comments[issue.comments.length - 1];

  emitNewComment(issue._id, {
    comment: newComment,
    commentCount: issue.commentCount,
  });

  res.status(201).json(new ApiResponse(201, newComment, 'Comment added.'));
});

// ─── 11. Rate Issue Seriousness ──────────────────────────────────────────────
exports.rateIssue = asyncHandler(async (req, res) => {
  const { rating } = req.body;
  const parsed = parseInt(rating, 10);
  if (!parsed || parsed < 1 || parsed > 5) {
    throw new ApiError(400, 'Rating must be an integer between 1 and 5.');
  }

  const issue = await Issue.findById(req.params.id);
  if (!issue) throw new ApiError(404, 'Issue not found.');

  await issue.addSeriousnessRating(parsed);

  emitSeverityUpdate(issue._id, {
    averageSeverity: issue.averageSeverity,
    status: issue.status,
  });

  res.status(200).json(
    new ApiResponse(200, { averageSeverity: issue.averageSeverity, status: issue.status }, 'Rating submitted.')
  );
});

