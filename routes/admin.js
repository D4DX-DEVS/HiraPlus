const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Meal = require('../models/Meal');
const Notification = require('../models/Notification');
const jwt = require('jsonwebtoken');
const adminAuth = require('../middleware/adminAuth');

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
    let { phoneNumber } = req.body;

    // Clean and validate phone number
    phoneNumber = String(phoneNumber).trim().replace('+91', '').replace(/\D/g, '');
    
    if (phoneNumber.length !== 10) {
      return res.status(400).json({ message: 'Please provide a valid 10-digit phone number' });
    }

    const existingUser = await User.findOne({ phoneNumber });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = new User({ phoneNumber });
    await user.save();

    res.status(201).json({ 
      message: 'User added successfully',
      user: {
        id: user._id,
        phoneNumber: user.phoneNumber
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Admin: Get all users
router.get('/users', adminAuth, async (req, res) => {
  try {
    const users = await User.find({}, { phoneNumber: 1, isVerified: 1 });
    res.json(users);
  } catch (error) {
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

// Admin: Get users with their meals
router.get('/users/meals', adminAuth, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    // Get all users
    const users = await User.find({}, { phoneNumber: 1, isVerified: 1 });
    
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

module.exports = router; 