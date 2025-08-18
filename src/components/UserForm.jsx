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
    
    // Handle phone number validation - only allow 10 digits
    if (name === 'phoneNumber') {
      const digitsOnly = value.replace(/\D/g, ''); // Remove all non-digits
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
      <div className="bg-white shadow-2xl rounded-3xl border border-slate-200/60 overflow-hidden backdrop-blur-sm">
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-8 py-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-indigo-600/20"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(120,119,198,0.3),rgba(255,255,255,0))]"></div>
          <div className="relative z-10">
            <h3 className="text-xl font-bold text-white tracking-tight leading-tight">
              {initialData ? 'Edit User Profile' : 'Create New User'}
            </h3>
            <p className="text-slate-300 text-sm mt-1.5 font-medium">
              {initialData ? 'Update user information and system permissions' : 'Add a new user account to the system'}
            </p>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="p-8 space-y-7">
          {error && (
            <div className="rounded-xl bg-red-50 border border-red-200/50 p-4 shadow-sm">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-red-800">{error}</p>
                </div>
              </div>
            </div>
          )}
        
          <div className="bg-gradient-to-br from-slate-50 to-slate-100/50 rounded-2xl p-6 border border-slate-200/50">
            <h4 className="text-base font-bold text-slate-800 mb-5 flex items-center">
              <div className="w-8 h-8 bg-gradient-to-br from-slate-600 to-slate-700 rounded-lg flex items-center justify-center mr-3">
                <UserIcon className="h-4 w-4 text-white" />
              </div>
              Personal Information
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="name" className="block text-sm font-bold text-slate-700 mb-2">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <UserIcon className="h-4 w-4 text-slate-400 group-focus-within:text-slate-600 transition-colors" />
                  </div>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="block w-full pl-12 pr-4 py-3.5 border border-slate-300 rounded-xl placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 text-sm font-medium transition-all duration-200 bg-white shadow-sm hover:shadow-md hover:border-slate-400"
                    placeholder="Enter full name"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="phone-number" className="block text-sm font-bold text-slate-700 mb-2">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <PhoneIcon className="h-4 w-4 text-slate-400 group-focus-within:text-slate-600 transition-colors" />
                  </div>
                  <input
                    type="tel"
                    id="phone-number"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleChange}
                    required
                    maxLength="10"
                    pattern="[0-9]{10}"
                    className="block w-full pl-12 pr-16 py-3.5 border border-slate-300 rounded-xl placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 text-sm font-medium transition-all duration-200 bg-white shadow-sm hover:shadow-md hover:border-slate-400"
                    placeholder="10-digit mobile number"
                  />
                  <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                    <span className={`text-xs font-bold px-2 py-1 rounded-md transition-colors ${
                      formData.phoneNumber.length === 10 
                        ? 'text-emerald-700 bg-emerald-100' 
                        : 'text-slate-500 bg-slate-100'
                    }`}>
                      {formData.phoneNumber.length}/10
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-slate-50 to-slate-100/50 rounded-2xl p-6 border border-slate-200/50">
            <h4 className="text-base font-bold text-slate-800 mb-5 flex items-center">
              <div className="w-8 h-8 bg-gradient-to-br from-slate-600 to-slate-700 rounded-lg flex items-center justify-center mr-3">
                <BriefcaseIcon className="h-4 w-4 text-white" />
              </div>
              Work Information
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="department" className="block text-sm font-bold text-slate-700 mb-2">
                  Department <span className="text-red-500">*</span>
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                    <BriefcaseIcon className="h-4 w-4 text-slate-400 group-focus-within:text-slate-600 transition-colors" />
                  </div>
                  <select
                    id="department"
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    required
                    className="block w-full pl-12 pr-10 py-3.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 text-sm font-medium transition-all duration-200 bg-white shadow-sm hover:shadow-md hover:border-slate-400 appearance-none"
                  >
                    <option value="">Select Department</option>
                    {departments.map(dept => (
                      <option key={typeof dept === 'string' ? dept : dept._id} value={typeof dept === 'string' ? dept : dept.title}>
                        {typeof dept === 'string' ? dept : dept.title}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                    <svg className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              <div>
                <label htmlFor="designation" className="block text-sm font-bold text-slate-700 mb-2">
                  Designation <span className="text-red-500">*</span>
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <AcademicCapIcon className="h-4 w-4 text-slate-400 group-focus-within:text-slate-600 transition-colors" />
                  </div>
                  <input
                    type="text"
                    id="designation"
                    name="designation"
                    value={formData.designation}
                    onChange={handleChange}
                    required
                    className="block w-full pl-12 pr-4 py-3.5 border border-slate-300 rounded-xl placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 text-sm font-medium transition-all duration-200 bg-white shadow-sm hover:shadow-md hover:border-slate-400"
                    placeholder="Enter designation"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-slate-50 to-slate-100/50 rounded-2xl p-6 border border-slate-200/50">
            <h4 className="text-base font-bold text-slate-800 mb-5 flex items-center">
              <div className="w-8 h-8 bg-gradient-to-br from-slate-600 to-slate-700 rounded-lg flex items-center justify-center mr-3">
                <UserGroupIcon className="h-4 w-4 text-white" />
              </div>
              Roles & Permissions
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="relative group">
                  <input
                    type="checkbox"
                    id="isDeptHead"
                    name="isDeptHead"
                    checked={formData.isDeptHead}
                    onChange={handleChange}
                    className="peer sr-only"
                  />
                  <label 
                    htmlFor="isDeptHead" 
                    className="flex items-center justify-between p-4 bg-white rounded-xl border-2 border-slate-200 cursor-pointer transition-all duration-200 hover:border-slate-300 hover:shadow-md peer-checked:border-slate-500 peer-checked:bg-slate-50 peer-checked:shadow-md"
                  >
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center mr-3">
                        <UserGroupIcon className="h-4 w-4 text-white" />
                      </div>
                      <span className="text-sm font-bold text-slate-700">Department Head</span>
                    </div>
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                      formData.isDeptHead 
                        ? 'bg-slate-600 border-slate-600' 
                        : 'border-slate-300 bg-white'
                    }`}>
                      {formData.isDeptHead && (
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                  </label>
                </div>

                <div className="relative group">
                  <input
                    type="checkbox"
                    id="isFreeFood"
                    name="isFreeFood"
                    checked={formData.isFreeFood}
                    onChange={handleChange}
                    className="peer sr-only"
                  />
                  <label 
                    htmlFor="isFreeFood" 
                    className="flex items-center justify-between p-4 bg-white rounded-xl border-2 border-slate-200 cursor-pointer transition-all duration-200 hover:border-slate-300 hover:shadow-md peer-checked:border-emerald-500 peer-checked:bg-emerald-50 peer-checked:shadow-md"
                  >
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center mr-3">
                        <span className="text-white text-sm font-bold">🍽️</span>
                      </div>
                      <span className="text-sm font-bold text-slate-700">Free Food</span>
                    </div>
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                      formData.isFreeFood 
                        ? 'bg-emerald-600 border-emerald-600' 
                        : 'border-slate-300 bg-white'
                    }`}>
                      {formData.isFreeFood && (
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                  </label>
                </div>

                {shouldShowInternField && (
                  <div className="relative group">
                    <input
                      type="checkbox"
                      id="isIntern"
                      name="isIntern"
                      checked={formData.isIntern}
                      onChange={handleChange}
                      className="peer sr-only"
                    />
                    <label 
                      htmlFor="isIntern" 
                      className="flex items-center justify-between p-4 bg-white rounded-xl border-2 border-slate-200 cursor-pointer transition-all duration-200 hover:border-slate-300 hover:shadow-md peer-checked:border-orange-500 peer-checked:bg-orange-50 peer-checked:shadow-md"
                    >
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center mr-3">
                          <span className="text-white text-sm font-bold">📚</span>
                        </div>
                        <span className="text-sm font-bold text-slate-700">Intern</span>
                      </div>
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                        formData.isIntern 
                          ? 'bg-orange-600 border-orange-600' 
                          : 'border-slate-300 bg-white'
                      }`}>
                        {formData.isIntern && (
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                    </label>
                  </div>
                )}
              </div>

              <div>
                <label htmlFor="role" className="block text-sm font-bold text-slate-700 mb-2">
                  System Role
                </label>
                <div className="relative">
                  <select
                    id="role"
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    className="block w-full px-4 py-3.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 text-sm font-medium transition-all duration-200 bg-white shadow-sm hover:shadow-md hover:border-slate-400 appearance-none"
                  >
                    <option value="">👤 None</option>
                    <option value="member">👥 Member</option>
                    <option value="driver">🚗 Driver</option>
                    <option value="accountant">💰 Accountant</option>
                    <option value="leader">👑 Leader</option>
                    <option value="super leader">🌟 Super Leader</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                    <svg className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-slate-50 to-slate-100/50 rounded-2xl p-6 border border-slate-200/50">
            <h4 className="text-base font-bold text-slate-800 mb-5">
              Account Status
            </h4>
            
            <div className="w-full md:w-1/2">
              <label className="block text-sm font-bold text-slate-700 mb-2">Status</label>
              <div className="relative">
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="block w-full px-4 py-3.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 text-sm font-medium transition-all duration-200 bg-white shadow-sm hover:shadow-md hover:border-slate-400 appearance-none"
                >
                  <option value="active">✅ Active</option>
                  <option value="inactive">❌ Inactive</option>
                </select>
                <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                  <svg className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-4 pt-6 border-t border-slate-200">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="px-8 py-3.5 border-2 border-slate-300 rounded-xl text-sm font-bold text-slate-700 bg-white hover:bg-slate-50 hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transition-all duration-200 shadow-sm hover:shadow-md"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-3.5 border border-transparent rounded-xl shadow-md text-sm font-bold text-white bg-gradient-to-r from-slate-700 to-slate-800 hover:from-slate-800 hover:to-slate-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 hover:shadow-lg"
            >
              {loading ? (
                <div className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </div>
              ) : (
                <span>{initialData ? 'Update User' : 'Create User'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserForm;