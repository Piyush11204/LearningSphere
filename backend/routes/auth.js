const express = require('express');
const { registerUser, loginUser, verifyEmail, forgotPassword, resetPassword, refreshToken, logout } = require('../controllers/authController');
const auth = require('../middleware/auth');

const router = express.Router();

// Public routes
router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/verify/:token', verifyEmail);
router.post('/forgot', forgotPassword);
router.put('/reset/:token', resetPassword);

// Protected routes
router.get('/me', auth, (req, res) => {
  res.json({ msg: 'Authenticated', userId: req.user.id });
});
router.get('/refresh', auth, refreshToken);
router.post('/logout', auth, logout);

module.exports = router;
