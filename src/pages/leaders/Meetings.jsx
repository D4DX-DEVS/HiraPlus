import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import LeadersSidebar from '../../components/LeadersSidebar';
import LeadersDeleteConfirmModal from '../../components/LeadersDeleteConfirmModal';
import { 
  PlusIcon, 
  ClockIcon, 
  UserGroupIcon, 
  MapPinIcon, 
  EyeIcon, 
  TrashIcon, 
  CalendarIcon,
  CheckCircleIcon,
  XCircleIcon,
  PencilIcon
} from '@heroicons/react/24/outline';

const Meetings = () => {
  const navigate = useNavigate();
  const [meetings, setMeetings] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const [showRequestsModal, setShowRequestsModal] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [meetingToDelete, setMeetingToDelete] = useState(null);
  
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL_STAGING || 'http://localhost:5000/api/testing';


  useEffect(() => {
    fetchUserData();
    fetchMeetings();
    fetchParticipants();
    fetchPendingRequests();
  }, []);

  const fetchUserData = async () => {
    try {
      const token = localStorage.getItem('leaderToken');
      const response = await axios.get(`${API_BASE_URL}/leaders/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('User data response:', response.data);
      setUser(response.data.user);
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const fetchMeetings = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('leaderToken');
      const response = await axios.get(`${API_BASE_URL}/leaders-meetings/my-meetings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMeetings(response.data.data || []);
      
      // Fallback: If user data is not loaded, try to get it from meetings response
      if (!user && response.data.user) {
        console.log('Setting user data from meetings response:', response.data.user);
        setUser(response.data.user);
      }
    } catch (error) {
      console.error('Error fetching meetings:', error);
      setError('Failed to load meetings');
    } finally {
      setLoading(false);
    }
  };

  const fetchParticipants = async () => {
    try {
      const token = localStorage.getItem('leaderToken');
      const response = await axios.get(`${API_BASE_URL}/leaders/all`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Combine super leaders and regular leaders from the response
      const allLeaders = [
        ...(response.data.data.superLeaders || []),
        ...(response.data.data.regularLeaders || [])
      ];
      setParticipants(allLeaders);
    } catch (error) {
      console.error('Error fetching participants:', error);
    }
  };

  const fetchPendingRequests = async () => {
    try {
      const token = localStorage.getItem('leaderToken');
      const response = await axios.get(`${API_BASE_URL}/leaders-meetings/requests`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPendingRequests(response.data.data || []);
    } catch (error) {
      console.error('Error fetching pending requests:', error);
    }
  };



  const handleDeleteMeeting = (meeting) => {
    setMeetingToDelete(meeting);
    setShowDeleteModal(true);
  };

  const confirmDeleteMeeting = async () => {
    if (!meetingToDelete) return;

    const token = localStorage.getItem('leaderToken');
    await axios.delete(`${API_BASE_URL}/leaders-meetings/${meetingToDelete._id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    // Remove the meeting from the local state
    setMeetings(meetings.filter(meeting => meeting._id !== meetingToDelete._id));
    setMeetingToDelete(null);
  };

  const handleViewMeeting = (meeting) => {
    setSelectedMeeting(meeting);
  };

  const handleEditMeeting = (meeting) => {
    // Navigate to edit page with meeting data
    navigate(`/leaders/meetings/edit/${meeting._id}`, { 
      state: { 
        meetingData: meeting,
        isEditing: true 
      } 
    });
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

  const handleRespondToMeeting = async (meetingId, status, message = '') => {
    try {
      const token = localStorage.getItem('leaderToken');
      const response = await axios.post(`${API_BASE_URL}/leaders-meetings/${meetingId}/respond`, {
        status,
        message
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        // Remove from pending requests
        setPendingRequests(pendingRequests.filter(req => req._id !== meetingId));
        setShowRequestsModal(false);
        alert(`Meeting ${status} successfully!`);
      }
    } catch (error) {
      console.error('Error responding to meeting:', error);
      alert(error.response?.data?.message || 'Failed to respond to meeting');
    }
  };

  const formatDateTime = (dateTimeString) => {
    // Ensure we're working with the correct date object
    const date = new Date(dateTimeString);
    
    // Debug logging to check UTC conversion
    console.log('Meetings - Original string:', dateTimeString);
    console.log('Meetings - Parsed date:', date);
    console.log('Meetings - UTC time:', date.toUTCString());
    
    // Display time consistently
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

  const canDeleteMeeting = (meeting) => {
    if (!user) return false;
    
    // Get user ID from JWT token as fallback
    let userId = user._id;
    if (!userId) {
      try {
        const token = localStorage.getItem('leaderToken');
        if (token) {
          const payload = JSON.parse(atob(token.split('.')[1]));
          userId = payload.id;
        }
      } catch (error) {
        console.error('Error parsing JWT token:', error);
      }
    }
    
    const isCreator = meeting.createdBy._id === userId;
    const isSuperLeader = user.role === 'super leader';
    const creatorIsLeader = meeting.createdBy.role === 'leader';
    
    // Debug logging for the specific meeting
    console.log('Delete permission check for meeting:', meeting.title, {
      userId: userId,
      userObjectId: user._id,
      creatorId: meeting.createdBy._id,
      userRole: user.role,
      creatorRole: meeting.createdBy.role,
      isCreator: meeting.createdBy._id === userId,
      isSuperLeader: user.role === 'super leader',
      creatorIsLeader: meeting.createdBy.role === 'leader',
      canDelete: creatorIsLeader ? (isCreator || isSuperLeader) : isCreator
    });
    
    if (creatorIsLeader) {
      return isCreator || isSuperLeader;
    } else {
      return isCreator;
    }
  };

  const canEditMeeting = (meeting) => {
    if (!user) return false;
    
    // Get user ID from JWT token as fallback
    let userId = user._id;
    if (!userId) {
      try {
        const token = localStorage.getItem('leaderToken');
        if (token) {
          const payload = JSON.parse(atob(token.split('.')[1]));
          userId = payload.id;
        }
      } catch (error) {
        console.error('Error parsing JWT token:', error);
      }
    }
    
    const isCreator = meeting.createdBy._id === userId;
    
    // Debug logging for edit permission
    console.log('Edit permission check for meeting:', meeting.title, {
      userId: userId,
      userObjectId: user._id,
      creatorId: meeting.createdBy._id,
      isCreator: isCreator,
      canEdit: isCreator
    });
    
    return isCreator;
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <LeadersSidebar 
        isOpen={isSidebarOpen}
        onToggle={handleToggleSidebar}
        activePage="meetings"
        onPageChange={handlePageChange}
        onLogout={handleLogout}
      />
      <main className={`flex-1 transition-all duration-300 ${isSidebarOpen ? 'lg:ml-80' : 'lg:ml-24'}`}>
        <div className="p-2 pr-6 pt-6">
          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center mb-8 gap-4">
            <div>
              <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-2">Meetings</h1>
              
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={() => setShowRequestsModal(true)}
                className="text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-[#0a0a2a] transition-all duration-200 shadow-sm hover:shadow-md text-sm"
                style={{ backgroundColor: '#080325' }}
              >
                <ClockIcon className="w-4 h-4" />
                <span className="font-medium">Pending ({pendingRequests.length})</span>
              </button>
              <button
                onClick={() => navigate('/leaders/meetings/create')}
                className="bg-gray-900 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-gray-800 transition-all duration-200 shadow-sm hover:shadow-md text-sm font-medium"
              >
                <PlusIcon className="w-4 h-4" />
                <span>Create </span>
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

          {/* Meetings List */}
          <div className="w-full">
            {!loading && meetings.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl shadow-sm border border-gray-200">
                <CalendarIcon className="w-20 h-20 text-gray-400 mx-auto mb-6" />
                <h3 className="text-2xl font-semibold text-gray-900 mb-3">No meetings found</h3>
                <p className="text-gray-600 text-lg mb-6">You haven't created or been invited to any meetings yet.</p>
                <button
                  onClick={() => navigate('/leaders/meetings/create')}
                  className="text-white px-6 py-3 rounded-xl hover:bg-[#0a0a2a] transition-colors flex items-center gap-2 mx-auto"
                  style={{ backgroundColor: '#080325' }}
                >
                  <PlusIcon className="w-5 h-5" />
                  Create Your First Meeting
                </button>
              </div>
            ) : (
              <div className="grid gap-4">
                {meetings.map((meeting) => (
                  <div key={meeting._id} className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 overflow-hidden">
                    <div className="p-4">
                      <div className="grid grid-cols-12 gap-4">
                        {/* First Column: Meeting Name and Status Tags (5 columns) */}
                        <div className="col-span-5 flex flex-col">
                          <h3 className="text-xl font-bold text-gray-900 truncate mb-3">{meeting.title}</h3>
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              meeting.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                              meeting.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                              meeting.status === 'declined' ? 'bg-red-100 text-red-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {meeting.status || 'confirmed'}
                            </span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${
                              meeting.mode === 'online' ? 'bg-blue-100 text-blue-700' :
                              meeting.mode === 'offline' ? 'bg-purple-100 text-purple-700' :
                              'bg-orange-100 text-orange-700'
                            }`}>
                              {meeting.mode}
                            </span>
                          </div>
                        </div>

                        {/* Second Column: Meeting Details (6 columns) */}
                        <div className="col-span-6 flex flex-col justify-center">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-base font-semibold text-gray-900">
                              <ClockIcon className="w-5 h-5 text-blue-600" />
                              <span>{formatDateTime(meeting.startDatetime)}</span>
                            </div>
                            
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <CalendarIcon className="w-4 h-4 text-purple-600" />
                              <span className="font-medium">{meeting.type}</span>
                              {meeting.mode !== 'online' && meeting.locationLink && (
                                <>
                                  <span className="mx-2 text-gray-400">•</span>
                                  <MapPinIcon className="w-4 h-4 text-red-500" />
                                  <span className="font-medium">{meeting.locationLink}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Third Column: Action Buttons (1 column) */}
                        <div className="col-span-1 flex flex-col items-center justify-center">
                          <div className="flex flex-col items-center gap-2">
                            <button
                              onClick={() => handleViewMeeting(meeting)}
                              className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
                              title="View Details"
                            >
                              <EyeIcon className="w-4 h-4" />
                            </button>
                            {canEditMeeting(meeting) && (
                              <button
                                onClick={() => handleEditMeeting(meeting)}
                                className="p-1.5 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors"
                                title="Edit Meeting"
                              >
                                <PencilIcon className="w-4 h-4" />
                              </button>
                            )}
                            {canDeleteMeeting(meeting) && (
                              <button
                                onClick={() => handleDeleteMeeting(meeting)}
                                className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                                title="Delete Meeting"
                              >
                                <TrashIcon className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Delete Confirmation Modal */}
      <LeadersDeleteConfirmModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setMeetingToDelete(null);
        }}
        onConfirm={confirmDeleteMeeting}
        title="Delete Meeting"
        message="Are you sure you want to delete this meeting?"
        itemName={meetingToDelete?.title}
        confirmText="Delete Meeting"
        cancelText="Cancel"
      />

      {/* View Meeting Modal */}
      {selectedMeeting && (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white/95 backdrop-blur-md rounded-xl w-full max-w-5xl max-h-[90vh] overflow-hidden shadow-2xl border border-gray-200/50">
            {/* Header with Project Theme */}
            <div className="bg-[#080325] text-white px-6 py-4 rounded-t-xl">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-white">Meeting Details</h2>
                <button
                  onClick={() => setSelectedMeeting(null)}
                  className="text-white/80 hover:text-white p-1.5 hover:bg-white/10 rounded-full transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Content Area */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
              {/* Meeting Header */}
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-gray-900">{selectedMeeting.title}</h3>
              </div>

              {/* Main Content Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-6">
                {/* Left Column */}
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                      <ClockIcon className="w-5 h-5 text-gray-600" />
                      Date & Time
                    </h4>
                    <p className="text-gray-700 font-medium">
                      {formatDateTime(selectedMeeting.startDatetime)} - {formatDateTime(selectedMeeting.endDatetime)}
                    </p>
                  </div>

                  {selectedMeeting.locationLink && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                        <MapPinIcon className="w-5 h-5 text-gray-600" />
                        Location
                      </h4>
                      <a 
                        href={selectedMeeting.locationLink} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-gray-700 hover:text-gray-900 font-medium"
                      >
                        {selectedMeeting.locationLink}
                      </a>
                    </div>
                  )}

                  {selectedMeeting.description && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900 mb-2">Description</h4>
                      <p className="text-gray-700">{selectedMeeting.description}</p>
                    </div>
                  )}

                  {selectedMeeting.agenda && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900 mb-2">Agenda</h4>
                      <p className="text-gray-700">{selectedMeeting.agenda}</p>
                    </div>
                  )}
                </div>

                {/* Right Column */}
                <div className="space-y-4">
                  {/* Status and Type Information */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-3">Meeting Information</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Status:</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          selectedMeeting.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                          selectedMeeting.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {selectedMeeting.status || 'confirmed'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Type:</span>
                        <span className="text-gray-900 font-medium">{selectedMeeting.type}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Mode:</span>
                        <span className="text-gray-900 font-medium capitalize">{selectedMeeting.mode}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                      <UserGroupIcon className="w-5 h-5 text-gray-600" />
                      Created By
                    </h4>
                    <p className="text-gray-700 font-medium">
                      {selectedMeeting.createdBy.name} 
                      <span className="text-gray-500 ml-2">({selectedMeeting.createdBy.role})</span>
                    </p>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <UserGroupIcon className="w-5 h-5 text-gray-600" />
                      Participants ({selectedMeeting.participants.length})
                    </h4>
                    <div className="space-y-2">
                      {selectedMeeting.participants.map((participant) => (
                        <div key={participant._id} className="flex items-center justify-between bg-white rounded-lg p-2 border border-gray-100">
                          <div>
                            <span className="text-gray-900 font-medium">{participant.participant.name}</span>
                            <span className="text-gray-500 ml-2 text-sm">({participant.participant.role})</span>
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            participant.status === 'accepted' ? 'bg-green-100 text-green-800' :
                            participant.status === 'declined' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {participant.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              {canDeleteMeeting(selectedMeeting) && (
                <div className="flex justify-end pt-4 border-t border-gray-200">
                  <button
                    onClick={() => handleDeleteMeeting(selectedMeeting)}
                    className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-all duration-200 flex items-center gap-2 shadow-sm hover:shadow-md"
                  >
                    <TrashIcon className="w-5 h-5" />
                    Delete Meeting
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Pending Requests Modal */}
              {showRequestsModal && (
          <div className="fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center z-50">
            <div className="bg-white/95 backdrop-blur-md rounded-xl w-full max-w-2xl max-h-[70vh] overflow-hidden shadow-2xl border border-gray-200/50">
              {/* Header with Sidebar Color */}
              <div className="bg-[#080325] text-white px-6 py-4 rounded-t-xl">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold text-white">Pending Meeting Requests</h2>
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
              <div className="p-4 overflow-y-auto max-h-[calc(70vh-80px)]">

                          {pendingRequests.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <ClockIcon className="w-8 h-8 text-gray-500" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No pending requests</h3>
                  <p className="text-gray-600">You don't have any pending meeting requests.</p>
                </div>
              ) : (
                <div className="space-y-4">
                {pendingRequests.map((meeting) => (
                  <div key={meeting._id} className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200">
                    <div className="p-3">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-base font-semibold text-gray-900">{meeting.title}</h3>
                            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                              Pending
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2">
                            <div>
                              <p className="text-xs text-gray-500 mb-0.5">Created by</p>
                              <p className="text-sm font-medium text-gray-900">{meeting.createdBy.name}</p>
                              <p className="text-xs text-gray-500 capitalize">{meeting.createdBy.role}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 mb-0.5">Meeting Details</p>
                              <p className="text-sm text-gray-900">{meeting.type} • {meeting.mode}</p>
                              <p className="text-xs text-gray-600">{formatDateTime(meeting.startDatetime)}</p>
                            </div>
                          </div>

                          {meeting.description && (
                            <p className="text-sm text-gray-600 mb-2">{meeting.description}</p>
                          )}

                          {meeting.locationLink && (
                            <div className="flex items-center gap-1.5 text-sm text-gray-600">
                              <MapPinIcon className="w-4 h-4 text-red-500" />
                              <span className="text-gray-900">{meeting.locationLink}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Response Actions */}
                    <div className="pt-3 border-t border-gray-200 px-3 pb-3">
                      <div className="flex justify-end gap-3">
                        <button
                          onClick={() => handleRespondToMeeting(meeting._id, 'accepted')}
                          className="bg-[#080325] text-white px-5 py-2 rounded-lg hover:bg-[#0a0a2a] transition-all duration-200 text-xs font-medium flex items-center gap-1.5 shadow-sm hover:shadow-md"
                        >
                          <CheckCircleIcon className="w-3.5 h-3.5" />
                          Accept
                        </button>
                        <button
                          onClick={() => {
                            const message = prompt('Please provide a reason for declining (optional):');
                            if (message !== null) {
                              handleRespondToMeeting(meeting._id, 'declined', message);
                            }
                          }}
                          className="bg-red-600 text-white px-5 py-2 rounded-lg hover:bg-red-700 transition-all duration-200 text-xs font-medium flex items-center gap-1.5 shadow-sm hover:shadow-md"
                        >
                          <XCircleIcon className="w-3.5 h-3.5" />
                          Decline
                        </button>
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
    </div>
  );
};

export default Meetings;
