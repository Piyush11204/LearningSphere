const Review = require('../models/Review');
const Session = require('../models/Session');

// Submit review (after session)
exports.submitReview = async (req, res) => {
  try {
    const { sessionId, reviewedUserId, rating, feedback, isAnonymous } = req.body;
    const reviewerId = req.user.id;

    // Validate session access
    const session = await Session.findById(sessionId).populate('tutor learners');
    if (!session) {
      return res.status(404).json({ msg: 'Session not found' });
    }

    const isParticipant = session.tutor.toString() === reviewerId || 
                         session.learners.some(l => l.toString() === reviewerId);
    if (!isParticipant) {
      return res.status(403).json({ msg: 'Only participants can review' });
    }

    // Prevent self-review
    if (reviewedUserId === reviewerId) {
      return res.status(400).json({ msg: 'Cannot review yourself' });
    }

    const review = new Review({
      session: sessionId,
      reviewer: reviewerId,
      reviewedUser: reviewedUserId,
      rating,
      feedback,
      isAnonymous
    });
    await review.save();

    res.status(201).json({ msg: 'Review submitted', review });
  } catch (error) {
    console.error('Submit review error:', error);
    res.status(500).json({ msg: 'Server error submitting review', error: error.message });
  }
};

// Get reviews for a user (average rating)
exports.getUserReviews = async (req, res) => {
  try {
    const { userId } = req.params;
    const { sessionId } = req.query;  // Optional filter by session

    const query = { reviewedUser: userId };
    if (sessionId) query.session = sessionId;

    const reviews = await Review.find(query)
      .populate('reviewer session', 'title')
      .sort({ createdAt: -1 });

    // Compute average
    const averageRating = reviews.length > 0 ? 
      reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length : 0;

    res.json({ reviews, averageRating: Math.round(averageRating * 10) / 10 });
  } catch (error) {
    console.error('Get user reviews error:', error);
    res.status(500).json({ msg: 'Server error fetching reviews', error: error.message });
  }
};

// Get reviews for a session
exports.getSessionReviews = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = await Session.findById(sessionId);
    if (!session) {
      return res.status(404).json({ msg: 'Session not found' });
    }

    const reviews = await Review.find({ session: sessionId })
      .populate('reviewer reviewedUser', 'profile.name');

    res.json(reviews);
  } catch (error) {
    console.error('Get session reviews error:', error);
    res.status(500).json({ msg: 'Server error fetching session reviews', error: error.message });
  }
};

// Update review (edit feedback)
exports.updateReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { feedback, rating } = req.body;

    const review = await Review.findOneAndUpdate(
      { _id: reviewId, reviewer: req.user.id },  // Only own reviews
      { $set: { feedback, rating } },
      { new: true, runValidators: true }
    ).populate('session');

    if (!review) {
      return res.status(404).json({ msg: 'Review not found or access denied' });
    }

    res.json(review);
  } catch (error) {
    console.error('Update review error:', error);
    res.status(500).json({ msg: 'Server error updating review', error: error.message });
  }
};

// Delete review
exports.deleteReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const review = await Review.findOneAndDelete({ _id: reviewId, reviewer: req.user.id });

    if (!review) {
      return res.status(404).json({ msg: 'Review not found or access denied' });
    }

    res.json({ msg: 'Review deleted' });
  } catch (error) {
    console.error('Delete review error:', error);
    res.status(500).json({ msg: 'Server error deleting review', error: error.message });
  }
};
