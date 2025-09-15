const jwt = require('jsonwebtoken');

const generalSecretaryAuth = async (req, res, next) => {
  try {
    // Get token from header
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      throw new Error('No authentication token provided');
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if token has general secretary role
    if (decoded.role !== 'general secretary') {
      throw new Error('Access denied. Only general secretary can perform this action.');
    }

    // Add decoded info to request
    req.user = decoded;
    next();
  } catch (error) {
    console.error('General Secretary authentication error:', error);
    throw error;
  }
};

module.exports = generalSecretaryAuth;
