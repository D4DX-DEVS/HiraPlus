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

const Meetings = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
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
  const [showCustomDepartment, setShowCustomDepartment] = useState(false);
  const [customDepartment, setCustomDepartment] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startDatetime: '',
    endDatetime: '',
    hall: 'Auditorium',
    noOfPersons: 0,
    foodRequired: false,
    breakfast: 0,
    midmorningSnacks: 0,
    lunch: 0,
    eveningsnacks: 0,
    dinner: 0,
    department: ''
  });

  const halls = ['Auditorium', 'Conference Hall', 'Meeting Space'];

  // Fetch departments
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/auth/departments`);
        setDepartments(response.data.departments);
        
        // If editing and department exists, check if it's in the list
        if (editingMeeting?.department && !response.data.departments.includes(editingMeeting.department)) {
          setShowCustomDepartment(true);
          setCustomDepartment(editingMeeting.department);
        }
      } catch (err) {
        console.error('Failed to fetch departments:', err);
      }
    };
    fetchDepartments();
  }, [editingMeeting]);

  const handleDepartmentChange = (e) => {
    const value = e.target.value;
    if (value === 'other') {
      setShowCustomDepartment(true);
      setFormData(prev => ({
        ...prev,
        department: ''
      }));
    } else {
      setShowCustomDepartment(false);
      setFormData(prev => ({
        ...prev,
        department: value
      }));
    }
  };

  const handleCustomDepartmentChange = (e) => {
    const value = e.target.value;
    setCustomDepartment(value);
    setFormData(prev => ({
      ...prev,
      department: value
    }));
  };

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
    try {
      const token = localStorage.getItem('adminToken');
      const url = `${import.meta.env.VITE_API_URL}/admin/meetings${editingMeeting ? `/${editingMeeting._id}` : ''}`;
      const method = editingMeeting ? 'put' : 'post';

      await axios({
        method,
        url,
        data: formData,
        headers: { Authorization: `Bearer ${token}` }
      });

      setShowModal(false);
      setEditingMeeting(null);
      setFormData({
        title: '',
        description: '',
        startDatetime: '',
        endDatetime: '',
        hall: 'Auditorium',
        noOfPersons: 0,
        foodRequired: false,
        breakfast: 0,
        midmorningSnacks: 0,
        lunch: 0,
        eveningsnacks: 0,
        dinner: 0,
        department: ''
      });
      fetchMeetings();
    } catch (err) {
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
    setFormData({
      title: meeting.title,
      description: meeting.description,
      startDatetime: format(new Date(meeting.startDatetime), "yyyy-MM-dd'T'HH:mm"),
      endDatetime: format(new Date(meeting.endDatetime), "yyyy-MM-dd'T'HH:mm"),
      hall: meeting.hall,
      noOfPersons: meeting.noOfPersons,
      foodRequired: meeting.foodRequired,
      breakfast: meeting.breakfast || 0,
      midmorningSnacks: meeting.midmorningSnacks || 0,
      lunch: meeting.lunch || 0,
      eveningsnacks: meeting.eveningsnacks || 0,
      dinner: meeting.dinner || 0,
      department: meeting.department
    });
    setShowModal(true);
  };

  const handleStatusChange = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const meeting = statusConfirm.meeting;
      const newStatus = meeting.status === 'pending' ? 'approved' : 'pending';
      
      await axios({
        method: 'put',
        url: `${import.meta.env.VITE_API_URL}/admin/meetings/${meeting._id}`,
        data: { ...meeting, status: newStatus },
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
    const matchesSearch = searchQuery.trim() === '' || 
      meeting.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      meeting.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      meeting.department?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      meeting.hall?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesDepartment = selectedDepartment === '' || meeting.department === selectedDepartment;

    return matchesSearch && matchesDepartment;
  });

  useEffect(() => {
    fetchMeetings();
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
      
      <div className="flex pt-[60px] min-h-screen">
        <Sidebar isOpen={isSidebarOpen} />
        
        <main className={`flex-1 bg-gray-100 transition-all duration-300 ease-in-out ${isSidebarOpen ? 'ml-64' : 'ml-0'}`}>
          <div className="p-6">
            <div className="max-w-7xl mx-auto">
              <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-semibold text-gray-900">Meeting Management</h1>
                <button
                  onClick={() => {
                    setEditingMeeting(null);
                    setFormData({
                      title: '',
                      description: '',
                      startDatetime: '',
                      endDatetime: '',
                      hall: 'Auditorium',
                      noOfPersons: 0,
                      foodRequired: false,
                      breakfast: 0,
                      midmorningSnacks: 0,
                      lunch: 0,
                      eveningsnacks: 0,
                      dinner: 0,
                      department: ''
                    });
                    setShowModal(true);
                  }}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-md flex items-center hover:bg-indigo-700"
                >
                  <PlusIcon className="h-5 w-5 mr-2" />
                  Add Meeting
                </button>
              </div>

              {/* Search and Filter Section */}
              <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Search Box */}
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by title, description, department, or hall..."
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>

                {/* Department Filter */}
                <div>
                  <select
                    value={selectedDepartment}
                    onChange={(e) => setSelectedDepartment(e.target.value)}
                    className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                  >
                    <option value="">All Departments</option>
                    {departments.map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>
              </div>

              {error && (
                <div className="mb-4 rounded-md bg-red-50 p-3">
                  <div className="text-sm text-red-700">{error}</div>
                </div>
              )}

              {/* Modal */}
              {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                  <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                    <h2 className="text-xl font-semibold mb-4">
                      {editingMeeting ? 'Edit Meeting' : 'Add Meeting'}
                    </h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Title</label>
                          <input
                            type="text"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            className="mt-1 block w-full rounded-lg border-2 border-indigo-100 px-3 py-2"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700">Department</label>
                          <select
                            value={showCustomDepartment ? 'other' : formData.department}
                            onChange={handleDepartmentChange}
                            className="mt-1 block w-full rounded-lg border-2 border-indigo-100 px-3 py-2"
                            required
                          >
                            <option value="">Select Department</option>
                            {departments.map(dept => (
                              <option key={dept} value={dept}>{dept}</option>
                            ))}
                            <option value="other">Other</option>
                          </select>
                        </div>

                        {showCustomDepartment && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700">New Department Name</label>
                            <input
                              type="text"
                              value={customDepartment}
                              onChange={handleCustomDepartmentChange}
                              className="mt-1 block w-full rounded-lg border-2 border-indigo-100 px-3 py-2"
                              placeholder="Enter new department name"
                              required
                            />
                          </div>
                        )}

                        <div>
                          <label className="block text-sm font-medium text-gray-700">Start Date & Time</label>
                          <input
                            type="datetime-local"
                            value={formData.startDatetime}
                            onChange={(e) => setFormData({ ...formData, startDatetime: e.target.value })}
                            className="mt-1 block w-full rounded-lg border-2 border-indigo-100 px-3 py-2"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700">End Date & Time</label>
                          <input
                            type="datetime-local"
                            value={formData.endDatetime}
                            onChange={(e) => setFormData({ ...formData, endDatetime: e.target.value })}
                            className="mt-1 block w-full rounded-lg border-2 border-indigo-100 px-3 py-2"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700">Hall</label>
                          <select
                            value={formData.hall}
                            onChange={(e) => setFormData({ ...formData, hall: e.target.value })}
                            className="mt-1 block w-full rounded-lg border-2 border-indigo-100 px-3 py-2"
                            required
                          >
                            {halls.map(hall => (
                              <option key={hall} value={hall}>{hall}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700">Number of Persons</label>
                          <input
                            type="number"
                            min="1"
                            value={formData.noOfPersons}
                            onChange={(e) => setFormData({ ...formData, noOfPersons: parseInt(e.target.value) || 0 })}
                            className="mt-1 block w-full rounded-lg border-2 border-indigo-100 px-3 py-2"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">Description</label>
                        <textarea
                          value={formData.description}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                          rows={3}
                          className="mt-1 block w-full rounded-lg border-2 border-indigo-100 px-3 py-2"
                          required
                        />
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="foodRequired"
                            checked={formData.foodRequired}
                            onChange={(e) => setFormData({ ...formData, foodRequired: e.target.checked })}
                            className="h-4 w-4 text-indigo-600 rounded border-gray-300"
                          />
                          <label htmlFor="foodRequired" className="ml-2 text-sm font-medium text-gray-700">
                            Food Required
                          </label>
                        </div>

                        {formData.foodRequired && (
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700">Breakfast</label>
                              <input
                                type="number"
                                min="0"
                                value={formData.breakfast}
                                onChange={(e) => setFormData({ ...formData, breakfast: parseInt(e.target.value) || 0 })}
                                className="mt-1 block w-full rounded-lg border-2 border-indigo-100 px-3 py-2"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700">Mid-morning Snacks</label>
                              <input
                                type="number"
                                min="0"
                                value={formData.midmorningSnacks}
                                onChange={(e) => setFormData({ ...formData, midmorningSnacks: parseInt(e.target.value) || 0 })}
                                className="mt-1 block w-full rounded-lg border-2 border-indigo-100 px-3 py-2"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700">Lunch</label>
                              <input
                                type="number"
                                min="0"
                                value={formData.lunch}
                                onChange={(e) => setFormData({ ...formData, lunch: parseInt(e.target.value) || 0 })}
                                className="mt-1 block w-full rounded-lg border-2 border-indigo-100 px-3 py-2"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700">Evening Snacks</label>
                              <input
                                type="number"
                                min="0"
                                value={formData.eveningsnacks}
                                onChange={(e) => setFormData({ ...formData, eveningsnacks: parseInt(e.target.value) || 0 })}
                                className="mt-1 block w-full rounded-lg border-2 border-indigo-100 px-3 py-2"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700">Dinner</label>
                              <input
                                type="number"
                                min="0"
                                value={formData.dinner}
                                onChange={(e) => setFormData({ ...formData, dinner: parseInt(e.target.value) || 0 })}
                                className="mt-1 block w-full rounded-lg border-2 border-indigo-100 px-3 py-2"
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="mt-6 flex justify-end space-x-3">
                        <button
                          type="button"
                          onClick={() => setShowModal(false)}
                          className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md"
                        >
                          {editingMeeting ? 'Update' : 'Create'}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {loading ? (
                <div className="text-center py-12">
                  <div className="text-lg text-gray-600">Loading...</div>
                </div>
              ) : (
                <div className="bg-white shadow-sm rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hall</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Start Time</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">End Time</th>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredMeetings.map((meeting, index) => (
                          <tr key={meeting._id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{meeting.title}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{meeting.department}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{meeting.hall}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {format(new Date(meeting.startDatetime), 'MMM d, yyyy HH:mm')}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {format(new Date(meeting.endDatetime), 'MMM d, yyyy HH:mm')}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                              <button
                                onClick={() => setStatusConfirm({ show: true, meeting })}
                                className={`px-2 inline-flex items-center text-xs leading-5 font-semibold rounded-full ${
                                  meeting.status === 'approved' 
                                    ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                                    : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                                }`}
                              >
                                {meeting.status === 'approved' ? (
                                  <CheckCircleIcon className="h-4 w-4 mr-1" />
                                ) : (
                                  <ClockIcon className="h-4 w-4 mr-1" />
                                )}
                                {meeting.status}
                              </button>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <div className="flex justify-end space-x-2">
                                <button
                                  onClick={() => handleEdit(meeting)}
                                  className="text-indigo-600 hover:text-indigo-900 transition-colors p-1.5 hover:bg-indigo-50 rounded-full"
                                  title="Edit"
                                >
                                  <PencilIcon className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => setDeleteConfirm({ show: true, meetingId: meeting._id })}
                                  className="text-red-600 hover:text-red-900 transition-colors p-1.5 hover:bg-red-50 rounded-full"
                                  title="Delete"
                                >
                                  <TrashIcon className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                        {filteredMeetings.length === 0 && (
                          <tr>
                            <td colSpan="7" className="px-6 py-4 text-center text-gray-500 italic">
                              No meetings found
                            </td>
                          </tr>
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