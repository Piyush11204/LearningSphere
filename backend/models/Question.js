const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  id: {
    type: Number,
    unique: true,
    required: true
  },
  question_text: {
    type: String,
    required: true
  },
  option_a: {
    type: String,
    required: true
  },
  option_b: {
    type: String,
    required: true
  },
  option_c: {
    type: String,
    required: true
  },
  option_d: {
    type: String,
    required: true
  },
  answer: {
    type: String,
    required: true,
    enum: ['a', 'b', 'c', 'd']
  },
  difficulty: {
    type: String,
    required: true,
    enum: ['Very easy', 'Easy', 'Moderate', 'Difficult']
  },
  bloomsTaxonomy: {
    type: String,
    default: 'Understand'
  },
  tags: {
    type: String,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  totalAttempts: {
    type: Number,
    default: 0
  },
  correctAttempts: {
    type: Number,
    default: 0
  },
  successRate: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Index for efficient querying
questionSchema.index({ difficulty: 1, tags: 1, isActive: 1 });

module.exports = mongoose.model('Question', questionSchema);