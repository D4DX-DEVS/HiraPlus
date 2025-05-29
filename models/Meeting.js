const mongoose = require('mongoose');

const meetingSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  startDatetime: {
    type: Date,
    required: true
  },
  endDatetime: {
    type: Date,
    required: true
  },
  hall: {
    type: String,
    required: true,
    enum: ['Auditorium', 'Conference Hall', 'Meeting Space']
  },
  noOfPersons: {
    type: Number,
    required: true,
    min: 1
  },
  foodRequired: {
    type: Boolean,
    default: false
  },
  breakfast: {
    type: Number,
    default: 0
  },
  midmorningSnacks: {
    type: Number,
    default: 0
  },
  lunch: {
    type: Number,
    default: 0
  },
  eveningsnacks: {
    type: Number,
    default: 0
  },
  dinner: {
    type: Number,
    default: 0
  },
  department: {
    type: String,
    required: true,
    trim: true
  },
  status: {
    type: String,
    enum: ['approved', 'pending'],
    default: 'pending'
  },
  createdBy: {
    type: mongoose.Schema.Types.Mixed, // Allow both ObjectId and String
    required: true
  }
}, {
  timestamps: true
});

// Add validation for end date being after start date
meetingSchema.pre('save', function(next) {
  if (this.endDatetime <= this.startDatetime) {
    next(new Error('End date must be after start date'));
  }
  next();
});

// Add validation for food counts if foodRequired is true
meetingSchema.pre('save', function(next) {
  if (this.foodRequired) {
    const totalFood = this.breakfast + this.midmorningSnacks + 
                     this.lunch + this.eveningsnacks + this.dinner;
    if (totalFood === 0) {
      next(new Error('At least one meal count must be specified when food is required'));
    }
  }
  next();
});

module.exports = mongoose.model('Meeting', meetingSchema); 