const mongoose = require('mongoose');

const badgeSchema = new mongoose.Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  description: { type: String, required: true },
  category: { 
    type: String, 
    enum: ['experience', 'session', 'course', 'admin', 'achievement'],
    required: true 
  },
  icon: { type: String, default: '🏆' },
  xpReward: { type: Number, default: 0 },
  earnedAt: { type: Date, default: Date.now },
  grantedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' // For admin-granted badges
  }
});

const progressSchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  // Session tracking
  sessionsCompleted: { 
    type: Number, 
    default: 0 
  },
  liveSessionsAttended: {
    type: Number,
    default: 0
  },
  normalSessionsCompleted: {
    type: Number,
    default: 0
  },
  totalHours: { 
    type: Number, 
    default: 0 
  },
  // Experience system
  currentLevel: { 
    type: Number, 
    default: 1 
  },
  experiencePoints: { 
    type: Number, 
    default: 0 
  },
  // Enhanced badge system
  badges: [badgeSchema],
  // Course tracking (for future)
  coursesCompleted: {
    type: Number,
    default: 0
  },
  courseBadges: [{
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
    badgeId: String,
    earnedAt: { type: Date, default: Date.now }
  }],
  // Milestones
  milestones: [{ 
    milestone: String,  // e.g., '10 sessions completed'
    achievedAt: Date 
  }],
  // Stats
  streak: {
    current: { type: Number, default: 0 },
    longest: { type: Number, default: 0 },
    lastActivity: Date
  },
  leaderboardRank: Number  // Computed on query
}, { 
  timestamps: true 
});

// Index for leaderboard queries
progressSchema.index({ experiencePoints: -1, user: 1 });
progressSchema.index({ sessionsCompleted: -1, user: 1 });
progressSchema.index({ 'badges.category': 1, user: 1 });

// Static method to get badge definitions
progressSchema.statics.getBadgeDefinitions = function() {
  return {
    // Experience-based badges
    'noobie': {
      id: 'noobie',
      name: 'Noobie',
      description: 'Welcome to Growora! Your learning journey begins.',
      category: 'experience',
      icon: '🌱',
      xpThreshold: 0,
      xpReward: 50
    },
    'early-bird': {
      id: 'early-bird',
      name: 'Early Bird',
      description: 'You\'re making great progress! Keep it up!',
      category: 'experience',
      icon: '🐦',
      xpThreshold: 500,
      xpReward: 100
    },
    'expert': {
      id: 'expert',
      name: 'Expert',
      description: 'You\'ve mastered the fundamentals. Impressive!',
      category: 'experience',
      icon: '🎓',
      xpThreshold: 2000,
      xpReward: 200
    },
    'master': {
      id: 'master',
      name: 'Master',
      description: 'True mastery achieved. You\'re an inspiration!',
      category: 'experience',
      icon: '👑',
      xpThreshold: 5000,
      xpReward: 500
    },
    
    // Session-based badges
    'first-session': {
      id: 'first-session',
      name: 'First Steps',
      description: 'Congratulations on completing your first session!',
      category: 'session',
      icon: '🎯',
      xpReward: 25
    },
    'session-warrior': {
      id: 'session-warrior',
      name: 'Session Warrior',
      description: 'Completed 10 sessions. You\'re on fire!',
      category: 'session',
      icon: '⚡',
      sessionThreshold: 10,
      xpReward: 150
    },
    'session-champion': {
      id: 'session-champion',
      name: 'Session Champion',
      description: 'Completed 50 sessions. Truly dedicated!',
      category: 'session',
      icon: '🏆',
      sessionThreshold: 50,
      xpReward: 300
    },
    'live-enthusiast': {
      id: 'live-enthusiast',
      name: 'Live Enthusiast',
      description: 'Attended 5 live sessions. Love the interaction!',
      category: 'session',
      icon: '📺',
      liveSessionThreshold: 5,
      xpReward: 100
    },
    
    // Achievement badges
    'consistent-learner': {
      id: 'consistent-learner',
      name: 'Consistent Learner',
      description: 'Maintained a 7-day learning streak!',
      category: 'achievement',
      icon: '🔥',
      streakThreshold: 7,
      xpReward: 200
    },
    'time-master': {
      id: 'time-master',
      name: 'Time Master',
      description: 'Completed 100+ hours of learning. Incredible!',
      category: 'achievement',
      icon: '⏰',
      hoursThreshold: 100,
      xpReward: 400
    }
  };
};

// Method to check and award badges
progressSchema.methods.checkAndAwardBadges = function() {
  const badgeDefinitions = this.constructor.getBadgeDefinitions();
  const newBadges = [];
  let totalXpAwarded = 0;

  // Check experience badges
  for (const [badgeId, badgeData] of Object.entries(badgeDefinitions)) {
    if (badgeData.category === 'experience' && badgeData.xpThreshold !== undefined) {
      if (this.experiencePoints >= badgeData.xpThreshold && 
          !this.badges.find(b => b.id === badgeId)) {
        newBadges.push({
          id: badgeId,
          name: badgeData.name,
          description: badgeData.description,
          category: badgeData.category,
          icon: badgeData.icon,
          xpReward: badgeData.xpReward
        });
        totalXpAwarded += badgeData.xpReward;
      }
    }
    
    // Check session badges
    if (badgeData.category === 'session') {
      let shouldAward = false;
      
      if (badgeData.sessionThreshold && this.sessionsCompleted >= badgeData.sessionThreshold) {
        shouldAward = true;
      }
      if (badgeData.liveSessionThreshold && this.liveSessionsAttended >= badgeData.liveSessionThreshold) {
        shouldAward = true;
      }
      if (badgeId === 'first-session' && this.sessionsCompleted >= 1) {
        shouldAward = true;
      }
      
      if (shouldAward && !this.badges.find(b => b.id === badgeId)) {
        newBadges.push({
          id: badgeId,
          name: badgeData.name,
          description: badgeData.description,
          category: badgeData.category,
          icon: badgeData.icon,
          xpReward: badgeData.xpReward
        });
        totalXpAwarded += badgeData.xpReward;
      }
    }
    
    // Check achievement badges
    if (badgeData.category === 'achievement') {
      let shouldAward = false;
      
      if (badgeData.streakThreshold && this.streak.current >= badgeData.streakThreshold) {
        shouldAward = true;
      }
      if (badgeData.hoursThreshold && this.totalHours >= badgeData.hoursThreshold) {
        shouldAward = true;
      }
      
      if (shouldAward && !this.badges.find(b => b.id === badgeId)) {
        newBadges.push({
          id: badgeId,
          name: badgeData.name,
          description: badgeData.description,
          category: badgeData.category,
          icon: badgeData.icon,
          xpReward: badgeData.xpReward
        });
        totalXpAwarded += badgeData.xpReward;
      }
    }
  }

  // Add new badges
  if (newBadges.length > 0) {
    this.badges.push(...newBadges);
    this.experiencePoints += totalXpAwarded;
    this.currentLevel = Math.floor(this.experiencePoints / 1000) + 1;
  }

  return newBadges;
};

module.exports = mongoose.model('Progress', progressSchema);
