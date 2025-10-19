const mongoose = require('mongoose');

const adaptiveExamSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  sessionId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'abandoned', 'time_expired'],
    default: 'active'
  },
  duration: {
    type: Number, // Duration in minutes
    default: 20
  },
  startTime: {
    type: Date,
    default: Date.now
  },
  endTime: {
    type: Date
  },
  timeExpired: {
    type: Boolean,
    default: false
  },
  // User's ability tracking
  initialAbility: {
    type: Number,
    default: 0.5 // Starting ability level
  },
  currentAbility: {
    type: Number,
    default: 0.5
  },
  finalAbility: {
    type: Number
  },
  // Question and answer tracking
  totalQuestions: {
    type: Number,
    default: 0
  },
  correctAnswers: {
    type: Number,
    default: 0
  },
  wrongAnswers: {
    type: Number,
    default: 0
  },
  accuracy: {
    type: Number,
    default: 0
  },
  // Time tracking
  totalTimeSeconds: {
    type: Number,
    default: 0
  },
  averageTimePerQuestion: {
    type: Number,
    default: 0
  },
  fastestAnswer: {
    type: Number
  },
  slowestAnswer: {
    type: Number
  },
  // Difficulty breakdown
  difficultyBreakdown: {
    veryEasy: {
      attempted: { type: Number, default: 0 },
      correct: { type: Number, default: 0 },
      accuracy: { type: Number, default: 0 }
    },
    easy: {
      attempted: { type: Number, default: 0 },
      correct: { type: Number, default: 0 },
      accuracy: { type: Number, default: 0 }
    },
    moderate: {
      attempted: { type: Number, default: 0 },
      correct: { type: Number, default: 0 },
      accuracy: { type: Number, default: 0 }
    },
    difficult: {
      attempted: { type: Number, default: 0 },
      correct: { type: Number, default: 0 },
      accuracy: { type: Number, default: 0 }
    }
  },
  // Response history
  responses: [{
    questionId: String,
    question: String,
    options: {
      a: String,
      b: String,
      c: String,
      d: String
    },
    difficulty: String,
    difficultyNumeric: Number,
    userAnswer: mongoose.Schema.Types.Mixed, // Can be string or number
    correctAnswer: mongoose.Schema.Types.Mixed,
    isCorrect: Boolean,
    timeSpent: Number,
    abilityBefore: Number,
    abilityAfter: Number,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  // Gamification
  xpEarned: {
    type: Number,
    default: 0
  },
  badgesEarned: [{
    type: String
  }],
  // Metadata
  examNumber: {
    type: Number,
    default: 1
  }
}, {
  timestamps: true
});

// Indexes for performance
adaptiveExamSchema.index({ user: 1, status: 1 });
adaptiveExamSchema.index({ user: 1, createdAt: -1 });
adaptiveExamSchema.index({ sessionId: 1 });

// Calculate accuracy before saving
adaptiveExamSchema.pre('save', function(next) {
  if (this.totalQuestions > 0) {
    this.accuracy = (this.correctAnswers / this.totalQuestions) * 100;
  }
  
  if (this.status === 'completed' && !this.endTime) {
    this.endTime = new Date();
  }
  
  next();
});

// Method to add a response
adaptiveExamSchema.methods.addResponse = function(responseData) {
  this.responses.push(responseData);
  this.totalQuestions = this.responses.length;
  this.correctAnswers = this.responses.filter(r => r.isCorrect).length;
  this.wrongAnswers = this.totalQuestions - this.correctAnswers;
  this.currentAbility = responseData.abilityAfter;
  
  // Update time statistics
  const times = this.responses.map(r => r.timeSpent);
  this.totalTimeSeconds = times.reduce((sum, time) => sum + time, 0);
  this.averageTimePerQuestion = this.totalTimeSeconds / this.totalQuestions;
  this.fastestAnswer = Math.min(...times);
  this.slowestAnswer = Math.max(...times);
  
  // Update difficulty breakdown
  const difficultyMap = {
    0: 'veryEasy',
    1: 'easy',
    2: 'moderate',
    3: 'difficult'
  };
  
  const diffKey = difficultyMap[responseData.difficultyNumeric];
  if (diffKey && this.difficultyBreakdown[diffKey]) {
    this.difficultyBreakdown[diffKey].attempted += 1;
    if (responseData.isCorrect) {
      this.difficultyBreakdown[diffKey].correct += 1;
    }
    if (this.difficultyBreakdown[diffKey].attempted > 0) {
      this.difficultyBreakdown[diffKey].accuracy = 
        (this.difficultyBreakdown[diffKey].correct / this.difficultyBreakdown[diffKey].attempted) * 100;
    }
  }
  
  return this.save();
};

// Method to complete the exam
adaptiveExamSchema.methods.completeExam = function(finalAbility) {
  this.status = 'completed';
  this.endTime = new Date();
  this.finalAbility = finalAbility;
  return this.save();
};

// Static method to get user's last ability
adaptiveExamSchema.statics.getLastUserAbility = async function(userId) {
  const lastExam = await this.findOne({ 
    user: userId, 
    status: 'completed' 
  }).sort({ createdAt: -1 });
  
  return lastExam ? lastExam.finalAbility : 0.5; // Default starting ability
};

// Static method to get user's exam count
adaptiveExamSchema.statics.getUserExamCount = async function(userId) {
  return await this.countDocuments({ 
    user: userId, 
    status: 'completed' 
  });
};

const AdaptiveExam = mongoose.model('AdaptiveExam', adaptiveExamSchema);

module.exports = AdaptiveExam;
