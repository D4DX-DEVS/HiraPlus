const mongoose = require('mongoose');

const menuSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
    unique: true // Ensure only one menu per date
  },
  breakfast: {
    type: String,
    required: true,
    trim: true
  },
  lunch: {
    type: String,
    required: true,
    trim: true
  },
  dinner: {
    type: String,
    required: true,
    trim: true
  },
  addedBy: {
    type: String,
    default: 'Mess Staff'
  }
}, {
  timestamps: true
});

// Index for faster date queries
menuSchema.index({ date: 1 });

module.exports = mongoose.model('Menu', menuSchema); 