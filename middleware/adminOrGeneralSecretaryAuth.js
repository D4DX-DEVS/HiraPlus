const adminAuth = require('./adminAuth');
const generalSecretaryAuth = require('./generalSecretaryAuth');

// Middleware to allow both admin and general secretary access
const adminOrGeneralSecretaryAuth = async (req, res, next) => {
  let adminSuccess = false;
  let generalSecretarySuccess = false;

  // Try admin authentication first
  try {
    await new Promise((resolve, reject) => {
      adminAuth(req, res, (err) => {
        if (err) {
          reject(err);
        } else {
          adminSuccess = true;
          resolve();
        }
      });
    });
  } catch (adminError) {
    // Admin auth failed, continue to try general secretary
    //console.log('Admin auth failed, trying general secretary auth');
  }

  // If admin auth succeeded, proceed
  if (adminSuccess) {
    return next();
  }

  // Try general secretary authentication
  try {
    await new Promise((resolve, reject) => {
      generalSecretaryAuth(req, res, (err) => {
        if (err) {
          reject(err);
        } else {
          generalSecretarySuccess = true;
          resolve();
        }
      });
    });
  } catch (generalSecretaryError) {
    // Both auth methods failed
    console.log('General secretary auth also failed');
  }

  // If either auth succeeded, proceed
  if (adminSuccess || generalSecretarySuccess) {
    return next();
  }

  // Both failed, return error
  return res.status(403).json({
    success: false,
    message: 'Access denied. Only admin or general secretary can perform this action.'
  });
};

module.exports = adminOrGeneralSecretaryAuth;
