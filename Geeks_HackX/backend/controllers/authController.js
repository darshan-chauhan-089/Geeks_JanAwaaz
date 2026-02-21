const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { uploadBuffer } = require('../services/cloudinaryService');
const {
  generateToken,
  setTokenCookie,
  clearTokenCookie,
} = require('../middleware/authMiddleware');

// ─── Helper: issue token + set cookie + return response ───────────────────────
const sendAuthResponse = (res, statusCode, user, message) => {
  const token = generateToken(user._id);
  setTokenCookie(res, token);
  res.status(statusCode).json(
    new ApiResponse(statusCode, { token, user: user.toPublicJSON() }, message)
  );
};

// ─── Register ─────────────────────────────────────────────────────────────────
exports.register = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;

  const existing = await User.findOne({ email });
  if (existing) throw new ApiError(409, 'An account with this email already exists.');

  const safeRole = ['user', 'citizen', 'official'].includes(role) ? role : 'user';
  const user = await User.create({ name, email, password, role: safeRole });

  sendAuthResponse(res, 201, user, 'Account created successfully. Welcome to CivicPulse!');
});

// ─── Login ────────────────────────────────────────────────────────────────────
exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password');
  if (!user) throw new ApiError(404, 'No account found with this email. Please sign up first.');
  if (!user.isActive) throw new ApiError(403, 'Your account has been deactivated. Contact support.');

  const isMatch = await user.comparePassword(password);
  if (!isMatch) throw new ApiError(401, 'Incorrect password. Please try again.');

  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  sendAuthResponse(res, 200, user, 'Login successful. Welcome back!');
});

// ─── Google OAuth Callback ────────────────────────────────────────────────────
/**
 * Called by Passport after Google verifies the user.
 * Sets httpOnly cookie and redirects to the frontend.
 */
exports.googleCallback = asyncHandler(async (req, res) => {
  if (!req.user) throw new ApiError(401, 'Google authentication failed. Please try again.');

  const token = generateToken(req.user._id);
  setTokenCookie(res, token);

  // Redirect to frontend — React app reads cookie automatically
  const redirect = `${process.env.CLIENT_URL}/auth/google/success?verified=${req.user.isVerified}`;
  res.redirect(redirect);
});

// ─── Get Me ───────────────────────────────────────────────────────────────────
exports.getMe = asyncHandler(async (req, res) => {
  res.status(200).json(new ApiResponse(200, req.user.toPublicJSON()));
});

// ─── Update Profile ───────────────────────────────────────────────────────────
exports.updateProfile = asyncHandler(async (req, res) => {
  const updates = {};

  if (req.body.name      !== undefined) updates.name         = req.body.name;
  if (req.body.locationName !== undefined) updates.locationName = req.body.locationName;

  // Handle avatar file upload via Cloudinary
  if (req.file) {
    const { url, publicId } = await uploadBuffer(
      req.file.buffer,
      'avatars',
      `user_${req.user._id}_${Date.now()}`,
      req.file.mimetype
    );
    updates.avatar = { url, publicId };
  }

  if (Object.keys(updates).length === 0) {
    return res.status(200).json(new ApiResponse(200, req.user.toPublicJSON(), 'No changes made.'));
  }

  const user = await User.findByIdAndUpdate(req.user._id, updates, {
    new: true,
    runValidators: true,
  });

  res.status(200).json(new ApiResponse(200, user.toPublicJSON(), 'Profile updated.'));
});

// ─── Change Password ──────────────────────────────────────────────────────────
exports.changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user._id).select('+password');
  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) throw new ApiError(401, 'Current password is incorrect.');

  user.password = newPassword;
  await user.save();

  // Rotate token after password change
  sendAuthResponse(res, 200, user, 'Password changed successfully.');
});

// ─── Logout ───────────────────────────────────────────────────────────────────
exports.logout = asyncHandler(async (req, res) => {
  clearTokenCookie(res);
  res.status(200).json(new ApiResponse(200, null, 'Logged out successfully.'));
});

// ─── Delete Account ───────────────────────────────────────────────────────────
exports.deleteAccount = asyncHandler(async (req, res) => {
  const { password } = req.body;

  const user = await User.findById(req.user._id).select('+password');

  // Google OAuth users may not have a traditional password — skip check
  if (user.password) {
    if (!password) throw new ApiError(400, 'Password confirmation is required.');
    const isMatch = await user.comparePassword(password);
    if (!isMatch) throw new ApiError(401, 'Password is incorrect.');
  }

  user.isActive = false;
  await user.save({ validateBeforeSave: false });

  clearTokenCookie(res);
  res.status(200).json(new ApiResponse(200, null, 'Account deactivated. We hate to see you go.'));
});
