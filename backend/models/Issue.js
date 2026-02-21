const mongoose = require('mongoose');

// ─── Comment Subdocument ──────────────────────────────────────────────────────
const commentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    text: {
      type: String,
      required: [true, 'Comment text is required'],
      trim: true,
      maxlength: [1000, 'Comment cannot exceed 1000 characters'],
    },
    image: {
      url: { type: String, default: '' },
      publicId: { type: String, default: '' },
    },
  },
  { timestamps: true, _id: true }
);

// ─── Main Issue Schema ────────────────────────────────────────────────────────
const issueSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [150, 'Title cannot exceed 150 characters'],
    },

    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      maxlength: [3000, 'Description cannot exceed 3000 characters'],
    },

    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: ['road', 'water', 'electricity', 'sanitation', 'safety', 'environment', 'infrastructure', 'other'],
      index: true,
    },

    // GeoJSON Point — 2dsphere indexed below
    location: {
      type: {
        type: String,
        enum: ['Point'],
        required: true,
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        default: undefined,
        required: [true, 'Location coordinates are required'],
        validate: [
          {
            validator: (v) => Array.isArray(v) && v.length === 2,
            message: 'Coordinates must be [longitude, latitude].',
          },
          {
            validator: (v) => v.every((n) => typeof n === 'number' && isFinite(n)),
            message: 'Coordinates must be valid numbers.',
          },
        ],
      },
      address: { type: String, trim: true },
      city:    { type: String, trim: true },
      ward:    { type: String, trim: true },
    },

    // Primary cover image (Cloudinary)
    image: {
      url: { type: String, default: '' },
      publicId: { type: String, default: '' },
    },

    // Additional images
    images: [
      {
        url: { type: String, required: true },
        publicId: { type: String, required: true },
      },
    ],

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Issue must have a creator'],
      index: true,
    },

    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    // ── Engagement ─────────────────────────────────────────────────────────
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    likeCount: { type: Number, default: 0 },  // denormalized for sort performance

    comments: [commentSchema],
    commentCount: { type: Number, default: 0 }, // denormalized for sort performance

    // ── Verification & Severity ────────────────────────────────────────────
    verificationCount: {
      type: Number,
      default: 0,
      min: [0, 'verificationCount cannot be negative'],
    },

    seriousnessRatings: {
      type: [Number],
      default: [],
      validate: {
        validator: (arr) => arr.every((n) => n >= 1 && n <= 5),
        message: 'Each seriousness rating must be between 1 and 5.',
      },
    },

    averageSeverity: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },

    // ── Status ─────────────────────────────────────────────────────────────
    // Pending  → default
    // Verified → verificationCount >= 5
    // Critical → averageSeverity >= 4 AND verificationCount >= 10
    status: {
      type: String,
      enum: ['Pending', 'Verified', 'Critical', 'Resolved', 'Rejected'],
      default: 'Pending',
      index: true,
    },

    // ── AI Verification Block ──────────────────────────────────────────────
    aiVerification: {
      isVerified: { type: Boolean, default: false },
      confidence: { type: Number, default: 0, min: 0, max: 1 },
      tags: [{ type: String }],
      processedAt: { type: Date },
    },

    // ── Notification Tracking ──────────────────────────────────────────────
    notifiedCount: {
      type: Number,
      default: 0,
      min: [0, 'notifiedCount cannot be negative'],
    },

    resolvedAt: { type: Date },
  },
  {
    timestamps: true, // createdAt + updatedAt
  }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────
issueSchema.index({ location: '2dsphere' });

// Pagination / list queries
issueSchema.index({ status: 1, createdAt: -1 });
issueSchema.index({ createdBy: 1, createdAt: -1 });
issueSchema.index({ category: 1, status: 1 });

// Trending feed: newest high-severity verified issues
issueSchema.index({ status: 1, averageSeverity: -1, createdAt: -1 });

// Trending feed: most liked
issueSchema.index({ likeCount: -1, createdAt: -1 });

// Verification queue for officials
issueSchema.index({ verificationCount: 1, status: 1 });

// ─── Instance Methods ─────────────────────────────────────────────────────────
/**
 * Recalculate averageSeverity from the seriousnessRatings array.
 * Does NOT call save() — caller is responsible.
 */
issueSchema.methods.recalculateAverageSeverity = function () {
  if (!this.seriousnessRatings.length) {
    this.averageSeverity = 0;
    return 0;
  }
  const sum = this.seriousnessRatings.reduce((acc, r) => acc + r, 0);
  this.averageSeverity = parseFloat((sum / this.seriousnessRatings.length).toFixed(2));
  return this.averageSeverity;
};

/**
 * Update issue status based on business rules:
 *   - Critical : averageSeverity >= 4  AND verificationCount >= 10
 *   - Verified : verificationCount >= 5
 *   - Pending  : everything else
 * Does NOT call save() — caller is responsible.
 */
issueSchema.methods.updateStatus = function () {
  if (this.status === 'Resolved' || this.status === 'Rejected') return;

  if (this.averageSeverity >= 4 && this.verificationCount >= 10) {
    this.status = 'Critical';
  } else if (this.verificationCount >= 5) {
    this.status = 'Verified';
  } else {
    this.status = 'Pending';
  }
};

/**
 * Add a seriousness rating, recalculate severity, and update status atomically.
 * Calls save() internally.
 * @param {number} rating  1–5
 */
issueSchema.methods.addSeriousnessRating = async function (rating) {
  this.seriousnessRatings.push(rating);
  this.recalculateAverageSeverity();
  this.updateStatus();
  await this.save();
};

/**
 * Register a verification by a user:
 *   - Increments verificationCount
 *   - Re-evaluates status
 *   Calls save() internally.
 */
issueSchema.methods.addVerification = async function () {
  this.verificationCount += 1;
  this.updateStatus();
  await this.save();
};

// ─── Static Methods ───────────────────────────────────────────────────────────
/**
 * Trending issues: most liked, optionally filtered by status.
 * @param {object} filter   Additional mongoose query filter
 * @param {number} limit
 */
issueSchema.statics.trending = function (filter = {}, limit = 20) {
  return this.find(filter)
    .sort({ likeCount: -1, verificationCount: -1, createdAt: -1 })
    .limit(limit)
    .populate('createdBy', 'name avatar credibilityScore');
};

/**
 * Paginated list helper.
 * @param {object} filter
 * @param {{ page?: number, limit?: number, sort?: object }} options
 */
issueSchema.statics.paginate = async function (filter = {}, options = {}) {
  const page = Math.max(1, parseInt(options.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(options.limit) || 20));
  const sort = options.sort || { createdAt: -1 };
  const skip = (page - 1) * limit;

  const [docs, total] = await Promise.all([
    this.find(filter).sort(sort).skip(skip).limit(limit).populate('createdBy', 'name avatar credibilityScore'),
    this.countDocuments(filter),
  ]);

  return {
    docs,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1,
    },
  };
};

module.exports = mongoose.model('Issue', issueSchema);
