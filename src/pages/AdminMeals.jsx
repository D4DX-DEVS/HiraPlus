import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import { PencilIcon, TrashIcon, FunnelIcon, PlusIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import ConfirmDialog from '../components/ConfirmDialog';
import { TableSkeleton } from '../components/SkeletonLoaders';

const AdminMeals = () => {
  const [meals, setMeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filteredMeals, setFilteredMeals] = useState(null);
  const [error, setError] = useState('');
  const [editingMeal, setEditingMeal] = useState(null);
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    const saved = localStorage.getItem('sidebarOpen');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [showFilters, setShowFilters] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, userId: null, mealId: null });
  
  // Add meal state
  const [showAddMeal, setShowAddMeal] = useState(false);
  const [usersList, setUsersList] = useState([]);
  const [addMealForm, setAddMealForm] = useState({
    userId: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    breakfast: false,
    lunch: false,
    dinner: false
  });
  const [userSearch, setUserSearch] = useState('');
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // Today's meal totals state
  const [todayTotals, setTodayTotals] = useState({
    breakfast: 0,
    lunch: 0,
    dinner: 0
  });

  // Function to calculate today's meal totals
  const calculateTodayTotals = (mealsData) => {
    const today = format(new Date(), 'yyyy-MM-dd');
    let breakfastCount = 0;
    let lunchCount = 0;
    let dinnerCount = 0;

    mealsData.forEach(user => {
      user.meals.forEach(meal => {
        const mealDate = format(new Date(meal.date), 'yyyy-MM-dd');
        if (mealDate === today) {
          if (meal.breakfast) breakfastCount++;
          if (meal.lunch) lunchCount++;
          if (meal.dinner) dinnerCount++;
        }
      });
    });

    setTodayTotals({
      breakfast: breakfastCount,
      lunch: lunchCount,
      dinner: dinnerCount
    });
  };

  const fetchAllMeals = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/admin/users/meals`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMeals(response.data);
      setFilteredMeals(null);
      calculateTodayTotals(response.data);
    } catch (err) {
      setError('Failed to fetch meals');
    } finally {
      setLoading(false);
    }
  };

  const fetchFilteredMeals = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/admin/users/meals?startDate=${startDate}&endDate=${endDate}`,
        { headers: { Authorization: `Bearer ${token}` }}
      );
      setFilteredMeals(response.data);
      // Still calculate today's totals from the original meals data
      calculateTodayTotals(meals);
    } catch (err) {
      setError('Failed to fetch filtered meals');
    }
  };

  const fetchUsersList = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/admin/users/list`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsersList(response.data);
    } catch (err) {
      setError('Failed to fetch users list');
    }
  };

  useEffect(() => {
    fetchAllMeals();
    fetchUsersList();
  }, []);

  // Save sidebar state to localStorage
  useEffect(() => {
    localStorage.setItem('sidebarOpen', JSON.stringify(isSidebarOpen));
  }, [isSidebarOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showUserDropdown && !event.target.closest('.user-dropdown-container')) {
        setShowUserDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserDropdown]);

  const handleDelete = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      await axios.delete(`${import.meta.env.VITE_API_URL}/admin/meals/${deleteConfirm.mealId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDeleteConfirm({ show: false, userId: null, mealId: null });
      fetchAllMeals();
    } catch (err) {
      setError('Failed to delete meal');
    }
  };

  const handleEdit = async (meal) => {
    setEditingMeal(meal);
  };

  const handleSaveEdit = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      await axios.put(
        `${import.meta.env.VITE_API_URL}/admin/meals/${editingMeal._id}`,
        {
          breakfast: editingMeal.breakfast,
          lunch: editingMeal.lunch,
          dinner: editingMeal.dinner
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setEditingMeal(null);
      fetchAllMeals();
    } catch (err) {
      setError('Failed to update meal');
    }
  };

  const handleFilter = () => {
    fetchFilteredMeals();
  };

  const clearFilters = () => {
    setFilteredMeals(null);
    setShowFilters(false);
    calculateTodayTotals(meals);
  };

  const handleAddMeal = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('adminToken');
      await axios.post(
        `${import.meta.env.VITE_API_URL}/admin/users/${addMealForm.userId}/meals`,
        {
          date: addMealForm.date,
          breakfast: addMealForm.breakfast,
          lunch: addMealForm.lunch,
          dinner: addMealForm.dinner
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setShowAddMeal(false);
      setAddMealForm({
        userId: '',
        date: format(new Date(), 'yyyy-MM-dd'),
        breakfast: false,
        lunch: false,
        dinner: false
      });
      setSelectedUser(null);
      setUserSearch('');
      fetchAllMeals();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add meal');
    }
  };

  const handleUserSelect = (user) => {
    setSelectedUser(user);
    setAddMealForm({ ...addMealForm, userId: user._id });
    setUserSearch(user.displayName);
    setShowUserDropdown(false);
  };

  const filteredUsers = usersList.filter(user =>
    user.displayName.toLowerCase().includes(userSearch.toLowerCase())
  );

  const displayMeals = filteredMeals || meals;

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
                        Meal Records
                      </h1>
                      <div className="flex items-center space-x-3 text-xs">
                        <span className="flex items-center text-green-600">
                          <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5"></div>
                          {displayMeals.reduce((acc, user) => acc + user.meals.length, 0)} Total Records
                        </span>
                        <span className="flex items-center text-blue-600">
                          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-1.5"></div>
                          {displayMeals.length} Active Users
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setShowAddMeal(true)}
                        className="inline-flex items-center px-3 py-1.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 transform hover:scale-105 shadow-md hover:shadow-lg text-sm"
                      >
                        <PlusIcon className="h-4 w-4 mr-1.5" />
                        Add Meal
                      </button>
                    <button
                      onClick={() => setShowFilters(!showFilters)}
                      className="inline-flex items-center px-3 py-1.5 bg-green-950 text-white font-medium rounded-lg hover:bg-green-900 focus:outline-none focus:ring-2 focus:ring-green-800 focus:ring-offset-2 transition-all duration-200 transform hover:scale-105 shadow-md hover:shadow-lg text-sm"
                    >
                      <FunnelIcon className="h-4 w-4 mr-1.5" />
                      {showFilters ? 'Hide Filters' : 'Show Filters'}
                    </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Today's Totals Cards */}
              <div className="mb-3 flex-shrink-0">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {/* Breakfast Card */}
                  <div className="bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 rounded-lg p-3 hover:shadow-sm transition-shadow">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-xs font-medium text-gray-600 mb-1">Today's Breakfast</h3>
                        <p className="text-xl font-bold text-gray-800">{todayTotals.breakfast}</p>
                      </div>
                      <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Lunch Card */}
                  <div className="bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 rounded-lg p-3 hover:shadow-sm transition-shadow">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-xs font-medium text-gray-600 mb-1">Today's Lunch</h3>
                        <p className="text-xl font-bold text-gray-800">{todayTotals.lunch}</p>
                      </div>
                      <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Dinner Card */}
                  <div className="bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 rounded-lg p-3 hover:shadow-sm transition-shadow">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-xs font-medium text-gray-600 mb-1">Today's Dinner</h3>
                        <p className="text-xl font-bold text-gray-800">{todayTotals.dinner}</p>
                      </div>
                      <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Filter Section */}
              {showFilters && (
                <div className="mb-3">
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200/50 p-3">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 items-end">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                        <input
                          type="date"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          className="block w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 rounded-lg bg-white transition-all duration-200 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                        <input
                          type="date"
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                          className="block w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 rounded-lg bg-white transition-all duration-200 text-sm"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={handleFilter}
                          className="flex-1 inline-flex items-center justify-center px-3 py-2 bg-green-950 text-white font-medium rounded-lg hover:bg-green-900 focus:outline-none focus:ring-2 focus:ring-green-800 transition-all duration-200 text-sm"
                        >
                          Apply Filter
                        </button>
                        <button
                          onClick={clearFilters}
                          className="flex-1 inline-flex items-center justify-center px-3 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300 transition-all duration-200 text-sm"
                        >
                          Clear
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {error && (
                <div className="mb-3 bg-gradient-to-r from-red-50 to-red-100 border border-red-200 rounded-xl p-3 flex-shrink-0">
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-red-500 rounded-full mr-3"></div>
                    <div className="text-sm text-red-700 font-medium">{error}</div>
                  </div>
                </div>
              )}

              {/* Add Meal Modal */}
              {showAddMeal && (
                <div className="mb-3 bg-white shadow-lg rounded-xl border border-gray-200/50 p-4 lg:p-5 flex-shrink-0 max-w-2xl mx-auto">
                  <div className="mb-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-lg font-semibold text-gray-900">Add User Meal</h2>
                        <p className="text-sm text-gray-600 mt-1">Create a new meal record for a user</p>
                      </div>
                      <button
                        onClick={() => {
                          setShowAddMeal(false);
                          setAddMealForm({
                            userId: '',
                            date: format(new Date(), 'yyyy-MM-dd'),
                            breakfast: false,
                            lunch: false,
                            dinner: false
                          });
                          setSelectedUser(null);
                          setUserSearch('');
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

                  <form onSubmit={handleAddMeal} className="space-y-4">
                    {/* User Selection */}
                    <div className="relative user-dropdown-container">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Select User
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={userSearch}
                          onChange={(e) => {
                            setUserSearch(e.target.value);
                            setShowUserDropdown(true);
                          }}
                          onFocus={() => setShowUserDropdown(true)}
                          className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors pr-10"
                          placeholder="Search users by name, phone, or department..."
                          required
                        />
                        <ChevronDownIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        
                        {showUserDropdown && filteredUsers.length > 0 && (
                          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                            {filteredUsers.slice(0, 10).map((user) => (
                              <div
                                key={user._id}
                                onClick={() => handleUserSelect(user)}
                                className="px-3 py-2 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                              >
                                <div className="text-sm font-medium text-gray-900">{user.name}</div>
                                <div className="text-xs text-gray-500">
                                  {user.phoneNumber} • {user.department} • {user.designation}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Date Selection */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Date
                      </label>
                      <input
                        type="date"
                        value={addMealForm.date}
                        onChange={(e) => setAddMealForm({ ...addMealForm, date: e.target.value })}
                        className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        required
                      />
                    </div>

                    {/* Meal Selections */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Meal Types
                      </label>
                      <div className="space-y-3">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={addMealForm.breakfast}
                            onChange={(e) => setAddMealForm({ ...addMealForm, breakfast: e.target.checked })}
                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="ml-2 text-sm text-gray-700">Breakfast</span>
                        </label>
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={addMealForm.lunch}
                            onChange={(e) => setAddMealForm({ ...addMealForm, lunch: e.target.checked })}
                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="ml-2 text-sm text-gray-700">Lunch</span>
                        </label>
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={addMealForm.dinner}
                            onChange={(e) => setAddMealForm({ ...addMealForm, dinner: e.target.checked })}
                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="ml-2 text-sm text-gray-700">Dinner</span>
                        </label>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                      <button
                        type="button"
                        onClick={() => {
                          setShowAddMeal(false);
                          setAddMealForm({
                            userId: '',
                            date: format(new Date(), 'yyyy-MM-dd'),
                            breakfast: false,
                            lunch: false,
                            dinner: false
                          });
                          setSelectedUser(null);
                          setUserSearch('');
                        }}
                        className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={!addMealForm.userId}
                        className="px-6 py-2.5 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Add Meal
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Meals Table */}
              <div className="bg-white shadow-lg rounded-xl border border-gray-200/50 overflow-hidden flex-1 flex flex-col min-h-0">
                <div className="px-4 py-3 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200 flex-shrink-0">
                  <h3 className="text-base font-semibold text-gray-900">Meal Consumption Records</h3>
                  <p className="text-xs text-gray-600 mt-0.5">
                    Daily meal records for all registered users
                  </p>
                </div>
                <div className="flex-1 overflow-auto">
                  <table className="w-full divide-y divide-gray-200 table-fixed">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-3 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{width: '25%'}}>
                          User Details
                        </th>
                        <th className="px-2 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{width: '15%'}}>
                          Date
                        </th>
                        <th className="px-2 py-2.5 text-center text-xs font-medium text-gray-500 uppercase tracking-wider" style={{width: '15%'}}>
                          Breakfast
                        </th>
                        <th className="px-2 py-2.5 text-center text-xs font-medium text-gray-500 uppercase tracking-wider" style={{width: '15%'}}>
                          Lunch
                        </th>
                        <th className="px-2 py-2.5 text-center text-xs font-medium text-gray-500 uppercase tracking-wider" style={{width: '15%'}}>
                          Dinner
                        </th>
                        <th className="px-2 py-2.5 text-center text-xs font-medium text-gray-500 uppercase tracking-wider" style={{width: '15%'}}>
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {loading ? (
                        <TableSkeleton rows={8} columns={6} />
                      ) : displayMeals.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="px-6 py-8 text-center">
                            <div className="text-gray-400">
                              <svg className="w-10 h-10 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                              </svg>
                              <p className="text-base font-medium text-gray-900 mb-1">No meal records found</p>
                              <p className="text-sm text-gray-600">Try adjusting your search criteria or check back later.</p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        displayMeals.map((user) => (
                          user.meals.map((meal, index) => (
                            <tr key={meal._id} className="hover:bg-gray-50 transition-colors duration-150">
                              <td className="px-3 py-2.5 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div className="w-6 h-6 bg-gradient-to-br from-green-600 to-green-800 rounded-full flex items-center justify-center text-white text-xs font-medium mr-2 flex-shrink-0">
                                    {(user.name || 'N')?.charAt(0).toUpperCase()}
                                  </div>
                                  <div className="min-w-0">
                                    <div className="text-xs font-medium text-gray-900 truncate" title={user.name || 'No Name'}>
                                      {user.name || 'No Name'}
                                    </div>
                                    <div className="text-xs text-gray-500 truncate" title={user.phoneNumber}>
                                      {user.phoneNumber}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-2 py-2.5 whitespace-nowrap text-xs text-gray-900">
                                <div className="truncate" title={format(new Date(meal.date), 'dd/MM/yyyy')}>
                                  {format(new Date(meal.date), 'dd/MM/yyyy')}
                                </div>
                              </td>
                              <td className="px-2 py-2.5 whitespace-nowrap text-center">
                                <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-medium ${
                                  meal.breakfast ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                }`}>
                                  {meal.breakfast ? '✓' : '✗'}
                                </span>
                              </td>
                              <td className="px-2 py-2.5 whitespace-nowrap text-center">
                                <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-medium ${
                                  meal.lunch ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                }`}>
                                  {meal.lunch ? '✓' : '✗'}
                                </span>
                              </td>
                              <td className="px-2 py-2.5 whitespace-nowrap text-center">
                                <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-medium ${
                                  meal.dinner ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                }`}>
                                  {meal.dinner ? '✓' : '✗'}
                                </span>
                              </td>
                              <td className="px-2 py-2.5 whitespace-nowrap text-center">
                                <div className="flex justify-center space-x-1">
                                  <button
                                    onClick={() => handleEdit(meal)}
                                    className="text-green-600 hover:text-green-900 transition-colors p-1 hover:bg-green-50 rounded"
                                    title="Edit Meal"
                                  >
                                    <PencilIcon className="h-3.5 w-3.5" />
                                  </button>
                                  <button
                                    onClick={() => setDeleteConfirm({ show: true, userId: user._id, mealId: meal._id })}
                                    className="text-red-600 hover:text-red-900 transition-colors p-1 hover:bg-red-50 rounded"
                                    title="Delete Meal"
                                  >
                                    <TrashIcon className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
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
        title="Delete Meal Record"
        message="Are you sure you want to delete this meal record? This action cannot be undone."
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirm({ show: false, userId: null, mealId: null })}
      />

      {editingMeal && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex min-h-screen items-end justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div 
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" 
              aria-hidden="true"
              onClick={() => setEditingMeal(null)}
            ></div>

            <span className="hidden sm:inline-block sm:h-screen sm:align-middle" aria-hidden="true">&#8203;</span>

            <div className="relative inline-block transform overflow-hidden rounded-lg bg-white text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:align-middle">
              <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
                  Edit Meal Record
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700">Breakfast</label>
                    <input
                      type="checkbox"
                      checked={editingMeal.breakfast}
                      onChange={(e) => setEditingMeal({...editingMeal, breakfast: e.target.checked})}
                      className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700">Lunch</label>
                    <input
                      type="checkbox"
                      checked={editingMeal.lunch}
                      onChange={(e) => setEditingMeal({...editingMeal, lunch: e.target.checked})}
                      className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700">Dinner</label>
                    <input
                      type="checkbox"
                      checked={editingMeal.dinner}
                      onChange={(e) => setEditingMeal({...editingMeal, dinner: e.target.checked})}
                      className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                    />
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  className="inline-flex w-full justify-center rounded-md border border-transparent bg-green-950 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-green-900 focus:outline-none focus:ring-2 focus:ring-green-800 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Save Changes
                </button>
                <button
                  type="button"
                  onClick={() => setEditingMeal(null)}
                  className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 sm:mt-0 sm:w-auto sm:text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminMeals; 