const User = require('../models/User');
const Exam = require('../models/Exam');
const { generateReport } = require('../services/geminiService');
const Progress = require('../models/Progress');
const PracticeSession = require('../models/PracticeSession');
const mongoose = require('mongoose');

// Generate student performance report (admin or self)
const generateStudentReport = async (req, res, next) => {
  let userId;
  try {
    userId = req.params.userId || req.user.id; // Admin can specify user, students get own report
    if (!mongoose.isValidObjectId(userId)) {
      const error = new Error('Invalid user ID');
      error.statusCode = 400;
      throw error;
    }

    const user = await User.findById(userId);
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

    // Get progress data
    const progress = await Progress.findOne({ user: userId });

    // Get exam history
    const exams = await Exam.find({
      results: { $elemMatch: { userId: userId } }
    }).sort({ 'results.submittedAt': -1 });

    const examHistory = exams.map(exam => {
      const userResult = exam.results.find(r => r.userId && r.userId.toString() === userId);
      if (!userResult) return null; // Skip if no result found for this user
      return {
        examId: exam._id,
        title: exam.title,
        subject: exam.subject || 'General', // Default subject if not specified
        scheduledDate: exam.scheduledDate,
        submittedAt: userResult.submittedAt,
        score: userResult.score
      };
    }).filter(item => item !== null); // Remove null entries

    // Get practice session history
    const practiceSessions = await PracticeSession.find({
      userId: userId,
      status: 'completed'
    }).sort({ createdAt: -1 }).limit(20);

    const practiceHistory = practiceSessions.map(session => ({
      sessionId: session._id,
      startTime: session.startTime,
      endTime: session.endTime,
      duration: session.duration,
      score: session.score,
      totalQuestions: session.totalQuestions,
      correctAnswers: session.correctAnswers,
      accuracy: session.totalQuestions > 0 ? Math.round((session.correctAnswers / session.totalQuestions) * 100) : 0,
      xpEarned: session.xpEarned,
      difficulty: session.currentDifficulty,
      isSectional: session.isSectional
    }));

    // Get sectional test history from user model
    const sectionalHistory = (user.sectionalTestHistory || []).slice(-20).map(session => ({
      sessionId: session.sessionId,
      completedAt: session.completedAt,
      totalSections: session.totalSections,
      completedSections: session.completedSections,
      passedSections: session.passedSections,
      xpEarned: session.xpEarned,
      duration: session.duration,
      status: session.status,
      sections: session.sections?.map(section => ({
        sectionId: section.sectionId,
        difficulty: section.difficulty,
        correct: section.correct,
        total: section.total,
        accuracy: section.accuracy,
        passed: section.passed
      })) || []
    }));

    // Prepare data for Gemini
    const reportData = {
      username: user.profile?.name || user.email,
      examHistory: examHistory,
      practiceHistory: practiceHistory,
      sectionalHistory: sectionalHistory,
      examCount: progress?.examsCompleted || 0,
      practiceSessionsCount: practiceSessions.length,
      sectionalTestsCount: sectionalHistory.length,
      averageScore: progress?.examAverageScore || 0,
      totalSessions: progress?.sessionsCompleted || 0,
      totalHours: progress?.totalHours || 0,
      currentLevel: progress?.currentLevel || 1,
      experiencePoints: progress?.experiencePoints || 0,
      badges: progress?.badges?.length || 0,
      sectionalTestStats: user.sectionalTestStats || {}
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
    if (!mongoose.isValidObjectId(examId)) {
      const error = new Error('Invalid exam ID');
      error.statusCode = 400;
      throw error;
    }

    const exam = await Exam.findById(examId).populate('participants', 'profile.name').populate('results.userId', 'profile.name');
    if (!exam) {
      const error = new Error('Exam not found');
      error.statusCode = 404;
      throw error;
    }

    // Check if tutor is trying to access someone else's exam report
    if (req.user.role === 'tutor' && exam.invigilator.toString() !== req.user.id) {
      const error = new Error('Access denied: can only generate reports for your own exams');
      error.statusCode = 403;
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
