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

// Schedule exam one month from now (admin only)
const scheduleExamOneMonthLater = [
  validate('exam'),
  async (req, res, next) => {
    try {
      const { title, description, duration, subject, numQuestions, difficulty } = req.body;
      const sanitized = {
        title: sanitizeInput(title),
        description: sanitizeInput(description),
        subject: sanitizeInput(subject),
      };

      // Calculate date one month from now
      const oneMonthLater = new Date();
      oneMonthLater.setMonth(oneMonthLater.getMonth() + 1);

      // Generate questions via Gemini
      const questions = await generateExamQuestions(sanitized.subject, numQuestions || 10, difficulty || 'medium');

      const exam = new Exam({
        ...sanitized,
        scheduledDate: oneMonthLater,
        duration,
        questions,
        invigilator: req.user.id, // Admin/staff creating exam
        status: 'scheduled',
      });
      await exam.save();

      logger.info(`Exam scheduled for one month later: ${sanitized.title}, Date: ${oneMonthLater}`);
      res.status(201).json({ success: true, exam });
    } catch (error) {
      logger.error(`Schedule exam one month later error: ${error.message}`, { title: req.body.title });
      next(error);
    }
  },
];

// Submit exam answers
const submitExam = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { answers, timeTaken, sessionId, userId } = req.body;

    logger.info('Exam submission received', {
      examId: id,
      userIdFromAuth: req.user?._id,
      userIdFromBody: userId,
      isAuthenticated: !!req.user,
      sessionId,
      hasAnswers: !!answers,
      timeTaken,
    });

    // Validate exam exists
    const exam = await Exam.findById(id);
    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }

    // Validate questions exist
    if (!exam.questions || exam.questions.length === 0) {
      logger.error('No questions found in exam', { examId: id });
      return res.status(400).json({ message: 'Exam has no questions' });
    }

    // Convert answers object to array format expected by backend
    let answersArray = [];
    if (Array.isArray(answers)) {
      answersArray = answers;
    } else if (typeof answers === 'object' && answers !== null) {
      answersArray = Object.values(answers);
    } else {
      logger.error('Invalid answers format', { answers });
      return res.status(400).json({ message: 'Invalid answers format' });
    }

    // Ensure answersArray matches questions length
    while (answersArray.length < exam.questions.length) {
      answersArray.push(''); // Add empty answers for unanswered questions
    }
    answersArray = answersArray.slice(0, exam.questions.length); // Trim if too long

    // Validate answer format (expect single-letter answers, e.g., "A", "B")
    const validAnswerLetters = ['A', 'B', 'C', 'D', ''];
    answersArray = answersArray.map(answer => {
      if (typeof answer !== 'string') return '';
      const letter = answer.charAt(0).toUpperCase();
      return validAnswerLetters.includes(letter) ? answer : '';
    });

    // Get user (authenticated or anonymous)
    let user = null;
    let actualSessionId = sessionId;
    let actualUserId = null;

    // Priority: req.user (from JWT) > userId from body > anonymous
    if (req.user) {
      user = req.user;
      actualUserId = req.user._id;
      logger.info('Using authenticated user from JWT', { userId: actualUserId });
    } else if (userId && isValidObjectId(userId)) {
      actualUserId = userId;
      user = { _id: userId, name: 'Authenticated User' };
      logger.info('Using userId from request body', { userId: actualUserId });
    } else {
      if (!actualSessionId) {
        actualSessionId = `anonymous_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        logger.info('Generated new session ID for anonymous user', { sessionId: actualSessionId });
      }
      user = { _id: `anonymous_${actualSessionId}`, name: 'Anonymous User' };
      logger.info('Using anonymous user with session', { sessionId: actualSessionId });
    }

    // Calculate score and create detailed question results
    let score = 0;
    const questionResults = [];
    const totalQuestions = exam.questions.length;

    // Calculate average time per question
    const avgTimePerQuestion = totalQuestions > 0 ? Math.floor(timeTaken / totalQuestions) : 0;

    for (let i = 0; i < totalQuestions; i++) {
      const question = exam.questions[i];
      const userAnswer = answersArray[i] || '';
      const userAnswerLetter = userAnswer && userAnswer.length > 0 ? userAnswer.charAt(0).toUpperCase() : '';
      const isCorrect = userAnswerLetter === question.correctAnswer;

      if (isCorrect) {
        score += question.marks;
      }

      // Generate static explanation
      let explanation = '';
      try {
        const questionText = question.questionText.toLowerCase();
        const correctAnswer = question.correctAnswer;

        if (questionText.includes('solve') && questionText.includes('equation')) {
          explanation = `To solve this equation, isolate the variable by performing the same operation on both sides. The correct answer ${correctAnswer} satisfies the equation when substituted back in.`;
        } else if (questionText.includes('area') && questionText.includes('circle')) {
          explanation = `The area of a circle is calculated using the formula A = πr², where r is the radius. For a circle with radius 5cm, the area is 25π cm².`;
        } else if (questionText.includes('slope')) {
          explanation = `The slope of a line is calculated as (y₂ - y₁)/(x₂ - x₁). Using the points given, the slope is (12-4)/(6-2) = 8/4 = 2.`;
        } else if (questionText.includes('inequality')) {
          explanation = `To solve inequalities, perform the same operations on both sides. Adding 5 to both sides gives x > 4.`;
        } else if (questionText.includes('sin(30°)')) {
          explanation = `sin(30°) = 1/2. This is a standard trigonometric value that should be memorized.`;
        } else if (questionText.includes('sequence')) {
          explanation = `This is an arithmetic sequence where each term increases by 3. The pattern is +3 each time: 2+3=5, 5+3=8, 8+3=11, 11+3=14, 14+3=17, 17+3=20, 20+3=23, 23+3=26.`;
        } else if (questionText.includes('mean')) {
          explanation = `The mean (average) is calculated by summing all values and dividing by the count: (5+8+12+15)/4 = 40/4 = 10.`;
        } else if (questionText.includes('triangle') && questionText.includes('angles')) {
          explanation = `The sum of angles in a triangle is 180°. If two angles are 30° and 60°, the third angle is 180° - 30° - 60° = 90°.`;
        } else if (questionText.includes('prime factorization')) {
          explanation = `To find prime factorization, divide by smallest primes: 72 ÷ 2 = 36, 36 ÷ 2 = 18, 18 ÷ 2 = 9, 9 ÷ 3 = 3, 3 ÷ 3 = 1. So 72 = 2³ × 3².`;
        } else {
          explanation = `The correct answer is ${correctAnswer}. This demonstrates the key concept being tested in this question.`;
        }
      } catch (error) {
        logger.error('Error generating static explanation', { error: error.message, questionIndex: i });
        explanation = 'Explanation not available at this time.';
      }

      // Determine difficulty
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
        timeSpent: avgTimePerQuestion,
      });
    }

    // Calculate percentage
    const percentage = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;

    // Initialize progress variables (accessible in both authenticated and anonymous flows)
    let xpAwarded = 0;
    let newBadges = [];

    // Save exam results and update user progress
    if (actualUserId) {
      const existingResultIndex = exam.results.findIndex(result =>
        result.userId && result.userId.toString() === actualUserId.toString()
      );

      const resultData = {
        userId: actualUserId,
        score: percentage,
        submittedAt: new Date(),
        answers: answersArray,
        questionResults,
        timeTaken: timeTaken || 0,
        totalQuestions,
        correctAnswers: questionResults.filter(q => q.isCorrect).length,
      };

      if (existingResultIndex >= 0) {
        exam.results[existingResultIndex] = resultData;
      } else {
        exam.results.push(resultData);
      }

      await exam.save();
      logger.info(`Exam result saved to database for user ${actualUserId}: ${percentage}%`);

      // Update user progress and award XP

      let progress = await Progress.findOne({ user: actualUserId });
      if (!progress) {
        progress = new Progress({
          user: actualUserId,
          experiencePoints: 0,
          examsCompleted: 0,
          examsPassed: 0,
          examsFailed: 0,
          examAverageScore: 0,
          examBestScore: 0,
          badges: [],
        });
      }

      const examResult = {
        status: percentage >= 60 ? 'passed' : 'failed',
        percentage,
        score: percentage,
        timeTaken: timeTaken || 0,
        duration: exam.duration,
      };

      logger.info(`Updating progress for exam result`, { examResult });

      xpAwarded = progress.updateExamProgress(examResult);
      newBadges = progress.checkAndAwardBadges();
      await progress.save();

      logger.info(`Progress updated: XP earned: ${xpAwarded}, New badges: ${newBadges.length}`);
    } else {
      logger.info('Skipping progress update for anonymous user');
    }

    res.json({
      message: 'Exam submitted successfully',
      score,
      percentage,
      totalQuestions,
      correctAnswers: questionResults.filter(q => q.isCorrect).length,
      questionResults,
      timeTaken,
      averageTimePerQuestion: avgTimePerQuestion,
      xpEarned: xpAwarded, // Will be 0 for anonymous users, actual XP for authenticated users
      newBadges: newBadges, // Will be empty array for anonymous users, actual badges for authenticated users
      passed: percentage >= 60,
    });
  } catch (error) {
    logger.error('Error submitting exam', { error: error.message, examId: req.params.id });
    next(error);
  }
};

// Get all exams (public access - shows all available exams)
const getAllExams = async (req, res, next) => {
  try {
    const exams = await Exam.find({
      status: { $in: ['scheduled', 'live', 'ongoing'] },
    })
      .populate('participants', 'email profile.name')
      .populate('invigilator', 'email profile.name')
      .sort({ scheduledDate: -1 });

    if (req.user) {
      const userExams = await Exam.find({
        $or: [
          { participants: req.user.id },
          { results: { $elemMatch: { userId: req.user.id } } },
        ],
      })
        .populate('participants', 'email profile.name')
        .populate('invigilator', 'email profile.name')
        .sort({ scheduledDate: -1 });

      const examMap = new Map();
      [...exams, ...userExams].forEach(exam => {
        examMap.set(exam._id.toString(), exam);
      });

      const allExams = Array.from(examMap.values());
      logger.info(`Exams fetched for user ${req.user.id}`);
      res.json({ success: true, exams: allExams });
    } else {
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
  try {
    const examId = req.params.id;
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

    let response = { success: true, exam };
    if (req.user) {
      const userResult = exam.results.find(r => r.userId.toString() === req.user.id);
      if (userResult) {
        response.exam = { ...exam.toObject(), userResult };
      }
    }

    logger.info(`Exam fetched: ${exam.title}`);
    res.json(response);
  } catch (error) {
    logger.error(`Fetch exam error: ${error.message}`, { examId: req.params.id });
    next(error);
  }
};

// Start exam (public access - allows anonymous users to start exams)
const startExam = async (req, res, next) => {
  try {
    const examId = req.params.id;
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

    if (!['live', 'ongoing'].includes(exam.status)) {
      const error = new Error('Exam is not available to start');
      error.statusCode = 400;
      throw error;
    }

    if (req.user) {
      const existingResult = exam.results.find(r => r.userId.toString() === req.user.id);
      if (existingResult) {
        const error = new Error('You have already submitted this exam');
        error.statusCode = 400;
        throw error;
      }
    }

    if (exam.status === 'live') {
      exam.status = 'ongoing';
      exam.updatedAt = new Date();
      await exam.save();
    }

    const userId = req.user ? req.user.id : 'anonymous';
    logger.info(`Exam ${exam.status === 'ongoing' ? 'resumed' : 'started'}: ${exam.title} by user ${userId}`);
    res.json({ success: true, exam, resumed: exam.status === 'ongoing' });
  } catch (error) {
    logger.error(`Start exam error: ${error.message}`, { examId: req.params.id });
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

    const existingExam = await Exam.findById(id);
    if (!existingExam) {
      return res.status(404).json({ success: false, message: 'Exam not found' });
    }

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
    logger.error(`Update exam status error: ${error.message}`, { examId: id });
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
    logger.error(`Delete exam error: ${error.message}`, { examId: id });
    next(error);
  }
};

// Cleanup abandoned exams (admin utility function)
const cleanupAbandonedExams = async (req, res, next) => {
  try {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
    const abandonedExams = await Exam.find({
      status: 'ongoing',
      updatedAt: { $lt: twoHoursAgo },
    });

    let resetCount = 0;
    for (const exam of abandonedExams) {
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
      resetCount,
    });
  } catch (error) {
    logger.error(`Cleanup abandoned exams error: ${error.message}`);
    next(error);
  }
};

// Get exam status for a specific user (public access)
const getExamStatusForUser = async (req, res, next) => {
  try {
    const examId = req.params.id;
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

    let hasSubmitted = false;
    let submittedAt = null;
    let score = null;

    if (req.user) {
      const existingResult = exam.results.find(r => r.userId && r.userId.toString() === req.user.id);
      if (existingResult) {
        hasSubmitted = true;
        submittedAt = existingResult.submittedAt;
        score = existingResult.score;
      }
    }

    const canStart = ['live', 'ongoing'].includes(exam.status) && !hasSubmitted;

    res.json({
      success: true,
      examId,
      status: exam.status,
      canStart,
      hasSubmitted,
      submittedAt,
      score,
    });
  } catch (error) {
    logger.error(`Get exam status error: ${error.message}`, { examId: req.params.id });
    next(error);
  }
};

// Get user's exam history and results
const getUserExamHistory = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const userId = req.user.id;
    const exams = await Exam.find({
      'results.userId': userId,
    })
      .populate('invigilator', 'profile.name email')
      .sort({ 'results.submittedAt': -1 });

    const examHistory = exams
      .map(exam => {
        const userResult = exam.results.find(r => r.userId && r.userId.toString() === userId);
        if (!userResult) return null;

        return {
          examId: exam._id,
          title: exam.title,
          description: exam.description,
          subject: exam.subject || 'General',
          scheduledDate: exam.scheduledDate,
          duration: exam.duration,
          submittedAt: userResult.submittedAt,
          score: userResult.score || 0,
          totalQuestions: userResult.totalQuestions || exam.questions.length,
          correctAnswers: userResult.correctAnswers || 0,
          timeTaken: userResult.timeTaken || 0,
          passed: (userResult.score || 0) >= 60,
          status: exam.status,
          invigilator: exam.invigilator,
          questionResults: userResult.questionResults || [],
        };
      })
      .filter(Boolean);

    const totalExams = examHistory.length;
    const averageScore = totalExams > 0
      ? Math.round(examHistory.reduce((sum, exam) => sum + exam.score, 0) / totalExams)
      : 0;
    const passedExams = examHistory.filter(exam => exam.passed).length;
    const failedExams = totalExams - passedExams;
    const totalQuestionsAnswered = examHistory.reduce((sum, exam) => sum + exam.totalQuestions, 0);
    const totalCorrectAnswers = examHistory.reduce((sum, exam) => sum + exam.correctAnswers, 0);

    logger.info(`Exam history retrieved for user ${userId}: ${totalExams} exams found`);

    res.json({
      success: true,
      examHistory,
      summary: {
        totalExams,
        averageScore,
        passedExams,
        failedExams,
        passRate: totalExams > 0 ? Math.round((passedExams / totalExams) * 100) : 0,
        totalQuestionsAnswered,
        totalCorrectAnswers,
        accuracy: totalQuestionsAnswered > 0 ? Math.round((totalCorrectAnswers / totalQuestionsAnswered) * 100) : 0,
      },
    });
  } catch (error) {
    logger.error(`Get user exam history error: ${error.message}`, { userId: req.user?.id });
    next(error);
  }
};

module.exports = {
  createExam,
  scheduleExamOneMonthLater,
  submitExam,
  getAllExams,
  getExam,
  startExam,
  updateExamStatus,
  getExamStatusForUser,
  getUserExamHistory,
  deleteExam,
  cleanupAbandonedExams,
};