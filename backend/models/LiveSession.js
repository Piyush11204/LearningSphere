const mongoose = require('mongoose');

const liveSessionSchema = new mongoose.Schema({
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
    ref: 'User'
  },
  startTime: {
    type: Date,
    required: false
  },
  endTime: {
    type: Date,
    required: false
  },
  maxParticipants: {
    type: Number,
    default: 2, // Tutor + 1 student for one-on-one sessions
    max: 2 // Ensure only tutor and student can join
  },
  invitedStudent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  invitedStudentEmail: {
    type: String,
    trim: true
  },
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  status: {
    type: String,
    enum: ['scheduled', 'live', 'completed', 'cancelled'],
    default: 'live' // Changed default to 'live'
  },
  meetingLink: {
    type: String,
    trim: true
  },
  recordingUrl: String,
  isActive: {
    type: Boolean,
    default: true // Changed default to true
  },
  chatMessages: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    username: {
      type: String,
      required: true
    },
    message: {
      type: String,
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  }]
}, { timestamps: true });

module.exports = mongoose.model('LiveSession', liveSessionSchema);