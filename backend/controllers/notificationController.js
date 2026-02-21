const Notification = require('../models/Notification');
const ApiResponse  = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');

// ─── GET /api/v1/notifications ───────────────────────────────────────────────
exports.getNotifications = asyncHandler(async (req, res) => {
  const page  = Math.max(1, parseInt(req.query.page)  || 1);
  const limit = Math.min(50, parseInt(req.query.limit) || 20);
  const skip  = (page - 1) * limit;

  const filter = { user: req.user._id };
  if (req.query.unread === 'true') filter.isRead = false;

  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('issue', 'title status'),
    Notification.countDocuments(filter),
    Notification.countDocuments({ user: req.user._id, isRead: false }),
  ]);

  res.status(200).json(
    new ApiResponse(200, {
      notifications,
      unreadCount,
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

// ─── PATCH /api/v1/notifications/:id/read ────────────────────────────────────
exports.markAsRead = asyncHandler(async (req, res) => {
  await Notification.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    { isRead: true }
  );
  res.status(200).json(new ApiResponse(200, null, 'Marked as read.'));
});

// ─── PATCH /api/v1/notifications/read-all ────────────────────────────────────
exports.markAllAsRead = asyncHandler(async (req, res) => {
  const { modifiedCount } = await Notification.updateMany(
    { user: req.user._id, isRead: false },
    { isRead: true }
  );
  res.status(200).json(new ApiResponse(200, { updated: modifiedCount }, 'All notifications marked as read.'));
});

// ─── DELETE /api/v1/notifications/:id ────────────────────────────────────────
exports.deleteNotification = asyncHandler(async (req, res) => {
  await Notification.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  res.status(200).json(new ApiResponse(200, null, 'Notification deleted.'));
});

// ─── DELETE /api/v1/notifications ────────────────────────────────────────────
exports.clearAll = asyncHandler(async (req, res) => {
  await Notification.deleteMany({ user: req.user._id });
  res.status(200).json(new ApiResponse(200, null, 'All notifications cleared.'));
});
