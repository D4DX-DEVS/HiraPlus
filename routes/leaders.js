const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Role = require('../models/Roles');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const leaderAuth = require('../middleware/leaderAuth');
const { leaderOrSuperLeaderAuth } = require('../middleware/leaderAuth');

// Store OTPs in memory (in production, use Redis or similar)
const leaderOtpStore = new Map();

// Generate 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send OTP using DXing API
const sendOTP = async (phoneNumber, otp) => {
  try {
    if (!process.env.DXING_API_KEY) {
      throw new Error('DXing API key not configured');
    }

    // Clean the phone number (remove spaces, +, and other characters)
    const cleanedPhone = phoneNumber.replace(/[\s+\-()]/g, '');
    // Make sure phone number starts with country code
    const formattedPhone = cleanedPhone.startsWith('91') ? cleanedPhone : `91${cleanedPhone}`;

    console.log('Sending Leader OTP to phone number:', formattedPhone);

    const payload = {
      secret: process.env.DXING_API_KEY,
      type: "whatsapp",
      phone: formattedPhone,
      message: `Your Leadership Portal OTP is ${otp}. It will expire in 5 minutes.`,
      account: process.env.DXING_INSTANCE_ID,
      priority: 1
    };

    console.log('Leader OTP Request payload:', JSON.stringify(payload));

    const response = await axios.post('https://app.dxing.in/api/send/otp', payload, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('DXing API Response for Leader OTP:', JSON.stringify(response.data));

    if (!response.data.status) {
      throw new Error(response.data.message || 'Failed to send Leader OTP');
    }

    return response.data;
  } catch (error) {
    console.error('DXing Leader OTP Error Details:', {
      error: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
    throw new Error(error.response?.data?.message || error.message);
  }
};

// Request OTP for Leaders/Super Leaders only
router.post('/request-otp', async (req, res) => {
  try {
    let { phoneNumber } = req.body;
    
    // Clean and validate phone number
    phoneNumber = String(phoneNumber).trim().replace('+91', '').replace(/\D/g, '');
    
    if (phoneNumber.length !== 10) {
      return res.status(400).json({ 
        success: false,
        message: 'Please provide a valid 10-digit phone number' 
      });
    }

    // Check if user exists and has leader/super leader role
    const user = await User.findOne({ phoneNumber })
      .populate('department', 'title')
      .populate('tags', 'tagName')
      .populate('role', 'name');
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'Phone number not registered. Please contact admin.' 
      });
    }

    // Verify user has leader or super leader role
    if (!user.role || (user.role.name !== 'leader' && user.role.name !== 'super leader')) {
      return res.status(403).json({ 
        success: false,
        message: 'Access denied. Only leaders and super leaders can access this portal.' 
      });
    }

    // Generate and store OTP
    const otp = generateOTP();
    leaderOtpStore.set(phoneNumber, {
      code: otp,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes expiry
      role: user.role.name // Store role name for verification
    });

    try {
      // Send OTP via DXing SMS
      await sendOTP(phoneNumber, otp);
      res.json({ 
        success: true,
        message: 'Leadership Portal OTP sent successfully to your phone',
        userRole: user.role
      });
    } catch (smsError) {
      console.error('SMS sending failed for Leader OTP:', smsError);
      // For development environment only
      if (process.env.NODE_ENV === 'development') {
        res.json({ 
          success: false,
          message: 'Failed to send Leader OTP via SMS. For testing, here is your OTP',
          otp: otp,
          userRole: user.role,
          error: smsError.message
        });
      } else {
        res.status(500).json({ 
          success: false,
          message: 'Failed to send Leader OTP. Please try again.'
        });
      }
    }
  } catch (error) {
    console.error('Request Leader OTP error:', error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
});

// Verify OTP and login for Leaders/Super Leaders
router.post('/verify-otp', async (req, res) => {
  try {
    let { phoneNumber, otp } = req.body;
    
    // Clean phone number
    phoneNumber = String(phoneNumber).trim().replace('+91', '').replace(/\D/g, '');
    
    // Check if user exists and has appropriate role
    const user = await User.findOne({ phoneNumber })
      .populate('department', 'title')
      .populate('tags', 'tagName')
      .populate('role', 'name');
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }

    // Verify user has leader or super leader role
    if (!user.role || (user.role.name !== 'leader' && user.role.name !== 'super leader')) {
      return res.status(403).json({ 
        success: false,
        message: 'Access denied. Only leaders and super leaders can access this portal.' 
      });
    }

    // Verify OTP
    const storedOTP = leaderOtpStore.get(phoneNumber);
    if (!storedOTP || 
        storedOTP.code !== otp || 
        storedOTP.expiresAt < new Date()) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid or expired Leadership Portal OTP' 
      });
    }

    // Verify role matches stored role
    if (storedOTP.role !== user.role.name) {
      return res.status(403).json({ 
        success: false,
        message: 'Role mismatch. Please try again.' 
      });
    }

    // Clear OTP after successful verification
    leaderOtpStore.delete(phoneNumber);

    // Mark user as verified (if not already)
    if (!user.isVerified) {
      user.isVerified = true;
      await user.save();
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET
    );

    res.json({
      success: true,
      message: 'Leadership Portal login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        role: user.role.name
      }
    });
  } catch (error) {
    console.error('Verify Leader OTP error:', error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
});

// Get current leader/super leader profile
router.get('/profile', leaderOrSuperLeaderAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('department', 'title')
      .populate('tags', 'tagName')
      .populate('role', 'name');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        phoneNumber: user.phoneNumber,
        department: user.department,
        designation: user.designation,
        role: user.role.name,
        isDeptHead: user.isDeptHead,
        isVerified: user.isVerified,
        isFreeFood: user.isFreeFood,
        isIntern: user.isIntern,
        status: user.status,
        tags: user.tags,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    });
  } catch (error) {
    console.error('Get leader profile error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get all leaders and super leaders
router.get('/all', leaderOrSuperLeaderAuth, async (req, res) => {
  try {
    // Get leader and super leader role ObjectIds
    const leaderRole = await Role.findOne({ name: 'leader' });
    const superLeaderRole = await Role.findOne({ name: 'super leader' });
    
    if (!leaderRole || !superLeaderRole) {
      return res.status(500).json({
        success: false,
        message: 'Leader roles not found in database'
      });
    }

    const leaders = await User.find({
      role: { $in: [leaderRole._id, superLeaderRole._id] },
      status: 'active'
    })
    .populate('department', 'title')
    .populate('tags', 'tagName')
    .populate('role', 'name')
    .select('name phoneNumber role department designation isDeptHead isVerified status createdAt tags')
    .sort({ role: 1, name: 1 }); // Sort by role (super leader first), then by name

    // Separate leaders and super leaders
    const superLeaders = leaders.filter(user => user.role && user.role.name === 'super leader');
    const regularLeaders = leaders.filter(user => user.role && user.role.name === 'leader');

    res.json({
      success: true,
      data: {
        superLeaders,
        regularLeaders,
        total: leaders.length,
        superLeadersCount: superLeaders.length,
        leadersCount: regularLeaders.length
      }
    });
  } catch (error) {
    console.error('Get all leaders error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;
