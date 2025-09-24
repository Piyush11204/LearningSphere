const Exam = require('../models/Exam');
const User = require('../models/User');
const Progress = require('../models/Progress');
const { generateExamQuestions } = require('../services/geminiService');
const { logger } = require('../utils/logger');
const { sanitizeInput, isValidObjectId } = require('../utils/validators');
const validate = require('../middlewares/validation');

// Create exam (admin only, with AI-generated questions)
const createExam = [
  validate('exam'),
  async (req, res, next) => {
    try {
      const { title, description, scheduledDate, duration, subject, numQuestions, difficulty } = req.body;
      const sanitized = {
        title: sanitizeInput(title),
        description: sanitizeInput(description),
        subject: sanitizeInput(subject),
      };

      // Generate questions via Gemini
      const questions = await generateExamQuestions(sanitized.subject, numQuestions || 10, difficulty || 'medium');

      const exam = new Exam({
        ...sanitized,
        scheduledDate,
        duration,
        questions,
        invigilator: req.user.id, // Admin/staff creating exam
      });
      await exam.save();

      logger.info(`Exam created: ${sanitized.title}`);
      res.status(201).json({ success: true, exam });
    } catch (error) {
      logger.error(`Create exam error: ${error.message}`, { title: req.body.title });
      next(error);
    }
  },
];

// Submit exam answers
const submitExam = async (req, res) => {
  try {
    const { id } = req.params;
    const { answers, timeTaken, sessionId } = req.body;

    // Find the exam
    const exam = await Exam.findById(id);
    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }

    // Get user (authenticated or anonymous)
    let user = null;
    if (req.user) {
      user = req.user;
    } else if (sessionId) {
      // For anonymous users, create a temporary user record or use session tracking
      user = { _id: `anonymous_${sessionId}`, name: 'Anonymous User' };
    }

    // Calculate score and create detailed question results
    let score = 0;
    const questionResults = [];
    const totalQuestions = exam.questions.length;

    // Calculate average time per question
    const avgTimePerQuestion = Math.floor(timeTaken / totalQuestions);

    for (let i = 0; i < totalQuestions; i++) {
      const question = exam.questions[i];
      const userAnswer = answers[i] || '';
      const isCorrect = userAnswer === question.correctAnswer;

      if (isCorrect) {
        score += question.marks;
      }

      // Generate explanation using Gemini AI
      let explanation = '';
      try {
        const model = require('@google/generative-ai').GoogleGenerativeAI;
        const genAI = new model(process.env.GEMINI_API_KEY);
        const aiModel = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

        const explanationPrompt = `Provide a brief explanation for this multiple choice question:

Question: ${question.questionText}
Correct Answer: ${question.correctAnswer}
Options: ${question.options.join(', ')}

Please provide a 1-2 sentence explanation of why ${question.correctAnswer} is the correct answer.`;

        const explanationResult = await aiModel.generateContent(explanationPrompt);
        explanation = explanationResult.response.text().trim();
      } catch (error) {
        console.error('Error generating explanation:', error);
        explanation = 'Explanation not available at this time.';
      }

      // Determine difficulty based on question content (simple heuristic)
      let difficulty = 'medium';
      const questionText = question.questionText.toLowerCase();
      if (questionText.includes('explain') || questionText.includes('describe') || questionText.includes('analyze')) {
        difficulty = 'hard';
      } else if (questionText.includes('what') || questionText.includes('which') || questionText.includes('identify')) {
        difficulty = 'easy';
      }

      questionResults.push({
        isCorrect,
        userAnswer,
        correctAnswer: question.correctAnswer,
        marks: question.marks,
        difficulty,
        explanation,
        timeSpent: avgTimePerQuestion // Distribute total time across questions
      });
    }

    // Calculate percentage
    const percentage = Math.round((score / totalQuestions) * 100);

    // Update exam results if user is authenticated
    if (req.user) {
      // Check if user already has results for this exam
      const existingResultIndex = exam.results.findIndex(result =>
        result.userId.toString() === req.user._id.toString()
      );

      const resultData = {
        userId: req.user._id,
        score: percentage,
        submittedAt: new Date()
      };

      if (existingResultIndex >= 0) {
        // Update existing result
        exam.results[existingResultIndex] = resultData;
      } else {
        // Add new result
        exam.results.push(resultData);
      }

      await exam.save();

      // Update user progress and award XP
      const progress = await Progress.findOne({ userId: req.user._id });
      if (progress) {
        // Award XP: 100 for attempt + 20 per correct question + 400 bonus if >80%
        const correctAnswers = questionResults.filter(q => q.isCorrect).length;
        let xpEarned = 100; // Base XP for attempt
        xpEarned += correctAnswers * 20; // 20 XP per correct question
        if (percentage > 80) {
          xpEarned += 400; // Bonus for >80% score
        }

        progress.experiencePoints += xpEarned;

        // Check for badges
        const newBadges = [];

        // Perfect score badge
        if (percentage === 100 && !progress.badges.some(badge => badge.name === 'Perfect Score')) {
          newBadges.push({
            name: 'Perfect Score',
            description: 'Achieved 100% on an exam',
            icon: '🏆',
            xpReward: 20
          });
          progress.experiencePoints += 20;
        }

        // High scorer badge
        if (percentage >= 90 && !progress.badges.some(badge => badge.name === 'High Scorer')) {
          newBadges.push({
            name: 'High Scorer',
            description: 'Scored 90% or above on an exam',
            icon: '⭐',
            xpReward: 15
          });
          progress.experiencePoints += 15;
        }

        // First exam badge
        if (progress.examsCompleted === 0) {
          newBadges.push({
            name: 'First Steps',
            description: 'Completed your first exam',
            icon: '🎓',
            xpReward: 10
          });
          progress.experiencePoints += 10;
        }

        // Add new badges to progress
        progress.badges.push(...newBadges);
        progress.examsCompleted += 1;

        await progress.save();

        res.json({
          score: percentage,
          totalQuestions,
          correctAnswers: questionResults.filter(q => q.isCorrect).length,
          questionResults,
          timeTaken,
          averageTimePerQuestion: avgTimePerQuestion,
          xpEarned,
          newBadges
        });
      } else {
        // Create progress record if it doesn't exist
        const correctAnswers = questionResults.filter(q => q.isCorrect).length;
        let xpEarned = 100; // Base XP for attempt
        xpEarned += correctAnswers * 20; // 20 XP per correct question
        if (percentage > 80) {
          xpEarned += 400; // Bonus for >80% score
        }

        const newProgress = new Progress({
          userId: req.user._id,
          experiencePoints: xpEarned,
          examsCompleted: 1,
          badges: [{
            name: 'First Steps',
            description: 'Completed your first exam',
            icon: '🎓',
            xpReward: 10
          }]
        });

        await newProgress.save();

        res.json({
          score: percentage,
          totalQuestions,
          correctAnswers: questionResults.filter(q => q.isCorrect).length,
          questionResults,
          timeTaken,
          averageTimePerQuestion: avgTimePerQuestion,
          xpEarned,
          newBadges: [{
            name: 'First Steps',
            description: 'Completed your first exam',
            icon: '🎓',
            xpReward: 10
          }]
        });
      }
    } else {
      // For anonymous users, just return the results without saving
      res.json({
        score: percentage,
        totalQuestions,
        correctAnswers: questionResults.filter(q => q.isCorrect).length,
        questionResults,
        timeTaken,
        averageTimePerQuestion: avgTimePerQuestion,
        xpEarned: 0,
        newBadges: []
      });
    }
  } catch (error) {
    console.error('Error submitting exam:', error);
    res.status(500).json({ message: 'Error submitting exam', error: error.message });
  }
};

// Get all exams (public access - shows all available exams)
const getAllExams = async (req, res, next) => {
  try {
    // Show all scheduled, live, and ongoing exams for public access
    const exams = await Exam.find({
      status: { $in: ['scheduled', 'live', 'ongoing'] }
    })
      .populate('participants', 'email profile.name')
      .populate('invigilator', 'email profile.name')
      .sort({ scheduledDate: -1 });

    // For authenticated users, also include their completed exams
    if (req.user) {
      const userExams = await Exam.find({
        $or: [
          { participants: req.user.id },
          { results: { $elemMatch: { userId: req.user.id } } }
        ]
      })
        .populate('participants', 'email profile.name')
        .populate('invigilator', 'email profile.name')
        .sort({ scheduledDate: -1 });

      // Merge and deduplicate
      const examMap = new Map();
      [...exams, ...userExams].forEach(exam => {
        examMap.set(exam._id.toString(), exam);
      });

      const allExams = Array.from(examMap.values());
      logger.info(`Exams fetched for user ${req.user.id}`);
      res.json({ success: true, exams: allExams });
    } else {
      // Public access - only show available exams
      logger.info('Exams fetched for public access');
      res.json({ success: true, exams });
    }
  } catch (error) {
    logger.error(`Fetch exams error: ${error.message}`);
    next(error);
  }
};

// Get exam details (public access for viewing exam information)
const getExam = async (req, res, next) => {
  let examId;
  try {
    examId = req.params.id;
    if (!isValidObjectId(examId)) {
      const error = new Error('Invalid exam ID');
      error.statusCode = 400;
      throw error;
    }

    const exam = await Exam.findById(examId)
      .populate('participants', 'email profile.name')
      .populate('invigilator', 'email profile.name');
    if (!exam) {
      const error = new Error('Exam not found');
      error.statusCode = 404;
      throw error;
    }

    // For public access, return exam without sensitive information
    let response = { success: true, exam };

    // If user is authenticated, include their results
    if (req.user) {
      const userResult = exam.results.find(r => r.userId.toString() === req.user.id);
      if (userResult) {
        response.exam = { ...exam.toObject(), userResult };
      }
    }

    logger.info(`Exam fetched: ${exam.title}`);
    res.json(response);
  } catch (error) {
    logger.error(`Fetch exam error: ${error.message}`, { examId });
    next(error);
  }
};

// Start exam (public access - allows anonymous users to start exams)
const startExam = async (req, res, next) => {
  let examId;
  try {
    examId = req.params.id;

    if (!isValidObjectId(examId)) {
      const error = new Error('Invalid exam ID');
      error.statusCode = 400;
      throw error;
    }

    const exam = await Exam.findById(examId);
    if (!exam) {
      const error = new Error('Exam not found');
      error.statusCode = 404;
      throw error;
    }

    // Check if exam is available for starting/resuming
    if (!['live', 'ongoing'].includes(exam.status)) {
      const error = new Error('Exam is not available to start');
      error.statusCode = 400;
      throw error;
    }

    // For authenticated users, check if they have already submitted
    if (req.user) {
      const existingResult = exam.results.find(r => r.userId.toString() === req.user.id);
      if (existingResult) {
        const error = new Error('You have already submitted this exam');
        error.statusCode = 400;
        throw error;
      }
    }

    // If exam is live, change to ongoing when user starts
    if (exam.status === 'live') {
      exam.status = 'ongoing';
      exam.updatedAt = new Date();
      await exam.save();
    }

    const userId = req.user ? req.user.id : 'anonymous';
    logger.info(`Exam ${exam.status === 'ongoing' ? 'resumed' : 'started'}: ${exam.title} by user ${userId}`);
    res.json({ success: true, exam, resumed: exam.status === 'ongoing' });
  } catch (error) {
    logger.error(`Start exam error: ${error.message}`, { examId });
    next(error);
  }
};

// Update exam status (admin only)
const updateExamStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: 'Invalid exam ID' });
    }

    const validStatuses = ['scheduled', 'live', 'ongoing', 'completed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    // First find the exam to check permissions
    const existingExam = await Exam.findById(id);
    if (!existingExam) {
      return res.status(404).json({ success: false, message: 'Exam not found' });
    }

    // Check if tutor is trying to update someone else's exam
    if (req.user.role === 'tutor' && existingExam.invigilator.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied: can only update your own exams' });
    }

    const exam = await Exam.findByIdAndUpdate(
      id,
      { status, updatedAt: new Date() },
      { new: true }
    );

    logger.info(`Exam status updated: ${exam.title} to ${status}`);
    res.json({ success: true, exam });
  } catch (error) {
    logger.error(`Update exam status error: ${error.message}`);
    next(error);
  }
};

// Delete exam (admin only)
const deleteExam = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: 'Invalid exam ID' });
    }

    const exam = await Exam.findByIdAndDelete(id);
    if (!exam) {
      return res.status(404).json({ success: false, message: 'Exam not found' });
    }

    logger.info(`Exam deleted: ${exam.title}`);
    res.json({ success: true, message: 'Exam deleted successfully' });
  } catch (error) {
    logger.error(`Delete exam error: ${error.message}`);
    next(error);
  }
};

// Cleanup abandoned exams (admin utility function)
const cleanupAbandonedExams = async (req, res, next) => {
  try {
    // Find exams that have been ongoing for more than 2 hours
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);

    const abandonedExams = await Exam.find({
      status: 'ongoing',
      updatedAt: { $lt: twoHoursAgo }
    });

    let resetCount = 0;
    for (const exam of abandonedExams) {
      // Only reset if the exam is still within its scheduled time window
      const examEndTime = new Date(exam.scheduledDate.getTime() + exam.duration * 60 * 1000);
      if (new Date() < examEndTime) {
        exam.status = 'live';
        exam.updatedAt = new Date();
        await exam.save();
        resetCount++;
        logger.info(`Reset abandoned exam: ${exam.title}`);
      }
    }

    res.json({
      success: true,
      message: `Reset ${resetCount} abandoned exams`,
      resetCount
    });
  } catch (error) {
    logger.error(`Cleanup abandoned exams error: ${error.message}`);
    next(error);
  }
};

// Get exam status for a specific user (public access)
const getExamStatusForUser = async (req, res, next) => {
  let examId;
  try {
    examId = req.params.id;

    if (!isValidObjectId(examId)) {
      const error = new Error('Invalid exam ID');
      error.statusCode = 400;
      throw error;
    }

    const exam = await Exam.findById(examId);
    if (!exam) {
      const error = new Error('Exam not found');
      error.statusCode = 404;
      throw error;
    }

    // Check submission status
    let hasSubmitted = false;
    let submittedAt = null;
    let score = null;

    if (req.user) {
      // For authenticated users, check by user ID
      const existingResult = exam.results.find(r => r.userId.toString() === req.user.id);
      if (existingResult) {
        hasSubmitted = true;
        submittedAt = existingResult.submittedAt;
        score = existingResult.score;
      }
    }

    // Check if exam can be started/resumed
    const canStart = ['live', 'ongoing'].includes(exam.status) && !hasSubmitted;

    res.json({
      success: true,
      examId,
      status: exam.status,
      canStart,
      hasSubmitted,
      submittedAt,
      score
    });
  } catch (error) {
    logger.error(`Get exam status error: ${error.message}`, { examId });
    next(error);
  }
};

// Update exam status (admin only) - DUPLICATE - REMOVING
const _updateExamStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!isValidObjectId(id)) {
      const error = new Error('Invalid exam ID');
      error.statusCode = 400;
      throw error;
    }

    // Validate status
    const validStatuses = ['scheduled', 'live', 'ongoing', 'completed'];
    if (!validStatuses.includes(status)) {
      const error = new Error('Invalid status value');
      error.statusCode = 400;
      throw error;
    }

    const exam = await Exam.findByIdAndUpdate(
      id,
      { status, updatedAt: new Date() },
      { new: true }
    ).populate('participants', 'username email')
     .populate('invigilator', 'username');

    if (!exam) {
      const error = new Error('Exam not found');
      error.statusCode = 404;
      throw error;
    }

    logger.info(`Exam status updated: ${exam.title} -> ${status}`);
    res.json({ success: true, exam });
  } catch (error) {
    logger.error(`Update exam status error: ${error.message}`, { examId: req.params.id });
    next(error);
  }
};

module.exports = {
  createExam,
  submitExam,
  getAllExams,
  getExam,
  startExam,
  updateExamStatus,
  getExamStatusForUser,
  deleteExam,
  cleanupAbandonedExams
};
