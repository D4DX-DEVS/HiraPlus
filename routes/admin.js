const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Meal = require('../models/Meal');
const Notification = require('../models/Notification');
const Message = require('../models/Message');
const jwt = require('jsonwebtoken');
const adminAuth = require('../middleware/adminAuth');
const axios = require('axios');

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
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ token });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Admin: Add user
router.post('/users', adminAuth, async (req, res) => {
  try {
    let { phoneNumber, name, department, designation } = req.body;

    // Validate all required fields are present and not empty
    if (!phoneNumber || !name || !department || !designation) {
      return res.status(400).json({ 
        message: 'All fields (name, phone number, department, and designation) are required' 
      });
    }

    // Clean and trim all fields
    name = name.trim();
    department = department.trim();
    designation = designation.trim();
    phoneNumber = String(phoneNumber).trim().replace('+91', '').replace(/\D/g, '');

    // Validate all fields have content after trimming
    if (!name || !department || !designation) {
      return res.status(400).json({ 
        message: 'Name, department, and designation cannot be empty' 
      });
    }
    
    if (phoneNumber.length !== 10) {
      return res.status(400).json({ 
        message: 'Please provide a valid 10-digit phone number' 
      });
    }

    const existingUser = await User.findOne({ phoneNumber });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = new User({ 
      phoneNumber,
      name,
      department,
      designation
    });
    await user.save();

    res.status(201).json({ 
      message: 'User added successfully',
      user: {
        id: user._id,
        name: user.name,
        phoneNumber: user.phoneNumber,
        department: user.department,
        designation: user.designation
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
      .select('name phoneNumber department designation isVerified createdAt')
      .sort({ createdAt: -1 });

    // Map the users to ensure all fields are present
    const mappedUsers = users.map(user => ({
      _id: user._id,
      name: user.name || '',
      phoneNumber: user.phoneNumber,
      department: user.department || '',
      designation: user.designation || '',
      isVerified: user.isVerified,
      createdAt: user.createdAt
    }));

    res.json(mappedUsers);
  } catch (error) {
    console.error('Fetch users error:', error);
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
    let { name, department, designation, phoneNumber } = req.body;

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
    if (department) user.department = department.trim();
    if (designation) user.designation = designation.trim();

    // Validate that required fields are not empty after trimming
    if (user.name && !user.name.trim()) {
      return res.status(400).json({ message: 'Name cannot be empty' });
    }
    if (user.department && !user.department.trim()) {
      return res.status(400).json({ message: 'Department cannot be empty' });
    }
    if (user.designation && !user.designation.trim()) {
      return res.status(400).json({ message: 'Designation cannot be empty' });
    }

    await user.save();

    res.json({
      message: 'User updated successfully',
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
      designation: 1 
    });
    
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
        meals: meals
      };
    }));

    res.json(usersWithMeals);
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
    res.status(201).json({
      message: 'Notification created successfully',
      notification
    });
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
    }).populate('userId', 'name phoneNumber department designation');

    // Format the response
    const usersWithMeals = meals.map(meal => ({
      userId: meal.userId._id,
      name: meal.userId.name,
      phoneNumber: meal.userId.phoneNumber,
      department: meal.userId.department,
      designation: meal.userId.designation,
      date: meal.date
    }));

    res.json(usersWithMeals);
  } catch (error) {
    res.status(500).json({ message: error.message });
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

module.exports = router; 