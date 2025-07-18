const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Meal = require('../models/Meal');
const User = require('../models/User');
const GuestMeal = require('../models/GuestMeal');
const Meeting = require('../models/Meeting');
const Menu = require('../models/Menu');
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
      process.env.JWT_SECRET
    );

    res.json({ token });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add weekly menu (Only accessible by mess staff)
// router.post('/menu/week', messStaffAuth, async (req, res) => {
//   try {
//     const { weekMenu, weekType = 'current' } = req.body;
    
//     // Validate required fields
//     if (!weekMenu || typeof weekMenu !== 'object') {
//       return res.status(400).json({ 
//         message: 'weekMenu object is required with daily menu data' 
//       });
//     }

//     // Validate weekType
//     if (!['current', 'next'].includes(weekType)) {
//       return res.status(400).json({ 
//         message: 'weekType must be either "current" or "next"' 
//       });
//     }

//     const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    
//     // Validate that all days are provided with complete meal data
//     for (const day of days) {
//       if (!weekMenu[day] || !weekMenu[day].breakfast || !weekMenu[day].lunch || !weekMenu[day].dinner) {
//         return res.status(400).json({ 
//           message: `All meal items are required for ${day} (breakfast, lunch, dinner)` 
//         });
//       }
//     }

//     // Get the start of specified week (Monday)
//     const now = new Date();
//     const currentDay = now.getDay();
//     const startOfWeek = new Date(now);
//     startOfWeek.setDate(now.getDate() - (currentDay === 0 ? 6 : currentDay - 1));
    
//     // If weekType is 'next', add 7 days to get next week
//     if (weekType === 'next') {
//       startOfWeek.setDate(startOfWeek.getDate() + 7);
//     }
    
//     startOfWeek.setHours(0, 0, 0, 0);

//     // Check if any menu already exists for this week
//     const endOfWeek = new Date(startOfWeek);
//     endOfWeek.setDate(startOfWeek.getDate() + 6);
//     endOfWeek.setHours(23, 59, 59, 999);

//     const existingMenus = await Menu.find({ 
//       date: { $gte: startOfWeek, $lte: endOfWeek } 
//     });
    
//     if (existingMenus.length > 0) {
//       return res.status(400).json({ 
//         message: `Menu for ${weekType} week already exists. Use the update function to modify it.` 
//       });
//     }

//     // Create menus for all days of the week
//     const createdMenus = [];
//     for (let i = 0; i < 7; i++) {
//       const dayDate = new Date(startOfWeek);
//       dayDate.setDate(startOfWeek.getDate() + i);
      
//       const dayName = days[i];
//       const menu = new Menu({
//         date: dayDate,
//         breakfast: weekMenu[dayName].breakfast.trim(),
//         lunch: weekMenu[dayName].lunch.trim(),
//         dinner: weekMenu[dayName].dinner.trim(),
//         addedBy: 'Mess Staff'
//       });

//       await menu.save();
      
//       // Get the actual day name from the date to ensure accuracy
//       const actualDayOfWeek = dayDate.getDay(); // 0=Sunday, 1=Monday, etc.
//       const actualDayIndex = actualDayOfWeek === 0 ? 6 : actualDayOfWeek - 1; // Convert to Monday=0 format
//       const actualDayName = days[actualDayIndex];
      
//       createdMenus.push({
//         id: menu._id,
//         date: menu.date,
//         day: actualDayName,
//         breakfast: menu.breakfast,
//         lunch: menu.lunch,
//         dinner: menu.dinner,
//         addedBy: menu.addedBy,
//         createdAt: menu.createdAt
//       });
//     }

//     res.status(201).json({
//       success: true,
//       message: `${weekType.charAt(0).toUpperCase() + weekType.slice(1)} week's menu added successfully`,
//       weekMenu: createdMenus,
//       weekType,
//       weekPeriod: {
//         start: startOfWeek,
//         end: endOfWeek
//       }
//     });
//   } catch (error) {
//     if (error.code === 11000) {
//       return res.status(400).json({ 
//         message: 'Menu for this week already exists' 
//       });
//     }
//     res.status(500).json({ 
//       success: false,
//       message: error.message 
//     });
//   }
// });

// // Update this week's menu (Only accessible by mess staff)
// router.put('/menu/week', messStaffAuth, async (req, res) => {
//   try {
//     const { weekMenu } = req.body;
    
//     // Validate that weekMenu is provided
//     if (!weekMenu || typeof weekMenu !== 'object') {
//       return res.status(400).json({ 
//         message: 'weekMenu object must be provided with at least one day\'s menu data' 
//       });
//     }

//     const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    
//     // Get the start of current week (Monday)
//     const now = new Date();
//     const currentDay = now.getDay();
//     const startOfWeek = new Date(now);
//     startOfWeek.setDate(now.getDate() - (currentDay === 0 ? 6 : currentDay - 1));
//     startOfWeek.setHours(0, 0, 0, 0);

//     const endOfWeek = new Date(startOfWeek);
//     endOfWeek.setDate(startOfWeek.getDate() + 6);
//     endOfWeek.setHours(23, 59, 59, 999);

//     // Get existing menus for this week
//     const existingMenus = await Menu.find({ 
//       date: { $gte: startOfWeek, $lte: endOfWeek } 
//     }).sort({ date: 1 });

//     const updatedMenus = [];

//     // Process each day in the weekMenu update
//     for (const [dayName, dayData] of Object.entries(weekMenu)) {
//       if (!days.includes(dayName.toLowerCase())) {
//         continue; // Skip invalid day names
//       }

//       const dayIndex = days.indexOf(dayName.toLowerCase());
//       const dayDate = new Date(startOfWeek);
//       dayDate.setDate(startOfWeek.getDate() + dayIndex);

//       // Find existing menu for this day
//       let menu = existingMenus.find(m => 
//         m.date.toDateString() === dayDate.toDateString()
//       );

//       if (!menu) {
//         // Create new menu if it doesn't exist
//         if (!dayData.breakfast || !dayData.lunch || !dayData.dinner) {
//           return res.status(400).json({ 
//             message: `All meal items are required for ${dayName} when creating a new menu (breakfast, lunch, dinner)` 
//           });
//         }
        
//         menu = new Menu({
//           date: dayDate,
//           breakfast: dayData.breakfast.trim(),
//           lunch: dayData.lunch.trim(),
//           dinner: dayData.dinner.trim(),
//           addedBy: 'Mess Staff'
//         });
//       } else {
//         // Update existing menu
//         if (dayData.breakfast) menu.breakfast = dayData.breakfast.trim();
//         if (dayData.lunch) menu.lunch = dayData.lunch.trim();
//         if (dayData.dinner) menu.dinner = dayData.dinner.trim();
//       }

//       await menu.save();
      
//       // Get the actual day name from the date to ensure accuracy
//       const actualDayOfWeek = dayDate.getDay(); // 0=Sunday, 1=Monday, etc.
//       const actualDayIndex = actualDayOfWeek === 0 ? 6 : actualDayOfWeek - 1; // Convert to Monday=0 format
//       const actualDayName = days[actualDayIndex];
      
//       updatedMenus.push({
//         id: menu._id,
//         date: menu.date,
//         day: actualDayName,
//         breakfast: menu.breakfast,
//         lunch: menu.lunch,
//         dinner: menu.dinner,
//         addedBy: menu.addedBy,
//         updatedAt: menu.updatedAt
//       });
//     }

//     res.json({
//       success: true,
//       message: 'This week\'s menu updated successfully',
//       weekMenu: updatedMenus
//     });
//   } catch (error) {
//     res.status(500).json({ 
//       success: false,
//       message: error.message 
//     });
//   }
// });

// // Update menu by ID (Only accessible by mess staff)
// router.put('/menu/:id', messStaffAuth, async (req, res) => {
//   try {
//     const { breakfast, lunch, dinner } = req.body;
    
//     // Find the menu by ID
//     const menu = await Menu.findById(req.params.id);
//     if (!menu) {
//       return res.status(404).json({ 
//         success: false,
//         message: 'Menu not found' 
//       });
//     }

//     // Prepare update data - only update provided fields
//     const updateData = {};
//     if (breakfast !== undefined) updateData.breakfast = breakfast.trim();
//     if (lunch !== undefined) updateData.lunch = lunch.trim();
//     if (dinner !== undefined) updateData.dinner = dinner.trim();

//     // Update the menu
//     const updatedMenu = await Menu.findByIdAndUpdate(
//       req.params.id,
//       { $set: updateData },
//       { new: true }
//     );

//     res.json({
//       success: true,
//       message: 'Menu updated successfully',
//       menu: {
//         id: updatedMenu._id,
//         date: updatedMenu.date,
//         breakfast: updatedMenu.breakfast,
//         lunch: updatedMenu.lunch,
//         dinner: updatedMenu.dinner,
//         addedBy: updatedMenu.addedBy,
//         createdAt: updatedMenu.createdAt,
//         updatedAt: updatedMenu.updatedAt
//       }
//     });
//   } catch (error) {
//     res.status(500).json({ 
//       success: false,
//       message: error.message 
//     });
//   }
// });

// // Delete menu by ID (Only accessible by mess staff)
// router.delete('/menu/:id', messStaffAuth, async (req, res) => {
//   try {
//     // Find the menu by ID
//     const menu = await Menu.findById(req.params.id);
//     if (!menu) {
//       return res.status(404).json({ 
//         success: false,
//         message: 'Menu not found' 
//       });
//     }

//     // Store menu details before deletion for response
//     const deletedMenuDetails = {
//       id: menu._id,
//       date: menu.date,
//       breakfast: menu.breakfast,
//       lunch: menu.lunch,
//       dinner: menu.dinner,
//       addedBy: menu.addedBy,
//       createdAt: menu.createdAt
//     };

//     // Delete the menu
//     await Menu.findByIdAndDelete(req.params.id);

//     res.json({
//       success: true,
//       message: 'Menu deleted successfully',
//       deletedMenu: deletedMenuDetails
//     });
//   } catch (error) {
//     res.status(500).json({ 
//       success: false,
//       message: error.message 
//     });
//   }
// });

// // Delete specific days' menu (Only accessible by mess staff)
// router.delete('/menu/week', messStaffAuth, async (req, res) => {
//   try {
//     const { days } = req.body;
    
//     // Validate that days array is provided
//     if (!days || !Array.isArray(days) || days.length === 0) {
//       return res.status(400).json({ 
//         message: 'days array is required with at least one day name' 
//       });
//     }

//     const validDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    
//     // Validate day names
//     const invalidDays = days.filter(day => !validDays.includes(day.toLowerCase()));
//     if (invalidDays.length > 0) {
//       return res.status(400).json({ 
//         message: `Invalid day names: ${invalidDays.join(', ')}. Valid days are: ${validDays.join(', ')}` 
//       });
//     }

//     // Get the start of current week (Monday)
//     const now = new Date();
//     const currentDay = now.getDay();
//     const startOfWeek = new Date(now);
//     startOfWeek.setDate(now.getDate() - (currentDay === 0 ? 6 : currentDay - 1));
//     startOfWeek.setHours(0, 0, 0, 0);

//     const endOfWeek = new Date(startOfWeek);
//     endOfWeek.setDate(startOfWeek.getDate() + 6);
//     endOfWeek.setHours(23, 59, 59, 999);

//     // Calculate dates for the specified days
//     const datesToDelete = [];
//     const deletedDays = [];

//     for (const dayName of days) {
//       const dayIndex = validDays.indexOf(dayName.toLowerCase());
//       const dayDate = new Date(startOfWeek);
//       dayDate.setDate(startOfWeek.getDate() + dayIndex);
//       datesToDelete.push(dayDate);
//     }

//     // Find existing menus for the specified days
//     const existingMenus = await Menu.find({ 
//       date: { 
//         $in: datesToDelete
//       } 
//     });

//     if (existingMenus.length === 0) {
//       return res.status(404).json({ 
//         success: false,
//         message: 'No menu entries found for the specified days' 
//       });
//     }

//     // Delete the menu entries
//     const deleteResult = await Menu.deleteMany({ 
//       date: { 
//         $in: datesToDelete
//       } 
//     });

//     // Prepare response with deleted menu details
//     existingMenus.forEach(menu => {
//       // Use the actual day of week from the menu date to avoid timezone issues
//       const menuDate = new Date(menu.date);
//       const menuDayOfWeek = menuDate.getDay(); // 0=Sunday, 1=Monday, etc.
//       const adjustedDayIndex = menuDayOfWeek === 0 ? 6 : menuDayOfWeek - 1; // Convert to Monday=0 format
      
//       if (adjustedDayIndex >= 0 && adjustedDayIndex < 7) {
//         deletedDays.push({
//           day: validDays[adjustedDayIndex],
//           date: menu.date,
//           breakfast: menu.breakfast,
//           lunch: menu.lunch,
//           dinner: menu.dinner,
//           addedBy: menu.addedBy,
//           createdAt: menu.createdAt
//         });
//       }
//     });

//     res.json({
//       success: true,
//       message: `Successfully deleted menu entries for ${deleteResult.deletedCount} day(s)`,
//       deletedDays: deletedDays,
//       deletedCount: deleteResult.deletedCount,
//       weekPeriod: {
//         start: startOfWeek,
//         end: endOfWeek
//       }
//     });
//   } catch (error) {
//     res.status(500).json({ 
//       success: false,
//       message: error.message 
//     });
//   }
// });

// Add menu for specific date (Only accessible by mess staff)
router.post('/menu/date', messStaffAuth, async (req, res) => {
  try {
    const { date, breakfast, lunch, dinner } = req.body;
    
    // Validate required fields
    if (!date) {
      return res.status(400).json({ 
        success: false,
        message: 'Date is required' 
      });
    }

    if (!breakfast || !lunch || !dinner) {
      return res.status(400).json({ 
        success: false,
        message: 'All meal items are required (breakfast, lunch, dinner)' 
      });
    }

    // Create date range for the specified date (start of day to end of day)
    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);

    // Check if menu already exists for this date
    const existingMenu = await Menu.findOne({ 
      date: { $gte: startDate, $lte: endDate }
    });
    
    if (existingMenu) {
      return res.status(400).json({ 
        success: false,
        message: 'Menu for this date already exists. Use the update function to modify it.' 
      });
    }

    // Create the menu with normalized date
    const menuDate = new Date(date);
    menuDate.setHours(0, 0, 0, 0);

    // Create new menu
    const menu = new Menu({
      date: menuDate,
      breakfast: breakfast.trim(),
      lunch: lunch.trim(),
      dinner: dinner.trim(),
      addedBy: 'Mess Staff'
    });

    await menu.save();

    // Get day name for response
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayName = days[menuDate.getDay()];

    res.status(201).json({
      success: true,
      message: 'Menu added successfully for ' + menuDate.toDateString(),
      menu: {
        id: menu._id,
        date: menu.date,
        day: dayName,
        breakfast: menu.breakfast,
        lunch: menu.lunch,
        dinner: menu.dinner,
        addedBy: menu.addedBy,
        createdAt: menu.createdAt
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
});

// Update menu for specific date (Only accessible by mess staff)
router.put('/menu/date', messStaffAuth, async (req, res) => {
  try {
    const { date, breakfast, lunch, dinner } = req.body;
    
    // Validate required fields
    if (!date) {
      return res.status(400).json({ 
        success: false,
        message: 'Date is required' 
      });
    }

    // Create date range for the specified date (start of day to end of day)
    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);

    // Find existing menu for this date using date range
    let menu = await Menu.findOne({ 
      date: { $gte: startDate, $lte: endDate }
    });

    if (!menu) {
      // Create new menu if it doesn't exist
      if (!breakfast || !lunch || !dinner) {
        return res.status(400).json({ 
          success: false,
          message: 'All meal items are required when creating a new menu (breakfast, lunch, dinner)' 
        });
      }
      
      // Create the menu with normalized date
      const menuDate = new Date(date);
      menuDate.setHours(0, 0, 0, 0);
      
      menu = new Menu({
        date: menuDate,
        breakfast: breakfast.trim(),
        lunch: lunch.trim(),
        dinner: dinner.trim(),
        addedBy: 'Mess Staff'
      });
    } else {
      // Update existing menu - only update provided fields
      if (breakfast !== undefined) menu.breakfast = breakfast.trim();
      if (lunch !== undefined) menu.lunch = lunch.trim();
      if (dinner !== undefined) menu.dinner = dinner.trim();
    }

    await menu.save();

    // Get day name for response
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayName = days[menu.date.getDay()];

    res.json({
      success: true,
      message: 'Menu updated successfully for ' + menu.date.toDateString(),
      menu: {
        id: menu._id,
        date: menu.date,
        day: dayName,
        breakfast: menu.breakfast,
        lunch: menu.lunch,
        dinner: menu.dinner,
        addedBy: menu.addedBy,
        createdAt: menu.createdAt,
        updatedAt: menu.updatedAt
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
});

// Delete menu for specific date (Only accessible by mess staff)
router.delete('/menu/date', messStaffAuth, async (req, res) => {
  try {
    const { date } = req.body;
    
    // Validate required fields
    if (!date) {
      return res.status(400).json({ 
        success: false,
        message: 'Date is required' 
      });
    }

    // Create date range for the specified date (start of day to end of day)
    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);

    // Find the menu for this date using date range
    const menu = await Menu.findOne({ 
      date: { $gte: startDate, $lte: endDate }
    });
    
    if (!menu) {
      return res.status(404).json({ 
        success: false,
        message: 'No menu found for this date' 
      });
    }

    // Store menu details before deletion for response
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayName = days[menu.date.getDay()];
    
    const deletedMenuDetails = {
      id: menu._id,
      date: menu.date,
      day: dayName,
      breakfast: menu.breakfast,
      lunch: menu.lunch,
      dinner: menu.dinner,
      addedBy: menu.addedBy,
      createdAt: menu.createdAt
    };

    // Delete the menu using the found menu's ID
    await Menu.findByIdAndDelete(menu._id);

    res.json({
      success: true,
      message: 'Menu deleted successfully for ' + menu.date.toDateString(),
      deletedMenu: deletedMenuDetails
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
});

// Get all menus from today onwards (Public route - accessible to all)
router.get('/menu/date', async (req, res) => {
  try {
    // Get today's date (start of day)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find all menus from today onwards, sorted by date
    const menus = await Menu.find({ 
      date: { $gte: today }
    }).sort({ date: 1 });
    
    if (menus.length === 0) {
      return res.status(404).json({ 
        success: false,
        message: 'No menus found from today onwards' 
      });
    }

    // Get day names for response
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    
    const formattedMenus = menus.map(menu => {
      const menuDate = new Date(menu.date);
      const dayName = days[menuDate.getDay()];
      
      return {
        id: menu._id,
        date: menu.date,
        day: dayName,
        breakfast: menu.breakfast,
        lunch: menu.lunch,
        dinner: menu.dinner,
        addedBy: menu.addedBy,
        createdAt: menu.createdAt,
        updatedAt: menu.updatedAt
      };
    });

    res.json({
      success: true,
      totalMenus: formattedMenus.length,
      menus: formattedMenus,
      dateRange: {
        from: today,
        to: menus[menus.length - 1].date
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
});

// Get weekly menu (Public route - accessible to all)
// router.get('/menu/week', async (req, res) => {
//   try {
//     const { weekType = 'current' } = req.query;
    
//     // Validate weekType
//     if (!['current', 'next'].includes(weekType)) {
//       return res.status(400).json({ 
//         success: false,
//         message: 'weekType must be either "current" or "next"' 
//       });
//     }

//     // Get the start of specified week (Monday)
//     const now = new Date();
//     const currentDay = now.getDay();
//     const startOfWeek = new Date(now);
//     startOfWeek.setDate(now.getDate() - (currentDay === 0 ? 6 : currentDay - 1));
    
//     // If weekType is 'next', add 7 days to get next week
//     if (weekType === 'next') {
//       startOfWeek.setDate(startOfWeek.getDate() + 7);
//     }
    
//     startOfWeek.setHours(0, 0, 0, 0);

//     const endOfWeek = new Date(startOfWeek);
//     endOfWeek.setDate(startOfWeek.getDate() + 6);
//     endOfWeek.setHours(23, 59, 59, 999);

//     const menus = await Menu.find({ 
//       date: { $gte: startOfWeek, $lte: endOfWeek } 
//     }).sort({ date: 1 });
    
//     if (menus.length === 0) {
//       return res.status(404).json({ 
//         success: false,
//         message: `No menu found for ${weekType} week` 
//       });
//     }

//     const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
//     const weekMenu = {};

//     // Organize menus by day
//     menus.forEach(menu => {
//       // Create a new date object to avoid timezone issues
//       const menuDate = new Date(menu.date);
//       const startDate = new Date(startOfWeek);
      
//       // Calculate the day difference more reliably
//       const timeDiff = menuDate.getTime() - startDate.getTime();
//       const dayIndex = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
      
//       // Alternative: Use the actual day of week from the menu date
//       const menuDayOfWeek = menuDate.getDay(); // 0=Sunday, 1=Monday, etc.
//       const adjustedDayIndex = menuDayOfWeek === 0 ? 6 : menuDayOfWeek - 1; // Convert to Monday=0 format
      
//       if (adjustedDayIndex >= 0 && adjustedDayIndex < 7) {
//         const dayName = days[adjustedDayIndex];
//         weekMenu[dayName] = {
//           id: menu._id,
//           date: menu.date,
//           breakfast: menu.breakfast,
//           lunch: menu.lunch,
//           dinner: menu.dinner,
//           addedBy: menu.addedBy,
//           createdAt: menu.createdAt,
//           updatedAt: menu.updatedAt
//         };
//       }
//     });

//     res.json({
//       success: true,
//       weekMenu,
//       weekType,
//       weekPeriod: {
//         start: startOfWeek,
//         end: endOfWeek
//       }
//     });
//   } catch (error) {
//     res.status(500).json({ 
//       success: false,
//       message: error.message 
//     });
//   }
// });

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
      model: 'User',
      populate: {
        path: 'department',
        model: 'Department',
        select: 'title'
      }
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
          department: mealObj.userId.department ? {
            _id: mealObj.userId.department._id,
            title: mealObj.userId.department.title
          } : null,
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
        model: 'User',
        populate: {
          path: 'department',
          model: 'Department',
          select: 'title'
        }
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
          department: mealObj.userId.department ? {
            _id: mealObj.userId.department._id,
            title: mealObj.userId.department.title
          } : null,
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
      if (!acc[dateStr].departments[meal.department.title]) {
        acc[dateStr].departments[meal.department.title] = {
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

// Add meal for a user
router.post('/users/:userId/meals', messStaffAuth, async (req, res) => {
  try {
    const { date, breakfast, lunch, dinner } = req.body;
    
    if (!date) {
      return res.status(400).json({ message: 'Date is required' });
    }

    // Check if user exists
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if meal already exists for this user and date
    const existingMeal = await Meal.findOne({
      userId: req.params.userId,
      date: new Date(date)
    });

    if (existingMeal) {
      return res.status(400).json({ 
        message: 'Meal record already exists for this date. Use edit function to update it.' 
      });
    }

    // Create new meal
    const meal = new Meal({
      userId: req.params.userId,
      date: new Date(date),
      breakfast: breakfast || false,
      lunch: lunch || false,
      dinner: dinner || false
    });

    await meal.save();
    res.status(201).json({ 
      message: 'Meal added successfully',
      meal
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Edit meal by userId and date
router.put('/users/:userId/meals', messStaffAuth, async (req, res) => {
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

// Get all departments (Public route)
router.get('/departments', async (req, res) => {
  try {
    const Department = require('../models/Department');
    
    const departments = await Department.find()
      .select('title')
      .sort({ title: 1 });

    res.json({
      success: true,
      departments: departments.map(dept => dept.title),
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
    })
    .populate('department', 'title')
    .sort({ startDatetime: 1 });

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
        department: meeting.department.title,
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