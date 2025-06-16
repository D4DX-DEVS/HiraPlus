import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import UserForm from '../components/UserForm';
import ConfirmDialog from '../components/ConfirmDialog';
import { TrashIcon, PlusIcon, PencilIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [error, setError] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, userId: null });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [departments, setDepartments] = useState([]);

  const fetchDepartments = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/auth/departments`);
      setDepartments(response.data.departments || []);
    } catch (err) {
      console.error('Failed to fetch departments:', err);
    }
  };

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/admin/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(response.data);
    } catch (err) {
      console.error('Fetch error:', err.response?.data);
      setError('Failed to fetch users');
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchDepartments();
  }, []);

  // Filter users based on search query and selected department
  const filteredUsers = users.filter(user => {
    const matchesSearch = searchQuery.trim() === '' || 
      user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.phoneNumber?.includes(searchQuery) ||
      user.department?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.designation?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesDepartment = selectedDepartment === '' || user.department === selectedDepartment;

    return matchesSearch && matchesDepartment;
  });

  const handleDelete = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      await axios.delete(`${import.meta.env.VITE_API_URL}/admin/users/${deleteConfirm.userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDeleteConfirm({ show: false, userId: null });
      fetchUsers();
    } catch (err) {
      setError('Failed to delete user');
    }
  };

  const handleEdit = async (userData) => {
    try {
      const token = localStorage.getItem('adminToken');
      await axios.put(
        `${import.meta.env.VITE_API_URL}/admin/users/${editingUser._id}`,
        userData,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setEditingUser(null);
      fetchUsers();
    } catch (err) {
      setError('Failed to update user');
      console.error('Update error:', err.response?.data);
    }
  };

  // Format date helper function
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
      
      <div className="flex pt-[60px] min-h-screen">
        <Sidebar isOpen={isSidebarOpen} />
        
        <main className={`flex-1 bg-gray-100 transition-all duration-300 ease-in-out ${isSidebarOpen ? 'ml-64' : 'ml-0'} relative z-0`}>
          <div className="p-6">
            <div className="max-w-7xl mx-auto">
              <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-semibold text-gray-900">Users</h1>
                <button
                  onClick={() => {
                    setEditingUser(null);
                    setShowAddForm(true);
                  }}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
                >
                  <PlusIcon className="h-5 w-5 mr-2" />
                  Add User
                </button>
              </div>

              {/* Search and Filter Section */}
              <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
                {/* Search Box */}
                <div className="relative w-full">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by name, phone, department, or designation..."
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-ellipsis"
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

              {showAddForm && (
                <div className="mb-6 bg-white shadow-sm rounded-lg p-6">
                  <UserForm
                    onSuccess={() => {
                      setShowAddForm(false);
                      fetchUsers();
                    }}
                    onCancel={() => setShowAddForm(false)}
                  />
                </div>
              )}

              {editingUser && (
                <div className="mb-6 bg-white shadow-sm rounded-lg p-6">
                  <UserForm
                    initialData={editingUser}
                    onSuccess={() => {
                      setEditingUser(null);
                      fetchUsers();
                    }}
                    onCancel={() => setEditingUser(null)}
                  />
                </div>
              )}

              <div className="bg-white shadow-sm rounded-md overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Phone Number
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Department
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Designation
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Verification
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Role
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Created At
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredUsers.map((user) => (
                        <tr key={user._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {user.name || <span className="text-red-500 italic">Required</span>}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {user.phoneNumber}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {user.department || <span className="text-red-500 italic">Required</span>}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {user.designation || <span className="text-red-500 italic">Required</span>}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-3 py-1 inline-flex text-xs font-medium rounded-full ${
                              user.isVerified
                                ? 'bg-green-100 text-green-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {user.isVerified ? 'Verified' : 'Pending'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-3 py-1 inline-flex text-xs font-medium rounded-full ${
                              user.isDeptHead
                                ? 'bg-purple-100 text-purple-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {user.isDeptHead ? 'Department Head' : 'Member'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-3 py-1 inline-flex text-xs font-medium rounded-full ${
                              user.status === 'active'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {user.status || 'active'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {user.createdAt ? formatDate(user.createdAt) : 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex justify-end space-x-2">
                              <button
                                onClick={() => setEditingUser(user)}
                                className="text-indigo-600 hover:text-indigo-900 transition-colors p-1.5 hover:bg-indigo-50 rounded-full"
                                title="Edit User"
                              >
                                <PencilIcon className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => setDeleteConfirm({ show: true, userId: user._id })}
                                className="text-red-600 hover:text-red-900 transition-colors p-1.5 hover:bg-red-50 rounded-full"
                                title="Delete User"
                              >
                                <TrashIcon className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {filteredUsers.length === 0 && (
                        <tr>
                          <td colSpan="9" className="px-6 py-4 text-center text-gray-500 italic">
                            No users found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      <ConfirmDialog
        isOpen={deleteConfirm.show}
        title="Delete User"
        message="Are you sure you want to delete this user? This action cannot be undone."
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirm({ show: false, userId: null })}
      />
    </div>
  );
};

export default AdminDashboard; 