const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  questionText: { type: String, required: true },
  options: [{ type: String }], // For MCQ
  correctAnswer: { type: String }, // Or index for MCQ
  type: { type: String, enum: ['mcq', 'short', 'essay'], default: 'mcq' },
  marks: { type: Number, default: 1 }
});

const examSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  scheduledDate: { type: Date, required: true },
  duration: { type: Number, required: true }, // in minutes
  questions: [questionSchema], // AI-generated
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // Students
  invigilator: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Staff/Admin
  results: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    score: { type: Number },
    submittedAt: { type: Date }
  }],
  status: { type: String, enum: ['scheduled', 'live', 'ongoing', 'completed'], default: 'scheduled' },
  proctoringEnabled: { type: Boolean, default: false }, // For AI proctoring
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Method to calculate average score
examSchema.methods.getAverageScore = function() {
  if (this.results.length === 0) return 0;
  const total = this.results.reduce((sum, res) => sum + res.score, 0);
  return total / this.results.length;
};

module.exports = mongoose.model('Exam', examSchema);
