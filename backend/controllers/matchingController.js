const Match = require('../models/Match');
const User = require('../models/User');
const { findMatches } = require('../utils/matchingAlgorithm');

// Generate matches for a learner (uses smart algorithm based on interests/skills/location)
exports.generateMatches = async (req, res) => {
  try {
    const { userId, limit = 10 } = req.body;  // Or use req.user.id for current user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    // Use utility for matching
    const potentialMatches = await findMatches(userId, 'tutor');

    // Create Match records with scores
    const matches = await Promise.all(potentialMatches.slice(0, limit).map(async (tutor) => {
      const score = Math.random() * 100;  // Placeholder; integrate real algo
      const match = new Match({
        learner: userId,
        tutor: tutor._id,
        matchScore: score,
        metadata: {
          interestsOverlap: Math.random() * 100,
          skillsMatch: Math.random() * 100,
          locationProximity: Math.random() * 100
        },
        expiry: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)  // 7 days
      });
      return await match.save();
    }));

    res.json({ matches, msg: `${matches.length} matches generated` });
  } catch (error) {
    console.error('Generate matches error:', error);
    res.status(500).json({ msg: 'Server error generating matches', error: error.message });
  }
};

// Get matches for a user (CRUD: Read)
exports.getMatches = async (req, res) => {
  try {
    const { userId } = req.params;
    const { status } = req.query;
    const query = { $or: [{ learner: userId }, { tutor: userId }] };
    if (status) query.status = status;

    const matches = await Match.find(query)
      .populate('learner tutor', 'profile.name email')
      .sort({ matchedAt: -1 });

    res.json(matches);
  } catch (error) {
    console.error('Get matches error:', error);
    res.status(500).json({ msg: 'Server error fetching matches', error: error.message });
  }
};

// Accept a match (update status, potentially create session)
exports.acceptMatch = async (req, res) => {
  try {
    const { matchId } = req.params;
    const match = await Match.findById(matchId).populate('learner tutor');

    if (!match) {
      return res.status(404).json({ msg: 'Match not found' });
    }

    // Check if requester is part of the match
    const userId = req.user.id;
    if (match.learner.toString() !== userId && match.tutor.toString() !== userId) {
      return res.status(403).json({ msg: 'Access denied' });
    }

    match.status = 'accepted';
    await match.save();

    // Optional: Auto-create a session
    // const session = new Session({ ... }); await session.save();

    res.json({ msg: 'Match accepted', match });
  } catch (error) {
    console.error('Accept match error:', error);
    res.status(500).json({ msg: 'Server error accepting match', error: error.message });
  }
};

// Reject a match
exports.rejectMatch = async (req, res) => {
  try {
    const { matchId } = req.params;
    const match = await Match.findById(matchId);

    if (!match) {
      return res.status(404).json({ msg: 'Match not found' });
    }

    match.status = 'rejected';
    await match.save();

    res.json({ msg: 'Match rejected' });
  } catch (error) {
    console.error('Reject match error:', error);
    res.status(500).json({ msg: 'Server error rejecting match', error: error.message });
  }
};

// Delete/Expire match
exports.deleteMatch = async (req, res) => {
  try {
    const { matchId } = req.params;
    const match = await Match.findByIdAndDelete(matchId);

    if (!match) {
      return res.status(404).json({ msg: 'Match not found' });
    }

    res.json({ msg: 'Match deleted' });
  } catch (error) {
    console.error('Delete match error:', error);
    res.status(500).json({ msg: 'Server error deleting match', error: error.message });
  }
};

// Get recommendations (top matches)
exports.getRecommendations = async (req, res) => {
  try {
    const userId = req.user.id;
    const matches = await Match.find({ learner: userId, status: 'pending' })
      .sort({ matchScore: -1 })
      .limit(5)
      .populate('tutor', 'profile.name avatar bio');

    res.json({ recommendations: matches });
  } catch (error) {
    console.error('Get recommendations error:', error);
    res.status(500).json({ msg: 'Server error fetching recommendations', error: error.message });
  }
};
