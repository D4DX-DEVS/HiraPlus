const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Notification = require('../models/Notification');
const GuestMeal = require('../models/GuestMeal');
const CheckIn = require('../models/CheckIn');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const deptHeadAuth = require('../middleware/deptHeadAuth');
const driverAuth = require('../middleware/driverAuth');
const Meeting = require('../models/Meeting');
const Menu = require('../models/Menu');
const Travel = require('../models/Travel');
const Vehicle = require('../models/Vehicle');

// Helper function to check for meeting conflicts
const checkMeetingConflict = async (startDatetime, endDatetime, hall, excludeMeetingId = null) => {
  try {
    // Build query to find conflicting meetings
    const conflictQuery = {
      hall: hall,
      $or: [
        // Case 1: New meeting starts during an existing meeting
        {
          startDatetime: { $lte: startDatetime },
          endDatetime: { $gt: startDatetime }
        },
        // Case 2: New meeting ends during an existing meeting
        {
          startDatetime: { $lt: endDatetime },
          endDatetime: { $gte: endDatetime }
        },
        // Case 3: New meeting completely contains an existing meeting
        {
          startDatetime: { $gte: startDatetime },
          endDatetime: { $lte: endDatetime }
        }
      ]
    };

    // Exclude the current meeting if editing
    if (excludeMeetingId) {
      conflictQuery._id = { $ne: excludeMeetingId };
    }

    const conflictingMeetings = await Meeting.find(conflictQuery)
      .populate('department', 'title')
      .populate('createdBy', 'name')
      .sort({ startDatetime: 1 });

    return conflictingMeetings;
  } catch (error) {
    console.error('Error checking meeting conflicts:', error);
    throw error;
  }
};

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
      // First, find or create a test department
      const Department = require('../models/Department');
      let testDepartment = await Department.findOne({ title: 'Testing' });
      if (!testDepartment) {
        testDepartment = new Department({ title: 'Testing' });
        await testDepartment.save();
      }

      user = new User({ 
        phoneNumber,
        name: "Test User",
        department: testDepartment._id,  // Use ObjectId instead of string
        designation: "Tester",
        isVerified: true
      });
      await user.save();
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET
    );

    return { 
      success: true,
      token,
      message: 'Test login successful',
      user: {
        id: user._id,
        name: user.name,
        phoneNumber: user.phoneNumber,
        department: user.department,
        designation: user.designation,
        isVerified: user.isVerified,
        isDeptHead: user.isDeptHead,
        isFreeFood: user.isFreeFood,
        isIntern: user.isIntern
      }
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
      success: true,
      message: result.message,
      token: result.token,
      user: result.user
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
});

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

    console.log('Sending OTP to phone number:', formattedPhone);

    const payload = {
      secret: process.env.DXING_API_KEY,
      type: "whatsapp",
      phone: formattedPhone,
      message: `Your OTP is ${otp}. It will expire in 5 minutes.`,
      account: process.env.DXING_INSTANCE_ID,
      priority: 1
    };

    console.log('Request payload:', JSON.stringify(payload));

    const response = await axios.post('https://app.dxing.in/api/send/otp', payload, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('DXing API Response:', JSON.stringify(response.data));

    if (!response.data.status) {
      throw new Error(response.data.message || 'Failed to send OTP');
    }

    return response.data;
  } catch (error) {
    console.error('DXing OTP Error Details:', {
      error: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
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
      process.env.JWT_SECRET
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
        isVerified: user.isVerified,
        isDeptHead: user.isDeptHead,
        isFreeFood: user.isFreeFood,
        isIntern: user.isIntern
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

// Get user details
router.get('/me', async (req, res) => {
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
    
    // Get user details
    const user = await User.findById(decoded.id).select('-__v');
    
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
        isVerified: user.isVerified,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        status: user.status,
        isDeptHead: user.isDeptHead,
        isFreeFood: user.isFreeFood,
        isIntern: user.isIntern
      }
    });
  } catch (error) {
    console.error('Get user details error:', error);
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
});

// Get all notifications (public endpoint)
router.get('/notifications', async (req, res) => {
  try {
    // Get all notifications, sorted by creation date (newest first)
    const notifications = await Notification.find()
      .sort({ createdAt: -1 })
      .select('-__v');

    res.json({
      success: true,
      notifications: notifications.map(notification => ({
        id: notification._id,
        title: notification.title,
        description: notification.description,
        createdAt: notification.createdAt,
        updatedAt: notification.updatedAt
      }))
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get all users (public endpoint)
router.get('/users', async (req, res) => {
  try {
    // Get all users, excluding sensitive information
    const users = await User.find()
      .populate('department', 'title')
      .select('name phoneNumber department designation isIntern')
      .sort({ name: 1 });

    res.json({
      success: true,
      users: users
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Department Head: Add/Update guest meal counts
router.post('/guest-meals', deptHeadAuth, async (req, res) => {
  try {
    const { date, breakfastCount, lunchCount, dinnerCount } = req.body;

    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'Date is required'
      });
    }

    // Validate counts are non-negative numbers
    const counts = { breakfastCount, lunchCount, dinnerCount };
    for (const [key, value] of Object.entries(counts)) {
      if (value && value < 0) {
        return res.status(400).json({
          success: false,
          message: `${key} must be a non-negative number`
        });
      }
    }

    // Find or create guest meal record for the department and date
    let guestMeal = await GuestMeal.findOne({
      department: req.user.department,
      date: new Date(date)
    });

    if (guestMeal) {
      // Update existing record
      if (breakfastCount !== undefined) guestMeal.breakfastCount = breakfastCount;
      if (lunchCount !== undefined) guestMeal.lunchCount = lunchCount;
      if (dinnerCount !== undefined) guestMeal.dinnerCount = dinnerCount;
    } else {
      // Create new record
      guestMeal = new GuestMeal({
        date: new Date(date),
        department: req.user.department,
        addedBy: req.user._id,
        breakfastCount: breakfastCount || 0,
        lunchCount: lunchCount || 0,
        dinnerCount: dinnerCount || 0
      });
    }

    await guestMeal.save();
    await guestMeal.populate('department', 'title');

    res.json({
      success: true,
      message: 'Guest meal counts updated successfully',
      guestMeal
    });
  } catch (error) {
    console.error('Guest meal update error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Department Head: Get all guest meals for their department
router.get('/guest-meals', deptHeadAuth, async (req, res) => {
  try {
    const guestMeals = await GuestMeal.find({
      department: req.user.department
    })
    .populate('department', 'title')
    .sort({ date: -1 }); // Most recent first

    res.json({
      success: true,
      guestMeals
    });
  } catch (error) {
    console.error('Get guest meals error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Department Head: Edit guest meal by ID
router.put('/guest-meals/:id', deptHeadAuth, async (req, res) => {
  try {
    const { breakfastCount, lunchCount, dinnerCount } = req.body;

    // Find the guest meal record
    const guestMeal = await GuestMeal.findOne({
      _id: req.params.id,
      department: req.user.department // Ensure it belongs to their department
    });

    if (!guestMeal) {
      return res.status(404).json({
        success: false,
        message: 'Guest meal record not found'
      });
    }

    // Validate counts are non-negative numbers
    const counts = { breakfastCount, lunchCount, dinnerCount };
    for (const [key, value] of Object.entries(counts)) {
      if (value !== undefined && value < 0) {
        return res.status(400).json({
          success: false,
          message: `${key} must be a non-negative number`
        });
      }
    }

    // Update only the provided fields
    if (breakfastCount !== undefined) guestMeal.breakfastCount = breakfastCount;
    if (lunchCount !== undefined) guestMeal.lunchCount = lunchCount;
    if (dinnerCount !== undefined) guestMeal.dinnerCount = dinnerCount;

    await guestMeal.save();
    await guestMeal.populate('department', 'title');

    res.json({
      success: true,
      message: 'Guest meal counts updated successfully',
      guestMeal
    });
  } catch (error) {
    console.error('Update guest meal error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Department Head: Delete guest meal record
router.delete('/guest-meals/:id', deptHeadAuth, async (req, res) => {
  try {
    const guestMeal = await GuestMeal.findOne({
      _id: req.params.id,
      department: req.user.department
    });

    if (!guestMeal) {
      return res.status(404).json({
        success: false,
        message: 'Guest meal record not found'
      });
    }

    await guestMeal.deleteOne();

    res.json({
      success: true,
      message: 'Guest meal record deleted successfully'
    });
  } catch (error) {
    console.error('Delete guest meal error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get all meetings (for users)
router.get('/meetings', async (req, res) => {
  try {
    const meetings = await Meeting.find()
      .populate('department', 'title')
      .populate('createdBy', 'name department')
      .sort({ startDatetime: -1 });

    res.json({
      success: true,
      meetings
    });
  } catch (error) {
    console.error('Fetch meetings error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Department Head: Create meeting
router.post('/dept-meetings', deptHeadAuth, async (req, res) => {
  try {
    const {
      title, description, startDatetime, endDatetime,
      hall, noOfPersons, rent, foodRequired, breakfast,
      midmorningSnacks, lunch, eveningsnacks, dinner
    } = req.body;

    // Validate required fields
    if (!title || !description || !startDatetime || !endDatetime || !hall || !noOfPersons || typeof rent === 'undefined') {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields including rent amount'
      });
    }

    // Validate rent is a non-negative number
    if (rent < 0) {
      return res.status(400).json({
        success: false,
        message: 'Rent amount must be 0 or greater'
      });
    }

    // Check for meeting conflicts
    const conflictingMeetings = await checkMeetingConflict(
      new Date(startDatetime),
      new Date(endDatetime),
      hall
    );

    if (conflictingMeetings.length > 0) {
      const conflictDetails = conflictingMeetings.map(meeting => ({
        title: meeting.title,
        department: meeting.department?.title || 'Unknown Department',
        startTime: meeting.startDatetime,
        endTime: meeting.endDatetime,
        createdBy: typeof meeting.createdBy === 'object' ? meeting.createdBy?.name : meeting.createdBy
      }));

      return res.status(409).json({
        success: false,
        message: 'Meeting conflict detected! The selected venue is already booked for the specified time.',
        conflicts: conflictDetails,
        details: `Venue "${hall}" is already booked by ${conflictDetails.length} other meeting(s) during the requested time period.`
      });
    }

    const meeting = new Meeting({
      title: title.trim(),
      description: description.trim(),
      startDatetime: new Date(startDatetime),
      endDatetime: new Date(endDatetime),
      hall,
      rent: parseInt(rent) || 0,
      noOfPersons,
      foodRequired: foodRequired || false,
      breakfast: breakfast || 0,
      midmorningSnacks: midmorningSnacks || 0,
      lunch: lunch || 0,
      eveningsnacks: eveningsnacks || 0,
      dinner: dinner || 0,
      department: req.user.department, // Use the department name instead of ID
      status: 'pending', // Default status for department head
      createdBy: req.user.name // Keep the user ID for reference
    });

    await meeting.save();
    await meeting.populate('department', 'title');
    await meeting.populate('createdBy', 'name');

    res.status(201).json({
      success: true,
      message: 'Meeting created successfully and pending admin approval',
      meeting
    });
  } catch (error) {
    console.error('Create meeting error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Department Head: Get department meetings
router.get('/dept-meetings', deptHeadAuth, async (req, res) => {
  try {
    const meetings = await Meeting.find({ department: req.user.department })
      .populate('department', 'title')
      .populate('createdBy', 'name department')
      .sort({ startDatetime: -1 });

    res.json({
      success: true,
      meetings
    });
  } catch (error) {
    console.error('Fetch department meetings error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Department Head: Update meeting
router.put('/dept-meetings/:meetingId', deptHeadAuth, async (req, res) => {
  try {
    const {
      title, description, startDatetime, endDatetime,
      hall, noOfPersons, rent, foodRequired, breakfast,
      midmorningSnacks, lunch, eveningsnacks, dinner
    } = req.body;

    const meeting = await Meeting.findOne({
      _id: req.params.meetingId,
      department: req.user.department,  // Fixed: Use department name instead of user ID
      status: 'pending' // Can only edit pending meetings
    });

    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: 'Meeting not found or cannot be edited'
      });
    }

    // Prepare updated values for conflict checking
    const updatedStartDatetime = startDatetime ? new Date(startDatetime) : meeting.startDatetime;
    const updatedEndDatetime = endDatetime ? new Date(endDatetime) : meeting.endDatetime;
    const updatedHall = hall || meeting.hall;

    // Check for meeting conflicts (exclude current meeting)
    const conflictingMeetings = await checkMeetingConflict(
      updatedStartDatetime,
      updatedEndDatetime,
      updatedHall,
      req.params.meetingId
    );

    if (conflictingMeetings.length > 0) {
      const conflictDetails = conflictingMeetings.map(conflictMeeting => ({
        title: conflictMeeting.title,
        department: conflictMeeting.department?.title || 'Unknown Department',
        startTime: conflictMeeting.startDatetime,
        endTime: conflictMeeting.endDatetime,
        createdBy: typeof conflictMeeting.createdBy === 'object' ? conflictMeeting.createdBy?.name : conflictMeeting.createdBy
      }));

      return res.status(409).json({
        success: false,
        message: 'Meeting conflict detected! The selected venue is already booked for the specified time.',
        conflicts: conflictDetails,
        details: `Venue "${updatedHall}" is already booked by ${conflictDetails.length} other meeting(s) during the requested time period.`
      });
    }

    // Validate rent if provided
    if (typeof rent !== 'undefined' && rent < 0) {
      return res.status(400).json({
        success: false,
        message: 'Rent amount must be 0 or greater'
      });
    }

    // Update fields if provided
    if (title) meeting.title = title.trim();
    if (description) meeting.description = description.trim();
    if (startDatetime) meeting.startDatetime = new Date(startDatetime);
    if (endDatetime) meeting.endDatetime = new Date(endDatetime);
    if (hall) meeting.hall = hall;
    if (typeof rent !== 'undefined') meeting.rent = parseInt(rent) || 0;
    if (noOfPersons) meeting.noOfPersons = noOfPersons;
    if (typeof foodRequired !== 'undefined') meeting.foodRequired = foodRequired;
    if (typeof breakfast !== 'undefined') meeting.breakfast = breakfast;
    if (typeof midmorningSnacks !== 'undefined') meeting.midmorningSnacks = midmorningSnacks;
    if (typeof lunch !== 'undefined') meeting.lunch = lunch;
    if (typeof eveningsnacks !== 'undefined') meeting.eveningsnacks = eveningsnacks;
    if (typeof dinner !== 'undefined') meeting.dinner = dinner;

    await meeting.save();
    await meeting.populate('department', 'title');
    await meeting.populate('createdBy', 'name');

    res.json({
      success: true,
      message: 'Meeting updated successfully',
      meeting
    });
  } catch (error) {
    console.error('Update meeting error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Department Head: Delete meeting
router.delete('/dept-meetings/:meetingId', deptHeadAuth, async (req, res) => {
  try {
    const meeting = await Meeting.findOneAndDelete({
      _id: req.params.meetingId,
      department: req.user.department,  // Use department name instead of user ID
      status: 'pending' // Can only delete pending meetings
    });
    
    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: 'Meeting not found or cannot be deleted'
      });
    }

    res.json({
      success: true,
      message: 'Meeting deleted successfully'
    });
  } catch (error) {
    console.error('Delete meeting error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get all departments (Public route)
router.get('/departments', async (req, res) => {
  try {
    const Department = require('../models/Department');
    
    const departments = await Department.find()
      .select('title')
      .sort({ title: 1 });

    res.json({
      success: true,
      departments: departments,
      total: departments.length
    });
  } catch (error) {
    console.error('Fetch departments error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get today's checked-in users (Public route)
router.get('/today-checked-in', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Find all users who checked in today
    const todayCheckIns = await CheckIn.find({
      date: {
        $gte: today,
        $lt: tomorrow
      }
    })
    .populate('user', 'name department designation')
    .populate({
      path: 'user',
      select: 'name department designation',
      populate: {
        path: 'department',
        select: 'title'
      }
    })
    .sort({ checkedInTime: -1 });

    // Find all users who checked in before today but haven't checked out
    const previousCheckIns = await CheckIn.find({
      date: { $lt: today },
      status: 'CheckedIn'
    })
    .populate({
      path: 'user',
      select: 'name department designation',
      populate: {
        path: 'department',
        select: 'title'
      }
    })
    .sort({ checkedInTime: -1 });

    // Combine both results
    const allCheckIns = [...previousCheckIns, ...todayCheckIns];

    // Filter out check-ins without valid user data
    const validCheckIns = allCheckIns.filter(checkIn => checkIn.user);

    // Group check-ins by department for better organization
    const byDepartment = todayCheckIns.reduce((acc, checkIn) => {
      const dept = checkIn.user.department;
      if (!acc[dept]) {
        acc[dept] = [];
      }
      acc[dept].push({
        name: checkIn.user.name,
        designation: checkIn.user.designation,
        checkedInTime: checkIn.checkedInTime,
        department: deptName,
        checkInDate: checkIn.date
      });
      return acc;
    }, {});

    // Sort departments alphabetically and users within each department by check-in time
    const sortedByDepartment = {};
    Object.keys(byDepartment)
      .sort()
      .forEach(dept => {
        sortedByDepartment[dept] = byDepartment[dept].sort((a, b) => 
          new Date(b.checkedInTime) - new Date(a.checkedInTime)
        );
      });

    // Create a flat list of all checked-in users with department info
    const allUsers = validCheckIns.map(checkIn => {
      let deptName = 'Unknown Department';
      
      if (typeof checkIn.user.department === 'string') {
        deptName = checkIn.user.department;
      } else if (checkIn.user.department && checkIn.user.department.title) {
        deptName = checkIn.user.department.title;
      }

      return {
        id: checkIn.user._id,
        name: checkIn.user.name,
        designation: checkIn.user.designation,
        department: deptName,
        checkedInTime: checkIn.checkedInTime,
        checkInId: checkIn._id,
        checkInDate: checkIn.date
      };
    });

    res.json({
      success: true,
      date: today.toISOString().split('T')[0],
      totalCheckedIn: validCheckIns.length,
      byDepartment: sortedByDepartment,
      allUsers: allUsers,
      departmentCount: Object.keys(sortedByDepartment).length,
      summary: {
        todayCheckIns: todayCheckIns.length,
        previousDaysStillCheckedIn: previousCheckIns.length
      }
    });
  } catch (error) {
    console.error('Fetch today checked-in users error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});


// Get today's menu (Public route - accessible to all)
router.get('/menu/today', async (req, res) => {
  try {
    // Get today's date (start of day)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const menu = await Menu.findOne({ date: today });
    
    if (!menu) {
      return res.status(404).json({ 
        success: false,
        message: 'No menu found for today' 
      });
    }

    res.json({
      success: true,
      menu: {
        id: menu._id,
        date: menu.date,
        breakfast: menu.breakfast,
        lunch: menu.lunch,
        dinner: menu.dinner,
        addedBy: menu.addedBy,
        createdAt: menu.createdAt,
        updatedAt: menu.updatedAt
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
});






router.post('/travels', driverAuth, async (req, res) => {
  try {
    const {
      vehicle,
      fromLocation,
      toLocation,
      startKm,
      endKm,
      startTime,
      endTime,
      date,
      description
    } = req.body;

    const foundVehicle = await Vehicle.findById(vehicle);
    if (!foundVehicle) return res.status(404).json({ error: 'Vehicle not found' });

    const travel = new Travel({
      user: req.user._id,
      vehicle,
      fromLocation,
      toLocation,
      startKm,
      endKm,
      startTime,
      endTime,
      date,
      description
    });

    await travel.save();
    await travel.populate('user', 'name phoneNumber department designation');
    await travel.populate('vehicle', 'name number type');
    
    res.status(201).json({
      success: true,
      message: 'Travel record created successfully',
      travel
    });
  } catch (err) {
    console.error('Create travel error:', err);
    res.status(400).json({ 
      success: false,
      message: err.message 
    });
  }
});

// Driver: Get their own travel records
router.get('/travels', driverAuth, async (req, res) => {
  try {
    const travels = await Travel.find({ user: req.user._id })
      .populate('vehicle', 'name number type')
      .sort({ date: -1 });
    
    res.json({
      success: true,
      travels
    });
  } catch (err) {
    console.error('Get driver travels error:', err);
    res.status(500).json({ 
      success: false,
      message: err.message 
    });
  }
});

// Get list of drivers (no authentication required)
router.get('/drivers', async (req, res) => {
  try {
    const drivers = await User.find({ role: 'driver' })
      .populate('department', 'title')
      .select('name phoneNumber department designation status')
      .sort({ name: 1 });

    const mappedDrivers = drivers.map(driver => ({
      _id: driver._id,
      name: driver.name || '',
      phoneNumber: driver.phoneNumber,
      department: driver.department || '',
      designation: driver.designation || '',
      status: driver.status || 'active'
    }));

    res.json(mappedDrivers);
  } catch (error) {
    console.error('Error fetching drivers:', error);
    res.status(500).json({ message: 'Error fetching drivers' });
  }
});

module.exports = router; 