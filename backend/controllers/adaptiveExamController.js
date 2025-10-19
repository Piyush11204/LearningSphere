const AdaptiveExam = require('../models/AdaptiveExam');
const Progress = require('../models/Progress');
const User = require('../models/User');
const axios = require('axios');

const ADAPTIVE_API_BASE_URL = 'https://adaptive-exam-model.onrender.com/api';

// Badge milestones for adaptive exams
const ADAPTIVE_BADGES = [
  { id: 'adaptive_first', name: 'First Adaptive Attempt', icon: '🎯', description: 'Completed your first adaptive exam', threshold: 1 },
  { id: 'adaptive_persistent', name: 'Persistent Learner', icon: '📚', description: 'Completed 5 adaptive exams', threshold: 5 },
  { id: 'adaptive_dedicated', name: 'Dedicated Student', icon: '🌟', description: 'Completed 10 adaptive exams', threshold: 10 },
  { id: 'adaptive_master', name: 'Master Learner', icon: '🏆', description: 'Completed 25 adaptive exams', threshold: 25 },
  { id: 'adaptive_legend', name: 'Adaptive Legend', icon: '👑', description: 'Completed 50 adaptive exams', threshold: 50 },
  { id: 'adaptive_accuracy_80', name: 'Accuracy Expert', icon: '🎓', description: 'Achieved 80%+ accuracy', threshold: 'accuracy_80' },
  { id: 'adaptive_ability_high', name: 'High Ability', icon: '⚡', description: 'Reached ability level 2.0+', threshold: 'ability_2' }
];

// Calculate XP based on performance
const calculateXP = (exam) => {
  let xp = 0;
  
  // Base XP for completion
  xp += 50;
  
  // XP for correct answers (10 XP per correct)
  xp += exam.correctAnswers * 10;
  
  // Accuracy bonus
  if (exam.accuracy >= 90) {
    xp += 100; // Excellent
  } else if (exam.accuracy >= 80) {
    xp += 75; // Great
  } else if (exam.accuracy >= 70) {
    xp += 50; // Good
  } else if (exam.accuracy >= 60) {
    xp += 25; // Fair
  }
  
  // Difficulty multiplier bonus
  const diffBreakdown = exam.difficultyBreakdown;
  if (diffBreakdown.difficult.correct > 0) {
    xp += diffBreakdown.difficult.correct * 20; // Bonus for difficult questions
  }
  if (diffBreakdown.moderate.correct > 0) {
    xp += diffBreakdown.moderate.correct * 10; // Bonus for moderate questions
  }
  
  // Speed bonus (if average time per question < 15 seconds)
  if (exam.averageTimePerQuestion < 15 && exam.accuracy >= 70) {
    xp += 50;
  }
  
  // Ability level bonus
  if (exam.finalAbility >= 2.0) {
    xp += 100;
  } else if (exam.finalAbility >= 1.5) {
    xp += 50;
  }
  
  return Math.round(xp);
};

// Award badges based on exam performance
const awardBadges = async (userId, exam) => {
  const progress = await Progress.findOne({ user: userId });
  if (!progress) return [];
  
  const newBadges = [];
  const existingBadgeIds = progress.badges.map(b => b.id);
  
  // Get total completed adaptive exams
  const totalExams = await AdaptiveExam.getUserExamCount(userId);
  
  // Check milestone badges
  for (const badge of ADAPTIVE_BADGES) {
    if (existingBadgeIds.includes(badge.id)) continue;
    
    let shouldAward = false;
    
    if (typeof badge.threshold === 'number') {
      shouldAward = totalExams >= badge.threshold;
    } else if (badge.threshold === 'accuracy_80') {
      shouldAward = exam.accuracy >= 80;
    } else if (badge.threshold === 'ability_2') {
      shouldAward = exam.finalAbility >= 2.0;
    }
    
    if (shouldAward) {
      const newBadge = {
        id: badge.id,
        name: badge.name,
        icon: badge.icon,
        description: badge.description,
        category: 'adaptive_exam',
        earnedAt: new Date()
      };
      
      progress.badges.push(newBadge);
      newBadges.push(newBadge);
    }
  }
  
  if (newBadges.length > 0) {
    await progress.save();
  }
  
  return newBadges;
};

// Update user progress with XP
const updateUserProgress = async (userId, xpEarned) => {
  const progress = await Progress.findOne({ user: userId });
  if (!progress) return;
  
  progress.experiencePoints += xpEarned;
  
  // Calculate new level (1000 XP per level)
  const newLevel = Math.floor(progress.experiencePoints / 1000) + 1;
  if (newLevel > progress.currentLevel) {
    progress.currentLevel = newLevel;
  }
  
  await progress.save();
  return progress;
};

// Start a new adaptive exam
exports.startAdaptiveExam = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { duration } = req.body; // Duration in minutes
    
    // Validate duration
    const examDuration = duration && duration >= 5 && duration <= 120 ? duration : 20; // Default 20 minutes
    
    // Check for active session
    const activeExam = await AdaptiveExam.findOne({
      user: userId,
      status: 'active'
    });
    
    if (activeExam) {
      return res.status(400).json({
        success: false,
        error: 'You already have an active exam session. Please complete or abandon it first.',
        sessionId: activeExam.sessionId
      });
    }
    
    // Get user's last ability level
    const lastAbility = await AdaptiveExam.getLastUserAbility(userId);
    
    // Start exam with external API
    const apiResponse = await axios.post(`${ADAPTIVE_API_BASE_URL}/adaptive/start`, {
      user_id: userId
    });
    
    if (!apiResponse.data.success) {
      throw new Error('Failed to start adaptive exam');
    }
    
    const { session_id, question, user_ability } = apiResponse.data;
    
    // Get exam count for this user
    const examCount = await AdaptiveExam.getUserExamCount(userId);
    
    // Create new exam session in our database
    const exam = new AdaptiveExam({
      user: userId,
      sessionId: session_id,
      initialAbility: lastAbility,
      currentAbility: user_ability,
      examNumber: examCount + 1,
      duration: examDuration
    });
    
    await exam.save();
    
    res.json({
      success: true,
      sessionId: session_id,
      examNumber: examCount + 1,
      duration: examDuration,
      question: {
        id: question.id,
        question: question.question,
        options: question.options,
        difficulty: question.difficulty,
        difficultyNumeric: question.difficulty_numeric
      },
      userAbility: user_ability,
      previousAbility: lastAbility
    });
    
  } catch (error) {
    console.error('Error starting adaptive exam:', error);
    next(error);
  }
};

// Submit an answer
exports.submitAnswer = async (req, res, next) => {
  try {
    const { sessionId, questionId, answer, timeSpent } = req.body;
    const userId = req.user.id;
    
    // Validate input
    if (!sessionId || !questionId || answer === undefined || !timeSpent) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: sessionId, questionId, answer, timeSpent'
      });
    }
    
    // Find exam session
    const exam = await AdaptiveExam.findOne({
      sessionId,
      user: userId,
      status: 'active'
    });
    
    if (!exam) {
      return res.status(404).json({
        success: false,
        error: 'Exam session not found or already completed'
      });
    }

    // Store ability before submitting
    const abilityBefore = exam.currentAbility;
    
    // Submit to external API
    const apiResponse = await axios.post(`${ADAPTIVE_API_BASE_URL}/adaptive/submit`, {
      session_id: sessionId,
      question_id: questionId,
      answer: answer,
      time_spent: parseFloat(timeSpent)
    });
    
    if (!apiResponse.data.success) {
      throw new Error('Failed to submit answer');
    }
    
    const { is_correct, correct_answer, user_ability, next_question, quiz_complete } = apiResponse.data;
    
    // Add response to exam
    await exam.addResponse({
      questionId,
      question: req.body.questionText || '', // Frontend should send this
      options: req.body.questionOptions || {}, // Frontend should send this
      difficulty: req.body.difficulty || '',
      difficultyNumeric: req.body.difficultyNumeric || 0,
      userAnswer: answer,
      correctAnswer: correct_answer,
      isCorrect: is_correct,
      timeSpent: parseFloat(timeSpent),
      abilityBefore: abilityBefore,
      abilityAfter: user_ability
    });
    
    // Check if quiz is complete
    if (quiz_complete) {
      // Complete the exam
      await exam.completeExam(user_ability);
      
      // Calculate XP
      const xpEarned = calculateXP(exam);
      exam.xpEarned = xpEarned;
      
      // Award badges
      const newBadges = await awardBadges(userId, exam);
      exam.badgesEarned = newBadges.map(b => b.id);
      
      await exam.save();
      
      // Update user progress
      await updateUserProgress(userId, xpEarned);
      
      return res.json({
        success: true,
        isCorrect: is_correct,
        correctAnswer: correct_answer,
        userAbility: user_ability,
        quizComplete: true,
        results: {
          totalQuestions: exam.totalQuestions,
          correctAnswers: exam.correctAnswers,
          accuracy: exam.accuracy,
          finalAbility: exam.finalAbility,
          xpEarned,
          badgesEarned: newBadges,
          timeSpent: exam.totalTimeSeconds
        }
      });
    }
    
    // Return next question
    res.json({
      success: true,
      isCorrect: is_correct,
      correctAnswer: correct_answer,
      userAbility: user_ability,
      nextQuestion: {
        id: next_question.id,
        question: next_question.question,
        options: next_question.options,
        difficulty: next_question.difficulty,
        difficultyNumeric: next_question.difficulty_numeric
      },
      progress: {
        questionsAnswered: exam.totalQuestions,
        correctAnswers: exam.correctAnswers,
        currentAccuracy: exam.accuracy
      }
    });
    
  } catch (error) {
    console.error('Error submitting answer:', error);
    next(error);
  }
};

// Get exam analytics
exports.getExamAnalytics = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.id;
    
    const exam = await AdaptiveExam.findOne({
      sessionId,
      user: userId
    });
    
    if (!exam) {
      return res.status(404).json({
        success: false,
        error: 'Exam not found'
      });
    }
    
    // Get full badge details
    const progress = await Progress.findOne({ user: userId });
    const earnedBadges = [];
    if (progress && exam.badgesEarned && exam.badgesEarned.length > 0) {
      for (const badgeId of exam.badgesEarned) {
        const badge = progress.badges.find(b => b.id === badgeId);
        if (badge) {
          earnedBadges.push(badge);
        }
      }
    }

    res.json({
      success: true,
      analytics: {
        sessionId: exam.sessionId,
        status: exam.status,
        examNumber: exam.examNumber,
        totalQuestions: exam.totalQuestions,
        correctAnswers: exam.correctAnswers,
        wrongAnswers: exam.wrongAnswers,
        accuracy: exam.accuracy,
        totalTimeSpent: exam.totalTimeSeconds, // Changed from totalTimeSeconds
        averageTimePerQuestion: exam.averageTimePerQuestion,
        timeStats: {
          fastest: exam.fastestAnswer || 0,
          average: exam.averageTimePerQuestion || 0,
          slowest: exam.slowestAnswer || 0
        },
        initialAbility: exam.initialAbility,
        finalAbility: exam.finalAbility || exam.currentAbility,
        abilityChange: (exam.finalAbility || exam.currentAbility) - exam.initialAbility,
        difficultyBreakdown: exam.difficultyBreakdown,
        xpEarned: exam.xpEarned || 0,
        badgesEarned: exam.badgesEarned || [],
        earnedBadges: earnedBadges, // Full badge objects
        responses: exam.responses,
        startTime: exam.startTime,
        endTime: exam.endTime
      }
    });
    
  } catch (error) {
    console.error('Error getting exam analytics:', error);
    next(error);
  }
};

// Get user's exam history (all sessions)
exports.getExamHistory = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { limit = 10, skip = 0, status } = req.query;
    
    // Build query
    const query = { user: userId };
    
    // Filter by status if provided
    if (status && ['completed', 'abandoned', 'time_expired', 'active'].includes(status)) {
      query.status = status;
    } else {
      // By default, show completed and time_expired (not active or abandoned)
      query.status = { $in: ['completed', 'time_expired'] };
    }
    
    const exams = await AdaptiveExam.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip))
      .select('-responses'); // Exclude detailed responses for list view
    
    const totalExams = await AdaptiveExam.countDocuments(query);
    
    res.json({
      success: true,
      exams,
      totalExams,
      hasMore: (parseInt(skip) + exams.length) < totalExams
    });
    
  } catch (error) {
    console.error('Error getting exam history:', error);
    next(error);
  }
};

// Abandon active exam (with option to save results)
exports.abandonExam = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const { saveResults } = req.body; // Optional: save results instead of abandoning
    const userId = req.user.id;
    
    const exam = await AdaptiveExam.findOne({
      sessionId,
      user: userId,
      status: 'active'
    });
    
    if (!exam) {
      return res.status(404).json({
        success: false,
        error: 'Active exam not found'
      });
    }
    
    // If saveResults is true, complete the exam with current progress
    if (saveResults) {
      exam.status = 'completed';
      exam.endTime = new Date();
      exam.finalAbility = exam.currentAbility;
      
      // Calculate XP based on current progress
      const xpEarned = calculateXP(exam);
      exam.xpEarned = xpEarned;
      
      // Award badges
      const newBadges = await awardBadges(userId, exam);
      exam.badgesEarned = newBadges.map(b => b.id);
      
      await exam.save();
      
      // Update user progress
      await updateUserProgress(userId, xpEarned);
      
      return res.json({
        success: true,
        message: 'Exam ended successfully',
        results: {
          sessionId: exam.sessionId,
          totalQuestions: exam.totalQuestions,
          correctAnswers: exam.correctAnswers,
          accuracy: exam.accuracy,
          finalAbility: exam.finalAbility,
          xpEarned,
          badgesEarned: newBadges
        }
      });
    } else {
      // Just abandon without saving
      exam.status = 'abandoned';
      exam.endTime = new Date();
      await exam.save();
      
      return res.json({
        success: true,
        message: 'Exam abandoned successfully'
      });
    }
    
  } catch (error) {
    console.error('Error handling exam end:', error);
    next(error);
  }
};

// Get user's adaptive exam stats
exports.getUserStats = async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    const completedExams = await AdaptiveExam.find({
      user: userId,
      status: 'completed'
    });
    
    if (completedExams.length === 0) {
      return res.json({
        success: true,
        stats: {
          totalExams: 0,
          averageAccuracy: 0,
          averageAbility: 0,
          highestAbility: 0,
          totalQuestions: 0,
          totalCorrectAnswers: 0,
          totalXP: 0,
          badgesEarned: 0
        }
      });
    }
    
    const stats = {
      totalExams: completedExams.length,
      averageAccuracy: completedExams.reduce((sum, e) => sum + e.accuracy, 0) / completedExams.length,
      averageAbility: completedExams.reduce((sum, e) => sum + (e.finalAbility || 0), 0) / completedExams.length,
      highestAbility: Math.max(...completedExams.map(e => e.finalAbility || 0)),
      totalQuestions: completedExams.reduce((sum, e) => sum + e.totalQuestions, 0),
      totalCorrectAnswers: completedExams.reduce((sum, e) => sum + e.correctAnswers, 0),
      totalXP: completedExams.reduce((sum, e) => sum + (e.xpEarned || 0), 0),
      badgesEarned: [...new Set(completedExams.flatMap(e => e.badgesEarned))].length,
      recentExams: completedExams.slice(0, 5).map(e => ({
        sessionId: e.sessionId,
        examNumber: e.examNumber,
        accuracy: e.accuracy,
        finalAbility: e.finalAbility,
        xpEarned: e.xpEarned,
        completedAt: e.endTime
      }))
    };
    
    res.json({
      success: true,
      stats
    });
    
  } catch (error) {
    console.error('Error getting user stats:', error);
    next(error);
  }
};

// Get active session
exports.getActiveSession = async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    const activeExam = await AdaptiveExam.findOne({
      user: userId,
      status: 'active'
    });
    
    if (!activeExam) {
      return res.json({
        success: true,
        activeSession: null
      });
    }
    
    res.json({
      success: true,
      activeSession: {
        sessionId: activeExam.sessionId,
        examNumber: activeExam.examNumber,
        totalQuestions: activeExam.totalQuestions,
        correctAnswers: activeExam.correctAnswers,
        accuracy: activeExam.accuracy,
        currentAbility: activeExam.currentAbility,
        startTime: activeExam.startTime
      }
    });
    
  } catch (error) {
    console.error('Error getting active session:', error);
    next(error);
  }
};

// Resume active session
exports.resumeActiveSession = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.id;
    
    const exam = await AdaptiveExam.findOne({
      sessionId,
      user: userId,
      status: 'active'
    });
    
    if (!exam) {
      return res.status(404).json({
        success: false,
        error: 'Active exam session not found'
      });
    }
    
    // Get next question from external API
    try {
      const apiResponse = await axios.get(`${ADAPTIVE_API_BASE_URL}/adaptive/resume/${sessionId}`);
      
      if (apiResponse.data.success && apiResponse.data.question) {
        // External API supports resume
        return res.json({
          success: true,
          sessionId: exam.sessionId,
          examNumber: exam.examNumber,
          question: {
            id: apiResponse.data.question.id,
            question: apiResponse.data.question.question,
            options: apiResponse.data.question.options,
            difficulty: apiResponse.data.question.difficulty,
            difficultyNumeric: apiResponse.data.question.difficulty_numeric
          },
          userAbility: exam.currentAbility,
          previousAbility: exam.initialAbility
        });
      }
    } catch (apiError) {
      console.log('External API does not support resume, starting new question');
    }
    
    // If external API doesn't support resume, we need to restart
    // In this case, abandon the old session and prompt to start new
    return res.status(400).json({
      success: false,
      error: 'Cannot resume session. Please abandon and start a new exam.',
      requiresNewSession: true
    });
    
  } catch (error) {
    console.error('Error resuming session:', error);
    next(error);
  }
};
