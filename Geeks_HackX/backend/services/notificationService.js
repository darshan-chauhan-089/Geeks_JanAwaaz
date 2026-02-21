const Notification = require('../models/Notification');
const User = require('../models/User');

let _getIO = null;
// Lazily import to avoid circular dependency at startup
function getIO() {
  if (!_getIO) _getIO = require('../socket/index').getIO;
  return _getIO();
}

/**
 * Persist an in-app notification and push it to the user's socket room.
 */
const sendInAppNotification = async (userId, data) => {
  if (!userId || !data?.type || !data?.title) return;

  const notification = await Notification.create({
    user:  userId,
    type:  data.type,
    title: data.title,
    body:  data.body  ?? '',
    issue: data.issue ?? null,
    meta:  data.meta  ?? {},
  });

  // Push to client in real time
  try {
    getIO()?.to(`user_${userId}`).emit('notification', notification);
  } catch { /* socket may not be ready — no-op */ }

  return notification;
};

/**
 * Find all active citizen users within 10km of the issue location
 * using MongoDB $geoWithin + $centerSphere.
 * (excluding the reporter) and send each a 'new_issue_nearby' notification.
 * Returns count of notified users.
 * Fire-and-forget — never throws so it cannot break issue creation.
 *
 * @param {import('mongoose').Document} issue
 * @param {number} [radiusKm=10]
 * @returns {Promise<number>} Count of notified users
 */
const notifyNearbyUsers = async (issue, radiusKm = 10) => {
  try {
    const [lng, lat] = issue.location?.coordinates ?? [];
    if (!Number.isFinite(lng) || !Number.isFinite(lat)) return 0;

    // Convert km to radians using Earth's mean radius (6378.1 km)
    const radiusInRadians = radiusKm / 6378.1;

    // Find users within 10km radius using $geoWithin with $centerSphere
    // Filter: isActive: true, role: user or citizen, exclude issue creator
    const nearbyUsers = await User.find({
      _id: { $ne: issue.createdBy },
      isActive: true,
      role: { $in: ['user', 'citizen'] },
      location: {
        $geoWithin: {
          $centerSphere: [[lng, lat], radiusInRadians],
        },
      },
    }).select('_id').lean();

    if (!nearbyUsers.length) return 0;

    // ── Batch create notifications using insertMany()
    const notificationDocs = nearbyUsers.map((user) => ({
      user: user._id,
      type: 'new_issue_nearby',
      title: 'New issue reported nearby',
      body: `"${issue.title}" was just reported within ${radiusKm} km of your location.`,
      issue: issue._id,
      meta: { category: issue.category, distance: radiusKm },
      read: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    await Notification.insertMany(notificationDocs);

    // ── Emit socket event to each notified user
    const io = getIO();
    if (io) {
      nearbyUsers.forEach((user) => {
        const payload = {
          issueId: issue._id,
          title: issue.title,
          category: issue.category,
          distance: radiusKm,
          location: {
            address: issue.location.address || '',
            city: issue.location.city || '',
            ward: issue.location.ward || '',
          },
          timestamp: new Date(),
        };
        io.to(`user_${user._id}`).emit('issue:nearby', payload);
        io.to(`user_${user._id}`).emit('notification', {
          type: 'new_issue_nearby',
          title: 'New issue reported nearby',
          body: payload.location.address
            ? `"${issue.title}" near ${payload.location.address}`
            : `"${issue.title}" was reported within ${radiusKm} km of your location.`,
          issue: issue._id,
          meta: payload,
          createdAt: payload.timestamp,
        });
      });
    }

    return nearbyUsers.length;
  } catch (err) {
    // Never let notification failure surface to the user
    console.error('[notifyNearbyUsers] error:', err.message);
    return 0;
  }
};

/**
 * Send push notification to a list of device tokens.
 */
const sendPushNotification = async (recipientTokens, payload) => {
  if (!recipientTokens?.length) return;
  if (process.env.NODE_ENV !== 'production') {
    console.log('[PUSH STUB]', { recipientTokens, payload });
  }
};

/**
 * Notify admin users when an issue becomes Verified.
 * Sends both in-app notification and socket event.
 * Fire-and-forget — never throws.
 *
 * @param {import('mongoose').Document} issue
 */
const notifyAdminsOnVerification = async (issue) => {
  try {
    // Find all admin users
    const adminUsers = await User.find({
      role: 'admin',
      isActive: true,
    }).select('_id').lean();

    if (!adminUsers.length) return;

    // Batch create notifications for all admins
    const notificationDocs = adminUsers.map((admin) => ({
      user: admin._id,
      type: 'issue_verified',
      title: 'Issue Verified - Requires Attention',
      body: `Issue "${issue.title}" in ${issue.location.city || 'your area'} has been verified by citizens. Status: ${issue.status}`,
      issue: issue._id,
      meta: {
        category: issue.category,
        verificationCount: issue.verificationCount,
        averageSeverity: issue.averageSeverity,
        city: issue.location.city,
      },
      read: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    await Notification.insertMany(notificationDocs);

    // Emit socket event to each admin
    const io = getIO();
    if (io) {
      adminUsers.forEach((admin) => {
        const payload = {
          issueId: issue._id,
          title: issue.title,
          category: issue.category,
          verificationCount: issue.verificationCount,
          averageSeverity: issue.averageSeverity,
          status: issue.status,
          location: {
            address: issue.location.address || '',
            city: issue.location.city || '',
            ward: issue.location.ward || '',
          },
          timestamp: new Date(),
        };
        io.to(`user_${admin._id}`).emit('issue:verified-admin', payload);
      });
    }
  } catch (err) {
    console.error('[notifyAdminsOnVerification] error:', err.message);
  }
};

module.exports = { sendInAppNotification, sendPushNotification, notifyNearbyUsers, notifyAdminsOnVerification };
