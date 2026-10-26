const jwt = require('jsonwebtoken');
const User = require('../models/User');

const driverAuth = async (req, res, next) => {
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
    
    // Get user details and check if they are a driver
    const user = await User.findById(decoded.id).populate('department', 'title').populate('role', 'name');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (!user.role || user.role.name !== 'driver') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only drivers can perform this action.'
      });
    }

    // Add user info to request
    req.user = user;
    next();
  } catch (error) {
    console.error('Driver authentication error:', error);
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

module.exports = driverAuth;

