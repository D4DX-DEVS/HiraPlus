const express = require('express');
const router = express.Router();
const Department = require('../models/Department');
const adminAuth = require('../middleware/adminAuth');

// GET all departments (Public)
router.get('/', async (req, res) => {
  try {
    const departments = await Department.find()
      .select('title')
      .sort({ title: 1 });

    res.json({
      success: true,
      departments,
      total: departments.length
    });
  } catch (error) {
    console.error('Get departments error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// GET department by ID (Public)
router.get('/:id', async (req, res) => {
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
router.post('/', adminAuth, async (req, res) => {
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
router.put('/:id', adminAuth, async (req, res) => {
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
router.delete('/:id', adminAuth, async (req, res) => {
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

module.exports = router; 