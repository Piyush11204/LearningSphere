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

// Update exam statistics
userSchema.methods.updateExamStats = function() {
  const history = this.examHistory;
  if (history.length === 0) return;

  this.examStats.totalExams = history.length;
  this.examStats.examsPassed = history.filter(exam => exam.status === 'passed').length;
  this.examStats.examsFailed = history.filter(exam => exam.status === 'failed').length;
  
  // Calculate averages
  const totalScore = history.reduce((sum, exam) => sum + exam.score, 0);
  const totalPercentage = history.reduce((sum, exam) => sum + exam.percentage, 0);
  const totalTime = history.reduce((sum, exam) => sum + (exam.timeTaken || exam.duration * 60), 0);
  
  this.examStats.averageScore = Math.round((totalScore / history.length) * 100) / 100;
  this.examStats.averagePercentage = Math.round((totalPercentage / history.length) * 100) / 100;
  this.examStats.bestScore = Math.max(...history.map(exam => exam.score));
  this.examStats.totalExamTime = Math.round(totalTime / 60); // Convert to minutes
  
  // Calculate current streak (consecutive passes)
  let currentStreak = 0;
  for (let i = history.length - 1; i >= 0; i--) {
    if (history[i].status === 'passed') {
      currentStreak++;
    } else {
      break;
    }
  }
  
  this.examStats.examStreak.current = currentStreak;
  if (currentStreak > this.examStats.examStreak.longest) {
    this.examStats.examStreak.longest = currentStreak;
  }
};

module.exports = mongoose.model('User', userSchema);
