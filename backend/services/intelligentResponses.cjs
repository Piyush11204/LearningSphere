// Intelligent Response Generation System for LearningSphere Chatbot
// This module provides context-aware, varied, and personalized responses

const getTimeBasedGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
};

const getRandomElement = (array) => {
  return array[Math.floor(Math.random() * array.length)];
};

// Greeting response variations
const generateGreetingResponse = async (userName, userId, progressData) => {
  const greeting = getTimeBasedGreeting();
  
  if (!userId) {
    const variations = [
      `${greeting}! 👋 Welcome to **LearningSphere** - your intelligent learning companion! I'm here to help you excel in your studies. Please log in to unlock personalized insights and adaptive learning features.`,
      `Hello there! 🌟 I'm your LearningSphere AI Assistant. Ready to revolutionize your learning experience? Log in to access your personalized dashboard, practice exams, and performance analytics!`,
      `Hi! Welcome to the future of adaptive learning! 🚀 I can help you with platform features and general questions. For your personalized learning journey, please sign in to your account.`
    ];
    return getRandomElement(variations);
  }
  
  const stats = progressData ? `You're currently at **Level ${progressData.currentLevel}** with **${progressData.experiencePoints} XP** and **${progressData.badges?.length || 0} badges** earned! 🏆` : '';
  
  const variations = [
    `${greeting}, **${userName}**! 👋 Great to see you back! ${stats}\n\nWhat would you like to explore today? Your progress, upcoming exams, or perhaps some personalized study recommendations?`,
    `Hey **${userName}**! 🌟 Welcome back to LearningSphere! ${stats}\n\nI'm ready to help you crush your learning goals. What's on your mind - exams, practice sessions, or performance insights?`,
    `${greeting}, **${userName}**! 🚀 ${stats}\n\nReady to level up your learning? I can help with exam prep, progress tracking, performance analytics, and more. What would you like to know?`
  ];
  
  return getRandomElement(variations);
};

// Dashboard/Overview response with intelligent insights
const generateDashboardResponse = async (userName, progressData, examData, practiceData) => {
  let response = `### 📊 Your LearningSphere Dashboard, **${userName}**\n\n`;
  
  // Performance Summary Card
  response += `#### 🎯 Performance at a Glance\n`;
  if (progressData) {
    const level = progressData.currentLevel || 1;
    const xp = progressData.experiencePoints || 0;
    const badges = progressData.badges?.length || 0;
    const streak = progressData.streak || 0;
    
    response += `• **Level:** ${level} ${level >= 5 ? '🌟' : level >= 3 ? '⭐' : '✨'}\n`;
    response += `• **Experience Points:** ${xp} XP\n`;
    response += `• **Badges Earned:** ${badges} 🏅\n`;
    if (streak > 0) {
      response += `• **Learning Streak:** ${streak} days 🔥\n`;
    }
    
    // XP to next level (assuming 1000 XP per level)
    const xpNeeded = ((level + 1) * 1000) - xp;
    if (xpNeeded > 0) {
      response += `• **Next Level:** ${xpNeeded} XP away! 🎯\n`;
    }
    response += `\n`;
    
    // Performance classification with motivational message
    const totalScore = (progressData.examsPassed + progressData.examsFailed) > 0 
      ? (progressData.examBestScore || 0) 
      : 0;
      
    if (totalScore >= 80) {
      response += `🌟 **Outstanding Performer!** You're in the top tier! Keep up the exceptional work!\n\n`;
    } else if (totalScore >= 60) {
      response += `📈 **Strong Progress!** You're doing well. Let's push you to excellence!\n\n`;
    } else if (totalScore > 0) {
      response += `💪 **Building Momentum!** Every expert was once a beginner. Let's improve together!\n\n`;
    }
  }
  
  // Exam Statistics
  if (examData && examData.totalExams > 0) {
    response += `#### 📚 Exam Statistics\n`;
    response += `• **Total Exams:** ${examData.totalExams}\n`;
    response += `• **Average Score:** ${examData.averageScore}%\n`;
    
    if (examData.upcomingExams && examData.upcomingExams.length > 0) {
      response += `• **Upcoming:** ${examData.upcomingExams.length} exam${examData.upcomingExams.length > 1 ? 's' : ''} scheduled\n`;
    }
    response += `\n`;
  }
  
  // Practice Progress
  if (practiceData && practiceData.length > 0) {
    const avgAccuracy = Math.round(
      practiceData.reduce((sum, p) => sum + (p.accuracy || 0), 0) / practiceData.length
    );
    
    response += `#### 🎓 Practice Sessions\n`;
    response += `• **Sessions Completed:** ${practiceData.length}\n`;
    response += `• **Average Accuracy:** ${avgAccuracy}%\n`;
    
    const accuracyEmoji = avgAccuracy >= 80 ? '🎯' : avgAccuracy >= 60 ? '📈' : '💡';
    response += `• **Performance:** ${accuracyEmoji} ${avgAccuracy >= 80 ? 'Excellent' : avgAccuracy >= 60 ? 'Good' : 'Improving'}\n\n`;
  }
  
  // Personalized recommendations
  response += `#### 💡 Smart Recommendations\n`;
  const recommendations = [];
  
  if (practiceData && practiceData.length > 0) {
    const avgAccuracy = practiceData.reduce((sum, p) => sum + (p.accuracy || 0), 0) / practiceData.length;
    if (avgAccuracy < 60) {
      recommendations.push("📖 Focus on weak areas - review incorrect answers from previous tests");
    } else if (avgAccuracy >= 80) {
      recommendations.push("🚀 Challenge yourself with harder difficulty levels");
    }
  }
  
  if (progressData && progressData.currentLevel < 5) {
    recommendations.push("⭐ Complete more practice sessions to reach the next level");
  }
  
  if (examData && examData.upcomingExams && examData.upcomingExams.length > 0) {
    const nextExam = examData.upcomingExams[0];
    const daysUntil = Math.ceil((new Date(nextExam.scheduledDate) - new Date()) / (1000 * 60 * 60 * 24));
    if (daysUntil <= 7) {
      recommendations.push(`⏰ Exam in ${daysUntil} days - start your preparation now!`);
    }
  }
  
  if (recommendations.length === 0) {
    recommendations.push("🎯 Keep practicing regularly to maintain your learning streak");
    recommendations.push("📊 Try sectional tests to identify specific areas for improvement");
  }
  
  recommendations.forEach(rec => {
    response += `• ${rec}\n`;
  });
  
  return response;
};

// Performance analysis with deep insights
const generatePerformanceResponse = async (userName, progressData, examData, practiceData) => {
  let response = `### 📈 Performance Analytics for **${userName}**\n\n`;
  
  if (!progressData && (!examData || examData.totalExams === 0)) {
    return `Hi **${userName}**! 🌟 You haven't started your learning journey yet. Let's get you started!\n\n` +
           `**Quick Start Steps:**\n` +
           `1. 🎯 Take a practice test to assess your current level\n` +
           `2. 📚 Review our adaptive learning modules\n` +
           `3. 🏆 Set your first learning goal\n\n` +
           `Ready to begin? Just say "Start practice test" or "Show available courses"!`;
  }
  
  // Level & XP Analysis
  if (progressData) {
    response += `#### 🎖️ Your Learning Profile\n`;
    response += `• **Current Level:** ${progressData.currentLevel}\n`;
    response += `• **Total XP Earned:** ${progressData.experiencePoints}\n`;
    response += `• **Total Learning Hours:** ${progressData.totalHours || 0} hrs\n`;
    
    const streak = progressData.streak?.days || progressData.streak || 0;
    response += `• **Active Streak:** ${streak} days\n\n`;
    
    // Badge Showcase
    if (progressData.badges && progressData.badges.length > 0) {
      response += `#### 🏅 Achievements Unlocked\n`;
      
      // Sort badges by most recently earned
      const recentBadges = progressData.badges.slice(-3).reverse();
      recentBadges.forEach((badge, index) => {
        response += `${index + 1}. ${badge.icon || '🏆'} **${badge.name}**\n`;
        if (badge.description) {
          response += `   *${badge.description}*\n`;
        }
      });
      
      if (progressData.badges.length > 3) {
        response += `\n*...and ${progressData.badges.length - 3} more badges!*\n`;
      }
      response += `\n`;
    }
  }
  
  // Exam Performance Deep Dive
  if (examData && examData.totalExams > 0) {
    response += `#### 📊 Exam Performance Analysis\n`;
    response += `• **Exams Taken:** ${examData.totalExams}\n`;
    response += `• **Average Score:** ${examData.averageScore}%\n`;
    
    if (progressData) {
      const passed = progressData.examsPassed || 0;
      const failed = progressData.examsFailed || 0;
      const passRate = (passed + failed) > 0 ? Math.round((passed / (passed + failed)) * 100) : 0;
      
      response += `• **Pass Rate:** ${passRate}% (${passed} passed, ${failed} failed)\n`;
      response += `• **Best Score:** ${progressData.examBestScore || 0}%\n\n`;
      
      // Performance trend
      if (examData.recentExams && examData.recentExams.length >= 2) {
        const trend = examData.recentExams[0].score - examData.recentExams[1].score;
        if (trend > 5) {
          response += `📈 **Trending Up!** Your scores are improving (+${trend}%)!\n`;
        } else if (trend < -5) {
          response += `⚠️ **Needs Attention:** Recent dip in performance (${trend}%). Let's get you back on track!\n`;
        } else {
          response += `➡️ **Stable Performance:** Maintaining consistent scores.\n`;
        }
      }
      response += `\n`;
    }
  }
  
  // Practice Session Analysis
  if (practiceData && practiceData.length > 0) {
    const avgAccuracy = Math.round(
      practiceData.reduce((sum, p) => sum + (p.accuracy || 0), 0) / practiceData.length
    );
    const totalQuestions = practiceData.reduce((sum, p) => sum + (p.questionsAttempted || 0), 0);
    const correctAnswers = practiceData.reduce((sum, p) => {
      const correct = Math.round((p.questionsAttempted || 0) * (p.accuracy || 0) / 100);
      return sum + correct;
    }, 0);
    
    response += `#### 🎯 Practice Test Insights\n`;
    response += `• **Total Practice Sessions:** ${practiceData.length}\n`;
    response += `• **Questions Attempted:** ${totalQuestions}\n`;
    response += `• **Correct Answers:** ${correctAnswers}\n`;
    response += `• **Overall Accuracy:** ${avgAccuracy}%\n\n`;
    
    // Accuracy classification
    if (avgAccuracy >= 80) {
      response += `🌟 **Excellent!** You're mastering the material!\n`;
    } else if (avgAccuracy >= 60) {
      response += `👍 **Good Job!** You're making solid progress!\n`;
    } else if (avgAccuracy >= 40) {
      response += `📚 **Keep Practicing!** You're building your foundation!\n`;
    } else {
      response += `💪 **Don't Give Up!** Review basics and try again - you've got this!\n`;
    }
    response += `\n`;
  }
  
  // Actionable Recommendations
  response += `#### 🎯 Personalized Action Items\n`;
  const actions = [];
  
  if (practiceData && practiceData.length > 0) {
    const avgAccuracy = practiceData.reduce((sum, p) => sum + (p.accuracy || 0), 0) / practiceData.length;
    if (avgAccuracy < 70) {
      actions.push("📖 Review incorrect answers and understand your mistakes");
      actions.push("🎓 Take subject-specific targeted practice tests");
    }
  }
  
  if (progressData && progressData.totalHours < 10) {
    actions.push("⏱️ Increase daily study time for better retention");
  }
  
  if (progressData && progressData.streak < 7) {
    actions.push("🔥 Build a consistent daily learning habit");
  }
  
  if (actions.length === 0) {
    actions.push("🚀 Challenge yourself with advanced topics");
    actions.push("🤝 Consider joining study groups or live sessions");
    actions.push("🎯 Set higher performance goals");
  }
  
  actions.forEach((action, index) => {
    response += `${index + 1}. ${action}\n`;
  });
  
  return response;
};

// Exam-specific response with scheduling and preparation tips
const generateExamResponse = async (userName, examData, practiceData) => {
  if (!examData || examData.totalExams === 0) {
    const variations = [
      `Hi **${userName}**! 📚 You haven't taken any exams yet. Ready to test your knowledge?\n\n` +
      `**Getting Started:**\n` +
      `• 🎯 Take a practice test to warm up\n` +
      `• 📊 Start with a sectional test to find your strong areas\n` +
      `• 🚀 Jump into a full adaptive exam when you're ready\n\n` +
      `Which would you like to try first?`,
      
      `Hey **${userName}**! 🌟 No exams on record yet - let's change that!\n\n` +
      `**Exam Options:**\n` +
      `1. **Practice Exams** - Low pressure, high learning\n` +
      `2. **Sectional Tests** - Focus on specific topics\n` +
      `3. **Full Adaptive Exams** - Challenge your knowledge\n\n` +
      `What's your preference?`
    ];
    return getRandomElement(variations);
  }
  
  let response = `### 📚 Exam Center for **${userName}**\n\n`;
  
  // Overall Stats
  response += `#### 📊 Your Exam Statistics\n`;
  response += `• **Total Exams:** ${examData.totalExams}\n`;
  response += `• **Average Score:** ${examData.averageScore}%\n`;
  
  const performanceLevel = examData.averageScore >= 80 ? '🌟 Outstanding' :
                          examData.averageScore >= 60 ? '📈 Strong' :
                          examData.averageScore >= 40 ? '💪 Developing' : '🎯 Needs Focus';
  response += `• **Performance Level:** ${performanceLevel}\n\n`;
  
  // Recent Performance
  if (examData.recentExams && examData.recentExams.length > 0) {
    response += `#### 🏆 Recent Exam Results\n`;
    examData.recentExams.forEach((exam, index) => {
      const scoreIcon = exam.score >= 70 ? '✅' : exam.score >= 50 ? '⚠️' : '❌';
      const date = new Date(exam.submittedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      response += `${index + 1}. **${exam.title}** ${scoreIcon}\n`;
      response += `   ${exam.subject} - ${exam.score}% on ${date}\n`;
    });
    response += `\n`;
    
    // Trend Analysis
    if (examData.recentExams.length >= 2) {
      const latest = examData.recentExams[0].score;
      const previous = examData.recentExams[1].score;
      const change = latest - previous;
      
      if (change > 10) {
        response += `📈 **Great Progress!** Your score improved by ${change}% from your last exam!\n\n`;
      } else if (change < -10) {
        response += `⚠️ **Performance Dip:** Score dropped by ${Math.abs(change)}%. Let's identify what went wrong and fix it!\n\n`;
      } else {
        response += `➡️ **Consistent Performance:** Scores are stable. Time to push for improvement!\n\n`;
      }
    }
  }
  
  // Upcoming Exams
  if (examData.upcomingExams && examData.upcomingExams.length > 0) {
    response += `#### 📅 Upcoming Exams\n`;
    examData.upcomingExams.forEach((exam, index) => {
      const date = new Date(exam.scheduledDate);
      const daysUntil = Math.ceil((date - new Date()) / (1000 * 60 * 60 * 24));
      const urgency = daysUntil <= 3 ? '🔴' : daysUntil <= 7 ? '🟡' : '🟢';
      
      response += `${index + 1}. ${urgency} **${exam.title}**\n`;
      response += `   ${exam.subject} - in ${daysUntil} day${daysUntil !== 1 ? 's' : ''}\n`;
      response += `   Duration: ${exam.duration} mins\n`;
    });
    response += `\n`;
  }
  
  // Preparation Recommendations
  response += `#### 💡 Exam Preparation Tips\n`;
  const tips = [];
  
  if (examData.averageScore < 70) {
    tips.push("📖 Review fundamentals before attempting challenging topics");
    tips.push("🎯 Focus on practice tests to build confidence");
  }
  
  if (practiceData && practiceData.length < 5) {
    tips.push("📝 Take more practice tests - they're the best exam prep!");
  }
  
  if (examData.upcomingExams && examData.upcomingExams.length > 0) {
    tips.push("⏰ Create a study schedule leading up to your exam");
    tips.push("🧘 Get adequate rest before exam day");
  }
  
  if (tips.length === 0) {
    tips.push("🚀 You're well-prepared! Stay consistent and confident");
    tips.push("📊 Analyze your past mistakes to avoid repeating them");
  }
  
  tips.forEach(tip => response += `• ${tip}\n`);
  
  return response;
};

// Help response with platform capabilities
const generateHelpResponse = async (userName, progressData) => {
  const variations = [
    `### 🤝 I'm Here to Help, **${userName}**!\n\n` +
    `I'm your intelligent LearningSphere assistant, powered by advanced AI to make your learning journey seamless and effective.\n\n` +
    `#### 🎯 What I Can Do For You:\n\n` +
    `**📊 Performance Tracking:**\n` +
    `• View your real-time progress, XP, and level\n` +
    `• Track badge achievements and milestones\n` +
    `• Analyze exam performance and trends\n` +
    `• Get detailed accuracy reports from practice tests\n\n` +
    `**📚 Learning Resources:**\n` +
    `• Access adaptive practice exams\n` +
    `• Take subject-specific sectional tests\n` +
    `• Review exam history and upcoming schedules\n` +
    `• Get personalized study recommendations\n\n` +
    `**🎓 Smart Features:**\n` +
    `• Adaptive difficulty adjustment\n` +
    `• Personalized learning paths\n` +
    `• Performance analytics with insights\n` +
    `• Real-time feedback and suggestions\n\n` +
    `${progressData ? `**Your Current Status:** Level ${progressData.currentLevel} | ${progressData.experiencePoints} XP | ${progressData.badges?.length || 0} Badges 🏅\n\n` : ''}` +
    `#### 💬 Quick Commands:\n` +
    `• "Show my dashboard" - Complete profile overview\n` +
    `• "Check my performance" - Detailed analytics\n` +
    `• "View my exams" - Exam history and schedule\n` +
    `• "Show practice progress" - Practice test insights\n\n` +
    `**Need something specific?** Just ask! I understand natural language. 😊`,
    
    `### 👋 Hi **${userName}**, Let Me Show You Around!\n\n` +
    `Think of me as your personal learning coach, available 24/7 to help you excel in your studies.\n\n` +
    `#### 🌟 Platform Capabilities:\n\n` +
    `**1. 📈 Progress Monitoring**\n` +
    `   • Real-time XP and level tracking\n` +
    `   • Badge collection and achievements\n` +
    `   • Learning streak and consistency metrics\n\n` +
    `**2. 🎯 Exam Management**\n` +
    `   • Comprehensive exam history\n` +
    `   • Upcoming exam schedules\n` +
    `   • Performance trends and analytics\n` +
    `   • Subject-wise score breakdown\n\n` +
    `**3. 💡 Practice & Learning**\n` +
    `   • Adaptive practice sessions\n` +
    `   • Sectional tests for focused learning\n` +
    `   • Accuracy tracking and improvement tips\n` +
    `   • Dynamic difficulty adjustment\n\n` +
    `**4. 🤖 AI-Powered Insights**\n` +
    `   • Personalized recommendations\n` +
    `   • Weak area identification\n` +
    `   • Study schedule optimization\n` +
    `   • Goal setting and tracking\n\n` +
    `${progressData ? `\n**📊 Your Stats:** ${progressData.currentLevel} Level | ${progressData.experiencePoints} XP | ${progressData.badges?.length || 0} Badges Earned\n\n` : ''}` +
    `#### 🗣️ How to Talk to Me:\n` +
    `Just type naturally! I understand questions like:\n` +
    `• "How am I doing in exams?"\n` +
    `• "Show my recent practice tests"\n` +
    `• "What should I focus on?"\n` +
    `• "When is my next exam?"\n\n` +
    `Try me out! What would you like to know? 🚀`
  ];
  
  return getRandomElement(variations);
};

// Goodbye response
const generateGoodbyeResponse = (userName) => {
  const variations = [
    `Goodbye, **${userName}**! 👋 Keep up the great work, and I'll see you soon for your next learning session. Remember - consistency is key! 🎯`,
    `See you later, **${userName}**! 🌟 Don't forget to practice daily to maintain your streak. Happy learning! 📚`,
    `Take care, **${userName}**! 🚀 I'm always here when you need help. Keep pushing towards your goals! 💪`,
    `Until next time, **${userName}**! ✨ Remember, every practice session brings you closer to mastery. Stay awesome! 🏆`
  ];
  return getRandomElement(variations);
};

// General conversation fallback
const generateFallbackResponse = (userName, intent) => {
  const variations = [
    `Hi **${userName}**! 🤔 I'm not quite sure what you're looking for. Let me help!\n\n` +
    `I can assist with:\n` +
    `• 📊 **Performance** - "Show my stats" or "Check my progress"\n` +
    `• 📚 **Exams** - "View my exam history" or "Upcoming tests"\n` +
    `• 🎯 **Practice** - "Practice test results" or "Start practice"\n` +
    `• ❓ **Help** - "What can you do?" or "Platform features"\n\n` +
    `What would you like to explore?`,
    
    `Hey **${userName}**! 💭 I didn't quite catch that. No worries - I'm here to help!\n\n` +
    `**Try asking me about:**\n` +
    `• Your performance and achievements\n` +
    `• Exam schedules and results\n` +
    `• Practice test analytics\n` +
    `• Platform capabilities\n\n` +
    `Which topic interests you?`,
    
    `**${userName}**, I want to make sure I help you correctly! 🎯\n\n` +
    `Here's what I'm great at:\n` +
    `• Showing your learning progress and stats\n` +
    `• Providing exam information and insights\n` +
    `• Analyzing practice test performance\n` +
    `• Explaining platform features\n\n` +
    `Could you rephrase your question using any of these topics?`
  ];
  
  return getRandomElement(variations);
};

module.exports = {
  generateGreetingResponse,
  generateDashboardResponse,
  generatePerformanceResponse,
  generateExamResponse,
  generateHelpResponse,
  generateGoodbyeResponse,
  generateFallbackResponse
};
