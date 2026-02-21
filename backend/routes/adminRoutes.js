const express = require('express');
const router  = express.Router();

const { protect }    = require('../middleware/authMiddleware');
const { roleCheck }  = require('../middleware/roleCheck');
const adminCtrl      = require('../controllers/adminController');

// All admin routes require authentication + admin/official role
router.use(protect);
router.use(roleCheck(['admin', 'official']));

// ── Dashboard stats ──────────────────────────────────────────────────────────
router.get('/stats', adminCtrl.getStats);

// ── User management ──────────────────────────────────────────────────────────
router.get ('/users',                   adminCtrl.getUsers);
router.patch('/users/:id/role',         adminCtrl.updateUserRole);
router.patch('/users/:id/deactivate',   adminCtrl.deactivateUser);

// ── Issue management ─────────────────────────────────────────────────────────
router.get   ('/issues',            adminCtrl.getAllIssues);
router.patch ('/issues/:id/status', adminCtrl.updateIssueStatus);
router.delete('/issues/:id',        adminCtrl.deleteIssue);

module.exports = router;
