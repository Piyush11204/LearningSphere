const express = require('express');
const protect = require('../middleware/auth');
const { 
  chatWithBot, 
  getUserDashboardData, 
  getChatbotSuggestions 
} = require('../controllers/chatbotController.cjs');

const router = express.Router();

// Optional auth middleware - allows both authenticated and non-authenticated users
const optionalAuth = async (req, res, next) => {
  const authHeader = req.header('Authorization');
  const token = authHeader?.replace('Bearer ', '');
  
  if (token && token !== '<valid-token>' && token.length > 50) {
    // If token exists and looks valid, try to authenticate
    try {
      const jwt = require('jsonwebtoken');
      const User = require('../models/User');
      
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Fetch user to get role information
      const user = await User.findById(decoded.id).select('role isTutor profile email username');
      if (user) {
        req.user = { 
          id: decoded.id,
          role: user.role,
          isTutor: user.isTutor,
          profile: user.profile,
          username: user.username,
          email: user.email
        };
      } else {
        req.user = null;
      }
    } catch (error) {
      console.log('Optional auth failed, continuing as guest:', error.message);
      req.user = null;
    }
  } else {
    // No token or invalid token, continue without auth
    req.user = null;
  }
  next();
};

// Main chatbot conversation endpoint (works with or without auth)
// POST /api/chatbot/chat
router.post('/chat', optionalAuth, chatWithBot);

// Get comprehensive user dashboard data for chatbot context (requires auth)
// GET /api/chatbot/dashboard
router.get('/dashboard', protect, getUserDashboardData);

// Get contextual suggestions based on user role and query (works with or without auth)
// GET /api/chatbot/suggestions?category=academic
router.get('/suggestions', optionalAuth, getChatbotSuggestions);

module.exports = router;