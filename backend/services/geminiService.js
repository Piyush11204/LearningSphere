const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Generate exam questions using Gemini AI
const generateExamQuestions = async (subject, numQuestions = 10, difficulty = 'medium') => {
  const models = ['gemini-2.5-flash', 'gemini-2.5-pro'];

  for (const modelName of models) {
    try {
      console.log(`Attempting to generate questions with Gemini model: ${modelName}`);
      const model = genAI.getGenerativeModel({ model: modelName });
    
      const prompt = `Generate ${numQuestions} multiple choice questions for the subject "${subject}" with ${difficulty} difficulty level.
    
      Format the response as a JSON array where each question has:
      - questionText: The question text
      - options: Array of 4 multiple choice options (A, B, C, D)
      - correctAnswer: The correct option letter (A, B, C, or D)
      - type: "mcq"
      - marks: 1
    
      Make sure questions are educational, clear, and appropriate for the difficulty level.
      Subject: ${subject}
      Difficulty: ${difficulty}
    
      Return only the JSON array, no additional text.`;

      const result = await model.generateContent(prompt);
      const response = result.response;
      let text = response.text();
      
      // Clean up the response to extract JSON
      text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      
      try {
        const questions = JSON.parse(text);
        
        // Validate and format questions
        const validatedQuestions = questions.map((q, index) => ({
          questionText: q.questionText || `Question ${index + 1}`,
          options: Array.isArray(q.options) ? q.options.slice(0, 4) : ['Option A', 'Option B', 'Option C', 'Option D'],
          correctAnswer: q.correctAnswer || 'A',
          type: 'mcq',
          marks: 1
        }));
        
        return validatedQuestions.slice(0, numQuestions);
      } catch (parseError) {
        console.error('Error parsing Gemini response:', parseError);
        // Continue to next model if parsing fails
        continue;
      }
    } catch (modelError) {
      console.error(`Error with model ${modelName}:`, modelError.message);
      if (modelName === models[models.length - 1]) {
        // If this is the last model, fall back to default questions
        console.log('All Gemini models failed, using default questions');
        break;
      }
      // Try next model
      continue;
    }
  }

  // Fallback to default questions if all models fail
  console.log('Using fallback default questions');
  return generateDefaultQuestions(subject, numQuestions);
};

// Generate performance report using Gemini AI
const generateReport = async (reportData) => {
  const models = ['gemini-2.5-flash', 'gemini-2.5-pro'];

  for (const modelName of models) {
    try {
      console.log(`Attempting to generate report with Gemini model: ${modelName}`);
      const model = genAI.getGenerativeModel({ model: modelName });

      let prompt = '';

      if (reportData.username) {
        // Student report
        prompt = `Generate a comprehensive performance report for student: ${reportData.username}

        Overall Statistics:
        - Current Level: ${reportData.currentLevel || 1}
        - Experience Points: ${reportData.experiencePoints || 0} XP
        - Total Badges Earned: ${reportData.badges || 0}
        - Sessions Completed: ${reportData.totalSessions || 0}
        - Total Learning Hours: ${reportData.totalHours || 0}h

        Exam Performance:
        - Total Exams: ${reportData.examCount || 0}
        - Average Score: ${reportData.averageScore || 0}%
        - Recent Exam History: ${JSON.stringify(reportData.examHistory?.slice(-5) || [])}

        Practice Sessions:
        - Total Practice Sessions: ${reportData.practiceSessionsCount || 0}
        - Recent Practice History: ${JSON.stringify(reportData.practiceHistory?.slice(-5) || [])}

        Sectional Tests:
        - Total Sectional Tests: ${reportData.sectionalTestsCount || 0}
        - Sectional Test Stats: ${JSON.stringify(reportData.sectionalTestStats || {})}
        - Recent Sectional History: ${JSON.stringify(reportData.sectionalHistory?.slice(-5) || [])}

        Please provide a detailed report in Markdown format with the following sections:
        1. **Overall Performance Analysis**: Include academic and engagement metrics across all learning activities.
        2. **Strengths and Areas for Improvement**: Analyze exams, practice sessions, and sectional tests.
        3. **Specific Recommendations**: For better performance in each activity type.
        4. **Study Suggestions and Learning Strategies**: Based on practice and sectional test patterns.
        5. **Goal Setting Advice**: Based on current progress across all learning activities.
        6. **Badge Achievements**: What they represent.
        7. **Learning Patterns Analysis**: From practice sessions and sectional tests.
        8. **Balancing Activities**: Recommendations for balancing different types of learning activities.

        Make the report encouraging, constructive, and actionable. Include insights about learning patterns and progress trends across all activity types. Return only the Markdown report, no additional text.`;
      } else if (reportData.title) {
        // Exam report
        prompt = `Generate a comprehensive exam report for: ${reportData.title}

        Exam Statistics:
        - Scheduled Date: ${reportData.scheduledDate}
        - Total Participants: ${reportData.participants || 0}
        - Average Score: ${reportData.averageScore || 0}%
        - Results Summary: ${JSON.stringify(reportData.results || [])}

        Please provide a detailed report in Markdown format with the following sections:
        1. **Overall Exam Performance Analysis**
        2. **Question Difficulty Analysis**
        3. **Student Performance Distribution**
        4. **Recommendations for Future Exams**
        5. **Areas Where Students Struggled Most**

        Make the report professional and analytical. Return only the Markdown report, no additional text.`;
      }

      console.log('Attempting to generate report with Gemini API...');
      const result = await model.generateContent(prompt);
      const response = result.response;
      const reportText = response.text();
      console.log(`Report generated successfully with model: ${modelName}`);
      return reportText;

    } catch (modelError) {
      console.error(`Error with model ${modelName}:`, modelError.message);
      if (modelName === models[models.length - 1]) {
        // If this is the last model, fall back to mock report
        console.log('All Gemini models failed, using fallback mock report');
        break;
      }
      // Try next model
      continue;
    }
  }

  // Fallback mock report with improved format
  console.log('Using fallback mock report generation');
  if (reportData.username) {
    // Calculate progress percentage based on activities
    const totalActivities = (reportData.examCount || 0) + (reportData.practiceSessionsCount || 0) + (reportData.sectionalTestsCount || 0);
    const progressPercentage = totalActivities > 0 ? Math.min(Math.round((totalActivities / 10) * 100), 100) : 0;

    // Calculate study hours from sessions (assuming 1 hour per session if not provided)
    const studyHours = reportData.totalHours || reportData.totalSessions || 0;

    // Calculate exams passed (assuming exams with score >= 60% are passed)
    const examsPassed = reportData.examHistory ? reportData.examHistory.filter(exam => exam.score >= 60).length : 0;

    return `# Performance Report for ${reportData.username}

## 1. Overall Performance Analysis
${reportData.username} has completed ${reportData.totalSessions || 0} sessions across ${studyHours} hours, earning ${reportData.experiencePoints || 0} XP and ${reportData.badges || 0} badges. The average exam score is ${reportData.averageScore || 0}%, indicating ${reportData.averageScore >= 80 ? 'excellent' : reportData.averageScore >= 60 ? 'good' : 'developing'} mastery. Engagement is ${reportData.totalSessions > 10 ? 'high' : 'moderate'}, with opportunities for growth in consistent practice.

## 2. Strengths and Areas for Improvement

### Strengths:
- **Exam Performance**: ${examsPassed} out of ${reportData.examCount || 0} exams passed.
- **Practice Engagement**: ${reportData.practiceSessionsCount || 0} sessions completed.
- **Sectional Mastery**: ${reportData.sectionalTestsCount || 0} tests taken, focusing on specific topics.

### Areas for Improvement:
- Increase session consistency if streak is low (${reportData.streak?.current || 0} days).
- Focus on weak sections identified in recent history.

## 3. Specific Recommendations for Better Performance
- For Exams: Practice timed mocks and review errors.
- For Practice Sessions: Daily short sessions for retention.
- For Sectional Tests: Target low-scoring areas first.

## 4. Study Suggestions and Learning Strategies
- Use active recall and spaced repetition.
- Mix topics in sessions for better retention.
- Track progress weekly.

## 5. Goal Setting Advice Based on Current Progress
### Short-term (1-2 weeks):
- Complete 5 more sessions.
- Improve average score by 5%.

### Medium-term (1-2 months):
- Earn 2 more badges.
- Reach ${reportData.currentLevel + 1 || 2} level.

### Long-term (3-6 months):
- Achieve 80% average across all activities.

## 6. Badge Achievements
${reportData.badges > 0 ? `Earned ${reportData.badges} badges representing key milestones in learning.` : 'Start earning badges by completing challenges.'}

## 7. Learning Patterns Analysis
Based on history, focus on consistent daily engagement to build streaks.

## 8. Balancing Activities
Allocate 40% to exams, 30% to practice, 30% to sectional tests for balanced growth.

## Performance Metrics Table
| Metric | Value |
|--------|-------|
| Progress | ${progressPercentage}% |
| Total Sessions | ${reportData.totalSessions || 0} |
| Total Hours | ${studyHours}h |
| Current Level | ${reportData.currentLevel || 1} |
| Learning Streak | ${reportData.streak?.current || 0} days |
| Exams Passed | ${examsPassed} |
| Average Score | ${reportData.averageScore || 0}% |

## Conclusion
Keep up the great work, ${reportData.username}! With these strategies, you'll see significant improvements.`;
  } else {
    return `## Exam Report: ${reportData.title || 'Unknown Exam'}

### 1. Overall Exam Performance Analysis
With ${reportData.participants || 0} participants and average score of ${reportData.averageScore || 0}%, the exam showed ${reportData.averageScore >= 80 ? 'strong' : 'moderate'} performance.

### 2. Question Difficulty Analysis
Questions varied in difficulty; analyze results for specifics.

### 3. Student Performance Distribution
- High performers: Above 80%
- Average: 60-80%
- Needs improvement: Below 60%

### 4. Recommendations for Future Exams
- Adjust difficulty based on feedback.
- Provide more prep materials.

### 5. Areas Where Students Struggled Most
Focus on challenging topics identified in results.

*Report complete. Use insights for improvements.*`;
  }
};

// Generate default questions as fallback
const generateDefaultQuestions = (subject, numQuestions) => {
  const defaultQuestions = [];
  
  for (let i = 1; i <= numQuestions; i++) {
    defaultQuestions.push({
      questionText: `Sample ${subject} question ${i}. What is the correct answer?`,
      options: [
        `${subject} Option A`,
        `${subject} Option B`, 
        `${subject} Option C`,
        `${subject} Option D`
      ],
      correctAnswer: 'A',
      type: 'mcq',
      marks: 1
    });
  }
  
  return defaultQuestions;
};

module.exports = {
  generateExamQuestions,
  generateReport
};