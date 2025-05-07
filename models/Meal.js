const mongoose = require('mongoose');

const mealSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  breakfast: {
    type: Boolean,
    default: false
  },
  lunch: {
    type: Boolean,
    default: false
  },
  dinner: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Compound index to ensure one meal record per user per date
mealSchema.index({ userId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Meal', mealSchema); 