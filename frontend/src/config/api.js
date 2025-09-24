// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

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
  AUTH: `${API_BASE_URL}/api/auth`
};

export default API_URLS;