const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    type: {
      type: String,
      enum: [
        'issue_verified',    // someone verified your issue
        'issue_liked',       // someone liked your issue
        'issue_commented',   // someone commented on your issue
        'status_update',     // issue status changed
        'issue_resolved',    // your issue was resolved
        'new_issue_nearby',  // new issue in your area
        'system',            // generic platform message
      ],
      required: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },

    body: {
      type: String,
      trim: true,
      maxlength: 500,
    },

    // Optional link to the related Issue
    issue: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Issue',
      default: null,
    },

    // Arbitrary key-value for deep-linking / extra context
    meta: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index: fetch latest unread notifications for a user quickly
notificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });

// Auto-expire notifications after 30 days
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 30 });

module.exports = mongoose.model('Notification', notificationSchema);
