const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const CheckIn = require('../models/CheckIn');
const receptionAuth = require('../middleware/receptionAuth');

// Reception Login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (username !== process.env.RECEPTION_USERNAME || 
        password !== process.env.RECEPTION_PASSWORD) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { isReception: true },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ token });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Check-in a user
router.post('/check-in/:userId', receptionAuth, async (req, res) => {
  try {
    const { userId } = req.params;

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if user is already checked in
    const existingCheckIn = await CheckIn.findOne({
      user: userId,
      status: 'CheckedIn'
    });

    if (existingCheckIn) {
      return res.status(400).json({ 
        message: 'User is already checked in',
        checkIn: existingCheckIn
      });
    }

    // Create new check-in record
    const checkIn = new CheckIn({
      user: userId,
      date: new Date(),
      checkedInTime: new Date()
    });

    await checkIn.save();

    // Populate user details in response
    await checkIn.populate('user', 'name department designation');

    res.status(201).json({
      message: 'User checked in successfully',
      checkIn
    });
  } catch (error) {
    console.error('Check-in error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Checkout a user
router.post('/checkout/:userId', receptionAuth, async (req, res) => {
  try {
    const { userId } = req.params;

    // Find active check-in record
    const checkIn = await CheckIn.findOne({
      user: userId,
      status: 'CheckedIn'
    });

    if (!checkIn) {
      return res.status(404).json({ message: 'No active check-in found for this user' });
    }

    // Update check-in record
    checkIn.status = 'Checkout';
    checkIn.checkoutTime = new Date();
    await checkIn.save();

    // Populate user details in response
    await checkIn.populate('user', 'name department designation');

    res.json({
      message: 'User checked out successfully',
      checkIn
    });
  } catch (error) {
    console.error('Checkout error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get today's check-in records
router.get('/check-ins/today', receptionAuth, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const checkIns = await CheckIn.find({
      date: {
        $gte: today,
        $lt: tomorrow
      }
    })
    .populate('user', 'name department designation')
    .sort({ checkedInTime: -1 });

    res.json(checkIns);
  } catch (error) {
    console.error('Fetch today check-ins error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get check-in status for a specific user
router.get('/check-in-status/:userId', receptionAuth, async (req, res) => {
  try {
    const { userId } = req.params;

    const activeCheckIn = await CheckIn.findOne({
      user: userId,
      status: 'CheckedIn'
    }).populate('user', 'name department designation');

    res.json({
      isCheckedIn: !!activeCheckIn,
      checkIn: activeCheckIn
    });
  } catch (error) {
    console.error('Check-in status error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get today's checkouts
router.get('/checkouts/today', receptionAuth, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const checkouts = await CheckIn.find({
      checkoutTime: {
        $gte: today,
        $lt: tomorrow
      },
      status: 'Checkout'
    })
    .populate('user', 'name department designation')
    .sort({ checkoutTime: -1 });

    res.json(checkouts);
  } catch (error) {
    console.error('Fetch today checkouts error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get check-ins by date
router.get('/check-ins/by-date', receptionAuth, async (req, res) => {
  try {
    const { date } = req.query;
    if (!date) {
      return res.status(400).json({ message: 'Date parameter is required' });
    }

    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 1);

    const checkIns = await CheckIn.find({
      date: {
        $gte: startDate,
        $lt: endDate
      }
    })
    .populate('user', 'name department designation')
    .sort({ checkedInTime: -1 });

    res.json({
      date: startDate,
      checkIns,
      total: checkIns.length
    });
  } catch (error) {
    console.error('Fetch check-ins by date error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get checkouts by date
router.get('/checkouts/by-date', receptionAuth, async (req, res) => {
  try {
    const { date } = req.query;
    if (!date) {
      return res.status(400).json({ message: 'Date parameter is required' });
    }

    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 1);

    const checkouts = await CheckIn.find({
      checkoutTime: {
        $gte: startDate,
        $lt: endDate
      },
      status: 'Checkout'
    })
    .populate('user', 'name department designation')
    .sort({ checkoutTime: -1 });

    res.json({
      date: startDate,
      checkouts,
      total: checkouts.length
    });
  } catch (error) {
    console.error('Fetch checkouts by date error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get all check-ins and checkouts by date
router.get('/attendance/by-date', receptionAuth, async (req, res) => {
  try {
    const { date } = req.query;
    if (!date) {
      return res.status(400).json({ message: 'Date parameter is required' });
    }

    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 1);

    const allRecords = await CheckIn.find({
      date: {
        $gte: startDate,
        $lt: endDate
      }
    })
    .populate('user', 'name department designation')
    .sort({ checkedInTime: -1 });

    const summary = {
      totalRecords: allRecords.length,
      // All records are check-ins, we just need to know their current status
      allCheckIns: allRecords,
      // Only those who have checked out
      checkedOut: allRecords.filter(record => record.status === 'Checkout'),
      // Those still checked in
      currentlyCheckedIn: allRecords.filter(record => record.status === 'CheckedIn'),
      byDepartment: {}
    };

    // Group by department
    allRecords.forEach(record => {
      const dept = record.user.department;
      if (!summary.byDepartment[dept]) {
        summary.byDepartment[dept] = {
          totalCheckIns: 0,
          currentlyCheckedIn: 0,
          checkedOut: 0
        };
      }
      summary.byDepartment[dept].totalCheckIns++;
      if (record.status === 'CheckedIn') {
        summary.byDepartment[dept].currentlyCheckedIn++;
      } else {
        summary.byDepartment[dept].checkedOut++;
      }
    });

    res.json({
      date: startDate,
      summary,
      records: allRecords
    });
  } catch (error) {
    console.error('Fetch attendance by date error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get all users
router.get('/users/all', async (req, res) => {
  try {
    const users = await User.find({})
      .select('_id name department designation email'); // Include only necessary fields
    
    res.json({
      users,
      total: users.length
    });
  } catch (error) {
    console.error('Fetch all users error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get all departments (Public route)
router.get('/departments', async (req, res) => {
  try {
    // Get unique departments from users collection
    const departments = await User.distinct('department');

    // Filter out null/empty departments and sort alphabetically
    const validDepartments = departments
      .filter(dept => dept && dept.trim())
      .sort((a, b) => a.localeCompare(b));

    res.json({
      success: true,
      departments: validDepartments,
      total: validDepartments.length
    });
  } catch (error) {
    console.error('Fetch departments error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});
module.exports = router; 