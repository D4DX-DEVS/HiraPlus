const express = require('express');
const router = express.Router();
const CustomTag = require('../models/CustomTag');
const { leaderOrSuperLeaderAuth } = require('../middleware/leaderAuth');

// POST /api/custom-tags - Create custom tag
router.post('/', leaderOrSuperLeaderAuth, async (req, res) => {
  try {
    const { name, participants } = req.body;
    
    // Validation
    if (!name || name.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Tag name is required'
      });
    }

    if (!participants || !Array.isArray(participants)) {
      return res.status(400).json({
        success: false,
        message: 'Participants must be an array'
      });
    }

    // Check if tag name already exists for this user
    const existingTag = await CustomTag.findOne({
      name: name.trim(),
      createdBy: req.user.id
    });

    if (existingTag) {
      return res.status(400).json({
        success: false,
        message: 'A tag with this name already exists'
      });
    }

    // Create new custom tag
    const customTag = new CustomTag({
      name: name.trim(),
      createdBy: req.user.id,
      participants: participants
    });

    const savedTag = await customTag.save();
    
    // Populate participants for response
    const populatedTag = await CustomTag.findById(savedTag._id)
      .populate('participants', 'name phoneNumber role department')
      .populate('createdBy', 'name');

    res.status(201).json({
      success: true,
      data: populatedTag,
      message: 'Custom tag created successfully'
    });

  } catch (error) {
    console.error('Error creating custom tag:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating custom tag',
      error: error.message
    });
  }
});

// GET /api/custom-tags - Get user's custom tags
router.get('/', leaderOrSuperLeaderAuth, async (req, res) => {
  try {
    const customTags = await CustomTag.find({ createdBy: req.user.id })
      .populate('participants', 'name phoneNumber role department')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: customTags,
      count: customTags.length
    });

  } catch (error) {
    console.error('Error fetching custom tags:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching custom tags',
      error: error.message
    });
  }
});

// GET /api/custom-tags/:id - Get specific custom tag
router.get('/:id', leaderOrSuperLeaderAuth, async (req, res) => {
  try {
    const { id } = req.params;

    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid tag ID'
      });
    }

    const customTag = await CustomTag.findOne({
      _id: id,
      createdBy: req.user.id
    })
    .populate('participants', 'name phoneNumber role department')
    .populate('createdBy', 'name');

    if (!customTag) {
      return res.status(404).json({
        success: false,
        message: 'Custom tag not found'
      });
    }

    res.json({
      success: true,
      data: customTag
    });

  } catch (error) {
    console.error('Error fetching custom tag:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching custom tag',
      error: error.message
    });
  }
});

// PUT /api/custom-tags/:id - Update custom tag
router.put('/:id', leaderOrSuperLeaderAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, participants } = req.body;

    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid tag ID'
      });
    }

    // Validation
    if (!name || name.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Tag name is required'
      });
    }

    if (!participants || !Array.isArray(participants)) {
      return res.status(400).json({
        success: false,
        message: 'Participants must be an array'
      });
    }

    // Check if tag exists and user owns it
    const existingTag = await CustomTag.findOne({
      _id: id,
      createdBy: req.user.id
    });

    if (!existingTag) {
      return res.status(404).json({
        success: false,
        message: 'Custom tag not found'
      });
    }

    // Check if new name conflicts with another tag (excluding current tag)
    const nameConflict = await CustomTag.findOne({
      name: name.trim(),
      createdBy: req.user.id,
      _id: { $ne: id }
    });

    if (nameConflict) {
      return res.status(400).json({
        success: false,
        message: 'A tag with this name already exists'
      });
    }

    // Update the tag
    const updatedTag = await CustomTag.findByIdAndUpdate(
      id,
      { 
        name: name.trim(),
        participants: participants
      },
      { new: true, runValidators: true }
    )
    .populate('participants', 'name phoneNumber role department')
    .populate('createdBy', 'name');

    res.json({
      success: true,
      data: updatedTag,
      message: 'Custom tag updated successfully'
    });

  } catch (error) {
    console.error('Error updating custom tag:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating custom tag',
      error: error.message
    });
  }
});

// DELETE /api/custom-tags/:id - Delete custom tag
router.delete('/:id', leaderOrSuperLeaderAuth, async (req, res) => {
  try {
    const { id } = req.params;

    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid tag ID'
      });
    }

    // Check if tag exists and user owns it
    const customTag = await CustomTag.findOne({
      _id: id,
      createdBy: req.user.id
    });

    if (!customTag) {
      return res.status(404).json({
        success: false,
        message: 'Custom tag not found'
      });
    }

    // Delete the tag
    await CustomTag.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Custom tag deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting custom tag:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting custom tag',
      error: error.message
    });
  }
});

module.exports = router;
