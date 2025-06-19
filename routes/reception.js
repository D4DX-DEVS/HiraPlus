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
    await checkIn.populate({
      path: 'user',
      select: 'name department designation',
      populate: {
        path: 'department',
        select: 'title'
      }
    });

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
    await checkIn.populate({
      path: 'user',
      select: 'name department designation',
      populate: {
        path: 'department',
        select: 'title'
      }
    });

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

    // Find all users who checked in today
    const todayCheckIns = await CheckIn.find({
      date: {
        $gte: today,
        $lt: tomorrow
      }
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

    res.json({
      total: allCheckIns.length,
      checkIns: allCheckIns,
      summary: {
        todayCheckIns: todayCheckIns.length,
        previousDaysStillCheckedIn: previousCheckIns.length
      }
    });
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
    }).populate({
      path: 'user',
      select: 'name department designation',
      populate: {
        path: 'department',
        select: 'title'
      }
    });

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
    .populate({
      path: 'user',
      select: 'name department designation',
      populate: {
        path: 'department',
        select: 'title'
      }
    })
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
    .populate({
      path: 'user',
      select: 'name department designation',
      populate: {
        path: 'department',
        select: 'title'
      }
    })
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
    .populate({
      path: 'user',
      select: 'name department designation',
      populate: {
        path: 'department',
        select: 'title'
      }
    })
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
    .populate({
      path: 'user',
      select: 'name department designation',
      populate: {
        path: 'department',
        select: 'title'
      }
    })
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
      const dept = record.user.department.title;
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
    const Department = require('../models/Department');
    
    const departments = await Department.find()
      .select('title')
      .sort({ title: 1 });

    res.json({
      success: true,
      departments: departments.map(dept => dept.title),
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

// Get all currently checked in users (regardless of check-in date)
router.get('/currently-checked-in', receptionAuth, async (req, res) => {
  try {
    // Find all check-in records with status 'CheckedIn'
    const checkIns = await CheckIn.find({ 
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
    .sort({ checkedInTime: -1 }); // Most recent check-ins first

    // Group check-ins by date
    const groupedByDate = checkIns.reduce((acc, checkIn) => {
      const date = checkIn.checkedInTime.toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(checkIn);
      return acc;
    }, {});

    res.json({
      total: checkIns.length,
      checkIns: checkIns,
      groupedByDate: groupedByDate,
      message: 'Retrieved all currently checked-in users'
    });
  } catch (error) {
    console.error('Fetch currently checked-in users error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get currently checked in users by department
router.get('/currently-checked-in/by-department/:department', receptionAuth, async (req, res) => {
  try {
    const { department } = req.params;

    const checkIns = await CheckIn.find({ 
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

    // Filter check-ins by department
    const departmentCheckIns = checkIns.filter(checkIn => 
      checkIn.user.department.title.toLowerCase() === department.toLowerCase()
    );

    res.json({
      department,
      total: departmentCheckIns.length,
      checkIns: departmentCheckIns
    });
  } catch (error) {
    console.error('Fetch department checked-in users error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get check-in statistics
router.get('/check-in-statistics', receptionAuth, async (req, res) => {
  try {
    const currentlyCheckedIn = await CheckIn.find({ 
      status: 'CheckedIn' 
    }).populate({
      path: 'user',
      select: 'name department designation',
      populate: {
        path: 'department',
        select: 'title'
      }
    });

    // Group by department
    const byDepartment = currentlyCheckedIn.reduce((acc, checkIn) => {
      const dept = checkIn.user.department.title;
      if (!acc[dept]) {
        acc[dept] = {
          count: 0,
          users: []
        };
      }
      acc[dept].count++;
      acc[dept].users.push({
        name: checkIn.user.name,
        designation: checkIn.user.designation,
        checkedInTime: checkIn.checkedInTime
      });
      return acc;
    }, {});

    // Get today's statistics
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayStats = await CheckIn.find({
      checkedInTime: {
        $gte: today,
        $lt: tomorrow
      }
    });

    res.json({
      totalCurrentlyCheckedIn: currentlyCheckedIn.length,
      byDepartment,
      todayTotal: todayStats.length,
      todayCheckedOut: todayStats.filter(stat => stat.status === 'Checkout').length,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Fetch check-in statistics error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Edit check-in status
router.put('/edit-check-in/:checkInId', receptionAuth, async (req, res) => {
  try {
    const { checkInId } = req.params;

    // Find the check-in record
    const checkIn = await CheckIn.findById(checkInId);
    if (!checkIn) {
      return res.status(404).json({ message: 'Check-in record not found' });
    }

    // Toggle the status
    const newStatus = checkIn.status === 'CheckedIn' ? 'Checkout' : 'CheckedIn';
    
    // Update the record
    const updatedCheckIn = await CheckIn.findByIdAndUpdate(
      checkInId,
      {
        status: newStatus,
        // If changing to Checkout, set checkoutTime, if changing to CheckedIn, remove checkoutTime
        ...(newStatus === 'Checkout' ? { checkoutTime: new Date() } : { checkoutTime: null })
      },
      { new: true } // Return the updated document
    ).populate({
      path: 'user',
      select: 'name department designation',
      populate: {
        path: 'department',
        select: 'title'
      }
    });

    res.json({
      message: `Status successfully changed to ${newStatus}`,
      checkIn: updatedCheckIn,
      previousStatus: checkIn.status
    });

  } catch (error) {
    console.error('Edit check-in status error:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router; 