const express = require('express');
const { getAllUsers, toggleBanUser, changeRole, moderateSession, getAnalytics, deleteReviewAdmin } = require('../controllers/adminController');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

const router = express.Router();

// Admin-only routes
router.get('/users', auth, roleCheck('admin'), getAllUsers);
router.put('/users/:userId/ban', auth, roleCheck('admin'), toggleBanUser);
router.put('/users/:userId/role', auth, roleCheck('admin'), changeRole);
router.put('/sessions/:sessionId/moderate', auth, roleCheck('admin'), moderateSession);
router.get('/analytics', auth, roleCheck('admin'), getAnalytics);
router.delete('/reviews/:reviewId', auth, roleCheck('admin'), deleteReviewAdmin);

module.exports = router;
