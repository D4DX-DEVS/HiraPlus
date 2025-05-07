const express = require('express');
const router = express.Router();
const Meal = require('../models/Meal');
const auth = require('../middleware/auth');

// Get user's meals for a date range
router.get('/my-meals', auth, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const query = { userId: req.user.id };
    
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const meals = await Meal.find(query).sort({ date: 1 });
    res.json(meals);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Mark meals for a specific date
router.post('/mark', auth, async (req, res) => {
  try {
    const { date, breakfast, lunch, dinner } = req.body;
    
    const meal = await Meal.findOneAndUpdate(
      { userId: req.user.id, date: new Date(date) },
      { breakfast, lunch, dinner },
      { new: true, upsert: true }
    );

    res.json(meal);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update meal selection
router.put('/:id', auth, async (req, res) => {
  try {
    const { breakfast, lunch, dinner } = req.body;
    
    const meal = await Meal.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!meal) {
      return res.status(404).json({ message: 'Meal not found' });
    }

    meal.breakfast = breakfast;
    meal.lunch = lunch;
    meal.dinner = dinner;
    await meal.save();

    res.json(meal);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete meal selection
router.delete('/:id', auth, async (req, res) => {
  try {
    const meal = await Meal.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!meal) {
      return res.status(404).json({ message: 'Meal not found' });
    }

    res.json({ message: 'Meal selection deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router; 