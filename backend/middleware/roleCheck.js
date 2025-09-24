const User = require('../models/User');

module.exports = (roles) => async (req, res, next) => {
  try {
    // Handle both single role and array of roles
    const allowedRoles = Array.isArray(roles) ? roles : [roles];
    
    // Since auth middleware now populates req.user with role, we can use it directly
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        msg: 'Access denied: insufficient role',
        userRole: req.user?.role,
        requiredRoles: allowedRoles
      });
    }
    next();
  } catch (error) {
    console.error('Role check error:', error);
    res.status(500).json({ msg: 'Server error checking role', error: error.message });
  }
};
