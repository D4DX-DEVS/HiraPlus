const mongoose = require('mongoose');

const guestMealSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true
  },
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: true
  },
  addedBy: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  breakfastCount: {
    type: Number,
    default: 0,
    min: 0
  },
  lunchCount: {
    type: Number,
    default: 0,
    min: 0
  },
  dinnerCount: {
    type: Number,
    default: 0,
    min: 0
  }
}, {
  timestamps: true
});

// Compound index to ensure unique date-department combination
guestMealSchema.index({ date: 1, department: 1 }, { unique: true });

module.exports = mongoose.model('GuestMeal', guestMealSchema); 