const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  startPracticeSession,
  getNextQuestion,
  endPracticeSession,
  getUserPracticeSessions,
  getPracticeSessionResults,
  getUserSectionalTestHistory,
  startSectionalTest,
  getSectionalQuestion,
  switchSectionalSection,
  endSectionalTest,
  getSectionalTestResults
} = require('../controllers/practiceController');


// Regular practice sessions
router.post('/start',auth, startPracticeSession);
router.post('/:sessionId/next',auth, getNextQuestion);
router.post('/:sessionId/end',auth, endPracticeSession);
router.get('/results/:sessionId',auth, getPracticeSessionResults);
router.get('/history',auth, getUserPracticeSessions);
router.get('/sectional/history',auth, getUserSectionalTestHistory);

// Sectional tests
router.post('/sectional/start', auth, startSectionalTest);
router.post('/sectional/:sessionId/next', auth, getSectionalQuestion);
router.post('/sectional/:sessionId/switch', auth, switchSectionalSection);
router.post('/sectional/:sessionId/end', auth, endSectionalTest);
router.get('/sectional/results/:sessionId', auth, getSectionalTestResults);

module.exports = router;