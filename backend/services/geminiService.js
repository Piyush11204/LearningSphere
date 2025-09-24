const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Generate exam questions using Gemini AI
const generateExamQuestions = async (subject, numQuestions = 10, difficulty = 'medium') => {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
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
      // Return default questions if parsing fails
      return generateDefaultQuestions(subject, numQuestions);
    }
  } catch (error) {
    console.error('Error generating questions with Gemini:', error);
    // Return default questions as fallback
    return generateDefaultQuestions(subject, numQuestions);
  }
};

// Generate performance report using Gemini AI
const generateReport = async (reportData) => {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    let prompt = '';
    
    if (reportData.username) {
      // Student report
      prompt = `Generate a comprehensive performance report for student: ${reportData.username}
      
      Exam Statistics:
      - Total Exams: ${reportData.examCount || 0}
      - Average Score: ${reportData.averageScore || 0}%
      - Recent Performance: ${JSON.stringify(reportData.examHistory?.slice(-5) || [])}
      
      Please provide:
      1. Overall performance analysis
      2. Strengths and areas for improvement
      3. Specific recommendations for better performance
      4. Study suggestions
      5. Goal setting advice
      
      Make the report encouraging, constructive, and actionable.`;
    } else if (reportData.title) {
      // Exam report
      prompt = `Generate a comprehensive exam report for: ${reportData.title}
      
      Exam Statistics:
      - Scheduled Date: ${reportData.scheduledDate}
      - Total Participants: ${reportData.participants || 0}
      - Average Score: ${reportData.averageScore || 0}%
      - Results Summary: ${JSON.stringify(reportData.results || [])}
      
      Please provide:
      1. Overall exam performance analysis
      2. Question difficulty analysis
      3. Student performance distribution
      4. Recommendations for future exams
      5. Areas where students struggled most
      
      Make the report professional and analytical.`;
    }

    const result = await model.generateContent(prompt);
    const response = result.response;
    return response.text();
  } catch (error) {
    console.error('Error generating report with Gemini:', error);
    return 'Report generation is currently unavailable. Please try again later.';
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