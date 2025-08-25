const express = require('express');
const router = express.Router();
const Schedule = require('../models/schedule');
const { leaderOrSuperLeaderAuth } = require('../middleware/leaderAuth');

// Helper function to generate recurring schedules
function generateRecurringSchedules(mainSchedule, recurrencePattern) {
  if (!recurrencePattern || !recurrencePattern.frequency) {
    return [];
  }

  const { frequency, interval, endDate, daysOfWeek } = recurrencePattern;
  const schedules = [];
  const startDate = new Date(mainSchedule.startDateTime);
  const endDateObj = endDate ? new Date(endDate) : new Date(startDate.getTime() + (365 * 24 * 60 * 60 * 1000));
  const duration = new Date(mainSchedule.endDateTime) - new Date(mainSchedule.startDateTime);

  let currentDate = new Date(startDate);
  let count = 0;
  const maxSchedules = 100;

  while (currentDate <= endDateObj && count < maxSchedules) {
    let shouldCreate = false;

    switch (frequency) {
      case 'daily':
        shouldCreate = true;
        break;
      case 'weekly':
        const dayOfWeek = currentDate.getDay();
        shouldCreate = daysOfWeek.includes(dayOfWeek);
        break;
      case 'monthly':
        shouldCreate = currentDate.getDate() === startDate.getDate();
        break;
    }

    if (shouldCreate) {
      const scheduleEndDate = new Date(currentDate.getTime() + duration);
      
      const schedule = new Schedule({
        title: mainSchedule.title,
        subtitle: mainSchedule.subtitle,
        scheduleType: mainSchedule.scheduleType,
        startDateTime: new Date(currentDate),
        endDateTime: scheduleEndDate,
        description: mainSchedule.description,
        agendaItems: mainSchedule.agendaItems,
        locationLink: mainSchedule.locationLink,
        recurring: mainSchedule.recurring, // Use the same recurring value as main schedule
        recurringGroupId: mainSchedule.recurring ? mainSchedule._id : null, // Only set group ID if recurring
        createdBy: mainSchedule.createdBy
      });

      schedules.push(schedule);
      count++;
    }

    // Move to next occurrence
    switch (frequency) {
      case 'daily':
        currentDate.setDate(currentDate.getDate() + interval);
        break;
      case 'weekly':
        currentDate.setDate(currentDate.getDate() + (7 * interval));
        break;
      case 'monthly':
        currentDate.setMonth(currentDate.getMonth() + interval);
        break;
    }
  }

  return schedules;
}

// 🎯 CREATE: Add new schedule entries
router.post('/', leaderOrSuperLeaderAuth, async (req, res) => {
  try {
    const {
      title,
      subtitle,
      scheduleType,
      startDateTime,
      endDateTime,
      description,
      agendaItems,
      locationLink,
      recurring,
      recurrencePattern
    } = req.body;

    // Validate required fields
    if (!title || !scheduleType || !startDateTime || !endDateTime) {
      return res.status(400).json({
        success: false,
        message: 'Title, schedule type, start date, and end date are required'
      });
    }

    // Validate date range
    if (new Date(endDateTime) <= new Date(startDateTime)) {
      return res.status(400).json({
        success: false,
        message: 'End date must be after start date'
      });
    }

    // Validate recurrence pattern if recurring is true
    if (recurring && (!recurrencePattern || !recurrencePattern.frequency)) {
      return res.status(400).json({
        success: false,
        message: 'Recurrence pattern is required when recurring is true'
      });
    }

    const schedule = new Schedule({
      title,
      subtitle,
      scheduleType,
      startDateTime,
      endDateTime,
      description,
      agendaItems: agendaItems || [],
      locationLink,
      recurring: recurring || false,
      recurrencePattern: recurrencePattern || null,
      createdBy: req.user._id
    });

    await schedule.save();

    // Generate recurring schedules if needed
    let createdSchedules = [schedule];
    if (recurring && recurrencePattern) {
      const recurringSchedules = generateRecurringSchedules(schedule, recurrencePattern);
      if (recurringSchedules.length > 0) {
        const savedRecurringSchedules = await Schedule.insertMany(recurringSchedules);
        createdSchedules = [schedule, ...savedRecurringSchedules];
      }
    }

    res.status(201).json({
      success: true,
      message: recurring && createdSchedules.length > 1 
        ? `Created ${createdSchedules.length} schedules successfully (1 main + ${createdSchedules.length - 1} recurring)`
        : 'Schedule created successfully',
      data: createdSchedules,
      count: createdSchedules.length
    });

  } catch (error) {
    console.error('Create schedule error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// 📝 EDIT: Modify existing schedules
router.put('/:id', leaderOrSuperLeaderAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      subtitle,
      scheduleType,
      startDateTime,
      endDateTime,
      description,
      agendaItems,
      locationLink,
      recurring
    } = req.body;

    // Find schedule and check ownership
    const schedule = await Schedule.findById(id);
    
    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: 'Schedule not found'
      });
    }

    // Check if user is the creator or super leader
    if (schedule.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'super leader') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only edit your own schedules.'
      });
    }

    // Validate date range if dates are being updated
    if (startDateTime && endDateTime) {
      if (new Date(endDateTime) <= new Date(startDateTime)) {
        return res.status(400).json({
          success: false,
          message: 'End date must be after start date'
        });
      }
    }

    // Update schedule
    const updatedSchedule = await Schedule.findByIdAndUpdate(
      id,
      {
        title,
        subtitle,
        scheduleType,
        startDateTime,
        endDateTime,
        description,
        agendaItems,
        locationLink,
        recurring
      },
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Schedule updated successfully',
      data: updatedSchedule
    });

  } catch (error) {
    console.error('Update schedule error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// 🗑️ DELETE: Remove schedule entries
router.delete('/:id', leaderOrSuperLeaderAuth, async (req, res) => {
  try {
    const { id } = req.params;

    // Find schedule and check ownership
    const schedule = await Schedule.findById(id);
    
    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: 'Schedule not found'
      });
    }

    // Check if user is the creator or super leader
    if (schedule.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'super leader') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only delete your own schedules.'
      });
    }

    await Schedule.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Schedule deleted successfully'
    });

  } catch (error) {
    console.error('Delete schedule error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});







// 🔍 DEBUG: Get schedule override information
router.get('/debug/:id', leaderOrSuperLeaderAuth, async (req, res) => {
  try {
    const { id } = req.params;
    
    const schedule = await Schedule.findById(id)
      .populate('overriddenBy.meetingId', 'title startDatetime endDatetime createdBy')
      .populate('createdBy', 'name phoneNumber');
    
    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: 'Schedule not found'
      });
    }

    // Check if user is the creator or super leader
    if (schedule.createdBy._id.toString() !== req.user._id.toString() && req.user.role !== 'super leader') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.json({
      success: true,
      data: {
        schedule,
        overrideInfo: {
          isOverridden: schedule.status === 'cancelled' && schedule.overriddenBy,
          overriddenBy: schedule.overriddenBy,
          canBeRestored: schedule.overriddenBy && schedule.overriddenBy.meetingId
        }
      }
    });

  } catch (error) {
    console.error('Debug schedule error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// 📊 GET: Get all schedules for the authenticated user
router.get('/', leaderOrSuperLeaderAuth, async (req, res) => {
  try {
    const { page = 1, limit = 20, scheduleType, startDate, endDate } = req.query;
    
    const query = { createdBy: req.user._id };
    
    // Apply filters
    if (scheduleType) {
      query.scheduleType = scheduleType;
    }
    
    if (startDate && endDate) {
      query.startDateTime = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const schedules = await Schedule.find(query)
      .populate('overriddenBy.meetingId', 'title startDatetime endDatetime')
      .sort({ startDateTime: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Schedule.countDocuments(query);

    res.json({
      success: true,
      data: schedules,
      total: total, // Total number of schedules for the user
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });

  } catch (error) {
    console.error('Get schedules error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// 📋 GET: Get specific schedule by ID
router.get('/:id', leaderOrSuperLeaderAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const schedule = await Schedule.findById(id);
    
    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: 'Schedule not found'
      });
    }

    // Check if user is the creator or super leader
    if (schedule.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'super leader') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only view your own schedules.'
      });
    }

    res.json({
      success: true,
      data: schedule
    });

  } catch (error) {
    console.error('Get schedule error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// 🔍 CHECK CONFLICTS: Check for schedule conflicts
router.post('/check-conflicts', leaderOrSuperLeaderAuth, async (req, res) => {
  try {
    const { startDateTime, endDateTime, userId } = req.body;

    // Validate required fields
    if (!startDateTime || !endDateTime) {
      return res.status(400).json({
        success: false,
        message: 'Start date and end date are required'
      });
    }

    // Use provided userId or current user's ID
    const targetUserId = userId || req.user._id;

    // Check for conflicting schedules
    const conflictingSchedules = await Schedule.find({
      createdBy: targetUserId,
      status: 'active',
      $or: [
        {
          startDateTime: { $lt: new Date(endDateTime) },
          endDateTime: { $gt: new Date(startDateTime) }
        }
      ]
    }).sort({ priority: -1, startDateTime: 1 });

    // Check for conflicting meetings (user is participant)
    const LeadersMeeting = require('../models/leadersMeetng');
    const conflictingMeetings = await LeadersMeeting.find({
      'participants.participant': targetUserId,
      status: { $in: ['pending', 'confirmed'] },
      $or: [
        {
          startDatetime: { $lt: new Date(endDateTime) },
          endDatetime: { $gt: new Date(startDateTime) }
        }
      ]
    }).populate('participants.participant', 'name phoneNumber')
      .populate('createdBy', 'name phoneNumber role')
      .sort({ startDatetime: 1 });

    res.json({
      success: true,
      data: {
        conflictingSchedules,
        conflictingMeetings,
        hasConflicts: conflictingSchedules.length > 0 || conflictingMeetings.length > 0
      }
    });

  } catch (error) {
    console.error('Check conflicts error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// 📝 RESCHEDULE REQUEST: Request reschedule for a schedule
router.post('/:id/reschedule-request', leaderOrSuperLeaderAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { suggestedTime, reason } = req.body;

    // Validate required fields
    if (!suggestedTime || !reason) {
      return res.status(400).json({
        success: false,
        message: 'Suggested time and reason are required'
      });
    }

    const schedule = await Schedule.findById(id);
    
    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: 'Schedule not found'
      });
    }

    // Check if user is the creator of the schedule
    if (schedule.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only request reschedule for your own schedules.'
      });
    }

    // Update reschedule request
    schedule.rescheduleRequest = {
      suggestedTime: new Date(suggestedTime),
      reason,
      status: 'pending',
      requestedBy: req.user._id,
      requestedAt: new Date()
    };

    await schedule.save();

    res.json({
      success: true,
      message: 'Reschedule request sent successfully',
      data: schedule
    });

  } catch (error) {
    console.error('Reschedule request error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ✅ RESCHEDULE APPROVAL: Approve/reject reschedule request
router.put('/:id/reschedule-approval', leaderOrSuperLeaderAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, newTime } = req.body; // status: 'approved' | 'rejected'

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status must be either "approved" or "rejected"'
      });
    }

    const schedule = await Schedule.findById(id);
    
    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: 'Schedule not found'
      });
    }

    // Check if user is the meeting creator OR super leader (for meeting-linked schedules)
    if (schedule.meetingReference) {
      const LeadersMeeting = require('../models/leadersMeetng');
      const meeting = await LeadersMeeting.findById(schedule.meetingReference);
      
      if (!meeting) {
        return res.status(404).json({
          success: false,
          message: 'Meeting not found'
        });
      }

      const isMeetingCreator = meeting.createdBy.toString() === req.user._id.toString();
      const isSuperLeader = req.user.role === 'super leader';

      if (!isMeetingCreator && !isSuperLeader) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Only meeting creator or super leaders can approve reschedule requests.'
        });
      }
    } else {
      // For non-meeting schedules, only creator can approve
      if (schedule.createdBy.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Only schedule creator can approve reschedule requests.'
        });
      }
    }

    // Update reschedule request status
    schedule.rescheduleRequest.status = status;

    if (status === 'approved' && newTime) {
      // Update schedule time
      schedule.startDateTime = new Date(newTime);
      schedule.endDateTime = new Date(new Date(newTime).getTime() + 
        (schedule.endDateTime - schedule.startDateTime));
      
      // If this is a meeting-linked schedule, update the meeting too
      if (schedule.meetingReference) {
        const LeadersMeeting = require('../models/leadersMeetng');
        await LeadersMeeting.findByIdAndUpdate(schedule.meetingReference, {
          startDatetime: schedule.startDateTime,
          endDatetime: schedule.endDateTime
        });

        // Update all participant schedules
        await Schedule.updateMany(
          { meetingReference: schedule.meetingReference },
          {
            startDateTime: schedule.startDateTime,
            endDateTime: schedule.endDateTime
          }
        );

        // 🔔 NOTIFY ALL PARTICIPANTS ABOUT RESCHEDULE
        const meeting = await LeadersMeeting.findById(schedule.meetingReference)
          .populate('participants.participant', 'name phoneNumber')
          .populate('createdBy', 'name phoneNumber');

        // Send notification to all participants
        for (const participantData of meeting.participants) {
          try {
            const message = `🔄 Meeting Rescheduled: ${meeting.title}\n\n` +
                           `📅 New Date: ${schedule.startDateTime.toLocaleString()}\n` +
                           `📍 Location: ${meeting.locationLink || 'TBD'}\n` +
                           `📝 Description: ${meeting.description}\n\n` +
                           `The meeting time has been changed. Please update your calendar.\n` +
                           `Thank you!`;

            await sendDXingMessage(participantData.participant.phoneNumber, message);
          } catch (error) {
            console.error(`Failed to send reschedule notification to ${participantData.participant.phoneNumber}:`, error);
          }
        }

        // Send notification to meeting creator about approval
        try {
          const requester = await User.findById(schedule.rescheduleRequest.requestedBy);
          const message = `✅ Reschedule Request Approved\n\n` +
                         `Meeting: ${meeting.title}\n` +
                         `Requested by: ${requester.name}\n` +
                         `New time: ${schedule.startDateTime.toLocaleString()}\n` +
                         `All participants have been notified.`;

          await sendDXingMessage(meeting.createdBy.phoneNumber, message);
        } catch (error) {
          console.error(`Failed to send approval notification to meeting creator:`, error);
        }
      }
    } else if (status === 'rejected' && schedule.meetingReference) {
      // Send rejection notification to requester
      try {
        const LeadersMeeting = require('../models/leadersMeetng');
        const meeting = await LeadersMeeting.findById(schedule.meetingReference)
          .populate('createdBy', 'name phoneNumber');

        const requester = await User.findById(schedule.rescheduleRequest.requestedBy);
        const message = `❌ Reschedule Request Rejected\n\n` +
                       `Meeting: ${meeting.title}\n` +
                       `Requested by: ${requester.name}\n` +
                       `Reason: ${schedule.rescheduleRequest.reason}\n` +
                       `The meeting will remain at the original time.`;

        await sendDXingMessage(requester.phoneNumber, message);
      } catch (error) {
        console.error(`Failed to send rejection notification to requester:`, error);
      }
    }

    await schedule.save();

    res.json({
      success: true,
      message: `Reschedule request ${status} successfully`,
      data: schedule
    });

  } catch (error) {
    console.error('Reschedule approval error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Helper function to send DXing message (same as in leadersMeetings.js)
async function sendDXingMessage(phoneNumber, message) {
  try {
    const axios = require('axios');
    
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

module.exports = router;
