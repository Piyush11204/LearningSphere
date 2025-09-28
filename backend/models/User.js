const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema({
  email: { 
    type: String, 
    required: true, 
    unique: true,
    lowercase: true,
    trim: true 
  },
  password: { 
    type: String, 
    required: true,
    minlength: 6 
  },
  role: { 
    type: String, 
    enum: ['learner', 'tutor', 'admin'], 
    default: 'learner' 
  },
  isTutor: { 
    type: Boolean, 
    default: false 
  },  // For switching between learner/tutor modes
  profile: {
    name: { 
      type: String, 
      required: true 
    },
    avatar: { 
      type: String,  // Cloudinary URL
      default: '' 
    },
    bio: { 
      type: String, 
      maxlength: 500 
    },
    interests: [{ 
      type: String 
    }],  // Array for smart matching
    skills: [{ 
      type: String 
    }],  // Tutor skills for matching
    location: { 
      type: String, 
      trim: true 
    },  // For location-based matching
    phone: { 
      type: String, 
      optional: true 
    }
  },
  // Exam tracking
  examHistory: [{

  // Practice Exam tracking
  practiceExamHistory: [{
    sessionId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'PracticeSession' 
    },
    score: { 
      type: Number, 
      required: true 
    },
    totalQuestions: { 
      type: Number, 
      required: true 
    },
    correctAnswers: { 
      type: Number, 
      required: true 
    },
    accuracy: {
      type: Number,
      required: true
    },
    xpEarned: {
      type: Number,
      default: 0
    },
    duration: { 
      type: Number, 
      required: true 
    }, // in minutes
    status: { 
      type: String, 
      enum: ['completed', 'expired'], 
      required: true 
    },
    completedAt: { 
      type: Date, 
      default: Date.now 
    }
  }],
  practiceExamStats: {
    totalSessions: { 
      type: Number, 
      default: 0 
    },
    totalQuestionsAnswered: { 
      type: Number, 
      default: 0 
    },
    totalCorrectAnswers: { 
      type: Number, 
      default: 0 
    },
    averageAccuracy: { 
      type: Number, 
      default: 0 
    },
    totalXpEarned: { 
      type: Number, 
      default: 0 
    },
    currentStreak: {
      type: Number,
      default: 0
    },
    longestStreak: {
      type: Number,
      default: 0
    }
  },
  // Sectional Test tracking
  sectionalTestHistory: [{
    sessionId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'PracticeSession' 
    },
    sections: [{
      sectionId: {
        type: String,
        required: true
      },
      difficulty: {
        type: String,
        required: true
      },
      correct: {
        type: Number,
        required: true
      },
      total: {
        type: Number,
        required: true
      },
      accuracy: {
        type: Number,
        required: true
      },
      passed: {
        type: Boolean,
        required: true
      },
      completed: {
        type: Boolean,
        required: true
      }
    }],
    totalSections: {
      type: Number,
      required: true
    },
    completedSections: {
      type: Number,
      required: true
    },
    passedSections: {
      type: Number,
      required: true
    },
    xpEarned: {
      type: Number,
      default: 0
    },
    duration: { 
      type: Number, 
      required: true 
    }, // in minutes
    status: { 
      type: String, 
      enum: ['completed', 'expired'], 
      required: true 
    },
    completedAt: { 
      type: Date, 
      default: Date.now 
    }
  }],
  sectionalTestStats: {
    totalSessions: { 
      type: Number, 
      default: 0 
    },
    totalSectionsCompleted: { 
      type: Number, 
      default: 0 
    },
    totalSectionsPassed: { 
      type: Number, 
      default: 0 
    },
    averageAccuracy: { 
      type: Number, 
      default: 0 
    },
    totalXpEarned: { 
      type: Number, 
      default: 0 
    },
    currentStreak: {
      type: Number,
      default: 0
    },
    longestStreak: {
      type: Number,
      default: 0
    },
    difficultyStats: {
      veryEasy: {
        completed: { type: Number, default: 0 },
        passed: { type: Number, default: 0 },
        accuracy: { type: Number, default: 0 }
      },
      easy: {
        completed: { type: Number, default: 0 },
        passed: { type: Number, default: 0 },
        accuracy: { type: Number, default: 0 }
      },
      moderate: {
        completed: { type: Number, default: 0 },
        passed: { type: Number, default: 0 },
        accuracy: { type: Number, default: 0 }
      },
      difficult: {
        completed: { type: Number, default: 0 },
        passed: { type: Number, default: 0 },
        accuracy: { type: Number, default: 0 }
      }
    }
  },
  // Badges and achievements
  badges: [{
    name: {
      type: String,
      required: true
    },
    description: {
      type: String,
      required: true
    },
    icon: {
      type: String,
      required: true
    },
    earnedAt: {
      type: Date,
      default: Date.now
    },
    category: {
      type: String,
      enum: ['practice', 'exam', 'streak', 'achievement'],
      default: 'practice'
    }
  }],
  experiencePoints: {
    total: {
      type: Number,
      default: 0
    },
    fromPractice: {
      type: Number,
      default: 0
    },
    fromExams: {
      type: Number,
      default: 0
    },
    level: {
      type: Number,
      default: 1
    }
  },
    examId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Exam' 
    },
    score: { 
      type: Number, 
      required: true 
    },
    totalQuestions: { 
      type: Number, 
      required: true 
    },
    correctAnswers: { 
      type: Number, 
      required: true 
    },
    percentage: {
      type: Number,
      required: true
    },
    duration: { 
      type: Number, 
      required: true 
    }, // in minutes
    status: { 
      type: String, 
      enum: ['passed', 'failed'], 
      required: true 
    },
    submittedAt: { 
      type: Date, 
      default: Date.now 
    },
    timeTaken: {
      type: Number // actual time taken in seconds
    }
  }],
  examStats: {
    totalExams: { 
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
    averageScore: { 
      type: Number, 
      default: 0 
    },
    averagePercentage: {
      type: Number,
      default: 0
    },
    bestScore: { 
      type: Number, 
      default: 0 
    },
    totalExamTime: { 
      type: Number, 
      default: 0 
    }, // in minutes
    examStreak: {
      current: { type: Number, default: 0 },
      longest: { type: Number, default: 0 }
    }
  },
  isVerified: { 
    type: Boolean, 
    default: false 
  },  // For email verification
  resetPasswordToken: String,
  resetPasswordExpire: Date
}, { 
  timestamps: true 
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Generate JWT token method (can be moved to auth utils if needed)
userSchema.methods.getJWTToken = function() {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// Update sectional test statistics
userSchema.methods.updateSectionalTestStats = function() {
  const history = this.sectionalTestHistory;
  if (!history || history.length === 0) return;

  this.sectionalTestStats.totalSessions = history.length;
  this.sectionalTestStats.totalSectionsCompleted = history.reduce((sum, session) => sum + (session.completedSections || 0), 0);
  this.sectionalTestStats.totalSectionsPassed = history.reduce((sum, session) => sum + (session.passedSections || 0), 0);
  this.sectionalTestStats.totalXpEarned = history.reduce((sum, session) => sum + (session.xpEarned || 0), 0);
  
  // Calculate average accuracy across all sections
  const totalAccuracy = history.reduce((sum, session) => {
    if (!session.sections || session.sections.length === 0) return sum;
    return sum + session.sections.reduce((sectionSum, section) => sectionSum + (section.accuracy || 0), 0) / session.sections.length;
  }, 0);
  this.sectionalTestStats.averageAccuracy = history.length > 0 ? Math.round((totalAccuracy / history.length) * 100) / 100 : 0;
  
  // Calculate current streak (consecutive sessions with at least one section passed)
  let currentStreak = 0;
  for (let i = history.length - 1; i >= 0; i--) {
    if ((history[i].passedSections || 0) > 0) {
      currentStreak++;
    } else {
      break;
    }
  }
  
  this.sectionalTestStats.currentStreak = currentStreak;
  if (currentStreak > (this.sectionalTestStats.longestStreak || 0)) {
    this.sectionalTestStats.longestStreak = currentStreak;
  }

  // Update difficulty-specific stats
  const difficultyStats = {
    veryEasy: { completed: 0, passed: 0, accuracy: 0 },
    easy: { completed: 0, passed: 0, accuracy: 0 },
    moderate: { completed: 0, passed: 0, accuracy: 0 },
    difficult: { completed: 0, passed: 0, accuracy: 0 }
  };

  history.forEach(session => {
    if (!session.sections) return;
    session.sections.forEach(section => {
      if (!section || !section.completed) return;
      const diff = (section.difficulty || 'easy').toLowerCase();
      if (difficultyStats[diff]) {
        difficultyStats[diff].completed++;
        if (section.passed) {
          difficultyStats[diff].passed++;
        }
        difficultyStats[diff].accuracy += section.accuracy || 0;
      }
    });
  });

  // Calculate average accuracy for each difficulty
  Object.keys(difficultyStats).forEach(diff => {
    if (difficultyStats[diff].completed > 0) {
      difficultyStats[diff].accuracy = Math.round((difficultyStats[diff].accuracy / difficultyStats[diff].completed) * 100) / 100;
    }
  });

  this.sectionalTestStats.difficultyStats = difficultyStats;
};

// Award badges based on sectional test milestones
userSchema.methods.awardSectionalTestBadges = function() {
  if (!this.sectionalTestStats) return [];
  
  // Ensure badges array exists
  if (!this.badges) {
    this.badges = [];
  }
  
  const totalSessions = this.sectionalTestStats.totalSessions || 0;
  const totalSectionsPassed = this.sectionalTestStats.totalSectionsPassed || 0;
  const badgesToAward = [];

  // First Sectional Test Badge
  if (totalSessions >= 1 && !this.badges.some(badge => badge.name === 'Sectional Pioneer')) {
    badgesToAward.push({
      name: 'Sectional Pioneer',
      description: 'Completed your first sectional test',
      icon: '🎯',
      category: 'practice'
    });
  }

  // Section Master Badges
  if (totalSectionsPassed >= 10 && !this.badges.some(badge => badge.name === 'Section Master I')) {
    badgesToAward.push({
      name: 'Section Master I',
      description: 'Passed 10 sectional test sections',
      icon: '⚔️',
      category: 'practice'
    });
  }

  if (totalSectionsPassed >= 25 && !this.badges.some(badge => badge.name === 'Section Master II')) {
    badgesToAward.push({
      name: 'Section Master II',
      description: 'Passed 25 sectional test sections',
      icon: '🛡️',
      category: 'practice'
    });
  }

  if (totalSectionsPassed >= 50 && !this.badges.some(badge => badge.name === 'Section Master III')) {
    badgesToAward.push({
      name: 'Section Master III',
      description: 'Passed 50 sectional test sections',
      icon: '👑',
      category: 'practice'
    });
  }

  if (totalSectionsPassed >= 100 && !this.badges.some(badge => badge.name === 'Sectional Legend')) {
    badgesToAward.push({
      name: 'Sectional Legend',
      description: 'Passed 100 sectional test sections',
      icon: '🏆',
      category: 'practice'
    });
  }

  // Difficulty-specific badges
  const difficultyStats = this.sectionalTestStats.difficultyStats || {};
  
  if ((difficultyStats.difficult?.passed || 0) >= 5 && !this.badges.some(badge => badge.name === 'Difficulty Conqueror')) {
    badgesToAward.push({
      name: 'Difficulty Conqueror',
      description: 'Passed 5 difficult sections',
      icon: '🔥',
      category: 'practice'
    });
  }

  if ((difficultyStats.veryEasy?.passed || 0) >= 10 && (difficultyStats.easy?.passed || 0) >= 10 && 
      (difficultyStats.moderate?.passed || 0) >= 10 && (difficultyStats.difficult?.passed || 0) >= 10 &&
      !this.badges.some(badge => badge.name === 'Well-Rounded Scholar')) {
    badgesToAward.push({
      name: 'Well-Rounded Scholar',
      description: 'Passed 10 sections of each difficulty level',
      icon: '🎓',
      category: 'practice'
    });
  }

  // Add new badges
  this.badges.push(...badgesToAward);
  return badgesToAward;
};

// Calculate experience points for sectional test session
userSchema.methods.calculateSectionalTestXP = function(session) {
  let baseXP = 0;
  
  // XP for each completed section (50 XP per section as implemented in controller)
  baseXP += session.completedSections * 50;
  
  // Bonus XP for passing sections
  baseXP += session.passedSections * 25;
  
  // Bonus for completing all selected sections
  if (session.completedSections === session.totalSections) {
    baseXP += 100;
  }
  
  // Bonus for streaks
  if (this.sectionalTestStats.currentStreak > 0) {
    baseXP += Math.min(this.sectionalTestStats.currentStreak * 10, 50);
  }
  
  return baseXP;
};

// Update experience points
userSchema.methods.updateExperiencePoints = function(xpAmount, source) {
  if (!this.experiencePoints) {
    this.experiencePoints = {
      total: 0,
      fromPractice: 0,
      fromExams: 0,
      level: 1
    };
  }

  this.experiencePoints.total += xpAmount;
  
  if (source === 'practice') {
    this.experiencePoints.fromPractice += xpAmount;
  } else if (source === 'exam') {
    this.experiencePoints.fromExams += xpAmount;
  }

  // Calculate new level (every 1000 XP = 1 level)
  const newLevel = Math.floor(this.experiencePoints.total / 1000) + 1;
  this.experiencePoints.level = newLevel;
};

module.exports = mongoose.model('User', userSchema);
