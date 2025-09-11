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
  TagIcon
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

        setStats({
          meetingsCreated: meetingsResponse.data.data?.length || 0,
          schedules: schedulesResponse.data.data?.length || 0,
          conflicts: conflictsResponse.data.data?.conflicts?.length || 0
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    };

    fetchUserData();
    fetchStats();
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

                  <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                    <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center mr-3">
                      <CalendarIcon className="w-5 h-5 text-gray-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-1">Member Since</p>
                      <p className="text-base font-semibold text-gray-900">
                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        }) : 'Unknown'}
                      </p>
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
                      <p className="text-sm text-gray-600">Meetings Created</p>
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
                      <p className="text-sm text-gray-600">Schedules</p>
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

              {/* Account Information */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
                  <InformationCircleIcon className="w-5 h-5 text-gray-600 mr-2" />
                  Account Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-1">Full Name</p>
                      <p className="text-base font-semibold text-gray-900">{user.name || 'Not provided'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-1">Role</p>
                      <p className="text-base font-semibold text-gray-900 capitalize">{user.role || 'Not assigned'}</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-1">Department</p>
                      <p className="text-base font-semibold text-gray-900">{user.department?.title || 'Not assigned'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-1">Designation</p>
                      <p className="text-base font-semibold text-gray-900">{user.designation || 'Not specified'}</p>
                    </div>
          </div>
        </div>
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
      <main className={`flex-1 transition-all duration-300 ${isSidebarOpen ? 'lg:ml-64' : 'lg:ml-16'}`}>
        {renderProfileContent()}
      </main>
    </div>
  );
};

export default Profile;
