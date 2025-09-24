const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  title: { 
    type: String, 
    required: true,
    maxlength: 200 
  },
  description: { 
    type: String, 
    maxlength: 1000 
  },
  tutor: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  learners: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  }],
  startTime: { 
    type: Date, 
    required: true 
  },
  endTime: { 
    type: Date, 
    required: true 
  },
  status: { 
    type: String, 
    enum: ['scheduled', 'live', 'completed', 'cancelled'], 
    default: 'scheduled' 
  },
  sessionType: { 
    type: String, 
    enum: ['video', 'voice'], 
    default: 'video' 
  },
  meetingLink: { 
    type: String,
    trim: true
  },  // Zoom, Google Meet, or other video conferencing link
  recordingUrl: String,  // Cloudinary URL if recorded
  metadata: {  // For smart matching evaluation
    duration: Number,
    topicsCovered: [String],
    feedbackScore: Number
  },
  remindersSent: { 
    type: Boolean, 
    default: false 
  }
}, { 
  timestamps: true 
});

// Populate refs automatically (virtual)
sessionSchema.virtual('tutorDetails', {
  ref: 'User',
  localField: 'tutor',
  foreignField: '_id'
});

sessionSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Session', sessionSchema);
