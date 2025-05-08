const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Meal = require('../models/Meal');
const messStaffAuth = require('../middleware/messStaffAuth');

// Mess Staff Login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (username !== process.env.MESS_STAFF_USERNAME || 
        password !== process.env.MESS_STAFF_PASSWORD) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { isMessStaff: true },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ token });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all meals for today with counts
router.get('/meals/today', messStaffAuth, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const meals = await Meal.find({
      date: {
        $gte: today,
        $lt: tomorrow
      }
    }).populate('userId', 'phoneNumber');

    // Group meals by type (breakfast, lunch, dinner)
    const groupedMeals = {
      breakfast: meals.filter(meal => meal.breakfast),
      lunch: meals.filter(meal => meal.lunch),
      dinner: meals.filter(meal => meal.dinner)
    };

    // Add counts
    const counts = {
      breakfast: groupedMeals.breakfast.length,
      lunch: groupedMeals.lunch.length,
      dinner: groupedMeals.dinner.length,
      total: meals.length
    };

    res.json({
      counts,
      meals: groupedMeals
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get meals by date range with counts
router.get('/meals', messStaffAuth, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const query = {};
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lt: new Date(endDate)
      };
    }

    const meals = await Meal.find(query)
      .populate('userId', 'phoneNumber')
      .sort({ date: 1 });

    // Group meals by date
    const groupedMeals = meals.reduce((acc, meal) => {
      const dateStr = meal.date.toISOString().split('T')[0];
      if (!acc[dateStr]) {
        acc[dateStr] = {
          breakfast: [],
          lunch: [],
          dinner: []
        };
      }
      if (meal.breakfast) acc[dateStr].breakfast.push(meal);
      if (meal.lunch) acc[dateStr].lunch.push(meal);
      if (meal.dinner) acc[dateStr].dinner.push(meal);
      return acc;
    }, {});

    // Add counts for each date
    const mealCounts = {};
    Object.keys(groupedMeals).forEach(date => {
      mealCounts[date] = {
        breakfast: groupedMeals[date].breakfast.length,
        lunch: groupedMeals[date].lunch.length,
        dinner: groupedMeals[date].dinner.length,
        total: groupedMeals[date].breakfast.length + 
               groupedMeals[date].lunch.length + 
               groupedMeals[date].dinner.length
      };
    });

    // Calculate total counts across all dates
    const totalCounts = {
      breakfast: meals.filter(meal => meal.breakfast).length,
      lunch: meals.filter(meal => meal.lunch).length,
      dinner: meals.filter(meal => meal.dinner).length,
      total: meals.length
    };

    res.json({
      totalCounts,
      dailyCounts: mealCounts,
      meals: groupedMeals
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router; 