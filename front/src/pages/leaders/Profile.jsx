import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import LeadersSidebar from '../../components/LeadersSidebar';
import { 
  UserIcon, 
  PhoneIcon, 
  CalendarIcon, 
  CheckCircleIcon,
  ClockIcon,
  ChartBarIcon,
  InformationCircleIcon,
  TagIcon,
  MapPinIcon,
  EyeIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  XMarkIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';

const Profile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [stats, setStats] = useState({
    meetingsCreated: 0,
    schedules: 0,
    conflicts: 0,
    customTags: 0
  });
  const [todaySchedules, setTodaySchedules] = useState([]);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  
  // Custom Tags State
  const [customTags, setCustomTags] = useState([]);
  const [showCustomTagsModal, setShowCustomTagsModal] = useState(false);
  const [showCreateTagModal, setShowCreateTagModal] = useState(false);
  const [showEditTagModal, setShowEditTagModal] = useState(false);
  const [showDeleteTagModal, setShowDeleteTagModal] = useState(false);
  const [selectedTag, setSelectedTag] = useState(null);
  const [tagToDelete, setTagToDelete] = useState(null);
  const [allParticipants, setAllParticipants] = useState([]);
  const [tagFormData, setTagFormData] = useState({
    name: '',
    participants: []
  });
  const [isSubmittingTag, setIsSubmittingTag] = useState(false);
  const [participantSearchTerm, setParticipantSearchTerm] = useState('');
  
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL_STAGING

  // Custom Tags API Functions
  const fetchCustomTags = async () => {
    try {
      const token = localStorage.getItem('leaderToken');
      const response = await axios.get(`${API_BASE_URL}/custom-tags`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCustomTags(response.data.data || []);
      setStats(prev => ({ ...prev, customTags: response.data.data?.length || 0 }));
    } catch (error) {
      console.error('Error fetching custom tags:', error);
    }
  };

  const fetchAllParticipants = async () => {
    try {
      const token = localStorage.getItem('leaderToken');
      const response = await axios.get(`${API_BASE_URL}/leaders/all-users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const allUsers = [
        ...(response.data.data.superLeaders || []),
        ...(response.data.data.leaders || []),
        ...(response.data.data.members || []),
        ...(response.data.data.drivers || []),
        ...(response.data.data.accountants || [])
      ];
      setAllParticipants(allUsers);
    } catch (error) {
      console.error('Error fetching participants:', error);
    }
  };

  const createCustomTag = async (tagData) => {
    try {
      const token = localStorage.getItem('leaderToken');
      const response = await axios.post(`${API_BASE_URL}/custom-tags`, tagData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        fetchCustomTags();
        return { success: true, data: response.data.data };
      }
    } catch (error) {
      console.error('Error creating custom tag:', error);
      return { success: false, error: error.response?.data?.message || 'Failed to create custom tag' };
    }
  };

  const updateCustomTag = async (tagId, tagData) => {
    try {
      const token = localStorage.getItem('leaderToken');
      const response = await axios.put(`${API_BASE_URL}/custom-tags/${tagId}`, tagData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        fetchCustomTags();
        return { success: true, data: response.data.data };
      }
    } catch (error) {
      console.error('Error updating custom tag:', error);
      return { success: false, error: error.response?.data?.message || 'Failed to update custom tag' };
    }
  };

  const deleteCustomTag = async (tagId) => {
    try {
      const token = localStorage.getItem('leaderToken');
      const response = await axios.delete(`${API_BASE_URL}/custom-tags/${tagId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        fetchCustomTags();
        return { success: true };
      }
    } catch (error) {
      console.error('Error deleting custom tag:', error);
      return { success: false, error: error.response?.data?.message || 'Failed to delete custom tag' };
    }
  };

  useEffect(() => {
    const fetchUserData = async () => {
    try {
      const token = localStorage.getItem('leaderToken');
        const response = await axios.get(`${API_BASE_URL}/leaders/profile`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUser(response.data.user);
    } catch (error) {
        console.error('Error fetching user data:', error);
    } finally {
      setIsLoading(false);
      }
    };

    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('leaderToken');
        const [meetingsResponse, schedulesResponse, conflictsResponse] = await Promise.all([
          axios.get(`${API_BASE_URL}/leaders-meetings/my-meetings`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get(`${API_BASE_URL}/schedules`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get(`${API_BASE_URL}/schedules/user-conflicts`, {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);

        const now = new Date();
        
        // Filter for upcoming meetings only
        const upcomingMeetings = meetingsResponse.data.data?.filter(meeting => {
          const meetingDate = new Date(meeting.startDatetime);
          return meetingDate > now;
        }) || [];

        // Filter for upcoming schedules only
        const upcomingSchedules = schedulesResponse.data.data?.filter(schedule => {
          const scheduleDate = new Date(schedule.startDateTime);
          return scheduleDate > now;
        }) || [];

        setStats({
          meetingsCreated: upcomingMeetings.length,
          schedules: upcomingSchedules.length,
          conflicts: conflictsResponse.data.data?.conflicts?.length || 0
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    };

    const fetchTodaySchedules = async () => {
      try {
        const token = localStorage.getItem('leaderToken');
        const response = await axios.get(`${API_BASE_URL}/schedules`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        const today = new Date();
        const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

        // Filter schedules for today only
        const todaySchedulesList = response.data.data?.filter(schedule => {
          const scheduleDate = new Date(schedule.startDateTime);
          return scheduleDate >= todayStart && scheduleDate < todayEnd;
        }) || [];

        // Sort by start time
        todaySchedulesList.sort((a, b) => new Date(a.startDateTime) - new Date(b.startDateTime));
        setTodaySchedules(todaySchedulesList);
      } catch (error) {
        console.error('Error fetching today\'s schedules:', error);
      }
    };

    fetchUserData();
    fetchStats();
    fetchTodaySchedules();
    fetchCustomTags();
    fetchAllParticipants();
  }, []);



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

  const handleViewSchedule = (schedule) => {
    setSelectedSchedule(schedule);
  };

  // Custom Tags Handler Functions
  const handleOpenCustomTagsModal = () => {
    setShowCustomTagsModal(true);
  };

  const handleCloseCustomTagsModal = () => {
    setShowCustomTagsModal(false);
    setShowCreateTagModal(false);
    setShowEditTagModal(false);
    setShowDeleteTagModal(false);
    setSelectedTag(null);
    setTagToDelete(null);
    setTagFormData({ name: '', participants: [] });
    setParticipantSearchTerm('');
  };

  const handleCreateTag = () => {
    setTagFormData({ name: '', participants: [] });
    setParticipantSearchTerm('');
    setShowCreateTagModal(true);
  };

  const handleEditTag = (tag) => {
    setSelectedTag(tag);
    setTagFormData({
      name: tag.name,
      participants: tag.participants.map(p => p._id)
    });
    setParticipantSearchTerm('');
    setShowEditTagModal(true);
  };

  const handleDeleteTag = (tag) => {
    setTagToDelete(tag);
    setShowDeleteTagModal(true);
  };

  const handleTagFormSubmit = async (e) => {
    e.preventDefault();
    if (!tagFormData.name.trim()) return;

    setIsSubmittingTag(true);
    try {
      let result;
      if (showEditTagModal && selectedTag) {
        result = await updateCustomTag(selectedTag._id, tagFormData);
      } else {
        result = await createCustomTag(tagFormData);
      }

      if (result.success) {
        setShowCreateTagModal(false);
        setShowEditTagModal(false);
        setTagFormData({ name: '', participants: [] });
        setSelectedTag(null);
        setParticipantSearchTerm('');
      } else {
        alert(result.error || 'Operation failed');
      }
    } catch (error) {
      alert('An error occurred. Please try again.');
    } finally {
      setIsSubmittingTag(false);
    }
  };

  const handleConfirmDeleteTag = async () => {
    if (!tagToDelete) return;

    const result = await deleteCustomTag(tagToDelete._id);
    if (result.success) {
      setShowDeleteTagModal(false);
      setTagToDelete(null);
    } else {
      alert(result.error || 'Failed to delete tag');
    }
  };

  const handleParticipantToggle = (participantId) => {
    setTagFormData(prev => ({
      ...prev,
      participants: prev.participants.includes(participantId)
        ? prev.participants.filter(id => id !== participantId)
        : [...prev.participants, participantId]
    }));
  };

  // Filter participants based on search term
  const filteredParticipants = allParticipants.filter(participant => {
    const searchLower = participantSearchTerm.toLowerCase();
    return (
      participant.name.toLowerCase().includes(searchLower) ||
      participant.role?.name?.toLowerCase().includes(searchLower) ||
      participant.department?.title?.toLowerCase().includes(searchLower)
    );
  });

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
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

  const renderProfileContent = () => {
    return (
      <div className="p-4 lg:p-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-left mb-6">
            <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-2">Profile</h1>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Profile Card */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                <div className="text-center mb-5">
                  <h2 className="text-lg font-bold text-gray-900 mb-2">{user.name || 'User Name'}</h2>
                  <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                    <CheckCircleIcon className="w-4 h-4 mr-1" />
                    {user.role === 'super leader' ? 'Super Leader' : 'Leader'}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                    <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center mr-3">
                      <PhoneIcon className="w-5 h-5 text-gray-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-1">Phone Number</p>
                      <p className="text-base font-semibold text-gray-900">+91 {user.phoneNumber || 'Not provided'}</p>
                    </div>
                  </div>

                  {/* Account Information Section */}
                  <div className="pt-4 border-t border-gray-200">
                    <div className="flex items-center mb-3">
                      <InformationCircleIcon className="w-4 h-4 text-gray-600 mr-2" />
                      <h4 className="text-sm font-semibold text-gray-900">Account Details</h4>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs font-medium text-gray-600 mb-1">Role</p>
                        <p className="text-sm font-semibold text-gray-900 capitalize">{user.role?.name || 'Not assigned'}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-600 mb-1">Department</p>
                        <p className="text-sm font-semibold text-gray-900">{user.department?.title || 'Not assigned'}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-600 mb-1">Designation</p>
                        <p className="text-sm font-semibold text-gray-900">{user.designation || 'Not specified'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Tags Section */}
                  <div className="pt-4 border-t border-gray-200">
                    <div className="flex items-center mb-3">
                      <TagIcon className="w-4 h-4 text-gray-600 mr-2" />
                      <h4 className="text-sm font-semibold text-gray-900">Tags</h4>
                    </div>
                    {user.tags && user.tags.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {user.tags.map((tag) => (
                          <span
                            key={tag._id}
                            className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200 hover:bg-gray-200 transition-colors"
                          >
                            <TagIcon className="w-3 h-3 mr-1" />
                            {tag.tagName}
              </span>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <TagIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-xs text-gray-500">No tags assigned</p>
                      </div>
                    )}
                  </div>
                </div>
            </div>
          </div>

            {/* Stats and Quick Info */}
            <div className="lg:col-span-2 space-y-8">
              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                {/* Meetings Card */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-all duration-200">
                  <div className="flex flex-col items-center text-center space-y-3">
                    <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
                      <ClockIcon className="w-6 h-6 text-gray-600" />
                    </div>
                    <div>
                      <p className="text-3xl font-bold text-gray-900">{stats.meetingsCreated}</p>
                      <p className="text-sm text-gray-600 font-medium">Meetings</p>
                    </div>
                  </div>
                </div>

                {/* Schedules Card */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-all duration-200">
                  <div className="flex flex-col items-center text-center space-y-3">
                    <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
                      <ChartBarIcon className="w-6 h-6 text-gray-600" />
                    </div>
                    <div>
                      <p className="text-3xl font-bold text-gray-900">{stats.schedules}</p>
                      <p className="text-sm text-gray-600 font-medium">Schedules</p>
                    </div>
                  </div>
                </div>

                {/* Conflicts Card */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-all duration-200">
                  <div className="flex flex-col items-center text-center space-y-3">
                    <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
                      <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-3xl font-bold text-gray-900">{stats.conflicts}</p>
                      <p className="text-sm text-gray-600 font-medium">Conflicts</p>
                    </div>
                  </div>
                </div>

                {/* Custom Tags Card */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-all duration-200 cursor-pointer group" onClick={handleOpenCustomTagsModal}>
                  <div className="flex flex-col items-center text-center space-y-3">
                    <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center group-hover:bg-gray-200 transition-colors">
                      <TagIcon className="w-6 h-6 text-gray-600" />
                    </div>
                    <div>
                      <p className="text-3xl font-bold text-gray-900">{stats.customTags}</p>
                      <p className="text-sm text-gray-600 font-medium">Custom Tags</p>
                    </div>
                    <div className="pt-1">
                      <span className="text-xs text-gray-600 hover:text-gray-800 font-medium group-hover:underline">
                        Manage →
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Today's Schedules */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                <h3 className="text-lg font-bold text-gray-900 mb-5 flex items-center">
                  <CalendarIcon className="w-5 h-5 text-gray-600 mr-2" />
                  Today's Schedules
                </h3>
                {todaySchedules.length > 0 ? (
                  <div className="space-y-3">
                    {todaySchedules.map((schedule) => (
                      <div key={schedule._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all duration-200 hover:border-gray-300">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="text-sm font-bold text-gray-900 truncate">{schedule.title}</h4>
                              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${getPriorityColor(schedule.priority)}`}>
                                {schedule.priority}
                              </span>
                              {schedule.recurring && (
                                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
                                  Recurring
                                </span>
                              )}
                            </div>
                            
                            {schedule.subtitle && (
                              <p className="text-xs text-gray-600 mb-2 truncate font-medium">{schedule.subtitle}</p>
                            )}
                            
                            <div className="flex items-center gap-4 text-xs text-gray-600 mb-2">
                              <div className="flex items-center gap-1">
                                <ClockIcon className="w-3 h-3 text-gray-500" />
                                <span className="font-medium">{formatTime(new Date(schedule.startDateTime))} - {formatTime(new Date(schedule.endDateTime))}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <CalendarIcon className="w-3 h-3 text-gray-500" />
                                <span className="font-medium">{schedule.scheduleType}</span>
                              </div>
                            </div>
                            
                            {schedule.locationLink && (
                              <div className="flex items-center gap-1 text-xs text-gray-600 mb-2">
                                <MapPinIcon className="w-3 h-3 text-gray-500" />
                                <span className="truncate">{schedule.locationLink}</span>
                              </div>
                            )}
                            
                            {schedule.description && (
                              <p className="text-xs text-gray-700 line-clamp-2 leading-relaxed">{schedule.description}</p>
                            )}
                          </div>
                          
                          <button
                            onClick={() => handleViewSchedule(schedule)}
                            className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all duration-200 hover:shadow-sm ml-3 flex-shrink-0"
                            title="View Details"
                          >
                            <EyeIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <CalendarIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <h4 className="text-sm font-medium text-gray-600 mb-1">No schedules for today</h4>
                    <p className="text-xs text-gray-500">You have a free day!</p>
                  </div>
                )}
              </div>


              
          </div>
        </div>
      </div>
      </div>
    );
  };



  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gray-300 border-t-black rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">No user data available</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <LeadersSidebar 
        isOpen={isSidebarOpen}
        onToggle={handleToggleSidebar}
        activePage="profile"
        onPageChange={handlePageChange}
        onLogout={handleLogout}
      />
      <main className={`flex-1 transition-all duration-300 ${isSidebarOpen ? 'md:ml-64' : 'md:ml-16'}`}>
        {renderProfileContent()}
      </main>

      {/* Schedule Details Modal */}
      {selectedSchedule && (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white/95 backdrop-blur-md rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl border border-gray-200/50">
            {/* Themed Header */}
            <div className="bg-[#080325] text-white px-6 py-4 rounded-t-xl">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-white">Schedule Details</h2>
                <button
                  onClick={() => setSelectedSchedule(null)}
                  className="text-white/80 hover:text-white p-1.5 hover:bg-white/10 rounded-full transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1">{selectedSchedule.title}</h3>
                  {selectedSchedule.subtitle && (
                    <p className="text-sm text-gray-600 mb-2">{selectedSchedule.subtitle}</p>
                  )}
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${getPriorityColor(selectedSchedule.priority)}`}>
                      {selectedSchedule.priority} priority
                    </span>
                    <span className="text-xs text-gray-600">{selectedSchedule.scheduleType}</span>
                    {selectedSchedule.recurring && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
                        Recurring
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1 text-sm">Date & Time</h4>
                    <p className="text-sm text-gray-700">
                      {new Date(selectedSchedule.startDateTime).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        timeZone: 'UTC'
                      })}
                    </p>
                    <p className="text-sm text-gray-700">
                      {formatTime(new Date(selectedSchedule.startDateTime))} - {formatTime(new Date(selectedSchedule.endDateTime))}
                    </p>
                  </div>

                  {selectedSchedule.locationLink && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1 text-sm">Location</h4>
                      <a 
                        href={selectedSchedule.locationLink} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-[#080325] hover:underline text-sm"
                      >
                        {selectedSchedule.locationLink}
                      </a>
                    </div>
                  )}
                </div>

                {selectedSchedule.description && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1 text-sm">Description</h4>
                    <p className="text-sm text-gray-700">{selectedSchedule.description}</p>
                  </div>
                )}

                {selectedSchedule.recurring && selectedSchedule.recurrencePattern && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1 text-sm">Recurrence Pattern</h4>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-sm text-gray-700">
                        <strong>Frequency:</strong> {selectedSchedule.recurrencePattern.frequency}
                      </p>
                      <p className="text-sm text-gray-700">
                        <strong>Interval:</strong> Every {selectedSchedule.recurrencePattern.interval} {selectedSchedule.recurrencePattern.frequency === 'daily' ? 'day(s)' : selectedSchedule.recurrencePattern.frequency === 'weekly' ? 'week(s)' : 'month(s)'}
                      </p>
                      {selectedSchedule.recurrencePattern.frequency === 'weekly' && selectedSchedule.recurrencePattern.daysOfWeek && selectedSchedule.recurrencePattern.daysOfWeek.length > 0 && (
                        <p className="text-sm text-gray-700">
                          <strong>Days:</strong> {selectedSchedule.recurrencePattern.daysOfWeek.map(day => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][day]).join(', ')}
                        </p>
                      )}
                      {selectedSchedule.recurrencePattern.endDate && (
                        <p className="text-sm text-gray-700">
                          <strong>End Date:</strong> {new Date(selectedSchedule.recurrencePattern.endDate).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            timeZone: 'UTC'
                          })}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex gap-3 pt-3 border-t border-gray-200">
                  <button
                    onClick={() => setSelectedSchedule(null)}
                    className="w-full bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors text-sm"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Custom Tags Management Modal */}
      {showCustomTagsModal && (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white/95 backdrop-blur-md rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl border border-gray-200/50">
            {/* Header */}
            <div className="bg-[#080325] text-white px-6 py-4 rounded-t-xl">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-white">Custom Tags Management</h2>
                <button
                  onClick={handleCloseCustomTagsModal}
                  className="text-white/80 hover:text-white p-1.5 hover:bg-white/10 rounded-full transition-colors"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
              {/* Header Actions */}
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Your Custom Tags</h3>
                  <p className="text-sm text-gray-600">Create and manage custom participant groups for meetings</p>
                </div>
                <button
                  onClick={handleCreateTag}
                  className="bg-[#080325] text-white px-4 py-2 rounded-lg hover:bg-[#0a0a2a] transition-all duration-200 flex items-center gap-2 shadow-sm hover:shadow-md"
                >
                  <PlusIcon className="w-4 h-4" />
                  Create Tag
                </button>
              </div>

              {/* Tags List */}
              {customTags.length === 0 ? (
                <div className="text-center py-12">
                  <TagIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Custom Tags Yet</h3>
                  <p className="text-gray-600 mb-6">Create your first custom tag to group participants for meetings</p>
                  <button
                    onClick={handleCreateTag}
                    className="bg-[#080325] text-white px-6 py-3 rounded-lg hover:bg-[#0a0a2a] transition-all duration-200 flex items-center gap-2 mx-auto"
                  >
                    <PlusIcon className="w-5 h-5" />
                    Create Your First Tag
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {customTags.map((tag) => (
                    <div key={tag._id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all duration-200">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 mb-1">{tag.name}</h4>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <UserGroupIcon className="w-4 h-4" />
                            <span>{tag.participants.length} participant{tag.participants.length !== 1 ? 's' : ''}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleEditTag(tag)}
                            className="p-1.5 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit Tag"
                          >
                            <PencilIcon className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteTag(tag)}
                            className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete Tag"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      
                      {/* Participants List */}
                      <div className="space-y-1">
                        {tag.participants.slice(0, 3).map((participant) => (
                          <div key={participant._id} className="text-xs text-gray-600 flex items-center gap-2">
                            <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                            <span className="truncate">{participant.name}</span>
                          </div>
                        ))}
                        {tag.participants.length > 3 && (
                          <div className="text-xs text-gray-500">
                            +{tag.participants.length - 3} more participants
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Tag Modal */}
      {(showCreateTagModal || showEditTagModal) && (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white/95 backdrop-blur-md rounded-xl w-full max-w-4xl max-h-[95vh] overflow-hidden shadow-2xl border border-gray-200/50">
            {/* Header */}
            <div className="bg-[#080325] text-white px-6 py-4 rounded-t-xl">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-white">
                  {showEditTagModal ? 'Edit Custom Tag' : 'Create Custom Tag'}
                </h2>
                <button
                  onClick={() => {
                    setShowCreateTagModal(false);
                    setShowEditTagModal(false);
                    setTagFormData({ name: '', participants: [] });
                    setSelectedTag(null);
                    setParticipantSearchTerm('');
                  }}
                  className="text-white/80 hover:text-white p-1.5 hover:bg-white/10 rounded-full transition-colors"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Form Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(95vh-80px)]">
              <form onSubmit={handleTagFormSubmit} className="space-y-6">
                {/* Tag Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tag Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={tagFormData.name}
                    onChange={(e) => setTagFormData({ ...tagFormData, name: e.target.value })}
                    placeholder="Enter tag name (e.g., Development Team, Marketing Group)"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#080325] focus:border-transparent transition-all duration-200"
                  />
                </div>

                {/* Participants Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Select Participants *
                  </label>
                  
                  {/* Search Bar */}
                  <div className="mb-3">
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Search by name, role, or department..."
                        value={participantSearchTerm}
                        onChange={(e) => setParticipantSearchTerm(e.target.value)}
                        className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#080325] focus:border-transparent transition-all duration-200 text-sm"
                      />
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </div>
                      {participantSearchTerm && (
                        <button
                          onClick={() => setParticipantSearchTerm('')}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        >
                          <XMarkIcon className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="border border-gray-300 rounded-lg p-4 max-h-80 overflow-y-auto bg-gray-50">
                    {allParticipants.length === 0 ? (
                      <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-400 mx-auto mb-2"></div>
                        <p className="text-sm text-gray-500">Loading participants...</p>
                      </div>
                    ) : filteredParticipants.length === 0 ? (
                      <div className="text-center py-8">
                        <svg className="h-12 w-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <p className="text-sm text-gray-500 mb-1">No participants found</p>
                        <p className="text-xs text-gray-400">Try adjusting your search terms</p>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        {filteredParticipants.map((participant) => (
                          <label key={participant._id} className="flex items-center gap-3 p-3 hover:bg-white rounded-lg cursor-pointer transition-colors border-b border-gray-100 last:border-b-0">
                            <input
                              type="checkbox"
                              checked={tagFormData.participants.includes(participant._id)}
                              onChange={() => handleParticipantToggle(participant._id)}
                              className="w-4 h-4 text-[#080325] border-gray-300 rounded focus:ring-[#080325] focus:ring-2"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-gray-900 truncate">{participant.name}</span>
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-200 text-gray-700 capitalize">
                                  {participant.role?.name || 'No Role'}
                                </span>
                              </div>
                              {participant.department && (
                                <p className="text-xs text-gray-500 mt-1 truncate">
                                  {participant.department.title}
                                </p>
                              )}
                            </div>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex justify-between items-center mt-3">
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">{tagFormData.participants.length}</span> of <span className="font-medium">{allParticipants.length}</span> participants selected
                      {participantSearchTerm && (
                        <span className="text-gray-500 ml-1">
                          ({filteredParticipants.length} shown)
                        </span>
                      )}
                    </p>
                    {tagFormData.participants.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setTagFormData({ ...tagFormData, participants: [] })}
                        className="text-xs text-red-600 hover:text-red-800 font-medium"
                      >
                        Clear All
                      </button>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4 border-t border-gray-200">
                  <button
                    type="submit"
                    disabled={isSubmittingTag || !tagFormData.name.trim() || tagFormData.participants.length === 0}
                    className="flex-1 bg-[#080325] text-white px-6 py-3 rounded-lg hover:bg-[#0a0a2a] transition-all duration-200 shadow-sm hover:shadow-md font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isSubmittingTag ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        {showEditTagModal ? 'Updating...' : 'Creating...'}
                      </>
                    ) : (
                      showEditTagModal ? 'Update Tag' : 'Create Tag'
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateTagModal(false);
                      setShowEditTagModal(false);
                      setTagFormData({ name: '', participants: [] });
                      setSelectedTag(null);
                      setParticipantSearchTerm('');
                    }}
                    className="flex-1 bg-gray-100 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-200 transition-all duration-200 border border-gray-300 font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteTagModal && tagToDelete && (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white/95 backdrop-blur-md rounded-xl w-full max-w-md mx-4 shadow-2xl border border-gray-200/50">
            {/* Header */}
            <div className="bg-red-600 text-white px-6 py-4 rounded-t-xl">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-white">Delete Custom Tag</h2>
                <button
                  onClick={() => {
                    setShowDeleteTagModal(false);
                    setTagToDelete(null);
                  }}
                  className="text-white/80 hover:text-white p-1.5 hover:bg-white/10 rounded-full transition-colors"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <TrashIcon className="w-6 h-6 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Are you sure?</h3>
                <p className="text-sm text-gray-600 mb-4">
                  You are about to delete the custom tag <strong>"{tagToDelete.name}"</strong>. 
                  This action cannot be undone.
                </p>
                <p className="text-xs text-gray-500 mb-6">
                  This tag has {tagToDelete.participants.length} participant{tagToDelete.participants.length !== 1 ? 's' : ''}.
                </p>
                
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowDeleteTagModal(false);
                      setTagToDelete(null);
                    }}
                    className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmDeleteTag}
                    className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors font-medium"
                  >
                    Delete Tag
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
