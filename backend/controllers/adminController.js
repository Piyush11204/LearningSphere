const User = require('../models/User');
const Session = require('../models/Session');
const Match = require('../models/Match');
const Review = require('../models/Review');
const Progress = require('../models/Progress');

// Get all users (admin dashboard)
exports.getAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const users = await User.find({})
      .select('-password')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await User.countDocuments();
    res.json({
      users,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      total
    });
  } catch (error) {
    console.error('Admin get users error:', error);
    res.status(500).json({ msg: 'Server error fetching users', error: error.message });
  }
};

// Ban/unban user (moderation)
exports.toggleBanUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    user.isBanned = !user.isBanned;  // Assume add isBanned to User model
    await user.save();

    res.json({ msg: `User ${user.isBanned ? 'banned' : 'unbanned'}`, user });
  } catch (error) {
    console.error('Toggle ban error:', error);
    res.status(500).json({ msg: 'Server error toggling ban', error: error.message });
  }
};

// Change user role
exports.changeRole = async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;
    const user = await User.findByIdAndUpdate(
      userId,
      { role },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    res.json({ msg: 'Role updated', user });
  } catch (error) {
    console.error('Change role error:', error);
    res.status(500).json({ msg: 'Server error changing role', error: error.message });
  }
};

// Moderate session (approve/delete)
exports.moderateSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { action } = req.body;  // 'approve' or 'delete'
    let session = await Session.findById(sessionId);

    if (!session) {
      return res.status(404).json({ msg: 'Session not found' });
    }

    if (action === 'delete') {
      await Session.findByIdAndDelete(sessionId);
      res.json({ msg: 'Session deleted' });
    } else {
      session.isApproved = true;  // Assume add field
      session = await session.save();
      res.json({ msg: 'Session approved', session });
    }
  } catch (error) {
    console.error('Moderate session error:', error);
    res.status(500).json({ msg: 'Server error moderating session', error: error.message });
  }
};

// Get analytics (users count, active sessions, matching success rate)
exports.getAnalytics = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeSessions = await Session.countDocuments({ status: 'live' });
    const totalMatches = await Match.countDocuments({ status: 'accepted' });
    const matchingSuccessRate = totalMatches / (await Match.countDocuments()) * 100 || 0;

    res.json({
      totalUsers,
      activeSessions,
      totalMatches,
      matchingSuccessRate: Math.round(matchingSuccessRate)
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({ msg: 'Server error fetching analytics', error: error.message });
  }
};

// Delete review (admin)
exports.deleteReviewAdmin = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const review = await Review.findByIdAndDelete(reviewId);

    if (!review) {
      return res.status(404).json({ msg: 'Review not found' });
    }

    res.json({ msg: 'Review deleted' });
  } catch (error) {
    console.error('Admin delete review error:', error);
    res.status(500).json({ msg: 'Server error deleting review', error: error.message });
  }
};
