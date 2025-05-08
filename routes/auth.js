const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const axios = require('axios');

// Store OTPs in memory (in production, use Redis or similar)
const otpStore = new Map();

// Generate 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Dummy user authentication for testing
const authenticateDummyUser = async (phoneNumber, otp) => {
  try {
    // Check if dummy credentials match environment variables
    if (phoneNumber !== process.env.TEST_PHONE_NUMBER || 
        otp !== process.env.TEST_OTP) {
      throw new Error('Invalid test credentials');
    }

    // Find or create dummy user
    let user = await User.findOne({ phoneNumber });
    if (!user) {
      user = new User({ 
        phoneNumber,
        isVerified: true 
      });
      await user.save();
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    return { 
      success: true,
      token,
      message: 'Test login successful'
    };
  } catch (error) {
    return {
      success: false,
      message: error.message
    };
  }
};

// Test login route
router.post('/test-login', async (req, res) => {
  try {
    const { phoneNumber, otp } = req.body;
    
    // Only allow test login in development environment
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({ 
        message: 'Test login not available in production' 
      });
    }

    const result = await authenticateDummyUser(phoneNumber, otp);
    if (!result.success) {
      return res.status(401).json({ message: result.message });
    }

    res.json({
      message: result.message,
      token: result.token
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Send OTP using Fast2SMS
const sendOTP = async (phoneNumber, otp) => {
  try {
    if (!process.env.FAST2SMS_API_KEY) {
      throw new Error('Fast2SMS API key not configured');
    }

    const response = await axios.post('https://www.fast2sms.com/dev/bulkV2', {
      route: "v3",
      sender_id: "TXTIND",
      message: `Your OTP for mess management system is: ${otp}`,
      language: "english",
      flash: 0,
      numbers: phoneNumber,
    }, {
      headers: {
        'Authorization': process.env.FAST2SMS_API_KEY,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    if (response.data.return === false) {
      throw new Error(response.data.message || 'Failed to send SMS');
    }

    return response.data;
  } catch (error) {
    console.error('Fast2SMS Error:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || error.message);
  }
};

// Request OTP
router.post('/request-otp', async (req, res) => {
  try {
    let { phoneNumber } = req.body;
    
    // Clean and validate phone number
    phoneNumber = String(phoneNumber).trim().replace('+91', '').replace(/\D/g, '');
    
    if (phoneNumber.length !== 10) {
      return res.status(400).json({ message: 'Please provide a valid 10-digit phone number' });
    }

    // Check if user exists and is registered by admin
    const user = await User.findOne({ phoneNumber });
    if (!user) {
      return res.status(404).json({ message: 'Phone number not registered. Please contact admin.' });
    }

    // Generate and store OTP
    const otp = generateOTP();
    otpStore.set(phoneNumber, {
      code: otp,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes expiry
    });

    try {
      // Send OTP via SMS
      await sendOTP(phoneNumber, otp);
      res.json({ message: 'OTP sent successfully to your phone' });
    } catch (smsError) {
      console.error('SMS sending failed:', smsError);
      // For development/testing, return OTP in response
      res.json({ 
        message: 'Failed to send OTP via SMS. For testing, here is your OTP',
        otp: otp,
        error: smsError.message
      });
    }
  } catch (error) {
    console.error('Request OTP error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Verify OTP and login
router.post('/verify-otp', async (req, res) => {
  try {
    let { phoneNumber, otp } = req.body;
    
    // Clean phone number
    phoneNumber = String(phoneNumber).trim().replace('+91', '').replace(/\D/g, '');
    
    // Check if user exists
    const user = await User.findOne({ phoneNumber });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify OTP
    const storedOTP = otpStore.get(phoneNumber);
    if (!storedOTP || 
        storedOTP.code !== otp || 
        storedOTP.expiresAt < new Date()) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    // Clear OTP after successful verification
    otpStore.delete(phoneNumber);

    // Mark user as verified
    user.isVerified = true;
    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ 
      message: 'Login successful',
      token 
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router; 