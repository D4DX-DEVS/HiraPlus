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
  PencilIcon,
  CalendarDaysIcon,
  LinkIcon
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
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showDeclineModal, setShowDeclineModal] = useState(false);
  const [declineMessage, setDeclineMessage] = useState('');
  const [meetingToDecline, setMeetingToDecline] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL_STAGING || 'http://localhost:5000/api/testing';


  useEffect(() => {
    fetchUserData();
    fetchMeetings();
    fetchParticipants();
    fetchPendingRequests();
  }, []);

  // Reset to first page when meetings data changes
  useEffect(() => {
    setCurrentPage(1);
  }, [meetings.length]);

  const fetchUserData = async () => {
    try {
      const token = localStorage.getItem('leaderToken');
      const response = await axios.get(`${API_BASE_URL}/leaders/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(response.data.user);
    } catch (error) {
      // Silent error handling
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
        setUser(response.data.user);
      }
    } catch (error) {
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
      // Silent error handling
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
      // Silent error handling
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
        setSuccessMessage(`Meeting ${status} successfully!`);
        setShowSuccessModal(true);
        
        // Auto-hide success modal after 2 seconds
        setTimeout(() => {
          setShowSuccessModal(false);
        }, 2000);
      }
    } catch (error) {
      setSuccessMessage(error.response?.data?.message || 'Failed to respond to meeting');
      setShowSuccessModal(true);
      
      // Auto-hide error modal after 3 seconds
      setTimeout(() => {
        setShowSuccessModal(false);
      }, 3000);
    }
  };

  const handleDeclineClick = (meeting) => {
    setMeetingToDecline(meeting);
    setDeclineMessage('');
    setShowDeclineModal(true);
  };

  const handleDeclineSubmit = () => {
    if (meetingToDecline) {
      handleRespondToMeeting(meetingToDecline._id, 'declined', declineMessage);
      setShowDeclineModal(false);
      setMeetingToDecline(null);
      setDeclineMessage('');
    }
  };

  const formatDateTime = (dateTimeString) => {
    // Ensure we're working with the correct date object
    const date = new Date(dateTimeString);
    
    // Display time in UTC
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
      month: 'short',
      day: 'numeric',
      timeZone: 'UTC'
    });
  };

  const formatTime = (dateTimeString) => {
    const date = new Date(dateTimeString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: 'UTC'
    });
  };

  // Pagination logic
  const totalPages = Math.ceil(meetings.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentMeetings = meetings.slice(startIndex, endIndex);

  const handlePaginationPageChange = (page) => {
    setCurrentPage(page);
    // Scroll to top when page changes
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const canDeleteMeeting = (meeting) => {
    if (!user) {
      return false;
    }
    
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
        // Silent error handling
      }
    }
    
    const isCreator = meeting.createdBy._id === userId;
    const isSuperLeader = user.role?.name === 'super leader';
    const creatorIsLeader = meeting.createdBy.role?.name === 'leader';
    
    // Permission logic:
    // 1. If creator is leader: only creator AND super leaders can delete
    // 2. If creator is super leader: only creator can delete
    return creatorIsLeader ? (isCreator || isSuperLeader) : isCreator;
  };

  const canEditMeeting = (meeting) => {
    if (!user) {
      return false;
    }
    
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
        // Silent error handling
      }
    }
    
    const isCreator = meeting.createdBy._id === userId;
    
    // Only the creator can edit their meeting
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
              <>
                {/* Professional Table */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Meeting Details
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Date & Time
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Type & Mode
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Location
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {currentMeetings.map((meeting) => (
                          <tr key={meeting._id} className="hover:bg-gray-50 transition-colors">
                            {/* Meeting Details */}
                            <td className="px-6 py-4">
                              <div className="min-w-0">
                                <h3 className="text-sm font-semibold text-gray-900 truncate">
                                  {meeting.title}
                                </h3>
                                <p className="text-xs text-gray-500 mt-1">
                                  Created by {meeting.createdBy.name}
                                </p>
                              </div>
                            </td>

                            {/* Date & Time */}
                            <td className="px-6 py-4">
                              <div className="text-sm text-gray-900">
                                <div className="font-medium">{formatDate(meeting.startDatetime)}</div>
                                <div className="text-gray-500">
                                  {formatTime(meeting.startDatetime)} - {formatTime(meeting.endDatetime)}
                                </div>
                              </div>
                            </td>

                            {/* Type & Mode */}
                            <td className="px-6 py-4">
                              <div className="space-y-1">
                                <div className="text-sm font-medium text-gray-900">{meeting.type}</div>
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium capitalize ${
                                  meeting.mode === 'online' ? 'bg-blue-100 text-blue-700' :
                                  meeting.mode === 'offline' ? 'bg-purple-100 text-purple-700' :
                                  'bg-orange-100 text-orange-700'
                                }`}>
                                  {meeting.mode}
                                </span>
                              </div>
                            </td>

                            {/* Location */}
                            <td className="px-6 py-4">
                              {meeting.locationLink ? (
                                <div className="text-sm">
                                  {meeting.mode === 'online' ? (
                                    <a
                                      href={meeting.locationLink}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-blue-600 hover:text-blue-800 hover:underline transition-colors flex items-center gap-1"
                                      title="Join meeting link"
                                    >
                                      <LinkIcon className="w-3 h-3" />
                                      <span className="truncate max-w-32">Join Meeting</span>
                                    </a>
                                  ) : (
                                    <div className="flex items-center gap-1 text-gray-600">
                                      <MapPinIcon className="w-3 h-3" />
                                      <span className="truncate max-w-32" title={meeting.locationLink}>
                                        {meeting.locationLink}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <span className="text-sm text-gray-400">No location</span>
                              )}
                            </td>

                            {/* Status */}
                            <td className="px-6 py-4">
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                meeting.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                                meeting.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                meeting.status === 'declined' ? 'bg-red-100 text-red-700' :
                                'bg-gray-100 text-gray-700'
                              }`}>
                                {meeting.status || 'confirmed'}
                              </span>
                            </td>

                            {/* Actions */}
                            <td className="px-6 py-4">
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  onClick={() => handleViewMeeting(meeting)}
                                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
                                  title="View Details"
                                >
                                  <EyeIcon className="w-4 h-4" />
                                </button>
                                {canEditMeeting(meeting) && (
                                  <button
                                    onClick={() => handleEditMeeting(meeting)}
                                    className="p-2 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors"
                                    title="Edit Meeting"
                                  >
                                    <PencilIcon className="w-4 h-4" />
                                  </button>
                                )}
                                {canDeleteMeeting(meeting) && (
                                  <button
                                    onClick={() => handleDeleteMeeting(meeting)}
                                    className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                                    title="Delete Meeting"
                                  >
                                    <TrashIcon className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-8 flex justify-center">
                    <div className="flex items-center gap-2">
                      {/* Previous Button */}
                      <button
                        onClick={handlePreviousPage}
                        disabled={currentPage === 1}
                        className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Previous
                      </button>

                      {/* Page Numbers */}
                      <div className="flex items-center gap-1">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                          // Show first page, last page, current page, and pages around current page
                          const shouldShow = 
                            page === 1 || 
                            page === totalPages || 
                            (page >= currentPage - 1 && page <= currentPage + 1);
                          
                          if (!shouldShow) {
                            // Show ellipsis for gaps
                            if (page === currentPage - 2 || page === currentPage + 2) {
                              return (
                                <span key={page} className="px-2 py-1 text-gray-500">
                                  ...
                                </span>
                              );
                            }
                            return null;
                          }

                          return (
                            <button
                              key={page}
                              onClick={() => handlePaginationPageChange(page)}
                              className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                                currentPage === page
                                  ? 'bg-[#080325] text-white'
                                  : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                              }`}
                            >
                              {page}
                            </button>
                          );
                        })}
                      </div>

                      {/* Next Button */}
                      <button
                        onClick={handleNextPage}
                        disabled={currentPage === totalPages}
                        className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </>
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
                      <span className="text-gray-500 ml-2">({selectedMeeting.createdBy.role?.name || 'No Role'})</span>
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
                            <span className="text-gray-500 ml-2 text-sm">({participant.participant.role?.name || 'No Role'})</span>
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
                              <p className="text-xs text-gray-500 capitalize">{meeting.createdBy.role?.name || 'No Role'}</p>
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
                          onClick={() => handleDeclineClick(meeting)}
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

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4 shadow-lg border border-gray-200">
            <div className="text-center">
              {/* Success Icon */}
              <div className="mx-auto flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mb-4">
                <CheckCircleIcon className="w-6 h-6 text-green-600" />
              </div>
              
              {/* Success Message */}
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {successMessage.includes('successfully') ? 'Success!' : 'Error'}
              </h3>
              <p className="text-sm text-gray-600 mb-6">
                {successMessage}
              </p>
              
              {/* Progress Bar */}
              <div className="w-full bg-gray-200 rounded-full h-1 mb-4">
                <div className={`h-1 rounded-full transition-all duration-2000 ${
                  successMessage.includes('successfully') ? 'bg-green-600' : 'bg-red-600'
                }`} style={{ width: '100%' }}></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Decline Confirmation Modal */}
      {showDeclineModal && (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-lg border border-gray-200">
            <div className="text-center">
              {/* Warning Icon */}
              <div className="mx-auto flex items-center justify-center w-12 h-12 bg-red-100 rounded-full mb-4">
                <XCircleIcon className="w-6 h-6 text-red-600" />
              </div>
              
              {/* Confirmation Message */}
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Decline Meeting
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Are you sure you want to decline this meeting? You can provide a reason below (optional).
              </p>
              
              {/* Reason Input */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2 text-left">
                  Reason for declining (optional)
                </label>
                <textarea
                  value={declineMessage}
                  onChange={(e) => setDeclineMessage(e.target.value)}
                  placeholder="Enter reason for declining..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                  rows="3"
                />
              </div>
              
              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDeclineModal(false);
                    setMeetingToDecline(null);
                    setDeclineMessage('');
                  }}
                  className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200 transition-colors text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeclineSubmit}
                  className="flex-1 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors text-sm font-medium"
                >
                  Decline Meeting
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Meetings;
