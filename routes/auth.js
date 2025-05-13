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

// Send OTP using DXing WhatsApp API
const sendOTP = async (phoneNumber, otp) => {
  try {
    if (!process.env.DXING_API_KEY) {
      throw new Error('DXing API key not configured');
    }

    // Format phone number to include country code if not present
    const formattedPhone = phoneNumber.startsWith('91') ? phoneNumber : `91${phoneNumber}`;

    const response = await axios.post('https://app.dxing.in/api/send/otp', {
      token: process.env.DXING_API_KEY,
      number: formattedPhone,
      type: "text",
      message: `Your OTP for Hira Plus Login is: ${otp}`,
      instance_id: process.env.DXING_INSTANCE_ID
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.data.status) {
      throw new Error(response.data.message || 'Failed to send WhatsApp message');
    }

    return response.data;
  } catch (error) {
    console.error('DXing WhatsApp Error:', error.response?.data || error.message);
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
      expiresAt: new Date(Date.now() + 5 * 60 * 1000) // 5 minutes expiry
    });

    try {
      // Send OTP via DXing SMS
      await sendOTP(phoneNumber, otp);
      res.json({ 
        success: true,
        message: 'OTP sent successfully to your phone'
      });
    } catch (smsError) {
      console.error('SMS sending failed:', smsError);
      // For development environment only
      if (process.env.NODE_ENV === 'development') {
        res.json({ 
          success: false,
          message: 'Failed to send OTP via SMS. For testing, here is your OTP',
          otp: otp,
          error: smsError.message
        });
      } else {
        res.status(500).json({ 
          success: false,
          message: 'Failed to send OTP. Please try again.'
        });
      }
    }
  } catch (error) {
    console.error('Request OTP error:', error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
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
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }

    // Verify OTP
    const storedOTP = otpStore.get(phoneNumber);
    if (!storedOTP || 
        storedOTP.code !== otp || 
        storedOTP.expiresAt < new Date()) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid or expired OTP' 
      });
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
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        phoneNumber: user.phoneNumber,
        department: user.department,
        designation: user.designation,
        isVerified: user.isVerified
      }
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
});

module.exports = router; 