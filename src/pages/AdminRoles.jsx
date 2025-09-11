import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon,
  UserGroupIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

const API_URL = import.meta.env.VITE_API_URL;

const AdminRoles = () => {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [formData, setFormData] = useState({ name: '' });
  const [formLoading, setFormLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    const saved = localStorage.getItem('sidebarOpen');
    return saved !== null ? JSON.parse(saved) : true;
  });

  // Get authentication token
  const getAuthToken = () => {
    return localStorage.getItem('adminToken');
  };

  // Role utility functions
  const validateRoleName = (name) => {
    if (!name || !name.trim()) {
      return { valid: false, message: 'Role name is required' };
    }
    
    if (name.trim().length < 2) {
      return { valid: false, message: 'Role name must be at least 2 characters long' };
    }
    
    if (name.trim().length > 50) {
      return { valid: false, message: 'Role name must be less than 50 characters' };
    }
    
    // Check for valid characters (letters, numbers, spaces, hyphens, underscores)
    const validNameRegex = /^[a-zA-Z0-9\s\-_]+$/;
    if (!validNameRegex.test(name.trim())) {
      return { valid: false, message: 'Role name can only contain letters, numbers, spaces, hyphens, and underscores' };
    }
    
    return { valid: true, message: 'Valid role name' };
  };

  const getRoleIcon = (roleName) => {
    const icons = {
      'member': '👤',
      'driver': '🚗',
      'accountant': '💰',
      'leader': '👑',
      'super leader': '🌟',
      'admin': '⚡',
      'manager': '👔',
      'supervisor': '👨‍💼'
    };
    return icons[roleName?.toLowerCase()] || '👤';
  };

  const getRoleColor = (roleName) => {
    const colors = {
      'member': 'bg-gray-100 text-gray-800',
      'driver': 'bg-blue-100 text-blue-800',
      'accountant': 'bg-green-100 text-green-800',
      'leader': 'bg-indigo-100 text-indigo-800',
      'super leader': 'bg-red-100 text-red-800',
      'admin': 'bg-purple-100 text-purple-800',
      'manager': 'bg-yellow-100 text-yellow-800',
      'supervisor': 'bg-orange-100 text-orange-800'
    };
    return colors[roleName?.toLowerCase()] || 'bg-gray-100 text-gray-800';
  };

  // Fetch roles
  const fetchRoles = async () => {
    try {
      setLoading(true);
      const token = getAuthToken();
      const response = await axios.get(`${API_URL}/roles`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setRoles(response.data.roles || []);
        setError('');
      } else {
        setError(response.data.message || 'Failed to fetch roles');
      }
    } catch (err) {
      console.error('Failed to fetch roles:', err);
      setError(err.response?.data?.message || 'Failed to fetch roles');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  // Save sidebar state to localStorage
  useEffect(() => {
    localStorage.setItem('sidebarOpen', JSON.stringify(isSidebarOpen));
  }, [isSidebarOpen]);

  const handleCreateRole = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    // Validate role name
    const validation = validateRoleName(formData.name);
    if (!validation.valid) {
      setError(validation.message);
      return;
    }

    try {
      setFormLoading(true);
      const token = getAuthToken();
      const response = await axios.post(`${API_URL}/roles`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setFormData({ name: '' });
        setShowCreateForm(false);
        setError('');
        fetchRoles();
      } else {
        setError(response.data.message || 'Failed to create role');
      }
    } catch (err) {
      console.error('Error creating role:', err);
      setError(err.response?.data?.message || 'Failed to create role');
    } finally {
      setFormLoading(false);
    }
  };

  const handleEditRole = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    // Validate role name
    const validation = validateRoleName(formData.name);
    if (!validation.valid) {
      setError(validation.message);
      return;
    }

    try {
      setFormLoading(true);
      const token = getAuthToken();
      const response = await axios.put(`${API_URL}/roles/${editingRole.id}`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setFormData({ name: '' });
        setShowEditForm(false);
        setEditingRole(null);
        setError('');
        fetchRoles();
      } else {
        setError(response.data.message || 'Failed to update role');
      }
    } catch (err) {
      console.error('Error updating role:', err);
      setError(err.response?.data?.message || 'Failed to update role');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteRole = async (roleId) => {
    try {
      setFormLoading(true);
      const token = getAuthToken();
      const response = await axios.delete(`${API_URL}/roles/${roleId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setDeleteConfirm(null);
        setError('');
        fetchRoles();
      } else {
        setError(response.data.message || 'Failed to delete role');
      }
    } catch (err) {
      console.error('Error deleting role:', err);
      setError(err.response?.data?.message || 'Failed to delete role');
    } finally {
      setFormLoading(false);
    }
  };

  const openEditForm = (role) => {
    setEditingRole(role);
    setFormData({ name: role.name });
    setShowEditForm(true);
  };

  const closeForms = () => {
    setShowCreateForm(false);
    setShowEditForm(false);
    setEditingRole(null);
    setFormData({ name: '' });
    setError('');
  };


  if (loading) {
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
                <div className="animate-pulse">
                  <div className="h-8 bg-gray-300 rounded w-1/4 mb-6"></div>
                  <div className="space-y-4">
                    {[1, 2, 3, 4, 5].map(i => (
                      <div key={i} className="h-16 bg-gray-300 rounded"></div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <>
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
                      <h1 className="text-xl lg:text-2xl font-bold text-gray-900">Role Management</h1>
                      <p className="text-sm text-gray-600 mt-0.5">Manage user roles and permissions</p>
                    </div>
                    <button
                      onClick={() => setShowCreateForm(true)}
                      className="inline-flex items-center px-3 py-1.5 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
                    >
                      <PlusIcon className="h-4 w-4 mr-1.5" />
                      Add Role
                    </button>
                  </div>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="mb-2 flex-shrink-0">
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <div className="flex">
                      <ExclamationTriangleIcon className="h-5 w-5 text-red-400 flex-shrink-0" />
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-red-800">Error</h3>
                        <div className="mt-1 text-sm text-red-700">{error}</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Roles List */}
              <div className="bg-white shadow-lg rounded-xl border border-gray-200/50 overflow-hidden flex-1 flex flex-col min-h-0">
                <div className="px-3 py-2 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200 flex-shrink-0">
                  <h3 className="text-base font-semibold text-gray-900">All Roles</h3>
                  <p className="text-xs text-gray-600 mt-0.5">
                    {roles.length} role{roles.length !== 1 ? 's' : ''} found
                  </p>
                </div>
          
                <div className="flex-1 overflow-auto">
                  {roles.length === 0 ? (
                    <div className="px-6 py-12 text-center">
                      <UserGroupIcon className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">No roles</h3>
                      <p className="mt-1 text-sm text-gray-500">Get started by creating a new role.</p>
                      <div className="mt-6">
                        <button
                          onClick={() => setShowCreateForm(true)}
                          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                        >
                          <PlusIcon className="h-4 w-4 mr-2" />
                          Add Role
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-200">
                      {roles.map((role) => (
                        <div key={role.id} className="px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors">
                          <div className="flex items-center space-x-3">
                            <span className="text-2xl">{getRoleIcon(role.name)}</span>
                            <div>
                              <h4 className="text-sm font-medium text-gray-900 capitalize">
                                {role.name}
                              </h4>
                              <p className="text-xs text-gray-500">
                                Created {new Date(role.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-3">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(role.name)}`}>
                              {role.name}
                            </span>
                            
                            <div className="flex space-x-1">
                              <button
                                onClick={() => openEditForm(role)}
                                className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
                                title="Edit role"
                              >
                                <PencilIcon className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => setDeleteConfirm(role)}
                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
                                title="Delete role"
                              >
                                <TrashIcon className="h-4 w-4" />
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
          </div>
        </main>
      </div>
    </div>

      {/* Create Role Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true"></div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            
            <div className="inline-block align-bottom bg-white rounded-xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full border border-gray-200/50">
              <form onSubmit={handleCreateRole}>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="w-full">
                      <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4" id="modal-title">
                        Create New Role
                      </h3>
                      
                      <div>
                        <label htmlFor="role-name" className="block text-sm font-medium text-gray-700 mb-1">
                          Role Name
                        </label>
                        <input
                          type="text"
                          id="role-name"
                          value={formData.name}
                          onChange={(e) => setFormData({ name: e.target.value })}
                          className="block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                          placeholder="Enter role name"
                          required
                        />
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="submit"
                    disabled={formLoading}
                    className="w-full inline-flex justify-center rounded-lg border border-transparent shadow-sm px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-base font-medium text-white hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 transition-all duration-200"
                  >
                    {formLoading ? 'Creating...' : 'Create Role'}
                  </button>
                  <button
                    type="button"
                    onClick={closeForms}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Role Modal */}
      {showEditForm && editingRole && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true"></div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            
            <div className="inline-block align-bottom bg-white rounded-xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full border border-gray-200/50">
              <form onSubmit={handleEditRole}>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="w-full">
                      <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4" id="modal-title">
                        Edit Role
                      </h3>
                      
                      <div>
                        <label htmlFor="edit-role-name" className="block text-sm font-medium text-gray-700 mb-1">
                          Role Name
                        </label>
                        <input
                          type="text"
                          id="edit-role-name"
                          value={formData.name}
                          onChange={(e) => setFormData({ name: e.target.value })}
                          className="block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                          placeholder="Enter role name"
                          required
                        />
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="submit"
                    disabled={formLoading}
                    className="w-full inline-flex justify-center rounded-lg border border-transparent shadow-sm px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-base font-medium text-white hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 transition-all duration-200"
                  >
                    {formLoading ? 'Updating...' : 'Update Role'}
                  </button>
                  <button
                    type="button"
                    onClick={closeForms}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
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
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true"></div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            
            <div className="inline-block align-bottom bg-white rounded-xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full border border-gray-200/50">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                      Delete Role
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Are you sure you want to delete the role "{deleteConfirm.name}"? This action cannot be undone.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  onClick={() => handleDeleteRole(deleteConfirm.id)}
                  disabled={formLoading}
                  className="w-full inline-flex justify-center rounded-lg border border-transparent shadow-sm px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 text-base font-medium text-white hover:from-red-700 hover:to-red-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 transition-all duration-200"
                >
                  {formLoading ? 'Deleting...' : 'Delete'}
                </button>
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AdminRoles;
