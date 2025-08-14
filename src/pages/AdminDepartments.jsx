import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon,
  MagnifyingGlassIcon,
  BuildingOfficeIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  FolderIcon,
  FolderOpenIcon
} from '@heroicons/react/24/outline';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import ConfirmDialog from '../components/ConfirmDialog';
import { TableSkeleton } from '../components/SkeletonLoaders';

const AdminDepartments = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    const saved = localStorage.getItem('sidebarOpen');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all'); // 'all', 'regular', 'hierarchical'
  const [showModal, setShowModal] = useState(false);
  const [showSubDeptModal, setShowSubDeptModal] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState(null);
  const [editingSubDept, setEditingSubDept] = useState(null);
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [expandedDepartments, setExpandedDepartments] = useState(new Set());
  const [formData, setFormData] = useState({
    title: '',
    isHierarchical: false,
    subDepartments: []
  });
  const [subDeptFormData, setSubDeptFormData] = useState({
    subDepartments: []
  });
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, departmentId: null, subDeptId: null, type: 'department' });

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('adminToken');
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/departments`, {
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
      const url = `${import.meta.env.VITE_API_URL}/departments${editingDepartment ? `/${editingDepartment._id}` : ''}`;
      const method = editingDepartment ? 'put' : 'post';

      // Prepare department data (exclude sub-department fields)
      const departmentData = {
        title: formData.title,
        isHierarchical: formData.isHierarchical
      };

      const response = await axios({
        method,
        url,
        data: departmentData,
        headers: { Authorization: `Bearer ${token}` }
      });

              // If hierarchical and sub-department title is provided, create sub-department
        if (formData.isHierarchical && formData.subDepartments.length > 0) {
          const departmentId = editingDepartment ? editingDepartment._id : response.data.department._id;
          
          // If editing, first delete existing sub-departments
          if (editingDepartment && editingDepartment.subDepartments?.length > 0) {
            for (const subDept of editingDepartment.subDepartments) {
              try {
                await axios.delete(`${import.meta.env.VITE_API_URL}/departments/${departmentId}/sub-departments/${subDept._id}`, {
                  headers: { Authorization: `Bearer ${token}` }
                });
              } catch (err) {
                console.warn('Failed to delete existing sub-department:', err);
              }
            }
          }
          
          // Create new sub-departments
          for (const subDept of formData.subDepartments) {
            if (subDept.title.trim()) { // Only create if title is not empty
              await axios.post(`${import.meta.env.VITE_API_URL}/departments/${departmentId}/sub-departments`, {
                title: subDept.title.trim(),
                description: subDept.description.trim()
              }, {
                headers: { Authorization: `Bearer ${token}` }
              });
            }
          }
        }

      setShowModal(false);
      setEditingDepartment(null);
      setFormData({ title: '', isHierarchical: false, subDepartments: [] });
      fetchDepartments();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save department');
    }
  };

  const handleSubDeptSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('adminToken');
      
      if (editingSubDept) {
        // Editing single sub-department
        const url = `${import.meta.env.VITE_API_URL}/departments/${selectedDepartment._id}/sub-departments/${editingSubDept._id}`;
        await axios.put(url, {
          title: subDeptFormData.subDepartments[0].title,
          description: subDeptFormData.subDepartments[0].description
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        // Adding multiple sub-departments
        for (const subDept of subDeptFormData.subDepartments) {
          if (subDept.title.trim()) { // Only create if title is not empty
            await axios.post(`${import.meta.env.VITE_API_URL}/departments/${selectedDepartment._id}/sub-departments`, {
              title: subDept.title.trim(),
              description: subDept.description.trim()
            }, {
              headers: { Authorization: `Bearer ${token}` }
            });
          }
        }
      }

      setShowSubDeptModal(false);
      setEditingSubDept(null);
      setSelectedDepartment(null);
      setSubDeptFormData({ subDepartments: [] });
      fetchDepartments();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save sub-department');
    }
  };

  const handleDelete = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const url = deleteConfirm.type === 'subDept'
        ? `${import.meta.env.VITE_API_URL}/departments/${deleteConfirm.departmentId}/sub-departments/${deleteConfirm.subDeptId}`
        : `${import.meta.env.VITE_API_URL}/departments/${deleteConfirm.departmentId}`;
      
      await axios.delete(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setDeleteConfirm({ show: false, departmentId: null, subDeptId: null, type: 'department' });
      fetchDepartments();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete');
    }
  };

  const handleEdit = (department) => {
    setEditingDepartment(department);
    setFormData({
      title: department.title || '',
      isHierarchical: department.isHierarchical || false,
      subDepartments: department.subDepartments?.map(sub => ({
        title: sub.title || '',
        description: sub.description || ''
      })) || []
    });
    setShowModal(true);
  };

  const handleEditSubDept = (department, subDept) => {
    setSelectedDepartment(department);
    setEditingSubDept(subDept);
    setSubDeptFormData({
      subDepartments: [{
        title: subDept.title || '',
        description: subDept.description || ''
      }]
    });
    setShowSubDeptModal(true);
  };

  const handleAddSubDept = (department) => {
    setSelectedDepartment(department);
    setEditingSubDept(null);
    setSubDeptFormData({ 
      subDepartments: [{ title: '', description: '' }] // Auto-add first sub-department
    });
    setShowSubDeptModal(true);
  };

  const toggleExpanded = (departmentId) => {
    const newExpanded = new Set(expandedDepartments);
    if (newExpanded.has(departmentId)) {
      newExpanded.delete(departmentId);
    } else {
      newExpanded.add(departmentId);
    }
    setExpandedDepartments(newExpanded);
  };

  // Helper functions for managing multiple sub-departments
  const addSubDepartment = () => {
    setFormData({
      ...formData,
      subDepartments: [...formData.subDepartments, { title: '', description: '' }]
    });
  };

  // Auto-add first sub-department when hierarchical is checked
  const handleHierarchicalChange = (isHierarchical) => {
    if (isHierarchical && formData.subDepartments.length === 0) {
      // Auto-add first sub-department for new departments
      setFormData({
        ...formData,
        isHierarchical,
        subDepartments: [{ title: '', description: '' }]
      });
    } else if (!isHierarchical) {
      // When unchecking hierarchical, clear all sub-departments
      setFormData({
        ...formData,
        isHierarchical,
        subDepartments: []
      });
    } else {
      // When checking hierarchical but sub-departments already exist (editing case)
      setFormData({
        ...formData,
        isHierarchical
      });
    }
  };

  const removeSubDepartment = (index) => {
    const newSubDepartments = formData.subDepartments.filter((_, i) => i !== index);
    setFormData({
      ...formData,
      subDepartments: newSubDepartments
    });
  };

  // Handle removing the last sub-department (uncheck hierarchical)
  const handleRemoveSubDepartment = (index) => {
    if (formData.subDepartments.length === 1) {
      // If removing the last sub-department, uncheck hierarchical
      setFormData({
        ...formData,
        isHierarchical: false,
        subDepartments: []
      });
    } else {
      removeSubDepartment(index);
    }
  };

  // Check if we're editing an existing department
  const isEditingExisting = editingDepartment && editingDepartment._id;

  // Helper functions for managing multiple sub-departments in separate modal
  const addSubDeptToModal = () => {
    setSubDeptFormData({
      ...subDeptFormData,
      subDepartments: [...subDeptFormData.subDepartments, { title: '', description: '' }]
    });
  };

  const removeSubDeptFromModal = (index) => {
    const newSubDepartments = subDeptFormData.subDepartments.filter((_, i) => i !== index);
    setSubDeptFormData({
      ...subDeptFormData,
      subDepartments: newSubDepartments
    });
  };

  const updateSubDeptInModal = (index, field, value) => {
    const newSubDepartments = [...subDeptFormData.subDepartments];
    newSubDepartments[index] = {
      ...newSubDepartments[index],
      [field]: value
    };
    setSubDeptFormData({
      ...subDeptFormData,
      subDepartments: newSubDepartments
    });
  };

  const updateSubDepartment = (index, field, value) => {
    const newSubDepartments = [...formData.subDepartments];
    newSubDepartments[index] = {
      ...newSubDepartments[index],
      [field]: value
    };
    setFormData({
      ...formData,
      subDepartments: newSubDepartments
    });
  };

  // Filter departments based on search query and department type
  const filteredDepartments = departments.filter(department => {
    // Filter by department type
    const matchesFilter = departmentFilter === 'all' || 
      (departmentFilter === 'regular' && !department.isHierarchical) ||
      (departmentFilter === 'hierarchical' && department.isHierarchical);
    
    // Filter by search query
    const matchesSearch = searchQuery.trim() === '' || 
      department.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      department.subDepartments?.some(sub => 
        sub.title?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    
    return matchesFilter && matchesSearch;
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
                          {departments.filter(d => d.isHierarchical).length} Outside Department{departments.filter(d => d.isHierarchical).length !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                    <button
                                              onClick={() => {
                          setEditingDepartment(null);
                          setFormData({ title: '', isHierarchical: false, subDepartments: [] });
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

              {/* Search and Filter Section */}
              <div className="mb-3">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200/50 p-3">
                  <div className="flex flex-col lg:flex-row gap-3">
                    {/* Search */}
                    <div className="flex-1">
                      <div className="relative max-w-md">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />
                        </div>
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Search departments or sub-departments..."
                          className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm transition-all duration-200"
                        />
                      </div>
                    </div>

                    {/* Filter Buttons */}
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-700 whitespace-nowrap">Filter:</span>
                      <div className="flex bg-gray-100 rounded-lg p-1">
                        <button
                          onClick={() => setDepartmentFilter('all')}
                          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200 ${
                            departmentFilter === 'all'
                              ? 'bg-white text-gray-900 shadow-sm'
                              : 'text-gray-600 hover:text-gray-900'
                          }`}
                        >
                          All ({departments.length})
                        </button>
                        <button
                          onClick={() => setDepartmentFilter('regular')}
                          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200 ${
                            departmentFilter === 'regular'
                              ? 'bg-white text-gray-900 shadow-sm'
                              : 'text-gray-600 hover:text-gray-900'
                          }`}
                        >
                          Regular ({departments.filter(d => !d.isHierarchical).length})
                        </button>
                        <button
                          onClick={() => setDepartmentFilter('hierarchical')}
                          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200 ${
                            departmentFilter === 'hierarchical'
                              ? 'bg-white text-gray-900 shadow-sm'
                              : 'text-gray-600 hover:text-gray-900'
                          }`}
                        >
                          Outside Department{departments.filter(d => d.isHierarchical).length !== 1 ? 's' : ''} ({departments.filter(d => d.isHierarchical).length})
                        </button>
                      </div>
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

              {/* Add/Edit Department Form */}
              {showModal && (
                <div className="mb-3 bg-white shadow-lg rounded-xl border border-gray-200/50 p-4 lg:p-5 flex-shrink-0 max-w-2xl mx-auto">
                  <div className="mb-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-lg font-semibold text-gray-900">
                          {editingDepartment ? 'Edit Department' : 'Add Department'}
                          {isEditingExisting && (
                            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              Editing
                            </span>
                          )}
                        </h2>
                        <p className="text-sm text-gray-600 mt-1">
                          {editingDepartment 
                            ? (isEditingExisting && formData.isHierarchical 
                                ? 'Update department information. Existing sub-departments will be replaced with the new ones below.' 
                                : 'Update department information')
                            : 'Create a new department'
                          }
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

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="isHierarchical"
                        checked={formData.isHierarchical}
                        onChange={(e) => handleHierarchicalChange(e.target.checked)}
                        className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                      />
                      <label htmlFor="isHierarchical" className="ml-2 block text-sm text-gray-900">
                        Outside Department 
                      </label>
                    </div>

                    {/* Sub-Department Fields - Only show when hierarchical is checked */}
                    {formData.isHierarchical && (
                      <div className="space-y-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex items-center mb-3">
                          <div className="flex items-center">
                            <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                            <h3 className="text-sm font-medium text-gray-900">
                              {isEditingExisting 
                                ? (formData.subDepartments.length === 1 
                                    ? 'Update Sub-Department Details' 
                                    : 'Update Sub-Departments for Outside Department')
                                : (formData.subDepartments.length === 1 
                                    ? 'Sub-Department Details' 
                                    : 'Sub-Departments for Outside Department')
                              }
                            </h3>
                          </div>
                        </div>
                        
                        {formData.subDepartments.length === 0 ? (
                          <div className="text-center py-4 text-gray-500 text-sm">
                            <FolderIcon className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                            <p>No sub-departments added yet</p>
                            <p className="text-xs">Check "Outside Department" to add sub-departments</p>
                          </div>
                        ) : (
                                                    <div className="space-y-3">
                            {formData.subDepartments.map((subDept, index) => (
                              <div key={index} className="bg-white rounded-lg border border-gray-200 p-3">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-sm font-medium text-gray-700">
                                    {isEditingExisting 
                                      ? (formData.subDepartments.length === 1 
                                          ? 'Update Sub-Department Details' 
                                          : `Update Sub-Department #${index + 1}`)
                                      : (formData.subDepartments.length === 1 
                                          ? 'Sub-Department Details' 
                                          : `Sub-Department #${index + 1}`)
                                    }
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveSubDepartment(index)}
                                    className="text-red-500 hover:text-red-700 transition-colors p-1"
                                    title={formData.subDepartments.length === 1 
                                      ? (isEditingExisting 
                                          ? "Remove sub-department and uncheck Outside Department" 
                                          : "Remove sub-department and uncheck Outside Department")
                                      : (isEditingExisting 
                                          ? "Remove sub-department from update" 
                                          : "Remove sub-department")
                                    }
                                  >
                                    <TrashIcon className="h-4 w-4" />
                                  </button>
                                </div>
                                
                                <div className="space-y-2">
                                  <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">
                                      Title
                                    </label>
                                    <input
                                      type="text"
                                      value={subDept.title}
                                      onChange={(e) => updateSubDepartment(index, 'title', e.target.value)}
                                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                                      placeholder="Enter sub-department title"
                                    />
                                  </div>
                                  
                                  <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">
                                      Description (Optional)
                                    </label>
                                    <textarea
                                      value={subDept.description}
                                      onChange={(e) => updateSubDepartment(index, 'description', e.target.value)}
                                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                                      placeholder="Enter description"
                                      rows={2}
                                    />
                                  </div>
                                </div>
                              </div>
                            ))}
                            
                            {/* Add Another Button at Bottom */}
                            <div className="flex justify-center pt-2">
                              <button
                                type="button"
                                onClick={addSubDepartment}
                                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors shadow-sm"
                              >
                                <PlusIcon className="h-4 w-4 mr-2" />
                                Add Another Sub-Department
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

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

              {/* Add/Edit Sub-Department Form */}
              {showSubDeptModal && (
                <div className="mb-3 bg-white shadow-lg rounded-xl border border-gray-200/50 p-4 lg:p-5 flex-shrink-0 max-w-2xl mx-auto">
                  <div className="mb-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-lg font-semibold text-gray-900">
                          {editingSubDept ? 'Edit Sub-Department' : 'Add Sub-Departments'}
                        </h2>
                        <p className="text-sm text-gray-600 mt-1">
                          {editingSubDept 
                            ? 'Update sub-department information' 
                            : `Add sub-departments to "${selectedDepartment?.title}" (Outside Department)`
                          }
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setShowSubDeptModal(false);
                          setEditingSubDept(null);
                          setSelectedDepartment(null);
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

                  <form onSubmit={handleSubDeptSubmit} className="space-y-4">
                    {editingSubDept ? (
                      // Single sub-department edit form
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Sub-Department Title
                          </label>
                          <input
                            type="text"
                            value={subDeptFormData.subDepartments[0]?.title || ''}
                            onChange={(e) => updateSubDeptInModal(0, 'title', e.target.value)}
                            className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                            placeholder="Enter sub-department title"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Description (Optional)
                          </label>
                          <textarea
                            value={subDeptFormData.subDepartments[0]?.description || ''}
                            onChange={(e) => updateSubDeptInModal(0, 'description', e.target.value)}
                            className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                            placeholder="Enter description"
                            rows={3}
                          />
                        </div>
                      </>
                    ) : (
                      // Multiple sub-departments add form
                      <div className="space-y-4">
                        <div className="flex items-center">
                          <h3 className="text-sm font-medium text-gray-900">
                            Sub-Departments to Add
                          </h3>
                        </div>
                        
                        <div className="space-y-3">
                          {subDeptFormData.subDepartments.map((subDept, index) => (
                            <div key={index} className="bg-gray-50 rounded-lg border border-gray-200 p-3">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-gray-700">
                                  Sub-Department #{index + 1}
                                </span>
                                {subDeptFormData.subDepartments.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => removeSubDeptFromModal(index)}
                                    className="text-red-500 hover:text-red-700 transition-colors p-1"
                                    title="Remove sub-department"
                                  >
                                    <TrashIcon className="h-4 w-4" />
                                  </button>
                                )}
                              </div>
                              
                              <div className="space-y-2">
                                <div>
                                  <label className="block text-xs font-medium text-gray-600 mb-1">
                                    Title
                                  </label>
                                  <input
                                    type="text"
                                    value={subDept.title}
                                    onChange={(e) => updateSubDeptInModal(index, 'title', e.target.value)}
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                                    placeholder="Enter sub-department title"
                                    required
                                  />
                                </div>
                                
                                <div>
                                  <label className="block text-xs font-medium text-gray-600 mb-1">
                                    Description (Optional)
                                  </label>
                                  <textarea
                                    value={subDept.description}
                                    onChange={(e) => updateSubDeptInModal(index, 'description', e.target.value)}
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                                    placeholder="Enter description"
                                    rows={2}
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                          
                          {/* Add Another Button at Bottom */}
                          <div className="flex justify-center pt-2">
                            <button
                              type="button"
                              onClick={addSubDeptToModal}
                              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors shadow-sm"
                            >
                              <PlusIcon className="h-4 w-4 mr-2" />
                              Add Another Sub-Department
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                      <button
                        type="button"
                        onClick={() => {
                          setShowSubDeptModal(false);
                          setEditingSubDept(null);
                          setSelectedDepartment(null);
                        }}
                        className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-6 py-2.5 text-sm font-medium text-white bg-green-600 border border-transparent rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
                      >
                        {editingSubDept 
                          ? 'Update Sub-Department' 
                          : `Add ${subDeptFormData.subDepartments.length} Sub-Department${subDeptFormData.subDepartments.length !== 1 ? 's' : ''}`
                        }
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Departments Table */}
              <div className="bg-white shadow-lg rounded-xl border border-gray-200/50 overflow-hidden flex-1 flex flex-col min-h-0">
                <div className="px-3 py-2 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200 flex-shrink-0">
                  <h3 className="text-base font-semibold text-gray-900">Department Directory</h3>
                  <p className="text-xs text-gray-600 mt-0.5">
                    {loading ? 'Loading...' : `${filteredDepartments.length} department${filteredDepartments.length !== 1 ? 's' : ''} found`}
                  </p>
                </div>
                <div className="flex-1 overflow-auto">
                  <table className="w-full divide-y divide-gray-200">
                                          <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created Date</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                                              {loading ? (
                          <TableSkeleton rows={6} columns={4} />
                        ) : filteredDepartments.length === 0 ? (
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
                          <React.Fragment key={department._id || `dept-${index}`}>
                            {/* Main Department Row */}
                            <tr className={`hover:bg-gray-50 transition-colors duration-150 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <button
                                    onClick={() => toggleExpanded(department._id)}
                                    className="mr-2 text-gray-400 hover:text-gray-600 transition-colors"
                                  >
                                    {department.isHierarchical && department.subDepartments?.length > 0 ? (
                                      expandedDepartments.has(department._id) ? (
                                        <ChevronDownIcon className="h-4 w-4" />
                                      ) : (
                                        <ChevronRightIcon className="h-4 w-4" />
                                      )
                                    ) : (
                                      <div className="w-4 h-4"></div>
                                    )}
                                  </button>
                                  <div className="w-8 h-8 bg-gradient-to-br from-green-600 to-green-800 rounded-full flex items-center justify-center text-white text-sm font-medium mr-3 flex-shrink-0">
                                    {(department.title || 'U')?.charAt(0).toUpperCase()}
                                  </div>
                                  <div className="text-sm font-medium text-gray-900">
                                    {department.title || 'Untitled Department'}
                                  </div>
                                </div>
                              </td>
                                                             <td className="px-6 py-4 whitespace-nowrap">
                                 <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                   department.isHierarchical 
                                     ? 'bg-purple-100 text-purple-800' 
                                     : 'bg-gray-100 text-gray-800'
                                 }`}>
                                   {department.isHierarchical ? 'Outside Department' : 'Regular'}
                                 </span>
                               </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {department.createdAt && !isNaN(new Date(department.createdAt)) 
                                  ? format(new Date(department.createdAt), 'MMM d, yyyy')
                                  : 'N/A'
                                }
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <div className="flex justify-end space-x-2">
                                  {department.isHierarchical && (
                                    <button
                                      onClick={() => handleAddSubDept(department)}
                                      className="text-blue-600 hover:text-blue-900 transition-colors p-1.5 hover:bg-blue-50 rounded-full"
                                      title="Add Sub-Department"
                                    >
                                      <PlusIcon className="h-4 w-4" />
                                    </button>
                                  )}
                                  <button
                                    onClick={() => handleEdit(department)}
                                    className="text-green-600 hover:text-green-900 transition-colors p-1.5 hover:bg-green-50 rounded-full"
                                    title="Edit"
                                  >
                                    <PencilIcon className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={() => setDeleteConfirm({ 
                                      show: true, 
                                      departmentId: department._id, 
                                      type: 'department' 
                                    })}
                                    className="text-red-600 hover:text-red-900 transition-colors p-1.5 hover:bg-red-50 rounded-full"
                                    title="Delete"
                                  >
                                    <TrashIcon className="h-4 w-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>

                                                         {/* Sub-Departments Rows */}
                             {department.isHierarchical && 
                              expandedDepartments.has(department._id) && 
                              department.subDepartments?.map((subDept, subIndex) => (
                               <tr key={subDept._id} className="bg-gray-50/50 hover:bg-gray-100/50 transition-colors duration-150">
                                 <td className="px-6 py-3 whitespace-nowrap">
                                   <div className="flex items-center pl-12">
                                     <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center text-white text-xs font-medium mr-3 flex-shrink-0">
                                       {(subDept.title || 'S')?.charAt(0).toUpperCase()}
                                     </div>
                                     <div className="text-sm text-gray-700">
                                       {subDept.title || 'Untitled Sub-Department'}
                                     </div>
                                   </div>
                                 </td>
                                 <td className="px-6 py-3 whitespace-nowrap">
                                   <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                     Sub-Department
                                   </span>
                                 </td>
                                 <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-500">
                                   {department.createdAt && !isNaN(new Date(department.createdAt)) 
                                     ? format(new Date(department.createdAt), 'MMM d, yyyy')
                                     : 'N/A'
                                   }
                                 </td>
                                 <td className="px-6 py-3 whitespace-nowrap text-right text-sm font-medium">
                                   <div className="flex justify-end space-x-2">
                                     <button
                                       onClick={() => handleEditSubDept(department, subDept)}
                                       className="text-green-600 hover:text-green-900 transition-colors p-1.5 hover:bg-green-50 rounded-full"
                                       title="Edit Sub-Department"
                                     >
                                       <PencilIcon className="h-4 w-4" />
                                     </button>
                                     <button
                                       onClick={() => setDeleteConfirm({ 
                                         show: true, 
                                         departmentId: department._id, 
                                         subDeptId: subDept._id,
                                         type: 'subDept' 
                                       })}
                                       className="text-red-600 hover:text-red-900 transition-colors p-1.5 hover:bg-red-50 rounded-full"
                                       title="Delete Sub-Department"
                                     >
                                       <TrashIcon className="h-4 w-4" />
                                     </button>
                                   </div>
                                 </td>
                               </tr>
                             ))}
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
        title={`Delete ${deleteConfirm.type === 'subDept' ? 'Sub-Department' : 'Department'}`}
        message={`Are you sure you want to delete this ${deleteConfirm.type === 'subDept' ? 'sub-department' : 'department'}? This action cannot be undone and may affect related records.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirm({ show: false, departmentId: null, subDeptId: null, type: 'department' })}
      />
    </div>
  );
};

export default AdminDepartments; 