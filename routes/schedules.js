const express = require('express');
const router = express.Router();
const Schedule = require('../models/schedule');
const LeadersMeeting = require('../models/leadersMeetng');
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

  // Skip the first occurrence as it's already created as the main schedule
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
        recurring: false, // Generated instances are not recurring themselves
        recurringGroupId: mainSchedule._id, // Link to the main recurring schedule
        createdBy: mainSchedule.createdBy,
        priority: mainSchedule.priority || 'low'
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

    // If recurring, check for existing recurring schedules with same title and time to prevent duplicates
    if (recurring && recurrencePattern) {
      const existingRecurring = await Schedule.findOne({
        title: title,
        createdBy: req.user._id,
        recurring: true,
        startDateTime: new Date(startDateTime),
        endDateTime: new Date(endDateTime)
      });

      if (existingRecurring) {
        return res.status(400).json({
          success: false,
          message: 'A recurring schedule with this title and time already exists'
        });
      }
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
    if (schedule.createdBy.toString() !== req.user._id.toString() && (!req.user.role || req.user.role.name !== 'super leader')) {
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
    if (schedule.createdBy.toString() !== req.user._id.toString() && (!req.user.role || req.user.role.name !== 'super leader')) {
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
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// 📊 GET: Get all schedules for the authenticated user
router.get('/', leaderOrSuperLeaderAuth, async (req, res) => {
  try {
    const { scheduleType, startDate, endDate } = req.query;
    
    // Get all schedules created by the user (both regular and meeting schedules)
    const userSchedules = await Schedule.find({ createdBy: req.user._id })
      .populate('createdBy', 'name phoneNumber role department')
      .populate({
        path: 'meetingReference',
        select: 'title startDatetime endDatetime createdBy participants',
        model: 'LeadersMeeting',
        populate: {
          path: 'participants.participant',
          select: 'name phoneNumber role department'
        }
      })
      .sort({ startDateTime: 1 });

    // Apply filters
    let filteredSchedules = userSchedules;
    
    if (scheduleType) {
      filteredSchedules = filteredSchedules.filter(schedule => schedule.scheduleType === scheduleType);
    }
    
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      filteredSchedules = filteredSchedules.filter(schedule => 
        schedule.startDateTime >= start && schedule.startDateTime <= end
      );
    }

    // Return all filtered schedules (no pagination)
    const total = filteredSchedules.length;

    res.json({
      success: true,
      data: filteredSchedules,
      total: total
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// 📋 GET RESCHEDULE REQUESTS: Get all reschedule requests for meetings created by the user
router.get('/reschedule-requests', leaderOrSuperLeaderAuth, async (req, res) => {
  try {
    const { status, fromDate, toDate } = req.query;

    // Find all meetings created by the current user that have reschedule requests
    const LeadersMeeting = require('../models/leadersMeetng');
    const User = require('../models/User');

    let query = {
      createdBy: req.user._id,
      rescheduleRequests: { $exists: true, $ne: [] }
    };

    // Filter by reschedule request status
    if (status) {
      query['rescheduleRequests.status'] = status;
    }

    // Filter by date range
    if (fromDate || toDate) {
      const dateFilter = {};
      if (fromDate) dateFilter.$gte = new Date(fromDate);
      if (toDate) dateFilter.$lte = new Date(toDate);
      query['rescheduleRequests.requestedAt'] = dateFilter;
    }

    const meetings = await LeadersMeeting.find(query)
      .populate({ path: 'createdBy', select: 'name phoneNumber role', populate: { path: 'role', select: 'name' } })
      .populate({ path: 'rescheduleRequests.requestedBy', select: 'name phoneNumber role', populate: { path: 'role', select: 'name' } })
      .populate('rescheduleRequests.affectedScheduleId', 'title scheduleType startDateTime endDateTime')
      .sort({ 'rescheduleRequests.requestedAt': -1 });

    // Transform the data to flatten reschedule requests
    const rescheduleRequests = [];
    
    meetings.forEach(meeting => {
      meeting.rescheduleRequests.forEach(request => {
        rescheduleRequests.push({
          _id: request._id,
          meeting: {
            _id: meeting._id,
            title: meeting.title,
            startDatetime: meeting.startDatetime,
            endDatetime: meeting.endDatetime,
            type: meeting.type,
            mode: meeting.mode,
            locationLink: meeting.locationLink,
            createdBy: meeting.createdBy
          },
          requestedBy: request.requestedBy,
          suggestedTime: request.suggestedTime,
          reason: request.reason,
          status: request.status,
          requestedAt: request.requestedAt,
          responseDate: request.responseDate,
          responseMessage: request.responseMessage,
          affectedSchedule: request.affectedScheduleId
        });
      });
    });

    // Apply additional filtering if needed
    let filteredRequests = rescheduleRequests;

    // Filter by status (if not already filtered in query)
    if (status && !query['rescheduleRequests.status']) {
      filteredRequests = filteredRequests.filter(request => request.status === status);
    }

    // Filter by date range (if not already filtered in query)
    if (fromDate || toDate) {
      const from = fromDate ? new Date(fromDate) : new Date(0);
      const to = toDate ? new Date(toDate) : new Date('9999-12-31');
      
      filteredRequests = filteredRequests.filter(request => 
        request.requestedAt >= from && request.requestedAt <= to
      );
    }

    // Sort by requested date (newest first)
    filteredRequests.sort((a, b) => new Date(b.requestedAt) - new Date(a.requestedAt));

    // Calculate statistics
    const stats = {
      total: filteredRequests.length,
      pending: filteredRequests.filter(r => r.status === 'pending').length,
      approved: filteredRequests.filter(r => r.status === 'approved').length,
      rejected: filteredRequests.filter(r => r.status === 'rejected').length
    };

    res.json({
      success: true,
      data: {
        rescheduleRequests: filteredRequests,
        statistics: stats,
        summary: {
          totalMeetings: meetings.length,
          totalRequests: rescheduleRequests.length,
          filteredRequests: filteredRequests.length
        }
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});


// 🔍 GET USER CONFLICTS: Get all conflicts for a specific user
router.get('/user-conflicts/:userId?', leaderOrSuperLeaderAuth, async (req, res) => {
  try {
    // Use provided userId or current user's ID
    const targetUserId = req.params.userId || req.user._id;

    // Get current date for active conflicts
    const currentDate = new Date();

    // Find ALL active schedules for the user (including meeting-generated schedules)
    const userSchedules = await Schedule.find({
      createdBy: targetUserId,
      status: 'active'
    })
    .populate({
      path: 'meetingReference',
      select: 'title startDatetime endDatetime createdBy',
      populate: {
        path: 'createdBy',
        select: 'name phoneNumber role department'
      }
    })
    .sort({ startDateTime: 1 });

    // Find conflicts by comparing each schedule with others
    const conflicts = [];

    // Helper function to check if two time periods overlap
    const hasOverlap = (start1, end1, start2, end2) => {
      return start1 < end2 && end1 > start2;
    };

    // Helper function to get priority level
    const getPriorityLevel = (priority) => {
      switch (priority) {
        case 'high': return 3;
        case 'medium': return 2;
        case 'low': return 1;
        default: return 1;
      }
    };

    // Check schedule vs schedule conflicts
    for (let i = 0; i < userSchedules.length; i++) {
      for (let j = i + 1; j < userSchedules.length; j++) {
        const schedule1 = userSchedules[i];
        const schedule2 = userSchedules[j];

        // Check if schedules overlap
        if (hasOverlap(schedule1.startDateTime, schedule1.endDateTime, 
                      schedule2.startDateTime, schedule2.endDateTime)) {
          
          // Get priorities
          const priority1 = getPriorityLevel(schedule1.priority);
          const priority2 = getPriorityLevel(schedule2.priority);
          
          // Create conflict object
          const [primary, conflicting] = priority1 > priority2 ? 
            [schedule1, schedule2] : [schedule2, schedule1];

          // Calculate conflict period
          const conflictStart = new Date(Math.max(primary.startDateTime, conflicting.startDateTime));
          const conflictEnd = new Date(Math.min(primary.endDateTime, conflicting.endDateTime));

          // Only include future conflicts
          if (conflictEnd >= currentDate) {
            conflicts.push({
              type: 'schedule_vs_schedule',
              primary: {
                id: primary._id,
                title: primary.title,
                scheduleType: primary.scheduleType,
                startDateTime: primary.startDateTime,
                endDateTime: primary.endDateTime,
                priority: primary.priority,
                recurring: primary.recurring,
                meetingId: primary.meetingReference ? primary.meetingReference._id : null,
                isMeetingSchedule: !!primary.meetingReference,
                meetingCreator: primary.meetingReference ? {
                  id: primary.meetingReference.createdBy._id,
                  name: primary.meetingReference.createdBy.name,
                  phoneNumber: primary.meetingReference.createdBy.phoneNumber,
                  role: primary.meetingReference.createdBy.role,
                  department: primary.meetingReference.createdBy.department
                } : null
              },
              conflicting: {
                id: conflicting._id,
                title: conflicting.title,
                scheduleType: conflicting.scheduleType,
                startDateTime: conflicting.startDateTime,
                endDateTime: conflicting.endDateTime,
                priority: conflicting.priority,
                recurring: conflicting.recurring,
                meetingId: conflicting.meetingReference ? conflicting.meetingReference._id : null,
                isMeetingSchedule: !!conflicting.meetingReference,
                meetingCreator: conflicting.meetingReference ? {
                  id: conflicting.meetingReference.createdBy._id,
                  name: conflicting.meetingReference.createdBy.name,
                  phoneNumber: conflicting.meetingReference.createdBy.phoneNumber,
                  role: conflicting.meetingReference.createdBy.role,
                  department: conflicting.meetingReference.createdBy.department
                } : null
              },
              conflictPeriod: {
                start: conflictStart,
                end: conflictEnd
              },
              resolved: false,
              priorityOverride: true,
              isPastConflict: false
            });
          }
        }
      }
    }



    // Filter conflicts based on query parameters
    const { status, type, fromDate, toDate } = req.query;
    let filteredConflicts = conflicts;

    // Filter by status (resolved/unresolved)
    if (status === 'resolved') {
      filteredConflicts = filteredConflicts.filter(conflict => conflict.resolved);
    } else if (status === 'unresolved') {
      filteredConflicts = filteredConflicts.filter(conflict => !conflict.resolved);
    }

    // Filter by conflict type
    if (type) {
      filteredConflicts = filteredConflicts.filter(conflict => conflict.type === type);
    }

    // Filter by date range
    if (fromDate || toDate) {
      const from = fromDate ? new Date(fromDate) : new Date(0);
      const to = toDate ? new Date(toDate) : new Date('9999-12-31');
      
      filteredConflicts = filteredConflicts.filter(conflict => 
        conflict.conflictPeriod.start >= from && conflict.conflictPeriod.end <= to
      );
    }

    // Sort conflicts by conflict period start date
    filteredConflicts.sort((a, b) => a.conflictPeriod.start - b.conflictPeriod.start);

    res.json({
      success: true,
      data: {
        conflicts: filteredConflicts,
        totalConflicts: filteredConflicts.length,
        resolvedConflicts: filteredConflicts.filter(c => c.resolved).length,
        unresolvedConflicts: filteredConflicts.filter(c => !c.resolved).length,
        summary: {
          scheduleVsSchedule: filteredConflicts.filter(c => c.type === 'schedule_vs_schedule').length,
          totalConflicts: filteredConflicts.length,
          // ✅ Show filtering information
          conflictsFiltered: {
            pastConflictsExcluded: 'Past conflicts automatically filtered out (considered resolved)',
            onlyCurrentFuture: 'Only showing current and future conflicts'
          }
        }
      }
    });

  } catch (error) {
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
    if (schedule.createdBy.toString() !== req.user._id.toString() && (!req.user.role || req.user.role.name !== 'super leader')) {
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
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// 📝 REQUEST MEETING RESCHEDULE: Request meeting creator to reschedule their meeting
router.post('/request-meeting-reschedule/:meetingId', leaderOrSuperLeaderAuth, async (req, res) => {
  try {
    const { meetingId } = req.params;
    const { suggestedTime, reason, affectedScheduleId } = req.body;

    // Validate required fields
    if (!suggestedTime || !reason) {
      return res.status(400).json({
        success: false,
        message: 'Suggested time and reason are required'
      });
    }

    // Find the meeting
    const LeadersMeeting = require('../models/leadersMeetng');
    const meeting = await LeadersMeeting.findById(meetingId)
      .populate({ path: 'createdBy', select: 'name phoneNumber role', populate: { path: 'role', select: 'name' } });

    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: 'Meeting not found'
      });
    }

    // Check if user is a participant in this meeting
    const isParticipant = meeting.participants.some(
      participant => participant.participant.toString() === req.user._id.toString()
    );

    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only request reschedule for meetings you are participating in.'
      });
    }

    // Check if user is the meeting creator (they can't request reschedule for their own meeting)
    if (meeting.createdBy._id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot request reschedule for your own meeting. Use the meeting update route instead.'
      });
    }

    // Find the affected schedule if provided
    let affectedSchedule = null;
    if (affectedScheduleId) {
      affectedSchedule = await Schedule.findById(affectedScheduleId);
      if (!affectedSchedule) {
        return res.status(404).json({
          success: false,
          message: 'Affected schedule not found'
        });
      }
    }

    // Create reschedule request object
    const rescheduleRequest = {
      suggestedTime: new Date(suggestedTime),
      reason,
      requestedBy: req.user._id,
      requestedAt: new Date(),
      status: 'pending',
      affectedScheduleId: affectedScheduleId || null
    };

    // Add reschedule request to meeting
    if (!meeting.rescheduleRequests) {
      meeting.rescheduleRequests = [];
    }

    meeting.rescheduleRequests.push(rescheduleRequest);
    await meeting.save();

    // Get the generated request ID from the saved meeting
    const savedRequest = meeting.rescheduleRequests[meeting.rescheduleRequests.length - 1];
    const requestId = savedRequest._id;

    // Send WhatsApp notification to meeting creator
    try {
      const axios = require('axios');
      
      // Helper function to send DXing message (copied from leadersMeetings.js)
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
          throw error;
        }
      }

      const message = `**🔔 RESCHEDULE REQUEST**\n\n**Meeting:** ${meeting.title}\n**Requested by:** ${req.user.name}\n**Current Date:** ${new Date(meeting.startDatetime).toISOString().split('T')[0]}\n**Current Time:** ${new Date(meeting.startDatetime).toISOString().split('T')[1].split('.')[0]}\n**Suggested Date:** ${new Date(suggestedTime).toISOString().split('T')[0]}\n**Suggested Time:** ${new Date(suggestedTime).toISOString().split('T')[1].split('.')[0]}\n**Reason:** ${reason}\n\nPlease review and respond to this request in your Hira+ app.\n\nThank you!`;
      
      await sendDXingMessage(meeting.createdBy.phoneNumber, message);
    } catch (notificationError) {
    }

    res.json({
      success: true,
      message: 'Meeting reschedule request sent successfully',
      data: {
        requestId: requestId, // Return the generated request ID
        meeting: {
          _id: meeting._id,
          title: meeting.title,
          startDatetime: meeting.startDatetime,
          endDatetime: meeting.endDatetime,
          createdBy: meeting.createdBy
        },
        rescheduleRequest: {
          ...rescheduleRequest,
          _id: requestId // Include the ID in the reschedule request object too
        },
        affectedSchedule: affectedSchedule ? {
          _id: affectedSchedule._id,
          title: affectedSchedule.title,
          scheduleType: affectedSchedule.scheduleType
        } : null
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ✅ MEETING RESCHEDULE APPROVAL: Approve/reject meeting reschedule request
router.put('/meeting-reschedule-approval/:requestId', leaderOrSuperLeaderAuth, async (req, res) => {
  try {
    const { requestId } = req.params;
    const { status, responseMessage } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status must be either "approved" or "rejected"'
      });
    }

    // Find the meeting that contains this reschedule request
    const LeadersMeeting = require('../models/leadersMeetng');
    const User = require('../models/User');

    const meeting = await LeadersMeeting.findOne({
      'rescheduleRequests._id': requestId
    }).populate('rescheduleRequests.requestedBy', 'name phoneNumber')
      .populate('rescheduleRequests.affectedScheduleId', 'title scheduleType startDateTime endDateTime');

    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: 'Reschedule request not found'
      });
    }

    // Find the specific reschedule request
    const rescheduleRequest = meeting.rescheduleRequests.find(
      req => req._id.toString() === requestId
    );

    if (!rescheduleRequest) {
      return res.status(404).json({
        success: false,
        message: 'Reschedule request not found'
      });
    }

    // Check if user is the meeting creator or super leader
    const isMeetingCreator = meeting.createdBy.toString() === req.user._id.toString();
    const isSuperLeader = req.user.role && req.user.role.name === 'super leader';

    if (!isMeetingCreator && !isSuperLeader) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only meeting creator or super leaders can approve reschedule requests.'
      });
    }

    // Check if request is still pending
    if (rescheduleRequest.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Reschedule request has already been processed'
      });
    }

    // Update the reschedule request
    rescheduleRequest.status = status;
    rescheduleRequest.responseDate = new Date();
    rescheduleRequest.responseMessage = responseMessage || '';

    if (status === 'approved') {
      // Update meeting time to the suggested time
      const newStartTime = new Date(rescheduleRequest.suggestedTime);
      const duration = new Date(meeting.endDatetime) - new Date(meeting.startDatetime);
      const newEndTime = new Date(newStartTime.getTime() + duration);

      meeting.startDatetime = newStartTime;
      meeting.endDatetime = newEndTime;

      // Update all participant schedules for this meeting
      const Schedule = require('../models/schedule');
      await Schedule.updateMany(
        { meetingReference: meeting._id },
        {
          startDateTime: newStartTime,
          endDateTime: newEndTime
        }
      );

      // Restore overridden schedules if any
      if (rescheduleRequest.affectedScheduleId) {
        const affectedSchedule = await Schedule.findById(rescheduleRequest.affectedScheduleId);
        if (affectedSchedule && affectedSchedule.status === 'cancelled') {
          affectedSchedule.status = 'active';
          affectedSchedule.overriddenBy = undefined;
          await affectedSchedule.save();
        }
      }

      // 🔔 NOTIFY ALL PARTICIPANTS ABOUT RESCHEDULE
      const populatedMeeting = await LeadersMeeting.findById(meeting._id)
        .populate('participants.participant', 'name phoneNumber')
        .populate('createdBy', 'name phoneNumber');

      // Send notification to all participants
      for (const participantData of populatedMeeting.participants) {
        try {
          const axios = require('axios');
          
          async function sendDXingMessage(phoneNumber, message) {
            try {
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
              throw error;
            }
          }

          const message = `**🔄 MEETING RESCHEDULED**\n\n**Meeting:** ${populatedMeeting.title}\n**New Date:** ${newStartTime.toISOString().split('T')[0]}\n**New Time:** ${newStartTime.toISOString().split('T')[1].split('.')[0]}\n**Duration:** ${newStartTime.toISOString().split('T')[1].split('.')[0]} - ${newEndTime.toISOString().split('T')[1].split('.')[0]}\n**Location:** ${populatedMeeting.locationLink || 'TBD'}\n**Description:** ${populatedMeeting.description}\n\n**Action Required:** Please update your calendar with the new meeting time.\n\nThank you for your understanding!`;

          await sendDXingMessage(participantData.participant.phoneNumber, message);
        } catch (error) {
        }
      }

      // Send notification to requester about approval
      try {
        const axios = require('axios');
        
        async function sendDXingMessage(phoneNumber, message) {
          try {
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
            throw error;
          }
        }

        const message = `**✅ RESCHEDULE REQUEST APPROVED**\n\n**Meeting:** ${populatedMeeting.title}\n**New Date:** ${newStartTime.toISOString().split('T')[0]}\n**New Time:** ${newStartTime.toISOString().split('T')[1].split('.')[0]}\n**Response:** ${responseMessage || 'Approved'}\n\n**Status:** All participants have been notified of the time change.\n\nThank you for your request!`;

        await sendDXingMessage(rescheduleRequest.requestedBy.phoneNumber, message);
      } catch (error) {
      }

    } else if (status === 'rejected') {
      // Send rejection notification to requester
      try {
        const axios = require('axios');
        
        async function sendDXingMessage(phoneNumber, message) {
          try {
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
            throw error;
          }
        }

        const message = `**❌ RESCHEDULE REQUEST REJECTED**\n\n**Meeting:** ${meeting.title}\n**Response:** ${responseMessage || 'Request rejected'}\n\n**Status:** The meeting will remain at its original time.\n\nPlease contact the meeting organizer if you have any concerns.`;

        await sendDXingMessage(rescheduleRequest.requestedBy.phoneNumber, message);
      } catch (error) {
      }
    }

    await meeting.save();

    res.json({
      success: true,
      message: `Reschedule request ${status} successfully`,
      data: {
        meeting: {
          _id: meeting._id,
          title: meeting.title,
          startDatetime: meeting.startDatetime,
          endDatetime: meeting.endDatetime,
          updatedAt: meeting.updatedAt
        },
        rescheduleRequest: {
          _id: rescheduleRequest._id,
          status: rescheduleRequest.status,
          responseDate: rescheduleRequest.responseDate,
          responseMessage: rescheduleRequest.responseMessage
        }
      }
    });

  } catch (error) {
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
    throw error;
  }
}

module.exports = router;
