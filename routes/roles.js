const express = require('express');
const router = express.Router();
const Role = require('../models/Roles');
const adminAuth = require('../middleware/adminAuth');
const generalSecretaryAuth = require('../middleware/generalSecretaryAuth');

// Middleware to allow both admin and general secretary access
const adminOrGeneralSecretaryAuth = async (req, res, next) => {
  try {
    // Try admin authentication first
    await new Promise((resolve, reject) => {
      adminAuth(req, res, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    next();
  } catch (adminError) {
    // If admin auth fails, try general secretary auth
    try {
      await new Promise((resolve, reject) => {
        generalSecretaryAuth(req, res, (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
      next();
    } catch (generalSecretaryError) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only admin or general secretary can perform this action.'
      });
    }
  }
};

// Get all roles
router.get('/', adminOrGeneralSecretaryAuth, async (req, res) => {
  try {
    const roles = await Role.find().sort({ name: 1 });
    
    res.json({
      success: true,
      roles: roles.map(role => ({
        id: role._id,
        name: role.name,
        createdAt: role.createdAt,
        updatedAt: role.updatedAt
      }))
    });
  } catch (error) {
    console.error('Get roles error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get role by ID
router.get('/:id', adminOrGeneralSecretaryAuth, async (req, res) => {
  try {
    const role = await Role.findById(req.params.id);
    
    if (!role) {
      return res.status(404).json({
        success: false,
        message: 'Role not found'
      });
    }

    res.json({
      success: true,
      role: {
        id: role._id,
        name: role.name,
        createdAt: role.createdAt,
        updatedAt: role.updatedAt
      }
    });
  } catch (error) {
    console.error('Get role error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Create new role
router.post('/', adminOrGeneralSecretaryAuth, async (req, res) => {
  try {
    const { name } = req.body;

    // Validate required fields
    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Role name is required'
      });
    }

    // Check if role already exists
    const existingRole = await Role.findOne({ 
      name: { $regex: new RegExp(`^${name.trim()}$`, 'i') } 
    });
    
    if (existingRole) {
      return res.status(409).json({
        success: false,
        message: 'Role with this name already exists'
      });
    }

    // Create new role
    const role = new Role({
      name: name.trim()
    });

    await role.save();

    res.status(201).json({
      success: true,
      message: 'Role created successfully',
      role: {
        id: role._id,
        name: role.name,
        createdAt: role.createdAt,
        updatedAt: role.updatedAt
      }
    });
  } catch (error) {
    console.error('Create role error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Update role
router.put('/:id', adminOrGeneralSecretaryAuth, async (req, res) => {
  try {
    const { name } = req.body;

    // Validate required fields
    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Role name is required'
      });
    }

    // Check if role exists
    const role = await Role.findById(req.params.id);
    if (!role) {
      return res.status(404).json({
        success: false,
        message: 'Role not found'
      });
    }

    // Check if another role with the same name exists
    const existingRole = await Role.findOne({ 
      _id: { $ne: req.params.id },
      name: { $regex: new RegExp(`^${name.trim()}$`, 'i') } 
    });
    
    if (existingRole) {
      return res.status(409).json({
        success: false,
        message: 'Role with this name already exists'
      });
    }

    // Update role
    role.name = name.trim();
    await role.save();

    res.json({
      success: true,
      message: 'Role updated successfully',
      role: {
        id: role._id,
        name: role.name,
        createdAt: role.createdAt,
        updatedAt: role.updatedAt
      }
    });
  } catch (error) {
    console.error('Update role error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Delete role
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const role = await Role.findById(req.params.id);
    
    if (!role) {
      return res.status(404).json({
        success: false,
        message: 'Role not found'
      });
    }

    // Check if role is being used by any users
    const User = require('../models/User');
    const usersWithRole = await User.find({ role: role._id });
    
    if (usersWithRole.length > 0) {
      return res.status(409).json({
        success: false,
        message: `Cannot delete role. It is currently assigned to ${usersWithRole.length} user(s)`,
        usersCount: usersWithRole.length
      });
    }

    await Role.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Role deleted successfully'
    });
  } catch (error) {
    console.error('Delete role error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});
 
module.exports = router;
