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

    // Submit exam attempt (student)
const submitExam = async (req, res, next) => {
  let examId;
  try {
    examId = req.params.id;
    const { answers, timeTaken } = req.body; // Array of answers [answer1, answer2, ...]

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

    // Allow submission for live or ongoing exams
    if (!['live', 'ongoing'].includes(exam.status)) {
      const error = new Error('Exam is not available for submission');
      error.statusCode = 400;
      throw error;
    }

    // Check if student has already submitted this exam
    const existingResult = exam.results.find(r => r.userId.toString() === req.user.id);
    if (existingResult) {
      const error = new Error('You have already submitted this exam');
      error.statusCode = 400;
      throw error;
    }

    // Calculate score
    let score = 0;
    let correctAnswers = 0;
    const totalQuestions = exam.questions.length;
    const questionResults = [];

    exam.questions.forEach((q, index) => {
      const isCorrect = answers && answers[index] && answers[index] === q.correctAnswer;
      if (isCorrect) {
        score += q.marks || 1;
        correctAnswers++;
      }
      questionResults.push({
        questionIndex: index,
        userAnswer: answers[index] || null,
        correctAnswer: q.correctAnswer,
        isCorrect,
        marks: isCorrect ? (q.marks || 1) : 0
      });
    });

    const percentage = Math.round((score / totalQuestions) * 100);
    const examStatus = percentage >= 50 ? 'passed' : 'failed'; // 50% pass threshold

    // Get user and update exam history
    const user = await User.findById(req.user.id);
    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }

    // Prepare exam result for user history
    const examResult = {
      examId,
      score,
      totalQuestions,
      correctAnswers,
      percentage,
      duration: exam.duration,
      status: examStatus,
      timeTaken: timeTaken || exam.duration * 60 // in seconds
    };

    // Update user exam history
    user.examHistory.push(examResult);
    await user.updateExamStats();
    await user.save();

    // Update user progress and award badges/XP
    let progress = await Progress.findOne({ user: req.user.id });
    if (!progress) {
      // Create progress entry if it doesn't exist
      progress = new Progress({
        user: req.user.id,
        experiencePoints: 0,
        currentLevel: 1
      });
    }

    // Update exam progress and award XP
    const xpAwarded = progress.updateExamProgress(examResult);
    
    // Check for special badges
    const badges = progress.constructor.getBadgeDefinitions();
    
    // Check for perfect score badge
    if (percentage === 100 && !progress.badges.find(b => b.id === 'perfect-score')) {
      progress.badges.push({
        id: 'perfect-score',
        name: badges['perfect-score'].name,
        description: badges['perfect-score'].description,
        category: badges['perfect-score'].category,
        icon: badges['perfect-score'].icon,
        xpReward: badges['perfect-score'].xpReward
      });
      progress.experiencePoints += badges['perfect-score'].xpReward;
    }
    
    // Check for speed demon badge
    if (timeTaken && timeTaken < (exam.duration * 60 * 0.5) && 
        !progress.badges.find(b => b.id === 'speed-demon')) {
      progress.badges.push({
        id: 'speed-demon',
        name: badges['speed-demon'].name,
        description: badges['speed-demon'].description,
        category: badges['speed-demon'].category,
        icon: badges['speed-demon'].icon,
        xpReward: badges['speed-demon'].xpReward
      });
      progress.experiencePoints += badges['speed-demon'].xpReward;
    }

    // Check and award other badges
    const newBadges = progress.checkAndAwardBadges();
    await progress.save();    // Update exam results
    exam.results.push({
      userId: req.user.id,
      score,
      submittedAt: new Date(),
      answers: answers
    });

    // Keep exam status as ongoing if there are other students taking it
    // Only change to completed when admin manually completes it
    await exam.save();

    logger.info(`Exam submitted: ${exam.title} by user ${user.email} - Score: ${score}/${totalQuestions}`);
    
    res.json({
      success: true,
      score,
      totalQuestions,
      correctAnswers,
      percentage,
      status: examStatus,
      xpAwarded,
      newBadges,
      questionResults,
      timeTaken
    });
  } catch (error) {
    logger.error(`Submit exam error: ${error.message}`, { examId, userId: req.user.id });
    next(error);
  }
};

// Get all exams (students see available exams, admin sees all)
const getAllExams = async (req, res, next) => {
  try {
    let exams;
    if (req.user.role === 'admin') {
      // Admin sees all exams
      exams = await Exam.find()
        .populate('participants', 'email profile.name')
        .populate('invigilator', 'email profile.name')
        .sort({ scheduledDate: -1 });
    } else {
      // Students see exams they're participating in or all scheduled/live/ongoing exams
      exams = await Exam.find({
        $or: [
          { participants: req.user.id },
          { status: { $in: ['scheduled', 'live', 'ongoing'] } }
        ]
      })
        .populate('participants', 'email profile.name')
        .populate('invigilator', 'email profile.name')
        .sort({ scheduledDate: -1 });
    }

    logger.info(`Exams fetched by user ${req.user.id}`);
    res.json({ success: true, exams });
  } catch (error) {
    logger.error(`Fetch exams error: ${error.message}`, { userId: req.user.id });
    next(error);
  }
};

// Get exam details (admin sees all, students see own results)
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

    // Admin sees full results, students see only their submission
    let response = { success: true, exam };
    if (req.user.role !== 'admin') {
      const userResult = exam.results.find(r => r.userId.toString() === req.user.id);
      response = { success: true, exam: { ...exam.toObject(), results: userResult || null } };
    }

    logger.info(`Exam fetched: ${exam.title} by user ${req.user.id}`);
    res.json(response);
  } catch (error) {
    logger.error(`Fetch exam error: ${error.message}`, { examId });
    next(error);
  }
};

// Start exam (student) - changes status from live to ongoing, or allows resuming ongoing exams
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

    // If exam is live, change to ongoing when student starts
    if (exam.status === 'live') {
      exam.status = 'ongoing';
      exam.updatedAt = new Date();
      await exam.save();
    }

    // Check if student has already submitted this exam
    const existingResult = exam.results.find(r => r.userId.toString() === req.user.id);
    if (existingResult) {
      const error = new Error('You have already submitted this exam');
      error.statusCode = 400;
      throw error;
    }

    logger.info(`Exam ${exam.status === 'ongoing' ? 'resumed' : 'started'}: ${exam.title} by user ${req.user.id}`);
    res.json({ success: true, exam, resumed: exam.status === 'ongoing' });
  } catch (error) {
    logger.error(`Start exam error: ${error.message}`, { examId, userId: req.user.id });
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

    const exam = await Exam.findByIdAndUpdate(
      id,
      { status, updatedAt: new Date() },
      { new: true }
    );

    if (!exam) {
      return res.status(404).json({ success: false, message: 'Exam not found' });
    }

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

// Get exam status for a specific user
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

    // Check if user has already submitted
    const existingResult = exam.results.find(r => r.userId.toString() === req.user.id);
    const hasSubmitted = !!existingResult;

    // Check if exam can be started/resumed
    const canStart = ['live', 'ongoing'].includes(exam.status) && !hasSubmitted;

    res.json({
      success: true,
      examId,
      status: exam.status,
      canStart,
      hasSubmitted,
      submittedAt: existingResult?.submittedAt,
      score: existingResult?.score
    });
  } catch (error) {
    logger.error(`Get exam status error: ${error.message}`, { examId, userId: req.user.id });
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
