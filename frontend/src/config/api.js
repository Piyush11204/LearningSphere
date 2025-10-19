// API Configuration
const API_BASE_URL = 'https://learningsphere-1fgj.onrender.com';

export const API_URLS = {
  BASE: API_BASE_URL,
  USERS: `${API_BASE_URL}/api/users`,
  SESSIONS: `${API_BASE_URL}/api/sessions`,
  LIVE_SESSIONS: `${API_BASE_URL}/api/livesessions`,
  PROGRESS: `${API_BASE_URL}/api/progress`,
  MATCHING: `${API_BASE_URL}/api/matching`,
  REVIEWS: `${API_BASE_URL}/api/reviews`,
  ADMIN: `${API_BASE_URL}/api/admin`,
  CONTACT: `${API_BASE_URL}/api/contact`,
  AUTH: `${API_BASE_URL}/api/auth`,
  EXAMS: `${API_BASE_URL}/api/exams`,
  REPORTS: `${API_BASE_URL}/api/reports`,
  PRACTICE: `${API_BASE_URL}/api/practice`,
  QUESTIONS: `${API_BASE_URL}/api/questions`,
  CHATBOT: `${API_BASE_URL}/api/chatbot`
};

export default API_URLS;