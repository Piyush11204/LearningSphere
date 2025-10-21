const express = require('express');
const { registerUser, loginUser, forgotPassword, resetPassword, refreshToken, logout, getProfile } = require('../controllers/authController');
const auth = require('../middleware/auth');

const router = express.Router();

// Public routes
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/forgot', forgotPassword);
router.put('/reset/:token', resetPassword);

// Protected routes
router.get('/me', auth, (req, res) => {
  res.json({ msg: 'Authenticated', userId: req.user.id });
});
router.get('/verify', auth, async (req, res) => {
  try {
    const User = require('../models/User');
    const user = await User.findById(req.user.id).select('-password');
    res.json({ 
      msg: 'Token verified', 
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        profile: user.profile
      }
    });
  } catch (error) {
    res.status(500).json({ msg: 'Server error during verification' });
  }
});
router.get('/profile', auth, getProfile);
router.get('/refresh', auth, refreshToken);
router.post('/logout', auth, logout);

module.exports = router;
