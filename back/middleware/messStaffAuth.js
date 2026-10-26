const jwt = require('jsonwebtoken');

const messStaffAuth = (req, res, next) => {
  try {
    const token = req.header('Authorization').replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (!decoded.isMessStaff) {
      throw new Error();
    }
    
    next();
  } catch (error) {
    res.status(401).json({ message: 'Please authenticate as mess staff' });
  }
};

module.exports = messStaffAuth; 