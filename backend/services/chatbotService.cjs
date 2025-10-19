const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Enhanced chatbot response generation with comprehensive context
const generateChatbotResponse = async (userMessage, userContext) => {
  const models = ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-pro'];

  for (const modelName of models) {
    try {
      console.log(`Generating chatbot response with model: ${modelName}`);
      const model = genAI.getGenerativeModel({ model: modelName });

      const systemPrompt = createSystemPrompt(userContext);
      const contextualPrompt = createContextualPrompt(userMessage, userContext);

      const fullPrompt = `${systemPrompt}\n\n${contextualPrompt}`;

      const result = await model.generateContent(fullPrompt);
      const response = result.response.text();

      if (response && response.length > 20) {
        console.log(`Successfully generated chatbot response with ${modelName}`);
        return formatResponse(response, userContext);
      }
    } catch (error) {
      console.error(`Chatbot response error with ${modelName}:`, error.message);
      continue;
    }
  }

  // Fallback response
  return generateFallbackResponse(userMessage, userContext);
};

// Create comprehensive system prompt
function createSystemPrompt(userContext) {
  const { user, platform } = userContext;
  
  return `You are LearningSphere AI Assistant - an intelligent, helpful, and knowledgeable educational chatbot for the LearningSphere learning platform.

CORE IDENTITY:
- Name: LearningSphere AI Assistant
- Role: Educational Support & Adaptive Learning System
- Platform: ${platform.name} v${platform.version}
- Capabilities: Exam assistance, practice test guidance, progress analytics, study planning, tutor matching, live session support

USER CONTEXT:
- User: ${user.fullName} (${user.username})
- Role: ${user.role.toUpperCase()}
- Platform Features Available: ${platform.features.join(', ')}

CRITICAL FORMATTING RULES:
- NEVER use ** or * for formatting
- Use simple bullet points with • for lists
- Write in clean, readable text without markdown
- Use emojis sparingly: 📚 📊 🎓 ✅ 📅 🔔
- Keep responses conversational and natural

RESPONSE GUIDELINES:
1. Be conversational, helpful, and educational
2. Provide accurate information based on user's data
3. Keep responses informative yet concise
4. Offer actionable suggestions when appropriate
5. Maintain a professional yet friendly tone
6. Reference specific user data when available
7. Always start responses warmly using the user's name

SPECIAL INSTRUCTIONS:
- For academic queries: Provide detailed analysis with actionable insights
- For technical questions: Give clear step-by-step guidance
- For performance questions: Use specific metrics and trends
- For general chat: Be engaging while staying educational
- Always maintain user privacy and data security
- Suggest relevant platform features based on user needs

Remember: You have access to the user's complete academic profile, exam history, notifications, documents, timetables, and all platform data. Use this information to provide personalized, contextually relevant responses.`;
}

// Create contextual prompt with user data
function createContextualPrompt(userMessage, userContext) {
  const { user, intent, contextData, platform } = userContext;

  let dataContext = '';

  // Build relevant data context based on intent
  switch (intent) {
    case 'exam_info':
    case 'performance_info':
      if (contextData.exams || contextData.examHistory) {
        dataContext = `
📚 EXAM & PERFORMANCE DATA (LearningSphere):
- Total exams taken: ${user.examCount || user.actualExamParticipated || 0}
- Average score: ${user.averageScore?.toFixed(1) || 0}%
- Recent exams: ${contextData.exams?.length || 0} found
- Exam history entries: ${contextData.examHistory?.length || 0}
- Practice sessions completed: ${contextData.practiceSessionsCount || 0}
- Sectional tests taken: ${contextData.sectionalTestsCount || 0}

Recent exam details:
${contextData.exams?.slice(0, 3).map(exam => 
  `• ${exam.title} (${exam.subject}) - ${new Date(exam.scheduledDate).toLocaleDateString()}`
).join('\n') || 'No recent exams found'}

Performance history:
${contextData.examHistory?.slice(0, 5).map(attempt => 
  `• ${attempt.examId?.title || 'Unknown Exam'}: ${attempt.score || 0}% - ${attempt.status}`
).join('\n') || 'No exam history available'}

Practice & Sectional Performance:
• Practice sessions improve adaptive learning
• Sectional tests track topic-wise performance
• Difficulty adjusts based on consecutive answers`;
      }
      break;

    case 'notification_info':
      if (contextData.notifications) {
        dataContext = `
🔔 NOTIFICATIONS DATA:
- Total unread: ${contextData.unreadCount || 0}
- Recent notifications: ${contextData.notifications?.length || 0}

Recent notifications:
${contextData.notifications?.slice(0, 5).map(notif => 
  `• [${notif.priority}] ${notif.title}: ${notif.message.substring(0, 50)}...`
).join('\n') || 'No notifications found'}`;
      }
      break;

    case 'timetable_info':
      if (contextData.timetables) {
        dataContext = `
📅 TIMETABLE DATA:
- Available timetables: ${contextData.timetables?.length || 0}

Current timetables:
${contextData.timetables?.map(tt => 
  `• ${tt.class} ${tt.section || ''} - ${tt.slots?.length || 0} slots`
).join('\n') || 'No timetables found'}`;
      }
      break;

    case 'document_info':
      if (contextData.documents) {
        dataContext = `
📄 DOCUMENTS DATA:
- Total documents: ${contextData.documents?.length || 0}

Recent documents:
${contextData.documents?.slice(0, 5).map(doc => 
  `• ${doc.title} (${doc.type}) - ${doc.subject} - ${new Date(doc.createdAt).toLocaleDateString()}`
).join('\n') || 'No documents found'}`;
      }
      break;

    case 'attendance_info':
      if (contextData.attendance) {
        const totalDays = contextData.attendance?.length || 0;
        const presentDays = contextData.attendance?.filter(att => att.status === 'present').length || 0;
        const attendanceRate = totalDays > 0 ? ((presentDays / totalDays) * 100).toFixed(1) : 0;
        
        dataContext = `
📋 ATTENDANCE DATA:
- Total records: ${totalDays}
- Present days: ${presentDays}
- Attendance rate: ${attendanceRate}%

Recent attendance:
${contextData.attendance?.slice(0, 10).map(att => 
  `• ${new Date(att.date).toLocaleDateString()}: ${att.status} ${att.remarks ? '- ' + att.remarks : ''}`
).join('\n') || 'No attendance records found'}`;
      }
      break;

    case 'meeting_info':
      if (contextData.meetings) {
        dataContext = `
👥 MEETINGS DATA:
- Total meetings: ${contextData.meetings?.length || 0}

Upcoming/Recent meetings:
${contextData.meetings?.slice(0, 5).map(meeting => 
  `• ${meeting.title || 'Meeting'} - ${new Date(meeting.scheduledDate).toLocaleDateString()} at ${meeting.scheduledTime || 'TBD'}`
).join('\n') || 'No meetings found'}`;
      }
      break;

    case 'dashboard_info':
      if (contextData.dashboard) {
        const dash = contextData.dashboard;
        const examParticipated = dash.user?.examHistory?.length || dash.recentExams?.length || 0;
        dataContext = `
🎯 DASHBOARD OVERVIEW:
- Exams participated: ${examParticipated}
- Recent exams: ${dash.recentExams?.length || 0}
- Unread notifications: ${dash.unreadNotifications || 0}
- Documents: ${dash.documents?.length || 0}
- Upcoming meetings: ${dash.upcomingMeetings?.length || 0}
- Attendance records: ${dash.attendance?.length || 0}
- Average score: ${dash.user?.averageScore?.toFixed(1) || 'N/A'}%`;
      }
      break;

    default:
      if (contextData.summary) {
        const examCount = contextData.summary.examCount || 
                         contextData.dashboard?.user?.examHistory?.length || 
                         contextData.examHistory?.length || 0;
        
        dataContext = `
📊 QUICK SUMMARY:
- Exams participated: ${examCount}
- Documents created: ${contextData.summary.documentCount || 0}
- Unread notifications: ${contextData.summary.notificationCount || 0}
- Upcoming meetings: ${contextData.summary.upcomingMeetings || 0}`;
      }
      break;
  }

  return `USER MESSAGE: "${userMessage}"

USER PROFILE:
- Name: ${user.fullName}
- Role: ${user.role}
- Username: ${user.username}
- Email: ${user.email}
- Total notifications: ${user.totalNotifications || 0}

DETECTED INTENT: ${intent}

${dataContext}

PLATFORM INFORMATION:
- Platform: ${platform.name} v${platform.version}
- Available Features: ${platform.features.join(', ')}
- Current Time: ${new Date().toLocaleString()}

Please provide a helpful, personalized response based on the user's message and their available data. Include specific information from their profile when relevant, and offer actionable suggestions or guidance.`;
}

// Format the AI response for better presentation
function formatResponse(response, userContext) {
  const { user } = userContext;
  
  // Remove markdown formatting that doesn't render well in chat UI
  response = response
    .replace(/\*\*(.*?)\*\*/g, '$1')  // Remove bold markdown
    .replace(/\*(.*?)\*/g, '$1')      // Remove italic markdown
    .replace(/### (.*?)$/gm, '$1:')   // Convert headers to simple text with colon
    .replace(/## (.*?)$/gm, '$1:')    // Convert headers to simple text with colon
    .replace(/# (.*?)$/gm, '$1:')     // Convert headers to simple text with colon
    .replace(/- /g, '• ')             // Convert dashes to bullet points
    .replace(/\n\n/g, '\n')           // Reduce double line breaks
    .trim();
  
  // Add personalization if response seems generic
  if (!response.includes(user.username) && !response.includes(user.fullName)) {
    if (response.length < 100) {
      response = `Hi ${user.fullName}! ${response}`;
    }
  }

  // Ensure response ends appropriately
  if (!response.endsWith('.') && !response.endsWith('!') && !response.endsWith('?')) {
    response += '.';
  }

  // Add helpful footer for certain response types
  if (response.length > 200 && !response.includes('anything else')) {
    response += '\n\nIs there anything else you\'d like to know about your LearningSphere account or the platform?';
  }

  return response;
}

// Generate fallback response when AI fails
function generateFallbackResponse(userMessage, userContext) {
  const { user, intent, contextData } = userContext;
  
  const greetings = [`Hi ${user.fullName}!`, `Hello ${user.username}!`, `Hey there!`];
  const greeting = greetings[Math.floor(Math.random() * greetings.length)];

  switch (intent) {
    case 'exam_info':
      const examParticipated = user.examHistory?.length || contextData.examHistory?.length || user.examCount || user.actualExamParticipated || 0;
      const avgScore = user.averageScore || 0;
      const practiceCount = contextData.practiceSessionsCount || 0;
      const sectionalCount = contextData.sectionalTestsCount || 0;
      return `${greeting} 📚 I can see you're asking about exams on LearningSphere! You've taken ${examParticipated} exams, completed ${practiceCount} practice sessions, and ${sectionalCount} sectional tests with an average score of ${avgScore.toFixed(1)}%. ${contextData.exams?.length ? `You have ${contextData.exams.length} recent exams in your record.` : 'No recent exam data found.'} Would you like me to show you more details about your performance across all test types?`;

    case 'performance_info':
      const totalExams = user.examHistory?.length || contextData.examHistory?.length || user.examCount || 0;
      const performanceScore = user.averageScore || 0;
      return `${greeting} 📊 Based on your profile, you have completed ${totalExams} exams with an average score of ${performanceScore.toFixed(1)}%. Your performance data shows ${user.examHistory?.length || 0} exam attempts. Keep up the great work, and let me know if you'd like specific performance insights!`;

    case 'notification_info':
      return `${greeting} 🔔 You currently have ${user.totalNotifications || 0} total notifications. ${contextData.unreadCount ? `There are ${contextData.unreadCount} unread notifications waiting for you.` : 'All your notifications have been read!'} Would you like me to help you manage your notifications?`;

    case 'timetable_info':
      return `${greeting} 📅 I can help you with timetable information! ${contextData.timetables?.length ? `I found ${contextData.timetables.length} timetables associated with your account.` : 'Let me check your schedule details.'} What specific information about your timetable would you like to know?`;

    case 'document_info':
      return `${greeting} 📄 Regarding your documents, ${contextData.documents?.length ? `you have ${contextData.documents.length} documents in your account.` : 'I don\'t see any documents in your current profile.'} Would you like to create new documents or manage existing ones?`;

    case 'attendance_info':
      const attendanceData = contextData.attendance;
      const attendanceRate = attendanceData?.length > 0 ? 
        ((attendanceData.filter(a => a.status === 'present').length / attendanceData.length) * 100).toFixed(1) : 0;
      return `${greeting} 📋 Your attendance information shows ${attendanceData?.length || 0} recorded days with a ${attendanceRate}% attendance rate. ${attendanceRate > 80 ? 'Great attendance record!' : 'Consider improving your attendance for better academic performance.'} Need more attendance details?`;

    case 'meeting_info':
      return `${greeting} 👥 I can help with meeting information! ${contextData.meetings?.length ? `You have ${contextData.meetings.length} meetings in your record.` : 'No meeting data found for your account.'} Would you like to schedule a new meeting or check existing ones?`;

    case 'help':
      return `${greeting} 🤖 I'm your LearningSphere AI Assistant! I can help you with:
      
📚 Exams & Practice Tests (adaptive difficulty, progress tracking)
🎯 Sectional Tests (topic-wise performance analysis)
� Performance Analytics (detailed progress insights)
�‍🏫 Tutor Matching & Live Sessions
📅 Study Planning & Schedule Management
� Notifications & Updates
📋 Progress Tracking across all activities
🎓 Personalized Learning Recommendations

What aspect of your learning journey would you like to explore today?`;

    case 'greeting':
      const userExamCount = user.examHistory?.length || user.examCount || 0;
      return `${greeting} Welcome to LearningSphere! 🎓 I'm your AI assistant, ready to help you navigate the platform and access your academic information. You're logged in as ${user.role} with ${userExamCount} exams completed and ${user.totalNotifications || 0} notifications. How can I assist you today?`;

    case 'general_conversation':
      return `${greeting} I'm here to help you with your LearningSphere experience! As your AI assistant, I can provide information about your academic progress, schedule, notifications, and much more. What would you like to know about your account or the platform?`;

    default:
      const defaultExamCount = user.examHistory?.length || user.examCount || 0;
      return `${greeting} I understand you're asking about "${userMessage}". While I'm processing your request, I can tell you that you have ${defaultExamCount} exams completed and ${user.totalNotifications || 0} notifications. Is there something specific about your LearningSphere account I can help you with?`;
  }
}

// Advanced conversation context management
const updateConversationContext = async (userId, message, response, intent) => {
  try {
    // This could be enhanced to store conversation history
    // For now, we'll just log the interaction
    console.log(`Conversation logged for user ${userId}`, {
      intent,
      messageLength: message.length,
      responseLength: response.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error(`Error updating conversation context: ${error.message}`);
  }
};

// Generate contextual suggestions based on conversation
const generateContextualSuggestions = (userMessage, userContext) => {
  const { user, intent } = userContext;
  
  const suggestions = [];
  
  // Intent-based suggestions
  switch (intent) {
    case 'exam_info':
      suggestions.push(
        "Show my upcoming exams",
        "Check practice test progress",
        "View sectional test results", 
        "Show performance analytics",
        "Help me plan study schedule"
      );
      break;
      
    case 'timetable_info':
      suggestions.push(
        "What's my schedule today?",
        "Show next week's timetable",
        "Check for schedule conflicts",
        "When is my next class?"
      );
      break;
      
    case 'notification_info':
      suggestions.push(
        "Mark all as read",
        "Show high priority notifications",
        "Filter by notification type",
        "Check notification settings"
      );
      break;
      
    default:
      suggestions.push(
        "Show my dashboard",
        "Check my performance",
        "What's new today?",
        "Help me get started"
      );
  }
  
  // Role-based suggestions
  if (user.role === 'student' || user.role === 'learner') {
    suggestions.push("Take practice exam", "Check my progress", "Find available tutors");
  } else if (user.role === 'tutor' || user.role === 'teacher') {
    suggestions.push("View my students", "Create questions", "Schedule live session");
  } else if (user.role === 'admin') {
    suggestions.push("Platform analytics", "Manage users", "System reports");
  }
  
  return suggestions.slice(0, 6); // Return top 6 suggestions
};

module.exports = {
  generateChatbotResponse,
  updateConversationContext,
  generateContextualSuggestions
};