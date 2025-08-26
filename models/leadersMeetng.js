const mongoose = require('mongoose');

const leadersMeetingSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    type:{
        type: String,
        required: true
    },
    startDatetime: {
        type: Date,
        required: true
    },
    endDatetime: {
        type: Date,
        required: true
    },
    mode:{
        type: String,
        required: true,
        enum: ['online', 'offline','hybrid']
    },
    locationLink:{
        type: String,
    },
    description: {
        type: String,
        required: true
    },
    agenda:{
        type: String
    },
    reccurence:{
        type: Boolean,
        default: false
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    // New fields for meeting workflow
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'cancelled', 'expired'],
        default: 'pending'
    },
    // Merged participants array with response tracking
    participants: [{
        participant: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        status: {
            type: String,
            enum: ['pending', 'accepted', 'declined'],
            default: 'pending'
        },
        responseDate: {
            type: Date
        },
        responseMessage: {
            type: String
        }
    }],
    // Meeting request expiry
    requestExpiry: {
        type: Date,
        required: false
    },
    // Cancellation reason
    cancellationReason: {
        type: String
    },
    // Reschedule requests from participants
    rescheduleRequests: [{
        suggestedTime: {
            type: Date,
            required: true
        },
        reason: {
            type: String,
            required: true
        },
        requestedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        requestedAt: {
            type: Date,
            default: Date.now
        },
        status: {
            type: String,
            enum: ['pending', 'approved', 'rejected'],
            default: 'pending'
        },
        affectedScheduleId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Schedule'
        },
        responseDate: {
            type: Date
        },
        responseMessage: {
            type: String
        }
    }]
}, {
    timestamps: true
});

// Pre-save middleware to set request expiry (24 hours from creation)
leadersMeetingSchema.pre('save', function(next) {
    if (this.isNew) {
        this.requestExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    }
    next();
});

// Method to check if all participants have responded
leadersMeetingSchema.methods.allParticipantsResponded = function() {
    return this.participants.every(participant => 
        participant.status !== 'pending'
    );
};

// Method to check if all participants accepted
leadersMeetingSchema.methods.allParticipantsAccepted = function() {
    return this.participants.every(participant => 
        participant.status === 'accepted'
    );
};

// Method to check if any participant declined
leadersMeetingSchema.methods.anyParticipantDeclined = function() {
    return this.participants.some(participant => 
        participant.status === 'declined'
    );
};

// Method to get pending participants
leadersMeetingSchema.methods.getPendingParticipants = function() {
    return this.participants
        .filter(participant => participant.status === 'pending')
        .map(participant => participant.participant);
};

module.exports = mongoose.model('LeadersMeeting', leadersMeetingSchema);