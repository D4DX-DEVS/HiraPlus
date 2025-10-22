const express = require('express');
const router = express.Router();
const Department = require('../models/Department');
const adminAuth = require('../middleware/adminAuth');

// GET all departments (Public)
router.get('/', async (req, res) => {
  try {
    const departments = await Department.find()
      .select('_id title isHierarchical subDepartments allowInterns internDepartmentShare createdAt updatedAt')
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

// GET hierarchical departments (Public)
router.get('/hierarchical', async (req, res) => {
  try {
    const hierarchicalDepartments = await Department.find({ isHierarchical: true })
      .select('_id title subDepartments')
      .sort({ title: 1 });

    res.json({
      success: true,
      departments: hierarchicalDepartments,
      total: hierarchicalDepartments.length
    });
  } catch (error) {
    console.error('Get hierarchical departments error:', error);
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
    const { title, isHierarchical, allowInterns, internDepartmentShare } = req.body;

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
      title: title.trim(),
      isHierarchical: isHierarchical || false,
      subDepartments: [],
      allowInterns: allowInterns || false,
      internDepartmentShare: internDepartmentShare || 75
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

// ADD sub-department to any hierarchical department (Admin only)
router.post('/:id/sub-departments', adminAuth, async (req, res) => {
  try {
    const { title, description } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Sub-department title is required'
      });
    }

    // Find the department
    const department = await Department.findById(req.params.id);
    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Department not found'
      });
    }

    // Check if department is hierarchical
    if (!department.isHierarchical) {
      return res.status(400).json({
        success: false,
        message: 'This department is not configured to have sub-departments'
      });
    }

    // Check if sub-department already exists
    const existingSubDept = department.subDepartments.find(
      sub => sub.title.toLowerCase() === title.trim().toLowerCase()
    );

    if (existingSubDept) {
      return res.status(400).json({
        success: false,
        message: 'Sub-department with this title already exists'
      });
    }

    // Add new sub-department
    department.subDepartments.push({
      title: title.trim(),
      description: description || null,
      isActive: true
    });

    await department.save();

    res.status(201).json({
      success: true,
      message: 'Sub-department added successfully',
      subDepartments: department.subDepartments
    });
  } catch (error) {
    console.error('Add sub-department error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// UPDATE sub-department in any hierarchical department (Admin only)
router.put('/:id/sub-departments/:subDeptId', adminAuth, async (req, res) => {
  try {
    const { title, description, isActive } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Sub-department title is required'
      });
    }

    // Find the department
    const department = await Department.findById(req.params.id);
    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Department not found'
      });
    }

    // Check if department is hierarchical
    if (!department.isHierarchical) {
      return res.status(400).json({
        success: false,
        message: 'This department is not configured to have sub-departments'
      });
    }

    // Find and update sub-department
    const subDeptIndex = department.subDepartments.findIndex(
      sub => sub._id.toString() === req.params.subDeptId
    );

    if (subDeptIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Sub-department not found'
      });
    }

    // Check if title is unique (excluding current sub-department)
    const existingSubDept = department.subDepartments.find(
      (sub, index) => 
        index !== subDeptIndex && 
        sub.title.toLowerCase() === title.trim().toLowerCase()
    );

    if (existingSubDept) {
      return res.status(400).json({
        success: false,
        message: 'Another sub-department with this title already exists'
      });
    }

    // Update sub-department
    department.subDepartments[subDeptIndex] = {
      ...department.subDepartments[subDeptIndex],
      title: title.trim(),
      description: description || null,
      isActive: isActive !== undefined ? isActive : department.subDepartments[subDeptIndex].isActive
    };

    await department.save();

    res.json({
      success: true,
      message: 'Sub-department updated successfully',
      subDepartments: department.subDepartments
    });
  } catch (error) {
    console.error('Update sub-department error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// DELETE sub-department from any hierarchical department (Admin only)
router.delete('/:id/sub-departments/:subDeptId', adminAuth, async (req, res) => {
  try {
    // Find the department
    const department = await Department.findById(req.params.id);
    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Department not found'
      });
    }

    // Check if department is hierarchical
    if (!department.isHierarchical) {
      return res.status(400).json({
        success: false,
        message: 'This department is not configured to have sub-departments'
      });
    }

    // Remove sub-department
    department.subDepartments = department.subDepartments.filter(
      sub => sub._id.toString() !== req.params.subDeptId
    );

    await department.save();

    res.json({
      success: true,
      message: 'Sub-department deleted successfully',
      subDepartments: department.subDepartments
    });
  } catch (error) {
    console.error('Delete sub-department error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// UPDATE department (Admin only)
router.put('/:id', adminAuth, async (req, res) => {
  try {
    const { title, isHierarchical, allowInterns, internDepartmentShare } = req.body;

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
    department.isHierarchical = isHierarchical !== undefined ? isHierarchical : department.isHierarchical;
    department.allowInterns = allowInterns !== undefined ? allowInterns : department.allowInterns;
    department.internDepartmentShare = internDepartmentShare !== undefined ? internDepartmentShare : department.internDepartmentShare;

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

    // Prevent deletion of hierarchical department if it has sub-departments
    if (department.isHierarchical && department.subDepartments.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete hierarchical department that has sub-departments. Please delete sub-departments first.'
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