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
  EyeIcon
} from '@heroicons/react/24/outline';

const Profile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [stats, setStats] = useState({
    meetingsCreated: 0,
    schedules: 0,
    conflicts: 0
  });
  const [todaySchedules, setTodaySchedules] = useState([]);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL_STAGING || 'http://localhost:5000/api/testing';

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
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-left mb-8">
            <h1 className="text-5xl font-bold text-gray-900 mb-2">Profile</h1>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Profile Card */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="text-center mb-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-2">{user.name || 'User Name'}</h2>
                  <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                    <CheckCircleIcon className="w-4 h-4 mr-1" />
                    {user.role === 'super leader' ? 'Super Leader' : 'Leader'}
        </div>
      </div>

                                <div className="space-y-4">
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
            <div className="lg:col-span-2 space-y-6">
              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center mr-4">
                      <ClockIcon className="w-5 h-5 text-gray-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900">{stats.meetingsCreated}</p>
                      <p className="text-sm text-gray-600">Upcoming Meetings</p>
                    </div>
                  </div>
            </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center mr-4">
                      <ChartBarIcon className="w-5 h-5 text-gray-600" />
            </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900">{stats.schedules}</p>
                      <p className="text-sm text-gray-600">Upcoming Schedules</p>
            </div>
              </div>
            </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center mr-4">
                      <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
              </div>
              <div>
                      <p className="text-2xl font-bold text-gray-900">{stats.conflicts}</p>
                      <p className="text-sm text-gray-600">Conflicts</p>
                    </div>
              </div>
            </div>
          </div>

              {/* Today's Schedules */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
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
      <main className={`flex-1 transition-all duration-300 ${isSidebarOpen ? 'lg:ml-48' : 'lg:ml-12'}`}>
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
    </div>
  );
};

export default Profile;
