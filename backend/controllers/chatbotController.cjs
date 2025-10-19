const User = require('../models/User');
const Session = require('../models/Session');
const Progress = require('../models/Progress');
const Review = require('../models/Review');
const Match = require('../models/Match');
const Exam = require('../models/Exam');
const LiveSession = require('../models/LiveSession');
const PracticeSession = require('../models/PracticeSession');
const Question = require('../models/Question');
const { generateChatbotResponse } = require('../services/chatbotService.cjs');
const intelligentResponses = require('../services/intelligentResponses.cjs');
const { readFileSync } = require('fs');
const { join } = require('path');

// Load NLP intents data
const nlpIntents = JSON.parse(readFileSync(join(__dirname, '../Data/nlpIntents.json'), 'utf8'));

// Simple response handler for basic conversational messages
function getSimpleResponse(message, user) {
  const greetings = ['hi', 'hello', 'hey', 'good morning', 'good afternoon', 'good evening'];
  const farewells = ['bye', 'goodbye', 'see you', 'farewell', 'take care'];
  const thanks = ['thank you', 'thanks', 'appreciate it'];
  const howAreYou = ['how are you', 'how do you do', 'whats up', 'how is it going'];
  
  const lowerMessage = message.toLowerCase().trim();
  const userName = user?.username || user?.profile?.name || 'there';
  
  // Check for greetings
  if (greetings.some(greeting => lowerMessage.includes(greeting))) {
    const responses = user ? [
      `Hello ${userName}! 👋 Welcome to LearningSphere! How can I help you today?`,
      `Hi there, ${userName}! Ready to boost your learning with LearningSphere?`,
      `Hey ${userName}! Let's explore your learning journey together!`,
      `Good to see you, ${userName}! What would you like to know about your studies?`
    ] : [
      'Hello! 👋 Welcome to LearningSphere! I\'m your AI learning assistant.',
      'Hi there! Ready to explore LearningSphere\'s features?',
      'Hey! I\'m here to help you learn about our platform.',
      'Welcome to LearningSphere! How can I assist you today?'
    ];
    return {
      response: responses[Math.floor(Math.random() * responses.length)],
      intent: 'greeting',
      suggestions: ['Show my exam schedule', 'Check my practice test progress', 'View performance analytics', 'Find live sessions']
    };
  }
  
  // Check for farewells
  if (farewells.some(farewell => lowerMessage.includes(farewell))) {
    const responses = user ? [
      `Goodbye ${userName}! Keep up the great work with your studies! 👋`,
      `See you later, ${userName}! Happy learning on LearningSphere! 📚`,
      `Take care, ${userName}! I'm here whenever you need study help.`,
      `Farewell ${userName}! Wishing you success in all your exams! 🎓`
    ] : [
      'Goodbye! Thanks for exploring LearningSphere! 👋',
      'See you later! Come back anytime to learn more! 📚',
      'Take care! I\'m here whenever you have questions.',
      'Farewell! Best of luck with your learning journey! 🎓'
    ];
    return {
      response: responses[Math.floor(Math.random() * responses.length)],
      intent: 'goodbye'
    };
  }
  
  // Check for thanks
  if (thanks.some(thank => lowerMessage.includes(thank))) {
    const responses = user ? [
      `You're welcome, ${userName}! 😊`,
      `Happy to help, ${userName}!`,
      `Anytime, ${userName}! That's what I'm here for.`,
      `My pleasure, ${userName}! Feel free to ask anything else.`
    ] : [
      'You\'re welcome! 😊',
      'Happy to help!',
      'Anytime! That\'s what I\'m here for.',
      'My pleasure! Feel free to ask anything else.'
    ];
    return {
      response: responses[Math.floor(Math.random() * responses.length)],
      intent: 'thanks'
    };
  }
  
  // Check for how are you
  if (howAreYou.some(phrase => lowerMessage.includes(phrase))) {
    const responses = user ? [
      `I'm doing great, ${userName}! Ready to help you excel in your studies. How are you doing?`,
      `I'm fantastic, thanks for asking! How can I assist you with LearningSphere today?`,
      `I'm here and ready to help, ${userName}! What's on your learning agenda today?`,
      `I'm doing wonderful! How are your exams and practice tests going, ${userName}?`
    ] : [
      'I\'m doing great! Ready to help you learn about LearningSphere. How are you?',
      'I\'m fantastic, thanks for asking! How can I assist you today?',
      'I\'m here and ready to help! What would you like to know about LearningSphere?',
      'I\'m doing wonderful! How can I help you explore our platform today?'
    ];
    return {
      response: responses[Math.floor(Math.random() * responses.length)],
      intent: 'casual_conversation',
      suggestions: ['Show my progress dashboard', 'What should I study next?', 'Help me plan my study schedule']
    };
  }
  
  return null; // No simple response found, proceed with complex AI response
}

// Main chatbot endpoint
const chatWithBot = async (req, res, next) => {
  try {
    const { message, context = {} } = req.body;
    const userId = req.user?.id;
    const userRole = req.user?.role || 'guest';

    if (!message || message.trim().length === 0) {
      const error = new Error('Message is required');
      error.statusCode = 400;
      throw error;
    }

    // Get user data for context if user is authenticated
    let user = null;
    if (userId) {
      try {
        user = await User.findById(userId).lean();
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
      
      // Refresh user's exam statistics to ensure accuracy
      await refreshUserExamStats(userId);
    }

    // Check for simple conversational responses first
    const simpleResponse = getSimpleResponse(message.toLowerCase(), user);
    if (simpleResponse) {
      return res.json({
        success: true,
        response: simpleResponse.response,
        intent: simpleResponse.intent,
        suggestions: simpleResponse.suggestions || [],
        timestamp: new Date().toISOString()
      });
    }

    // Detect intent from the message
    const intent = detectIntent(message.toLowerCase());
    
    // Get relevant data based on intent
    const contextData = await gatherContextData(intent, userId, userRole, context);
    
    // Get comprehensive user data with exam details (only for authenticated users)
    let userWithCompleteData = null;
    let actualExamCount = 0;
    
    if (userId) {
      try {
        userWithCompleteData = await User.findById(userId).lean();
        
        // Calculate actual exam participation
        const examHistoryCount = userWithCompleteData?.examHistory?.length || 0;
        actualExamCount = Math.max(examHistoryCount, userWithCompleteData?.examCount || 0);
      } catch (error) {
        console.error('Error fetching complete user data:', error);
      }
    }

    // Prepare comprehensive user context
    const userContext = {
      user: userId ? {
        id: userId,
        username: user?.username || 'User',
        role: userRole,
        fullName: user?.profile?.name || user?.username || 'User',
        email: user?.email || '',
        examHistory: userWithCompleteData?.examHistory || [],
        examCount: actualExamCount || 0,
        averageScore: userWithCompleteData?.averageScore || 0,
        actualExamParticipated: actualExamCount || 0
      } : {
        id: null,
        username: 'Guest',
        role: 'guest',
        fullName: 'Guest User',
        email: '',
        examHistory: [],
        examCount: 0,
        averageScore: 0,
        actualExamParticipated: 0
      },
      intent,
      contextData,
      platform: {
        name: 'LearningSphere',
        version: '1.0',
        features: [
          'AI-Powered Adaptive Practice Exams',
          'Intelligent Exam System with Real-time Results',
          'Sectional Tests with Progressive Difficulty',
          'Live Video Sessions & Tutoring',
          'Comprehensive Progress Analytics',
          'Smart Question Bank Management',
          'Tutor-Student Matching System',
          'Real-time Performance Tracking',
          'Admin Dashboard & Management',
          'Interactive Learning Sessions'
        ]
      },
      timestamp: new Date().toISOString()
    };

    // ALWAYS use data-driven responses - no AI fallback
    let response;
    try {
      console.log(`[CHATBOT] Generating data-driven response for intent: ${intent}, userId: ${userId}`);
      response = await generateDataDrivenResponse(intent, userContext.user, contextData);
      
      if (!response || response.trim().length === 0) {
        console.error(`[CHATBOT] Data-driven response was empty for intent: ${intent}`);
        response = `Hi! I'm having trouble generating a response right now. Please try rephrasing your question or contact support.`;
      } else {
        console.log(`[CHATBOT] Data-driven response generated successfully, length: ${response.length}`);
      }
    } catch (error) {
      console.error('[CHATBOT] Error generating data-driven response:', error.message);
      console.error('[CHATBOT] Stack:', error.stack);
      response = `Hi! I encountered an error: ${error.message}. Please try again or contact support.`;
    }

    // Log the interaction
    console.log(`Chatbot interaction: User ${userId} (${userRole}) - Intent: ${intent}`, {
      message: message.substring(0, 100),
      intent,
      responseLength: response.length
    });

    // Get smart, context-aware suggestions
    const progressData = userId ? await Progress.findOne({ userId }).lean() : null;
    const examData = userId ? await fetchUserExamData(userId) : null;
    const practiceData = userId ? await fetchUserPracticeData(userId) : null;
    
    const smartSuggestions = await getSmartSuggestions(intent, userId, {
      progress: progressData,
      exams: examData,
      practices: practiceData
    });

    res.json({
      success: true,
      response,
      intent,
      suggestions: smartSuggestions,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error(`Chatbot error: ${error.message}`, {
      userId: req.user?.id,
      message: req.body?.message?.substring(0, 100),
      stack: error.stack
    });
    next(error);
  }
};

// Get user's complete dashboard data
const getUserDashboardData = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    const dashboardData = await gatherDashboardData(userId, userRole);

    res.json({
      success: true,
      data: dashboardData,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error(`Dashboard data error: ${error.message}`, { userId: req.user?.id });
    next(error);
  }
};

// Get chatbot suggestions based on user role and context
const getChatbotSuggestions = async (req, res, next) => {
  try {
    const userRole = req.user?.role || 'guest';
    const { category = 'general' } = req.query;

    const suggestions = generateSuggestions(userRole, category);

    res.json({
      success: true,
      suggestions,
      category,
      userRole
    });

  } catch (error) {
    console.error(`Suggestions error: ${error.message}`, { userId: req.user?.id });
    next(error);
  }
};

// Generate smart suggestions based on user's current state and context
async function getSmartSuggestions(intent, userId, userData) {
  const suggestions = [];
  
  if (!userId) {
    return nlpIntents.suggestions.general || [];
  }
  
  const { progress, exams, practices } = userData;
  
  // Context-aware suggestions based on user's actual data
  switch (intent) {
    case 'greeting':
    case 'dashboard_info':
      // Personalized suggestions based on progress
      if (progress) {
        if (progress.examsPassed === 0 && progress.examsFailed === 0) {
          suggestions.push("Start your first practice exam");
        } else if (practices && practices.length > 0) {
          const avgAccuracy = practices.reduce((sum, p) => sum + (p.accuracy || 0), 0) / practices.length;
          if (avgAccuracy < 50) {
            suggestions.push("Review weak topics");
            suggestions.push("Take a targeted practice session");
          }
        }
        
        if (progress.currentLevel < 5) {
          suggestions.push("Check XP goals for next level");
        }
        
        suggestions.push("View detailed performance analytics");
        suggestions.push("Explore available courses");
      }
      break;
      
    case 'exam_info':
      suggestions.push("View exam history with detailed breakdowns");
      suggestions.push("Check upcoming scheduled exams");
      suggestions.push("Get exam preparation recommendations");
      if (exams && exams.filter(e => e.status === 'completed').length > 0) {
        suggestions.push("Compare your scores over time");
      }
      break;
      
    case 'performance_info':
      suggestions.push("See badge collection and achievements");
      suggestions.push("Track XP progression graph");
      suggestions.push("Get personalized improvement tips");
      if (progress && progress.badges && progress.badges.length > 0) {
        suggestions.push("Share your achievements");
      }
      break;
      
    case 'help':
      suggestions.push("Take a platform tour");
      suggestions.push("View quick start guide");
      suggestions.push("Explore all features");
      suggestions.push("Contact support team");
      break;
      
    default:
      // Get suggestions from NLP data based on intent
      if (nlpIntents.suggestions[intent]) {
        return nlpIntents.suggestions[intent].slice(0, 4);
      }
      return nlpIntents.suggestions.general?.slice(0, 4) || [];
  }
  
  return suggestions.slice(0, 4); // Limit to 4 suggestions
}

// Helper function to detect intent from user message using NLP patterns
function detectIntent(message) {
  const lowerMessage = message.toLowerCase().trim();
  
  // Check against NLP patterns for accurate intent detection
  for (const intent of nlpIntents.intents) {
    for (const pattern of intent.patterns) {
      if (lowerMessage.includes(pattern.toLowerCase()) || 
          lowerMessage === pattern.toLowerCase()) {
        return intent.tag;
      }
    }
  }
  
  // Advanced pattern matching with priority
  
  // Dashboard and overview - highest priority for these specific terms
  if (lowerMessage.match(/\b(dashboard|overview|show (my )?stats?|my profile|main page|home)\b/)) {
    return 'dashboard_info';
  }
  
  // Performance and grades
  if (lowerMessage.match(/\b(performance|grade|score|result|analytics|report|trend|improvement|how (am i|did i) do)\b/)) {
    return 'performance_info';
  }
  
  // Exams and tests
  if (lowerMessage.match(/\b(exam|test|quiz|practice|sectional|assessment|mock)\b/)) {
    return 'exam_info';
  }
  
  // Schedule and timetable
  if (lowerMessage.match(/\b(schedule|timetable|class|today|tomorrow|timing)\b/)) {
    return 'timetable_info';
  }
  
  // Help and support
  if (lowerMessage.match(/\b(help|guide|support|how|what can|features|tutorial|tour|tips)\b/)) {
    return 'help';
  }
  
  // Greetings
  if (lowerMessage.match(/\b(hello|hi|hey|good (morning|afternoon|evening)|greetings)\b/)) {
    return 'greeting';
  }
  
  // Goodbye
  if (lowerMessage.match(/\b(bye|goodbye|see you|farewell|exit|quit)\b/)) {
    return 'goodbye';
  }
  
  // Default to general conversation
  return 'general_conversation';
}

// Gather context data based on detected intent
async function gatherContextData(intent, userId, userRole, additionalContext = {}) {
  const data = {};

  try {
    // If no userId (guest user), provide general information
    if (!userId) {
      switch (intent) {
        case 'exam_info':
        case 'performance_info':
          data.message = "I'd be happy to help you with learning and performance information! Please log in to view your personalized data and progress analytics.";
          break;
        default:
          data.message = "Hi! I'm LearningSphere AI Assistant. I can help you with general information about our platform. For personalized features, please log in to your account.";
      }
      return data;
    }

    switch (intent) {
      case 'exam_info':
      case 'performance_info':
        // Get session data for authenticated users
        try {
          data.sessions = await Session.find({ 
            $or: [
              { student: userId },
              { tutor: userId }
            ]
          })
          .populate('tutor', 'profile.name username')
          .populate('student', 'profile.name username')
          .sort({ createdAt: -1 })
          .limit(10)
          .lean();

          // Get user's progress history
          data.progress = await Progress.find({ userId })
          .sort({ createdAt: -1 })
          .limit(10)
          .lean();
        } catch (error) {
          console.error('Error fetching session data:', error);
          data.sessions = [];
          data.progress = [];
        }
        break;

      case 'schedule_info':
      case 'session_info':
        // Get learning sessions
        try {
          data.sessions = await Session.find({
            $or: [
              { student: userId },
              { tutor: userId }
            ]
          })
          .populate('tutor', 'profile.name username')
          .populate('student', 'profile.name username')
          .sort({ createdAt: -1 })
          .limit(10)
          .lean();
        } catch (error) {
          console.error('Error fetching sessions:', error);
          data.sessions = [];
        }
        break;

      case 'progress_info':
        // Get progress data
        try {
          data.progress = await Progress.find({ userId })
            .sort({ createdAt: -1 })
            .limit(10)
            .lean();
        } catch (error) {
          console.error('Error fetching progress:', error);
          data.progress = [];
        }
        break;

      case 'review_info':
        // Get reviews
        try {
          data.reviews = await Review.find({
            $or: [
              { student: userId },
              { tutor: userId }
            ]
          })
          .populate('student', 'profile.name username')
          .populate('tutor', 'profile.name username')
          .sort({ createdAt: -1 })
          .limit(10)
          .lean();
        } catch (error) {
          console.error('Error fetching reviews:', error);
          data.reviews = [];
        }
        break;

      case 'matching_info':
        // Get matches
        try {
          data.matches = await Match.find({
            $or: [
              { student: userId },
              { tutor: userId }
            ]
          })
          .populate('student', 'profile.name username')
          .populate('tutor', 'profile.name username')
          .sort({ createdAt: -1 })
          .limit(10)
          .lean();
        } catch (error) {
          console.error('Error fetching matches:', error);
          data.matches = [];
        }
        break;

      case 'user_info':
        // Get user profile information
        try {
          const userData = await User.findById(userId)
            .select('profile role isTutor preferences stats')
            .lean();
          data.userProfile = userData;
        } catch (error) {
          console.error('Error fetching user profile:', error);
          data.userProfile = null;
        }
        break;

      case 'dashboard_info':
        // Get comprehensive dashboard data
        data.dashboard = await gatherDashboardData(userId, userRole);
        break;

      default:
        // Get summary data for general conversation
        data.summary = await gatherSummaryData(userId, userRole);
        break;
    }

    return data;
  } catch (error) {
    console.error(`Error gathering context data: ${error.message}`);
    return {};
  }
}

// Helper function to refresh user exam statistics
async function refreshUserExamStats(userId) {
  if (!userId) return null;
  
  try {
    const user = await User.findById(userId);
    if (!user) return null;

    // For LearningSphere, let's update user stats based on sessions and progress
    try {
      // Get user's learning sessions
      const userSessions = await Session.find({
        $or: [
          { student: userId },
          { tutor: userId }
        ]
      }).countDocuments();

      // Get user's progress records
      const userProgress = await Progress.find({ userId }).countDocuments();

      // Update user stats if they exist
      if (user.stats) {
        user.stats.totalSessions = userSessions;
        user.stats.progressRecords = userProgress;
        user.stats.lastUpdated = new Date();
        await user.save();
      }
    } catch (error) {
      console.error('Error updating user stats:', error);
    }

    return user;
  } catch (error) {
    console.error(`Error refreshing user exam stats: ${error.message}`);
    return null;
  }
}

// Gather comprehensive dashboard data
async function gatherDashboardData(userId, userRole) {
  const data = {};

  try {
    // User information with complete exam data
    const user = await User.findById(userId)
      .populate('examHistory.examId', 'title subject scheduledDate')
      .lean();
    data.user = user;

    // Calculate actual exam participation count
    const actualExamCount = user.examHistory?.length || 0;
    
    // Also count exams where user has results
    const examsWithResults = await Exam.find({ 'results.userId': userId }).countDocuments();
    
    // Use the higher count to ensure accuracy
    data.user.actualExamCount = Math.max(actualExamCount, examsWithResults);
    data.user.examParticipated = data.user.actualExamCount;

    // Recent exams
    data.recentExams = await Exam.find({
      $or: [
        { participants: userId },
        userRole === 'admin' ? {} : { invigilator: userId }
      ]
    })
    .sort({ scheduledDate: -1 })
    .limit(5)
    .populate('invigilator', 'username')
    .lean();

    // Learning Sessions
    data.sessions = await Session.find({
      $or: [
        { student: userId },
        { tutor: userId }
      ]
    })
    .sort({ createdAt: -1 })
    .limit(5)
    .populate('student', 'username')
    .populate('tutor', 'username')
    .lean();

    // Get summary statistics for dashboard
    data.summary = await gatherSummaryData(userId, userRole);

    return data;
  } catch (error) {
    console.error(`Error gathering dashboard data: ${error.message}`);
    return {};
  }
}

// Gather summary data for general responses
async function gatherSummaryData(userId, userRole) {
  try {
    const data = {};

    if (!userId) {
      // Guest user data
      data.sessionCount = 0;
      data.progressCount = 0;
      data.reviewCount = 0;
      data.liveSessionCount = 0;
      return data;
    }

    // For authenticated users - use LearningSphere models
    data.sessionCount = await Session.countDocuments({
      $or: [
        { tutorId: userId },
        { studentId: userId }
      ]
    });

    data.progressCount = await Progress.countDocuments({
      studentId: userId
    });

    data.reviewCount = await Review.countDocuments({
      $or: [
        { tutorId: userId },
        { studentId: userId }
      ]
    });

    data.liveSessionCount = await LiveSession.countDocuments({
      $or: [
        { tutorId: userId },
        { participants: userId }
      ],
      scheduledAt: { $gte: new Date() }
    });

    return data;
  } catch (error) {
    console.error(`Error gathering summary data: ${error.message}`);
    return {};
  }
}

// Generate suggestions based on user role and intent
function getSuggestions(intent, userRole) {
  const baseSuggestions = nlpIntents.suggestions[intent] || nlpIntents.suggestions.general;
  
  const roleSuggestions = {
    student: [
      "Show my upcoming exams",
      "Check practice test progress", 
      "View sectional test results",
      "Find available tutors",
      "Show my performance analytics",
      "Help me plan study schedule"
    ],
    learner: [
      "Show my upcoming exams",
      "Check practice test progress", 
      "View sectional test results",
      "Find available tutors",
      "Show my performance analytics",
      "Help me plan study schedule"
    ],
    tutor: [
      "Show students I'm teaching",
      "View my live sessions",
      "Check question bank",
      "Create practice exams",
      "View student progress",
      "Schedule tutoring session"
    ],
    teacher: [
      "Show students I'm teaching",
      "View my live sessions", 
      "Check question bank",
      "Create practice exams",
      "View student progress",
      "Schedule tutoring session"
    ],
    admin: [
      "Show platform analytics",
      "View all user activity",
      "Generate performance reports",
      "Manage exam system",
      "Check system statistics",
      "View contact messages"
    ]
  };

  return [
    ...baseSuggestions,
    ...(roleSuggestions[userRole] || [])
  ].slice(0, 6);
}

// Generate suggestions for different categories
function generateSuggestions(userRole, category) {
  const suggestions = {
    general: {
      student: [
        "What's my current academic performance?",
        "Show me my upcoming exams",
        "Check my notification summary",
        "What classes do I have today?",
        "How can I improve my grades?"
      ],
      teacher: [
        "Show students in my classes",
        "What exams am I supervising?",
        "Create a lesson plan",
        "Check attendance patterns",
        "Schedule parent meetings"
      ],
      admin: [
        "Show platform analytics",
        "Generate performance reports",
        "Check system health",
        "View user statistics",
        "Manage notifications"
      ],
      parent: [
        "How is my child performing?",
        "Show recent parent notifications",
        "When are the next meetings?",
        "Check attendance history",
        "View upcoming exams"
      ]
    },
    academic: {
      student: [
        "Show my exam history",
        "What subjects need improvement?",
        "Display my grade trends",
        "Show study recommendations",
        "Check assignment deadlines"
      ],
      teacher: [
        "Show class performance overview",
        "Generate student reports",
        "View exam statistics",
        "Check grading progress",
        "Analyze attendance patterns"
      ],
      admin: [
        "Generate academic reports",
        "Show exam analytics",
        "View grade distributions",
        "Check teacher performance",
        "Analyze learning trends"
      ]
    },
    schedule: [
      "What's my schedule today?",
      "Show this week's timetable",
      "When is my next class?",
      "Check for schedule conflicts",
      "View upcoming meetings"
    ],
    help: [
      "How do I check my grades?",
      "How to submit assignments?",
      "Where can I find my timetable?",
      "How to join virtual meetings?",
      "What features are available?"
    ]
  };

  return suggestions[category]?.[userRole] || suggestions[category] || suggestions.general[userRole] || suggestions.general.student;
}

// Comprehensive user data fetching functions
async function fetchUserPracticeData(userId) {
  try {
    const practiceSessions = await PracticeSession.find({
      userId: userId,
      status: { $in: ['completed', 'active'] }
    }).sort({ createdAt: -1 }).limit(20);

    const completedSessions = practiceSessions.filter(s => s.status === 'completed');
    const activeSessions = practiceSessions.filter(s => s.status === 'active');
    
    const totalSessions = completedSessions.length;
    const totalQuestions = completedSessions.reduce((sum, s) => sum + (s.totalQuestions || 0), 0);
    const totalCorrect = completedSessions.reduce((sum, s) => sum + (s.correctAnswers || 0), 0);
    const averageAccuracy = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;
    const totalXP = completedSessions.reduce((sum, s) => sum + (s.xpEarned || 0), 0);
    
    // Calculate recent performance (last 5 sessions)
    const recentSessions = completedSessions.slice(0, 5);
    const recentQuestions = recentSessions.reduce((sum, s) => sum + (s.totalQuestions || 0), 0);
    const recentCorrect = recentSessions.reduce((sum, s) => sum + (s.correctAnswers || 0), 0);
    const recentAccuracy = recentQuestions > 0 ? Math.round((recentCorrect / recentQuestions) * 100) : 0;

    return {
      totalSessions,
      activeSessions: activeSessions.length,
      averageAccuracy,
      recentAccuracy,
      totalXP,
      recentSessions: recentSessions.map(s => ({
        date: s.createdAt,
        score: s.score,
        accuracy: s.totalQuestions > 0 ? Math.round((s.correctAnswers / s.totalQuestions) * 100) : 0,
        difficulty: s.currentDifficulty,
        duration: s.duration,
        isSectional: s.isSectional
      }))
    };
  } catch (error) {
    console.error('Error fetching practice data:', error);
    return null;
  }
}

async function fetchUserExamData(userId) {
  try {
    const exams = await Exam.find({
      results: { $elemMatch: { userId: userId } }
    }).sort({ scheduledDate: -1 });

    const examHistory = exams.map(exam => {
      const userResult = exam.results.find(r => r.userId && r.userId.toString() === userId);
      if (!userResult) return null;
      
      return {
        id: exam._id,
        title: exam.title,
        subject: exam.subject || 'General',
        scheduledDate: exam.scheduledDate,
        submittedAt: userResult.submittedAt,
        score: userResult.score,
        status: userResult.status || 'completed'
      };
    }).filter(item => item !== null);

    const completedExams = examHistory.filter(e => e.status === 'completed');
    const averageScore = completedExams.length > 0 
      ? Math.round(completedExams.reduce((sum, e) => sum + (e.score || 0), 0) / completedExams.length)
      : 0;

    // Get upcoming exams
    const upcomingExams = await Exam.find({
      scheduledDate: { $gte: new Date() },
      $or: [
        { participants: userId },
        { isPublic: true }
      ]
    }).sort({ scheduledDate: 1 }).limit(5);

    return {
      totalExams: examHistory.length,
      averageScore,
      recentExams: examHistory.slice(0, 3),
      upcomingExams: upcomingExams.map(e => ({
        id: e._id,
        title: e.title,
        subject: e.subject,
        scheduledDate: e.scheduledDate,
        duration: e.duration
      }))
    };
  } catch (error) {
    console.error('Error fetching exam data:', error);
    return null;
  }
}

async function fetchUserSessionData(userId) {
  try {
    const sessions = await Session.find({
      $or: [
        { student: userId },
        { tutor: userId }
      ]
    })
    .populate('tutor', 'profile.name username')
    .populate('student', 'profile.name username')
    .sort({ createdAt: -1 })
    .limit(10);

    const liveSessions = await LiveSession.find({
      $or: [
        { tutorId: userId },
        { participants: userId }
      ],
      scheduledAt: { $gte: new Date() }
    }).sort({ scheduledAt: 1 }).limit(5);

    return {
      totalSessions: sessions.length,
      recentSessions: sessions.slice(0, 3).map(s => ({
        id: s._id,
        subject: s.subject,
        date: s.createdAt,
        tutor: s.tutor?.profile?.name || s.tutor?.username,
        student: s.student?.profile?.name || s.student?.username,
        status: s.status
      })),
      upcomingLiveSessions: liveSessions.map(s => ({
        id: s._id,
        title: s.title,
        scheduledAt: s.scheduledAt,
        duration: s.duration
      }))
    };
  } catch (error) {
    console.error('Error fetching session data:', error);
    return null;
  }
}

// Generate data-driven responses based on intent and real user data
async function generateDataDrivenResponse(intent, user, contextData) {
  console.log('[CHATBOT] Generating intelligent response for intent:', intent);
  
  const userId = user?.id || user?._id;
  
  // Fetch comprehensive user data
  let progressData = null;
  let examData = null;
  let practiceData = null;
  let userData = null;
  
  if (userId) {
    try {
      [progressData, examData, practiceData, userData] = await Promise.all([
        Progress.findOne({ user: userId }).lean(), // Changed from userId to user
        fetchUserExamData(userId),
        fetchUserPracticeData(userId),
        User.findById(userId).lean()
      ]);
    } catch (error) {
      console.error('[CHATBOT] Error fetching user data:', error);
    }
  }
  
  // Extract user name from multiple sources with priority
  const userName = progressData?.name || 
                   userData?.profile?.name || 
                   user?.profile?.name || 
                   user?.fullName ||
                   userData?.username ||
                   user?.username || 
                   'there';
  
  console.log('[CHATBOT] User name resolved to:', userName);
  
  // Route to appropriate intelligent response generator
  switch (intent) {
    case 'greeting':
      return await intelligentResponses.generateGreetingResponse(userName, userId, progressData);
      
    case 'dashboard_info':
      return await intelligentResponses.generateDashboardResponse(userName, progressData, examData, practiceData);
      
    case 'exam_info':
      return await intelligentResponses.generateExamResponse(userName, examData, practiceData);
      
    case 'performance_info':
      return await intelligentResponses.generatePerformanceResponse(userName, progressData, examData, practiceData);
      
    case 'help':
      return await intelligentResponses.generateHelpResponse(userName, progressData);
      
    case 'goodbye':
      return intelligentResponses.generateGoodbyeResponse(userName);
      
    case 'general_conversation':
    default:
      return intelligentResponses.generateFallbackResponse(userName, intent);
  }
}

function generateGreetingResponse(userName, user) {
  if (!user?.id) {
    return "Hello! 👋 Welcome to LearningSphere! I'm your AI learning assistant. I can help you explore our platform features, but for personalized insights, please log in to your account. How can I assist you today?";
  }
  
  return `Hello ${userName}! 👋 Welcome back to LearningSphere! I'm excited to help you on your learning journey today. What would you like to know about your progress, upcoming sessions, or exam performance?`;
}

async function generateExamResponse(userName, userId, contextData) {
  if (!userId) {
    return "I'd love to help you with exam information! Please log in to view your personalized exam schedule, results, and upcoming tests on LearningSphere.";
  }

  const [examData, userData] = await Promise.all([
    fetchUserExamData(userId),
    User.findById(userId).lean()
  ]);
  
  if (!examData) {
    return `Hi ${userName}! I'm having trouble accessing your exam data right now. Please try again in a moment, or contact support if the issue persists.`;
  }

  let response = `Hi ${userName}! 📚 Here's your comprehensive exam analysis:\n\n`;
  
  if (examData.totalExams > 0) {
    response += `📊 **Exam Performance Overview:**\n`;
    response += `• Total Exams Completed: ${examData.totalExams}\n`;
    response += `• Average Score: ${examData.averageScore}%\n`;
    
    // Performance classification
    if (examData.averageScore >= 80) {
      response += `• Performance Level: 🌟 Excellent\n\n`;
    } else if (examData.averageScore >= 60) {
      response += `• Performance Level: 👍 Good\n\n`;
    } else if (examData.averageScore >= 40) {
      response += `• Performance Level: ⚠️ Needs Improvement\n\n`;
    } else {
      response += `• Performance Level: 🚨 Critical - Immediate Action Required\n\n`;
    }
    
    if (examData.recentExams.length > 0) {
      response += `🏆 **Recent Exam Performance:**\n`;
      examData.recentExams.forEach((exam, index) => {
        const date = new Date(exam.submittedAt).toLocaleDateString();
        const performance = exam.score >= 60 ? '✅' : exam.score >= 40 ? '⚠️' : '❌';
        response += `${index + 1}. ${exam.title} (${exam.subject}) - ${exam.score}% ${performance} (${date})\n`;
      });
      response += `\n`;
      
      // Trend analysis for recent exams
      if (examData.recentExams.length >= 2) {
        const latestScore = examData.recentExams[0].score;
        const previousScore = examData.recentExams[1].score;
        const trend = latestScore - previousScore;
        
        if (trend > 10) {
          response += `📈 **Positive Trend:** Your latest exam score improved by ${trend}% - excellent progress!\n\n`;
        } else if (trend < -10) {
          response += `� **Declining Trend:** Your latest score dropped by ${Math.abs(trend)}% - needs immediate attention.\n\n`;
        }
      }
    }
  } else {
    response += `�🚀 **Getting Started:**\n`;
    response += `You haven't taken any exams yet, but that's perfectly fine! LearningSphere has comprehensive adaptive assessments waiting for you.\n\n`;
  }
  
  if (examData.upcomingExams.length > 0) {
    response += `📅 **Upcoming Exams:**\n`;
    examData.upcomingExams.forEach((exam, index) => {
      const date = new Date(exam.scheduledDate).toLocaleDateString();
      const timeLeft = Math.ceil((new Date(exam.scheduledDate) - new Date()) / (1000 * 60 * 60 * 24));
      response += `${index + 1}. ${exam.title} (${exam.subject}) - ${date} (${timeLeft} days away)\n`;
    });
    response += `\n`;
  }
  
  // Critical recommendations based on performance
  response += `💡 **Personalized Exam Strategy:**\n`;
  
  if (examData.averageScore < 30) {
    response += `🚨 **Immediate Action Plan:**\n`;
    response += `   • Your exam scores indicate fundamental gaps in preparation\n`;
    response += `   • Before your next exam: Complete foundational review\n`;
    response += `   • Take sectional tests to identify specific weak subjects\n`;
    response += `   • Consider scheduling tutoring sessions for difficult topics\n`;
    response += `   • Practice time management with timed mock tests\n\n`;
  } else if (examData.averageScore < 50) {
    response += `⚠️ **Improvement Strategy:**\n`;
    response += `   • Focus on consistent practice before exam attempts\n`;
    response += `   • Review previous exam mistakes thoroughly\n`;
    response += `   • Target specific weak subjects with sectional practice\n`;
    response += `   • Develop better exam-taking strategies\n\n`;
  } else if (examData.averageScore < 70) {
    response += `📈 **Optimization Tips:**\n`;
    response += `   • You're on the right track! Focus on consistency\n`;
    response += `   • Work on time management and question prioritization\n`;
    response += `   • Challenge yourself with advanced practice tests\n`;
    response += `   • Aim for 80%+ in your next exam\n\n`;
  } else {
    response += `🌟 **Excellence Maintenance:**\n`;
    response += `   • Outstanding performance! Keep up the excellent work\n`;
    response += `   • Challenge yourself with the most difficult practice tests\n`;
    response += `   • Consider helping other learners as a tutor\n`;
    response += `   • Maintain consistency in your preparation routine\n\n`;
  }
  
  // Exam preparation recommendations
  if (examData.upcomingExams.length > 0) {
    response += `🎯 **Preparation for Upcoming Exams:**\n`;
    examData.upcomingExams.slice(0, 2).forEach((exam, index) => {
      const daysLeft = Math.ceil((new Date(exam.scheduledDate) - new Date()) / (1000 * 60 * 60 * 24));
      response += `${index + 1}. **${exam.title}** (${daysLeft} days):\n`;
      
      if (daysLeft > 7) {
        response += `   • Start with comprehensive subject review\n`;
        response += `   • Take sectional tests for this subject\n`;
        response += `   • Schedule regular practice sessions\n`;
      } else if (daysLeft > 3) {
        response += `   • Focus on intensive practice tests\n`;
        response += `   • Review weak areas identified in sectional tests\n`;
        response += `   • Take at least one full-length mock test\n`;
      } else {
        response += `   • Final revision of key concepts\n`;
        response += `   • Light practice to maintain confidence\n`;
        response += `   • Ensure good rest before the exam\n`;
      }
      response += `\n`;
    });
  }
  
  return response;
}

async function generatePracticeResponse(userName, userId, contextData) {
  if (!userId) {
    return "Please log in to view your personalized practice test progress and performance analytics on LearningSphere!";
  }

  const practiceData = await fetchUserPracticeData(userId);
  if (!practiceData) {
    return `Hi ${userName}! I'm having trouble accessing your practice data right now. Please try again in a moment.`;
  }

  let response = `Hi ${userName}! 🎯 Here's your practice test progress:\n\n`;
  
  if (practiceData.totalSessions > 0) {
    response += `📈 **Practice Statistics:**\n`;
    response += `• Total Practice Sessions: ${practiceData.totalSessions}\n`;
    response += `• Overall Accuracy: ${practiceData.averageAccuracy}%\n`;
    response += `• Recent Performance: ${practiceData.recentAccuracy}%\n`;
    response += `• Total XP Earned: ${practiceData.totalXP}\n\n`;
    
    if (practiceData.activeSessions > 0) {
      response += `⚡ **Active Sessions:** You have ${practiceData.activeSessions} practice session(s) in progress!\n\n`;
    }
    
    if (practiceData.recentSessions.length > 0) {
      response += `🏅 **Recent Practice Sessions:**\n`;
      practiceData.recentSessions.forEach((session, index) => {
        const date = new Date(session.date).toLocaleDateString();
        response += `${index + 1}. ${session.difficulty} ${session.isSectional ? 'Sectional' : 'Practice'} - ${session.accuracy}% accuracy on ${date}\n`;
      });
      response += `\n`;
    }
    
    // Performance insights
    if (practiceData.recentAccuracy > practiceData.averageAccuracy + 5) {
      response += `🌟 **Great Progress!** Your recent performance (${practiceData.recentAccuracy}%) is improving compared to your overall average!\n\n`;
    } else if (practiceData.recentAccuracy < practiceData.averageAccuracy - 5) {
      response += `💪 **Keep Practicing!** Your recent accuracy is lower than your average. Consider reviewing your weak areas.\n\n`;
    }
  } else {
    response += `🚀 **Ready to Start?**\n`;
    response += `You haven't started any practice sessions yet. Our AI-powered adaptive tests will adjust to your skill level!\n\n`;
  }
  
  response += `🎯 **Next Steps:**\n`;
  response += `• Start a new adaptive practice session\n`;
  response += `• Try sectional tests to focus on specific topics\n`;
  response += `• Review your performance analytics for insights\n`;
  
  return response;
}

async function generatePerformanceResponse(userName, userId, contextData) {
  if (!userId) {
    return "Please log in to view your detailed performance analytics and learning insights on LearningSphere!";
  }

  const [examData, practiceData, userData, progressData] = await Promise.all([
    fetchUserExamData(userId),
    fetchUserPracticeData(userId),
    User.findById(userId).lean(),
    Progress.findOne({ user: userId }).lean()
  ]);

  let response = `Hi ${userName}! 📊 Here's your comprehensive performance analysis:\n\n`;
  
  // User progress overview from Progress model
  if (progressData) {
    response += `🎯 **Learning Profile:**\n`;
    response += `• Level: ${progressData.currentLevel || 1}\n`;
    response += `• Total XP: ${progressData.experiencePoints || 0}\n`;
    response += `• Badges Earned: ${progressData.badges?.length || 0}\n`;
    response += `• Learning Hours: ${progressData.totalHours || 0}h\n`;
    if (progressData.streak?.current > 0) {
      response += `• Current Streak: ${progressData.streak.current} days 🔥\n`;
    }
    response += `\n`;
  }
  
  response += `📈 **Performance Summary:**\n`;
  
  if (examData && examData.totalExams > 0) {
    response += `• Exam Average: ${examData.averageScore}%\n`;
    response += `• Total Exams: ${examData.totalExams}\n`;
    if (progressData) {
      response += `• Exams Passed: ${progressData.examsPassed || 0}\n`;
      response += `• Exams Failed: ${progressData.examsFailed || 0}\n`;
      if (progressData.examBestScore > 0) {
        response += `• Best Score: ${progressData.examBestScore}%\n`;
      }
    }
  }
  
  if (practiceData && practiceData.totalSessions > 0) {
    response += `• Practice Accuracy: ${practiceData.averageAccuracy}%\n`;
    response += `• Practice Sessions: ${practiceData.totalSessions}\n`;
    response += `• Practice XP: ${practiceData.totalXP}\n`;
  }
  
  // Critical performance insights
  const examAvg = examData?.averageScore || 0;
  const practiceAvg = practiceData?.averageAccuracy || 0;
  
  if (examAvg > 0 && practiceAvg > 0) {
    response += `\n📊 **Performance Analysis:**\n`;
    
    if (examAvg < 50 && practiceAvg > examAvg + 20) {
      response += `⚠️ **Critical Gap Identified:** Your practice accuracy (${practiceAvg}%) is significantly higher than exam performance (${examAvg}%). This suggests:\n`;
      response += `   • Need for better exam preparation strategies\n`;
      response += `   • Focus on time management during exams\n`;
      response += `   • Consider taking more challenging practice tests\n\n`;
    }
    
    if (examAvg < 30) {
      response += `🚨 **Immediate Attention Required:** Exam scores are critically low (${examAvg}%).\n`;
      response += `   • Prioritize foundational concept review\n`;
      response += `   • Take sectional tests to identify weak areas\n`;
      response += `   • Consider structured study plan with tutoring\n\n`;
    }
  }
  
  // Recent performance trends
  if (practiceData && practiceData.recentSessions.length > 0) {
    response += `📈 **Recent Trends:**\n`;
    const trend = practiceData.recentAccuracy - practiceData.averageAccuracy;
    if (trend > 5) {
      response += `🔥 Improving! Recent accuracy is ${trend.toFixed(1)}% higher than average\n`;
    } else if (trend < -5) {
      response += `⚠️ Declining: Recent performance is ${Math.abs(trend).toFixed(1)}% below average\n`;
    } else {
      response += `📊 Steady: Maintaining consistent performance\n`;
    }
    response += `\n`;
  }
  
  // Badge achievements
  if (progressData && progressData.badges && progressData.badges.length > 0) {
    response += `🏅 **Recent Badges Earned:**\n`;
    const recentBadges = progressData.badges.slice(-3).reverse(); // Show last 3 badges
    recentBadges.forEach(badge => {
      response += `• ${badge.icon} ${badge.name} - ${badge.description}\n`;
    });
    response += `\n`;
  }
  
  // Specific recommendations based on current performance
  response += `💡 **Personalized Action Plan:**\n`;
  
  if (examAvg < 30) {
    response += `🎯 **Foundation Building (Priority 1):**\n`;
    response += `   • Review basic concepts before attempting practice tests\n`;
    response += `   • Start with "Very Easy" difficulty and master fundamentals\n`;
    response += `   • Take sectional tests to identify specific weak subjects\n`;
    response += `   • Dedicate time to conceptual learning (reading, videos)\n\n`;
  }
  
  if (practiceAvg < 60) {
    response += `📚 **Practice Strategy:**\n`;
    response += `   • Focus on accuracy over speed in practice sessions\n`;
    response += `   • Review every incorrect answer thoroughly\n`;
    response += `   • Gradually increase difficulty only after achieving 70%+ accuracy\n\n`;
  }
  
  if (userData?.sectionalTestStats?.totalSessions === 0) {
    response += `🎯 **Sectional Tests - Start Immediately:**\n`;
    response += `   • Essential for identifying specific weak areas\n`;
    response += `   • Help simulate exam conditions for focused topics\n`;
    response += `   • Provide targeted feedback for improvement\n\n`;
  }
  
  // Achievement highlights
  if (userData?.badges && userData.badges.length > 0) {
    response += `🏆 **Recent Achievements:**\n`;
    const recentBadges = userData.badges.slice(-3);
    recentBadges.forEach((badge, index) => {
      response += `   ${index + 1}. ${badge.name} - ${badge.description}\n`;
    });
    response += `\n`;
  }
  
  // Goals and next steps
  response += `🎯 **Recommended Next Steps:**\n`;
  if (examAvg < 50) {
    response += `   • Target: Improve exam scores to 50%+ within 2-4 weeks\n`;
    response += `   • Action: Take 2-3 sectional tests this week\n`;
  }
  if (practiceAvg < 70) {
    response += `   • Target: Achieve 70%+ accuracy in practice sessions\n`;
    response += `   • Action: Complete 5 practice sessions focusing on weak areas\n`;
  }
  response += `   • Track progress weekly and adjust study strategy\n`;
  
  return response;
}

async function generateSessionResponse(userName, userId, contextData) {
  if (!userId) {
    return "Please log in to view your tutoring sessions and upcoming live sessions on LearningSphere!";
  }

  const sessionData = await fetchUserSessionData(userId);
  if (!sessionData) {
    return `Hi ${userName}! I'm having trouble accessing your session data right now. Please try again in a moment.`;
  }

  let response = `Hi ${userName}! 🎓 Here's your session overview:\n\n`;
  
  if (sessionData.totalSessions > 0) {
    response += `📚 **Your Learning Sessions:**\n`;
    response += `• Total Sessions: ${sessionData.totalSessions}\n\n`;
    
    if (sessionData.recentSessions.length > 0) {
      response += `📖 **Recent Sessions:**\n`;
      sessionData.recentSessions.forEach((session, index) => {
        const date = new Date(session.date).toLocaleDateString();
        response += `${index + 1}. ${session.subject} with ${session.tutor || session.student} on ${date}\n`;
      });
      response += `\n`;
    }
  } else {
    response += `🚀 **Getting Started with Sessions:**\n`;
    response += `You haven't started any tutoring sessions yet. Find expert tutors to help you excel!\n\n`;
  }
  
  if (sessionData.upcomingLiveSessions.length > 0) {
    response += `📅 **Upcoming Live Sessions:**\n`;
    sessionData.upcomingLiveSessions.forEach((session, index) => {
      const date = new Date(session.scheduledAt).toLocaleDateString();
      const time = new Date(session.scheduledAt).toLocaleTimeString();
      response += `${index + 1}. ${session.title} - ${date} at ${time}\n`;
    });
    response += `\n`;
  }
  
  response += `💡 **Session Opportunities:**\n`;
  response += `• Book one-on-one tutoring sessions\n`;
  response += `• Join live group sessions\n`;
  response += `• Access recorded session materials\n`;
  
  return response;
}

function generateNotificationResponse(userName, user) {
  if (!user?.id) {
    return "Please log in to view your notifications and alerts on LearningSphere!";
  }

  // This would be enhanced with actual notification data from backend
  let response = `Hi ${userName}! 🔔 Here's your notification center:\n\n`;
  response += `📬 **Notification Summary:**\n`;
  response += `• You have ${user.totalNotifications || 0} total notifications\n`;
  response += `• Check for exam reminders, assignment deadlines, and session updates\n\n`;
  
  response += `🎯 **Quick Actions:**\n`;
  response += `• Mark all notifications as read\n`;
  response += `• Filter by high priority alerts\n`;
  response += `• View recent announcements\n`;
  response += `• Check exam notifications\n`;
  response += `• Review assignment deadlines\n`;
  
  return response;
}

async function generateHelpResponse(userName, userId) {
  if (!userId) {
    return `Hi there! 👋 Welcome to LearningSphere!\n\n` +
           `I'm your AI learning assistant. Here's what I can help you with:\n\n` +
           `📚 **Platform Features:**\n` +
           `• AI-Powered Adaptive Practice Exams\n` +
           `• Live Video Tutoring Sessions\n` +
           `• Comprehensive Progress Tracking\n` +
           `• Smart Question Bank Management\n` +
           `• Tutor-Student Matching System\n\n` +
           `💡 **Get Started:**\n` +
           `• Create an account to unlock personalized learning\n` +
           `• Track your progress with detailed analytics\n` +
           `• Connect with expert tutors\n\n` +
           `Want to learn more about a specific feature? Just ask!`;
  }

  const [progressData, examData, practiceData] = await Promise.all([
    Progress.findOne({ user: userId }).lean(),
    fetchUserExamData(userId),
    fetchUserPracticeData(userId)
  ]);

  let response = `Hi ${userName}! 👋 I'm here to help you make the most of LearningSphere!\n\n`;
  
  response += `🎯 **What I Can Help You With:**\n\n`;
  
  response += `📊 **Performance & Analytics:**\n`;
  response += `• Check your exam results and performance trends\n`;
  response += `• View practice test progress and accuracy\n`;
  response += `• See your badges, XP, and learning stats\n`;
  response += `• Get personalized improvement recommendations\n\n`;
  
  response += `📚 **Learning Resources:**\n`;
  response += `• Start adaptive practice sessions\n`;
  response += `• Take sectional tests for specific subjects\n`;
  response += `• Book tutoring sessions with experts\n`;
  response += `• Join live video learning sessions\n\n`;
  
  response += `🎓 **Your Current Status:**\n`;
  if (progressData) {
    response += `• You're at Level ${progressData.currentLevel || 1} with ${progressData.experiencePoints || 0} XP\n`;
    response += `• You've earned ${progressData.badges?.length || 0} badges 🏅\n`;
  }
  if (examData && examData.totalExams > 0) {
    response += `• ${examData.totalExams} exams completed with ${examData.averageScore}% average\n`;
  }
  if (practiceData && practiceData.totalSessions > 0) {
    response += `• ${practiceData.totalSessions} practice sessions with ${practiceData.averageAccuracy}% accuracy\n`;
  }
  
  response += `\n💬 **Quick Commands:**\n`;
  response += `• "Show my dashboard" - View your complete profile\n`;
  response += `• "Check my performance" - Detailed analytics\n`;
  response += `• "View my exams" - Exam history and upcoming tests\n`;
  response += `• "Show my practice progress" - Practice test details\n`;
  
  response += `\n✨ What would you like to explore?`;
  
  return response;
}

async function generateGeneralResponse(userName, userId, intent) {
  if (!userId) {
    return `Hi there! 👋 Welcome to LearningSphere!\n\n` +
           `I'm your AI learning assistant, ready to help you explore our platform. ` +
           `For personalized insights and comprehensive analytics, please log in to your account.\n\n` +
           `💡 **What I can help you with:**\n` +
           `• Platform features and navigation\n` +
           `• General learning tips\n` +
           `• Information about our services\n\n` +
           `How can I assist you today?`;
  }

  // Fetch comprehensive user data including Progress model for accurate stats
  const [userData, progressData, summaryData, practiceData, examData] = await Promise.all([
    User.findById(userId).lean(),
    Progress.findOne({ user: userId }).lean(),
    gatherSummaryData(userId, 'student'),
    fetchUserPracticeData(userId),
    fetchUserExamData(userId)
  ]);
  
  if (!userData) {
    return `Hi ${userName}! I'm having trouble accessing your profile data. Please try again in a moment.`;
  }

  let response = `Hi ${userName}! 👋 Welcome to your LearningSphere dashboard!\n\n`;
  
  // User Level and XP from Progress model
  const level = progressData?.currentLevel || 1;
  const totalXP = progressData?.experiencePoints || 0;
  const badges = progressData?.badges?.length || 0;
  const learningHours = progressData?.totalHours || 0;
  
  response += `🎯 **Your Profile:**\n`;
  response += `• Level: ${level} 🏆\n`;
  response += `• Total XP: ${totalXP} ⭐\n`;
  response += `• Badges Earned: ${badges} 🏅\n`;
  if (learningHours > 0) {
    response += `• Learning Hours: ${learningHours}h ⏰\n`;
  }
  response += `\n`;
  
  // Exam Performance
  if (examData && examData.totalExams > 0) {
    response += `📚 **Exam Performance:**\n`;
    response += `• Total Exams: ${examData.totalExams}\n`;
    response += `• Average Score: ${examData.averageScore}%\n`;
    if (examData.upcomingExams.length > 0) {
      response += `• Upcoming Exams: ${examData.upcomingExams.length}\n`;
    }
    response += `\n`;
  }
  
  // Practice Performance
  if (practiceData && practiceData.totalSessions > 0) {
    response += `🎯 **Practice Stats:**\n`;
    response += `• Practice Sessions: ${practiceData.totalSessions}\n`;
    response += `• Overall Accuracy: ${practiceData.averageAccuracy}%\n`;
    response += `• Recent Accuracy: ${practiceData.recentAccuracy}%\n`;
    response += `• XP from Practice: ${practiceData.totalXP}\n`;
    if (practiceData.activeSessions > 0) {
      response += `• Active Sessions: ${practiceData.activeSessions} ⚡\n`;
    }
    response += `\n`;
  }
  
  // Sessions and Activity
  if (summaryData) {
    response += `📊 **Learning Activity:**\n`;
    response += `• Tutoring Sessions: ${summaryData.sessionCount || 0}\n`;
    response += `• Progress Records: ${summaryData.progressCount || 0}\n`;
    response += `• Reviews: ${summaryData.reviewCount || 0}\n`;
    if (summaryData.liveSessionCount > 0) {
      response += `• Upcoming Live Sessions: ${summaryData.liveSessionCount} 🔴\n`;
    }
    response += `\n`;
  }
  
  // Personalized recommendations based on performance
  response += `💡 **Quick Actions:**\n`;
  
  if (practiceData && practiceData.activeSessions > 0) {
    response += `• Continue your active practice session\n`;
  }
  if (examData && examData.upcomingExams.length > 0) {
    const nextExam = examData.upcomingExams[0];
    const examDate = new Date(nextExam.scheduledDate).toLocaleDateString();
    response += `• Prepare for ${nextExam.title} (${examDate})\n`;
  }
  if (practiceData && practiceData.averageAccuracy < 70) {
    response += `• Boost your practice accuracy with focused sessions\n`;
  }
  if (examData && examData.averageScore < 70) {
    response += `• Review weak topics to improve exam scores\n`;
  }
  if (!practiceData || practiceData.totalSessions === 0) {
    response += `• Start your first adaptive practice test\n`;
  }
  if (summaryData && summaryData.sessionCount === 0) {
    response += `• Book a tutoring session to accelerate learning\n`;
  }
  
  response += `\n📈 What would you like to explore today?`;
  
  return response;
}

module.exports = {
  chatWithBot,
  getUserDashboardData,
  getChatbotSuggestions
};