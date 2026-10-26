const express = require('express');
const router = express.Router();
const Tag = require('../models/Tags');
const adminAuth = require('../middleware/adminAuth');

// GET all tags
router.get('/', async (req, res) => {
  try {
    const tags = await Tag.find().sort({ createdAt: -1 });
    res.json(tags);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching tags', error: error.message });
  }
});

// GET single tag by ID
router.get('/:id', async (req, res) => {
  try {
    const tag = await Tag.findById(req.params.id);
    if (!tag) {
      return res.status(404).json({ message: 'Tag not found' });
    }
    res.json(tag);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching tag', error: error.message });
  }
});

// POST create new tag (Admin only)
router.post('/', adminAuth, async (req, res) => {
  try {
    const { tagName } = req.body;
    
    if (!tagName || tagName.trim() === '') {
      return res.status(400).json({ message: 'Tag name is required' });
    }

    // Check if tag already exists
    const existingTag = await Tag.findOne({ tagName: tagName.trim() });
    if (existingTag) {
      return res.status(400).json({ message: 'Tag already exists' });
    }

    const tag = new Tag({
      tagName: tagName.trim()
    });

    const savedTag = await tag.save();
    res.status(201).json(savedTag);
  } catch (error) {
    res.status(500).json({ message: 'Error creating tag', error: error.message });
  }
});

// PUT update tag (Admin only)
router.put('/:id', adminAuth, async (req, res) => {
  try {
    const { tagName } = req.body;
    
    if (!tagName || tagName.trim() === '') {
      return res.status(400).json({ message: 'Tag name is required' });
    }

    // Check if tag exists
    const existingTag = await Tag.findById(req.params.id);
    if (!existingTag) {
      return res.status(404).json({ message: 'Tag not found' });
    }

    // Check if new name already exists (excluding current tag)
    const duplicateTag = await Tag.findOne({ 
      tagName: tagName.trim(), 
      _id: { $ne: req.params.id } 
    });
    if (duplicateTag) {
      return res.status(400).json({ message: 'Tag name already exists' });
    }

    const updatedTag = await Tag.findByIdAndUpdate(
      req.params.id,
      { tagName: tagName.trim() },
      { new: true, runValidators: true }
    );

    res.json(updatedTag);
  } catch (error) {
    res.status(500).json({ message: 'Error updating tag', error: error.message });
  }
});

// DELETE tag (Admin only)
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const tag = await Tag.findById(req.params.id);
    if (!tag) {
      return res.status(404).json({ message: 'Tag not found' });
    }

    await Tag.findByIdAndDelete(req.params.id);
    res.json({ message: 'Tag deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting tag', error: error.message });
  }
});

module.exports = router;
