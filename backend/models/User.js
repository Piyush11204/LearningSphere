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

module.exports = mongoose.model('User', userSchema);
