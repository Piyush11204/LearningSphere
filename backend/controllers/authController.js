const User = require('../models/User');
const Progress = require('../models/Progress');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { transporter, sendEmail } = require('../config/nodemailer');

// Register new user
exports.registerUser = async (req, res) => {
  try {
    const { email, password, name, interests, skills, location } = req.body;

    // Check if user exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ msg: 'User already exists' });
    }

    // Create user
    user = new User({
      email,
      password,
      profile: { name, interests, skills, location }
    });
    await user.save();

    // Create Progress entry and award Noobie badge
    const badgeDefinitions = Progress.getBadgeDefinitions();
    const noobieBadge = badgeDefinitions['noobie'];
    
    const progress = new Progress({
      user: user._id,
      experiencePoints: noobieBadge.xpReward,
      currentLevel: 1,
      badges: [{
        id: noobieBadge.id,
        name: noobieBadge.name,
        description: noobieBadge.description,
        category: noobieBadge.category,
        icon: noobieBadge.icon,
        xpReward: noobieBadge.xpReward,
        earnedAt: new Date()
      }]
    });
    await progress.save();

    console.log(`New user ${email} registered and awarded Noobie badge with ${noobieBadge.xpReward} XP`);

    // Generate token for immediate login
    const token = user.getJWTToken();

    res.status(201).json({ 
      msg: 'User registered successfully', 
      token, 
      user: { id: user._id, email: user.email, role: user.role } 
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ msg: 'Server error during registration', error: error.message });
  }
};

// Login user
exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    // Generate token
    const token = user.getJWTToken();

    res.json({ token, user: { id: user._id, email: user.email, role: user.role } });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ msg: 'Server error during login', error: error.message });
  }
};

// Forgot password - send reset email
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ msg: 'No user with that email' });
    }

    // Generate token
    const resetToken = crypto.randomBytes(20).toString('hex');
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpire = Date.now() + 3600000;  // 1 hour
    await user.save();

    const resetUrl = `${req.protocol}://${req.get('host')}/api/auth/reset/${resetToken}`;
    await transporter.sendMail({
      to: email,
      subject: 'Password Reset',
      html: `Click <a href="${resetUrl}">here</a> to reset your password. Expires in 1 hour.`
    });

    res.json({ msg: 'Reset email sent' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ msg: 'Server error sending reset email', error: error.message });
  }
};

// Reset password
exports.resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ msg: 'Invalid or expired token' });
    }

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.json({ msg: 'Password reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ msg: 'Server error resetting password', error: error.message });
  }
};

// Refresh token
exports.refreshToken = async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ msg: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({ msg: 'Invalid token' });
    }

    const newToken = user.getJWTToken();
    res.json({ token: newToken });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(500).json({ msg: 'Server error refreshing token', error: error.message });
  }
};

// Logout (client-side, but server can invalidate if using blacklist)
exports.logout = (req, res) => {
  try {
    // In a real app, add token to blacklist
    res.json({ msg: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ msg: 'Server error during logout', error: error.message });
  }
};

// Get user profile
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ msg: 'Server error getting profile', error: error.message });
  }
};
