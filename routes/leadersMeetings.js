const express = require('express');
const router = express.Router();
const LeadersMeeting = require('../models/leadersMeetng');
const User = require('../models/User');
const Role = require('../models/Roles');
const { leaderAuth, leaderOrSuperLeaderAuth } = require('../middleware/leaderAuth');
const superLeaderAuth = require('../middleware/superLeaderAuth');
const axios = require('axios');
const jwt = require('jsonwebtoken');

// DXing Notification Helper Functions

// Send meeting request notification
async function sendMeetingRequestNotification(meeting, participant, isCreator = false) {
    try {
        let message;
        
        if (isCreator) {
            message = `Meeting Created: ${meeting.title}\n\n` +
                     `Date: ${new Date(meeting.startDatetime).toLocaleString('en-US', { timeZone: 'Asia/Kolkata' })}\n` +
                     `Mode: ${meeting.mode}\n` +
                     `Description: ${meeting.description}\n\n` +
                     `You have created this meeting and are automatically accepted as a participant.\n` +
                     `Location: ${meeting.locationLink || 'TBD'}\n` +
                     `Meeting requests have been sent to all other participants.\n`;
        } else {
            message = `Meeting Request: ${meeting.title}\n\n` +
                     `Date: ${new Date(meeting.startDatetime).toLocaleString('en-US', { timeZone: 'Asia/Kolkata' })}\n` +
                     `Mode: ${meeting.mode}\n` +
                     `Description: ${meeting.description}\n\n` +
                     `Please update your response in Hira+ app.\n` +
                     `Thank you!\n`;
        }
        
        await sendDXingMessage(participant.phoneNumber, message);
    } catch (error) {
        console.error('Error sending meeting request notification:', error);
    }
}



// Send meeting confirmation to participant
async function sendMeetingConfirmationToParticipant(meeting, participant) {
    try {
        console.log('Confirmation function - participant:', participant);
        console.log('Confirmation function - participant phoneNumber:', participant.phoneNumber);
        
        if (!participant.phoneNumber) {
            console.error('No phone number found for participant:', participant);
            return;
        }
        
        const message = `Meeting Confirmed: ${meeting.title}\n\n` +
                       `Date: ${new Date(meeting.startDatetime).toLocaleString('en-US', { timeZone: 'Asia/Kolkata' })}\n` +
                       `Mode: ${meeting.mode}\n` +
                       `Location: ${meeting.locationLink || 'TBD'}\n` +
                       `Description: ${meeting.description}\n\n` +
                       `Your response has been recorded as ACCEPTED.\n` +
                       `Thank you for confirming your attendance!`;
        
        console.log('Sending confirmation message to:', participant.phoneNumber);
        await sendDXingMessage(participant.phoneNumber, message);
        console.log('Confirmation message sent successfully');
    } catch (error) {
        console.error('Error sending meeting confirmation to participant:', error);
    }
}

// Send meeting cancellation to participant
async function sendMeetingCancellationToParticipant(meeting, participant) {
    try {
        console.log('Cancellation function - participant:', participant);
        console.log('Cancellation function - participant phoneNumber:', participant.phoneNumber);
        
        if (!participant.phoneNumber) {
            console.error('No phone number found for participant:', participant);
            return;
        }
        
        const message = `Meeting Response Recorded: ${meeting.title}\n\n` +
                       `Date: ${new Date(meeting.startDatetime).toLocaleString('en-US', { timeZone: 'Asia/Kolkata' })}\n` +
                       `Mode: ${meeting.mode}\n` +
                       `Description: ${meeting.description}\n\n` +
                       `Your response has been recorded as DECLINED.\n` +
                       `Note: The meeting will still proceed as scheduled.\n` +
                       `Thank you for your response.`;
        
        console.log('Sending cancellation message to:', participant.phoneNumber);
        await sendDXingMessage(participant.phoneNumber, message);
        console.log('Cancellation message sent successfully');
    } catch (error) {
        console.error('Error sending meeting cancellation to participant:', error);
    }
}

// Send super leader meeting notification (acknowledgment, not request)
async function sendSuperLeaderMeetingNotification(meeting, participant, isCreator = false) {
    try {
        let message;
        
        if (isCreator) {
            message = `Meeting Scheduled: ${meeting.title}\n\n` +
                     `Date: ${new Date(meeting.startDatetime).toLocaleString('en-US', { timeZone: 'Asia/Kolkata' })}\n` +
                     `Mode: ${meeting.mode}\n` +
                     `Description: ${meeting.description}\n\n` +
                     `You have scheduled this meeting as a Super Leader.\n` +
                     `All participants have been automatically accepted and notified.\n` +
                     `Meeting is confirmed and will proceed as scheduled.`;
        } else {
            message = `Meeting Scheduled: ${meeting.title}\n\n` +
                     `Date: ${new Date(meeting.startDatetime).toLocaleString('en-US', { timeZone: 'Asia/Kolkata' })}\n` +
                     `Mode: ${meeting.mode}\n` +
                     `Location: ${meeting.locationLink || 'TBD'}\n` +
                     `Description: ${meeting.description}\n\n` +
                     `A Super Leader has scheduled this meeting.\n` +
                     `You have been automatically accepted as a participant.\n` +
                     `Please ensure your attendance.\n` +
                     `Thank you!`;
        }
        
        await sendDXingMessage(participant.phoneNumber, message);
    } catch (error) {
        console.error('Error sending super leader meeting notification:', error);
    }
}

// Send meeting cancelled notification
async function sendMeetingCancelledNotification(meeting) {
    try {
        const message = `Meeting Cancelled: ${meeting.title}\n\n` +
                       `Some participants declined the meeting request.`;
        
        // Send to all participants
        for (const participant of meeting.participants) {
            // Check if participant has phoneNumber (populated data)
            const phoneNumber = typeof participant.participant === 'object' && participant.participant.phoneNumber 
                ? participant.participant.phoneNumber 
                : null;
            
            if (phoneNumber) {
                try {
                    await sendDXingMessage(phoneNumber, message);
                } catch (error) {
                    console.error(`Failed to send cancellation to ${phoneNumber}:`, error);
                }
            } else {
                console.warn(`No phone number found for participant: ${participant.participant}`);
            }
        }
    } catch (error) {
        console.error('Error sending meeting cancelled notification:', error);
    }
}

// Helper function to send DXing message
async function sendDXingMessage(phoneNumber, message) {
    try {
        // Validate phone number
        if (!phoneNumber) {
            throw new Error('Phone number is required');
        }

        const cleanedPhone = phoneNumber.replace(/[\s+\-()]/g, '');
        const formattedPhone = cleanedPhone.startsWith('91') ? cleanedPhone : `91${cleanedPhone}`;

        const payload = {
            secret: process.env.DXING_API_KEY,
            type: "whatsapp",
            phone: formattedPhone,
            message: message,
            account: process.env.DXING_INSTANCE_ID,
            priority: 1
        };

        const response = await axios.post('https://app.dxing.in/api/send/otp', payload, {
            headers: { 'Content-Type': 'application/json' }
        });

        return response.data;
    } catch (error) {
        console.error('DXing notification error:', error);
        throw error;
    }
}

// Helper function to get duration
function getDuration(start, end) {
    const duration = new Date(end) - new Date(start);
    const hours = Math.floor(duration / (1000 * 60 * 60));
    const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
}

// Helper function to create schedules for meeting participants
async function createSchedulesForParticipants(meeting, participants, creatorRole) {
    const Schedule = require('../models/schedule');
    const createdSchedules = [];
    const overriddenSchedules = [];

    for (const participantData of participants) {
        const participantId = typeof participantData.participant === 'object' 
            ? participantData.participant._id 
            : participantData.participant;

        try {
            // Check for existing conflicting schedules
            const conflictingSchedules = await Schedule.find({
                createdBy: participantId,
                status: 'active',
                $or: [
                    {
                        startDateTime: { $lt: meeting.endDatetime },
                        endDateTime: { $gt: meeting.startDatetime }
                    }
                ]
            });

            // Override lower priority schedules
            for (const conflictingSchedule of conflictingSchedules) {
                const meetingPriority = creatorRole === 'super leader' ? 'high' : 'medium';
                const schedulePriority = conflictingSchedule.priority;

                console.log(`🔍 Conflict Check: Meeting Priority: ${meetingPriority}, Schedule Priority: ${schedulePriority}`);
                console.log(`🔍 Creator Role: ${creatorRole}, Schedule: ${conflictingSchedule.title}`);

                if (meetingPriority === 'high' || 
                    (meetingPriority === 'medium' && schedulePriority === 'low')) {
                    
                    console.log(`✅ Schedule will be overridden: ${conflictingSchedule.title}`);
                    
                    // Mark conflicting schedule as cancelled and track what overrode it
                    conflictingSchedule.status = 'cancelled';
                    conflictingSchedule.overriddenBy = {
                        meetingId: meeting._id,
                        overriddenAt: new Date()
                    };
                    await conflictingSchedule.save();
                    overriddenSchedules.push(conflictingSchedule);

                    // 🔔 SEND NOTIFICATION TO USER WHOSE SCHEDULE WAS OVERRIDDEN
                    try {
                        const user = await User.findById(participantId);
                        if (user && user.phoneNumber) {
                            const message = `⚠️ Schedule Override Alert\n\n` +
                                           `Your schedule "${conflictingSchedule.title}" has been cancelled due to a higher priority meeting.\n\n` +
                                           `Cancelled Schedule:\n` +
                                           `📅 Date: ${new Date(conflictingSchedule.startDateTime).toLocaleString('en-US', { timeZone: 'Asia/Kolkata' })}\n` +
                                           `⏰ Time: ${new Date(conflictingSchedule.startDateTime).toLocaleTimeString('en-US', { timeZone: 'Asia/Kolkata' })} - ${new Date(conflictingSchedule.endDateTime).toLocaleTimeString('en-US', { timeZone: 'Asia/Kolkata' })}\n` +
                                           `📝 Type: ${conflictingSchedule.scheduleType}\n\n` +
                                           `New Meeting:\n` +
                                           `📋 Title: ${meeting.title}\n` +
                                           `👤 Created by: ${creatorRole === 'super leader' ? 'Super Leader' : 'Leader'}\n` +
                                           `📅 Date: ${new Date(meeting.startDatetime).toLocaleString('en-US', { timeZone: 'Asia/Kolkata' })}\n` +
                                           `⏰ Time: ${new Date(meeting.startDatetime).toLocaleTimeString('en-US', { timeZone: 'Asia/Kolkata' })} - ${new Date(meeting.endDatetime).toLocaleTimeString('en-US', { timeZone: 'Asia/Kolkata' })}\n\n` +
                                           `⚠️ IMPORTANT: You already had a schedule at this time, but it has been replaced by this meeting.\n` +
                                           `Please check your Hira+ app for more details.`;

                            await sendDXingMessage(user.phoneNumber, message);
                            console.log(`✅ Override notification sent to user ${user.name} (${user.phoneNumber})`);
                            console.log(`📱 Message: ${message}`);
                        } else {
                            console.log(`❌ User not found or no phone number for participant: ${participantId}`);
                        }
                    } catch (notificationError) {
                        console.error('❌ Error sending override notification:', notificationError);
                    }
                } else {
                    console.log(`❌ Schedule NOT overridden: ${conflictingSchedule.title} (Priority: ${schedulePriority} >= Meeting Priority: ${meetingPriority})`);
                }
            }

            // Create new schedule for the meeting
            const newSchedule = new Schedule({
                title: meeting.title,
                subtitle: meeting.type,
                scheduleType: 'Meeting',
                startDateTime: meeting.startDatetime,
                endDateTime: meeting.endDatetime,
                description: meeting.description,
                agendaItems: meeting.agenda ? [meeting.agenda] : [],
                locationLink: meeting.locationLink,
                createdBy: participantId,
                priority: creatorRole === 'super leader' ? 'high' : 'medium',
                meetingReference: meeting._id,
                meetingCreatorRole: creatorRole,
                status: 'active'
            });

            await newSchedule.save();
            createdSchedules.push(newSchedule);

        } catch (error) {
            console.error(`Error creating schedule for participant ${participantId}:`, error);
        }
    }

    console.log(`📊 Schedule Override Summary: ${overriddenSchedules.length} schedules overridden for meeting: ${meeting.title}`);
    return { createdSchedules, overriddenSchedules };
}

// Create a new meeting - accessible by leaders only
router.post('/create', leaderAuth, async (req, res) => {
    try {
        const {
            title,
            type,
            startDatetime,
            endDatetime,
            mode,
            locationLink,
            description,
            agenda,
            reccurence,
            participants
        } = req.body;

        // Validate required fields
        if (!title || !type || !startDatetime || !endDatetime || !mode || !description) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: title, type, startDatetime, endDatetime, mode, description'
            });
        }

        // Validate datetime
        const startDate = new Date(startDatetime);
        const endDate = new Date(endDatetime);
        
        if (startDate >= endDate) {
            return res.status(400).json({
                success: false,
                message: 'End datetime must be after start datetime'
            });
        }

        // Validate participants array
        if (!participants || !Array.isArray(participants) || participants.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'At least one participant is required'
            });
        }

        // Find the role ObjectIds for leader and super leader
        const leaderRole = await Role.findOne({ name: 'leader' });
        const superLeaderRole = await Role.findOne({ name: 'super leader' });
        
        if (!leaderRole || !superLeaderRole) {
            return res.status(500).json({
                success: false,
                message: 'Role configuration error: leader or super leader roles not found'
            });
        }

        // Validate that all participants exist and are leaders or super leaders
        const participantUsers = await User.find({
            _id: { $in: participants },
            role: { $in: [leaderRole._id, superLeaderRole._id] }
        }).populate('role', 'name');

        if (participantUsers.length !== participants.length) {
            return res.status(400).json({
                success: false,
                message: 'Some participants are not valid leaders or super leaders'
            });
        }

        // Create the meeting with pending status
        const newMeeting = new LeadersMeeting({
            title,
            type,
            startDatetime: startDate,
            endDatetime: endDate,
            mode,
            locationLink,
            description,
            agenda,
            reccurence: reccurence || false,
            createdBy: req.user.id,
            status: 'pending'
        });

        // Filter out the creator from participants to avoid duplication
        const otherParticipants = participants.filter(participantId => 
            participantId.toString() !== req.user.id.toString()
        );

        // Initialize other participants with pending status
        newMeeting.participants = otherParticipants.map(participantId => ({
            participant: participantId,
            status: 'pending'
        }));

        // Add the creator as a participant with accepted status
        newMeeting.participants.push({
            participant: req.user.id,
            status: 'accepted',
            responseDate: new Date(),
            responseMessage: 'Meeting creator - automatically accepted'
        });

        const savedMeeting = await newMeeting.save();

        // Populate participants and createdBy for response
        const populatedMeeting = await LeadersMeeting.findById(savedMeeting._id)
            .populate({
                path: 'participants.participant',
                select: 'name phoneNumber role department tags',
                populate: { path: 'tags', select: 'tagName' }
            })
            .populate({
                path: 'createdBy',
                select: 'name phoneNumber role department tags',
                populate: { path: 'tags', select: 'tagName' }
            });

        // Create schedules for all participants (leader meetings are confirmed at creation)
        const { createdSchedules, overriddenSchedules } = await createSchedulesForParticipants(
            populatedMeeting, 
            populatedMeeting.participants, 
            'leader'
        );

        // Send DXing notifications to all participants including the creator
        for (const participantData of populatedMeeting.participants) {
            try {
                const isCreator = participantData.participant._id.toString() === req.user.id;
                await sendMeetingRequestNotification(populatedMeeting, participantData.participant, isCreator);
            } catch (error) {
                console.error(`Failed to send notification to ${participantData.participant.phoneNumber}:`, error);
            }
        }

        res.status(201).json({
            success: true,
            message: 'Meeting request sent successfully',
            data: {
                ...populatedMeeting.toObject(),
                pendingResponses: populatedMeeting.participants.filter(p => p.status === 'pending').length
            }
        });

    } catch (error) {
        console.error('Error creating meeting:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
});

// Create a meeting by super leader - participants are automatically accepted
router.post('/super-leader/create', superLeaderAuth, async (req, res) => {
    try {
        const {
            title,
            type,
            startDatetime,
            endDatetime,
            mode,
            locationLink,
            description,
            agenda,
            reccurence,
            participants
        } = req.body;

        // Validate required fields
        if (!title || !type || !startDatetime || !endDatetime || !mode || !description) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: title, type, startDatetime, endDatetime, mode, description'
            });
        }

        // Validate datetime
        const startDate = new Date(startDatetime);
        const endDate = new Date(endDatetime);
        
        if (startDate >= endDate) {
            return res.status(400).json({
                success: false,
                message: 'End datetime must be after start datetime'
            });
        }

        // Validate participants array
        if (!participants || !Array.isArray(participants) || participants.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'At least one participant is required'
            });
        }

        // Find the role ObjectIds for leader and super leader
        const leaderRole = await Role.findOne({ name: 'leader' });
        const superLeaderRole = await Role.findOne({ name: 'super leader' });
        
        if (!leaderRole || !superLeaderRole) {
            return res.status(500).json({
                success: false,
                message: 'Role configuration error: leader or super leader roles not found'
            });
        }

        // Validate that all participants exist and are leaders or super leaders
        const participantUsers = await User.find({
            _id: { $in: participants },
            role: { $in: [leaderRole._id, superLeaderRole._id] }
        }).populate('role', 'name');

        if (participantUsers.length !== participants.length) {
            return res.status(400).json({
                success: false,
                message: 'Some participants are not valid leaders or super leaders'
            });
        }

        // Create the meeting with confirmed status (super leader meetings are automatically confirmed)
        const newMeeting = new LeadersMeeting({
            title,
            type,
            startDatetime: startDate,
            endDatetime: endDate,
            mode,
            locationLink,
            description,
            agenda,
            reccurence: reccurence || false,
            createdBy: req.user.id,
            status: 'confirmed' // Super leader meetings are automatically confirmed
        });

        // Filter out the creator from participants to avoid duplication
        const otherParticipants = participants.filter(participantId => 
            participantId.toString() !== req.user.id.toString()
        );

        // Initialize other participants with accepted status (all participants are automatically accepted)
        newMeeting.participants = otherParticipants.map(participantId => ({
            participant: participantId,
            status: 'accepted',
            responseDate: new Date(),
            responseMessage: 'Automatically accepted - Super Leader meeting'
        }));

        // Add the creator as a participant with accepted status
        newMeeting.participants.push({
            participant: req.user.id,
            status: 'accepted',
            responseDate: new Date(),
            responseMessage: 'Meeting creator - automatically accepted'
        });

        const savedMeeting = await newMeeting.save();

        // Populate participants and createdBy for response
        const populatedMeeting = await LeadersMeeting.findById(savedMeeting._id)
            .populate({
                path: 'participants.participant',
                select: 'name phoneNumber role department tags',
                populate: { path: 'tags', select: 'tagName' }
            })
            .populate({
                path: 'createdBy',
                select: 'name phoneNumber role department tags',
                populate: { path: 'tags', select: 'tagName' }
            });

        // Create schedules for all participants (super leader meetings are auto-confirmed)
        const { createdSchedules, overriddenSchedules } = await createSchedulesForParticipants(
            populatedMeeting, 
            populatedMeeting.participants, 
            'super leader'
        );

        // Send meeting acknowledgment notifications to all participants
        for (const participantData of populatedMeeting.participants) {
            try {
                const isCreator = participantData.participant._id.toString() === req.user.id;
                await sendSuperLeaderMeetingNotification(populatedMeeting, participantData.participant, isCreator);
            } catch (error) {
                console.error(`Failed to send notification to ${participantData.participant.phoneNumber}:`, error);
            }
        }

        res.status(201).json({
            success: true,
            message: 'Meeting created and participants notified successfully',
            data: {
                ...populatedMeeting.toObject(),
                note: 'All participants automatically accepted'
            }
        });

    } catch (error) {
        console.error('Error creating super leader meeting:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
});

// Route for participants to respond to meeting requests
router.post('/:meetingId/respond', async (req, res) => {
    try {
        const { meetingId } = req.params;
        const { status, message } = req.body; // status: 'accepted' | 'declined'
        
        // Authentication check - allow both leaders and super leaders
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'No authentication token provided'
            });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Get user details
        const user = await User.findById(decoded.id).populate('department', 'title').populate('role', 'name');
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Check if user is leader or super leader
        if (!user.role || (user.role.name !== 'leader' && user.role.name !== 'super leader')) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Only leaders and super leaders can perform this action.'
            });
        }

        const userId = user.id;
        req.user = user; // Add user to request for consistency

        // Validate status
        if (!['accepted', 'declined'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Status must be either "accepted" or "declined"'
            });
        }

        const meeting = await LeadersMeeting.findById(meetingId)
            .populate({
                path: 'participants.participant',
                select: 'name phoneNumber role department tags',
                populate: { path: 'tags', select: 'tagName' }
            })
            .populate({
                path: 'createdBy',
                select: 'name phoneNumber role department tags',
                populate: { path: 'tags', select: 'tagName' }
            });

        if (!meeting) {
            return res.status(404).json({
                success: false,
                message: 'Meeting not found'
            });
        }

        // Check if meeting is still pending
        if (meeting.status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: 'Meeting is no longer accepting responses'
            });
        }

        // Check if user is a participant
        const participantResponse = meeting.participants.find(
            participant => {
                const participantId = typeof participant.participant === 'object' 
                    ? participant.participant._id.toString() 
                    : participant.participant.toString();
                return participantId === userId;
            }
        );

        if (!participantResponse) {
            return res.status(403).json({
                success: false,
                message: 'You are not a participant of this meeting'
            });
        }

        // Check if user already responded
        if (participantResponse.status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: 'You have already responded to this meeting request'
            });
        }

        // Update response
        participantResponse.status = status;
        participantResponse.responseDate = new Date();
        participantResponse.responseMessage = message;

        await meeting.save();

        // Send confirmation or cancellation message to the participant
        try {
            console.log('Sending notification for status:', status);
            console.log('Participant user:', req.user);
            
            if (status === 'accepted') {
                console.log('Sending confirmation to participant...');
                await sendMeetingConfirmationToParticipant(meeting, req.user);
                console.log('Confirmation sent successfully');
            } else if (status === 'declined') {
                console.log('Sending cancellation to participant...');
                await sendMeetingCancellationToParticipant(meeting, req.user);
                console.log('Cancellation sent successfully');
            }
        } catch (error) {
            console.error('Error sending response notification:', error);
        }

        // Meeting status remains pending regardless of participant responses
        // Meetings will happen regardless of participant approvals

        res.status(200).json({
            success: true,
            message: 'Response recorded successfully',
            data: {
                meetingId,
                participantStatus: status,
                totalResponses: meeting.participants.filter(p => p.status !== 'pending').length,
                allResponded: meeting.allParticipantsResponded(),
                allAccepted: meeting.allParticipantsAccepted(),
                meetingStatus: meeting.status,
                note: 'Meeting will proceed regardless of participant responses'
            }
        });

    } catch (error) {
        console.error('Error responding to meeting:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
});

// Get pending meeting requests for current user
router.get('/requests', async (req, res) => {
    try {
        // Authentication check - allow both leaders and super leaders
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'No authentication token provided'
            });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Get user details
        const user = await User.findById(decoded.id).populate('department', 'title').populate('role', 'name');
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Check if user is leader or super leader
        if (!user.role || (user.role.name !== 'leader' && user.role.name !== 'super leader')) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Only leaders and super leaders can perform this action.'
            });
        }

        const userId = user._id; // Use ObjectId instead of string
        req.user = user; // Add user to request for consistency
        
        // Use aggregation for more precise filtering
        const pendingMeetings = await LeadersMeeting.aggregate([
            {
                $match: {
                    status: 'pending',
                    requestExpiry: { $gt: new Date() }
                }
            },
            {
                $addFields: {
                    userParticipation: {
                        $filter: {
                            input: '$participants',
                            as: 'participant',
                            cond: { 
                                $and: [
                                    { $eq: ['$$participant.participant', userId] },
                                    { $eq: ['$$participant.status', 'pending'] }
                                ]
                            }
                        }
                    }
                }
            },
            {
                $match: {
                    'userParticipation.0': { $exists: true } // Only meetings where user has pending status
                }
            },
            {
                $sort: { createdAt: -1 }
            }
        ]);

        // Populate the results
        const populatedMeetings = await LeadersMeeting.populate(pendingMeetings, [
            { path: 'participants.participant', select: 'name phoneNumber role department tags', populate: { path: 'tags', select: 'tagName' } },
            { path: 'createdBy', select: 'name phoneNumber role department tags', populate: { path: 'tags', select: 'tagName' } }
        ]);

        res.status(200).json({
            success: true,
            data: populatedMeetings,
            count: populatedMeetings.length
        });

    } catch (error) {
        console.error('Error fetching meeting requests:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
});

// Get all meetings for current user (created or participating)
router.get('/my-meetings', async (req, res) => {
    try {
        // Authentication check - allow both leaders and super leaders
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'No authentication token provided'
            });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Get user details
        const user = await User.findById(decoded.id).populate('department', 'title').populate('role', 'name');
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Check if user is leader or super leader
        if (!user.role || (user.role.name !== 'leader' && user.role.name !== 'super leader')) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Only leaders and super leaders can perform this action.'
            });
        }

        const userId = user.id;
        req.user = user; // Add user to request for consistency
        
        const myMeetings = await LeadersMeeting.find({
            $or: [
                { createdBy: userId },
                { 'participants.participant': userId }
            ]
        })
        .populate({ path: 'participants.participant', select: 'name phoneNumber role department tags', populate: [{ path: 'tags', select: 'tagName' }, { path: 'role', select: 'name' }] })
        .populate({ path: 'createdBy', select: 'name phoneNumber role department tags', populate: [{ path: 'tags', select: 'tagName' }, { path: 'role', select: 'name' }] })
        .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            data: myMeetings
        });

    } catch (error) {
        console.error('Error fetching my meetings:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
});

// 🏢 GET ALL MEETINGS: List all meetings (Super Leaders only)
router.get('/all-meetings', superLeaderAuth, async (req, res) => {
    try {
        const { 
            page = 1, 
            limit = 20, 
            status, 
            type, 
            createdBy, 
            fromDate, 
            toDate,
            sortBy = 'startDatetime',
            sortOrder = 'desc'
        } = req.query;

        // Build query
        let query = {};

        // Filter by status
        if (status) {
            query.status = status;
        }

        // Filter by meeting type
        if (type) {
            query.type = type;
        }

        // Filter by creator
        if (createdBy) {
            query.createdBy = createdBy;
        }

        // Filter by date range
        if (fromDate || toDate) {
            query.startDatetime = {};
            if (fromDate) query.startDatetime.$gte = new Date(fromDate);
            if (toDate) query.startDatetime.$lte = new Date(toDate);
        }

        // Build sort object
        const sort = {};
        sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

        // Find meetings with pagination
        const meetings = await LeadersMeeting.find(query)
            .populate({
                path: 'createdBy',
                select: 'name phoneNumber role department tags',
                populate: { path: 'tags', select: 'tagName' }
            })
            .populate({
                path: 'participants.participant',
                select: 'name phoneNumber role department tags',
                populate: { path: 'tags', select: 'tagName' }
            })
            .populate({
                path: 'rescheduleRequests.requestedBy',
                select: 'name phoneNumber role department tags',
                populate: { path: 'tags', select: 'tagName' }
            }) // ✅ Populate reschedule request user data
            .sort(sort)
            .limit(limit * 1)
            .skip((page - 1) * limit);

        // Get total count for pagination
        const total = await LeadersMeeting.countDocuments(query);

        // Calculate statistics
        const allMeetings = await LeadersMeeting.find(query);
        const stats = {
            total: allMeetings.length,
            pending: allMeetings.filter(m => m.status === 'pending').length,
            confirmed: allMeetings.filter(m => m.status === 'confirmed').length,
            cancelled: allMeetings.filter(m => m.status === 'cancelled').length,
            expired: allMeetings.filter(m => m.status === 'expired').length,
            byType: {},
            byCreator: {}
        };

        // Calculate type statistics
        allMeetings.forEach(meeting => {
            stats.byType[meeting.type] = (stats.byType[meeting.type] || 0) + 1;
        });

        // Calculate creator statistics
        allMeetings.forEach(meeting => {
            const creatorRole = meeting.createdBy?.role || 'unknown';
            stats.byCreator[creatorRole] = (stats.byCreator[creatorRole] || 0) + 1;
        });

        // Transform meetings data for response
        const transformedMeetings = meetings.map(meeting => ({
            _id: meeting._id,
            title: meeting.title,
            type: meeting.type,
            mode: meeting.mode,
            startDatetime: meeting.startDatetime,
            endDatetime: meeting.endDatetime,
            locationLink: meeting.locationLink,
            description: meeting.description,
            agenda: meeting.agenda,
            status: meeting.status,
            createdBy: meeting.createdBy,
            participants: meeting.participants,
            participantCount: meeting.participants.length,
            acceptedCount: meeting.participants.filter(p => p.status === 'accepted').length,
            pendingCount: meeting.participants.filter(p => p.status === 'pending').length,
            declinedCount: meeting.participants.filter(p => p.status === 'declined').length,
            rescheduleRequests: meeting.rescheduleRequests || [], // ✅ Include actual reschedule requests
            rescheduleRequestsCount: meeting.rescheduleRequests?.length || 0,
            createdAt: meeting.createdAt,
            updatedAt: meeting.updatedAt,
            requestExpiry: meeting.requestExpiry
        }));

        res.json({
            success: true,
            data: {
                meetings: transformedMeetings,
                statistics: stats,
                pagination: {
                    current: parseInt(page),
                    pages: Math.ceil(total / limit),
                    total,
                    limit: parseInt(limit)
                },
                filters: {
                    status: status || 'all',
                    type: type || 'all',
                    createdBy: createdBy || 'all',
                    dateRange: {
                        from: fromDate || null,
                        to: toDate || null
                    }
                }
            }
        });

    } catch (error) {
        console.error('Get all meetings error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Public: Get details of a specific meeting (no authentication required)
router.get('/:meetingId', async (req, res) => {
	try {
		const { meetingId } = req.params;

		if (!meetingId || !meetingId.match(/^[0-9a-fA-F]{24}$/)) {
			return res.status(400).json({ success: false, message: 'Invalid meeting ID' });
		}

		const meeting = await LeadersMeeting.findById(meetingId)
			.populate({ path: 'participants.participant', select: 'name phoneNumber role department tags', populate: { path: 'tags', select: 'tagName' } })
			.populate({ path: 'createdBy', select: 'name phoneNumber role department tags', populate: { path: 'tags', select: 'tagName' } });

		if (!meeting) {
			return res.status(404).json({ success: false, message: 'Meeting not found' });
		}

		const totalParticipants = meeting.participants.length;
		const acceptedCount = meeting.participants.filter(p => p.status === 'accepted').length;
		const declinedCount = meeting.participants.filter(p => p.status === 'declined').length;
		const pendingCount = meeting.participants.filter(p => p.status === 'pending').length;

		const responseData = {
			...meeting.toObject(),
			userResponse: null,
			statistics: {
				totalParticipants,
				acceptedCount,
				declinedCount,
				pendingCount,
				allResponded: meeting.allParticipantsResponded(),
				allAccepted: meeting.allParticipantsAccepted()
			},
			canRespond: false,
			canDelete: false,
			canCancel: false,
			note: 'Meeting will proceed regardless of participant responses'
		};

		return res.status(200).json({ success: true, data: responseData });
	} catch (error) {
		console.error('Error fetching meeting details:', error);
		return res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
	}
});

// Update a meeting - ONLY the creator can update their meeting
router.put('/:meetingId', async (req, res) => {
	try {
		const { meetingId } = req.params;

		// Authentication check - allow both leaders and super leaders
		const token = req.header('Authorization')?.replace('Bearer ', '');
		if (!token) {
			return res.status(401).json({ success: false, message: 'No authentication token provided' });
		}

		const decoded = jwt.verify(token, process.env.JWT_SECRET);
		const user = await User.findById(decoded.id).populate('department', 'title').populate('role', 'name');
		if (!user) {
			return res.status(404).json({ success: false, message: 'User not found' });
		}
		if (!user.role || (user.role.name !== 'leader' && user.role.name !== 'super leader')) {
			return res.status(403).json({ success: false, message: 'Access denied. Only leaders and super leaders can perform this action.' });
		}

		// Validate meeting ID
		if (!meetingId || !meetingId.match(/^[0-9a-fA-F]{24}$/)) {
			return res.status(400).json({ success: false, message: 'Invalid meeting ID' });
		}

		// Load meeting with creator details
		const meeting = await LeadersMeeting.findById(meetingId).populate('createdBy', 'name phoneNumber role');
		if (!meeting) {
			return res.status(404).json({ success: false, message: 'Meeting not found' });
		}

		// ✅ ONLY THE CREATOR CAN UPDATE - regardless of their role (leader or super leader)
		const isCreator = meeting.createdBy._id.toString() === user.id;
		if (!isCreator) {
			return res.status(403).json({
				success: false,
				message: 'Access denied. Only the meeting creator can update this meeting.'
			});
		}

		console.log(`✅ Meeting update authorized for creator: ${user.name} (${user.role.name})`);

		// Collect updatable fields
		const {
			title,
			type,
			startDatetime,
			endDatetime,
			mode,
			locationLink,
			description,
			agenda,
			reccurence,
			participants // optional: array of userIds
		} = req.body;

		// Validate date range if provided
		if (startDatetime || endDatetime) {
			const newStart = startDatetime ? new Date(startDatetime) : meeting.startDatetime;
			const newEnd = endDatetime ? new Date(endDatetime) : meeting.endDatetime;
			if (newStart >= newEnd) {
				return res.status(400).json({ success: false, message: 'End datetime must be after start datetime' });
			}
			meeting.startDatetime = newStart;
			meeting.endDatetime = newEnd;
		}

		// Update fields if provided
		if (typeof title === 'string') meeting.title = title;
		if (typeof type === 'string') meeting.type = type;
		if (typeof mode === 'string') meeting.mode = mode;
		if (typeof locationLink === 'string') meeting.locationLink = locationLink;
		if (typeof description === 'string') meeting.description = description;
		if (typeof agenda === 'string') meeting.agenda = agenda;
		if (typeof reccurence === 'boolean') meeting.reccurence = reccurence;

		// Optionally update participants list
		if (Array.isArray(participants)) {
			// Validate all participants exist and are leaders/super leaders
			// Note: This will need to be updated after migration to use ObjectId references
			const participantUsers = await User.find({ _id: { $in: participants }, role: { $in: ['leader', 'super leader'] } });
			if (participantUsers.length !== participants.length) {
				return res.status(400).json({ success: false, message: 'Some participants are not valid leaders or super leaders' });
			}

			// Map existing statuses
			const existingById = new Map(
				meeting.participants.map(p => [p.participant.toString(), { status: p.status, responseDate: p.responseDate, responseMessage: p.responseMessage }])
			);

			const creatorId = meeting.createdBy._id.toString();
			const meetingIsAutoConfirmed = meeting.status === 'confirmed' && meeting.createdBy.role && meeting.createdBy.role.name === 'super leader';

			const rebuilt = participants.map(pid => {
				const pidStr = pid.toString();
				if (pidStr === creatorId) {
					return { participant: pid, status: 'accepted', responseDate: new Date(), responseMessage: 'Meeting creator - automatically accepted' };
				}
				const existing = existingById.get(pidStr);
				if (existing) {
					return { participant: pid, status: existing.status, responseDate: existing.responseDate, responseMessage: existing.responseMessage };
				}
				return { participant: pid, status: meetingIsAutoConfirmed ? 'accepted' : 'pending' };
			});

			// Ensure creator is present
			if (!rebuilt.find(p => p.participant.toString() === creatorId)) {
				rebuilt.push({ participant: creatorId, status: 'accepted', responseDate: new Date(), responseMessage: 'Meeting creator - automatically accepted' });
			}

			meeting.participants = rebuilt;
		}

		const saved = await meeting.save();
		const populated = await LeadersMeeting.findById(saved._id)
			.populate('participants.participant', 'name phoneNumber role department tags')
			.populate('createdBy', 'name phoneNumber role department tags');

		// Update corresponding schedules if meeting time changed
		if (startDatetime || endDatetime) {
			const Schedule = require('../models/schedule');
			await Schedule.updateMany(
				{ meetingReference: saved._id },
				{
					startDateTime: saved.startDatetime,
					endDateTime: saved.endDatetime
				}
			);
			console.log(`📅 Updated schedules for meeting: ${saved.title}`);
		}

		// 🔔 SEND NOTIFICATION TO ALL PARTICIPANTS ABOUT MEETING UPDATE
		try {
			const populatedMeeting = await LeadersMeeting.findById(saved._id)
				.populate({
					path: 'participants.participant',
					select: 'name phoneNumber role department tags',
					populate: { path: 'tags', select: 'tagName' }
				})
				.populate({
					path: 'createdBy',
					select: 'name phoneNumber role department tags',
					populate: { path: 'tags', select: 'tagName' }
				});

			for (const participantData of populatedMeeting.participants) {
				try {
					const isCreator = participantData.participant._id.toString() === user.id;
					if (!isCreator) { // Don't send notification to the creator
						                        const message = `📝 Meeting Updated: ${populatedMeeting.title}\n\n` +
									   `The meeting has been updated by ${user.name}.\n\n` +
									   `Updated Details:\n` +
									   `📅 Date: ${new Date(populatedMeeting.startDatetime).toLocaleString('en-US', { timeZone: 'Asia/Kolkata' })}\n` +
									   `⏰ Time: ${new Date(populatedMeeting.startDatetime).toLocaleTimeString('en-US', { timeZone: 'Asia/Kolkata' })} - ${new Date(populatedMeeting.endDatetime).toLocaleTimeString('en-US', { timeZone: 'Asia/Kolkata' })}\n` +
									   `📍 Mode: ${populatedMeeting.mode}\n` +
									   `📝 Description: ${populatedMeeting.description}\n\n` +
									   `Please check your Hira+ app for the latest details.`;

						await sendDXingMessage(participantData.participant.phoneNumber, message);
						console.log(`📱 Update notification sent to: ${participantData.participant.name}`);
					}
				} catch (error) {
					console.error(`Failed to send update notification to ${participantData.participant.phoneNumber}:`, error);
				}
			}
		} catch (notificationError) {
			console.error('Error sending meeting update notifications:', notificationError);
		}

		return res.status(200).json({ 
			success: true, 
			message: 'Meeting updated successfully', 
			data: populated 
		});
	} catch (error) {
		console.error('Error updating meeting:', error);
		return res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
	}
});

// Delete a meeting - only creator and super leaders can delete
router.delete('/:meetingId', async (req, res) => {
    try {
        const { meetingId } = req.params;
        
        // Authentication check - allow both leaders and super leaders
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'No authentication token provided'
            });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Get user details
        const user = await User.findById(decoded.id).populate('department', 'title').populate('role', 'name');
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Check if user is leader or super leader
        if (!user.role || (user.role.name !== 'leader' && user.role.name !== 'super leader')) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Only leaders and super leaders can perform this action.'
            });
        }

        const userId = user.id;
        req.user = user; // Add user to request for consistency

        // Validate meeting ID
        if (!meetingId || !meetingId.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid meeting ID'
            });
        }

        // Find the meeting with creator details
        const meeting = await LeadersMeeting.findById(meetingId)
            .populate('createdBy', 'name phoneNumber role');
        
        if (!meeting) {
            return res.status(404).json({
                success: false,
                message: 'Meeting not found'
            });
        }

        // Check if user is the creator of the meeting
        const isCreator = meeting.createdBy._id.toString() === userId;
        const isSuperLeader = user.role && user.role.name === 'super leader';
        const creatorIsLeader = meeting.createdBy.role && meeting.createdBy.role.name === 'leader';

        // Permission logic:
        // 1. If creator is leader: only creator AND super leaders can delete
        // 2. If creator is super leader: only creator can delete
        let canDelete = false;
        
        if (creatorIsLeader) {
            // If leader created meeting: creator OR super leader can delete
            canDelete = isCreator || isSuperLeader;
        } else {
            // If super leader created meeting: only creator can delete
            canDelete = isCreator;
        }

        if (!canDelete) {
            return res.status(403).json({
                success: false,
                message: creatorIsLeader 
                    ? 'Only the meeting creator or super leaders can delete this meeting'
                    : 'Only the meeting creator can delete this meeting'
            });
        }

        // Delete the meeting
        await LeadersMeeting.findByIdAndDelete(meetingId);

        // Delete corresponding schedules
        const Schedule = require('../models/schedule');
        await Schedule.deleteMany({ meetingReference: meetingId });

        // 🔄 RESTORE OVERRIDDEN SCHEDULES
        const restoredSchedules = await Schedule.find({
            'overriddenBy.meetingId': meetingId,
            status: 'cancelled'
        });

        const restoredCount = restoredSchedules.length;
        
        if (restoredCount > 0) {
            // Restore all schedules that were overridden by this meeting
            await Schedule.updateMany(
                {
                    'overriddenBy.meetingId': meetingId,
                    status: 'cancelled'
                },
                {
                    status: 'active',
                    $unset: { overriddenBy: 1 } // Remove the overriddenBy field
                }
            );

            // 🔔 SEND NOTIFICATIONS TO USERS WHOSE SCHEDULES WERE RESTORED
            for (const schedule of restoredSchedules) {
                try {
                    const user = await User.findById(schedule.createdBy);
                    if (user && user.phoneNumber) {
                        const message = `🔄 Schedule Restored\n\n` +
                                       `Your schedule "${schedule.title}" has been restored.\n\n` +
                                       `Restored Schedule:\n` +
                                       `📅 Date: ${new Date(schedule.startDateTime).toLocaleString('en-US', { timeZone: 'Asia/Kolkata' })}\n` +
                                       `⏰ Time: ${new Date(schedule.startDateTime).toLocaleTimeString('en-US', { timeZone: 'Asia/Kolkata' })} - ${new Date(schedule.endDateTime).toLocaleTimeString('en-US', { timeZone: 'Asia/Kolkata' })}\n` +
                                       `📝 Type: ${schedule.scheduleType}\n\n` +
                                       `Reason: The meeting that overrode this schedule has been cancelled.\n` +
                                       `Please check your Hira+ app for details.`;

                        await sendDXingMessage(user.phoneNumber, message);
                        console.log(`Restoration notification sent to user ${user.name} (${user.phoneNumber})`);
                    }
                } catch (notificationError) {
                    console.error('Error sending restoration notification:', notificationError);
                }
            }
        }

        res.status(200).json({
            success: true,
            message: `Meeting deleted successfully${restoredCount > 0 ? `. ${restoredCount} overridden schedule(s) restored.` : ''}`,
            data: {
                deletedMeeting: meetingId,
                restoredSchedulesCount: restoredCount
            }
        });

    } catch (error) {
        console.error('Error deleting meeting:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
});

// 📋 GET: Get reschedule requests for meetings created by current user
router.get('/reschedule-requests', async (req, res) => {
    try {
        // Authentication check - allow both leaders and super leaders
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'No authentication token provided'
            });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Get user details
        const user = await User.findById(decoded.id).populate('department', 'title').populate('role', 'name');
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Check if user is leader or super leader
        if (!user.role || (user.role.name !== 'leader' && user.role.name !== 'super leader')) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Only leaders and super leaders can perform this action.'
            });
        }

        const userId = user.id;

        // Get meetings created by the user
        const userMeetings = await LeadersMeeting.find({
            createdBy: userId
        }).select('_id title startDatetime endDatetime');

        const meetingIds = userMeetings.map(meeting => meeting._id);

        // Get reschedule requests for these meetings
        const Schedule = require('../models/schedule');
        const rescheduleRequests = await Schedule.find({
            meetingReference: { $in: meetingIds },
            'rescheduleRequest.status': 'pending'
        })
        .populate('createdBy', 'name phoneNumber')
        .populate('meetingReference', 'title startDatetime endDatetime')
        .sort({ 'rescheduleRequest.requestedAt': -1 });

        res.status(200).json({
            success: true,
            data: rescheduleRequests
        });

    } catch (error) {
        console.error('Error fetching reschedule requests:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
});

module.exports = router;
