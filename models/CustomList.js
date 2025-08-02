const mongoose = require('mongoose');

const customListSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  users: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  departments: [{
    type: String,
    trim: true
  }],
  description: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('CustomList', customListSchema); 