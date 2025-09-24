const Progress = require('../models/Progress');
const User = require('../models/User');

// Update progress (e.g., after session completion: add XP, hours, check milestones)
exports.updateProgress = async (req, res) => {
  try {
    const { 
      userId, 
      sessionsCompleted = 1, 
      hours = 1, 
      xp = 50, 
      sessionType = 'normal' // 'normal' or 'live'
    } = req.body;
    
    let progress = await Progress.findOne({ user: userId });

    if (!progress) {
      progress = new Progress({ user: userId });
    }

    // Update session counts
    progress.sessionsCompleted += sessionsCompleted;
    if (sessionType === 'live') {
      progress.liveSessionsAttended += sessionsCompleted;
    } else {
      progress.normalSessionsCompleted += sessionsCompleted;
    }
    
    progress.totalHours += hours;
    progress.experiencePoints += xp;
    
    // Update streak
    const today = new Date();
    const lastActivity = progress.streak.lastActivity;
    
    if (lastActivity) {
      const daysDiff = Math.floor((today - lastActivity) / (1000 * 60 * 60 * 24));
      if (daysDiff === 1) {
        progress.streak.current += 1;
        if (progress.streak.current > progress.streak.longest) {
          progress.streak.longest = progress.streak.current;
        }
      } else if (daysDiff > 1) {
        progress.streak.current = 1;
      }
    } else {
      progress.streak.current = 1;
    }
    progress.streak.lastActivity = today;

    // Check and award badges
    const newBadges = progress.checkAndAwardBadges();
    
    // Update level after badge XP is added
    progress.currentLevel = Math.floor(progress.experiencePoints / 1000) + 1;

    // Add milestones
    if (progress.sessionsCompleted === 1) {
      progress.milestones.push({ 
        milestone: 'First session completed', 
        achievedAt: new Date() 
      });
    }
    if (progress.sessionsCompleted % 10 === 0) {
      progress.milestones.push({ 
        milestone: `${progress.sessionsCompleted} sessions completed`, 
        achievedAt: new Date() 
      });
    }
    if (progress.liveSessionsAttended % 5 === 0 && progress.liveSessionsAttended > 0) {
      progress.milestones.push({ 
        milestone: `${progress.liveSessionsAttended} live sessions attended`, 
        achievedAt: new Date() 
      });
    }

    await progress.save();

    res.json({ 
      msg: 'Progress updated', 
      progress,
      newBadges,
      badgesAwarded: newBadges.length
    });
  } catch (error) {
    console.error('Update progress error:', error);
    res.status(500).json({ msg: 'Server error updating progress', error: error.message });
  }
};

// Get user's progress (Read)
exports.getProgress = async (req, res) => {
  try {
    const { userId } = req.params;

    // Validate userId format
    if (!userId || !/^[0-9a-fA-F]{24}$/.test(userId)) {
      return res.status(400).json({ msg: 'Invalid user ID format' });
    }

    const progress = await Progress.findOne({ user: userId }).populate('user', 'profile.name');

    if (!progress) {
      return res.status(404).json({ msg: 'Progress not found' });
    }

    res.json(progress);
  } catch (error) {
    console.error('Get progress error:', error);
    res.status(500).json({ msg: 'Server error fetching progress', error: error.message });
  }
};

// Get leaderboard (top users by XP and sessions)
exports.getLeaderboard = async (req, res) => {
  try {
    const { limit = 10, sortBy = 'xp' } = req.query;
    
    let sortQuery = {};
    switch(sortBy) {
      case 'xp':
        sortQuery = { experiencePoints: -1, sessionsCompleted: -1 };
        break;
      case 'sessions':
        sortQuery = { sessionsCompleted: -1, experiencePoints: -1 };
        break;
      case 'hours':
        sortQuery = { totalHours: -1, experiencePoints: -1 };
        break;
      case 'level':
        sortQuery = { currentLevel: -1, experiencePoints: -1 };
        break;
      default:
        sortQuery = { experiencePoints: -1, sessionsCompleted: -1 };
    }

    const leaderboard = await Progress.find({})
      .sort(sortQuery)
      .limit(parseInt(limit))
      .populate('user', 'profile.name avatar email');

    // Assign ranks and calculate additional stats
    leaderboard.forEach((item, index) => {
      item.leaderboardRank = index + 1;
      
      // Add computed stats
      item._doc.stats = {
        badgeCount: item.badges.length,
        experienceBadges: item.badges.filter(b => b.category === 'experience').length,
        sessionBadges: item.badges.filter(b => b.category === 'session').length,
        achievementBadges: item.badges.filter(b => b.category === 'achievement').length,
        adminBadges: item.badges.filter(b => b.category === 'admin').length,
        totalSessions: item.sessionsCompleted,
        liveSessionsAttended: item.liveSessionsAttended,
        normalSessionsCompleted: item.normalSessionsCompleted,
        currentStreak: item.streak?.current || 0,
        longestStreak: item.streak?.longest || 0
      };
    });

    res.json({ 
      leaderboard,
      sortBy,
      total: leaderboard.length
    });
  } catch (error) {
    console.error('Get leaderboard error:', error);
    res.status(500).json({ msg: 'Server error fetching leaderboard', error: error.message });
  }
};

// Create progress (for new users)
exports.createProgress = async (req, res) => {
  try {
    const { userId } = req.body;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    let progress = await Progress.findOne({ user: userId });
    if (progress) {
      return res.status(400).json({ msg: 'Progress already exists' });
    }

    progress = new Progress({ user: userId });
    await progress.save();

    res.status(201).json(progress);
  } catch (error) {
    console.error('Create progress error:', error);
    res.status(500).json({ msg: 'Server error creating progress', error: error.message });
  }
};

// Update progress manually (admin or user for badges)
exports.updateProgressManually = async (req, res) => {
  try {
    const { progressId } = req.params;
    const updates = req.body;

    const progress = await Progress.findByIdAndUpdate(
      progressId,
      { $set: updates },
      { new: true, runValidators: true }
    ).populate('user');

    if (!progress) {
      return res.status(404).json({ msg: 'Progress not found' });
    }

    res.json(progress);
  } catch (error) {
    console.error('Manual update progress error:', error);
    res.status(500).json({ msg: 'Server error updating progress', error: error.message });
  }
};

// Delete progress (rare, for cleanup)
exports.deleteProgress = async (req, res) => {
  try {
    const { progressId } = req.params;
    const progress = await Progress.findByIdAndDelete(progressId);

    if (!progress) {
      return res.status(404).json({ msg: 'Progress not found' });
    }

    res.json({ msg: 'Progress deleted' });
  } catch (error) {
    console.error('Delete progress error:', error);
    res.status(500).json({ msg: 'Server error deleting progress', error: error.message });
  }
};

// Admin: Award badge to user
exports.awardBadgeToUser = async (req, res) => {
  try {
    const { userId, badgeData, adminId } = req.body;
    const progress = await Progress.findOne({ user: userId });

    if (!progress) {
      return res.status(404).json({ msg: 'User progress not found' });
    }

    // Check if badge already exists
    if (progress.badges.find(b => b.id === badgeData.id)) {
      return res.status(400).json({ msg: 'Badge already awarded to this user' });
    }

    // Create admin badge
    const adminBadge = {
      id: badgeData.id || `admin-${Date.now()}`,
      name: badgeData.name,
      description: badgeData.description,
      category: 'admin',
      icon: badgeData.icon || '👨‍💼',
      xpReward: badgeData.xpReward || 0,
      grantedBy: adminId
    };

    progress.badges.push(adminBadge);
    progress.experiencePoints += adminBadge.xpReward;
    progress.currentLevel = Math.floor(progress.experiencePoints / 1000) + 1;

    // Add milestone
    progress.milestones.push({
      milestone: `Admin badge awarded: ${adminBadge.name}`,
      achievedAt: new Date()
    });

    await progress.save();

    res.json({ 
      msg: 'Badge awarded successfully', 
      badge: adminBadge,
      newLevel: progress.currentLevel,
      newXP: progress.experiencePoints
    });
  } catch (error) {
    console.error('Award badge error:', error);
    res.status(500).json({ msg: 'Server error awarding badge', error: error.message });
  }
};

// Get badge definitions
exports.getBadgeDefinitions = async (req, res) => {
  try {
    const definitions = Progress.getBadgeDefinitions();
    res.json({ badgeDefinitions: definitions });
  } catch (error) {
    console.error('Get badge definitions error:', error);
    res.status(500).json({ msg: 'Server error fetching badge definitions', error: error.message });
  }
};

// Get user's badge statistics
exports.getUserBadgeStats = async (req, res) => {
  try {
    const { userId } = req.params;
    const progress = await Progress.findOne({ user: userId });

    if (!progress) {
      return res.status(404).json({ msg: 'Progress not found' });
    }

    const badgeStats = {
      total: progress.badges.length,
      byCategory: {
        experience: progress.badges.filter(b => b.category === 'experience').length,
        session: progress.badges.filter(b => b.category === 'session').length,
        achievement: progress.badges.filter(b => b.category === 'achievement').length,
        admin: progress.badges.filter(b => b.category === 'admin').length,
        course: progress.badges.filter(b => b.category === 'course').length
      },
      recentBadges: progress.badges
        .sort((a, b) => new Date(b.earnedAt) - new Date(a.earnedAt))
        .slice(0, 5),
      totalXpFromBadges: progress.badges.reduce((sum, badge) => sum + (badge.xpReward || 0), 0)
    };

    res.json({ badgeStats });
  } catch (error) {
    console.error('Get badge stats error:', error);
    res.status(500).json({ msg: 'Server error fetching badge stats', error: error.message });
  }
};
