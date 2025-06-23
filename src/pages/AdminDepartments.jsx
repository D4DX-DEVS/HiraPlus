import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon,
  MagnifyingGlassIcon,
  BuildingOfficeIcon
} from '@heroicons/react/24/outline';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import ConfirmDialog from '../components/ConfirmDialog';

const AdminDepartments = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    const saved = localStorage.getItem('sidebarOpen');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState(null);
  const [formData, setFormData] = useState({
    title: ''
  });
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, departmentId: null });

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('adminToken');
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/admin/departments`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setDepartments(response.data.departments || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch departments');
      console.error('Error fetching departments:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('adminToken');
      const url = `${import.meta.env.VITE_API_URL}/admin/departments${editingDepartment ? `/${editingDepartment._id}` : ''}`;
      const method = editingDepartment ? 'put' : 'post';

      await axios({
        method,
        url,
        data: formData,
        headers: { Authorization: `Bearer ${token}` }
      });

      setShowModal(false);
      setEditingDepartment(null);
      setFormData({ title: '' });
      fetchDepartments();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save department');
    }
  };

  const handleDelete = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      await axios.delete(`${import.meta.env.VITE_API_URL}/admin/departments/${deleteConfirm.departmentId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDeleteConfirm({ show: false, departmentId: null });
      fetchDepartments();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete department');
    }
  };

  const handleEdit = (department) => {
    setEditingDepartment(department);
    setFormData({
      title: department.title || ''
    });
    setShowModal(true);
  };

  // Filter departments based on search query
  const filteredDepartments = departments.filter(department => {
    return searchQuery.trim() === '' || 
      department.title?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  useEffect(() => {
    fetchDepartments();
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
                        Department Management
                      </h1>
                      <div className="flex items-center space-x-3 text-xs">
                        <span className="flex items-center text-green-600">
                          <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5"></div>
                          {filteredDepartments.length} Department{filteredDepartments.length !== 1 ? 's' : ''}
                        </span>
                        <span className="flex items-center text-blue-600">
                          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-1.5"></div>
                          {filteredDepartments.length} Total
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setEditingDepartment(null);
                        setFormData({ title: '' });
                        setShowModal(true);
                      }}
                      className="inline-flex items-center px-3 py-1.5 bg-green-950 text-white font-medium rounded-lg hover:bg-green-900 focus:outline-none focus:ring-2 focus:ring-green-800 focus:ring-offset-2 transition-all duration-200 transform hover:scale-105 shadow-md hover:shadow-lg text-sm"
                    >
                      <PlusIcon className="h-4 w-4 mr-1.5" />
                      Add Department
                    </button>
                  </div>
                </div>
              </div>

              {/* Search Section */}
              <div className="mb-3">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200/50 p-2">
                  <div className="relative max-w-md">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search departments..."
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm transition-all duration-200"
                    />
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

              {/* Add/Edit Form */}
              {showModal && (
                <div className="mb-3 bg-white shadow-lg rounded-xl border border-gray-200/50 p-4 lg:p-5 flex-shrink-0 max-w-2xl mx-auto">
                  <div className="mb-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-lg font-semibold text-gray-900">
                          {editingDepartment ? 'Edit Department' : 'Add Department'}
                        </h2>
                        <p className="text-sm text-gray-600 mt-1">
                          {editingDepartment ? 'Update department information' : 'Create a new department'}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setShowModal(false);
                          setEditingDepartment(null);
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

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        <span className="flex items-center">
                          <BuildingOfficeIcon className="h-4 w-4 mr-2 text-gray-500" />
                          Department Title
                        </span>
                      </label>
                      <input
                        type="text"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                        placeholder="Enter department title"
                        required
                      />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                      <button
                        type="button"
                        onClick={() => {
                          setShowModal(false);
                          setEditingDepartment(null);
                        }}
                        className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-6 py-2.5 text-sm font-medium text-white bg-green-600 border border-transparent rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
                      >
                        {editingDepartment ? 'Update Department' : 'Create Department'}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Departments Table */}
              {loading ? (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center py-12">
                    <div className="text-lg text-gray-600">Loading...</div>
                  </div>
                </div>
              ) : (
                <div className="bg-white shadow-lg rounded-xl border border-gray-200/50 overflow-hidden flex-1 flex flex-col min-h-0">
                  <div className="px-3 py-2 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200 flex-shrink-0">
                    <h3 className="text-base font-semibold text-gray-900">Department Directory</h3>
                    <p className="text-xs text-gray-600 mt-0.5">
                      {filteredDepartments.length} department{filteredDepartments.length !== 1 ? 's' : ''} found
                    </p>
                  </div>
                  <div className="flex-1 overflow-auto">
                    <table className="w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department Title</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created Date</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Updated</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredDepartments.length === 0 ? (
                          <tr>
                            <td colSpan="4" className="px-6 py-8 text-center">
                              <div className="text-gray-400">
                                <svg className="w-10 h-10 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                                <p className="text-base font-medium text-gray-900 mb-1">No departments found</p>
                                <p className="text-sm text-gray-600">Try adjusting your search criteria or add a new department.</p>
                              </div>
                            </td>
                          </tr>
                        ) : (
                          filteredDepartments.map((department, index) => (
                            <tr key={department._id || `dept-${index}`} className={`hover:bg-gray-50 transition-colors duration-150 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div className="w-8 h-8 bg-gradient-to-br from-green-600 to-green-800 rounded-full flex items-center justify-center text-white text-sm font-medium mr-3 flex-shrink-0">
                                    {(department.title || 'U')?.charAt(0).toUpperCase()}
                                  </div>
                                  <div className="text-sm font-medium text-gray-900">
                                    {department.title || 'Untitled Department'}
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {department.createdAt && !isNaN(new Date(department.createdAt)) 
                                  ? format(new Date(department.createdAt), 'MMM d, yyyy')
                                  : 'N/A'
                                }
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {department.updatedAt && !isNaN(new Date(department.updatedAt))
                                  ? format(new Date(department.updatedAt), 'MMM d, yyyy')
                                  : 'N/A'
                                }
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <div className="flex justify-end space-x-2">
                                  <button
                                    onClick={() => handleEdit(department)}
                                    className="text-green-600 hover:text-green-900 transition-colors p-1.5 hover:bg-green-50 rounded-full"
                                    title="Edit"
                                  >
                                    <PencilIcon className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={() => setDeleteConfirm({ show: true, departmentId: department._id })}
                                    className="text-red-600 hover:text-red-900 transition-colors p-1.5 hover:bg-red-50 rounded-full"
                                    title="Delete"
                                  >
                                    <TrashIcon className="h-4 w-4" />
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
        title="Delete Department"
        message="Are you sure you want to delete this department? This action cannot be undone and may affect related records."
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirm({ show: false, departmentId: null })}
      />
    </div>
  );
};

export default AdminDepartments; 