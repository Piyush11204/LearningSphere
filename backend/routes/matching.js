const express = require('express');
const { generateMatches, getMatches, acceptMatch, rejectMatch, deleteMatch, getRecommendations } = require('../controllers/matchingController');
const auth = require('../middleware/auth');

const router = express.Router();

// Protected routes
router.post('/generate', auth, generateMatches);
router.get('/:userId', auth, getMatches);
router.put('/accept/:matchId', auth, acceptMatch);
router.put('/reject/:matchId', auth, rejectMatch);
router.delete('/:matchId', auth, deleteMatch);
router.get('/recommendations', auth, getRecommendations);

module.exports = router;
