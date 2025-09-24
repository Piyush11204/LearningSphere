const jwt = require('jsonwebtoken');
const User = require('../models/User');

module.exports = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    
    const token = authHeader?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ msg: 'No token, authorization denied' });
    }
    
    // Check if token is a placeholder
    if (token === '<valid-token>' || token.length < 20) {
      return res.status(401).json({ msg: 'Invalid token format' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Fetch user to get role information
    const user = await User.findById(decoded.id).select('role isTutor profile email');
    if (!user) {
      return res.status(401).json({ msg: 'User not found' });
    }
    
    req.user = { 
      id: decoded.id,
      role: user.role,
      isTutor: user.isTutor,
      profile: user.profile
    };
    next();
  } catch (error) {
    console.error('Auth middleware error:', error.message);
    res.status(401).json({ msg: 'Token is invalid', error: error.message });
  }
};
