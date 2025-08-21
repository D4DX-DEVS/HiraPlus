const jwt = require('jsonwebtoken');
const User = require('../models/User');

const leaderAuth = async (req, res, next) => {
  try {
    // Get token from header
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No authentication token provided'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user details and check if they are a leader
    const user = await User.findById(decoded.id).populate('department', 'title');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.role !== 'leader') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only leaders can perform this action.'
      });
    }

    // Add user info to request
    req.user = user;
    next();
  } catch (error) {
    console.error('Leader authentication error:', error);
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid authentication token'
      });
    }
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = leaderAuth;
