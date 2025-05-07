const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  try {
    const token = req.header('Authorization').replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (!decoded.isAdmin) {
      throw new Error();
    }

    next();
  } catch (error) {
    res.status(401).json({ message: 'Admin authentication required' });
  }
}; 