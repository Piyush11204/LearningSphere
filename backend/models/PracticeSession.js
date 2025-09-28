const mongoose = require('mongoose');

const practiceSessionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date,
    required: true
  },
  duration: {
    type: Number, // in minutes
    required: true
  },
  questions: [{
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Question',
      required: true
    },
    userAnswer: {
      type: String,
      enum: ['a', 'b', 'c', 'd']
    },
    isCorrect: {
      type: Boolean
    },
    timeTaken: {
      type: Number // in seconds
    },
    answeredAt: {
      type: Date
    }
  }],
  currentQuestionIndex: {
    type: Number,
    default: 0
  },
  currentDifficulty: {
    type: String,
    default: 'Easy',
    enum: ['Very easy', 'Easy', 'Moderate', 'Difficult']
  },
  score: {
    type: Number,
    default: 0
  },
  totalQuestions: {
    type: Number,
    default: 0
  },
  correctAnswers: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'expired'],
    default: 'active'
  },
  xpEarned: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Index for efficient querying
practiceSessionSchema.index({ userId: 1, status: 1, createdAt: -1 });

module.exports = mongoose.model('PracticeSession', practiceSessionSchema);