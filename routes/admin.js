const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Department = require('../models/Department');
const Meal = require('../models/Meal');
const Notification = require('../models/Notification');
const Message = require('../models/Message');
const GuestMeal = require('../models/GuestMeal');
const CustomList = require('../models/CustomList');
const jwt = require('jsonwebtoken');
const adminAuth = require('../middleware/adminAuth');
const axios = require('axios');
const mongoose = require('mongoose');
const Meeting = require('../models/Meeting');
const { sendPushNotification } = require('../utils/oneSignalService');
const Menu = require('../models/Menu');
const Vehicle = require('../models/Vehicle');
const Travel = require('../models/Travel');

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

// Helper function to find department by ID or title
const findDepartment = async (department) => {
  if (mongoose.Types.ObjectId.isValid(department)) {
    return await Department.findById(department);
  } else if (typeof department === 'string') {
    return await Department.findOne({ title: department.trim() });
  } else {
    throw new Error('Invalid department format. Please provide a valid department ID or name.');
  }
};

// Admin Login
router.post('/login', async (req, res) => {
  try {
    const { phoneNumber, password } = req.body;
    
    if (phoneNumber !== process.env.ADMIN_PHONE_NUMBER || 
        password !== process.env.ADMIN_PASSWORD) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { isAdmin: true },
      process.env.JWT_SECRET
    );

    res.json({ token });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Admin: Add user
router.post('/users', adminAuth, async (req, res) => {
  try {
    let { phoneNumber, name, department, designation, isDeptHead, status, isFreeFood, isIntern } = req.body;

    // Validate all required fields are present and not empty
    if (!phoneNumber || !name || !department || !designation) {
      return res.status(400).json({ 
        message: 'All fields (name, phone number, department, and designation) are required' 
      });
    }

    // Clean and trim all fields
    name = name.trim();
    designation = designation.trim();
    phoneNumber = String(phoneNumber).trim().replace('+91', '').replace(/\D/g, '');

    // Validate all fields have content after trimming
    if (!name || !designation) {
      return res.status(400).json({ 
        message: 'Name and designation cannot be empty' 
      });
    }
    
    if (phoneNumber.length !== 10) {
      return res.status(400).json({ 
        message: 'Please provide a valid 10-digit phone number' 
      });
    }

    // Find department by ID or title
    let departmentDoc;
    if (mongoose.Types.ObjectId.isValid(department)) {
      departmentDoc = await Department.findById(department);
    } else if (typeof department === 'string') {
      departmentDoc = await Department.findOne({ title: department.trim() });
    } else {
      return res.status(400).json({ 
        message: 'Invalid department format. Please provide a valid department ID or name.' 
      });
    }

    if (!departmentDoc) {
      return res.status(400).json({ 
        message: 'Invalid department. Please select a valid department.' 
      });
    }

    const existingUser = await User.findOne({ phoneNumber });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = new User({ 
      phoneNumber,
      name,
      department: departmentDoc._id,
      designation,
      isDeptHead: isDeptHead || false,
      status: status || 'active',
      isFreeFood: isFreeFood || false,
      isIntern: isIntern || false
    });
    await user.save();

    // Populate department for response
    await user.populate('department', 'title');

    res.status(201).json({ 
      message: 'User added successfully',
      user: {
        id: user._id,
        name: user.name,
        phoneNumber: user.phoneNumber,
        department: user.department,
        designation: user.designation,
        isDeptHead: user.isDeptHead,
        status: user.status,
        isFreeFood: user.isFreeFood,
        isIntern: user.isIntern
      }
    });
  } catch (error) {
    console.error('User creation error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Admin: Get all users
router.get('/users', adminAuth, async (req, res) => {
  try {
    const users = await User.find()
      .populate('department', 'title')
      .select('name phoneNumber department designation isVerified isDeptHead status createdAt isFreeFood isIntern')
      .sort({ createdAt: -1 });

    // Map the users to ensure all fields are present
    const mappedUsers = users.map(user => ({
      _id: user._id,
      name: user.name || '',
      phoneNumber: user.phoneNumber,
      department: user.department || '',
      designation: user.designation || '',
      isVerified: user.isVerified,
      isDeptHead: user.isDeptHead,
      status: user.status || 'active',
      createdAt: user.createdAt,
      isFreeFood: user.isFreeFood,
      isIntern: user.isIntern
    }));

    res.json(mappedUsers);
  } catch (error) {
    console.error('Fetch users error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Admin: Get users list for dropdown (simplified)
router.get('/users/list', adminAuth, async (req, res) => {
  try {
    const users = await User.find({ status: 'active' })
      .populate('department', 'title')
      .select('name phoneNumber department designation isIntern')
      .sort({ name: 1 });

    const usersList = users.map(user => ({
      _id: user._id,
      name: user.name || '',
      phoneNumber: user.phoneNumber,
      department: user.department ? user.department.title : '',
      designation: user.designation || '',
      isIntern: user.isIntern,
      displayName: `${user.name || 'Unknown'} (${user.phoneNumber}) - ${user.department ? user.department.title : 'N/A'}`
    }));

    res.json(usersList);
  } catch (error) {
    console.error('Fetch users list error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Admin: Delete user
router.delete('/users/:userId', adminAuth, async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Admin: Edit user details
router.put('/users/:userId', adminAuth, async (req, res) => {
  try {
    let { name, department, designation, phoneNumber, isDeptHead, status, isFreeFood, isIntern } = req.body;

    // Find the user first
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // If phone number is being updated, validate and check for duplicates
    if (phoneNumber) {
      // Clean and format phone number
      phoneNumber = String(phoneNumber).trim().replace('+91', '').replace(/\D/g, '');
      
      // Validate phone number format
      if (phoneNumber.length !== 10) {
        return res.status(400).json({ 
          message: 'Please provide a valid 10-digit phone number' 
        });
      }

      // Check if phone number is already taken by another user
      const existingUser = await User.findOne({ 
        phoneNumber,
        _id: { $ne: req.params.userId } // Exclude current user from check
      });
      
      if (existingUser) {
        return res.status(400).json({ 
          message: 'Phone number is already registered with another user' 
        });
      }

      user.phoneNumber = phoneNumber;
    }

    // Update other fields if provided
    if (name) user.name = name.trim();
    if (department) {
      // Find department by ID or title
      let departmentDoc;
      if (mongoose.Types.ObjectId.isValid(department)) {
        departmentDoc = await Department.findById(department);
      } else if (typeof department === 'string') {
        departmentDoc = await Department.findOne({ title: department.trim() });
      } else {
        return res.status(400).json({ 
          message: 'Invalid department format. Please provide a valid department ID or name.' 
        });
      }

      if (!departmentDoc) {
        return res.status(400).json({ 
          message: 'Invalid department. Please select a valid department.' 
        });
      }
      user.department = departmentDoc._id;
    }
    if (designation) user.designation = designation.trim();
    if (typeof isDeptHead !== 'undefined') user.isDeptHead = isDeptHead;
    if (status && ['active', 'inactive'].includes(status)) user.status = status;
    if (typeof isFreeFood !== 'undefined') user.isFreeFood = isFreeFood;
    if (typeof isIntern !== 'undefined') user.isIntern = isIntern;

    // Validate that required fields are not empty after trimming
    if (user.name && !user.name.trim()) {
      return res.status(400).json({ message: 'Name cannot be empty' });
    }
    if (user.designation && !user.designation.trim()) {
      return res.status(400).json({ message: 'Designation cannot be empty' });
    }

    await user.save();

    // Populate department for response
    await user.populate('department', 'title');

    res.json({
      message: 'User updated successfully',
      user: {
        id: user._id,
        name: user.name,
        phoneNumber: user.phoneNumber,
        department: user.department,
        designation: user.designation,
        isVerified: user.isVerified,
        isDeptHead: user.isDeptHead,
        status: user.status,
        isFreeFood: user.isFreeFood,
        isIntern: user.isIntern
      }
    });
  } catch (error) {
    console.error('User update error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Admin: Get users with their meals
router.get('/users/meals', adminAuth, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    // Get all users with their details
    const users = await User.find({}, { 
      phoneNumber: 1, 
      isVerified: 1, 
      name: 1, 
      department: 1, 
      designation: 1,
      isDeptHead: 1,
      isFreeFood: 1,
      isIntern: 1
    }).populate('department', 'title');
    
    // Prepare date filter for meals
    const mealQuery = {};
    if (startDate && endDate) {
      mealQuery.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    // Get meals for all users with the date filter
    const usersWithMeals = await Promise.all(users.map(async (user) => {
      const meals = await Meal.find({
        userId: user._id,
        ...mealQuery
      }).sort({ date: 1 });
      
      return {
        _id: user._id,
        phoneNumber: user.phoneNumber,
        name: user.name || '',
        department: user.department || '',
        designation: user.designation || '',
        isVerified: user.isVerified,
        isDeptHead: user.isDeptHead,
        isFreeFood: user.isFreeFood,
        isIntern: user.isIntern,
        meals: meals
      };
    }));

    res.json(usersWithMeals);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Admin: Add meal for a user
router.post('/users/:userId/meals', adminAuth, async (req, res) => {
  try {
    const { date, breakfast, lunch, dinner } = req.body;
    
    if (!date) {
      return res.status(400).json({ message: 'Date is required' });
    }

    // Check if user exists
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if meal already exists for this user and date
    const existingMeal = await Meal.findOne({
      userId: req.params.userId,
      date: new Date(date)
    });

    if (existingMeal) {
      return res.status(400).json({ 
        message: 'Meal record already exists for this date. Use edit function to update it.' 
      });
    }

    // Create new meal
    const meal = new Meal({
      userId: req.params.userId,
      date: new Date(date),
      breakfast: breakfast || false,
      lunch: lunch || false,
      dinner: dinner || false
    });

    await meal.save();
    res.status(201).json({ 
      message: 'Meal added successfully',
      meal
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Admin: Edit meal by userId and date
router.put('/users/:userId/meals', adminAuth, async (req, res) => {
  try {
    const { date, breakfast, lunch, dinner } = req.body;
    
    if (!date) {
      return res.status(400).json({ message: 'Date is required' });
    }

    // Find or create meal for the specified date
    let meal = await Meal.findOne({
      userId: req.params.userId,
      date: new Date(date)
    });

    if (!meal) {
      meal = new Meal({
        userId: req.params.userId,
        date: new Date(date)
      });
    }

    // Update only the provided fields
    if (breakfast !== undefined) meal.breakfast = breakfast;
    if (lunch !== undefined) meal.lunch = lunch;
    if (dinner !== undefined) meal.dinner = dinner;

    await meal.save();
    res.json({ 
      message: 'Meal updated successfully',
      meal
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Admin: Edit meal by mealId (keeping for backward compatibility)
router.put('/meals/:mealId', adminAuth, async (req, res) => {
  try {
    const { breakfast, lunch, dinner } = req.body;
    
    const meal = await Meal.findById(req.params.mealId);
    if (!meal) {
      return res.status(404).json({ message: 'Meal not found' });
    }

    // Update only the provided fields
    if (breakfast !== undefined) meal.breakfast = breakfast;
    if (lunch !== undefined) meal.lunch = lunch;
    if (dinner !== undefined) meal.dinner = dinner;

    await meal.save();
    res.json({ 
      message: 'Meal updated successfully',
      meal
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Admin: Delete meal by userId and date
router.delete('/users/:userId/meals', adminAuth, async (req, res) => {
  try {
    const { date } = req.query;
    
    if (!date) {
      return res.status(400).json({ message: 'Date is required' });
    }

    const meal = await Meal.findOneAndDelete({
      userId: req.params.userId,
      date: new Date(date)
    });

    if (!meal) {
      return res.status(404).json({ message: 'Meal not found' });
    }
    res.json({ message: 'Meal deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Admin: Delete meal by mealId (keeping for backward compatibility)
router.delete('/meals/:mealId', adminAuth, async (req, res) => {
  try {
    const meal = await Meal.findByIdAndDelete(req.params.mealId);
    if (!meal) {
      return res.status(404).json({ message: 'Meal not found' });
    }
    res.json({ message: 'Meal deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Admin: Get all notifications
router.get('/notifications', adminAuth, async (req, res) => {
  try {
    const notifications = await Notification.find()
      .sort({ createdAt: -1 }); // Most recent first
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Admin: Create notification
router.post('/notifications', adminAuth, async (req, res) => {
  try {
    const { title, description } = req.body;

    if (!title || !description) {
      return res.status(400).json({ message: 'Title and description are required' });
    }

    const notification = new Notification({
      title,
      description
    });

    await notification.save();
    
    // Send push notification
    try {
      const pushResult = await sendPushNotification(title, description);
      
      // Check if there were any errors in the OneSignal response
      if (pushResult.errors && pushResult.errors.length > 0) {
        return res.status(400).json({
          message: 'Notification saved but push notification failed: ' + pushResult.errors.join(', '),
          notification,
          pushError: pushResult.errors
        });
      }

      res.status(201).json({
        message: 'Notification created and push notification sent successfully',
        notification
      });
    } catch (pushError) {
      // If push notification fails, still return success but with a warning
      console.error('Push notification error:', pushError);
      res.status(201).json({
        message: 'Notification saved but push notification failed to send',
        notification,
        pushError: pushError.message
      });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Admin: Update notification
router.put('/notifications/:notificationId', adminAuth, async (req, res) => {
  try {
    const { title, description } = req.body;
    
    const notification = await Notification.findById(req.params.notificationId);
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    if (title) notification.title = title;
    if (description) notification.description = description;

    await notification.save();

    // Send push notification for the update
    try {
      await sendPushNotification(
        notification.title,
        notification.description
      );
    } catch (pushError) {
      console.error('Push notification error:', pushError);
      // Continue even if push notification fails
    }

    res.json({
      message: 'Notification updated successfully',
      notification
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Admin: Delete notification
router.delete('/notifications/:notificationId', adminAuth, async (req, res) => {
  try {
    const notification = await Notification.findByIdAndDelete(req.params.notificationId);
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    res.json({ message: 'Notification deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Admin: Create a new message
router.post('/messages', adminAuth, async (req, res) => {
  try {
    const { title, description } = req.body;

    if (!title || !description) {
      return res.status(400).json({ 
        message: 'Title and description are required' 
      });
    }

    const message = new Message({
      title: title.trim(),
      description: description.trim()
    });

    await message.save();

    res.status(201).json({
      message: 'Message created successfully',
      data: message
    });
  } catch (error) {
    console.error('Message creation error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Admin: Get all messages
router.get('/messages', adminAuth, async (req, res) => {
  try {
    const messages = await Message.find().sort({ createdAt: -1 });
    res.json(messages);
  } catch (error) {
    console.error('Fetch messages error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Admin: Delete a message
router.delete('/messages/:messageId', adminAuth, async (req, res) => {
  try {
    const message = await Message.findByIdAndDelete(req.params.messageId);
    
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    res.json({ 
      message: 'Message deleted successfully',
      deletedMessage: message
    });
  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({ 
      message: 'Failed to delete message',
      error: error.message 
    });
  }
});

// Admin: Send message to all users via WhatsApp
router.post('/messages/:messageId/send', adminAuth, async (req, res) => {
  try {
    const message = await Message.findById(req.params.messageId);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Get all verified users' phone numbers
    const users = await User.find({ isVerified: true }, 'phoneNumber');
    if (users.length === 0) {
      return res.status(400).json({ message: 'No verified users found' });
    }

    // Format phone numbers for bulk message
    const recipients = users.map(user => {
      const phone = user.phoneNumber.replace(/[\s+\-()]/g, '');
      return phone.startsWith('91') ? phone : `91${phone}`;
    }).join(',');

    // Prepare the bulk message payload
    const payload = {
      secret: process.env.DXING_API_KEY,
      account: process.env.DXING_INSTANCE_ID,
      campaign: message.title,
      recipients: recipients,
      type: "text",
      message: `*${message.title}*\n\n${message.description}`
    };

    // Send bulk message using DXing API
    const response = await axios.post('https://app.dxing.in/api/send/whatsapp.bulk', payload, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.data.status) {
      throw new Error(response.data.message || 'Failed to send bulk message');
    }

    // Update message status
    message.sentToUsers = true;
    await message.save();

    res.json({
      message: 'Bulk message sent successfully',
      recipients: users.length,
      response: response.data
    });
  } catch (error) {
    console.error('Bulk message error:', error);
    res.status(500).json({ 
      message: 'Failed to send bulk message',
      error: error.message 
    });
  }
});

// Admin: Get users by meal type for a specific date
router.get('/meals/:mealType', adminAuth, async (req, res) => {
  try {
    const { mealType } = req.params;
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({ message: 'Date parameter is required' });
    }

    // Validate meal type
    const validMealTypes = ['breakfast', 'lunch', 'dinner'];
    if (!validMealTypes.includes(mealType.toLowerCase())) {
      return res.status(400).json({ message: 'Invalid meal type. Must be breakfast, lunch, or dinner' });
    }

    // Create date range for the specified date (start of day to end of day)
    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);

    // Find meals for the specified type and date
    const meals = await Meal.find({
      date: { $gte: startDate, $lte: endDate },
      [mealType.toLowerCase()]: true
    }).populate({
      path: 'userId',
      select: 'name phoneNumber department designation',
      populate: {
        path: 'department',
        select: 'title'
      },
      match: { _id: { $exists: true } }  // Only populate if user exists
    });

    // Filter out meals with null userId and format the response
    const usersWithMeals = meals
      .filter(meal => meal.userId !== null)  // Filter out meals with no valid user
      .map(meal => ({
        userId: meal.userId._id,
        name: meal.userId.name || '',
        phoneNumber: meal.userId.phoneNumber || '',
        department: meal.userId.department || '',
        designation: meal.userId.designation || '',
        date: meal.date
      }));

    res.json(usersWithMeals);
  } catch (error) {
    console.error('Error fetching meals by type:', error);
    res.status(500).json({ 
      message: 'Failed to fetch meals',
      error: error.message 
    });
  }
});

// Admin: Get meal counts by type for a date range
router.get('/meals/counts/summary', adminAuth, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'Both startDate and endDate parameters are required' });
    }

    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    const meals = await Meal.find({
      date: { $gte: start, $lte: end }
    });

    // Calculate counts
    const summary = {
      breakfast: meals.filter(meal => meal.breakfast).length,
      lunch: meals.filter(meal => meal.lunch).length,
      dinner: meals.filter(meal => meal.dinner).length,
      totalMeals: meals.length,
      dateRange: {
        from: start,
        to: end
      }
    };

    res.json(summary);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Admin: Get single user by ID
router.get('/users/:userId', adminAuth, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).populate('department', 'title');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      _id: user._id,
      name: user.name,
      phoneNumber: user.phoneNumber,
      department: user.department,
      designation: user.designation,
      isVerified: user.isVerified,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      isFreeFood: user.isFreeFood,
      isIntern: user.isIntern
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid user ID format' });
    }
    console.error('Fetch single user error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Admin: Get user-wise meal counts for a date range (includes isIntern)
router.get('/meal-counts', adminAuth, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'Both startDate and endDate parameters are required' });
    }

    // Create date range
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    // First get all users and create a lookup map
    const users = await User.find({}).lean();
    
    if (!users || users.length === 0) {
      return res.json({
        dateRange: { from: start, to: end },
        overallTotals: { breakfast: 0, lunch: 0, dinner: 0, total: 0 },
        users: []
      });
    }

    // Get meal counts using aggregation
    const mealCounts = await Meal.aggregate([
      {
        $match: {
          date: { $gte: start, $lte: end },
          userId: { $in: users.map(user => user._id) }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $unwind: '$user'
      },
      {
        $lookup: {
          from: 'departments',
          localField: 'user.department',
          foreignField: '_id',
          as: 'userDepartment'
        }
      },
      {
        $unwind: { path: '$userDepartment', preserveNullAndEmptyArrays: true }
      },
      {
        $group: {
          _id: {
            userId: '$userId',
            department: '$userDepartment._id'
          },
          user: { $first: '$user' },
          userDepartment: { $first: '$userDepartment' },
          breakfastCount: {
            $sum: { $cond: [{ $eq: ['$breakfast', true] }, 1, 0] }
          },
          lunchCount: {
            $sum: { $cond: [{ $eq: ['$lunch', true] }, 1, 0] }
          },
          dinnerCount: {
            $sum: { $cond: [{ $eq: ['$dinner', true] }, 1, 0] }
          }
        }
      },
      {
        $group: {
          _id: '$_id.department',
          departmentTitle: { $first: '$userDepartment.title' },
          users: {
            $push: {
              userId: '$_id.userId',
              name: '$user.name',
              phoneNumber: '$user.phoneNumber',
              department: '$userDepartment.title',
              designation: '$user.designation',
              isFreeFood: { $ifNull: ['$user.isFreeFood', false] },
              isIntern: { $ifNull: ['$user.isIntern', false] },
              breakfastCount: '$breakfastCount',
              lunchCount: '$lunchCount',
              dinnerCount: '$dinnerCount',
              totalMeals: { $add: ['$breakfastCount', '$lunchCount', '$dinnerCount'] }
            }
          },
          departmentTotals: {
            $push: {
              breakfast: '$breakfastCount',
              lunch: '$lunchCount',
              dinner: '$dinnerCount'
            }
          }
        }
      },
      {
        $project: {
          _id: 0,
          department: { $ifNull: ['$departmentTitle', 'Unknown'] },
          users: 1,
          totals: {
            breakfast: { $sum: '$departmentTotals.breakfast' },
            lunch: { $sum: '$departmentTotals.lunch' },
            dinner: { $sum: '$departmentTotals.dinner' },
            total: {
              $sum: {
                $map: {
                  input: '$departmentTotals',
                  as: 'total',
                  in: { $add: ['$$total.breakfast', '$$total.lunch', '$$total.dinner'] }
                }
              }
            }
          }
        }
      },
      {
        $sort: { 'totals.total': -1 }
      }
    ]);

    // Add users with no meals for each department and sort users by total meals
    const departmentsWithAllUsers = await Promise.all(
      mealCounts.map(async (dept) => {
        // Find department ObjectId for querying users
        const departmentDoc = await Department.findOne({ title: dept.department });
        if (!departmentDoc) return dept;

        const deptUsers = await User.find({ 
          department: departmentDoc._id,
          _id: { $nin: dept.users.map(u => u.userId) }
        }).populate('department', 'title');

        const usersWithNoMeals = deptUsers.map(user => ({
          userId: user._id,
          name: user.name || '',
          phoneNumber: user.phoneNumber || '',
          department: user.department ? user.department.title : '',
          designation: user.designation || '',
          isDeptHead: user.isDeptHead || false,
          isFreeFood: user.isFreeFood || false,
          isIntern: user.isIntern || false,
          breakfastCount: 0,
          lunchCount: 0,
          dinnerCount: 0,
          totalMeals: 0
        }));

        // Combine and sort all users by total meals
        const allUsers = [...dept.users, ...usersWithNoMeals].sort((a, b) => b.totalMeals - a.totalMeals);

        return {
          ...dept,
          users: allUsers
        };
      })
    );

    // Calculate overall totals
    const overallTotals = departmentsWithAllUsers.reduce((acc, dept) => {
      acc.breakfast += dept.totals.breakfast;
      acc.lunch += dept.totals.lunch;
      acc.dinner += dept.totals.dinner;
      acc.total += dept.totals.total;
      return acc;
    }, { breakfast: 0, lunch: 0, dinner: 0, total: 0 });

    res.json({
      dateRange: {
        from: start,
        to: end
      },
      overallTotals,
      departments: departmentsWithAllUsers
    });

  } catch (error) {
    console.error('Error fetching user meal counts:', error);
    res.status(500).json({ 
      message: 'Failed to fetch meal counts',
      error: error.message 
    });
  }
});

// Admin: Get all guest meals with department summary
router.get('/guest-meals', adminAuth, async (req, res) => {
  try {
    // Get all guest meals with proper population
    const guestMeals = await GuestMeal.find()
      .populate('department', 'title')
      .sort({ date: -1 });

    // Process each meal to handle addedBy field
    const processedMeals = await Promise.all(guestMeals.map(async (meal) => {
      const mealObj = meal.toObject();
      
      // If addedBy is a string (e.g., "Admin"), return as is
      if (typeof meal.addedBy === 'string') {
        return mealObj;
      }
      
      // If addedBy is an ObjectId, try to populate user info
      try {
        const user = await User.findById(meal.addedBy).populate('department', 'title').select('name department');
        if (user) {
          mealObj.addedBy = {
            name: user.name,
            department: user.department
          };
        } else {
          mealObj.addedBy = 'N/A';
        }
      } catch (err) {
        mealObj.addedBy = 'N/A';
      }
      
      return mealObj;
    }));

    // Group meals by department and calculate totals
    const departmentSummary = processedMeals.reduce((acc, meal) => {
      const deptTitle = meal.department ? meal.department.title : 'Unknown';
      if (!acc[deptTitle]) {
        acc[deptTitle] = {
          department: deptTitle,
          totalBreakfast: 0,
          totalLunch: 0,
          totalDinner: 0,
          totalMeals: 0
        };
      }
      
      acc[deptTitle].totalBreakfast += meal.breakfastCount || 0;
      acc[deptTitle].totalLunch += meal.lunchCount || 0;
      acc[deptTitle].totalDinner += meal.dinnerCount || 0;
      acc[deptTitle].totalMeals += 
        (meal.breakfastCount || 0) + 
        (meal.lunchCount || 0) + 
        (meal.dinnerCount || 0);
      
      return acc;
    }, {});

    // Calculate overall totals
    const overallTotals = {
      totalBreakfast: processedMeals.reduce((sum, meal) => sum + (meal.breakfastCount || 0), 0),
      totalLunch: processedMeals.reduce((sum, meal) => sum + (meal.lunchCount || 0), 0),
      totalDinner: processedMeals.reduce((sum, meal) => sum + (meal.dinnerCount || 0), 0)
    };
    overallTotals.totalMeals = overallTotals.totalBreakfast + overallTotals.totalLunch + overallTotals.totalDinner;

    res.json({
      success: true,
      overallTotals,
      departmentSummary: Object.values(departmentSummary),
      guestMeals: processedMeals
    });
  } catch (error) {
    console.error('Get guest meals error:', error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
});

// Admin: Get today's guest meals
router.get('/guest-meals/today', adminAuth, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const guestMeals = await GuestMeal.find({
      date: {
        $gte: today,
        $lt: tomorrow
      }
    })
    .populate('department', 'title')
    .populate({
      path: 'addedBy',
      select: 'name department',
      populate: {
        path: 'department',
        select: 'title'
      }
    });

    // Calculate department-wise totals for today
    const departmentTotals = guestMeals.reduce((acc, meal) => {
      const deptTitle = meal.department ? meal.department.title : 'Unknown';
      if (!acc[deptTitle]) {
        acc[deptTitle] = {
          department: deptTitle,
          breakfast: 0,
          lunch: 0,
          dinner: 0,
          total: 0
        };
      }

      acc[deptTitle].breakfast += meal.breakfastCount || 0;
      acc[deptTitle].lunch += meal.lunchCount || 0;
      acc[deptTitle].dinner += meal.dinnerCount || 0;
      acc[deptTitle].total += 
        (meal.breakfastCount || 0) + 
        (meal.lunchCount || 0) + 
        (meal.dinnerCount || 0);

      return acc;
    }, {});

    // Calculate overall totals for today
    const todayTotals = {
      breakfast: guestMeals.reduce((sum, meal) => sum + (meal.breakfastCount || 0), 0),
      lunch: guestMeals.reduce((sum, meal) => sum + (meal.lunchCount || 0), 0),
      dinner: guestMeals.reduce((sum, meal) => sum + (meal.dinnerCount || 0), 0)
    };
    todayTotals.total = todayTotals.breakfast + todayTotals.lunch + todayTotals.dinner;

    res.json({
      success: true,
      date: today,
      todayTotals,
      departmentTotals: Object.values(departmentTotals),
      guestMeals
    });
  } catch (error) {
    console.error('Get today guest meals error:', error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
});

// Admin: Get guest meals by department
router.get('/guest-meals/department/:department', adminAuth, async (req, res) => {
  try {
    // Find department by ID or title
    let departmentDoc;
    if (mongoose.Types.ObjectId.isValid(req.params.department)) {
      departmentDoc = await Department.findById(req.params.department);
    } else {
      departmentDoc = await Department.findOne({ title: req.params.department });
    }

    if (!departmentDoc) {
      return res.status(400).json({
        success: false,
        message: 'Department not found'
      });
    }

    const guestMeals = await GuestMeal.find({
      department: departmentDoc._id
    })
    .populate('department', 'title')
    .populate({
      path: 'addedBy',
      select: 'name department',
      populate: {
        path: 'department',
        select: 'title'
      }
    })
    .sort({ date: -1 });

    // Calculate department totals
    const departmentTotals = {
      department: departmentDoc.title,
      totalBreakfast: guestMeals.reduce((sum, meal) => sum + (meal.breakfastCount || 0), 0),
      totalLunch: guestMeals.reduce((sum, meal) => sum + (meal.lunchCount || 0), 0),
      totalDinner: guestMeals.reduce((sum, meal) => sum + (meal.dinnerCount || 0), 0)
    };
    departmentTotals.totalMeals = 
      departmentTotals.totalBreakfast + 
      departmentTotals.totalLunch + 
      departmentTotals.totalDinner;

    res.json({
      success: true,
      departmentTotals,
      guestMeals
    });
  } catch (error) {
    console.error('Get department guest meals error:', error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
});

// Admin: Get meal counts by department
router.get('/department-meal-counts', adminAuth, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'Both startDate and endDate parameters are required' });
    }

    // Create date range
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    // Get meal counts using aggregation
    const departmentMealCounts = await Meal.aggregate([
      {
        $match: {
          date: { $gte: start, $lte: end }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $unwind: '$user'
      },
      {
        $lookup: {
          from: 'departments',
          localField: 'user.department',
          foreignField: '_id',
          as: 'userDepartment'
        }
      },
      {
        $unwind: { path: '$userDepartment', preserveNullAndEmptyArrays: true }
      },
      {
        $group: {
          _id: '$user.department',
          departmentTitle: { $first: '$userDepartment.title' },
          breakfastCount: {
            $sum: { $cond: [{ $eq: ['$breakfast', true] }, 1, 0] }
          },
          lunchCount: {
            $sum: { $cond: [{ $eq: ['$lunch', true] }, 1, 0] }
          },
          dinnerCount: {
            $sum: { $cond: [{ $eq: ['$dinner', true] }, 1, 0] }
          },
          userCount: { $addToSet: '$userId' }
        }
      },
      {
        $project: {
          _id: 0,
          department: { $ifNull: ['$departmentTitle', 'Unknown'] },
          breakfastCount: 1,
          lunchCount: 1,
          dinnerCount: 1,
          totalMeals: {
            $add: ['$breakfastCount', '$lunchCount', '$dinnerCount']
          },
          uniqueUsers: { $size: '$userCount' }
        }
      },
      {
        $sort: { totalMeals: -1 }
      }
    ]);

    // Calculate overall totals
    const overallTotals = departmentMealCounts.reduce((acc, dept) => {
      acc.breakfast += dept.breakfastCount;
      acc.lunch += dept.lunchCount;
      acc.dinner += dept.dinnerCount;
      acc.totalMeals += dept.totalMeals;
      acc.totalUsers += dept.uniqueUsers;
      return acc;
    }, { breakfast: 0, lunch: 0, dinner: 0, totalMeals: 0, totalUsers: 0 });

    res.json({
      dateRange: {
        from: start,
        to: end
      },
      overallTotals,
      departments: departmentMealCounts.map(dept => ({
        ...dept,
        percentageOfTotal: ((dept.totalMeals / overallTotals.totalMeals) * 100).toFixed(2)
      }))
    });

  } catch (error) {
    console.error('Error fetching department meal counts:', error);
    res.status(500).json({ 
      message: 'Failed to fetch department meal counts',
      error: error.message 
    });
  }
});

// Admin: Get department-wise user meal counts
router.get('/department-user-meals', adminAuth, async (req, res) => {
  try {
    const { startDate, endDate, department } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'Both startDate and endDate parameters are required' });
    }

    // Create date range
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    // Get users by department
    let userQuery = {};
    if (department) {
      // Find department by ID or title
      let departmentDoc;
      if (mongoose.Types.ObjectId.isValid(department)) {
        departmentDoc = await Department.findById(department);
      } else {
        departmentDoc = await Department.findOne({ title: department.trim() });
      }

      if (departmentDoc) {
        userQuery.department = departmentDoc._id;
      }
    }
    const users = await User.find(userQuery).lean();

    if (!users || users.length === 0) {
      return res.json({
        dateRange: { from: start, to: end },
        departments: []
      });
    }

    // Get meal counts using aggregation
    const mealCounts = await Meal.aggregate([
      {
        $match: {
          date: { $gte: start, $lte: end },
          userId: { $in: users.map(user => user._id) }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $unwind: '$user'
      },
      {
        $lookup: {
          from: 'departments',
          localField: 'user.department',
          foreignField: '_id',
          as: 'userDepartment'
        }
      },
      {
        $unwind: { path: '$userDepartment', preserveNullAndEmptyArrays: true }
      },
      {
        $group: {
          _id: {
            userId: '$userId',
            department: '$userDepartment._id'
          },
          user: { $first: '$user' },
          userDepartment: { $first: '$userDepartment' },
          breakfastCount: {
            $sum: { $cond: [{ $eq: ['$breakfast', true] }, 1, 0] }
          },
          lunchCount: {
            $sum: { $cond: [{ $eq: ['$lunch', true] }, 1, 0] }
          },
          dinnerCount: {
            $sum: { $cond: [{ $eq: ['$dinner', true] }, 1, 0] }
          }
        }
      },
      {
        $group: {
          _id: '$_id.department',
          departmentTitle: { $first: '$userDepartment.title' },
          users: {
            $push: {
              userId: '$_id.userId',
              name: '$user.name',
              phoneNumber: '$user.phoneNumber',
              department: '$userDepartment.title',
              designation: '$user.designation',
              isFreeFood: { $ifNull: ['$user.isFreeFood', false] },
              isIntern: { $ifNull: ['$user.isIntern', false] },
              breakfastCount: '$breakfastCount',
              lunchCount: '$lunchCount',
              dinnerCount: '$dinnerCount',
              totalMeals: { $add: ['$breakfastCount', '$lunchCount', '$dinnerCount'] }
            }
          },
          departmentTotals: {
            $push: {
              breakfast: '$breakfastCount',
              lunch: '$lunchCount',
              dinner: '$dinnerCount'
            }
          }
        }
      },
      {
        $project: {
          _id: 0,
          department: { $ifNull: ['$departmentTitle', 'Unknown'] },
          users: 1,
          totals: {
            breakfast: { $sum: '$departmentTotals.breakfast' },
            lunch: { $sum: '$departmentTotals.lunch' },
            dinner: { $sum: '$departmentTotals.dinner' },
            total: {
              $sum: {
                $map: {
                  input: '$departmentTotals',
                  as: 'total',
                  in: { $add: ['$$total.breakfast', '$$total.lunch', '$$total.dinner'] }
                }
              }
            }
          }
        }
      },
      {
        $sort: { 'totals.total': -1 }
      }
    ]);

    // Add users with no meals for each department and sort users by total meals
    const departmentsWithAllUsers = await Promise.all(
      mealCounts.map(async (dept) => {
        // Find department ObjectId for querying users
        const departmentDoc = await Department.findOne({ title: dept.department });
        if (!departmentDoc) return dept;

        const deptUsers = await User.find({ 
          department: departmentDoc._id,
          _id: { $nin: dept.users.map(u => u.userId) }
        }).populate('department', 'title');

        const usersWithNoMeals = deptUsers.map(user => ({
          userId: user._id,
          name: user.name || '',
          phoneNumber: user.phoneNumber || '',
          department: user.department ? user.department.title : '',
          designation: user.designation || '',
          isDeptHead: user.isDeptHead || false,
          isFreeFood: user.isFreeFood || false,
          isIntern: user.isIntern || false,
          breakfastCount: 0,
          lunchCount: 0,
          dinnerCount: 0,
          totalMeals: 0
        }));

        // Combine and sort all users by total meals
        const allUsers = [...dept.users, ...usersWithNoMeals].sort((a, b) => b.totalMeals - a.totalMeals);

        return {
          ...dept,
          users: allUsers
        };
      })
    );

    // Calculate overall totals
    const overallTotals = departmentsWithAllUsers.reduce((acc, dept) => {
      acc.breakfast += dept.totals.breakfast;
      acc.lunch += dept.totals.lunch;
      acc.dinner += dept.totals.dinner;
      acc.total += dept.totals.total;
      return acc;
    }, { breakfast: 0, lunch: 0, dinner: 0, total: 0 });

    res.json({
      dateRange: { from: start, to: end },
      overallTotals,
      departments: departmentsWithAllUsers
    });

  } catch (error) {
    console.error('Error fetching department user meal counts:', error);
    res.status(500).json({ 
      message: 'Failed to fetch department user meal counts',
      error: error.message 
    });
  }
});

// Admin: Create guest meal
router.post('/guest-meals', adminAuth, async (req, res) => {
  try {
    const { date, department, breakfastCount, lunchCount, dinnerCount } = req.body;

    if (!date || !department) {
      return res.status(400).json({
        success: false,
        message: 'Date and department are required'
      });
    }

    // Find department by ID or title
    let departmentDoc;
    if (mongoose.Types.ObjectId.isValid(department)) {
      departmentDoc = await Department.findById(department);
    } else {
      departmentDoc = await Department.findOne({ title: department.trim() });
    }

    if (!departmentDoc) {
      return res.status(400).json({
        success: false,
        message: 'Invalid department. Please select a valid department.'
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

    const guestMeal = new GuestMeal({
      date: new Date(date),
      department: departmentDoc._id,
      addedBy: "Admin",
      breakfastCount: breakfastCount || 0,
      lunchCount: lunchCount || 0,
      dinnerCount: dinnerCount || 0
    });

    await guestMeal.save();

    // Populate department for response
    await guestMeal.populate('department', 'title');

    res.status(201).json({
      success: true,
      message: 'Guest meal created successfully',
      guestMeal
    });
  } catch (error) {
    console.error('Create guest meal error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Admin: Update guest meal
router.put('/guest-meals/:id', adminAuth, async (req, res) => {
  try {
    const { date, department, breakfastCount, lunchCount, dinnerCount } = req.body;

    // Find the guest meal record
    const guestMeal = await GuestMeal.findById(req.params.id);
    if (!guestMeal) {
      return res.status(404).json({
        success: false,
        message: 'Guest meal not found'
      });
    }

    // Handle department update if provided
    if (department) {
      let departmentDoc;
      if (mongoose.Types.ObjectId.isValid(department)) {
        departmentDoc = await Department.findById(department);
      } else {
        departmentDoc = await Department.findOne({ title: department.trim() });
      }

      if (!departmentDoc) {
        return res.status(400).json({
          success: false,
          message: 'Invalid department. Please select a valid department.'
        });
      }
      guestMeal.department = departmentDoc._id;
    }

    // Update fields if provided
    if (date) guestMeal.date = new Date(date);
    if (typeof breakfastCount !== 'undefined') guestMeal.breakfastCount = breakfastCount;
    if (typeof lunchCount !== 'undefined') guestMeal.lunchCount = lunchCount;
    if (typeof dinnerCount !== 'undefined') guestMeal.dinnerCount = dinnerCount;

    await guestMeal.save();

    // Populate fields before sending response
    await guestMeal.populate('department', 'title');
    if (typeof guestMeal.addedBy === 'object' && guestMeal.addedBy !== null) {
      await guestMeal.populate({
        path: 'addedBy',
        select: 'name department',
        populate: {
          path: 'department',
          select: 'title'
        }
      });
    }

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

// Admin: Delete guest meal
router.delete('/guest-meals/:id', adminAuth, async (req, res) => {
  try {
    const guestMeal = await GuestMeal.findByIdAndDelete(req.params.id);
    
    if (!guestMeal) {
      return res.status(404).json({
        success: false,
        message: 'Guest meal not found'
      });
    }

    res.json({
      success: true,
      message: 'Guest meal deleted successfully'
    });
  } catch (error) {
    console.error('Delete guest meal error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Admin: Create meeting
router.post('/meetings', adminAuth, async (req, res) => {
  try {
    const {
      title, description, startDatetime, endDatetime,
      hall, noOfPersons, rent, foodRequired, breakfast,
      morningSnacksCount, morningTeaCount, lunch,
      eveningSnacksCount, eveningTeaCount, dinner,
      department
    } = req.body;

    // Validate required fields
    if (!title || !description || !startDatetime || !endDatetime || !hall || !department || typeof rent === 'undefined') {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: title, description, startDatetime, endDatetime, hall, department, and rent amount'
      });
    }

    // Validate numeric fields (allow 0 but not undefined/null)
    if (typeof noOfPersons === 'undefined') {
      return res.status(400).json({
        success: false,
        message: 'Please provide noOfPersons'
      });
    }

    // Validate rent is a non-negative number
    if (rent < 0) {
      return res.status(400).json({
        success: false,
        message: 'Rent amount must be 0 or greater'
      });
    }

    // Convert to numbers
    const numPersons = parseInt(noOfPersons);
    const rentAmount = parseInt(rent) || 0;

    // Validate minimum values
    if (numPersons < 1) {
      return res.status(400).json({
        success: false,
        message: 'Number of persons must be at least 1'
      });
    }

    // Find department by ID or title
    let departmentDoc;
    if (mongoose.Types.ObjectId.isValid(department)) {
      departmentDoc = await Department.findById(department);
    } else {
      departmentDoc = await Department.findOne({ title: department.trim() });
    }

    if (!departmentDoc) {
      return res.status(400).json({
        success: false,
        message: 'Invalid department. Please select a valid department.'
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
      rent: rentAmount,
      noOfPersons: numPersons,
      foodRequired: foodRequired || false,
      breakfast: parseInt(breakfast) || 0,
      morningSnacksCount: parseInt(morningSnacksCount) || 0,
      morningTeaCount: parseInt(morningTeaCount) || 0,
      lunch: parseInt(lunch) || 0,
      eveningSnacksCount: parseInt(eveningSnacksCount) || 0,
      eveningTeaCount: parseInt(eveningTeaCount) || 0,
      dinner: parseInt(dinner) || 0,
      department: departmentDoc._id,
      status: 'approved', // Auto-approve for admin
      createdBy: 'admin'
    });

    await meeting.save();

    // Populate department for response
    await meeting.populate('department', 'title');

    res.status(201).json({
      success: true,
      message: 'Meeting created successfully',
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

// Admin: Get all meetings
router.get('/meetings', adminAuth, async (req, res) => {
  try {
    const meetings = await Meeting.find()
      .populate('department', 'title')
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

// Admin: Update meeting
router.put('/meetings/:meetingId', adminAuth, async (req, res) => {
  try {
    const {
      title, description, startDatetime, endDatetime,
      hall, noOfPersons, rent, foodRequired, breakfast,
      morningSnacksCount, morningTeaCount, lunch,
      eveningSnacksCount, eveningTeaCount, dinner,
      department, status
    } = req.body;

    const meeting = await Meeting.findById(req.params.meetingId);
    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: 'Meeting not found'
      });
    }

    // If department is being updated, validate and get the reference
    if (department && department !== meeting.department) {
      let departmentDoc;
      if (mongoose.Types.ObjectId.isValid(department)) {
        departmentDoc = await Department.findById(department);
      } else if (typeof department === 'string') {
        departmentDoc = await Department.findOne({ title: department.trim() });
      } else {
        return res.status(400).json({
          success: false,
          message: 'Invalid department format. Please provide a valid department ID or name.'
        });
      }

      if (!departmentDoc) {
        return res.status(400).json({
          success: false,
          message: 'Invalid department. Please select a valid department.'
        });
      }
      meeting.department = departmentDoc._id;
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
    
    // Handle numeric fields with proper parsing
    if (typeof rent !== 'undefined') meeting.rent = parseInt(rent) || 0;
    if (typeof noOfPersons !== 'undefined') meeting.noOfPersons = parseInt(noOfPersons);
    if (typeof breakfast !== 'undefined') meeting.breakfast = parseInt(breakfast);
    if (typeof morningSnacksCount !== 'undefined') meeting.morningSnacksCount = parseInt(morningSnacksCount);
    if (typeof morningTeaCount !== 'undefined') meeting.morningTeaCount = parseInt(morningTeaCount);
    if (typeof lunch !== 'undefined') meeting.lunch = parseInt(lunch);
    if (typeof eveningSnacksCount !== 'undefined') meeting.eveningSnacksCount = parseInt(eveningSnacksCount);
    if (typeof eveningTeaCount !== 'undefined') meeting.eveningTeaCount = parseInt(eveningTeaCount);
    if (typeof dinner !== 'undefined') meeting.dinner = parseInt(dinner);
    
    // Handle boolean fields
    if (typeof foodRequired !== 'undefined') meeting.foodRequired = foodRequired;
    if (status && ['approved', 'pending'].includes(status)) meeting.status = status;

    await meeting.save();

    // Populate department for response
    await meeting.populate('department', 'title');

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

// Admin: Delete meeting
router.delete('/meetings/:meetingId', adminAuth, async (req, res) => {
  try {
    const meeting = await Meeting.findByIdAndDelete(req.params.meetingId);
    
    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: 'Meeting not found'
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

// Get all departments (Updated to return full objects)
router.get('/departments', async (req, res) => {
  try {
    const departments = await Department.find()
      .sort({ title: 1 });

    res.json({
      success: true,
      departments,
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

// GET department by ID
router.get('/departments/:id', async (req, res) => {
  try {
    const department = await Department.findById(req.params.id);
    
    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Department not found'
      });
    }

    res.json({
      success: true,
      department
    });
  } catch (error) {
    console.error('Get department by ID error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// CREATE new department (Admin only)
router.post('/departments', adminAuth, async (req, res) => {
  try {
    const { title } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Department title is required'
      });
    }

    // Check if department already exists
    const existingDepartment = await Department.findOne({ 
      title: { $regex: new RegExp(`^${title.trim()}$`, 'i') }
    });

    if (existingDepartment) {
      return res.status(400).json({
        success: false,
        message: 'Department with this title already exists'
      });
    }

    const department = new Department({
      title: title.trim()
    });

    await department.save();

    res.status(201).json({
      success: true,
      message: 'Department created successfully',
      department
    });
  } catch (error) {
    console.error('Create department error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// UPDATE department (Admin only)
router.put('/departments/:id', adminAuth, async (req, res) => {
  try {
    const { title } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Department title is required'
      });
    }

    // Check if department exists
    const department = await Department.findById(req.params.id);
    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Department not found'
      });
    }

    // Check if another department with the same title exists
    const existingDepartment = await Department.findOne({ 
      title: { $regex: new RegExp(`^${title.trim()}$`, 'i') },
      _id: { $ne: req.params.id }
    });

    if (existingDepartment) {
      return res.status(400).json({
        success: false,
        message: 'Another department with this title already exists'
      });
    }

    department.title = title.trim();
    await department.save();

    res.json({
      success: true,
      message: 'Department updated successfully',
      department
    });
  } catch (error) {
    console.error('Update department error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// DELETE department (Admin only)
router.delete('/departments/:id', adminAuth, async (req, res) => {
  try {
    const department = await Department.findById(req.params.id);
    
    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Department not found'
      });
    }

    await Department.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Department deleted successfully'
    });
  } catch (error) {
    console.error('Delete department error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get department-wise rent bills
router.get('/department-rent-bills', adminAuth, async (req, res) => {
  try {
    const { startDate, endDate, department, venue } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'Both startDate and endDate parameters are required' });
    }

    // Create date range
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    // Build the query
    const matchCondition = {
      status: 'approved',
      startDatetime: { $gte: start, $lte: end }
    };

    // Add venue filter if provided
    if (venue) {
      matchCondition.hall = venue;
    }

    if (department) {
      // Find department by ID or title
      let departmentDoc;
      if (mongoose.Types.ObjectId.isValid(department)) {
        departmentDoc = await Department.findById(department);
      } else {
        departmentDoc = await Department.findOne({ title: department.trim() });
      }

      if (departmentDoc) {
        matchCondition.department = departmentDoc._id;
      }
    }

    // Fetch meetings and group by department with department name lookup, summing dynamic rent amounts
    const meetings = await Meeting.aggregate([
      { $match: matchCondition },
      {
        $lookup: {
          from: 'departments',
          localField: 'department',
          foreignField: '_id',
          as: 'departmentInfo'
        }
      },
      {
        $unwind: { path: '$departmentInfo', preserveNullAndEmptyArrays: true }
      },
      {
        $group: {
          _id: '$department',
          departmentTitle: { $first: '$departmentInfo.title' },
          meetingCount: { $sum: 1 },
          totalRent: { $sum: '$rent' }
        }
      },
      {
        $project: {
          _id: 0,
          department: { $ifNull: ['$departmentTitle', 'Unknown'] },
          meetingCount: 1,
          totalRent: 1
        }
      },
      { $sort: { department: 1 } }
    ]);

    res.json({
      departments: meetings
    });
  } catch (error) {
    console.error('Error fetching department rent bills:', error);
    res.status(500).json({ message: 'Error fetching department rent bills' });
  }
});

// Get department-wise guest meal bills
router.get('/department-guest-meals', adminAuth, async (req, res) => {
  try {
    const { startDate, endDate, department } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'Both startDate and endDate parameters are required' });
    }

    // Create date range
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    // Build match condition
    const matchCondition = {
      date: { $gte: start, $lte: end }
    };

    if (department) {
      // Find department by ID or title
      let departmentDoc;
      if (mongoose.Types.ObjectId.isValid(department)) {
        departmentDoc = await Department.findById(department);
      } else {
        departmentDoc = await Department.findOne({ title: department.trim() });
      }

      if (departmentDoc) {
        matchCondition.department = departmentDoc._id;
      }
    }

    // Get guest meal counts using aggregation
    const guestMealCounts = await GuestMeal.aggregate([
      {
        $match: matchCondition
      },
      {
        $lookup: {
          from: 'departments',
          localField: 'department',
          foreignField: '_id',
          as: 'departmentInfo'
        }
      },
      {
        $unwind: { path: '$departmentInfo', preserveNullAndEmptyArrays: true }
      },
      {
        $group: {
          _id: '$department',
          departmentTitle: { $first: '$departmentInfo.title' },
          breakfastCount: { $sum: '$breakfastCount' },
          lunchCount: { $sum: '$lunchCount' },
          dinnerCount: { $sum: '$dinnerCount' },
          totalMeals: {
            $sum: {
              $add: ['$breakfastCount', '$lunchCount', '$dinnerCount']
            }
          }
        }
      },
      {
        $project: {
          _id: 0,
          department: { $ifNull: ['$departmentTitle', 'Unknown'] },
          breakfastCount: 1,
          lunchCount: 1,
          dinnerCount: 1,
          totalMeals: 1
        }
      },
      {
        $sort: { department: 1 }
      }
    ]);

    res.json({
      departments: guestMealCounts
    });
  } catch (error) {
    console.error('Error fetching guest meal bills:', error);
    res.status(500).json({ 
      message: 'Failed to fetch guest meal bills',
      error: error.message 
    });
  }
});

// Get department-wise meeting food bills
router.get('/meeting-food-bills', adminAuth, async (req, res) => {
  try {
    const { startDate, endDate, department, venue } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'Both startDate and endDate parameters are required' });
    }

    // Create date range
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    // Build match condition for meetings within date range and approved status
    const matchCondition = {
      status: 'approved',
      startDatetime: { $gte: start, $lte: end },
      foodRequired: true
    };

    // Add venue filter if provided
    if (venue) {
      matchCondition.hall = venue;
    }

    if (department) {
      // Find department by ID or title
      let departmentDoc;
      if (mongoose.Types.ObjectId.isValid(department)) {
        departmentDoc = await Department.findById(department);
      } else {
        departmentDoc = await Department.findOne({ title: department.trim() });
      }

      if (departmentDoc) {
        matchCondition.department = departmentDoc._id;
      }
    }

    // Get meeting food counts using aggregation
    const meetingFoodCounts = await Meeting.aggregate([
      {
        $match: matchCondition
      },
      {
        $lookup: {
          from: 'departments',
          localField: 'department',
          foreignField: '_id',
          as: 'departmentInfo'
        }
      },
      {
        $unwind: { path: '$departmentInfo', preserveNullAndEmptyArrays: true }
      },
      {
        $group: {
          _id: '$department',
          departmentTitle: { $first: '$departmentInfo.title' },
          breakfast: { $sum: '$breakfast' },
          lunch: { $sum: '$lunch' },
          dinner: { $sum: '$dinner' },
          morningSnacksCount: { $sum: '$morningSnacksCount' },
          morningTeaCount: { $sum: '$morningTeaCount' },
          eveningSnacksCount: { $sum: '$eveningSnacksCount' },
          eveningTeaCount: { $sum: '$eveningTeaCount' },
          totalMeetings: { $sum: 1 },
          totalFood: {
            $sum: {
              $add: [
                '$breakfast',
                '$lunch', 
                '$dinner',
                '$morningSnacksCount',
                '$morningTeaCount',
                '$eveningSnacksCount',
                '$eveningTeaCount'
              ]
            }
          }
        }
      },
      {
        $project: {
          _id: 0,
          department: { $ifNull: ['$departmentTitle', 'Unknown'] },
          breakfast: 1,
          lunch: 1,
          dinner: 1,
          morningSnacksCount: 1,
          morningTeaCount: 1,
          eveningSnacksCount: 1,
          eveningTeaCount: 1,
          totalMeetings: 1,
          totalFood: 1
        }
      },
      {
        $sort: { department: 1 }
      }
    ]);

    // Calculate overall totals
    const overallTotals = meetingFoodCounts.reduce((acc, dept) => {
      acc.breakfast += dept.breakfast || 0;
      acc.lunch += dept.lunch || 0;
      acc.dinner += dept.dinner || 0;
      acc.morningSnacksCount += dept.morningSnacksCount || 0;
      acc.morningTeaCount += dept.morningTeaCount || 0;
      acc.eveningSnacksCount += dept.eveningSnacksCount || 0;
      acc.eveningTeaCount += dept.eveningTeaCount || 0;
      acc.totalMeetings += dept.totalMeetings || 0;
      acc.totalFood += dept.totalFood || 0;
      return acc;
    }, {
      breakfast: 0,
      lunch: 0,
      dinner: 0,
      morningSnacksCount: 0,
      morningTeaCount: 0,
      eveningSnacksCount: 0,
      eveningTeaCount: 0,
      totalMeetings: 0,
      totalFood: 0
    });

    res.json({
      dateRange: {
        from: start,
        to: end
      },
      overallTotals,
      departments: meetingFoodCounts
    });
  } catch (error) {
    console.error('Error fetching meeting food bills:', error);
    res.status(500).json({ 
      message: 'Failed to fetch meeting food bills',
      error: error.message 
    });
  }
});


// Get today's menu (Public route - accessible to all)
router.get('/menu/today', async (req, res) => {
  try {
    // Add cache-busting headers
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });

    // Get today's date (start of day)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    console.log('Admin menu today - Today:', today);

    const menu = await Menu.findOne({ date: today });
    
    console.log('Admin menu today - Menu found:', !!menu);
    if (menu) {
      console.log('Admin menu today - Menu ID:', menu._id);
    }
    
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
    console.error('Admin menu today error:', error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
});

// CUSTOM LIST CRUD OPERATIONS

// Create a new custom list
router.post('/custom-lists', adminAuth, async (req, res) => {
  try {
    const { title, users, description } = req.body;

    // Validate required fields
    if (!title || !title.trim()) {
      return res.status(400).json({ message: 'Title is required' });
    }

    // Check if users array is provided and contains valid user IDs
    if (users && users.length > 0) {
      const userIds = users.filter(id => mongoose.Types.ObjectId.isValid(id));
      if (userIds.length !== users.length) {
        return res.status(400).json({ message: 'All user IDs must be valid' });
      }

      // Check if all users exist
      const existingUsers = await User.find({ _id: { $in: userIds } });
      if (existingUsers.length !== userIds.length) {
        return res.status(400).json({ message: 'Some users do not exist' });
      }
    }

    const customList = new CustomList({
      title: title.trim(),
      users: users || [],
      description: description ? description.trim() : ''
    });

    await customList.save();
    
    // Populate users for response
    await customList.populate('users', 'name phoneNumber department designation');

    res.status(201).json({
      message: 'Custom list created successfully',
      customList
    });
  } catch (error) {
    console.error('Custom list creation error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get all custom lists
router.get('/custom-lists', adminAuth, async (req, res) => {
  try {
    const customLists = await CustomList.find()
      .populate('users', 'name phoneNumber department designation')
      .sort({ createdAt: -1 });

    res.json(customLists);
  } catch (error) {
    console.error('Fetch custom lists error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get a single custom list by ID
router.get('/custom-lists/:id', adminAuth, async (req, res) => {
  try {
    const customList = await CustomList.findById(req.params.id)
      .populate({
        path: 'users',
        select: 'name phoneNumber department designation',
        populate: {
          path: 'department',
          select: 'title'
        }
      });

    if (!customList) {
      return res.status(404).json({ message: 'Custom list not found' });
    }

    res.json(customList);
  } catch (error) {
    console.error('Fetch custom list error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Update a custom list
router.put('/custom-lists/:id', adminAuth, async (req, res) => {
  try {
    const { title, users, description } = req.body;

    // Validate required fields
    if (!title || !title.trim()) {
      return res.status(400).json({ message: 'Title is required' });
    }

    // Check if users array is provided and contains valid user IDs
    if (users && users.length > 0) {
      const userIds = users.filter(id => mongoose.Types.ObjectId.isValid(id));
      if (userIds.length !== users.length) {
        return res.status(400).json({ message: 'All user IDs must be valid' });
      }

      // Check if all users exist
      const existingUsers = await User.find({ _id: { $in: userIds } });
      if (existingUsers.length !== userIds.length) {
        return res.status(400).json({ message: 'Some users do not exist' });
      }
    }

    const customList = await CustomList.findByIdAndUpdate(
      req.params.id,
      {
        title: title.trim(),
        users: users || [],
        description: description ? description.trim() : ''
      },
      { new: true }
    ).populate({
      path: 'users',
      select: 'name phoneNumber department designation',
      populate: {
        path: 'department',
        select: 'title'
      }
    });

    if (!customList) {
      return res.status(404).json({ message: 'Custom list not found' });
    }

    res.json({
      message: 'Custom list updated successfully',
      customList
    });
  } catch (error) {
    console.error('Custom list update error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Delete a custom list
router.delete('/custom-lists/:id', adminAuth, async (req, res) => {
  try {
    const customList = await CustomList.findByIdAndDelete(req.params.id);

    if (!customList) {
      return res.status(404).json({ message: 'Custom list not found' });
    }

    res.json({ message: 'Custom list deleted successfully' });
  } catch (error) {
    console.error('Custom list deletion error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Add users to a custom list
router.post('/custom-lists/:id/users', adminAuth, async (req, res) => {
  try {
    const { userIds } = req.body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ message: 'User IDs array is required' });
    }

    // Validate user IDs
    const validUserIds = userIds.filter(id => mongoose.Types.ObjectId.isValid(id));
    if (validUserIds.length !== userIds.length) {
      return res.status(400).json({ message: 'All user IDs must be valid' });
    }

    // Check if all users exist
    const existingUsers = await User.find({ _id: { $in: validUserIds } });
    if (existingUsers.length !== validUserIds.length) {
      return res.status(400).json({ message: 'Some users do not exist' });
    }

    const customList = await CustomList.findByIdAndUpdate(
      req.params.id,
      { $addToSet: { users: { $each: validUserIds } } },
      { new: true }
    ).populate({
      path: 'users',
      select: 'name phoneNumber department designation',
      populate: {
        path: 'department',
        select: 'title'
      }
    });

    if (!customList) {
      return res.status(404).json({ message: 'Custom list not found' });
    }

    res.json({
      message: 'Users added to custom list successfully',
      customList
    });
  } catch (error) {
    console.error('Add users to custom list error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Remove users from a custom list
router.delete('/custom-lists/:id/users', adminAuth, async (req, res) => {
  try {
    const { userIds } = req.body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ message: 'User IDs array is required' });
    }

    // Validate user IDs
    const validUserIds = userIds.filter(id => mongoose.Types.ObjectId.isValid(id));
    if (validUserIds.length !== userIds.length) {
      return res.status(400).json({ message: 'All user IDs must be valid' });
    }

    const customList = await CustomList.findByIdAndUpdate(
      req.params.id,
      { $pull: { users: { $in: validUserIds } } },
      { new: true }
    ).populate({
      path: 'users',
      select: 'name phoneNumber department designation',
      populate: {
        path: 'department',
        select: 'title'
      }
    });

    if (!customList) {
      return res.status(404).json({ message: 'Custom list not found' });
    }

    res.json({
      message: 'Users removed from custom list successfully',
      customList
    });
  } catch (error) {
    console.error('Remove users from custom list error:', error);
    res.status(500).json({ message: error.message });
  }
});

// MENU CRUD OPERATIONS

// Add menu for specific date (Admin only)
router.post('/menu/date', adminAuth, async (req, res) => {
  try {
    const { date, breakfast, lunch, dinner } = req.body;
    
    // Validate required fields
    if (!date) {
      return res.status(400).json({ 
        success: false,
        message: 'Date is required' 
      });
    }

    if (!breakfast || !lunch || !dinner) {
      return res.status(400).json({ 
        success: false,
        message: 'All meal items are required (breakfast, lunch, dinner)' 
      });
    }

    // Create date range for the specified date (start of day to end of day)
    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);

    // Check if menu already exists for this date
    const existingMenu = await Menu.findOne({ 
      date: { $gte: startDate, $lte: endDate }
    });
    
    if (existingMenu) {
      return res.status(400).json({ 
        success: false,
        message: 'Menu for this date already exists. Use the update function to modify it.' 
      });
    }

    // Create the menu with normalized date
    const menuDate = new Date(date);
    menuDate.setHours(0, 0, 0, 0);

    // Create new menu
    const menu = new Menu({
      date: menuDate,
      breakfast: breakfast.trim(),
      lunch: lunch.trim(),
      dinner: dinner.trim(),
      addedBy: 'Admin'
    });

    await menu.save();

    // Get day name for response
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayName = days[menuDate.getDay()];

    res.status(201).json({
      success: true,
      message: 'Menu added successfully for ' + menuDate.toDateString(),
      menu: {
        id: menu._id,
        date: menu.date,
        day: dayName,
        breakfast: menu.breakfast,
        lunch: menu.lunch,
        dinner: menu.dinner,
        addedBy: menu.addedBy,
        createdAt: menu.createdAt
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
});

// Update menu for specific date (Admin only)
router.put('/menu/date', adminAuth, async (req, res) => {
  try {
    const { date, breakfast, lunch, dinner } = req.body;
    
    console.log('Admin menu update - Request body:', { date, breakfast, lunch, dinner });
    
    // Validate required fields
    if (!date) {
      return res.status(400).json({ 
        success: false,
        message: 'Date is required' 
      });
    }

    // Create date range for the specified date (start of day to end of day)
    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);

    console.log('Admin menu update - Date range:', { startDate, endDate });

    // Find existing menu for this date using date range
    let menu = await Menu.findOne({ 
      date: { $gte: startDate, $lte: endDate }
    });

    console.log('Admin menu update - Existing menu found:', !!menu);
    if (menu) {
      console.log('Admin menu update - Existing menu ID:', menu._id);
    }

    if (!menu) {
      // Create new menu if it doesn't exist
      if (!breakfast || !lunch || !dinner) {
        return res.status(400).json({ 
          success: false,
          message: 'All meal items are required when creating a new menu (breakfast, lunch, dinner)' 
        });
      }
      
      // Create the menu with normalized date
      const menuDate = new Date(date);
      menuDate.setHours(0, 0, 0, 0);
      
      menu = new Menu({
        date: menuDate,
        breakfast: breakfast.trim(),
        lunch: lunch.trim(),
        dinner: dinner.trim(),
        addedBy: 'Admin'
      });
      
      console.log('Admin menu update - Creating new menu with date:', menuDate);
    } else {
      // Update existing menu - only update provided fields
      if (breakfast !== undefined) menu.breakfast = breakfast.trim();
      if (lunch !== undefined) menu.lunch = lunch.trim();
      if (dinner !== undefined) menu.dinner = dinner.trim();
      
      console.log('Admin menu update - Updating existing menu');
    }

    await menu.save();
    console.log('Admin menu update - Menu saved successfully');

    // Get day name for response
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayName = days[menu.date.getDay()];

    res.json({
      success: true,
      message: 'Menu updated successfully for ' + menu.date.toDateString(),
      menu: {
        id: menu._id,
        date: menu.date,
        day: dayName,
        breakfast: menu.breakfast,
        lunch: menu.lunch,
        dinner: menu.dinner,
        addedBy: menu.addedBy,
        createdAt: menu.createdAt,
        updatedAt: menu.updatedAt
      }
    });
  } catch (error) {
    console.error('Admin menu update error:', error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
});

// Delete menu for specific date (Admin only)
router.delete('/menu/date', adminAuth, async (req, res) => {
  try {
    const { date } = req.body;
    
    console.log('Admin menu delete - Request body:', { date });
    
    // Validate required fields
    if (!date) {
      return res.status(400).json({ 
        success: false,
        message: 'Date is required' 
      });
    }

    // Create date range for the specified date (start of day to end of day)
    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);

    console.log('Admin menu delete - Date range:', { startDate, endDate });

    // Find the menu for this date using date range
    const menu = await Menu.findOne({ 
      date: { $gte: startDate, $lte: endDate }
    });
    
    console.log('Admin menu delete - Menu found:', !!menu);
    if (menu) {
      console.log('Admin menu delete - Menu ID:', menu._id);
    }
    
    if (!menu) {
      return res.status(404).json({ 
        success: false,
        message: 'No menu found for this date' 
      });
    }

    // Store menu details before deletion for response
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayName = days[menu.date.getDay()];
    
    const deletedMenuDetails = {
      id: menu._id,
      date: menu.date,
      day: dayName,
      breakfast: menu.breakfast,
      lunch: menu.lunch,
      dinner: menu.dinner,
      addedBy: menu.addedBy,
      createdAt: menu.createdAt
    };

    // Delete the menu using the found menu's ID
    await Menu.findByIdAndDelete(menu._id);
    console.log('Admin menu delete - Menu deleted successfully');

    res.json({
      success: true,
      message: 'Menu deleted successfully for ' + menu.date.toDateString(),
      deletedMenu: deletedMenuDetails
    });
  } catch (error) {
    console.error('Admin menu delete error:', error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
});

// Get all menus from today onwards (Admin route)
router.get('/menu/date', adminAuth, async (req, res) => {
  try {
    // Add cache-busting headers
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });

    // Get today's date (start of day)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    console.log('Admin menu query - Today:', today);

    // Find all menus from today onwards, sorted by date
    const menus = await Menu.find({ 
      date: { $gte: today }
    }).sort({ date: 1 });
    
    console.log('Admin menu query - Found menus:', menus.length);
    console.log('Admin menu query - Menu dates:', menus.map(m => m.date));

    if (menus.length === 0) {
      return res.status(404).json({ 
        success: false,
        message: 'No menus found from today onwards' 
      });
    }

    // Get day names for response
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    
    const formattedMenus = menus.map(menu => {
      const menuDate = new Date(menu.date);
      const dayName = days[menuDate.getDay()];
      
      return {
        id: menu._id,
        date: menu.date,
        day: dayName,
        breakfast: menu.breakfast,
        lunch: menu.lunch,
        dinner: menu.dinner,
        addedBy: menu.addedBy,
        createdAt: menu.createdAt,
        updatedAt: menu.updatedAt
      };
    });

    res.json({
      success: true,
      totalMenus: formattedMenus.length,
      menus: formattedMenus,
      dateRange: {
        from: today,
        to: menus[menus.length - 1].date
      }
    });
  } catch (error) {
    console.error('Admin menu query error:', error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
});

// Get all menus with date range filter (Admin route)
router.get('/menu/all', adminAuth, async (req, res) => {
  try {
    // Add cache-busting headers
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });

    const { startDate, endDate } = req.query;

    console.log('Admin menu all - Query params:', { startDate, endDate });

    // Build query
    let query = {};
    if (startDate && endDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      
      query.date = { $gte: start, $lte: end };
      console.log('Admin menu all - Date range query:', { start, end });
    }

    // Find menus based on query, sorted by date
    const menus = await Menu.find(query).sort({ date: 1 });
    
    console.log('Admin menu all - Found menus:', menus.length);
    console.log('Admin menu all - Menu dates:', menus.map(m => m.date));
    
    if (menus.length === 0) {
      return res.status(404).json({ 
        success: false,
        message: 'No menus found for the specified date range' 
      });
    }

    // Get day names for response
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    
    const formattedMenus = menus.map(menu => {
      const menuDate = new Date(menu.date);
      const dayName = days[menuDate.getDay()];
      
      return {
        id: menu._id,
        date: menu.date,
        day: dayName,
        breakfast: menu.breakfast,
        lunch: menu.lunch,
        dinner: menu.dinner,
        addedBy: menu.addedBy,
        createdAt: menu.createdAt,
        updatedAt: menu.updatedAt
      };
    });

    res.json({
      success: true,
      totalMenus: formattedMenus.length,
      menus: formattedMenus,
      dateRange: startDate && endDate ? {
        from: new Date(startDate),
        to: new Date(endDate)
      } : {
        from: menus[0].date,
        to: menus[menus.length - 1].date
      }
    });
  } catch (error) {
    console.error('Admin menu all error:', error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
});

// Debug route to get all menus in database (Admin only)
router.get('/menu/debug', adminAuth, async (req, res) => {
  try {
    const allMenus = await Menu.find({}).sort({ date: 1 });
    
    console.log('Admin menu debug - Total menus in DB:', allMenus.length);
    console.log('Admin menu debug - All menu dates:', allMenus.map(m => m.date));
    
    res.json({
      success: true,
      totalMenus: allMenus.length,
      menus: allMenus.map(menu => ({
        id: menu._id,
        date: menu.date,
        breakfast: menu.breakfast,
        lunch: menu.lunch,
        dinner: menu.dinner,
        addedBy: menu.addedBy,
        createdAt: menu.createdAt,
        updatedAt: menu.updatedAt
      }))
    });
  } catch (error) {
    console.error('Admin menu debug error:', error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
});

// Get detailed department bills with individual meetings/programs
router.get('/department-bills-detailed', adminAuth, async (req, res) => {
  try {
    const { startDate, endDate, department } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ 
        message: 'Both startDate and endDate parameters are required' 
      });
    }

    // Create date range
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    // Build department filter if provided
    let departmentFilter = {};
    if (department) {
      let departmentDoc;
      if (mongoose.Types.ObjectId.isValid(department)) {
        departmentDoc = await Department.findById(department);
      } else {
        departmentDoc = await Department.findOne({ title: department.trim() });
      }
      if (departmentDoc) {
        departmentFilter.department = departmentDoc._id;
      }
    }

    const departments = [];

    // Get all departments
    const allDepartments = await Department.find(departmentFilter).sort({ title: 1 });

    for (const dept of allDepartments) {
      const departmentData = {
        department: dept.title,
        meetings: [],
        guestMeals: [],
        foodShare: 0,
        totalRentAmount: 0,
        totalMeetingFoodAmount: 0,
        totalGuestMealAmount: 0,
        totalAmount: 0
      };

      // 1. Get individual meetings for this department
      const meetings = await Meeting.find({
        department: dept._id,
        status: 'approved',
        startDatetime: { $gte: start, $lte: end }
      }).sort({ startDatetime: 1 });

      // Process each meeting
      for (const meeting of meetings) {
        const rentAmount = meeting.rent || 0; // Use dynamic rent from meeting record
        const meetingFoodAmount = (
          (meeting.breakfast || 0) * 40 + // Using default rates, will be calculated in frontend
          (meeting.lunch || 0) * 80 +
          (meeting.dinner || 0) * 40 +
          (meeting.morningSnacksCount || 0) * 12 +
          (meeting.morningTeaCount || 0) * 12 +
          (meeting.eveningSnacksCount || 0) * 12 +
          (meeting.eveningTeaCount || 0) * 12
        );

        departmentData.meetings.push({
          id: meeting._id,
          title: meeting.title,
          description: meeting.description,
          startDatetime: meeting.startDatetime,
          endDatetime: meeting.endDatetime,
          hall: meeting.hall,
          rent: meeting.rent,
          noOfPersons: meeting.noOfPersons,
          foodRequired: meeting.foodRequired,
          foodCounts: {
            breakfast: meeting.breakfast || 0,
            lunch: meeting.lunch || 0,
            dinner: meeting.dinner || 0,
            morningSnacksCount: meeting.morningSnacksCount || 0,
            morningTeaCount: meeting.morningTeaCount || 0,
            eveningSnacksCount: meeting.eveningSnacksCount || 0,
            eveningTeaCount: meeting.eveningTeaCount || 0
          },
          rentAmount: rentAmount,
          meetingFoodAmount: meetingFoodAmount,
          totalMeetingAmount: rentAmount + meetingFoodAmount,
          createdBy: meeting.createdBy
        });

        departmentData.totalRentAmount += rentAmount;
        departmentData.totalMeetingFoodAmount += meetingFoodAmount;
      }

      // 2. Get guest meals for this department
      const guestMeals = await GuestMeal.find({
        department: dept._id,
        date: { $gte: start, $lte: end }
      }).sort({ date: 1 });

      for (const guestMeal of guestMeals) {
        const guestMealAmount = (
          (guestMeal.breakfastCount || 0) * 40 + // Using default rates
          (guestMeal.lunchCount || 0) * 80 +
          (guestMeal.dinnerCount || 0) * 40
        );

        departmentData.guestMeals.push({
          id: guestMeal._id,
          date: guestMeal.date,
          description: guestMeal.description || 'Guest Meal',
          breakfastCount: guestMeal.breakfastCount || 0,
          lunchCount: guestMeal.lunchCount || 0,
          dinnerCount: guestMeal.dinnerCount || 0,
          amount: guestMealAmount,
          addedBy: guestMeal.addedBy
        });

        departmentData.totalGuestMealAmount += guestMealAmount;
      }

      // 3. Calculate food share (75% department share for regular food)
      const userResponse = await Meal.aggregate([
        {
          $match: {
            date: { $gte: start, $lte: end }
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: 'userId',
            foreignField: '_id',
            as: 'user'
          }
        },
        {
          $unwind: '$user'
        },
        {
          $match: {
            'user.department': dept._id,
            'user.isFreeFood': { $ne: true }
          }
        },
        {
          $group: {
            _id: '$user._id',
            user: { $first: '$user' },
            breakfastCount: {
              $sum: { $cond: [{ $eq: ['$breakfast', true] }, 1, 0] }
            },
            lunchCount: {
              $sum: { $cond: [{ $eq: ['$lunch', true] }, 1, 0] }
            },
            dinnerCount: {
              $sum: { $cond: [{ $eq: ['$dinner', true] }, 1, 0] }
            }
          }
        }
      ]);

      let foodDeptShare = 0;
      for (const userMeal of userResponse) {
        const userTotal = (
          (userMeal.breakfastCount || 0) * 40 +
          (userMeal.lunchCount || 0) * 80 +
          (userMeal.dinnerCount || 0) * 40
        );

        // Use intern logic: 100% dept share for interns, department-specific % for others
        const isIntern = userMeal.user.isIntern === true;
        const deptShare = isIntern ? 100 : getDepartmentShareForDept(dept.title, 75);
        const userDeptAmount = (userTotal * deptShare) / 100;
        foodDeptShare += userDeptAmount;
      }

      departmentData.foodShare = foodDeptShare;

      // Calculate total amount
      departmentData.totalAmount = 
        departmentData.foodShare + 
        departmentData.totalRentAmount + 
        departmentData.totalMeetingFoodAmount + 
        departmentData.totalGuestMealAmount;

      // Only include departments that have some activity
      if (departmentData.meetings.length > 0 || 
          departmentData.guestMeals.length > 0 || 
          departmentData.foodShare > 0) {
        departments.push(departmentData);
      }
    }

    res.json({
      dateRange: { from: start, to: end },
      departments: departments
    });

  } catch (error) {
    console.error('Error fetching detailed department bills:', error);
    res.status(500).json({ 
      message: 'Failed to fetch detailed department bills',
      error: error.message 
    });
  }
});

// Helper function to get rent amount by venue
function getRentAmountByVenue(venue) {
  const rentRates = {
    'Auditorium [2nd Floor]': 2000,
    'Conference Hall [3rd Floor]': 1500,
    'Meeting Space [1st Floor]': 1000
  };
  return rentRates[venue] || 0;
}

// Helper function to get department share percentage
function getDepartmentShareForDept(departmentName, defaultShare) {
  if (!departmentName) return defaultShare;
  
  const deptName = departmentName.toLowerCase().trim();
  
  // GIO and Solidarity departments: 0% department share (employees pay 100%)
  if (deptName === 'gio' || deptName === 'solidarity') {
    return 0;
  }
  
  return defaultShare;
}


router.post('/vehicles', adminAuth, async (req, res) => {
  try {
    const { vehicleName, vehicleNumber } = req.body;

    // Create new vehicle
    const vehicle = new Vehicle({
      vehicleName,
      vehicleNumber
    });

    // Save vehicle to database
    await vehicle.save();

    res.status(201).json({
      message: 'Vehicle added successfully',
      vehicle
    });
  } catch (error) {
    res.status(400).json({
      message: 'Error adding vehicle',
      error: error.message
    });
  }
});



router.get('/travel/all', adminAuth, async (req, res) => {
  try {
    const travels = await Travel.find().populate('user').populate('vehicle');
    res.json(travels);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router; 