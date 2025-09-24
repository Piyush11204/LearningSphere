const mongoose = require('mongoose');

const matchSchema = new mongoose.Schema({
  learner: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  tutor: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  matchScore: { 
    type: Number, 
    required: true, 
    min: 0, 
    max: 100 
  },  // Based on interests, skills, location
  matchedAt: { 
    type: Date, 
    default: Date.now 
  },
  status: { 
    type: String, 
    enum: ['pending', 'accepted', 'rejected', 'expired'], 
    default: 'pending' 
  },
  expiry: { 
    type: Date 
  },  // e.g., 7 days
  metadata: {  // For evaluation
    interestsOverlap: Number,
    skillsMatch: Number,
    locationProximity: Number
  }
}, { 
  timestamps: true 
});

// Compound index for quick lookups
matchSchema.index({ learner: 1, tutor: 1 }, { unique: true });

module.exports = mongoose.model('Match', matchSchema);
