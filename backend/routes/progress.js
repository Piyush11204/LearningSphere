const express = require('express');
const { 
  updateProgress, 
  getProgress, 
  getLeaderboard, 
  createProgress, 
  updateProgressManually, 
  deleteProgress,
  awardBadgeToUser,
  getBadgeDefinitions,
  getUserBadgeStats
} = require('../controllers/progressController');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

const router = express.Router();

// Protected routes
router.post('/', auth, createProgress);
router.put('/', auth, updateProgress);
router.get('/leaderboard', auth, getLeaderboard);  // More specific route first
router.get('/badges/definitions', getBadgeDefinitions);  // Public badge definitions
router.get('/badges/stats/:userId', auth, getUserBadgeStats);  // User badge stats
router.get('/:userId', auth, getProgress);         // Generic route after
router.put('/:progressId', auth, roleCheck('admin'), updateProgressManually);
router.delete('/:progressId', auth, roleCheck('admin'), deleteProgress);

// Admin routes for badge management
router.post('/admin/award-badge', auth, roleCheck('admin'), awardBadgeToUser);

module.exports = router;
