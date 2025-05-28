import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { PencilIcon, TrashIcon, PlusIcon } from '@heroicons/react/24/outline';
import ConfirmDialog from '../components/ConfirmDialog';

const GuestMeals = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
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
  const [formData, setFormData] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    department: '',
    breakfastCount: 0,
    lunchCount: 0,
    dinnerCount: 0
  });

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
    setFormData({
      date: format(new Date(meal.date), 'yyyy-MM-dd'),
      department: meal.department,
      breakfastCount: meal.breakfastCount || 0,
      lunchCount: meal.lunchCount || 0,
      dinnerCount: meal.dinnerCount || 0
    });
    setShowModal(true);
  };

  useEffect(() => {
    fetchGuestMeals();
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
      
      <div className="flex pt-[60px] min-h-screen">
        <Sidebar isOpen={isSidebarOpen} />
        
        <main className={`flex-1 bg-gray-100 transition-all duration-300 ease-in-out ${isSidebarOpen ? 'ml-64' : 'ml-0'}`}>
          <div className="p-6">
            <div className="max-w-7xl mx-auto">
              <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-semibold text-gray-900">Guest Meals Management</h1>
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
                  className="bg-indigo-600 text-white px-4 py-2 rounded-md flex items-center hover:bg-indigo-700"
                >
                  <PlusIcon className="h-5 w-5 mr-2" />
                  Add Guest Meal
                </button>
              </div>

              {error && (
                <div className="mb-4 rounded-md bg-red-50 p-3">
                  <div className="text-sm text-red-700">{error}</div>
                </div>
              )}

              {/* Modal */}
              {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                  <div className="bg-white rounded-lg p-6 w-full max-w-md">
                    <h2 className="text-xl font-semibold mb-4">
                      {editingMeal ? 'Edit Guest Meal' : 'Add Guest Meal'}
                    </h2>
                    <form onSubmit={handleSubmit}>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Date</label>
                          <input
                            type="date"
                            value={formData.date}
                            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                            className="mt-1 block w-full rounded-lg border-2 border-indigo-100 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Department</label>
                          <div className="relative mt-1">
                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                              <svg className="h-5 w-5 text-gray-400" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M19 21V5C19 3.89543 18.1046 3 17 3H7C5.89543 3 5 3.89543 5 5V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                <path d="M9 7H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                <path d="M9 11H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                <path d="M9 15H13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                              </svg>
                            </div>
                            <input
                              type="text"
                              value={formData.department}
                              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                              className="block w-full rounded-lg border-2 border-indigo-100 pl-10 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                              required
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Breakfast Count</label>
                          <div className="relative mt-1">
                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                              <svg className="h-5 w-5 text-gray-400" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 8V12L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"/>
                              </svg>
                            </div>
                            <input
                              type="number"
                              min="0"
                              value={formData.breakfastCount}
                              onChange={(e) => setFormData({ ...formData, breakfastCount: parseInt(e.target.value) || 0 })}
                              className="block w-full rounded-lg border-2 border-indigo-100 pl-10 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Lunch Count</label>
                          <div className="relative mt-1">
                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                              <svg className="h-5 w-5 text-gray-400" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 8V12L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"/>
                              </svg>
                            </div>
                            <input
                              type="number"
                              min="0"
                              value={formData.lunchCount}
                              onChange={(e) => setFormData({ ...formData, lunchCount: parseInt(e.target.value) || 0 })}
                              className="block w-full rounded-lg border-2 border-indigo-100 pl-10 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Dinner Count</label>
                          <div className="relative mt-1">
                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                              <svg className="h-5 w-5 text-gray-400" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 8V12L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"/>
                              </svg>
                            </div>
                            <input
                              type="number"
                              min="0"
                              value={formData.dinnerCount}
                              onChange={(e) => setFormData({ ...formData, dinnerCount: parseInt(e.target.value) || 0 })}
                              className="block w-full rounded-lg border-2 border-indigo-100 pl-10 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            />
                          </div>
                        </div>
                      </div>
                      <div className="mt-6 flex justify-end space-x-3">
                        <button
                          type="button"
                          onClick={() => setShowModal(false)}
                          className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md"
                        >
                          {editingMeal ? 'Update' : 'Create'}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {loading ? (
                <div className="text-center py-12">
                  <div className="text-lg text-gray-600">Loading...</div>
                </div>
              ) : (
                <>
                  {/* Summary Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-blue-50 p-6 rounded-lg">
                      <h3 className="text-lg font-medium text-gray-900">Total Breakfast</h3>
                      <p className="text-3xl font-bold text-blue-600">{overallTotals.totalBreakfast}</p>
                    </div>
                    <div className="bg-green-50 p-6 rounded-lg">
                      <h3 className="text-lg font-medium text-gray-900">Total Lunch</h3>
                      <p className="text-3xl font-bold text-green-600">{overallTotals.totalLunch}</p>
                    </div>
                    <div className="bg-yellow-50 p-6 rounded-lg">
                      <h3 className="text-lg font-medium text-gray-900">Total Dinner</h3>
                      <p className="text-3xl font-bold text-yellow-600">{overallTotals.totalDinner}</p>
                    </div>
                    <div className="bg-purple-50 p-6 rounded-lg">
                      <h3 className="text-lg font-medium text-gray-900">Total Meals</h3>
                      <p className="text-3xl font-bold text-purple-600">
                        {overallTotals.totalMeals || overallTotals.totalBreakfast + overallTotals.totalLunch + overallTotals.totalDinner}
                      </p>
                    </div>
                  </div>

                  {/* Department Summary */}
                  {departmentSummary.length > 0 && (
                    <div className="bg-white shadow-sm rounded-lg overflow-hidden mb-8">
                      <div className="px-4 py-5 sm:px-6">
                        <h3 className="text-lg font-medium text-gray-900">Department Summary</h3>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Breakfast</th>
                              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Lunch</th>
                              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Dinner</th>
                              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {departmentSummary.map((dept, index) => (
                              <tr key={dept.department} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{dept.department}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">{dept.totalBreakfast || dept.breakfast || 0}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">{dept.totalLunch || dept.lunch || 0}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">{dept.totalDinner || dept.dinner || 0}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-900">
                                  {dept.totalMeals || dept.total || 0}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Guest Meals List */}
                  {guestMeals.length > 0 && (
                    <div className="bg-white shadow-sm rounded-lg overflow-hidden">
                      <div className="px-4 py-5 sm:px-6">
                        <h3 className="text-lg font-medium text-gray-900">Guest Meals List</h3>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
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
                            {guestMeals.map((meal, index) => (
                              <tr key={meal._id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {format(new Date(meal.date), 'MMM d, yyyy')}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{meal.department}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">{meal.breakfastCount || 0}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">{meal.lunchCount || 0}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">{meal.dinnerCount || 0}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {typeof meal.addedBy === 'string' ? 
                                    meal.addedBy : 
                                    meal.addedBy?.name ? 
                                      `${meal.addedBy.name} (${meal.addedBy.department})` : 
                                      'N/A'
                                  }
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                  <div className="flex justify-end space-x-2">
                                    <button
                                      onClick={() => handleEdit(meal)}
                                      className="text-indigo-600 hover:text-indigo-900 transition-colors p-1.5 hover:bg-indigo-50 rounded-full"
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
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </>
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