const mongoose = require('mongoose');

const travelSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  vehicle: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle',
    required: true
  },
  fromLocation: {
    type: String,
    required: true,
    trim: true
  },
  toLocation: {
    type: String,
    required: true,
    trim: true
  },
  startKm: {
    type: Number,
    required: true
  },
  endKm: {
    type: Number,
    required: true
  },
  startTime: {
    type: String, // Use ISO time string like "08:30"
    required: true
  },
  endTime: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  description: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Travel', travelSchema);
