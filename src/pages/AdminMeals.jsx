import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import { PencilIcon, TrashIcon, FunnelIcon } from '@heroicons/react/24/outline';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import ConfirmDialog from '../components/ConfirmDialog';

const AdminMeals = () => {
  const [meals, setMeals] = useState([]);
  const [filteredMeals, setFilteredMeals] = useState(null);
  const [error, setError] = useState('');
  const [editingMeal, setEditingMeal] = useState(null);
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, userId: null, mealId: null });

  const fetchAllMeals = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/admin/users/meals`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMeals(response.data);
      setFilteredMeals(null);
    } catch (err) {
      setError('Failed to fetch meals');
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
    } catch (err) {
      setError('Failed to fetch filtered meals');
    }
  };

  useEffect(() => {
    fetchAllMeals();
  }, []);

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
  };

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
          <div className="h-full pt-[64px] px-4 lg:px-6 pb-4 lg:pb-6">
            <div className="max-w-7xl mx-auto h-full flex flex-col">
              {/* Header Section */}
              <div className="mb-4 flex-shrink-0">
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200/50 p-6 lg:p-8">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div>
                      <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
                        Meal Records
                      </h1>
                      <p className="text-gray-600 text-lg">
                        Monitor daily meal consumption and manage food requirements
                      </p>
                      <div className="flex items-center mt-3 space-x-4 text-sm">
                        <span className="flex items-center text-green-600">
                          <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                          {displayMeals.reduce((acc, user) => acc + user.meals.length, 0)} Total Records
                        </span>
                        <span className="flex items-center text-blue-600">
                          <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                          {displayMeals.length} Active Users
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowFilters(!showFilters)}
                      className="inline-flex items-center px-6 py-3 bg-green-950 text-white font-semibold rounded-xl hover:bg-green-900 focus:outline-none focus:ring-2 focus:ring-green-800 focus:ring-offset-2 transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
                    >
                      <FunnelIcon className="h-5 w-5 mr-2" />
                      {showFilters ? 'Hide Filters' : 'Show Filters'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Filter Section */}
              {showFilters && (
                <div className="mb-6">
                  <div className="bg-white rounded-xl shadow-md border border-gray-200/50 p-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-end">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                        <input
                          type="date"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          className="block w-full px-4 py-3 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 rounded-lg bg-white transition-all duration-200"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                        <input
                          type="date"
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                          className="block w-full px-4 py-3 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 rounded-lg bg-white transition-all duration-200"
                        />
                      </div>
                      <div className="flex gap-3">
                        <button
                          onClick={handleFilter}
                          className="flex-1 inline-flex items-center justify-center px-4 py-3 bg-green-950 text-white font-semibold rounded-lg hover:bg-green-900 focus:outline-none focus:ring-2 focus:ring-green-800 transition-all duration-200"
                        >
                          Apply Filter
                        </button>
                        <button
                          onClick={clearFilters}
                          className="flex-1 inline-flex items-center justify-center px-4 py-3 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300 transition-all duration-200"
                        >
                          Clear
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {error && (
                <div className="mb-6 bg-gradient-to-r from-red-50 to-red-100 border border-red-200 rounded-xl p-4">
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-red-500 rounded-full mr-3"></div>
                    <div className="text-sm text-red-700 font-medium">{error}</div>
                  </div>
                </div>
              )}

              {/* Meals Table */}
              <div className="bg-white shadow-lg rounded-xl border border-gray-200/50 overflow-hidden">
                <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">Meal Consumption Records</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Daily meal records for all registered users
                  </p>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          User Details
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Breakfast
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Lunch
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Dinner
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {displayMeals.map((user) => (
                        user.meals.map((meal) => (
                          <tr key={meal._id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex flex-col">
                                <div className="text-sm font-medium text-gray-900">
                                  {user.name || 'No Name'}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {user.phoneNumber}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {format(new Date(meal.date), 'dd/MM/yyyy')}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              <span className={meal.breakfast ? 'text-green-600' : 'text-red-600'}>
                                {meal.breakfast ? '✓' : '✗'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              <span className={meal.lunch ? 'text-green-600' : 'text-red-600'}>
                                {meal.lunch ? '✓' : '✗'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              <span className={meal.dinner ? 'text-green-600' : 'text-red-600'}>
                                {meal.dinner ? '✓' : '✗'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <button
                                onClick={() => handleEdit(meal)}
                                className="text-indigo-600 hover:text-indigo-900 mr-4"
                              >
                                <PencilIcon className="h-5 w-5" />
                              </button>
                              <button
                                onClick={() => setDeleteConfirm({ show: true, userId: user._id, mealId: meal._id })}
                                className="text-red-600 hover:text-red-900"
                              >
                                <TrashIcon className="h-5 w-5" />
                              </button>
                            </td>
                          </tr>
                        ))
                      ))}
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