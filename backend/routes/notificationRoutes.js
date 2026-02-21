const express = require('express');
const router  = express.Router();

const { protect } = require('../middleware/authMiddleware');
const notifCtrl   = require('../controllers/notificationController');

// All notification routes require authentication
router.use(protect);

router.get   ('/',               notifCtrl.getNotifications);
router.patch ('/read-all',       notifCtrl.markAllAsRead);
router.patch ('/:id/read',       notifCtrl.markAsRead);
router.delete('/',               notifCtrl.clearAll);
router.delete('/:id',            notifCtrl.deleteNotification);

module.exports = router;
