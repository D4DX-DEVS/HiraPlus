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
      // Prevent input if already at 10 digits
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
              Phone Number *
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
                maxLength="10"
                className="block w-full pl-10 pr-16 py-2.5 border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                placeholder="Enter 10-digit phone number"
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
            <select
              id="role"
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 text-sm"
            >
              <option value="">None</option>
              <option value="member">Member</option>
              <option value="driver">Driver</option>
              <option value="accountant">Accountant</option>
              <option value="leader">Leader</option>
              <option value="super leader">Super Leader</option>
            </select>
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