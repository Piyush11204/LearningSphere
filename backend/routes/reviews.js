const express = require('express');
const { submitReview, getUserReviews, getSessionReviews, updateReview, deleteReview } = require('../controllers/reviewController');
const auth = require('../middleware/auth');

const router = express.Router();

// Protected routes
router.post('/', auth, submitReview);
router.get('/user/:userId', auth, getUserReviews);
router.get('/session/:sessionId', auth, getSessionReviews);
router.put('/:reviewId', auth, updateReview);
router.delete('/:reviewId', auth, deleteReview);

module.exports = router;
