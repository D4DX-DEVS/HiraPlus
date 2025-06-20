const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Department = require('../models/Department');
const Meal = require('../models/Meal');
const Notification = require('../models/Notification');
const Message = require('../models/Message');
const GuestMeal = require('../models/GuestMeal');
const jwt = require('jsonwebtoken');
const adminAuth = require('../middleware/adminAuth');
const axios = require('axios');
const mongoose = require('mongoose');
const Meeting = require('../models/Meeting');
const { sendPushNotification } = require('../utils/oneSignalService');

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
    let { phoneNumber, name, department, designation, isDeptHead, status } = req.body;

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
    } else {
      departmentDoc = await Department.findOne({ title: department.trim() });
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
      status: status || 'active'
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
        status: user.status
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
      .select('name phoneNumber department designation isVerified isDeptHead status createdAt')
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
    let { name, department, designation, phoneNumber, isDeptHead, status } = req.body;

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
      } else {
        departmentDoc = await Department.findOne({ title: department.trim() });
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
        status: user.status
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
      updatedAt: user.updatedAt
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid user ID format' });
    }
    console.error('Fetch single user error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Admin: Get user-wise meal counts for a date range
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
      hall, noOfPersons, hiraStaff, guests, foodRequired, breakfast,
      morningSnacksCount, morningTeaCount, lunch,
      eveningSnacksCount, eveningTeaCount, dinner,
      department
    } = req.body;

    // Validate required fields
    if (!title || !description || !startDatetime || !endDatetime || !hall || !department) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: title, description, startDatetime, endDatetime, hall, and department'
      });
    }

    // Validate numeric fields (allow 0 but not undefined/null)
    if (typeof noOfPersons === 'undefined' || typeof hiraStaff === 'undefined' || typeof guests === 'undefined') {
      return res.status(400).json({
        success: false,
        message: 'Please provide noOfPersons, hiraStaff, and guests'
      });
    }

    // Convert to numbers
    const numPersons = parseInt(noOfPersons);
    const numHiraStaff = parseInt(hiraStaff);
    const numGuests = parseInt(guests);

    // Validate minimum values
    if (numPersons < 1) {
      return res.status(400).json({
        success: false,
        message: 'Number of persons must be at least 1'
      });
    }

    // Validate that total persons equals sum of hiraStaff and guests
    if (numHiraStaff + numGuests !== numPersons) {
      return res.status(400).json({
        success: false,
        message: 'Total number of persons must equal sum of HIRA staff and guests'
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

    const meeting = new Meeting({
      title: title.trim(),
      description: description.trim(),
      startDatetime: new Date(startDatetime),
      endDatetime: new Date(endDatetime),
      hall,
      noOfPersons: numPersons,
      hiraStaff: numHiraStaff,
      guests: numGuests,
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
      hall, noOfPersons, hiraStaff, guests, foodRequired, breakfast,
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
      } else {
        departmentDoc = await Department.findOne({ title: department.trim() });
      }

      if (!departmentDoc) {
        return res.status(400).json({
          success: false,
          message: 'Invalid department. Please select a valid department.'
        });
      }
      meeting.department = departmentDoc._id;
    }

    // Update fields if provided
    if (title) meeting.title = title.trim();
    if (description) meeting.description = description.trim();
    if (startDatetime) meeting.startDatetime = new Date(startDatetime);
    if (endDatetime) meeting.endDatetime = new Date(endDatetime);
    if (hall) meeting.hall = hall;
    
    // Handle numeric fields with proper parsing
    if (typeof noOfPersons !== 'undefined') meeting.noOfPersons = parseInt(noOfPersons);
    if (typeof hiraStaff !== 'undefined') meeting.hiraStaff = parseInt(hiraStaff);
    if (typeof guests !== 'undefined') meeting.guests = parseInt(guests);
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

    // Validate that total persons equals sum of hiraStaff and guests
    const totalHiraStaff = meeting.hiraStaff;
    const totalGuests = meeting.guests;
    const totalPersons = meeting.noOfPersons;
    
    if (totalHiraStaff + totalGuests !== totalPersons) {
      return res.status(400).json({
        success: false,
        message: 'Total number of persons must equal sum of HIRA staff and guests'
      });
    }

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

    // Fetch meetings and group by department with department name lookup
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
          meetingCount: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          department: { $ifNull: ['$departmentTitle', 'Unknown'] },
          meetingCount: 1
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

module.exports = router; 