import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import LeadersSidebar from '../../components/LeadersSidebar';
import { 
  ExclamationTriangleIcon,
  ClockIcon,
  CalendarIcon,
  UserIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
  ChatBubbleLeftRightIcon,
  PlusIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

const Conflicts = () => {
  const navigate = useNavigate();
  const [conflicts, setConflicts] = useState([]);
  const [rescheduleRequests, setRescheduleRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedConflict, setSelectedConflict] = useState(null);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [requestForm, setRequestForm] = useState({
    suggestedTime: '',
    reason: '',
    affectedScheduleId: ''
  });
  const [showMeetingSelectionModal, setShowMeetingSelectionModal] = useState(false);
  const [conflictingMeetings, setConflictingMeetings] = useState([]);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showRequestsModal, setShowRequestsModal] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [messageType, setMessageType] = useState(''); // 'approve' or 'reject'
  const [messageText, setMessageText] = useState('');
  const [currentRequestId, setCurrentRequestId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL_STAGING || 'http://localhost:5000/api/testing';

  useEffect(() => {
    fetchConflicts();
    fetchRescheduleRequests();
  }, []);

  const fetchConflicts = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('leaderToken');
      const response = await axios.get(`${API_BASE_URL}/schedules/user-conflicts`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setConflicts(response.data.data?.conflicts || []);
    } catch (error) {
      console.error('Error fetching conflicts:', error);
      setError('Failed to load conflicts');
    } finally {
      setLoading(false);
    }
  };

  const fetchRescheduleRequests = async () => {
    try {
      const token = localStorage.getItem('leaderToken');
      const response = await axios.get(`${API_BASE_URL}/schedules/reschedule-requests`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRescheduleRequests(response.data.data?.rescheduleRequests || []);
    } catch (error) {
      console.error('Error fetching reschedule requests:', error);
    }
  };

  const handleRequestReschedule = async (e) => {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem('leaderToken');
      const response = await axios.post(
        `${API_BASE_URL}/schedules/request-meeting-reschedule/${selectedMeeting._id}`,
        requestForm,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        setShowRescheduleModal(false);
        setRequestForm({ suggestedTime: '', reason: '', affectedScheduleId: '' });
        setSelectedMeeting(null);
        fetchRescheduleRequests();
        setSuccessMessage('Reschedule request sent successfully!');
        setShowSuccessModal(true);
      }
    } catch (error) {
      console.error('Error requesting reschedule:', error);
      alert(error.response?.data?.message || 'Failed to send reschedule request');
    }
  };

  const handleOpenMeetingSelection = (conflict) => {
    console.log('Conflict data received:', conflict);
    console.log('Primary schedule:', conflict.primary);
    console.log('Conflicting schedule:', conflict.conflicting);
    
    // Extract the two conflicting meetings from the conflict data
    const meetings = [];
    
    // Add primary schedule if it's a meeting
    if (conflict.primary.isMeetingSchedule && conflict.primary.meetingId) {
      console.log('Primary meetingCreator:', conflict.primary.meetingCreator);
      meetings.push({
        _id: conflict.primary.meetingId,
        title: conflict.primary.title,
        startDatetime: conflict.primary.startDateTime,
        endDatetime: conflict.primary.endDateTime,
        type: conflict.primary.scheduleType,
        createdBy: { 
          name: conflict.primary.meetingCreator?.name || 'Unknown',
          id: conflict.primary.meetingCreator?.id || null
        },
        isPrimary: true
      });
    }
    
    // Add conflicting schedule if it's a meeting
    if (conflict.conflicting.isMeetingSchedule && conflict.conflicting.meetingId) {
      console.log('Conflicting meetingCreator:', conflict.conflicting.meetingCreator);
      meetings.push({
        _id: conflict.conflicting.meetingId,
        title: conflict.conflicting.title,
        startDatetime: conflict.conflicting.startDateTime,
        endDatetime: conflict.conflicting.endDateTime,
        type: conflict.conflicting.scheduleType,
        createdBy: { 
          name: conflict.conflicting.meetingCreator?.name || 'Unknown',
          id: conflict.conflicting.meetingCreator?.id || null
        },
        isPrimary: false
      });
    }
    
    console.log('Extracted meetings:', meetings);
    setConflictingMeetings(meetings);
    setRequestForm({ ...requestForm, affectedScheduleId: conflict.primary.id });
    setShowMeetingSelectionModal(true);
  };

  const handleSelectMeeting = (meeting) => {
    setSelectedMeeting(meeting);
    setShowMeetingSelectionModal(false);
    setShowRescheduleModal(true);
  };

  const handleToggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handlePageChange = (page) => {
    // Navigate to the corresponding route
    if (page === 'profile') {
      navigate('/leaders/profile');
    } else if (page === 'meetings') {
      navigate('/leaders/meetings');
    } else if (page === 'schedules') {
      navigate('/leaders/schedules');
    } else if (page === 'conflicts') {
      navigate('/leaders/conflicts');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('leaderToken');
    localStorage.removeItem('leaderUser');
    window.location.href = '/';
  };

  const handleRescheduleApproval = async (requestId, status, responseMessage = '') => {
    try {
      const token = localStorage.getItem('leaderToken');
      const response = await axios.put(
        `${API_BASE_URL}/schedules/meeting-reschedule-approval/${requestId}`,
        { status, responseMessage },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        fetchRescheduleRequests();
        fetchConflicts();
        setSuccessMessage(`Reschedule request ${status} successfully!`);
        setShowSuccessModal(true);
      }
    } catch (error) {
      console.error('Error updating reschedule request:', error);
      alert(error.response?.data?.message || 'Failed to update reschedule request');
      throw error; // Re-throw to handle in calling function
    }
  };

  const handleApprovalClick = (requestId) => {
    setCurrentRequestId(requestId);
    setMessageType('approve');
    setMessageText('');
    setShowMessageModal(true);
  };

  const handleRejectionClick = (requestId) => {
    setCurrentRequestId(requestId);
    setMessageType('reject');
    setMessageText('');
    setShowMessageModal(true);
  };

  const handleMessageSubmit = async () => {
    if (messageType === 'reject' && !messageText.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }
    
    setIsSubmitting(true);
    setShowMessageModal(false);
    
    try {
      await handleRescheduleApproval(currentRequestId, messageType === 'approve' ? 'approved' : 'rejected', messageText);
    } finally {
      setIsSubmitting(false);
      setMessageText('');
      setCurrentRequestId(null);
    }
  };

  const formatDateTime = (dateTimeString) => {
    const date = new Date(dateTimeString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: 'UTC'
    });
  };

  const formatDate = (dateTimeString) => {
    const date = new Date(dateTimeString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long',
      timeZone: 'UTC'
    });
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'approved': return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Group conflicts by date
  const groupConflictsByDate = () => {
    const grouped = {};
    
    conflicts.forEach(conflict => {
      const date = new Date(conflict.conflictPeriod.start);
      const dateKey = date.toDateString();
      
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(conflict);
    });

    return Object.keys(grouped)
      .sort((a, b) => new Date(a) - new Date(b))
      .reduce((acc, date) => {
        acc[date] = grouped[date].sort((a, b) => 
          new Date(a.conflictPeriod.start) - new Date(b.conflictPeriod.start)
        );
        return acc;
      }, {});
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <LeadersSidebar 
        isOpen={isSidebarOpen}
        onToggle={handleToggleSidebar}
        activePage="conflicts"
        onPageChange={handlePageChange}
        onLogout={handleLogout}
      />
      <main className={`flex-1 transition-all duration-300 ${isSidebarOpen ? 'lg:ml-80' : 'lg:ml-24'}`}>
        <div className="p-2 pr-6 pt-6">
          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center mb-8 gap-4">
            <div>
              <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-2">Conflicts</h1>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowRequestsModal(true)}
                className="text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-[#0a0a2a] transition-all duration-200 shadow-sm hover:shadow-md text-sm"
                style={{ backgroundColor: '#080325' }}
              >
                <ClockIcon className="w-4 h-4" />
                <span className="font-medium">Reschedule Requests ({rescheduleRequests.filter(request => request.status === 'pending').length})</span>
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="flex justify-center items-center py-16">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
            </div>
          )}

          {/* Conflicts List */}
          {!loading && (
            <div className="space-y-6">
              {Object.keys(groupConflictsByDate()).length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-200">
                  <CheckCircleIcon className="w-16 h-16 text-[#080325] mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No Conflicts Found</h3>
                  <p className="text-gray-600">Your schedule is conflict-free!</p>                </div>
              ) : (
                Object.entries(groupConflictsByDate()).map(([dateKey, dayConflicts]) => (
                  <div key={dateKey} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    {/* Themed Header with Conflict Date */}
                    <div className="bg-[#080325] text-white px-4 py-3">
                      <h3 className="text-lg font-semibold text-white">
                        {formatDate(dateKey)}
                      </h3>
                      <p className="text-sm text-white/80">
                        {dayConflicts.length} conflict{dayConflicts.length !== 1 ? 's' : ''} detected
                      </p>
                    </div>
                    <div className="divide-y divide-gray-100">
                      {dayConflicts.map((conflict) => (
                        <div key={`${conflict.primary.id}-${conflict.conflicting.id}`} className="p-4 hover:bg-gray-50 transition-colors">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2">
                                <ExclamationTriangleIcon className="w-5 h-5 text-orange-500 flex-shrink-0" />
                                <h4 className="text-base font-semibold text-gray-900">Schedule Conflict</h4>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(conflict.primary.priority)}`}>
                                  {conflict.primary.priority} vs {conflict.conflicting.priority}
                                </span>
                              </div>
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                                {/* Primary Schedule */}
                                <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                                  <div className="flex items-center gap-2 mb-1">
                                    <CheckCircleIcon className="w-4 h-4 text-green-600" />
                                    <h5 className="text-sm font-semibold text-green-800">Primary Schedule</h5>
                                  </div>
                                  <p className="font-medium text-gray-900 mb-1 text-sm">{conflict.primary.title}</p>
                                  <p className="text-xs text-gray-600 mb-1">{conflict.primary.scheduleType}</p>
                                  <div className="flex items-center gap-3 text-xs text-gray-600">
                                    <div className="flex items-center gap-1">
                                      <ClockIcon className="w-3 h-3" />
                                      <span>{formatDateTime(conflict.primary.startDateTime)}</span>
                                    </div>
                                  </div>
                                </div>

                                {/* Conflicting Schedule */}
                                <div className="bg-red-50 p-3 rounded-lg border border-red-200">
                                  <div className="flex items-center gap-2 mb-1">
                                    <XCircleIcon className="w-4 h-4 text-red-600" />
                                    <h5 className="text-sm font-semibold text-red-800">Conflicting Schedule</h5>
                                  </div>
                                  <p className="font-medium text-gray-900 mb-1 text-sm">{conflict.conflicting.title}</p>
                                  <p className="text-xs text-gray-600 mb-1">{conflict.conflicting.scheduleType}</p>
                                  <div className="flex items-center gap-3 text-xs text-gray-600">
                                    <div className="flex items-center gap-1">
                                      <ClockIcon className="w-3 h-3" />
                                      <span>{formatDateTime(conflict.conflicting.startDateTime)}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              <div className="bg-orange-50 p-2 rounded-lg border border-orange-200">
                                <p className="text-xs text-orange-800">
                                  <strong>Conflict Period:</strong> {formatDateTime(conflict.conflictPeriod.start)} - {formatDateTime(conflict.conflictPeriod.end)}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                              <button
                                onClick={() => setSelectedConflict(conflict)}
                                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                                title="View Details"
                              >
                                <EyeIcon className="w-5 h-5" />
                              </button>
                              <button
                                onClick={() => handleOpenMeetingSelection(conflict)}
                                className="p-2 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Select Meeting to Request Reschedule"
                              >
                                <ChatBubbleLeftRightIcon className="w-5 h-5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}


        </div>
      </main>

      {/* Meeting Selection Modal */}
      {showMeetingSelectionModal && (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white/95 backdrop-blur-md rounded-xl w-full max-w-3xl max-h-[80vh] overflow-hidden shadow-2xl border border-gray-200/50">
            {/* Header with Sidebar Color */}
            <div className="bg-[#080325] text-white px-6 py-4 rounded-t-xl">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-white">Select Meeting to Request Reschedule</h2>
                <button
                  onClick={() => setShowMeetingSelectionModal(false)}
                  className="text-white/80 hover:text-white p-1.5 hover:bg-white/10 rounded-full transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            {/* Content Area */}
            <div className="p-4">

              <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> Select one of the conflicting meetings to send a reschedule request to its creator. 
                  This will help resolve the schedule conflict.
                </p>
              </div>

              {conflictingMeetings.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-600">No conflicting meetings found in this conflict.</p>
                </div>
              ) : (
                <div className="grid gap-3">
                  {conflictingMeetings.map((meeting) => (
                    <div 
                      key={meeting._id} 
                      className={`p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors ${
                        meeting.isPrimary ? 'border-green-300 bg-green-50' : 'border-red-300 bg-red-50'
                      }`}
                      onClick={() => handleSelectMeeting(meeting)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-gray-900">{meeting.title}</h3>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              meeting.isPrimary ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {meeting.isPrimary ? 'Primary Schedule' : 'Conflicting Schedule'}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                              <ClockIcon className="w-4 h-4" />
                              <span>{formatDateTime(meeting.startDatetime)}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <CalendarIcon className="w-4 h-4" />
                              <span>{meeting.type}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <UserIcon className="w-4 h-4" />
                              <span>Created by: {meeting.createdBy.name}</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-blue-600">
                          <ChatBubbleLeftRightIcon className="w-5 h-5" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Request Reschedule Modal */}
      {showRescheduleModal && selectedMeeting && (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white/95 backdrop-blur-md rounded-xl w-full max-w-2xl max-h-[80vh] overflow-hidden shadow-2xl border border-gray-200/50">
            {/* Header with Sidebar Color */}
            <div className="bg-[#080325] text-white px-6 py-4 rounded-t-xl">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-white">Request Meeting Reschedule</h2>
                <button
                  onClick={() => setShowRescheduleModal(false)}
                  className="text-white/80 hover:text-white p-1.5 hover:bg-white/10 rounded-full transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            {/* Content Area */}
            <div className="p-4">

              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">Selected Meeting Details</h3>
                <p className="text-gray-700 mb-1"><strong>Title:</strong> {selectedMeeting.title}</p>
                <p className="text-gray-700 mb-1"><strong>Current Time:</strong> {formatDateTime(selectedMeeting.startDatetime)}</p>
                <p className="text-gray-700 mb-1"><strong>End Time:</strong> {formatDateTime(selectedMeeting.endDatetime)}</p>
                <p className="text-gray-700"><strong>Creator:</strong> {selectedMeeting.createdBy?.name || 'Unknown'}</p>
              </div>

              <form onSubmit={handleRequestReschedule} className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Suggested New Time *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={requestForm.suggestedTime}
                    onChange={(e) => setRequestForm({...requestForm, suggestedTime: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Reason for Reschedule *
                  </label>
                  <textarea
                    required
                    value={requestForm.reason}
                    onChange={(e) => setRequestForm({...requestForm, reason: e.target.value})}
                    rows="2"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                    placeholder="Please explain why you need to reschedule this meeting..."
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    className="flex-1 bg-[#080325] text-white px-4 py-2 rounded-lg hover:bg-[#0a0a2a] transition-colors"
                  >
                    Send Request
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowRescheduleModal(false)}
                    className="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Conflict Details Modal */}
      {selectedConflict && (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white/95 backdrop-blur-md rounded-xl w-full max-w-3xl max-h-[80vh] overflow-hidden shadow-2xl border border-gray-200/50">
            {/* Header with Sidebar Color */}
            <div className="bg-[#080325] text-white px-6 py-4 rounded-t-xl">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-white">Conflict Details</h2>
                <button
                  onClick={() => setSelectedConflict(null)}
                  className="text-white/80 hover:text-white p-1.5 hover:bg-white/10 rounded-full transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            {/* Content Area */}
            <div className="p-4">

              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                    <h3 className="text-sm font-semibold text-green-800 mb-2">Primary Schedule</h3>
                    <div className="space-y-1">
                      <p className="text-xs"><strong>Title:</strong> {selectedConflict.primary.title}</p>
                      <p className="text-xs"><strong>Type:</strong> {selectedConflict.primary.scheduleType}</p>
                      <p className="text-xs"><strong>Priority:</strong> {selectedConflict.primary.priority}</p>
                      <p className="text-xs"><strong>Start:</strong> {formatDateTime(selectedConflict.primary.startDateTime)}</p>
                      <p className="text-xs"><strong>End:</strong> {formatDateTime(selectedConflict.primary.endDateTime)}</p>
                      {selectedConflict.primary.recurring && (
                        <p className="text-xs"><strong>Recurring:</strong> Yes</p>
                      )}
                    </div>
                  </div>

                  <div className="bg-red-50 p-3 rounded-lg border border-red-200">
                    <h3 className="text-sm font-semibold text-red-800 mb-2">Conflicting Schedule</h3>
                    <div className="space-y-1">
                      <p className="text-xs"><strong>Title:</strong> {selectedConflict.conflicting.title}</p>
                      <p className="text-xs"><strong>Type:</strong> {selectedConflict.conflicting.scheduleType}</p>
                      <p className="text-xs"><strong>Priority:</strong> {selectedConflict.conflicting.priority}</p>
                      <p className="text-xs"><strong>Start:</strong> {formatDateTime(selectedConflict.conflicting.startDateTime)}</p>
                      <p className="text-xs"><strong>End:</strong> {formatDateTime(selectedConflict.conflicting.endDateTime)}</p>
                      {selectedConflict.conflicting.recurring && (
                        <p className="text-xs"><strong>Recurring:</strong> Yes</p>
                      )}
                      {selectedConflict.conflicting.isMeetingSchedule && (
                        <p className="text-xs"><strong>Meeting Schedule:</strong> Yes</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="bg-orange-50 p-2 rounded-lg border border-orange-200">
                  <h3 className="font-semibold text-orange-800 mb-1 text-sm">Conflict Period</h3>
                  <p className="text-xs text-orange-700">
                    <strong>Start:</strong> {formatDateTime(selectedConflict.conflictPeriod.start)}
                  </p>
                  <p className="text-xs text-orange-700">
                    <strong>End:</strong> {formatDateTime(selectedConflict.conflictPeriod.end)}
                  </p>
                </div>

                <div className="flex gap-3 pt-2 border-t border-gray-200">
                  <button
                    onClick={() => setSelectedConflict(null)}
                    className="bg-[#080325] text-white px-4 py-2 rounded-lg hover:bg-[#0a0a2a] transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reschedule Requests Modal */}
      {showRequestsModal && (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white/95 backdrop-blur-md rounded-xl w-full max-w-2xl max-h-[70vh] overflow-hidden shadow-2xl border border-gray-200/50">
            {/* Header with Sidebar Color */}
            <div className="bg-[#080325] text-white px-6 py-4 rounded-t-xl">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-white">Reschedule Requests</h2>
                <button
                  onClick={() => setShowRequestsModal(false)}
                  className="text-white/80 hover:text-white p-1.5 hover:bg-white/10 rounded-full transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            {/* Content Area */}
            <div className="p-4">
              {rescheduleRequests.filter(request => request.status === 'pending').length === 0 ? (
                <div className="text-center py-4">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <ClockIcon className="w-6 h-6 text-gray-500" />
                  </div>
                  <h3 className="text-base font-semibold text-gray-900 mb-1">No pending reschedule requests</h3>
                  <p className="text-sm text-gray-600">You don't have any pending reschedule requests at the moment.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {rescheduleRequests.filter(request => request.status === 'pending').map((request) => (
                    <div key={request._id} className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200">
                      <div className="p-2">
                        <div className="flex justify-between items-start mb-1">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="text-sm font-semibold text-gray-900">{request.meeting.title}</h3>
                              <span className={`px-1.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                                {request.status}
                              </span>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-1 mb-1">
                              <div>
                                <p className="text-xs text-gray-500 mb-0.5">Requested by</p>
                                <p className="text-xs font-medium text-gray-900">{request.requestedBy.name}</p>
                                <p className="text-xs text-gray-500 capitalize">{request.requestedBy.role}</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500 mb-0.5">Meeting Details</p>
                                <p className="text-xs text-gray-900">{request.meeting.scheduleType || 'Meeting'} • {request.meeting.mode || 'N/A'}</p>
                                <p className="text-xs text-gray-600">Original: {formatDateTime(request.meeting.startDatetime)}</p>
                                <p className="text-xs text-gray-600">Suggested: {formatDateTime(request.suggestedTime)}</p>
                              </div>
                            </div>

                            <p className="text-xs text-gray-600 mb-1">
                              <strong>Reason:</strong> {request.reason}
                            </p>

                            {request.affectedSchedule && (
                              <p className="text-xs text-gray-600 mb-1">
                                <strong>Affected Schedule:</strong> {request.affectedSchedule.title}
                              </p>
                            )}

                            {request.responseMessage && (
                              <p className="text-xs text-gray-600 mb-1">
                                <strong>Response:</strong> {request.responseMessage}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Response Actions */}
                      {request.status === 'pending' && (
                        <div className="pt-2 border-t border-gray-200 px-2 pb-2">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => handleApprovalClick(request._id)}
                              className="bg-[#080325] text-white px-3 py-1.5 rounded-lg hover:bg-[#0a0a2a] transition-all duration-200 text-xs font-medium flex items-center gap-1 shadow-sm hover:shadow-md"
                            >
                              <CheckCircleIcon className="w-3 h-3" />
                              Approve
                            </button>
                            <button
                              onClick={() => handleRejectionClick(request._id)}
                              className="bg-red-600 text-white px-3 py-1.5 rounded-lg hover:bg-red-700 transition-all duration-200 text-xs font-medium flex items-center gap-1 shadow-sm hover:shadow-md"
                            >
                              <XCircleIcon className="w-3 h-3" />
                              Reject
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white/95 backdrop-blur-md rounded-xl w-full max-w-md max-h-[90vh] overflow-hidden shadow-2xl border border-gray-200/50">
            {/* Header with Sidebar Color */}
            <div className="bg-[#080325] text-white px-6 py-4 rounded-t-xl">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-white">Success!</h2>
                <button
                  onClick={() => setShowSuccessModal(false)}
                  className="text-white/80 hover:text-white p-1.5 hover:bg-white/10 rounded-full transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            {/* Content Area */}
            <div className="p-6 text-center">
              {/* Success Icon with Sidebar Color */}
              <div className="w-16 h-16 bg-[#080325] rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Request Sent!</h3>
              <p className="text-gray-600 mb-6">{successMessage}</p>
              
              <button
                onClick={() => setShowSuccessModal(false)}
                className="bg-[#080325] text-white px-6 py-3 rounded-lg hover:bg-[#0a0a2a] transition-all duration-200 shadow-sm hover:shadow-md font-medium"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading Modal */}
      {isSubmitting && (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white/95 backdrop-blur-md rounded-xl w-full max-w-md max-h-[90vh] overflow-hidden shadow-2xl border border-gray-200/50">
            {/* Header with Sidebar Color */}
            <div className="bg-[#080325] text-white px-6 py-4 rounded-t-xl">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-white">Processing...</h2>
              </div>
            </div>
            
            {/* Content Area */}
            <div className="p-6 text-center">
              {/* Loading Spinner with Sidebar Color */}
              <div className="w-16 h-16 bg-[#080325] rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
              
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Processing Request</h3>
              <p className="text-gray-600">Please wait while we process your request...</p>
            </div>
          </div>
        </div>
      )}

      {/* Custom Message Modal */}
      {showMessageModal && (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white/95 backdrop-blur-md rounded-xl w-full max-w-md max-h-[90vh] overflow-hidden shadow-2xl border border-gray-200/50">
            {/* Header with Sidebar Color */}
            <div className="bg-[#080325] text-white px-6 py-4 rounded-t-xl">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-white">
                  {messageType === 'approve' ? 'Approve Request' : 'Reject Request'}
                </h2>
                <button
                  onClick={() => setShowMessageModal(false)}
                  className="text-white/80 hover:text-white p-1.5 hover:bg-white/10 rounded-full transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            {/* Content Area */}
            <div className="p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {messageType === 'approve' ? 'Approval Message (Optional)' : 'Rejection Reason *'}
                </label>
                <textarea
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#080325] focus:border-transparent resize-none"
                  placeholder={messageType === 'approve' 
                    ? 'Enter an optional message for the approval...' 
                    : 'Please provide a reason for rejection...'
                  }
                />
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={handleMessageSubmit}
                  className={`flex-1 px-4 py-2 rounded-lg transition-all duration-200 font-medium ${
                    messageType === 'approve'
                      ? 'bg-[#080325] text-white hover:bg-[#0a0a2a]'
                      : 'bg-red-600 text-white hover:bg-red-700'
                  }`}
                >
                  {messageType === 'approve' ? 'Approve' : 'Reject'}
                </button>
                <button
                  onClick={() => setShowMessageModal(false)}
                  className="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 transition-all duration-200 font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Conflicts;
