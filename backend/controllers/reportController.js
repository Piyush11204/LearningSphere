const User = require('../models/User');
const Exam = require('../models/Exam');
const { generateReport } = require('../services/geminiService');
const Progress = require('../models/Progress');

// Generate student performance report (admin or self)
const generateStudentReport = async (req, res, next) => {
  let userId;
  try {
    userId = req.params.userId || req.user.id; // Admin can specify user, students get own report
    if (!isValidObjectId(userId)) {
      const error = new Error('Invalid user ID');
      error.statusCode = 400;
      throw error;
    }

    const user = await User.findById(userId).populate('examHistory.examId', 'title scheduledDate');
    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }

    // Restrict non-admins from accessing others' reports
    if (req.user.role !== 'admin' && userId !== req.user.id) {
      const error = new Error('Access denied');
      error.statusCode = 403;
      throw error;
    }

    // Prepare data for Gemini
    const reportData = {
      username: user.profile.name,
      examHistory: user.examHistory,
      examCount: user.examStats.totalExams,
      averageScore: user.examStats.averageScore,
    };

    const report = await generateReport(reportData);
    console.log(`Report generated for user: ${userId}`);
    res.json({ success: true, report });
  } catch (error) {
    console.error(`Generate report error: ${error.message}`, { userId });
    next(error);
  }
};

// Generate exam summary report (admin only)
const generateExamReport = async (req, res, next) => {
  let examId;
  try {
    examId = req.params.examId;
    if (!isValidObjectId(examId)) {
      const error = new Error('Invalid exam ID');
      error.statusCode = 400;
      throw error;
    }

    const exam = await Exam.findById(examId).populate('participants', 'username').populate('results.userId', 'username');
    if (!exam) {
      const error = new Error('Exam not found');
      error.statusCode = 404;
      throw error;
    }

    // Prepare data for Gemini
    const reportData = {
      title: exam.title,
      scheduledDate: exam.scheduledDate,
      participants: exam.participants.length,
      averageScore: exam.getAverageScore(),
      results: exam.results,
    };

    const report = await generateReport(reportData);
    console.log(`Exam report generated: ${examId}`);
    res.json({ success: true, report });
  } catch (error) {
    console.error(`Generate exam report error: ${error.message}`, { examId });
    next(error);
  }
};

module.exports = {
  generateStudentReport,
  generateExamReport
};
