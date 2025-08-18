import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  PhoneIcon, 
  UserIcon, 
  BriefcaseIcon, 
  AcademicCapIcon,
  UserGroupIcon 
} from '@heroicons/react/24/outline';

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
    status: initialData?.status || 'active'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [departments, setDepartments] = useState([]);

  // Check if the selected department should show isIntern field
  const shouldShowInternField = formData.department === 'D4DX Innovations LLP';

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

  useEffect(() => {
    if (initialData) {
      const departmentValue = typeof initialData.department === 'string' ? initialData.department : initialData.department?.title || '';
      setFormData({
        name: initialData.name || '',
        phoneNumber: initialData.phoneNumber || '',
        department: departmentValue,
        designation: initialData.designation || '',
        isDeptHead: initialData.isDeptHead || false,
        isFreeFood: initialData.isFreeFood || false,
        isIntern: initialData.isIntern || false,
        role: initialData.role || '',
        status: initialData.status || 'active'
      });
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // Special handling for phone number - only allow digits and limit to 10
    if (name === 'phoneNumber') {
      const digitsOnly = value.replace(/\D/g, ''); // Remove non-digits
      if (digitsOnly.length <= 10) {
        setFormData(prev => ({
          ...prev,
          [name]: digitsOnly
        }));
      }
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
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
    <div className="max-w-4xl mx-auto">
      <div className="bg-white shadow-xl rounded-2xl border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-4">
          <h2 className="text-xl font-semibold text-white flex items-center">
            <UserIcon className="h-6 w-6 mr-3" />
            {initialData ? 'Edit User Details' : 'Create New User'}
          </h2>
          <p className="text-green-100 text-sm mt-1">
            {initialData ? 'Update user information and settings' : 'Fill in the details to add a new user to the system'}
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <div className="text-sm font-medium text-red-800">{error}</div>
                </div>
              </div>
            </div>
          )}
          
          {/* Basic Information Section */}
          <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <UserIcon className="h-5 w-5 mr-2 text-green-600" />
              Basic Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">
                  Full Name *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <UserIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                  </div>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="block w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 text-sm font-medium"
                    placeholder="Enter full name"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="phone-number" className="block text-sm font-semibold text-gray-700 mb-2">
                  Phone Number *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <PhoneIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                  </div>
                  <input
                    type="tel"
                    id="phone-number"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleChange}
                    required
                    maxLength="10"
                    className="block w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 text-sm font-medium"
                    placeholder="10-digit phone number"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <span className={`text-xs font-medium ${
                      formData.phoneNumber.length === 10 
                        ? 'text-green-600' 
                        : formData.phoneNumber.length > 0 
                        ? 'text-orange-500' 
                        : 'text-gray-400'
                    }`}>
                      {formData.phoneNumber.length}/10
                      {formData.phoneNumber.length === 10 && ' ✓'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Work Information Section */}
          <div className="bg-blue-50 rounded-xl p-5 border border-blue-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <BriefcaseIcon className="h-5 w-5 mr-2 text-blue-600" />
              Work Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="department" className="block text-sm font-semibold text-gray-700 mb-2">
                  Department *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <BriefcaseIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                  </div>
                  <select
                    id="department"
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    required
                    className="block w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-sm font-medium bg-white"
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
                <label htmlFor="designation" className="block text-sm font-semibold text-gray-700 mb-2">
                  Designation *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <AcademicCapIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                  </div>
                  <input
                    type="text"
                    id="designation"
                    name="designation"
                    value={formData.designation}
                    onChange={handleChange}
                    required
                    className="block w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-sm font-medium"
                    placeholder="Enter designation"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Roles & Permissions Section */}
          <div className="bg-purple-50 rounded-xl p-5 border border-purple-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <UserGroupIcon className="h-5 w-5 mr-2 text-purple-600" />
              Roles & Permissions
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              {/* Role Selection */}
              <div className="md:col-span-1">
                <label htmlFor="role" className="block text-sm font-semibold text-gray-700 mb-2">
                  System Role
                </label>
                <select
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="block w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 text-sm font-medium bg-white"
                >
                  <option value="">Select Role</option>
                  <option value="member">👤 Member</option>
                  <option value="driver">🚗 Driver</option>
                  <option value="accountant">💰 Accountant</option>
                  <option value="leader">👑 Leader</option>
                  <option value="super leader">🌟 Super Leader</option>
                </select>
              </div>

              {/* Status Selection */}
              <div className="md:col-span-1">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Account Status
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="block w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 text-sm font-medium bg-white"
                >
                  <option value="active">✅ Active</option>
                  <option value="inactive">❌ Inactive</option>
                </select>
              </div>
            </div>

            {/* Permission Checkboxes */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center p-3 bg-white rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                <input
                  type="checkbox"
                  id="isDeptHead"
                  name="isDeptHead"
                  checked={formData.isDeptHead}
                  onChange={handleChange}
                  className="h-5 w-5 text-purple-600 focus:ring-purple-500 border-gray-300 rounded transition-colors"
                />
                <label htmlFor="isDeptHead" className="ml-3 text-sm font-medium text-gray-700 flex items-center cursor-pointer">
                  <UserGroupIcon className="h-4 w-4 text-purple-500 mr-2" />
                  Department Head
                </label>
              </div>

              <div className="flex items-center p-3 bg-white rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                <input
                  type="checkbox"
                  id="isFreeFood"
                  name="isFreeFood"
                  checked={formData.isFreeFood}
                  onChange={handleChange}
                  className="h-5 w-5 text-green-600 focus:ring-green-500 border-gray-300 rounded transition-colors"
                />
                <label htmlFor="isFreeFood" className="ml-3 text-sm font-medium text-gray-700 flex items-center cursor-pointer">
                  🍽️
                  <span className="ml-2">Free Food</span>
                </label>
              </div>

              {shouldShowInternField && (
                <div className="flex items-center p-3 bg-white rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                  <input
                    type="checkbox"
                    id="isIntern"
                    name="isIntern"
                    checked={formData.isIntern}
                    onChange={handleChange}
                    className="h-5 w-5 text-orange-600 focus:ring-orange-500 border-gray-300 rounded transition-colors"
                  />
                  <label htmlFor="isIntern" className="ml-3 text-sm font-medium text-gray-700 flex items-center cursor-pointer">
                    📚
                    <span className="ml-2">Intern</span>
                  </label>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="px-6 py-3 border border-gray-300 rounded-xl text-sm font-semibold text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-all duration-200 shadow-sm"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-3 border border-transparent rounded-xl shadow-lg text-sm font-semibold text-white bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105"
            >
              {loading ? (
                <div className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </div>
              ) : (
                <div className="flex items-center">
                  {initialData ? '✏️ Update User' : '✨ Create User'}
                </div>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserForm; 