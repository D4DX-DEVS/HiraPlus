const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  try {
    const token = req.header('Authorization').replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (!decoded.isAdmin) {
      throw new Error();
    }

    // Attach admin user info to request
    req.user = {
      _id: process.env.ADMIN_ID || 'admin',
      name: 'Admin',
      role: 'admin'
    };

    next();
  } catch (error) {
    res.status(401).json({ message: 'Admin authentication required' });
  }
}; 