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
    enum: ['Auditorium [2nd Floor]', 'Conference Hall [3rd Floor]', 'Meeting Space [1st Floor]']
  },
  rent: {
    type: Number,
    default: 2000
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
  morningSnacksCount: {
    type: Number,
    default: 0
  },
  morningTeaCount: {
    type: Number,
    default: 0
  },
  lunch: {
    type: Number,
    default: 0
  },
  eveningSnacksCount: {
    type: Number,
    default: 0
  },
  eveningTeaCount: {
    type: Number,
    default: 0
  },
  dinner: {
    type: Number,
    default: 0
  },
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: true
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
    const totalFood = this.breakfast + this.morningSnacksCount + this.morningTeaCount +
                     this.lunch + this.eveningSnacksCount + this.eveningTeaCount + this.dinner;
    if (totalFood === 0) {
      next(new Error('At least one meal count must be specified when food is required'));
    }
  }
  next();
});



module.exports = mongoose.model('Meeting', meetingSchema); 