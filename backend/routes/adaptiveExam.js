const express = require('express');
const router = express.Router();
const adaptiveExamController = require('../controllers/adaptiveExamController');
const auth = require('../middleware/auth');

// All routes require authentication
router.use(auth);

// Get active session
router.get('/active-session', adaptiveExamController.getActiveSession);

// Start a new adaptive exam
router.post('/start', adaptiveExamController.startAdaptiveExam);

// Resume active session
router.get('/resume/:sessionId', adaptiveExamController.resumeActiveSession);

// Submit an answer
router.post('/submit', adaptiveExamController.submitAnswer);

// Get exam analytics by session ID
router.get('/analytics/:sessionId', adaptiveExamController.getExamAnalytics);

// Get user's exam history
router.get('/history', adaptiveExamController.getExamHistory);

// End exam (abandon or save results)
router.put('/end/:sessionId', adaptiveExamController.abandonExam);

// Backward compatibility
router.put('/abandon/:sessionId', adaptiveExamController.abandonExam);

// Get user's overall stats
router.get('/stats', adaptiveExamController.getUserStats);

module.exports = router;
