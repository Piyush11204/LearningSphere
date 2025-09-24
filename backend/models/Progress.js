const mongoose = require('mongoose');

const badgeSchema = new mongoose.Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  description: { type: String, required: true },
  category: { 
    type: String, 
    enum: ['experience', 'session', 'course', 'admin', 'achievement', 'exam'],
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
  // Exam tracking
  examsCompleted: {
    type: Number,
    default: 0
  },
  examsPassed: {
    type: Number,
    default: 0
  },
  examsFailed: {
    type: Number,
    default: 0
  },
  examAverageScore: {
    type: Number,
    default: 0
  },
  examBestScore: {
    type: Number,
    default: 0
  },
  examPassStreak: {
    current: { type: Number, default: 0 },
    longest: { type: Number, default: 0 }
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
    },

    // Exam-based badges
    'first-exam': {
      id: 'first-exam',
      name: 'First Exam',
      description: 'Completed your first exam! Great start!',
      category: 'exam',
      icon: '📝',
      examThreshold: 1,
      xpReward: 50
    },
    'exam-rookie': {
      id: 'exam-rookie',
      name: 'Exam Rookie',
      description: 'Completed 5 exams. Building knowledge!',
      category: 'exam',
      icon: '📚',
      examThreshold: 5,
      xpReward: 100
    },
    'exam-expert': {
      id: 'exam-expert',
      name: 'Exam Expert',
      description: 'Completed 25 exams. True dedication!',
      category: 'exam',
      icon: '🎯',
      examThreshold: 25,
      xpReward: 250
    },
    'exam-master': {
      id: 'exam-master',
      name: 'Exam Master',
      description: 'Completed 50 exams. Exceptional commitment!',
      category: 'exam',
      icon: '🏅',
      examThreshold: 50,
      xpReward: 500
    },
    'first-pass': {
      id: 'first-pass',
      name: 'First Success',
      description: 'Passed your first exam! Congratulations!',
      category: 'exam',
      icon: '✅',
      examPassThreshold: 1,
      xpReward: 75
    },
    'perfect-score': {
      id: 'perfect-score',
      name: 'Perfect Score',
      description: 'Achieved a 100% score! Flawless performance!',
      category: 'exam',
      icon: '💯',
      perfectScoreRequired: true,
      xpReward: 200
    },
    'high-achiever': {
      id: 'high-achiever',
      name: 'High Achiever',
      description: 'Maintained 90%+ average across 10 exams!',
      category: 'exam',
      icon: '⭐',
      highAverageThreshold: 90,
      minExamsForAverage: 10,
      xpReward: 300
    },
    'streak-master': {
      id: 'streak-master',
      name: 'Streak Master',
      description: 'Passed 10 exams in a row! Unstoppable!',
      category: 'exam',
      icon: '🔥',
      passStreakThreshold: 10,
      xpReward: 400
    },
    'speed-demon': {
      id: 'speed-demon',
      name: 'Speed Demon',
      description: 'Completed an exam in under 50% of allotted time!',
      category: 'exam',
      icon: '⚡',
      speedThreshold: 0.5, // 50% of time
      xpReward: 150
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

    // Check exam badges
    if (badgeData.category === 'exam') {
      let shouldAward = false;
      
      if (badgeData.examThreshold && this.examsCompleted >= badgeData.examThreshold) {
        shouldAward = true;
      }
      if (badgeData.examPassThreshold && this.examsPassed >= badgeData.examPassThreshold) {
        shouldAward = true;
      }
      if (badgeData.passStreakThreshold && this.examPassStreak.current >= badgeData.passStreakThreshold) {
        shouldAward = true;
      }
      if (badgeData.highAverageThreshold && badgeData.minExamsForAverage && 
          this.examsCompleted >= badgeData.minExamsForAverage && 
          this.examAverageScore >= badgeData.highAverageThreshold) {
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

// Method to update exam progress
progressSchema.methods.updateExamProgress = function(examResult) {
  this.examsCompleted += 1;
  
  if (examResult.status === 'passed') {
    this.examsPassed += 1;
    this.examPassStreak.current += 1;
    if (this.examPassStreak.current > this.examPassStreak.longest) {
      this.examPassStreak.longest = this.examPassStreak.current;
    }
  } else {
    this.examsFailed += 1;
    this.examPassStreak.current = 0; // Reset streak on failure
  }
  
  // Update average score
  if (this.examsCompleted === 1) {
    this.examAverageScore = examResult.percentage;
  } else {
    this.examAverageScore = ((this.examAverageScore * (this.examsCompleted - 1)) + examResult.percentage) / this.examsCompleted;
  }
  
  // Update best score
  if (examResult.score > this.examBestScore) {
    this.examBestScore = examResult.score;
  }
  
  // Award base XP for taking exam
  let xpAwarded = 20; // Base XP for taking an exam
  
  // Bonus XP for passing
  if (examResult.status === 'passed') {
    xpAwarded += 30; // Pass bonus
    
    // Performance bonuses
    if (examResult.percentage >= 90) {
      xpAwarded += 50; // Excellent performance
    } else if (examResult.percentage >= 80) {
      xpAwarded += 30; // Great performance
    } else if (examResult.percentage >= 70) {
      xpAwarded += 15; // Good performance
    }
  }
  
  // Speed bonus (if completed in less than 75% of time)
  if (examResult.timeTaken && examResult.duration) {
    const timeRatio = examResult.timeTaken / (examResult.duration * 60);
    if (timeRatio < 0.75) {
      xpAwarded += 25; // Speed bonus
    }
  }
  
  this.experiencePoints += xpAwarded;
  this.currentLevel = Math.floor(this.experiencePoints / 1000) + 1;
  
  return xpAwarded;
};

module.exports = mongoose.model('Progress', progressSchema);
