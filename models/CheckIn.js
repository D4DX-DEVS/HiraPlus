const mongoose = require('mongoose');

const checkInSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  checkedInTime: {
    type: Date,
    required: true,
    default: Date.now
  },
  checkoutTime: {
    type: Date,
    default: null
  },
  status: {
    type: String,
    enum: ['CheckedIn', 'Checkout'],
    default: 'CheckedIn'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('CheckIn', checkInSchema); 