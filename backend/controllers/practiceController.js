const PracticeSession = require('../models/PracticeSession');
const Question = require('../models/Question');
const startPracticeSession = async (req, res) => {
  try {
    const { duration = 60 } = req.body; // Default 60 minutes

    const startTime = new Date();
    const endTime = new Date(startTime.getTime() + duration * 60000);

    // Get initial question (Easy difficulty)
    const initialQuestion = await Question.findOne({
      isActive: true,
      difficulty: 'Easy'
    }).sort({ createdAt: -1 });

    if (!initialQuestion) {
      return res.status(404).json({ message: 'No questions available' });
    }

    const session = new PracticeSession({
      userId: req.user.id,
      startTime,
      endTime,
      duration,
      questions: [{
        questionId: initialQuestion._id,
        answeredAt: null
      }],
      currentQuestionIndex: 0,
      currentDifficulty: 'Easy',
      status: 'active'
    });

    await session.save();

    res.json({
      sessionId: session._id,
      question: {
        id: initialQuestion.id,
        question_text: initialQuestion.question_text,
        option_a: initialQuestion.option_a,
        option_b: initialQuestion.option_b,
        option_c: initialQuestion.option_c,
        option_d: initialQuestion.option_d,
        difficulty: initialQuestion.difficulty,
        tags: initialQuestion.tags
      },
      timeRemaining: duration * 60, // in seconds
      currentScore: 0
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get next question based on performance
const getNextQuestion = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { userAnswer, timeTaken } = req.body;
    
    const session = await PracticeSession.findById(sessionId).populate('questions.questionId');
    if (!session || session.userId.toString() !== req.user.id) {
      return res.status(404).json({ message: 'Session not found' });
    }
    
    if (session.status !== 'active') {
      return res.status(400).json({ message: 'Session is not active' });
    }
    
    // Check if session has expired
    if (new Date() > session.endTime) {
      session.status = 'expired';
      await session.save();
      return res.status(400).json({ message: 'Session has expired' });
    }
    
    const currentQuestionIndex = session.currentQuestionIndex;
    const currentQuestion = session.questions[currentQuestionIndex];
    
    // Update current question with user's answer
    if (userAnswer) {
      const isCorrect = userAnswer === currentQuestion.questionId.answer;
      currentQuestion.userAnswer = userAnswer;
      currentQuestion.isCorrect = isCorrect;
      currentQuestion.timeTaken = timeTaken;
      currentQuestion.answeredAt = new Date();
      
      session.correctAnswers += isCorrect ? 1 : 0;
      session.totalQuestions += 1;
      
      // Update question statistics
      await Question.findByIdAndUpdate(currentQuestion.questionId._id, {
        $inc: { 
          totalAttempts: 1,
          correctAttempts: isCorrect ? 1 : 0
        }
      });
      
      // Recalculate success rate
      const question = await Question.findById(currentQuestion.questionId._id);
      question.successRate = (question.correctAttempts / question.totalAttempts) * 100;
      await question.save();
      
      // Adjust difficulty for next question
      if (isCorrect) {
        // Increase difficulty
        const difficulties = ['Very easy', 'Easy', 'Moderate', 'Difficult'];
        const currentIndex = difficulties.indexOf(session.currentDifficulty);
        session.currentDifficulty = difficulties[Math.min(currentIndex + 1, difficulties.length - 1)];
      } else {
        // Decrease difficulty
        const difficulties = ['Very easy', 'Easy', 'Moderate', 'Difficult'];
        const currentIndex = difficulties.indexOf(session.currentDifficulty);
        session.currentDifficulty = difficulties[Math.max(currentIndex - 1, 0)];
      }
    }
    
    // Get next question
    const nextQuestion = await Question.findOne({
      isActive: true,
      difficulty: session.currentDifficulty,
      _id: { $nin: session.questions.map(q => q.questionId._id) }
    }).sort({ createdAt: -1 });
    
    if (!nextQuestion) {
      // No more questions available, end session
      session.status = 'completed';
      session.xpEarned = session.correctAnswers * 10;
      await session.save();

      // Update user stats and award badges/XP
      const User = require('../models/User');
      const user = await User.findById(req.user.id);

      // Ensure experiencePoints is initialized
      if (!user.experiencePoints) {
        user.experiencePoints = {
          total: 0,
          fromPractice: 0,
          fromExams: 0,
          level: 1
        };
      }

      // Ensure practiceExamHistory and badges arrays exist
      if (!user.practiceExamHistory) {
        user.practiceExamHistory = [];
      }
      if (!user.badges) {
        user.badges = [];
      }

      // Calculate accuracy
      const accuracy = session.totalQuestions > 0 ? (session.correctAnswers / session.totalQuestions) * 100 : 0;

      // Add to practice exam history
      user.practiceExamHistory.push({
        sessionId: session._id,
        score: session.correctAnswers,
        totalQuestions: session.totalQuestions,
        correctAnswers: session.correctAnswers,
        accuracy: Math.round(accuracy * 100) / 100,
        xpEarned: session.xpEarned,
        duration: session.duration,
        status: 'completed'
      });

      // Update practice exam stats
      user.updatePracticeExamStats();

      // Award badges
      const newBadges = user.awardPracticeBadges();

      // Update experience points
      user.updateExperiencePoints(session.xpEarned, 'practice');

      await user.save();

      return res.json({
        completed: true,
        score: session.correctAnswers,
        totalQuestions: session.totalQuestions,
        xpEarned: session.xpEarned,
        accuracy: Math.round(accuracy * 100) / 100,
        newBadges: newBadges,
        totalXP: user.experiencePoints?.total || 0,
        level: user.experiencePoints?.level || 1
      });
    }
    
    // Add next question to session
    session.questions.push({
      questionId: nextQuestion._id,
      answeredAt: null
    });
    session.currentQuestionIndex += 1;
    
    await session.save();
    
    const timeRemaining = Math.max(0, Math.floor((session.endTime - new Date()) / 1000));
    
    res.json({
      question: {
        id: nextQuestion.id,
        question_text: nextQuestion.question_text,
        option_a: nextQuestion.option_a,
        option_b: nextQuestion.option_b,
        option_c: nextQuestion.option_c,
        option_d: nextQuestion.option_d,
        difficulty: nextQuestion.difficulty,
        tags: nextQuestion.tags
      },
      timeRemaining,
      currentScore: session.correctAnswers,
      questionNumber: session.currentQuestionIndex + 1
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// End practice session
const endPracticeSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const session = await PracticeSession.findById(sessionId);
    if (!session || session.userId.toString() !== req.user.id) {
      return res.status(404).json({ message: 'Session not found' });
    }
    
    session.status = 'completed';
    session.xpEarned = session.correctAnswers * 10;
    await session.save();
    
    // Update user stats and award badges/XP
    const User = require('../models/User');
    const user = await User.findById(req.user.id);

    // Ensure experiencePoints is initialized
    if (!user.experiencePoints) {
      user.experiencePoints = {
        total: 0,
        fromPractice: 0,
        fromExams: 0,
        level: 1
      };
    }

    // Ensure practiceExamHistory and badges arrays exist
    if (!user.practiceExamHistory) {
      user.practiceExamHistory = [];
    }
    if (!user.badges) {
      user.badges = [];
    }

    // Calculate accuracy
    const accuracy = session.totalQuestions > 0 ? (session.correctAnswers / session.totalQuestions) * 100 : 0;

    // Add to practice exam history
    user.practiceExamHistory.push({
      sessionId: session._id,
      score: session.correctAnswers,
      totalQuestions: session.totalQuestions,
      correctAnswers: session.correctAnswers,
      accuracy: Math.round(accuracy * 100) / 100,
      xpEarned: session.xpEarned,
      duration: session.duration,
      status: 'completed'
    });

    // Update practice exam stats
    user.updatePracticeExamStats();

    // Award badges
    const newBadges = user.awardPracticeBadges();

    // Update experience points
    user.updateExperiencePoints(session.xpEarned, 'practice');

    // Update Progress model for regular practice session
    const Progress = require('../models/Progress');
    let progress = await Progress.findOne({ user: req.user.id });
    if (!progress) {
      progress = new Progress({ user: req.user.id });
    }

    // Add regular practice session
    progress.sessionsCompleted += 1;
    progress.normalSessionsCompleted += 1;
    progress.totalHours += session.duration || 30; // Add time spent
    progress.experiencePoints += session.xpEarned;

    // Update streak
    const today = new Date();
    const lastActivity = progress.streak.lastActivity;
    
    if (lastActivity) {
      const daysDiff = Math.floor((today - lastActivity) / (1000 * 60 * 60 * 24));
      if (daysDiff === 1) {
        progress.streak.current += 1;
        if (progress.streak.current > progress.streak.longest) {
          progress.streak.longest = progress.streak.current;
        }
      } else if (daysDiff > 1) {
        progress.streak.current = 1;
      }
    } else {
      progress.streak.current = 1;
    }
    progress.streak.lastActivity = today;

    // Check and award badges
    const newProgressBadges = progress.checkAndAwardBadges();
    
    // Update level after badge XP is added
    progress.currentLevel = Math.floor(progress.experiencePoints / 1000) + 1;

    await progress.save();

    await user.save();

    res.json({
      score: session.correctAnswers,
      totalQuestions: session.totalQuestions,
      xpEarned: session.xpEarned,
      accuracy: Math.round(accuracy * 100) / 100,
      newBadges: newBadges,
      totalXP: user.experiencePoints?.total || 0,
      level: user.experiencePoints?.level || 1
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get practice session results
const getPracticeSessionResults = async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = await PracticeSession.findById(sessionId).populate('questions.questionId');
    if (!session || session.userId.toString() !== req.user.id) {
      return res.status(404).json({ message: 'Session not found' });
    }

    // Format questions with answers - include all questions but mark answered status properly
    const questions = session.questions.map(q => ({
      question_text: q.questionId.question_text,
      difficulty: q.questionId.difficulty,
      tags: q.questionId.tags,
      userAnswer: q.userAnswer,
      correctAnswer: q.questionId.answer,
      correct: q.isCorrect,
      timeTaken: q.timeTaken,
      answered: !!q.answeredAt // Use answeredAt to determine if question was attempted
    }));

    // Calculate actual totals from answered questions only
    const answeredQuestions = session.questions.filter(q => q.answeredAt);
    const actualCorrectAnswers = answeredQuestions.filter(q => q.isCorrect).length;
    const actualTotalQuestions = answeredQuestions.length;

    // Get user data for badges and XP info
    const User = require('../models/User');
    const user = await User.findById(req.user.id);

    // Ensure experiencePoints is initialized
    if (!user.experiencePoints) {
      user.experiencePoints = {
        total: 0,
        fromPractice: 0,
        fromExams: 0,
        level: 1
      };
      await user.save();
    }

    // Ensure practiceExamHistory and badges arrays exist
    if (!user.practiceExamHistory) {
      user.practiceExamHistory = [];
    }
    if (!user.badges) {
      user.badges = [];
    }

    // Initialize default values
    let newBadges = [];
    let levelUp = false;
    let newLevel = user.experiencePoints.level;

    if (session.status === 'completed') {
      // Find this session in user's practice history
      const sessionHistory = user.practiceExamHistory.find(h =>
        h.sessionId.toString() === sessionId
      );

      if (sessionHistory) {
        // Check if badges were earned in this session
        const totalCompletedBefore = user.practiceExamHistory
          .filter(h => h.status === 'completed' &&
                  new Date(h.completedAt) < new Date(sessionHistory.completedAt))
          .length;

        // Determine if new badges were earned based on milestone logic
        const totalCompletedNow = totalCompletedBefore + 1;

        const badgeMilestones = [1, 10, 25, 50, 100];
        const earnedBadges = user.badges.filter(b => b.category === 'practice');

        badgeMilestones.forEach(milestone => {
          if (totalCompletedNow >= milestone && totalCompletedBefore < milestone) {
            // Check if this badge was already earned
            const alreadyEarned = earnedBadges.some(badge =>
              badge.name.includes(milestone.toString())
            );
            if (!alreadyEarned) {
              const badgeName = milestone === 1 ? 'First Practice' :
                               `${milestone} Practice Sessions`;
              const badgeDescription = milestone === 1 ?
                'Completed your first practice exam!' :
                `Completed ${milestone} practice sessions!`;

              newBadges.push({
                name: badgeName,
                description: badgeDescription,
                icon: milestone === 1 ? '🎯' :
                      milestone === 10 ? '🔥' :
                      milestone === 25 ? '⭐' :
                      milestone === 50 ? '🏆' : '👑',
                category: 'practice'
              });
            }
          }
        });

        // Check for level up
        const xpBefore = user.experiencePoints.total - session.xpEarned;
        const levelBefore = Math.floor(xpBefore / 1000) + 1;
        const levelAfter = Math.floor(user.experiencePoints.total / 1000) + 1;

        if (levelAfter > levelBefore) {
          levelUp = true;
          newLevel = levelAfter;
        }
      }
    }

    res.json({
      sessionId: session._id,
      startTime: session.startTime,
      endTime: session.endTime,
      duration: session.duration,
      correctAnswers: actualCorrectAnswers,
      totalQuestions: actualTotalQuestions,
      xpEarned: session.xpEarned,
      status: session.status,
      questions,
      newBadges,
      levelUp,
      newLevel: levelUp ? newLevel : (user.experiencePoints?.level || 1),
      currentXP: user.experiencePoints?.total || 0,
      currentLevel: user.experiencePoints?.level || 1
    });
  } catch (error) {
    console.error('Error in getPracticeSessionResults:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get user's practice sessions
const getUserPracticeSessions = async (req, res) => {
  try {
    const sessions = await PracticeSession.find({
      userId: req.user.id
    }).sort({ createdAt: -1 }).limit(10);

    // Add calculated fields for each session
    const sessionsWithStats = sessions.map(session => ({
      ...session.toObject(),
      accuracy: session.totalQuestions > 0 ? Math.round((session.correctAnswers / session.totalQuestions) * 100) : 0
    }));

    res.json(sessionsWithStats);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// SECTIONAL TEST FUNCTIONS

// Start a new sectional test
const startSectionalTest = async (req, res) => {
  try {
    const { sections: selectedSections, sectionIndex } = req.body;

    if (!selectedSections || !Array.isArray(selectedSections) || selectedSections.length === 0) {
      return res.status(400).json({ message: 'No sections selected' });
    }

    // Get the current section to start with
    const currentSectionData = selectedSections[sectionIndex || 0];
    if (!currentSectionData) {
      return res.status(400).json({ message: 'Invalid section index' });
    }

    // Get 10 questions for the current section
    const questions = await Question.find({
      isActive: true,
      difficulty: currentSectionData.difficulty
    }).sort({ createdAt: -1 }).limit(10);

    if (!questions || questions.length < 10) {
      return res.status(404).json({
        message: `Not enough ${currentSectionData.difficulty} questions available. Found ${questions?.length || 0}, need 10.`
      });
    }

    const startTime = new Date();
    const endTime = new Date(startTime.getTime() + 30 * 60000); // 30 minutes per section

    const session = new PracticeSession({
      userId: req.user.id,
      startTime,
      endTime,
      duration: 30,
      questions: questions.map((q, index) => ({
        questionId: q._id,
        answeredAt: null,
        sectionIndex: sectionIndex || 0,
        questionIndex: index
      })),
      currentQuestionIndex: 0,
      currentDifficulty: currentSectionData.difficulty,
      status: 'active',
      isSectional: true,
      currentSection: currentSectionData.sectionId,
      sections: selectedSections.map((section, idx) => ({
        sectionId: section.sectionId,
        difficulty: section.difficulty,
        questions: idx === (sectionIndex || 0) ? questions.map(q => q._id) : [], // Only load questions for current section
        correct: 0,
        total: 0,
        completed: false,
        passed: false
      }))
    });

    await session.save();

    res.json({
      sessionId: session._id,
      question: {
        id: questions[0].id,
        question_text: questions[0].question_text,
        option_a: questions[0].option_a,
        option_b: questions[0].option_b,
        option_c: questions[0].option_c,
        option_d: questions[0].option_d,
        difficulty: questions[0].difficulty,
        tags: questions[0].tags
      },
      timeRemaining: 30 * 60, // 30 minutes in seconds
      currentScore: 0,
      questionNumber: 1,
      totalQuestions: 10,
      currentSection: currentSectionData.sectionId,
      sections: session.sections
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get next sectional question
const getSectionalQuestion = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { userAnswer, timeTaken } = req.body;

    console.log('getSectionalQuestion called:', { sessionId, userAnswer, timeTaken });

    const session = await PracticeSession.findById(sessionId).populate('questions.questionId');
    if (!session || session.userId.toString() !== req.user.id) {
      console.log('Session not found or unauthorized');
      return res.status(404).json({ message: 'Session not found' });
    }

    // Ensure this is a sectional test session
    if (!session.isSectional) {
      console.log('Session is not a sectional test session');
      return res.status(400).json({ message: 'This endpoint is only for sectional test sessions' });
    }

    if (session.status !== 'active') {
      return res.status(400).json({ message: 'Session is not active' });
    }

    // Check if session has expired
    if (new Date() > session.endTime) {
      session.status = 'expired';
      await session.save();
      return res.status(400).json({ message: 'Session has expired' });
    }

    // Ensure sectional test fields are initialized
    if (!session.sections) {
      session.sections = [];
    }
    if (!session.currentSection) {
      console.log('Session missing currentSection, this should not happen for sectional tests');
      return res.status(400).json({ message: 'Invalid sectional test session' });
    }

    const currentQuestionIndex = session.currentQuestionIndex;
    const currentQuestion = session.questions[currentQuestionIndex];

    console.log('Current question index:', currentQuestionIndex);
    console.log('Current question exists:', !!currentQuestion);
    console.log('Current question populated:', !!(currentQuestion && currentQuestion.questionId));

    // Update current question with user's answer
    if (userAnswer) {
      // Check if currentQuestion and questionId exist
      if (!currentQuestion || !currentQuestion.questionId) {
        console.log('Invalid question data - currentQuestion or questionId missing');
        return res.status(400).json({ message: 'Invalid question data' });
      }

      console.log('Processing answer:', userAnswer, 'Correct answer:', currentQuestion.questionId.answer);
      const isCorrect = userAnswer === currentQuestion.questionId.answer;
      console.log('Answer is correct:', isCorrect);
      currentQuestion.userAnswer = userAnswer;
      currentQuestion.isCorrect = isCorrect;
      currentQuestion.timeTaken = timeTaken;
      currentQuestion.answeredAt = new Date();

    // Update section stats
    const currentSection = session.sections.find(s => s.sectionId === session.currentSection);
    if (!currentSection) {
      console.log('Current section not found in session sections');
      return res.status(400).json({ message: 'Invalid sectional test session - section not found' });
    }

    if (currentSection) {
      currentSection.correct += isCorrect ? 1 : 0;
      currentSection.total += 1;
    }

      // Update question statistics
      try {
        await Question.findByIdAndUpdate(currentQuestion.questionId._id, {
          $inc: {
            totalAttempts: 1,
            correctAttempts: isCorrect ? 1 : 0
          }
        });

        // Recalculate success rate
        const question = await Question.findById(currentQuestion.questionId._id);
        if (question && question.totalAttempts > 0) {
          question.successRate = (question.correctAttempts / question.totalAttempts) * 100;
          await question.save();
        }
      } catch (updateError) {
        console.error('Error updating question statistics:', updateError);
        // Continue execution even if stats update fails
      }
    }

    // Check if section is completed
    const currentSection = session.sections.find(s => s.sectionId === session.currentSection);
    if (!currentSection) {
      console.log('Current section not found when checking completion');
      return res.status(400).json({ message: 'Invalid sectional test session - section not found' });
    }

    if (currentSection && currentSection.total >= 10) {
      // Section completed
      const accuracy = (currentSection.correct / currentSection.total) * 100;
      currentSection.completed = true;
      currentSection.passed = accuracy >= 40;

      console.log('Section completed:', {
        sectionId: currentSection.sectionId,
        correct: currentSection.correct,
        total: currentSection.total,
        accuracy,
        passed: currentSection.passed
      });

      // If section passed, prepare for next section but don't auto-switch
      if (currentSection.passed) {
        const currentSectionIndex = session.sections.findIndex(s => s.sectionId === session.currentSection);
        const nextSectionIndex = currentSectionIndex + 1;
        
        if (nextSectionIndex < session.sections.length) {
          // There are more sections, return section completion info
          return res.json({
            sectionCompleted: true,
            sectionCorrect: currentSection.correct,
            sectionTotal: currentSection.total,
            accuracy: accuracy,
            passed: currentSection.passed,
            hasNextSection: true,
            nextSectionIndex: nextSectionIndex,
            currentSectionIndex: currentSectionIndex
          });
        } else {
          // No more sections, end the test and award XP/badges
          session.status = 'completed';
          const completedSections = session.sections.filter(s => s.completed && s.passed);
          session.xpEarned = completedSections.length * 50;
          await session.save();

          // Award XP and badges for completed sectional test
          const User = require('../models/User');
          const Progress = require('../models/Progress');
          const user = await User.findById(req.user.id);

          if (user) {
            // Update progress model for sectional test
            let progress = await Progress.findOne({ user: req.user.id });
            if (!progress) {
              progress = new Progress({ user: req.user.id });
            }

            // Add sectional test as a session
            progress.sessionsCompleted += 1;
            progress.normalSessionsCompleted += 1; // Count sectional tests as normal sessions
            progress.totalHours += session.duration || 30; // Add time spent
            progress.experiencePoints += session.xpEarned;

            // Update streak
            const today = new Date();
            const lastActivity = progress.streak.lastActivity;
            
            if (lastActivity) {
              const daysDiff = Math.floor((today - lastActivity) / (1000 * 60 * 60 * 24));
              if (daysDiff === 1) {
                progress.streak.current += 1;
                if (progress.streak.current > progress.streak.longest) {
                  progress.streak.longest = progress.streak.current;
                }
              } else if (daysDiff > 1) {
                progress.streak.current = 1;
              }
            } else {
              progress.streak.current = 1;
            }
            progress.streak.lastActivity = today;

            // Check and award badges
            const newProgressBadges = progress.checkAndAwardBadges();
            
            // Update level after badge XP is added
            progress.currentLevel = Math.floor(progress.experiencePoints / 1000) + 1;

            await progress.save();

            // Update sectional test history
            if (!user.sectionalTestHistory) {
              user.sectionalTestHistory = [];
            }

            user.sectionalTestHistory.push({
              sessionId: session._id,
              sections: session.sections.map(section => ({
                sectionId: section.sectionId,
                difficulty: section.difficulty,
                correct: section.correct,
                total: section.total,
                accuracy: (section.total > 0) ? Math.round((section.correct / section.total) * 100) : 0,
                passed: section.passed,
                completed: section.completed
              })),
              totalSections: session.sections.length,
              completedSections: completedSections.length,
              passedSections: completedSections.length,
              xpEarned: session.xpEarned,
              duration: session.duration,
              status: 'completed',
              completedAt: new Date()
            });

            // Update sectional test stats
            user.updateSectionalTestStats();

            // Award sectional test badges
            const newSectionalBadges = user.awardSectionalTestBadges();

            // Combine badges from both models
            const allNewBadges = [...(newProgressBadges || []), ...(newSectionalBadges || [])];

            // Update experience points
            user.updateExperiencePoints(session.xpEarned, 'practice');

            await user.save();
          }

          return res.json({
            sectionCompleted: true,
            sectionCorrect: currentSection.correct,
            sectionTotal: currentSection.total,
            accuracy: accuracy,
            passed: currentSection.passed,
            testCompleted: true,
            xpEarned: session.xpEarned,
            completedSections: completedSections.length,
            newBadges: user ? user.badges.slice(-5) : [] // Last 5 badges (likely the new ones)
          });
        }
      } else {
        // Section not passed, end the test
        session.status = 'completed';
        const completedSections = session.sections.filter(s => s.completed && s.passed);
        session.xpEarned = completedSections.length * 50;
        await session.save();

        return res.json({
          sectionCompleted: true,
          sectionCorrect: currentSection.correct,
          sectionTotal: currentSection.total,
          accuracy: accuracy,
          passed: currentSection.passed,
          testCompleted: true,
          xpEarned: session.xpEarned,
          completedSections: completedSections.length
        });
      }
    }

    // Get next question in current section
    const nextQuestionIndex = currentQuestionIndex + 1;
    const nextQuestion = session.questions[nextQuestionIndex];

    if (!nextQuestion || !nextQuestion.questionId) {
      return res.status(400).json({
        message: `No more questions available in this section. Question at index ${nextQuestionIndex} not found.`
      });
    }

    session.currentQuestionIndex = nextQuestionIndex;
    await session.save();

    const timeRemaining = Math.max(0, Math.floor((session.endTime - new Date()) / 1000));

    console.log('Sending next question response:', {
      questionId: nextQuestion.questionId.id,
      questionNumber: nextQuestionIndex + 1,
      totalQuestions: 10,
      timeRemaining
    });

    res.json({
      question: {
        id: nextQuestion.questionId.id,
        question_text: nextQuestion.questionId.question_text,
        option_a: nextQuestion.questionId.option_a,
        option_b: nextQuestion.questionId.option_b,
        option_c: nextQuestion.questionId.option_c,
        option_d: nextQuestion.questionId.option_d,
        difficulty: nextQuestion.questionId.difficulty,
        tags: nextQuestion.questionId.tags
      },
      timeRemaining,
      currentScore: currentSection ? currentSection.correct : 0,
      questionNumber: nextQuestion.questionIndex + 1,
      totalQuestions: 10
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Switch to next section in sectional test
const switchSectionalSection = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { sectionIndex } = req.body;

    const session = await PracticeSession.findById(sessionId);
    if (!session || session.userId.toString() !== req.user.id) {
      return res.status(404).json({ message: 'Session not found' });
    }

    if (!session.isSectional) {
      return res.status(400).json({ message: 'This endpoint is only for sectional test sessions' });
    }

    if (session.status !== 'active') {
      return res.status(400).json({ message: 'Session is not active' });
    }

    // Check if the requested section exists
    if (!session.sections[sectionIndex]) {
      return res.status(400).json({ message: `Section not found at index ${sectionIndex}. Available sections: ${session.sections.length}` });
    }

    const targetSection = session.sections[sectionIndex];

    // Check if section is already completed
    if (targetSection.completed) {
      return res.status(400).json({ message: 'Section already completed' });
    }

    // Get questions for this section if not already loaded
    if (!targetSection.questions || targetSection.questions.length === 0) {
      const questions = await Question.find({
        isActive: true,
        difficulty: targetSection.difficulty
      }).sort({ createdAt: -1 }).limit(10);

      if (!questions || questions.length < 10) {
        return res.status(404).json({
          message: `Not enough ${targetSection.difficulty} questions available. Found ${questions?.length || 0}, need 10.`
        });
      }

      targetSection.questions = questions.map(q => q._id);

      // Add questions to session.questions array
      const existingQuestionCount = session.questions.length;
      questions.forEach((q, index) => {
        session.questions.push({
          questionId: q._id,
          answeredAt: null,
          sectionIndex: sectionIndex,
          questionIndex: index
        });
      });
    }

    // Update session for new section
    session.currentSection = targetSection.sectionId;
    session.currentQuestionIndex = session.questions.findIndex(q => q.sectionIndex === sectionIndex && q.questionIndex === 0);
    session.currentDifficulty = targetSection.difficulty;

    // Reset timer for new section
    session.startTime = new Date();
    session.endTime = new Date(session.startTime.getTime() + 30 * 60000); // 30 minutes

    await session.save();

    // Get the first question of the new section
    const firstQuestionIndex = session.questions.findIndex(q => q.sectionIndex === sectionIndex && q.questionIndex === 0);
    const firstQuestion = session.questions[firstQuestionIndex];

    if (!firstQuestion || !firstQuestion.questionId) {
      return res.status(500).json({ message: 'Failed to load first question of section' });
    }

    // Populate the question
    await session.populate('questions.questionId');

    res.json({
      sessionId: session._id,
      question: {
        id: firstQuestion.questionId.id,
        question_text: firstQuestion.questionId.question_text,
        option_a: firstQuestion.questionId.option_a,
        option_b: firstQuestion.questionId.option_b,
        option_c: firstQuestion.questionId.option_c,
        option_d: firstQuestion.questionId.option_d,
        difficulty: firstQuestion.questionId.difficulty,
        tags: firstQuestion.questionId.tags
      },
      timeRemaining: 30 * 60, // 30 minutes in seconds
      currentScore: targetSection.correct,
      questionNumber: 1,
      totalQuestions: 10,
      currentSection: targetSection.sectionId,
      sections: session.sections
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// End sectional test
const endSectionalTest = async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = await PracticeSession.findById(sessionId);
    if (!session || session.userId.toString() !== req.user.id) {
      return res.status(404).json({ message: 'Session not found' });
    }

    session.status = 'completed';

    // Calculate total XP from completed sections
    const completedSections = session.sections.filter(s => s.completed && s.passed);
    session.xpEarned = completedSections.length * 50; // 50 XP per completed section

    await session.save();

    res.json({
      message: 'Sectional test ended',
      xpEarned: session.xpEarned,
      completedSections: completedSections.length
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get sectional test results
const getSectionalTestResults = async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = await PracticeSession.findById(sessionId).populate('questions.questionId');
    if (!session || session.userId.toString() !== req.user.id) {
      return res.status(404).json({ message: 'Session not found' });
    }

    // Check if this is a sectional test
    if (!session.isSectional || !session.sections || session.sections.length === 0) {
      return res.status(400).json({ message: 'Invalid sectional test session' });
    }

    // Format questions with answers
    const questions = session.questions
      .filter(q => q.answeredAt) // Only answered questions
      .map(q => ({
        question_text: q.questionId.question_text,
        difficulty: q.questionId.difficulty,
        tags: q.questionId.tags,
        userAnswer: q.userAnswer,
        correctAnswer: q.questionId.answer,
        correct: q.isCorrect,
        timeTaken: q.timeTaken,
        sectionIndex: q.sectionIndex
      }));

    // Get user data for XP info
    const User = require('../models/User');
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Ensure experiencePoints is initialized
    if (!user.experiencePoints) {
      user.experiencePoints = {
        total: 0,
        fromPractice: 0,
        fromExams: 0,
        level: 1
      };
      await user.save();
    }

    // Ensure sectionalTestStats is initialized
    if (!user.sectionalTestStats) {
      user.sectionalTestStats = {
        totalSessions: 0,
        totalSectionsCompleted: 0,
        totalSectionsPassed: 0,
        averageAccuracy: 0,
        totalXpEarned: 0,
        currentStreak: 0,
        longestStreak: 0,
        difficultyStats: {
          veryEasy: { completed: 0, passed: 0, accuracy: 0 },
          easy: { completed: 0, passed: 0, accuracy: 0 },
          moderate: { completed: 0, passed: 0, accuracy: 0 },
          difficult: { completed: 0, passed: 0, accuracy: 0 }
        }
      };
    }

    // Ensure badges array is initialized
    if (!user.badges) {
      user.badges = [];
    }

    // Add sectional test session to user history
    const sectionalSessionData = {
      sessionId: session._id,
      sections: (session.sections || []).map(section => ({
        sectionId: section.sectionId || '',
        difficulty: section.difficulty || 'Easy',
        correct: section.correct || 0,
        total: section.total || 0,
        accuracy: (section.total || 0) > 0 ? Math.round(((section.correct || 0) / (section.total || 0)) * 100) : 0,
        passed: section.passed || false,
        completed: section.completed || false
      })),
      totalSections: (session.sections || []).length,
      completedSections: (session.sections || []).filter(s => s && s.completed).length,
      passedSections: (session.sections || []).filter(s => s && s.passed).length,
      xpEarned: session.xpEarned || 0,
      duration: session.duration || 0,
      status: session.status || 'completed',
      completedAt: new Date()
    };

    // Initialize sectionalTestHistory if it doesn't exist
    if (!user.sectionalTestHistory) {
      user.sectionalTestHistory = [];
    }

    user.sectionalTestHistory.push(sectionalSessionData);

    // Update sectional test statistics
    user.updateSectionalTestStats();

    // Award badges for sectional test achievements
    const newBadges = user.awardSectionalTestBadges();

    // Update experience points
    if (session.xpEarned > 0) {
      user.updateExperiencePoints(session.xpEarned, 'practice');
    }

    await user.save();

    res.json({
      sessionId: session._id,
      startTime: session.startTime,
      endTime: session.endTime,
      duration: session.duration || 0,
      sections: session.sections || [],
      xpEarned: session.xpEarned || 0,
      status: session.status || 'completed',
      questions,
      currentXP: user.experiencePoints?.total || 0,
      currentLevel: user.experiencePoints?.level || 1,
      newBadges: newBadges || [],
      sectionalStats: {
        totalSessions: user.sectionalTestStats?.totalSessions || 0,
        totalSectionsCompleted: user.sectionalTestStats?.totalSectionsCompleted || 0,
        totalSectionsPassed: user.sectionalTestStats?.totalSectionsPassed || 0,
        averageAccuracy: user.sectionalTestStats?.averageAccuracy || 0,
        currentStreak: user.sectionalTestStats?.currentStreak || 0
      }
    });
  } catch (error) {
    console.error('Error in getSectionalTestResults:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  startPracticeSession,
  getNextQuestion,
  endPracticeSession,
  getUserPracticeSessions,
  getPracticeSessionResults,
  startSectionalTest,
  getSectionalQuestion,
  switchSectionalSection,
  endSectionalTest,
  getSectionalTestResults
};