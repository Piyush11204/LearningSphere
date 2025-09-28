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

// Update practice exam statistics
userSchema.methods.updatePracticeExamStats = function() {
  const history = this.practiceExamHistory;
  if (history.length === 0) return;

  this.practiceExamStats.totalSessions = history.length;
  this.practiceExamStats.totalQuestionsAnswered = history.reduce((sum, session) => sum + session.totalQuestions, 0);
  this.practiceExamStats.totalCorrectAnswers = history.reduce((sum, session) => sum + session.correctAnswers, 0);
  this.practiceExamStats.totalXpEarned = history.reduce((sum, session) => sum + session.xpEarned, 0);
  
  // Calculate average accuracy
  const totalAccuracy = history.reduce((sum, session) => sum + session.accuracy, 0);
  this.practiceExamStats.averageAccuracy = Math.round((totalAccuracy / history.length) * 100) / 100;
  
  // Calculate current streak (consecutive sessions with >50% accuracy)
  let currentStreak = 0;
  for (let i = history.length - 1; i >= 0; i--) {
    if (history[i].accuracy >= 50) {
      currentStreak++;
    } else {
      break;
    }
  }
  
  this.practiceExamStats.currentStreak = currentStreak;
  if (currentStreak > this.practiceExamStats.longestStreak) {
    this.practiceExamStats.longestStreak = currentStreak;
  }
};

// Award badges based on practice exam milestones
userSchema.methods.awardPracticeBadges = function() {
  const totalSessions = this.practiceExamStats.totalSessions;
  const badgesToAward = [];

  // First Practice Exam Badge
  if (totalSessions >= 1 && !this.badges.some(badge => badge.name === 'First Practice')) {
    badgesToAward.push({
      name: 'First Practice',
      description: 'Completed your first practice exam',
      icon: '🎯',
      category: 'practice'
    });
  }

  // Practice Warrior Badges
  if (totalSessions >= 10 && !this.badges.some(badge => badge.name === 'Practice Warrior I')) {
    badgesToAward.push({
      name: 'Practice Warrior I',
      description: 'Completed 10 practice exams',
      icon: '⚔️',
      category: 'practice'
    });
  }

  if (totalSessions >= 25 && !this.badges.some(badge => badge.name === 'Practice Warrior II')) {
    badgesToAward.push({
      name: 'Practice Warrior II',
      description: 'Completed 25 practice exams',
      icon: '🛡️',
      category: 'practice'
    });
  }

  if (totalSessions >= 50 && !this.badges.some(badge => badge.name === 'Practice Warrior III')) {
    badgesToAward.push({
      name: 'Practice Warrior III',
      description: 'Completed 50 practice exams',
      icon: '👑',
      category: 'practice'
    });
  }

  if (totalSessions >= 100 && !this.badges.some(badge => badge.name === 'Practice Legend')) {
    badgesToAward.push({
      name: 'Practice Legend',
      description: 'Completed 100 practice exams',
      icon: '🏆',
      category: 'practice'
    });
  }

  // Add new badges
  this.badges.push(...badgesToAward);
  return badgesToAward;
};

// Calculate experience points for practice session
userSchema.methods.calculatePracticeXP = function(session) {
  let baseXP = 10; // Base XP for attempting
  
  // XP based on accuracy
  if (session.accuracy >= 90) baseXP += 50;
  else if (session.accuracy >= 80) baseXP += 40;
  else if (session.accuracy >= 70) baseXP += 30;
  else if (session.accuracy >= 60) baseXP += 20;
  else if (session.accuracy >= 50) baseXP += 10;
  
  // XP based on questions answered
  baseXP += Math.floor(session.totalQuestions / 5) * 5;
  
  // Bonus for streaks
  if (this.practiceExamStats.currentStreak > 0) {
    baseXP += Math.min(this.practiceExamStats.currentStreak * 2, 20);
  }
  
  return baseXP;
};

// Update experience points and level
userSchema.methods.updateExperiencePoints = function(xpGained, source = 'practice') {
  this.experiencePoints.total += xpGained;
  
  if (source === 'practice') {
    this.experiencePoints.fromPractice += xpGained;
  } else if (source === 'exam') {
    this.experiencePoints.fromExams += xpGained;
  }
  
  // Calculate new level (every 1000 XP = 1 level)
  const newLevel = Math.floor(this.experiencePoints.total / 1000) + 1;
  if (newLevel > this.experiencePoints.level) {
    this.experiencePoints.level = newLevel;
    // Could add level up badges here
  }
};

module.exports = mongoose.model('User', userSchema);
