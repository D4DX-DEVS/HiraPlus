const jwt = require('jsonwebtoken');

const generalSecretaryAuth = async (req, res, next) => {
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
    
    // Check if token has general secretary role
    if (decoded.role !== 'general secretary') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only general secretary can perform this action.'
      });
    }

    // Add decoded info to request
    req.user = decoded;
    next();
  } catch (error) {
    console.error('General Secretary authentication error:', error);
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

module.exports = generalSecretaryAuth;
