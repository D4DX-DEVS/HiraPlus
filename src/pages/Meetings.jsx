import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { 
  PencilIcon, 
  TrashIcon, 
  PlusIcon, 
  CheckCircleIcon, 
  ClockIcon,
  MagnifyingGlassIcon 
} from '@heroicons/react/24/outline';
import ConfirmDialog from '../components/ConfirmDialog';
import { ListItemSkeleton } from '../components/SkeletonLoaders';

const Meetings = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    const saved = localStorage.getItem('sidebarOpen');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [meetings, setMeetings] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, meetingId: null });
  const [statusConfirm, setStatusConfirm] = useState({ show: false, meeting: null });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [departments, setDepartments] = useState([]);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startDatetime: '',
    endDatetime: '',
    hall: 'Auditorium [2nd Floor]',
    rent: '0',
    noOfPersons: '',
    hiraStaff: 0,
    guests: 0,
    foodRequired: false,
    breakfast: 0,
    morningSnacksCount: 0,
    morningTeaCount: 0,
    lunch: 0,
    eveningSnacksCount: 0,
    eveningTeaCount: 0,
    dinner: 0,
    department: '',
    subDepartment: ''
  });

  const halls = [
    'Auditorium [2nd Floor]',
    'Conference Hall [3rd Floor]',
    'Meeting Space [1st Floor]'
  ];

  // Fetch departments
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/departments`);
        setDepartments(response.data.departments);
      } catch (err) {
        console.error('Failed to fetch departments:', err);
      }
    };
    fetchDepartments();
  }, []);

  const fetchMeetings = async () => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('adminToken');
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/admin/meetings`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setMeetings(response.data.meetings || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch meetings');
      console.error('Error fetching meetings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Frontend validation
    if (!formData.title.trim()) {
      setError('Title is required');
      return;
    }
    if (!formData.description.trim()) {
      setError('Description is required');
      return;
    }
    if (!formData.startDatetime) {
      setError('Start date and time is required');
      return;
    }
    if (!formData.endDatetime) {
      setError('End date and time is required');
      return;
    }
    if (!formData.department) {
      setError('Department is required');
      return;
    }

    // Check if selected department is hierarchical and requires sub-department
    if (!departments || departments.length === 0) {
      setError('Departments not loaded. Please refresh the page.');
      return;
    }
    
    const selectedDept = departments.find(dept => 
      (typeof dept === 'string' ? dept : dept.title) === formData.department
    );
    
    if (selectedDept && selectedDept.isHierarchical && !formData.subDepartment.trim()) {
      setError('Sub-department is required for Outside Departments');
      return;
    }
    if (!formData.rent && formData.rent !== 0) {
      setError('Rent amount is required');
      return;
    }
    if (parseInt(formData.rent) < 0) {
      setError('Rent amount must be 0 or greater');
      return;
    }
    if (!formData.noOfPersons || parseInt(formData.noOfPersons) < 1) {
      setError('Number of participants must be at least 1');
      return;
    }

    try {
      const token = localStorage.getItem('adminToken');
      const url = `${import.meta.env.VITE_API_URL}/admin/meetings${editingMeeting ? `/${editingMeeting._id}` : ''}`;
      const method = editingMeeting ? 'put' : 'post';

      // Ensure all numeric fields are properly parsed
      const submitData = {
        ...formData,
        rent: parseInt(formData.rent) || 0,
        noOfPersons: parseInt(formData.noOfPersons) || 1,
        hiraStaff: Math.floor(parseInt(formData.noOfPersons) / 2) || 0,
        guests: Math.ceil(parseInt(formData.noOfPersons) / 2) || 1,
        breakfast: parseInt(formData.breakfast) || 0,
        morningSnacksCount: parseInt(formData.morningSnacksCount) || 0,
        morningTeaCount: parseInt(formData.morningTeaCount) || 0,
        lunch: parseInt(formData.lunch) || 0,
        eveningSnacksCount: parseInt(formData.eveningSnacksCount) || 0,
        eveningTeaCount: parseInt(formData.eveningTeaCount) || 0,
        dinner: parseInt(formData.dinner) || 0,
        subDepartment: formData.subDepartment.trim() || ''
      };

      console.log('Submitting meeting data:', submitData);
      console.log('Departments loaded:', departments.length);
      console.log('Selected department:', formData.department);
      console.log('Selected sub-department:', formData.subDepartment);
      console.log('Editing meeting:', editingMeeting);
      console.log('Method:', method);
      console.log('URL:', url);

      await axios({
        method,
        url,
        data: submitData,
        headers: { Authorization: `Bearer ${token}` }
      });

      setShowModal(false);
      setEditingMeeting(null);
      setFormData({
        title: '',
        description: '',
        startDatetime: '',
        endDatetime: '',
        hall: 'Auditorium [2nd Floor]',
        rent: '0',
        noOfPersons: '',
        hiraStaff: 0,
        guests: 0,
        foodRequired: false,
        breakfast: 0,
        morningSnacksCount: 0,
        morningTeaCount: 0,
        lunch: 0,
        eveningSnacksCount: 0,
        eveningTeaCount: 0,
        dinner: 0,
        department: '',
        subDepartment: ''
      });
      setError(''); // Clear any previous errors
      fetchMeetings();
    } catch (err) {
      console.error('Meeting submission error:', err);
      console.error('Error response:', err.response?.data);
      console.error('Error status:', err.response?.status);
      setError(err.response?.data?.message || 'Failed to save meeting');
    }
  };

  const handleDelete = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      await axios.delete(`${import.meta.env.VITE_API_URL}/admin/meetings/${deleteConfirm.meetingId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDeleteConfirm({ show: false, meetingId: null });
      fetchMeetings();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete meeting');
    }
  };

  const handleEdit = (meeting) => {
    setEditingMeeting(meeting);
    const departmentValue = typeof meeting.department === 'string' ? meeting.department : meeting.department?.title || '';
    setFormData({
      title: meeting.title || '',
      description: meeting.description || '',
      startDatetime: format(new Date(meeting.startDatetime), "yyyy-MM-dd'T'HH:mm"),
      endDatetime: format(new Date(meeting.endDatetime), "yyyy-MM-dd'T'HH:mm"),
      hall: meeting.hall || 'Auditorium [2nd Floor]',
      rent: meeting.rent?.toString() || '0',
      noOfPersons: meeting.noOfPersons || 0,
      hiraStaff: meeting.hiraStaff || 0,
      guests: meeting.guests || 0,
      foodRequired: meeting.foodRequired || false,
      breakfast: meeting.breakfast || 0,
      morningSnacksCount: meeting.morningSnacksCount || 0,
      morningTeaCount: meeting.morningTeaCount || 0,
      lunch: meeting.lunch || 0,
      eveningSnacksCount: meeting.eveningSnacksCount || 0,
      eveningTeaCount: meeting.eveningTeaCount || 0,
      dinner: meeting.dinner || 0,
      department: departmentValue,
      subDepartment: meeting.subDepartment || ''
    });
    setShowModal(true);
  };

  const handleStatusChange = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const meeting = statusConfirm.meeting;
      const newStatus = meeting.status === 'pending' ? 'approved' : 'pending';
      
      // Only send the status field for status updates
      await axios({
        method: 'put',
        url: `${import.meta.env.VITE_API_URL}/admin/meetings/${meeting._id}`,
        data: { status: newStatus },
        headers: { Authorization: `Bearer ${token}` }
      });

      setStatusConfirm({ show: false, meeting: null });
      fetchMeetings();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update meeting status');
    }
  };

  // Filter meetings based on search query and selected department
  const filteredMeetings = meetings.filter(meeting => {
    const departmentName = typeof meeting.department === 'string' ? meeting.department : meeting.department?.title || '';
    const matchesSearch = searchQuery.trim() === '' || 
      meeting.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      meeting.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      departmentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (meeting.subDepartment || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      meeting.hall?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesDepartment = selectedDepartment === '' || departmentName === selectedDepartment;

    return matchesSearch && matchesDepartment;
  });

  useEffect(() => {
    fetchMeetings();
  }, []);

  // Save sidebar state to localStorage
  useEffect(() => {
    localStorage.setItem('sidebarOpen', JSON.stringify(isSidebarOpen));
  }, [isSidebarOpen]);

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
      <Navbar 
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} 
        isSidebarOpen={isSidebarOpen}
      />
      
      <div className="flex flex-1 h-full">
        <Sidebar isOpen={isSidebarOpen} />
        
        <main className={`flex-1 transition-all duration-300 ease-in-out ${
          isSidebarOpen ? 'ml-64' : 'ml-0 lg:ml-20'
        } relative z-0 h-full overflow-auto`}>
          <div className="h-full pt-[52px] px-4 lg:px-6 pb-4 lg:pb-6">
            <div className="max-w-7xl mx-auto h-full flex flex-col">
              {/* Header Section */}
              <div className="mb-2 flex-shrink-0">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200/50 p-2 lg:p-3">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2">
                    <div>
                      <h1 className="text-lg lg:text-xl font-bold text-gray-900 mb-1">
                        Meeting Management
                      </h1>
                      <div className="flex items-center space-x-3 text-xs">
                        <span className="flex items-center text-green-600">
                          <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5"></div>
                          {filteredMeetings.filter(m => m.status === 'approved').length} Approved
                        </span>
                        <span className="flex items-center text-yellow-600">
                          <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full mr-1.5"></div>
                          {filteredMeetings.filter(m => m.status === 'pending').length} Pending
                        </span>
                        <span className="flex items-center text-green-600">
                          <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5"></div>
                          {filteredMeetings.length} Total
                        </span>
                      </div>
                    </div>
                    <button
                                              onClick={() => {
                          setEditingMeeting(null);
                          setFormData({
                            title: '',
                            description: '',
                            startDatetime: '',
                            endDatetime: '',
                            hall: 'Auditorium [2nd Floor]',
                            rent: '0',
                            noOfPersons: '',
                            hiraStaff: 0,
                            guests: 0,
                            foodRequired: false,
                            breakfast: 0,
                            morningSnacksCount: 0,
                            morningTeaCount: 0,
                            lunch: 0,
                            eveningSnacksCount: 0,
                            eveningTeaCount: 0,
                            dinner: 0,
                            department: '',
                            subDepartment: ''
                          });
                          setShowModal(true);
                        }}
                      className="inline-flex items-center px-3 py-1.5 bg-green-950 text-white font-medium rounded-lg hover:bg-green-900 focus:outline-none focus:ring-2 focus:ring-green-800 focus:ring-offset-2 transition-all duration-200 transform hover:scale-105 shadow-md hover:shadow-lg text-sm"
                    >
                      <PlusIcon className="h-4 w-4 mr-1.5" />
                      Add Meeting
                    </button>
                  </div>
                </div>
              </div>

              {/* Search and Filter Section */}
              <div className="mb-2 flex-shrink-0">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200/50 p-2">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
                    {/* Search Box */}
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search meetings..."
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm transition-all duration-200"
                      />
                    </div>

                    {/* Department Filter */}
                    <div>
                      <select
                        value={selectedDepartment}
                        onChange={(e) => setSelectedDepartment(e.target.value)}
                        className="block w-full px-3 py-2 text-sm border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 rounded-lg bg-white transition-all duration-200"
                      >
                        <option value="">All Departments</option>
                        {departments.map(dept => (
                          <option key={typeof dept === 'string' ? dept : dept._id} value={typeof dept === 'string' ? dept : dept.title}>
                            {typeof dept === 'string' ? dept : dept.title}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {error && (
                <div className="mb-6 bg-gradient-to-r from-red-50 to-red-100 border border-red-200 rounded-xl p-4">
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-red-500 rounded-full mr-3"></div>
                    <div className="text-sm text-red-700 font-medium">{error}</div>
                  </div>
                </div>
              )}

              {/* Add/Edit Form */}
              {showModal && (
                <div className="mb-4 bg-white shadow-lg rounded-xl border border-gray-200/50 p-4 lg:p-6 flex-shrink-0 max-w-4xl mx-auto">
                  <div className="mb-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-lg font-semibold text-gray-900">
                          {editingMeeting ? 'Edit Meeting' : 'Add Meeting'}
                        </h2>
                        <p className="text-sm text-gray-600 mt-1">
                          {editingMeeting ? 'Update meeting details and requirements' : 'Create a new meeting with all necessary details'}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setShowModal(false);
                          setEditingMeeting(null);
                        }}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                        title="Close"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Basic Information */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            <span className="flex items-center">
                              <svg className="h-4 w-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                              </svg>
                              Title
                            </span>
                          </label>
                          <input
                            type="text"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                            placeholder="Enter meeting title"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            <span className="flex items-center">
                              <svg className="h-4 w-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                              </svg>
                              Department
                            </span>
                          </label>
                          <select
                            required
                            value={formData.department}
                            onChange={(e) => {
                              setFormData({ 
                                ...formData, 
                                department: e.target.value,
                                subDepartment: '' // Reset sub-department when department changes
                              });
                            }}
                            className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                            disabled={loading}
                          >
                            <option value="">Select Department</option>
                            {departments.map(dept => (
                              <option key={typeof dept === 'string' ? dept : dept._id} value={typeof dept === 'string' ? dept : dept.title}>
                                {typeof dept === 'string' ? dept : dept.title}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Sub-Department Dropdown - Only show for hierarchical departments */}
                        {(() => {
                          // Safety check for departments array
                          if (!departments || departments.length === 0) {
                            return null;
                          }
                          
                          const selectedDept = departments.find(dept => 
                            (typeof dept === 'string' ? dept : dept.title) === formData.department
                          );
                          
                          if (selectedDept && selectedDept.isHierarchical) {
                            return (
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  <span className="flex items-center">
                                    <svg className="h-4 w-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                    </svg>
                                    Sub-Department (Outside Department)
                                  </span>
                                </label>
                                <select
                                  required
                                  value={formData.subDepartment}
                                  onChange={(e) => setFormData({ ...formData, subDepartment: e.target.value })}
                                  className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                                  disabled={loading}
                                >
                                  <option value="">Select Sub-Department</option>
                                  {selectedDept.subDepartments?.map(subDept => (
                                    <option key={subDept._id} value={subDept.title}>
                                      {subDept.title}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            );
                          }
                          return null;
                        })()}

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            <span className="flex items-center">
                              <svg className="h-4 w-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              Start Date & Time
                            </span>
                          </label>
                          <input
                            type="datetime-local"
                            value={formData.startDatetime}
                            onChange={(e) => setFormData({ ...formData, startDatetime: e.target.value })}
                            className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            <span className="flex items-center">
                              <svg className="h-4 w-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              End Date & Time
                            </span>
                          </label>
                          <input
                            type="datetime-local"
                            value={formData.endDatetime}
                            onChange={(e) => setFormData({ ...formData, endDatetime: e.target.value })}
                            className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            <span className="flex items-center">
                              <svg className="h-4 w-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                              </svg>
                              Venue
                            </span>
                          </label>
                          <select
                            value={formData.hall}
                            onChange={(e) => setFormData({ ...formData, hall: e.target.value })}
                            className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                            required
                          >
                            {halls.map(hall => (
                              <option key={hall} value={hall}>{hall}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            <span className="flex items-center">
                              <svg className="h-4 w-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m-3-9h6m-6 10h6" />
                              </svg>
                              Rent Amount (₹)
                            </span>
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={formData.rent}
                            onChange={(e) => setFormData({ ...formData, rent: e.target.value })}
                            className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                            placeholder="Enter rent amount"
                            required
                          />
                          <p className="mt-1 text-xs text-gray-500">
                            Set the venue rent cost for this specific meeting
                          </p>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            <span className="flex items-center">
                              <svg className="h-4 w-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                              </svg>
                              Total Participants
                            </span>
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={formData.noOfPersons || ''}
                            onChange={(e) => {
                              const total = parseInt(e.target.value) || '';
                              setFormData(prev => ({
                                ...prev,
                                noOfPersons: total,
                                hiraStaff: total ? Math.floor(total / 2) : 0,
                                guests: total ? Math.ceil(total / 2) : 0
                              }));
                            }}
                            className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                            placeholder="Eg: Total members count"
                            required
                          />
                        </div>
                      </div>

                      <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          <span className="flex items-center">
                            <svg className="h-4 w-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                            </svg>
                            Description
                          </span>
                        </label>
                        <textarea
                          value={formData.description}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                          rows={3}
                          className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors resize-none"
                          placeholder="Enter meeting description"
                          required
                        />
                      </div>
                    </div>

                    {/* Food Requirements */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center mb-4">
                        <input
                          type="checkbox"
                          id="foodRequired"
                          checked={formData.foodRequired}
                          onChange={(e) => setFormData({ ...formData, foodRequired: e.target.checked })}
                          className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                        />
                        <label htmlFor="foodRequired" className="ml-3 text-lg font-semibold text-gray-900">
                          Food / Snacks Required
                        </label>
                      </div>

                      {formData.foodRequired && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Breakfast</label>
                            <input
                              type="number"
                              min="0"
                              value={formData.breakfast}
                              onChange={(e) => setFormData({ ...formData, breakfast: parseInt(e.target.value) || 0 })}
                              className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                              placeholder="0"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Morning Snacks</label>
                            <input
                              type="number"
                              min="0"
                              value={formData.morningSnacksCount}
                              onChange={(e) => setFormData({ ...formData, morningSnacksCount: parseInt(e.target.value) || 0 })}
                              className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                              placeholder="0"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Morning Tea</label>
                            <input
                              type="number"
                              min="0"
                              value={formData.morningTeaCount}
                              onChange={(e) => setFormData({ ...formData, morningTeaCount: parseInt(e.target.value) || 0 })}
                              className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                              placeholder="0"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Lunch</label>
                            <input
                              type="number"
                              min="0"
                              value={formData.lunch}
                              onChange={(e) => setFormData({ ...formData, lunch: parseInt(e.target.value) || 0 })}
                              className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                              placeholder="0"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Evening Snacks</label>
                            <input
                              type="number"
                              min="0"
                              value={formData.eveningSnacksCount}
                              onChange={(e) => setFormData({ ...formData, eveningSnacksCount: parseInt(e.target.value) || 0 })}
                              className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                              placeholder="0"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Evening Tea</label>
                            <input
                              type="number"
                              min="0"
                              value={formData.eveningTeaCount}
                              onChange={(e) => setFormData({ ...formData, eveningTeaCount: parseInt(e.target.value) || 0 })}
                              className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                              placeholder="0"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Dinner</label>
                            <input
                              type="number"
                              min="0"
                              value={formData.dinner}
                              onChange={(e) => setFormData({ ...formData, dinner: parseInt(e.target.value) || 0 })}
                              className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                              placeholder="0"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                      <button
                        type="button"
                        onClick={() => {
                          setShowModal(false);
                          setEditingMeeting(null);
                        }}
                        className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-6 py-2.5 text-sm font-medium text-white bg-green-600 border border-transparent rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
                      >
                        {editingMeeting ? 'Update Meeting' : 'Create Meeting'}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Meetings Table */}
              {loading ? (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center py-12">
                    <div className="text-lg text-gray-600">Loading...</div>
                  </div>
                </div>
              ) : (
                <div className="bg-white shadow-lg rounded-xl border border-gray-200/50 overflow-hidden flex-1 flex flex-col min-h-0">
                  <div className="px-3 py-2 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200 flex-shrink-0">
                    <h3 className="text-base font-semibold text-gray-900">Meeting Directory</h3>
                    <p className="text-xs text-gray-600 mt-0.5">
                      {filteredMeetings.length} meeting{filteredMeetings.length !== 1 ? 's' : ''} found
                    </p>
                  </div>
                  <div className="flex-1 overflow-auto">
                    <table className="w-full divide-y divide-gray-200 table-fixed">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          <th className="px-2 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider" style={{width: '20%'}}>
                            Title
                          </th>
                          <th className="px-1 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider" style={{width: '12%'}}>
                            Dept
                          </th>
                          <th className="px-1 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider" style={{width: '15%'}}>
                            Venue
                          </th>
                          <th className="px-1 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider" style={{width: '8%'}}>
                            Count
                          </th>
                          <th className="px-1 py-2 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider" style={{width: '8%'}}>
                            Rent
                          </th>
                          <th className="px-1 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider" style={{width: '12%'}}>
                            Start Time
                          </th>
                          <th className="px-1 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider" style={{width: '12%'}}>
                            End Time
                          </th>
                          <th className="px-1 py-2 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider" style={{width: '10%'}}>
                            Status
                          </th>
                          <th className="px-1 py-2 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider" style={{width: '5%'}}>
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredMeetings.length === 0 ? (
                          <tr>
                            <td colSpan="9" className="px-6 py-8 text-center">
                              <div className="text-gray-400">
                                <svg className="w-10 h-10 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 7V3a4 4 0 118 0v4m-4 8v6m0 0l4-4m-4 4l-4-4m4-16a8 8 0 11-8 8 8 8 0 018-8z" />
                                </svg>
                                <p className="text-base font-medium text-gray-900 mb-1">No meetings found</p>
                                <p className="text-sm text-gray-600">Try adjusting your search criteria or add a new meeting.</p>
                              </div>
                            </td>
                          </tr>
                        ) : (
                          filteredMeetings.map((meeting, index) => (
                            <tr key={meeting._id} className="hover:bg-gray-200 transition-colors duration-150">
                              <td className="px-2 py-2">
                                <div className="text-xs font-medium text-gray-900 leading-relaxed break-words">
                                  {meeting.title}
                                </div>
                              </td>
                              <td className="px-1 py-1.5 whitespace-nowrap text-xs text-gray-900">
                                <div className="truncate" title={typeof meeting.department === 'string' ? meeting.department : meeting.department?.title || 'N/A'}>
                                  {typeof meeting.department === 'string' ? meeting.department : meeting.department?.title || 'N/A'}
                                </div>
                              </td>
                              <td className="px-1 py-1.5 whitespace-nowrap text-xs text-gray-900">
                                <div className="truncate" title={meeting.hall}>
                                  {meeting.hall}
                                </div>
                              </td>
                              <td className="px-1 py-1.5 whitespace-nowrap text-xs text-gray-900 text-center">
                                {meeting.noOfPersons}
                              </td>
                              <td className="px-1 py-1.5 whitespace-nowrap text-xs text-gray-900 text-center">
                                <span className="text-green-700 font-medium">
                                  ₹{(meeting.rent || 0).toLocaleString()}
                                </span>
                              </td>
                              <td className="px-1 py-1.5 whitespace-nowrap text-xs text-gray-900">
                                <div className="truncate" title={format(new Date(meeting.startDatetime), 'MMM d, yyyy h:mm a')}>
                                  {format(new Date(meeting.startDatetime), 'MMM d, h:mm a')}
                                </div>
                              </td>
                              <td className="px-1 py-1.5 whitespace-nowrap text-xs text-gray-900">
                                <div className="truncate" title={format(new Date(meeting.endDatetime), 'MMM d, yyyy h:mm a')}>
                                  {format(new Date(meeting.endDatetime), 'MMM d, h:mm a')}
                                </div>
                              </td>
                              <td className="px-1 py-1.5 whitespace-nowrap text-center">
                                <button
                                  onClick={() => setStatusConfirm({ show: true, meeting })}
                                  className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${
                                    meeting.status === 'approved' 
                                      ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                                      : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                                  }`}
                                  title={meeting.status}
                                >
                                  {meeting.status === 'approved' ? '✓' : '⏳'}
                                </button>
                              </td>
                              <td className="px-1 py-1.5 whitespace-nowrap text-center">
                                <div className="flex justify-center space-x-1">
                                  <button
                                    onClick={() => handleEdit(meeting)}
                                    className="text-green-600 hover:text-green-900 transition-colors p-0.5 hover:bg-green-50 rounded"
                                    title="Edit Meeting"
                                  >
                                    <PencilIcon className="h-3.5 w-3.5" />
                                  </button>
                                  <button
                                    onClick={() => setDeleteConfirm({ show: true, meetingId: meeting._id })}
                                    className="text-red-600 hover:text-red-900 transition-colors p-0.5 hover:bg-red-50 rounded"
                                    title="Delete Meeting"
                                  >
                                    <TrashIcon className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      <ConfirmDialog
        isOpen={deleteConfirm.show}
        title="Delete Meeting"
        message="Are you sure you want to delete this meeting? This action cannot be undone."
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirm({ show: false, meetingId: null })}
      />

      <ConfirmDialog
        isOpen={statusConfirm.show}
        title="Change Meeting Status"
        message={`Are you sure you want to change the status to ${statusConfirm.meeting?.status === 'pending' ? 'approved' : 'pending'}?`}
        onConfirm={handleStatusChange}
        onCancel={() => setStatusConfirm({ show: false, meeting: null })}
      />
    </div>
  );
};

export default Meetings; 