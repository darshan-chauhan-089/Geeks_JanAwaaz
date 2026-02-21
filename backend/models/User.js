const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// ─── Schema ───────────────────────────────────────────────────────────────────
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [80, 'Name cannot exceed 80 characters'],
    },

    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Invalid email format'],
    },

    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false,
    },

    role: {
      type: String,
      enum: ['user', 'citizen', 'official', 'admin'],
      default: 'user',
    },

    avatar: {
      url: { type: String, default: '' },
      publicId: { type: String, default: '' },
    },

    // Human-readable city/area name for display (separate from geo coordinates)
    locationName: {
      type: String,
      trim: true,
      maxlength: [120, 'Location name cannot exceed 120 characters'],
      default: '',
    },

    // GeoJSON Point — 2dsphere indexed below
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        default: [0, 0],
        validate: {
          validator: (v) => v.length === 2,
          message: 'Coordinates must be [longitude, latitude].',
        },
      },
    },

    // Civic engagement metrics
    verificationCount: {
      type: Number,
      default: 0,
      min: [0, 'verificationCount cannot be negative'],
    },

    credibilityScore: {
      type: Number,
      default: 0,
      min: [0, 'credibilityScore cannot be negative'],
      max: [100, 'credibilityScore cannot exceed 100'],
    },

    isVerified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    pushTokens: [{ type: String }],
    lastLogin: { type: Date },
  },
  {
    timestamps: true, // createdAt + updatedAt auto-managed
  }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────
userSchema.index({ location: '2dsphere' });
// email is already indexed via unique:true — no duplicate needed
userSchema.index({ credibilityScore: -1 });                // leaderboard queries
userSchema.index({ role: 1, isActive: 1 });                // admin user filters

// ─── Pre-save Middleware ──────────────────────────────────────────────────────
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// ─── Instance Methods ─────────────────────────────────────────────────────────
/**
 * Compare a plain-text candidate with the stored bcrypt hash.
 * @param {string} candidatePassword
 * @returns {Promise<boolean>}
 */
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

/**
 * Strip sensitive fields before sending to client.
 * @returns {object}
 */
userSchema.methods.toPublicJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.pushTokens;
  delete obj.__v;
  return obj;
};

/**
 * Increment credibilityScore by a delta (clamped 0–100).
 * @param {number} delta
 */
userSchema.methods.adjustCredibility = async function (delta) {
  this.credibilityScore = Math.min(100, Math.max(0, this.credibilityScore + delta));
  await this.save({ validateBeforeSave: false });
};

// ─── Static Methods ───────────────────────────────────────────────────────────
/**
 * Find users near a [lng, lat] coordinate.
 * @param {[number, number]} coordinates
 * @param {number} maxDistanceMeters
 */
userSchema.statics.findNear = function (coordinates, maxDistanceMeters = 5000) {
  return this.find({
    location: {
      $near: {
        $geometry: { type: 'Point', coordinates },
        $maxDistance: maxDistanceMeters,
      },
    },
  });
};

module.exports = mongoose.model('User', userSchema);
