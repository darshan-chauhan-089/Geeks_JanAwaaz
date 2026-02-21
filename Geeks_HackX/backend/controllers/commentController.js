const Issue = require('../models/Issue');
const ApiError    = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');

// ─── POST /api/v1/issues/:id/comments ────────────────────────────────────────
exports.addComment = asyncHandler(async (req, res) => {
  const { text } = req.body;
  if (!text?.trim()) throw new ApiError(400, 'Comment text is required.');

  const issue = await Issue.findById(req.params.id);
  if (!issue) throw new ApiError(404, 'Issue not found.');

  const comment = {
    user: req.user._id,
    text: text.trim(),
  };

  issue.comments.push(comment);
  issue.commentCount = issue.comments.length;
  await issue.save({ validateBeforeSave: false });

  // Return the newly added comment (last one)
  const added = issue.comments[issue.comments.length - 1];

  // Populate the user field on the returned subdoc
  await issue.populate({ path: 'comments.user', select: 'name avatar', match: { _id: req.user._id } });

  // Emit real-time notification
  try {
    const { emitNewComment } = require('../socket/socketEvents');
    emitNewComment(issue._id.toString(), {
      comment: added,
      issueTitle: issue.title,
    });
  } catch { /* socket optional */ }

  res.status(201).json(new ApiResponse(201, added, 'Comment added.'));
});

// ─── GET /api/v1/issues/:id/comments ─────────────────────────────────────────
exports.getComments = asyncHandler(async (req, res) => {
  const issue = await Issue.findById(req.params.id)
    .select('comments')
    .populate('comments.user', 'name avatar');

  if (!issue) throw new ApiError(404, 'Issue not found.');

  res.status(200).json(new ApiResponse(200, { comments: issue.comments }));
});

// ─── DELETE /api/v1/issues/:id/comments/:commentId ───────────────────────────
exports.deleteComment = asyncHandler(async (req, res) => {
  const issue = await Issue.findById(req.params.id);
  if (!issue) throw new ApiError(404, 'Issue not found.');

  const comment = issue.comments.id(req.params.commentId);
  if (!comment) throw new ApiError(404, 'Comment not found.');

  // Only the comment author or an admin can delete
  const isAuthor = comment.user.toString() === req.user._id.toString();
  const isAdmin  = ['admin', 'official'].includes(req.user.role);
  if (!isAuthor && !isAdmin) {
    throw new ApiError(403, 'You are not authorised to delete this comment.');
  }

  comment.deleteOne();
  issue.commentCount = issue.comments.length;
  await issue.save({ validateBeforeSave: false });

  res.status(200).json(new ApiResponse(200, null, 'Comment deleted.'));
});
