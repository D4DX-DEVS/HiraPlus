const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const generalSecretaryAuth = require('../middleware/generalSecretaryAuth');
const User = require('../models/User');
const Role = require('../models/Roles');

// General Secretary Login Route
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validate input
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username and password are required'
      });
    }

    // Check credentials against environment variables
    const validUsername = process.env.GENERAL_SECRETARY_USERNAME;
    const validPassword = process.env.GENERAL_SECRETARY_PASSWORD;

    if (!validUsername || !validPassword) {
      return res.status(500).json({
        success: false,
        message: 'Server configuration error'
      });
    }

    // Verify credentials
    if (username !== validUsername || password !== validPassword) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Generate JWT token with general secretary role
    const token = jwt.sign(
      { role: 'general secretary' },
      process.env.JWT_SECRET
    );

    res.json({
      success: true,
      message: 'General Secretary login successful',
      token
    });
  } catch (error) {
    console.error('General Secretary login error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Create user (only leader and super leader roles)
router.post('/users', generalSecretaryAuth, async (req, res) => {
  try {
    const { name, phoneNumber, department, designation, role, isDeptHead, isFreeFood, isIntern, tags } = req.body;

    // Validate required fields
    if (!name || !phoneNumber || !department || !designation || !role) {
      return res.status(400).json({
        success: false,
        message: 'Name, phone number, department, designation, and role are required'
      });
    }

    // Validate role - only allow leader and super leader
    if (role !== 'leader' && role !== 'super leader') {
      return res.status(400).json({
        success: false,
        message: 'Only leader and super leader roles are allowed'
      });
    }

    // Find role by name to get the ObjectId
    const roleDoc = await Role.findOne({ name: role });
    if (!roleDoc) {
      return res.status(400).json({
        success: false,
        message: `Role '${role}' not found in database`
      });
    }

    // Check if phone number already exists
    const existingUser = await User.findOne({ phoneNumber });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Phone number already exists'
      });
    }

    // Process tags - ensure it's an array of ObjectIds
    let processedTags = [];
    if (tags && Array.isArray(tags)) {
      processedTags = tags;
    } else if (tags && typeof tags === 'string') {
      // If tags is a string, try to parse it as JSON array
      try {
        processedTags = JSON.parse(tags);
      } catch (e) {
        processedTags = [];
      }
    }

    // Create new user
    const user = new User({
      name,
      phoneNumber,
      department,
      designation,
      role: roleDoc._id, // Use the ObjectId from the role document
      isDeptHead: isDeptHead || false,
      isFreeFood: isFreeFood || false,
      isIntern: isIntern || false,
      status: 'active',
      isVerified: false,
      tags: processedTags
    });

    await user.save();

    // Populate the created user with department, role, and tags
    const populatedUser = await User.findById(user._id)
      .populate('department', 'title')
      .populate('role', 'name')
      .populate('tags', 'tagName')
      .select('-__v');

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: populatedUser
    });
  } catch (error) {
    console.error('Create user error:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Phone number already exists'
      });
    }
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get all users
router.get('/users', generalSecretaryAuth, async (req, res) => {
  try {
    const users = await User.find({})
      .populate('department', 'title')
      .populate('role', 'name')
      .populate('tags', 'tagName')
      .select('-__v')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: users,
      count: users.length
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get single user by ID
router.get('/users/:id', generalSecretaryAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id)
      .populate('department', 'title')
      .populate('role', 'name')
      .populate('tags', 'tagName')
      .select('-__v');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Get user by ID error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID format'
      });
    }
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Update user by ID
router.put('/users/:id', generalSecretaryAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Remove fields that shouldn't be updated directly
    delete updateData._id;
    delete updateData.__v;
    delete updateData.createdAt;

    const user = await User.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    )
      .populate('department', 'title')
      .populate('role', 'name')
      .populate('tags', 'tagName')
      .select('-__v');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'User updated successfully',
      data: user
    });
  } catch (error) {
    console.error('Update user error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID format'
      });
    }
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Delete user by ID
router.delete('/users/:id', generalSecretaryAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByIdAndDelete(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'User deleted successfully',
      data: {
        id: user._id,
        name: user.name,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Delete user error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID format'
      });
    }
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;
