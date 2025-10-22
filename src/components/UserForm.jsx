import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  PhoneIcon, 
  UserIcon, 
  BriefcaseIcon, 
  AcademicCapIcon,
  UserGroupIcon,
  TagIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

const API_URL = import.meta.env.VITE_API_URL;

const UserForm = ({ initialData, onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    phoneNumber: initialData?.phoneNumber || '',
    department: initialData?.department || '',
    designation: initialData?.designation || '',
    isDeptHead: initialData?.isDeptHead || false,
    isFreeFood: initialData?.isFreeFood || false,
    isIntern: initialData?.isIntern || false,
    role: initialData?.role || '',
    status: initialData?.status || 'active',
    tags: initialData?.tags || []
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [departments, setDepartments] = useState([]);
  const [roles, setRoles] = useState([]);
  const [rolesLoading, setRolesLoading] = useState(false);
  const [availableTags, setAvailableTags] = useState([]);
  const [tagsLoading, setTagsLoading] = useState(false);

  // Check if the selected department should show isIntern field
  const shouldShowInternField = departments.find(dept => 
    dept._id === formData.department || dept.title === formData.department
  )?.allowInterns || false;

  // Get authentication token
  const getAuthToken = () => {
    return localStorage.getItem('adminToken');
  };

  // Role utility functions
  const formatRoleName = (name) => {
    if (!name) return '';
    return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
  };

  const isLeaderRole = (roleName) => {
    return roleName === 'leader' || roleName === 'super leader';
  };

  // Fetch departments
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/auth/departments`);
        setDepartments(response.data.departments);
      } catch (err) {
        console.error('Failed to fetch departments:', err);
      }
    };
    fetchDepartments();
  }, []);

  // Fetch roles
  useEffect(() => {
    const fetchRoles = async () => {
      try {
        setRolesLoading(true);
        const token = getAuthToken();
        const response = await axios.get(`${API_URL}/roles`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (response.data.success) {
          setRoles(response.data.roles || []);
        } else {
          console.error('Failed to fetch roles:', response.data.message);
        }
      } catch (err) {
        console.error('Failed to fetch roles:', err);
      } finally {
        setRolesLoading(false);
      }
    };
    fetchRoles();
  }, []);

  // Fetch tags
  useEffect(() => {
    const fetchTags = async () => {
      try {
        setTagsLoading(true);
        const token = getAuthToken();
        const response = await axios.get(`${API_URL}/tags`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        setAvailableTags(response.data || []);
      } catch (err) {
        console.error('Failed to fetch tags:', err);
      } finally {
        setTagsLoading(false);
      }
    };
    fetchTags();
  }, []);


  useEffect(() => {
    if (initialData) {
      const departmentValue = typeof initialData.department === 'string' ? initialData.department : initialData.department?.title || '';
      const userTags = initialData.tags ? initialData.tags.map(tag => 
        typeof tag === 'object' ? tag._id : tag
      ) : [];
      
      setFormData({
        name: initialData.name || '',
        phoneNumber: initialData.phoneNumber || '',
        department: departmentValue,
        designation: initialData.designation || '',
        isDeptHead: initialData.isDeptHead || false,
        isFreeFood: initialData.isFreeFood || false,
        isIntern: initialData.isIntern || false,
        role: typeof initialData.role === 'object' ? initialData.role?._id || '' : initialData.role || '',
        status: initialData.status || 'active',
        tags: userTags
      });
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleTagToggle = (tagId, isSelected) => {
    setFormData(prev => ({
      ...prev,
      tags: isSelected 
        ? [...prev.tags, tagId]
        : prev.tags.filter(id => id !== tagId)
    }));
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('adminToken');
      const endpoint = initialData 
        ? `${import.meta.env.VITE_API_URL}/admin/users/${initialData._id}`
        : `${import.meta.env.VITE_API_URL}/admin/users`;
      
      const method = initialData ? 'put' : 'post';

      await axios({
        method,
        url: endpoint,
        data: formData,
        headers: { Authorization: `Bearer ${token}` }
      });

      onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-md bg-red-50 p-3">
            <div className="text-sm text-red-700">{error}</div>
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Name
            </label>
            <div className="relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <UserIcon className="h-4 w-4 text-gray-400" aria-hidden="true" />
              </div>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                placeholder="Enter full name"
              />
            </div>
          </div>

          <div>
            <label htmlFor="phone-number" className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number
            </label>
            <div className="relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <PhoneIcon className="h-4 w-4 text-gray-400" aria-hidden="true" />
              </div>
              <input
                type="tel"
                id="phone-number"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
                required
                className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                placeholder="Enter 10-digit phone number"
              />
            </div>
          </div>

          <div>
            <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-1">
              Department
            </label>
            <div className="relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <BriefcaseIcon className="h-4 w-4 text-gray-400" aria-hidden="true" />
              </div>
              <select
                id="department"
                name="department"
                value={formData.department}
                onChange={handleChange}
                required
                className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
              >
                <option value="">Select Department</option>
                {departments.map(dept => (
                  <option key={typeof dept === 'string' ? dept : dept._id} value={typeof dept === 'string' ? dept : dept.title}>
                    {typeof dept === 'string' ? dept : dept.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="designation" className="block text-sm font-medium text-gray-700 mb-1">
              Designation
            </label>
            <div className="relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <AcademicCapIcon className="h-4 w-4 text-gray-400" aria-hidden="true" />
              </div>
              <input
                type="text"
                id="designation"
                name="designation"
                value={formData.designation}
                onChange={handleChange}
                required
                className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                placeholder="Enter designation"
              />
            </div>
          </div>
        </div>

        <div className={`grid gap-4 ${shouldShowInternField ? 'grid-cols-1 md:grid-cols-4' : 'grid-cols-1 md:grid-cols-3'}`}>
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="isDeptHead"
              name="isDeptHead"
              checked={formData.isDeptHead}
              onChange={handleChange}
              className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
            />
            <label htmlFor="isDeptHead" className="text-sm font-medium text-gray-700 flex items-center">
              <UserGroupIcon className="h-4 w-4 text-gray-400 mr-2" />
              Department Head
            </label>
          </div>

          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="isFreeFood"
              name="isFreeFood"
              checked={formData.isFreeFood}
              onChange={handleChange}
              className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
            />
            <label htmlFor="isFreeFood" className="text-sm font-medium text-gray-700 flex items-center">
              🍽️
              <span className="ml-2">Free Food</span>
            </label>
          </div>

          <div>
            <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
              Role
            </label>
            {(() => {
              // Check if user has a leadership role
              const currentRole = roles.find(role => role.id === formData.role);
              const hasLeadershipRole = currentRole && isLeaderRole(currentRole.name);
              
              if (hasLeadershipRole) {
                // Show read-only field for leadership roles
                return (
                  <div className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 bg-gray-50 text-sm text-gray-600">
                    {formatRoleName(currentRole.name)} (Read-only - Leadership role)
                  </div>
                );
              }
              
              // Show editable dropdown for non-leadership roles
              return (
                <select
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 text-sm"
                >
                  <option value="">Select Role</option>
                  {rolesLoading ? (
                    <option disabled>Loading roles...</option>
                  ) : roles.length === 0 ? (
                    <option disabled>No roles found</option>
                  ) : (
                    roles
                      .filter(role => !isLeaderRole(role.name)) // Hide leader and super leader roles
                      .map(role => (
                        <option key={role.id} value={role.id}>
                          {formatRoleName(role.name)}
                        </option>
                      ))
                  )}
                </select>
              );
            })()}
          </div>


          {shouldShowInternField && (
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="isIntern"
                name="isIntern"
                checked={formData.isIntern}
                onChange={handleChange}
                className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
              />
              <label htmlFor="isIntern" className="text-sm font-medium text-gray-700 flex items-center">
                📚
                <span className="ml-2">Intern</span>
              </label>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 text-sm"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div></div>
        </div>

        {/* Tags Selection */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">
            Tags
          </label>
          
          {tagsLoading ? (
            <div className="text-sm text-gray-500">Loading tags...</div>
          ) : (
            <div className="border border-gray-300 rounded-lg p-3 max-h-40 overflow-y-auto bg-gray-50">
              {availableTags.length === 0 ? (
                <div className="text-sm text-gray-500 text-center py-2">
                  No tags available. Create tags in the Tag Management section.
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {availableTags.map(tag => (
                    <label key={tag._id} className="flex items-center space-x-2 py-2 px-2 hover:bg-gray-100 rounded cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.tags.includes(tag._id)}
                        onChange={(e) => handleTagToggle(tag._id, e.target.checked)}
                        className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                      />
                      <span className="text-sm text-gray-700 flex items-center truncate">
                        <TagIcon className="h-4 w-4 text-gray-400 mr-1 flex-shrink-0" />
                        <span className="truncate">{tag.tagName}</span>
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}
          
          {/* Selected Tags Display */}
          {formData.tags.length > 0 && (
            <div className="space-y-2">
              <div className="text-sm font-medium text-gray-700">Selected Tags:</div>
              <div className="flex flex-wrap gap-2">
                {formData.tags.map(tagId => {
                  const tag = availableTags.find(t => t._id === tagId);
                  return (
                    <span 
                      key={tagId} 
                      className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-green-100 text-green-800 border border-green-200"
                    >
                      <TagIcon className="h-3 w-3 mr-1" />
                      {tag?.tagName || 'Unknown Tag'}
                      <button
                        type="button"
                        onClick={() => handleTagToggle(tagId, false)}
                        className="ml-2 text-green-600 hover:text-green-800 focus:outline-none"
                      >
                        <XMarkIcon className="h-3 w-3" />
                      </button>
                    </span>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-950 hover:bg-green-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            {loading ? 'Saving...' : (initialData ? 'Update' : 'Create')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default UserForm; 