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

    // Convert answers object to array format expected by backend
    let answersArray = [];
    if (Array.isArray(answers)) {
      answersArray = answers;
    } else if (typeof answers === 'object') {
      // Handle case where answers is an object with numeric keys
      answersArray = Object.values(answers);
    } else {
      console.error('Invalid answers format:', answers);
      return res.status(400).json({ message: 'Invalid answers format' });
    }

    // Ensure answersArray has the correct length
    const exam = await Exam.findById(id);
    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }

    while (answersArray.length < exam.questions.length) {
      answersArray.push(''); // Add empty answers for unanswered questions
    }
    answersArray = answersArray.slice(0, exam.questions.length); // Trim if too long

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
      const userAnswer = answersArray[i] || '';
      
      // Extract the letter from user's answer (e.g., "B. Short-lived" -> "B")
      const userAnswerLetter = userAnswer && userAnswer.length > 0 ? userAnswer.charAt(0).toUpperCase() : '';
      const isCorrect = userAnswerLetter === question.correctAnswer;

      if (isCorrect) {
        score += question.marks;
      }

      // Generate static explanation instead of using Gemini API
      let explanation = '';
      try {
        // Static explanations based on question content
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
        console.error('Error generating static explanation:', error);
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
        userAnswer, // Keep the full answer text for display
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
      const progress = await Progress.findOne({ user: req.user._id });
      if (progress) {
        // Use the Progress model's updateExamProgress method
        const examResult = {
          status: percentage >= 40 ? 'passed' : 'failed', // Assuming 40% pass mark
          percentage: percentage,
          score: score,
          timeTaken: timeTaken,
          duration: exam.duration
        };

        const xpAwarded = progress.updateExamProgress(examResult);
        
        // Check and award badges
        const newBadges = progress.checkAndAwardBadges();
        
        await progress.save();

        res.json({
          score: score, // Raw score (number of correct answers)
          percentage: percentage, // Percentage score
          totalQuestions,
          correctAnswers: questionResults.filter(q => q.isCorrect).length,
          questionResults,
          timeTaken,
          averageTimePerQuestion: avgTimePerQuestion,
          xpEarned: xpAwarded,
          newBadges
        });
      } else {
        // Create progress record if it doesn't exist
        const examResult = {
          status: percentage >= 40 ? 'passed' : 'failed',
          percentage: percentage,
          score: score,
          timeTaken: timeTaken,
          duration: exam.duration
        };

        const newProgress = new Progress({
          user: req.user._id,
          experiencePoints: 0,
          examsCompleted: 0,
          badges: []
        });

        const xpAwarded = newProgress.updateExamProgress(examResult);
        const newBadges = newProgress.checkAndAwardBadges();
        
        await newProgress.save();

        res.json({
          score: score, // Raw score (number of correct answers)
          percentage: percentage, // Percentage score
          totalQuestions,
          correctAnswers: questionResults.filter(q => q.isCorrect).length,
          questionResults,
          timeTaken,
          averageTimePerQuestion: avgTimePerQuestion,
          xpEarned: xpAwarded,
          newBadges
        });
      }
    } else {
      // For anonymous users, just return the results without saving
      res.json({
        score: score, // Raw score (number of correct answers)
        percentage: percentage, // Percentage score
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

// Get user's exam history and results
const getUserExamHistory = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const userId = req.user.id;

    // Find all exams where the user has submitted results
    const exams = await Exam.find({
      results: { $elemMatch: { userId: userId } }
    })
      .populate('invigilator', 'profile.name email')
      .sort({ 'results.submittedAt': -1 });

    // Format the results for the frontend
    const examHistory = exams.map(exam => {
      const userResult = exam.results.find(r => r.userId.toString() === userId);
      
      return {
        examId: exam._id,
        title: exam.title,
        description: exam.description,
        subject: exam.subject,
        scheduledDate: exam.scheduledDate,
        duration: exam.duration,
        submittedAt: userResult.submittedAt,
        score: userResult.score,
        status: exam.status,
        invigilator: exam.invigilator
      };
    });

    // Calculate summary statistics
    const totalExams = examHistory.length;
    const averageScore = totalExams > 0 
      ? Math.round(examHistory.reduce((sum, exam) => sum + exam.score, 0) / totalExams)
      : 0;
    const passedExams = examHistory.filter(exam => exam.score >= 40).length; // Assuming 40% pass mark
    const failedExams = totalExams - passedExams;

    res.json({
      success: true,
      examHistory,
      summary: {
        totalExams,
        averageScore,
        passedExams,
        failedExams,
        passRate: totalExams > 0 ? Math.round((passedExams / totalExams) * 100) : 0
      }
    });
  } catch (error) {
    logger.error(`Get user exam history error: ${error.message}`);
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
  getUserExamHistory,
  deleteExam,
  cleanupAbandonedExams
};
