const User  = require('../models/User');
const Issue = require('../models/Issue');
const ApiError    = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');

// ─── GET /api/v1/admin/stats ──────────────────────────────────────────────────
exports.getStats = asyncHandler(async (_req, res) => {
  const [
    totalUsers,
    totalIssues,
    verifiedIssues,
    resolvedIssues,
    pendingIssues,
    latestIssue,
  ] = await Promise.all([
    User.countDocuments({ isActive: true }),
    Issue.countDocuments(),
    Issue.countDocuments({ $or: [{ status: 'Verified' }, { status: 'Critical' }] }),
    Issue.countDocuments({ status: 'Resolved' }),
    Issue.countDocuments({ status: 'Pending' }),
    Issue.findOne().sort({ createdAt: -1 }).select('notifiedCount createdAt updatedAt comments'),
  ]);

  const inProgress = totalIssues - verifiedIssues - resolvedIssues - pendingIssues;

  // Calculate average verification time for verified/critical issues
  let averageVerificationTimeMs = 0;
  if (verifiedIssues > 0) {
    const verifiedIssuesList = await Issue.find(
      { $or: [{ status: 'Verified' }, { status: 'Critical' }] }
    ).select('createdAt updatedAt comments');

    const verificationTimes = verifiedIssuesList.map((issue) => {
      // Use the timestamp of the first comment (first verification) as proxy for verification time
      const firstCommentTime = issue.comments?.[0]?.createdAt || issue.updatedAt;
      return new Date(firstCommentTime) - new Date(issue.createdAt);
    });

    averageVerificationTimeMs =
      verificationTimes.reduce((a, b) => a + b, 0) / verificationTimes.length;
  }

  // Convert milliseconds to hours for readability
  const averageVerificationTimeHours = Math.round(averageVerificationTimeMs / (1000 * 60 * 60) * 10) / 10;

  // Get notified count from latest issue
  const totalUsersNotifiedForLatestIssue = latestIssue?.notifiedCount || 0;

  res.status(200).json(
    new ApiResponse(200, {
      totalUsers,
      totalIssues,
      totalVerifiedIssues: verifiedIssues,
      averageVerificationTime: {
        milliseconds: Math.round(averageVerificationTimeMs),
        hours: averageVerificationTimeHours,
      },
      totalUsersNotifiedForLatestIssue,
      issues: {
        total: totalIssues,
        verified: verifiedIssues,
        pending: pendingIssues,
        inProgress: Math.max(0, inProgress),
        resolved: resolvedIssues,
        resolutionRate: totalIssues ? Math.round((resolvedIssues / totalIssues) * 100) : 0,
      },
      users: {
        total: totalUsers,
      },
    }, 'Admin statistics retrieved successfully.')
  );
});

// ─── GET /api/v1/admin/users ──────────────────────────────────────────────────
exports.getUsers = asyncHandler(async (req, res) => {
  const page  = Math.max(1, parseInt(req.query.page)  || 1);
  const limit = Math.min(50, parseInt(req.query.limit) || 20);
  const skip  = (page - 1) * limit;

  const filter = {};
  if (req.query.role)   filter.role     = req.query.role;
  if (req.query.search) {
    filter.$or = [
      { name:  { $regex: req.query.search, $options: 'i' } },
      { email: { $regex: req.query.search, $options: 'i' } },
    ];
  }

  const [users, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    User.countDocuments(filter),
  ]);

  res.status(200).json(
    new ApiResponse(200, {
      users: users.map((u) => u.toPublicJSON()),
      pagination: {
        total,
        page,
        limit,
        pages:   Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    })
  );
});

// ─── PATCH /api/v1/admin/users/:id/role ──────────────────────────────────────
exports.updateUserRole = asyncHandler(async (req, res) => {
  const { role } = req.body;
  const ALLOWED_ROLES = ['user', 'citizen', 'official', 'admin'];

  if (!ALLOWED_ROLES.includes(role)) {
    throw new ApiError(400, `Role must be one of: ${ALLOWED_ROLES.join(', ')}`);
  }
  if (req.params.id === req.user._id.toString()) {
    throw new ApiError(400, 'You cannot change your own role.');
  }

  const user = await User.findByIdAndUpdate(
    req.params.id,
    { role },
    { new: true, runValidators: true }
  );
  if (!user) throw new ApiError(404, 'User not found.');

  res.status(200).json(
    new ApiResponse(200, user.toPublicJSON(), `Role updated to "${role}".`)
  );
});

// ─── PATCH /api/v1/admin/users/:id/deactivate ───────────────────────────────
exports.deactivateUser = asyncHandler(async (req, res) => {
  if (req.params.id === req.user._id.toString()) {
    throw new ApiError(400, 'You cannot deactivate your own account.');
  }

  const user = await User.findByIdAndUpdate(
    req.params.id,
    { isActive: false },
    { new: true }
  );
  if (!user) throw new ApiError(404, 'User not found.');

  res.status(200).json(new ApiResponse(200, null, 'User deactivated.'));
});

// ─── GET /api/v1/admin/issues ─────────────────────────────────────────────────
exports.getAllIssues = asyncHandler(async (req, res) => {
  const page  = Math.max(1, parseInt(req.query.page)  || 1);
  const limit = Math.min(50, parseInt(req.query.limit) || 20);
  const skip  = (page - 1) * limit;

  const filter = {};
  if (req.query.status)   filter.status   = req.query.status;
  if (req.query.category) filter.category = req.query.category;

  const [issues, total] = await Promise.all([
    Issue.find(filter)
      .populate('createdBy', 'name email avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Issue.countDocuments(filter),
  ]);

  res.status(200).json(
    new ApiResponse(200, {
      issues,
      pagination: {
        total,
        page,
        limit,
        pages:   Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    })
  );
});

// ─── PATCH /api/v1/admin/issues/:id/status ───────────────────────────────────
exports.updateIssueStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const STATUS_MAP = {
    'In Progress': 'Critical',
    'In Working Progress': 'Critical',
    in_progress: 'Critical',
    in_working_progress: 'Critical',
    issue_resolved: 'Resolved',
    issue_rejected: 'Rejected',
  };

  const normalizedStatus = STATUS_MAP[String(status || '').trim()] || status;
  const ALLOWED = ['Pending', 'Verified', 'Critical', 'Resolved', 'Rejected'];

  if (!ALLOWED.includes(normalizedStatus)) {
    throw new ApiError(400, `Status must be one of: ${ALLOWED.join(', ')}`);
  }

  const issue = await Issue.findByIdAndUpdate(
    req.params.id,
    { status: normalizedStatus, resolvedAt: normalizedStatus === 'Resolved' ? new Date() : undefined },
    { new: true, runValidators: true }
  ).populate('createdBy', 'name email');

  if (!issue) throw new ApiError(404, 'Issue not found.');

  // Emit real-time update
  try {
    const { emitStatusUpdate } = require('../socket/socketEvents');
    emitStatusUpdate(issue._id.toString(), { status: normalizedStatus, updatedBy: req.user._id });
  } catch { /* socket optional */ }

  res.status(200).json(new ApiResponse(200, issue, `Status updated to "${normalizedStatus}".`));
});

// ─── DELETE /api/v1/admin/issues/:id ─────────────────────────────────────────
exports.deleteIssue = asyncHandler(async (req, res) => {
  const issue = await Issue.findByIdAndDelete(req.params.id);
  if (!issue) throw new ApiError(404, 'Issue not found.');
  res.status(200).json(new ApiResponse(200, null, 'Issue deleted.'));
});
