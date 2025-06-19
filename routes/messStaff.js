const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Meal = require('../models/Meal');
const User = require('../models/User');
const GuestMeal = require('../models/GuestMeal');
const Meeting = require('../models/Meeting');
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

    let meals = await Meal.find({
      date: {
        $gte: today,
        $lt: tomorrow
      }
    }).populate({
      path: 'userId',
      model: 'User'
    });

    // Convert meals to plain objects and restructure
    meals = meals.map(meal => {
      const mealObj = meal.toObject();
      return {
        ...mealObj,
        userId: mealObj.userId ? {
          _id: mealObj.userId._id,
          name: mealObj.userId.name,
          phoneNumber: mealObj.userId.phoneNumber,
          department: mealObj.userId.department,
          designation: mealObj.userId.designation,
          isVerified: mealObj.userId.isVerified
        } : null
      };
    });

    // Group meals by type
    const groupedMeals = {
      breakfast: meals.filter(meal => meal.breakfast && meal.userId),
      lunch: meals.filter(meal => meal.lunch && meal.userId),
      dinner: meals.filter(meal => meal.dinner && meal.userId)
    };

    // Add counts
    const counts = {
      breakfast: groupedMeals.breakfast.length,
      lunch: groupedMeals.lunch.length,
      dinner: groupedMeals.dinner.length,
      total: meals.filter(meal => meal.userId).length
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

    let meals = await Meal.find(query)
      .populate({
        path: 'userId',
        model: 'User'
      })
      .sort({ date: 1 });

    // Convert meals to plain objects and restructure
    meals = meals.map(meal => {
      const mealObj = meal.toObject();
      return {
        ...mealObj,
        userId: mealObj.userId ? {
          _id: mealObj.userId._id,
          name: mealObj.userId.name,
          phoneNumber: mealObj.userId.phoneNumber,
          department: mealObj.userId.department,
          designation: mealObj.userId.designation,
          isVerified: mealObj.userId.isVerified
        } : null
      };
    });

    // Group meals by date
    const groupedMeals = meals.reduce((acc, meal) => {
      if (!meal.userId) return acc; // Skip meals without user

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
    const validMeals = meals.filter(meal => meal.userId);
    const totalCounts = {
      breakfast: validMeals.filter(meal => meal.breakfast).length,
      lunch: validMeals.filter(meal => meal.lunch).length,
      dinner: validMeals.filter(meal => meal.dinner).length,
      total: validMeals.length
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

// Get today's guest meals count
router.get('/guest-meals/today', messStaffAuth, async (req, res) => {
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
    }).populate('addedBy', 'name department');

    // Calculate total counts
    const totalCounts = {
      breakfast: guestMeals.reduce((sum, meal) => sum + (meal.breakfastCount || 0), 0),
      lunch: guestMeals.reduce((sum, meal) => sum + (meal.lunchCount || 0), 0),
      dinner: guestMeals.reduce((sum, meal) => sum + (meal.dinnerCount || 0), 0)
    };

    // Add total count
    totalCounts.total = totalCounts.breakfast + totalCounts.lunch + totalCounts.dinner;

    res.json({
      success: true,
      totalCounts,
      guestMeals
    });
  } catch (error) {
    console.error('Get today guest meals error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get all guest meals with department-wise counts
router.get('/guest-meals', messStaffAuth, async (req, res) => {
  try {
    const guestMeals = await GuestMeal.find()
      .populate('addedBy', 'name department')
      .sort({ date: -1 });

    // Group by date and calculate department-wise counts
    const mealsByDate = guestMeals.reduce((acc, meal) => {
      const dateStr = meal.date.toISOString().split('T')[0];
      
      if (!acc[dateStr]) {
        acc[dateStr] = {
          date: meal.date,
          departments: {},
          totalCounts: {
            breakfast: 0,
            lunch: 0,
            dinner: 0
          }
        };
      }

      // Add department counts
      if (!acc[dateStr].departments[meal.department]) {
        acc[dateStr].departments[meal.department] = {
          breakfast: meal.breakfastCount || 0,
          lunch: meal.lunchCount || 0,
          dinner: meal.dinnerCount || 0,
          addedBy: meal.addedBy
        };
      }

      // Update total counts for the day
      acc[dateStr].totalCounts.breakfast += meal.breakfastCount || 0;
      acc[dateStr].totalCounts.lunch += meal.lunchCount || 0;
      acc[dateStr].totalCounts.dinner += meal.dinnerCount || 0;

      return acc;
    }, {});

    // Convert to array and sort by date
    const formattedMeals = Object.values(mealsByDate).sort((a, b) => 
      new Date(b.date) - new Date(a.date)
    );

    res.json({
      success: true,
      guestMeals: formattedMeals
    });
  } catch (error) {
    console.error('Get all guest meals error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get all departments (Public route)
router.get('/departments', async (req, res) => {
  try {
    // Get unique departments from users collection
    const departments = await User.distinct('department');

    // Filter out null/empty departments and sort alphabetically
    const validDepartments = departments
      .filter(dept => dept && dept.trim())
      .sort((a, b) => a.localeCompare(b));

    res.json({
      success: true,
      departments: validDepartments,
      total: validDepartments.length
    });
  } catch (error) {
    console.error('Fetch departments error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get meeting food requirements for a date range
router.get('/meeting-food-requirements', messStaffAuth, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Both startDate and endDate are required'
      });
    }

    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    // Find meetings within date range that require food
    const meetings = await Meeting.find({
      startDatetime: { $gte: start, $lte: end },
      foodRequired: true,
      status: 'approved'  // Only include approved meetings
    }).sort({ startDatetime: 1 });

    // Group meetings by date and calculate food requirements
    const foodRequirements = meetings.reduce((acc, meeting) => {
      const dateStr = meeting.startDatetime.toISOString().split('T')[0];
      
      if (!acc[dateStr]) {
        acc[dateStr] = {
          date: meeting.startDatetime,
          totalCounts: {
            breakfast: 0,
            midmorningSnacks: 0,
            lunch: 0,
            eveningsnacks: 0,
            dinner: 0
          },
          meetings: []
        };
      }

      // Add meeting details
      acc[dateStr].meetings.push({
        id: meeting._id,
        title: meeting.title,
        department: meeting.department,
        startTime: meeting.startDatetime,
        endTime: meeting.endDatetime,
        hall: meeting.hall,
        noOfPersons: meeting.noOfPersons,
        foodCounts: {
          breakfast: meeting.breakfast || 0,
          morningSnacksCount: meeting.morningSnacksCount || 0,
          morningTeaCount: meeting.morningTeaCount || 0,
          lunch: meeting.lunch || 0,
          eveningSnacksCount: meeting.eveningSnacksCount || 0,
          eveningTeaCount: meeting.eveningTeaCount || 0,
          dinner: meeting.dinner || 0
        },
        createdBy: meeting.createdBy
      });

      // Update total counts for the day
      acc[dateStr].totalCounts.breakfast += meeting.breakfast || 0;
      acc[dateStr].totalCounts.midmorningSnacks += meeting.midmorningSnacks || 0;
      acc[dateStr].totalCounts.lunch += meeting.lunch || 0;
      acc[dateStr].totalCounts.eveningsnacks += meeting.eveningsnacks || 0;
      acc[dateStr].totalCounts.dinner += meeting.dinner || 0;

      return acc;
    }, {});

    // Calculate overall totals
    const overallTotals = Object.values(foodRequirements).reduce((totals, day) => {
      totals.breakfast += day.totalCounts.breakfast;
      totals.midmorningSnacks += day.totalCounts.midmorningSnacks;
      totals.lunch += day.totalCounts.lunch;
      totals.eveningsnacks += day.totalCounts.eveningsnacks;
      totals.dinner += day.totalCounts.dinner;
      return totals;
    }, {
      breakfast: 0,
      midmorningSnacks: 0,
      lunch: 0,
      eveningsnacks: 0,
      dinner: 0
    });

    res.json({
      success: true,
      dateRange: {
        from: start,
        to: end
      },
      overallTotals,
      dailyRequirements: foodRequirements
    });
  } catch (error) {
    console.error('Get meeting food requirements error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router; 