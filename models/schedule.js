const mongoose = require('mongoose');

const scheduleSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  subtitle: {
    type: String,
    trim: true
  },
  scheduleType: {
    type: String,
    enum: ['Meeting', 'Personal Appointment', 'Work Block', 'Out of Office', 'Visits', 'Other'],
    required: true
  },
  startDateTime: {
    type: Date,
    required: true
  },
  endDateTime: {
    type: Date,
    required: true
  },
  description: {
    type: String,
    trim: true
  },
  agendaItems: [{
    type: String,
    trim: true
  }],
  locationLink: {
    type: String,
    trim: true
  },
  recurring: {
    type: Boolean,
    default: false
  },
  recurringGroupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Schedule',
    required: false
  },
  recurrencePattern: {
    frequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly'],
      required: false
    },
    interval: {
      type: Number,
      default: 1,
      required: false
    },
    endDate: {
      type: Date,
      required: false
    },
    daysOfWeek: [{
      type: Number,  // 0=Sunday, 1=Monday, etc.
      required: false
    }]
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // New fields for conflict management
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'low'
  },
  meetingReference: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LeadersMeeting',
    required: false
  },
  meetingCreatorRole: {
    type: String,
    enum: ['leader', 'super leader'],
    required: false
  },
  status: {
    type: String,
    enum: ['active', 'cancelled', 'rescheduled'],
    default: 'active'
  },
  rescheduleRequest: {
    suggestedTime: {
      type: Date,
      required: false
    },
    reason: {
      type: String,
      trim: true,
      required: false
    },
    status: {
      type: String,
      enum: ['no_request_sent', 'pending', 'approved', 'rejected'],
      default: 'no_request_sent'
    },
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false
    },
    requestedAt: {
      type: Date,
      required: false
    }
  },
  overriddenBy: {
    meetingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'LeadersMeeting',
      required: false
    },
    overriddenAt: {
      type: Date,
      required: false
    }
  }
}, {
  timestamps: true
});

// Add validation for end date being after start date
scheduleSchema.pre('save', function(next) {
  if (this.endDateTime <= this.startDateTime) {
    next(new Error('End date must be after start date'));
  }
  next();
});

// Method to check if schedule conflicts with given time range
scheduleSchema.methods.hasConflict = function(startTime, endTime) {
  return (
    (this.startDateTime < endTime && this.endDateTime > startTime) ||
    (startTime < this.endDateTime && endTime > this.startDateTime)
  );
};

// Method to get priority level as number for comparison
scheduleSchema.methods.getPriorityLevel = function() {
  const priorityLevels = { 'low': 1, 'medium': 2, 'high': 3 };
  return priorityLevels[this.priority] || 1;
};



module.exports = mongoose.model('Schedule', scheduleSchema);