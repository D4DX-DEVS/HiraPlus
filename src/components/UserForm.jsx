import React, { useState } from 'react';
import axios from 'axios';
import { PhoneIcon, UserIcon, BriefcaseIcon, AcademicCapIcon } from '@heroicons/react/24/outline';

const UserForm = ({ onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    phoneNumber: '',
    department: '',
    designation: ''
  });
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validate all required fields
    if (!formData.name?.trim()) {
      setError('Name is required');
      return;
    }
    if (!formData.phoneNumber?.trim()) {
      setError('Phone number is required');
      return;
    }
    if (!formData.department?.trim()) {
      setError('Department is required');
      return;
    }
    if (!formData.designation?.trim()) {
      setError('Designation is required');
      return;
    }

    // Validate phone number format
    const phoneNumber = formData.phoneNumber.trim().replace('+91', '').replace(/\D/g, '');
    if (phoneNumber.length !== 10) {
      setError('Please provide a valid 10-digit phone number');
      return;
    }

    try {
      const token = localStorage.getItem('adminToken');
      const headers = { Authorization: `Bearer ${token}` };
      
      // Clean the data before sending
      const cleanedFormData = {
        name: formData.name.trim(),
        phoneNumber: phoneNumber,
        department: formData.department.trim(),
        designation: formData.designation.trim()
      };
      
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/admin/users`,
        cleanedFormData,
        { headers }
      );

      if (response.data && response.data.user) {
        onSuccess();
        // Reset form
        setFormData({
          name: '',
          phoneNumber: '',
          department: '',
          designation: ''
        });
      }
    } catch (err) {
      console.error('Form submission error:', err.response?.data);
      setError(err.response?.data?.message || 'Failed to create user. Please try again.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="text-base text-red-700">{error}</div>
        </div>
      )}
      
      <div className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
            Name
          </label>
          <div className="relative rounded-md shadow-sm">
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
              className="block w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-base"
              placeholder="Enter full name"
            />
          </div>
        </div>

        <div>
          <label htmlFor="phone-number" className="block text-sm font-medium text-gray-700 mb-2">
            Phone Number
          </label>
          <div className="relative rounded-md shadow-sm">
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
              className="block w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-base"
              placeholder="Enter 10-digit phone number"
            />
          </div>
        </div>

        <div>
          <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-2">
            Department
          </label>
          <div className="relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <BriefcaseIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
            </div>
            <input
              type="text"
              id="department"
              name="department"
              value={formData.department}
              onChange={handleChange}
              required
              className="block w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-base"
              placeholder="Enter department name"
            />
          </div>
        </div>

        <div>
          <label htmlFor="designation" className="block text-sm font-medium text-gray-700 mb-2">
            Designation
          </label>
          <div className="relative rounded-md shadow-sm">
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
              className="block w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-base"
              placeholder="Enter designation"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end space-x-3">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Add User
        </button>
      </div>
    </form>
  );
};

export default UserForm; 