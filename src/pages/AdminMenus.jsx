import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { format, addDays } from 'date-fns';
import { 
  PencilIcon, 
  TrashIcon, 
  PlusIcon,
  CalendarIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import ConfirmDialog from '../components/ConfirmDialog';
import { TableSkeleton } from '../components/SkeletonLoaders';

const AdminMenus = () => {
  const [menus, setMenus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    const saved = localStorage.getItem('sidebarOpen');
    return saved !== null ? JSON.parse(saved) : true;
  });

  // Modal states
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [editingMenu, setEditingMenu] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, menuId: null, date: null });

  // Form state
  const [menuForm, setMenuForm] = useState({
    date: format(addDays(new Date(), 1), 'yyyy-MM-dd'), // Default to tomorrow
    breakfast: '',
    lunch: '',
    dinner: ''
  });

  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchMenus();
  }, []);

  // Save sidebar state to localStorage
  useEffect(() => {
    localStorage.setItem('sidebarOpen', JSON.stringify(isSidebarOpen));
  }, [isSidebarOpen]);

  const fetchMenus = async () => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('adminToken');
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/admin/menu/all`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMenus(response.data.menus || []);
    } catch (error) {
      console.error('Error fetching menus:', error);
      if (error.response?.status === 404) {
        setMenus([]);
      } else {
        setError(error.response?.data?.message || 'Failed to fetch menus');
      }
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const errors = {};
    
    if (!menuForm.date) {
      errors.date = 'Date is required';
    }
    
    if (!menuForm.breakfast.trim()) {
      errors.breakfast = 'Breakfast menu is required';
    }
    
    if (!menuForm.lunch.trim()) {
      errors.lunch = 'Lunch menu is required';
    }
    
    if (!menuForm.dinner.trim()) {
      errors.dinner = 'Dinner menu is required';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      const token = localStorage.getItem('adminToken');
      
      const payload = {
        date: menuForm.date,
        breakfast: menuForm.breakfast.trim(),
        lunch: menuForm.lunch.trim(),
        dinner: menuForm.dinner.trim()
      };

      if (editingMenu) {
        // Update existing menu
        await axios.put(`${import.meta.env.VITE_API_URL}/admin/menu/date`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setSuccessMessage('Menu updated successfully!');
      } else {
        // Create new menu
        await axios.post(`${import.meta.env.VITE_API_URL}/admin/menu/date`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setSuccessMessage('Menu added successfully!');
      }
      
      resetForm();
      fetchMenus();
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error saving menu:', error);
      setError(error.response?.data?.message || 'Failed to save menu');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (menu) => {
    setEditingMenu(menu);
    setMenuForm({
      date: format(new Date(menu.date), 'yyyy-MM-dd'),
      breakfast: menu.breakfast,
      lunch: menu.lunch,
      dinner: menu.dinner
    });
    setShowAddMenu(true);
  };

  const handleDelete = async () => {
    try {
      setError('');
      const token = localStorage.getItem('adminToken');
      await axios.delete(`${import.meta.env.VITE_API_URL}/admin/menu/date`, {
        headers: { Authorization: `Bearer ${token}` },
        data: { date: deleteConfirm.date }
      });
      
      setSuccessMessage('Menu deleted successfully!');
      fetchMenus();
      setDeleteConfirm({ show: false, menuId: null, date: null });
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error deleting menu:', error);
      setError(error.response?.data?.message || 'Failed to delete menu');
      setDeleteConfirm({ show: false, menuId: null, date: null });
    }
  };

  const resetForm = () => {
    setMenuForm({
      date: format(addDays(new Date(), 1), 'yyyy-MM-dd'),
      breakfast: '',
      lunch: '',
      dinner: ''
    });
    setFormErrors({});
    setEditingMenu(null);
    setShowAddMenu(false);
  };

  const formatDate = (dateString) => {
    return format(new Date(dateString), 'EEEE, MMM dd, yyyy');
  };

  const isToday = (dateString) => {
    return format(new Date(dateString), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
  };

  const isPast = (dateString) => {
    return new Date(dateString) < new Date(new Date().setHours(0, 0, 0, 0));
  };

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
                        Menu Management
                      </h1>
                      <div className="flex items-center space-x-3 text-xs">
                        <span className="flex items-center text-green-600">
                          <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5"></div>
                          {menus.length} Total Menus
                        </span>
                        <span className="flex items-center text-blue-600">
                          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-1.5"></div>
                          Manage daily meal menus
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setShowAddMenu(true)}
                        className="inline-flex items-center px-3 py-1.5 bg-green-950 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 transform hover:scale-105 shadow-md hover:shadow-lg text-sm"
                      >
                        <PlusIcon className="h-4 w-4 mr-1.5" />
                        Add Menu
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Success/Error Messages */}
              {successMessage && (
                <div className="mb-3 bg-gradient-to-r from-green-50 to-green-100 border border-green-200 rounded-xl p-3 flex-shrink-0">
                  <div className="flex items-center">
                    <CheckCircleIcon className="w-5 h-5 text-green-600 mr-3" />
                    <div className="text-sm text-green-700 font-medium">{successMessage}</div>
                  </div>
                </div>
              )}

              {error && (
                <div className="mb-3 bg-gradient-to-r from-red-50 to-red-100 border border-red-200 rounded-xl p-3 flex-shrink-0">
                  <div className="flex items-center">
                    <XCircleIcon className="w-5 h-5 text-red-600 mr-3" />
                    <div className="text-sm text-red-700 font-medium">{error}</div>
                  </div>
                </div>
              )}

              {/* Add Menu Modal */}
              {showAddMenu && (
                <div className="mb-3 bg-white shadow-lg rounded-xl border border-gray-200/50 p-4 lg:p-5 flex-shrink-0 max-w-2xl mx-auto">
                  <div className="mb-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-lg font-semibold text-gray-900">
                          {editingMenu ? 'Edit Menu' : 'Add New Menu'}
                        </h2>
                        <p className="text-sm text-gray-600 mt-1">
                          {editingMenu ? 'Update the menu details' : 'Create a new menu for a specific date'}
                        </p>
                      </div>
                      <button
                        onClick={resetForm}
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
                    {/* Date */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Date
                      </label>
                      <input
                        type="date"
                        value={menuForm.date}
                        onChange={(e) => setMenuForm({ ...menuForm, date: e.target.value })}
                        className={`w-full px-3 py-2.5 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                          formErrors.date ? 'border-red-500' : 'border-gray-300'
                        }`}
                        disabled={submitting}
                        required
                      />
                      {formErrors.date && (
                        <p className="text-red-500 text-xs mt-1">{formErrors.date}</p>
                      )}
                    </div>

                    {/* Breakfast */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Breakfast Menu
                      </label>
                      <textarea
                        value={menuForm.breakfast}
                        onChange={(e) => setMenuForm({ ...menuForm, breakfast: e.target.value })}
                        placeholder="e.g., Paratha, Dal, Sabzi, Pickle"
                        rows={2}
                        className={`w-full px-3 py-2.5 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none transition-colors ${
                          formErrors.breakfast ? 'border-red-500' : 'border-gray-300'
                        }`}
                        disabled={submitting}
                        required
                      />
                      {formErrors.breakfast && (
                        <p className="text-red-500 text-xs mt-1">{formErrors.breakfast}</p>
                      )}
                    </div>

                    {/* Lunch */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Lunch Menu
                      </label>
                      <textarea
                        value={menuForm.lunch}
                        onChange={(e) => setMenuForm({ ...menuForm, lunch: e.target.value })}
                        placeholder="e.g., Rice, Dal, Sabzi, Roti, Salad"
                        rows={2}
                        className={`w-full px-3 py-2.5 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none transition-colors ${
                          formErrors.lunch ? 'border-red-500' : 'border-gray-300'
                        }`}
                        disabled={submitting}
                        required
                      />
                      {formErrors.lunch && (
                        <p className="text-red-500 text-xs mt-1">{formErrors.lunch}</p>
                      )}
                    </div>

                    {/* Dinner */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Dinner Menu
                      </label>
                      <textarea
                        value={menuForm.dinner}
                        onChange={(e) => setMenuForm({ ...menuForm, dinner: e.target.value })}
                        placeholder="e.g., Rice, Dal, Sabzi, Roti, Papad"
                        rows={2}
                        className={`w-full px-3 py-2.5 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none transition-colors ${
                          formErrors.dinner ? 'border-red-500' : 'border-gray-300'
                        }`}
                        disabled={submitting}
                        required
                      />
                      {formErrors.dinner && (
                        <p className="text-red-500 text-xs mt-1">{formErrors.dinner}</p>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                      <button
                        type="button"
                        onClick={resetForm}
                        disabled={submitting}
                        className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={submitting}
                        className="px-6 py-2.5 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {submitting ? 'Saving...' : editingMenu ? 'Update Menu' : 'Add Menu'}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Menus Grid */}
              <div className="bg-white shadow-lg rounded-xl border border-gray-200/50 overflow-hidden flex-1 flex flex-col min-h-0">
                <div className="px-4 py-3 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200 flex-shrink-0">
                  <h3 className="text-base font-semibold text-gray-900">Daily Menu Records</h3>
                  <p className="text-xs text-gray-600 mt-0.5">
                    Manage daily meal menus for your mess
                  </p>
                </div>
                <div className="flex-1 overflow-auto p-4">
                  {loading ? (
                    <TableSkeleton />
                  ) : menus.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="text-gray-400">
                        <CalendarIcon className="w-10 h-10 mx-auto mb-3 opacity-50" />
                        <p className="text-base font-medium text-gray-900 mb-1">No menus found</p>
                        <p className="text-sm text-gray-600 mb-4">Get started by adding your first menu</p>
                        <button
                          onClick={() => setShowAddMenu(true)}
                          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          <PlusIcon className="w-4 h-4 mr-2" />
                          Add Menu
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {menus.map((menu) => (
                        <div
                          key={menu.id}
                          className={`bg-white rounded-lg border transition-all duration-200 hover:shadow-md hover:scale-[1.02] ${
                            isToday(menu.date) 
                              ? 'border-green-500 ring-2 ring-green-200' 
                              : isPast(menu.date)
                              ? 'border-gray-300'
                              : 'border-blue-300'
                          }`}
                        >
                          <div className="p-4">
                            {/* Date Header */}
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center space-x-2">
                                <CalendarIcon className="w-4 h-4 text-gray-500" />
                                <h3 className="text-sm font-semibold text-gray-900">
                                  {format(new Date(menu.date), 'MMM dd, yyyy')}
                                </h3>
                              </div>
                              
                              {isToday(menu.date) && (
                                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                                  Today
                                </span>
                              )}
                            </div>

                            {/* Day Name */}
                            <div className="mb-3">
                              <span className="text-xs font-medium text-green-600 bg-blue-50 px-2 py-1 rounded-full">
                                {menu.day.charAt(0).toUpperCase() + menu.day.slice(1)}
                              </span>
                            </div>

                            {/* Meals */}
                            <div className="space-y-2 mb-4">
                              <div>
                                <h4 className="font-medium text-gray-900 text-xs mb-1">Breakfast</h4>
                                <p className="text-gray-600 text-xs truncate" title={menu.breakfast}>
                                  {menu.breakfast}
                                </p>
                              </div>
                              
                              <div>
                                <h4 className="font-medium text-gray-900 text-xs mb-1">Lunch</h4>
                                <p className="text-gray-600 text-xs truncate" title={menu.lunch}>
                                  {menu.lunch}
                                </p>
                              </div>
                              
                              <div>
                                <h4 className="font-medium text-gray-900 text-xs mb-1">Dinner</h4>
                                <p className="text-gray-600 text-xs truncate" title={menu.dinner}>
                                  {menu.dinner}
                                </p>
                              </div>
                            </div>

                            {/* Footer */}
                            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                              <div className="flex items-center text-xs text-gray-500">
                                <ClockIcon className="w-3 h-3 mr-1" />
                                {menu.addedBy}
                              </div>
                              
                              <div className="flex items-center space-x-1">
                                <button
                                  onClick={() => handleEdit(menu)}
                                  className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                  title="Edit menu"
                                >
                                  <PencilIcon className="w-3.5 h-3.5" />
                                </button>
                                
                                <button
                                  onClick={() => setDeleteConfirm({ 
                                    show: true, 
                                    menuId: menu.id, 
                                    date: format(new Date(menu.date), 'yyyy-MM-dd')
                                  })}
                                  className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                                  title="Delete menu"
                                >
                                  <TrashIcon className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirm.show}
        onClose={() => setDeleteConfirm({ show: false, menuId: null, date: null })}
        onConfirm={handleDelete}
        title="Delete Menu"
        message="Are you sure you want to delete this menu? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />
    </div>
  );
};

export default AdminMenus; 