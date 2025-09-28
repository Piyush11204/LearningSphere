const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  startPracticeSession,
  getNextQuestion,
  endPracticeSession,
  getUserPracticeSessions
} = require('../controllers/practiceController');


// Start new practice session
router.post('/start',auth, startPracticeSession);

// Get next question / submit answer
router.post('/:sessionId/next',auth, getNextQuestion);

// End practice session
router.post('/:sessionId/end',auth, endPracticeSession);

// Get practice session results
router.get('/results/:sessionId',auth, require('../controllers/practiceController').getPracticeSessionResults);

// Get user's practice sessions
router.get('/history',auth, getUserPracticeSessions);

module.exports = router;