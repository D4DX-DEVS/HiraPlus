import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { PencilIcon, TrashIcon, PlusIcon } from '@heroicons/react/24/outline';
import ConfirmDialog from '../components/ConfirmDialog';
import { TableSkeleton } from '../components/SkeletonLoaders';

const GuestMeals = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    const saved = localStorage.getItem('sidebarOpen');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [guestMeals, setGuestMeals] = useState([]);
  const [departmentSummary, setDepartmentSummary] = useState([]);
  const [overallTotals, setOverallTotals] = useState({
    totalBreakfast: 0,
    totalLunch: 0,
    totalDinner: 0,
    totalMeals: 0
  });
  const [showModal, setShowModal] = useState(false);
  const [editingMeal, setEditingMeal] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, mealId: null });
  const [departments, setDepartments] = useState([]);
  const [viewMode, setViewMode] = useState('individual'); // 'individual' or 'summary'
  const [formData, setFormData] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    department: '',
    breakfastCount: 0,
    lunchCount: 0,
    dinnerCount: 0
  });

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

  const fetchGuestMeals = async () => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('adminToken');
      const url = `${import.meta.env.VITE_API_URL}/admin/guest-meals`;

      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setGuestMeals(response.data.guestMeals || []);
      setDepartmentSummary(response.data.departmentSummary || []);
      setOverallTotals(response.data.overallTotals || {
        totalBreakfast: 0,
        totalLunch: 0,
        totalDinner: 0,
        totalMeals: 0
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch guest meals');
      console.error('Error fetching guest meals:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('adminToken');
      const url = `${import.meta.env.VITE_API_URL}/admin/guest-meals${editingMeal ? `/${editingMeal._id}` : ''}`;
      const method = editingMeal ? 'put' : 'post';

      await axios({
        method,
        url,
        data: formData,
        headers: { Authorization: `Bearer ${token}` }
      });

      setShowModal(false);
      setEditingMeal(null);
      setFormData({
        date: format(new Date(), 'yyyy-MM-dd'),
        department: '',
        breakfastCount: 0,
        lunchCount: 0,
        dinnerCount: 0
      });
      fetchGuestMeals();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save guest meal');
    }
  };

  const handleDelete = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      await axios.delete(`${import.meta.env.VITE_API_URL}/admin/guest-meals/${deleteConfirm.mealId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDeleteConfirm({ show: false, mealId: null });
      fetchGuestMeals();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete guest meal');
    }
  };

  const handleEdit = (meal) => {
    setEditingMeal(meal);
    const departmentValue = typeof meal.department === 'string' ? meal.department : meal.department?.title || '';
    setFormData({
      date: format(new Date(meal.date), 'yyyy-MM-dd'),
      department: departmentValue,
      breakfastCount: meal.breakfastCount || 0,
      lunchCount: meal.lunchCount || 0,
      dinnerCount: meal.dinnerCount || 0
    });
    setShowModal(true);
  };

  useEffect(() => {
    fetchGuestMeals();
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
                        Guest Meals
                      </h1>
                      <div className="flex items-center space-x-3 text-xs">
                        <span className="flex items-center text-green-600">
                          <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5"></div>
                          {overallTotals.totalMeals} Total Meals
                        </span>
                        <span className="flex items-center text-blue-600">
                          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-1.5"></div>
                          {departmentSummary.length} Departments
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setEditingMeal(null);
                        setFormData({
                          date: format(new Date(), 'yyyy-MM-dd'),
                          department: '',
                          breakfastCount: 0,
                          lunchCount: 0,
                          dinnerCount: 0
                        });
                        setShowModal(true);
                      }}
                      className="inline-flex items-center px-3 py-1.5 bg-green-950 text-white font-medium rounded-lg hover:bg-green-900 focus:outline-none focus:ring-2 focus:ring-green-800 focus:ring-offset-2 transition-all duration-200 transform hover:scale-105 shadow-md hover:shadow-lg text-sm"
                    >
                      <PlusIcon className="h-4 w-4 mr-1.5" />
                      Add Guest Meal
                    </button>
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
                <div className="mb-3 bg-white shadow-lg rounded-xl border border-gray-200/50 p-4 lg:p-5 flex-shrink-0 max-w-4xl mx-auto">
                  <div className="mb-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-lg font-semibold text-gray-900">
                      {editingMeal ? 'Edit Guest Meal' : 'Add Guest Meal'}
                    </h2>
                        <p className="text-sm text-gray-600 mt-1">
                          {editingMeal ? 'Update guest meal information and counts' : 'Create a new guest meal entry for a department'}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setShowModal(false);
                          setEditingMeal(null);
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

                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Basic Information */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            <span className="flex items-center">
                              <svg className="h-4 w-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a4 4 0 118 0v4m-4 8v6m0 0l4-4m-4 4l-4-4m4-16a8 8 0 11-8 8 8 8 0 018-8z" />
                              </svg>
                              Date
                            </span>
                          </label>
                          <input
                            type="date"
                            value={formData.date}
                            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                            className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            <span className="flex items-center">
                              <svg className="h-4 w-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                              </svg>
                              Department
                            </span>
                          </label>
                            <select
                              value={formData.department}
                              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                            className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                              required
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
                    </div>

                    {/* Meal Counts */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Meal Counts</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            <span className="flex items-center">
                              <svg className="h-4 w-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                              </svg>
                              Breakfast Count
                            </span>
                          </label>
                            <input
                              type="number"
                              min="0"
                              value={formData.breakfastCount}
                              onChange={(e) => setFormData({ ...formData, breakfastCount: parseInt(e.target.value) || 0 })}
                            className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                            placeholder="0"
                            />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            <span className="flex items-center">
                              <svg className="h-4 w-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                              </svg>
                              Lunch Count
                            </span>
                          </label>
                            <input
                              type="number"
                              min="0"
                              value={formData.lunchCount}
                              onChange={(e) => setFormData({ ...formData, lunchCount: parseInt(e.target.value) || 0 })}
                            className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                            placeholder="0"
                            />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            <span className="flex items-center">
                              <svg className="h-4 w-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a8.949 8.949 0 008.354-5.646z" />
                              </svg>
                              Dinner Count
                            </span>
                          </label>
                            <input
                              type="number"
                              min="0"
                              value={formData.dinnerCount}
                              onChange={(e) => setFormData({ ...formData, dinnerCount: parseInt(e.target.value) || 0 })}
                            className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                            placeholder="0"
                            />
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                        <button
                          type="button"
                        onClick={() => {
                          setShowModal(false);
                          setEditingMeal(null);
                        }}
                        className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                        className="px-6 py-2.5 text-sm font-medium text-white bg-green-600 border border-transparent rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
                        >
                        {editingMeal ? 'Update Guest Meal' : 'Create Guest Meal'}
                        </button>
                      </div>
                    </form>
                </div>
              )}

              <div className="bg-white shadow-lg rounded-xl border border-gray-200/50 overflow-hidden flex-1 flex flex-col min-h-0">
                <div className="px-3 py-2 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200 flex-shrink-0">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-semibold text-gray-900">Guest Meals List</h3>
                      <p className="text-xs text-gray-600 mt-0.5">
                        {loading ? 'Loading...' : `${guestMeals.length} guest meal${guestMeals.length !== 1 ? 's' : ''} recorded`}
                      </p>
                    </div>
                    
                    {/* View Mode Toggle */}
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-3">
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="viewMode"
                            value="individual"
                            checked={viewMode === 'individual'}
                            onChange={(e) => setViewMode(e.target.value)}
                            className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300"
                          />
                          <span className="ml-2 text-sm text-gray-700">Individual Meals</span>
                        </label>
                        
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="viewMode"
                            value="summary"
                            checked={viewMode === 'summary'}
                            onChange={(e) => setViewMode(e.target.value)}
                            className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300"
                          />
                          <span className="ml-2 text-sm text-gray-700">Department Summary</span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex-1 overflow-auto">
                  {loading ? (
                    <table className="w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          {viewMode === 'individual' ? (
                            <>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Breakfast</th>
                              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Lunch</th>
                              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Dinner</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Added By</th>
                              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </>
                          ) : (
                            <>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Breakfast</th>
                              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Lunch</th>
                              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Dinner</th>
                              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                            </>
                          )}
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        <TableSkeleton rows={6} columns={viewMode === 'individual' ? 7 : 5} />
                      </tbody>
                    </table>
                  ) : viewMode === 'individual' ? (
                    <table className="w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Breakfast</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Lunch</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Dinner</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Added By</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {guestMeals.length === 0 ? (
                          <tr>
                            <td colSpan="7" className="px-6 py-8 text-center">
                              <div className="text-gray-400">
                                <svg className="w-10 h-10 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                </svg>
                                <p className="text-base font-medium text-gray-900 mb-1">No guest meals found</p>
                                <p className="text-sm text-gray-600">Add a new guest meal entry to get started.</p>
                              </div>
                            </td>
                          </tr>
                        ) : (
                          guestMeals.map((meal, index) => (
                            <tr key={meal._id} className={`hover:bg-gray-50 transition-colors duration-150 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {format(new Date(meal.date), 'MMM d, yyyy')}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {typeof meal.department === 'string' ? meal.department : meal.department?.title || 'N/A'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">{meal.breakfastCount || 0}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">{meal.lunchCount || 0}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">{meal.dinnerCount || 0}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {typeof meal.addedBy === 'string' ? 
                                  meal.addedBy : 
                                  meal.addedBy?.name ? 
                                    `${meal.addedBy.name} (${typeof meal.addedBy.department === 'string' ? meal.addedBy.department : meal.addedBy.department?.title || 'N/A'})` : 
                                    'N/A'
                                }
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <div className="flex justify-end space-x-2">
                                  <button
                                    onClick={() => handleEdit(meal)}
                                    className="text-green-600 hover:text-green-900 transition-colors p-1.5 hover:bg-green-50 rounded-full"
                                    title="Edit"
                                  >
                                    <PencilIcon className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={() => setDeleteConfirm({ show: true, mealId: meal._id })}
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
                  ) : (
                    <table className="w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Breakfast</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Lunch</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Dinner</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {departmentSummary.length === 0 ? (
                            <tr>
                              <td colSpan="5" className="px-6 py-8 text-center">
                                <div className="text-gray-400">
                                  <svg className="w-10 h-10 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                  </svg>
                                  <p className="text-base font-medium text-gray-900 mb-1">No department summary available</p>
                                  <p className="text-sm text-gray-600">Department totals will appear here once meals are added.</p>
                                </div>
                              </td>
                            </tr>
                          ) : (
                            departmentSummary.map((dept, index) => (
                              <tr key={dept.department} className={`hover:bg-gray-50 transition-colors duration-150 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{dept.department}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">{dept.totalBreakfast || dept.breakfast || 0}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">{dept.totalLunch || dept.lunch || 0}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">{dept.totalDinner || dept.dinner || 0}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold text-gray-900">
                                  {dept.totalMeals || dept.total || 0}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      <ConfirmDialog
        isOpen={deleteConfirm.show}
        title="Delete Guest Meal"
        message="Are you sure you want to delete this guest meal? This action cannot be undone."
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirm({ show: false, mealId: null })}
      />
    </div>
  );
};

export default GuestMeals; 