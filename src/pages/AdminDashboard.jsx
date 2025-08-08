import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import UserForm from '../components/UserForm';
import ConfirmDialog from '../components/ConfirmDialog';
import { TrashIcon, PlusIcon, PencilIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';

// Skeleton Loading Component
const UserTableSkeleton = ({ shouldShowInternColumn = false }) => {
  const skeletonRows = Array.from({ length: 6 }, (_, i) => i);
  
  return (
    <>
      {skeletonRows.map((index) => (
        <tr key={index} className="border-b border-gray-200">
          {/* Name column with avatar */}
          <td className="px-2 py-1.5 whitespace-nowrap">
            <div className="flex items-center">
              <div className="w-7 h-7 bg-gray-300 rounded-full mr-2 flex-shrink-0 shimmer"></div>
              <div className="min-w-0">
                <div className="h-3 bg-gray-300 rounded w-20 shimmer"></div>
              </div>
            </div>
          </td>
          {/* Phone */}
          <td className="px-1 py-1.5 whitespace-nowrap">
            <div className="h-3 bg-gray-300 rounded w-16 shimmer"></div>
          </td>
          {/* Department */}
          <td className="px-1 py-1.5 whitespace-nowrap">
            <div className="h-3 bg-gray-300 rounded w-14 shimmer"></div>
          </td>
          {/* Position */}
          <td className="px-1 py-1.5 whitespace-nowrap">
            <div className="h-3 bg-gray-300 rounded w-16 shimmer"></div>
          </td>
          {/* Status */}
          <td className="px-1 py-1.5 whitespace-nowrap">
            <div className="h-5 bg-gray-300 rounded-full w-8 shimmer"></div>
          </td>
          {/* Role */}
          <td className="px-1 py-1.5 whitespace-nowrap">
            <div className="h-5 bg-gray-300 rounded-full w-10 shimmer"></div>
          </td>
          {/* Free Food */}
          <td className="px-1 py-1.5 whitespace-nowrap">
            <div className="h-5 bg-gray-300 rounded-full w-6 shimmer"></div>
          </td>
          {/* Driver column removed */}
          {/* Intern - conditional */}
          {shouldShowInternColumn && (
            <td className="px-1 py-1.5 whitespace-nowrap">
              <div className="h-5 bg-gray-300 rounded-full w-6 shimmer"></div>
            </td>
          )}
          {/* Active */}
          <td className="px-1 py-1.5 whitespace-nowrap text-center">
            <div className="w-2 h-2 bg-gray-300 rounded-full mx-auto shimmer"></div>
          </td>
          {/* Actions */}
          <td className="px-1 py-1.5 whitespace-nowrap text-center">
            <div className="flex justify-center space-x-1">
              <div className="w-6 h-6 bg-gray-300 rounded shimmer"></div>
              <div className="w-6 h-6 bg-gray-300 rounded shimmer"></div>
            </div>
          </td>
        </tr>
      ))}
    </>
  );
};

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [error, setError] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    const saved = localStorage.getItem('sidebarOpen');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, userId: null });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [departments, setDepartments] = useState([]);

  // Check if the selected department should show isIntern column
  const shouldShowInternColumn = selectedDepartment === 'D4DX Innovations LLP';

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
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/admin/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(response.data);
    } catch (err) {
      console.error('Fetch error:', err.response?.data);
      setError('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchDepartments();
  }, []);

  // Save sidebar state to localStorage
  useEffect(() => {
    localStorage.setItem('sidebarOpen', JSON.stringify(isSidebarOpen));
  }, [isSidebarOpen]);

  // Filter and sort users based on search query and selected department
  const filteredUsers = users.filter(user => {
    const departmentName = typeof user.department === 'string' ? user.department : user.department?.title || '';
    const matchesSearch = searchQuery.trim() === '' || 
      user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.phoneNumber?.includes(searchQuery) ||
      departmentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.designation?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesDepartment = selectedDepartment === '' || departmentName === selectedDepartment;

    return matchesSearch && matchesDepartment;
  }).sort((a, b) => {
    // Sort by department name first, then by name within department
    const deptA = typeof a.department === 'string' ? a.department : a.department?.title || '';
    const deptB = typeof b.department === 'string' ? b.department : b.department?.title || '';
    
    if (deptA !== deptB) {
      return deptA.localeCompare(deptB);
    }
    
    // If same department, sort by name
    return (a.name || '').localeCompare(b.name || '');
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
                        User Management
                      </h1>
                      <div className="flex items-center space-x-3 text-xs">
                        <span className="flex items-center text-green-600">
                          <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5"></div>
                          {filteredUsers.filter(u => u.isVerified).length} Verified
                        </span>
                        <span className="flex items-center text-yellow-600">
                          <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full mr-1.5"></div>
                          {filteredUsers.filter(u => !u.isVerified).length} Pending
                        </span>
                        <span className="flex items-center text-green-600">
                          <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5"></div>
                          {filteredUsers.length} Total
                        </span>
                      </div>
                    </div>
                <button
                  onClick={() => {
                    setEditingUser(null);
                    setShowAddForm(true);
                  }}
                  className="inline-flex items-center px-3 py-1.5 bg-green-950 text-white font-medium rounded-lg hover:bg-green-900 focus:outline-none focus:ring-2 focus:ring-green-800 focus:ring-offset-2 transition-all duration-200 transform hover:scale-105 shadow-md hover:shadow-lg text-sm"
                >
                  <PlusIcon className="h-4 w-4 mr-1.5" />
                  Add New User
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
                    placeholder="Search by name, phone, department, or designation..."
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
                <div className="mb-3 bg-gradient-to-r from-red-50 to-red-100 border border-red-200 rounded-xl p-3 flex-shrink-0">
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-red-500 rounded-full mr-3"></div>
                    <div className="text-sm text-red-700 font-medium">{error}</div>
                  </div>
                </div>
              )}

              {showAddForm && (
                <div className="mb-3 bg-white shadow-lg rounded-xl border border-gray-200/50 p-4 lg:p-5 flex-shrink-0">
                  <div className="mb-3">
                    <h2 className="text-lg font-semibold text-gray-900">Add New User</h2>
                    <p className="text-gray-600 text-sm mt-1">Fill in the details to create a new user account</p>
                  </div>
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
                <div className="mb-3 bg-white shadow-lg rounded-xl border border-gray-200/50 p-4 lg:p-5 flex-shrink-0 max-w-4xl mx-auto">
                  <div className="mb-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-lg font-semibold text-gray-900">Edit User</h2>
                        <p className="text-sm text-gray-600 mt-1">Update user information and settings</p>
                      </div>
                      <button
                        onClick={() => setEditingUser(null)}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                        title="Close"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
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

              {/* Users Table - this will be the scrollable area */}
              <div className="bg-white shadow-lg rounded-xl border border-gray-200/50 overflow-hidden flex-1 flex flex-col min-h-0">
                {/* <div className="px-3 py-2 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200 flex-shrink-0">
                  <h3 className="text-base font-semibold text-gray-900">User Directory</h3>
                  <p className="text-xs text-gray-600 mt-0.5">
                    {filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''} found
                  </p>
                </div> */}
                <div className="flex-1 overflow-auto">
                  <table className="w-full divide-y divide-gray-200 table-fixed">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-2 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider" style={{width: '20%'}}>
                          Name
                        </th>
                        <th className="px-1 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider" style={{width: '12%'}}>
                          Phone
                        </th>
                        <th className="px-1 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider" style={{width: '12%'}}>
                          Dept
                        </th>
                        <th className="px-1 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider" style={{width: '12%'}}>
                          Position
                        </th>
                        <th className="px-1 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider" style={{width: '10%'}}>
                          Status
                        </th>
                        <th className="px-1 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider" style={{width: '10%'}}>
                          Role
                        </th>
                        <th className="px-1 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider" style={{width: shouldShowInternColumn ? '7%' : '8%'}}>
                          Free Food
                        </th>
                        {/* Driver column removed */}
                        {shouldShowInternColumn && (
                          <th className="px-1 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider" style={{width: '7%'}}>
                            Intern
                          </th>
                        )}
                        <th className="px-1 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider" style={{width: '6%'}}>
                          Active
                        </th>                      
                        <th className="px-1 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider" style={{width: '7%'}}>
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {loading ? (
                        <UserTableSkeleton shouldShowInternColumn={shouldShowInternColumn} />
                      ) : filteredUsers.length === 0 ? (
                        <tr>
                          <td colSpan={shouldShowInternColumn ? "10" : "9"} className="px-6 py-8 text-center">
                            <div className="text-gray-400">
                              <svg className="w-10 h-10 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                              </svg>
                              <p className="text-base font-medium text-gray-900 mb-1">No users found</p>
                              <p className="text-sm text-gray-600">Try adjusting your search criteria or add a new user.</p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        filteredUsers.map((user) => (
                        <React.Fragment key={user._id}>
                          <tr className="hover:bg-gray-200 transition-colors duration-150">
                            <td className="px-2 py-1.5 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="w-7 h-7 bg-gradient-to-br from-green-600 to-green-800 rounded-full flex items-center justify-center text-white text-xs font-medium mr-2 flex-shrink-0">
                                  {user.name?.charAt(0).toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                  <div className="text-xs font-medium text-gray-900 truncate" title={user.name}>{user.name}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-1 py-1.5 whitespace-nowrap text-xs text-gray-900">
                              <div className="truncate" title={user.phoneNumber}>{user.phoneNumber}</div>
                            </td>
                            <td className="px-1 py-1.5 whitespace-nowrap text-xs text-gray-900">
                              <div className="truncate" title={typeof user.department === 'string' ? user.department : user.department?.title || 'N/A'}>
                                {typeof user.department === 'string' ? user.department : user.department?.title || 'N/A'}
                              </div>
                            </td>
                            <td className="px-1 py-1.5 whitespace-nowrap text-xs text-gray-900">
                              <div className="truncate" title={user.designation}>{user.designation}</div>
                            </td>
                            <td className="px-1 py-1.5 whitespace-nowrap">
                              <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${
                                user.isVerified
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {user.isVerified ? '✓' : '⏳'}
                              </span>
                            </td>
                            <td className="px-1 py-1.5 whitespace-nowrap">
                              <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${
                                user.isDeptHead
                                  ? 'bg-purple-100 text-purple-800'
                                  : (user.role === 'driver'
                                      ? 'bg-blue-100 text-blue-800'
                                      : user.role === 'accountant'
                                      ? 'bg-green-100 text-green-800'
                                      : 'bg-gray-100 text-gray-800')
                              }`}>
                                {user.isDeptHead ? 'Head' : (user.role === 'driver' ? 'Driver 🚗' : (user.role === 'accountant' ? 'Accountant 💰' : 'Member'))}
                              </span>
                            </td>
                            <td className="px-1 py-1.5 whitespace-nowrap">
                              <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${
                                user.isFreeFood
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {user.isFreeFood ? '🍽️' : '💰'}
                              </span>
                            </td>
                            {/* Driver column removed; role badge updated above */}
                            {shouldShowInternColumn && (
                              <td className="px-1 py-1.5 whitespace-nowrap">
                                <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${
                                  user.isIntern
                                    ? 'bg-orange-100 text-orange-800'
                                    : 'bg-gray-100 text-gray-800'
                                }`}>
                                  {user.isIntern ? '📚' : '👔'}
                                </span>
                              </td>
                            )}
                            <td className="px-1 py-1.5 whitespace-nowrap text-center">
                              <span 
                                className={`inline-block w-2 h-2 rounded-full ${
                                  user.status === 'active' ? 'bg-green-500' : 'bg-red-500'
                                }`} 
                                title={user.status === 'active' ? 'Active' : 'Inactive'}
                              ></span>
                            </td>
                            <td className="px-1 py-1.5 whitespace-nowrap text-center">
                              <div className="flex justify-center space-x-1">
                                <button
                                  onClick={() => {
                                    setShowAddForm(false);
                                    setEditingUser(user);
                                  }}
                                    className="text-green-600 hover:text-green-900 transition-colors p-0.5 hover:bg-green-50 rounded"
                                  title="Edit User"
                                >
                                  <PencilIcon className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  onClick={() => setDeleteConfirm({ show: true, userId: user._id })}
                                  className="text-red-600 hover:text-red-900 transition-colors p-0.5 hover:bg-red-50 rounded"
                                  title="Delete User"
                                >
                                  <TrashIcon className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        </React.Fragment>
                        ))
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