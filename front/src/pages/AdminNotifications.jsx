import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import ConfirmDialog from '../components/ConfirmDialog';
import { ListItemSkeleton } from '../components/SkeletonLoaders';

const AdminNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    const saved = localStorage.getItem('sidebarOpen');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, notificationId: null });
  const [newNotification, setNewNotification] = useState({ title: '', description: '' });

  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('adminToken');
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/admin/notifications`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(response.data);
      setError('');
    } catch (err) {
      setError('Failed to fetch notifications');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  // Save sidebar state to localStorage
  useEffect(() => {
    localStorage.setItem('sidebarOpen', JSON.stringify(isSidebarOpen));
  }, [isSidebarOpen]);

  const handleDelete = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('adminToken');
      await axios.delete(`${import.meta.env.VITE_API_URL}/admin/notifications/${deleteConfirm.notificationId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDeleteConfirm({ show: false, notificationId: null });
      setSuccess('Notification deleted successfully');
      fetchNotifications();
    } catch (err) {
      setError('Failed to delete notification');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      setError('');
      const token = localStorage.getItem('adminToken');
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/admin/notifications`, newNotification, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Check if there was a push notification error
      if (response.data.pushError) {
        setError(`Notification saved but ${response.data.message}`);
      } else {
        setSuccess('Notification created and sent successfully');
      }

      setNewNotification({ title: '', description: '' });
      setShowAddForm(false);
      fetchNotifications();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create notification');
    } finally {
      setIsLoading(false);
    }
  };

  // Clear success message after 5 seconds
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        setSuccess('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

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
                        Notifications
                      </h1>
                      <div className="flex items-center space-x-3 text-xs">
                        <span className="flex items-center text-green-600">
                          <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5"></div>
                          {notifications.length} Notifications
                        </span>
                      </div>
                    </div>
                    {!showAddForm && (
                      <button
                        onClick={() => setShowAddForm(true)}
                        disabled={isLoading}
                        className="inline-flex items-center px-3 py-1.5 bg-green-950 text-white font-medium rounded-lg hover:bg-green-900 focus:outline-none focus:ring-2 focus:ring-green-800 focus:ring-offset-2 transition-all duration-200 transform hover:scale-105 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                      >
                        <PlusIcon className="h-4 w-4 mr-1.5" />
                        Add Notification
                      </button>
                    )}
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

              {success && (
                <div className="mb-3 bg-gradient-to-r from-green-50 to-green-100 border border-green-200 rounded-xl p-3 flex-shrink-0">
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                    <div className="text-sm text-green-700 font-medium">{success}</div>
                  </div>
                </div>
              )}

              {showAddForm && (
                <div className="mb-3">
                  <div className="bg-white rounded-xl shadow-lg border border-gray-200/50 p-4 lg:p-5">
                    <div className="mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">Create New Notification</h3>
                      <p className="text-sm text-gray-600 mt-1">Send push notifications to all registered users</p>
                    </div>
                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div>
                        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                          Title
                        </label>
                        <input
                          type="text"
                          id="title"
                          value={newNotification.title}
                          onChange={(e) => setNewNotification({ ...newNotification, title: e.target.value })}
                          className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                          placeholder="Enter notification title"
                          disabled={isLoading}
                          required
                        />
                      </div>
                      <div>
                        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                          Description
                        </label>
                        <textarea
                          id="description"
                          value={newNotification.description}
                          onChange={(e) => setNewNotification({ ...newNotification, description: e.target.value })}
                          rows={5}
                          className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                          placeholder="Enter notification description"
                          disabled={isLoading}
                          required
                        />
                      </div>
                      <div className="flex flex-col sm:flex-row justify-end gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            setShowAddForm(false);
                            setNewNotification({ title: '', description: '' });
                          }}
                          disabled={isLoading}
                          className="px-6 py-3 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={isLoading}
                          className="px-6 py-3 bg-green-950 text-white font-semibold rounded-lg hover:bg-green-900 focus:outline-none focus:ring-2 focus:ring-green-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                        >
                          {isLoading ? (
                            <>
                              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Sending...
                            </>
                          ) : 'Create & Send'}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* Notifications List */}
              <div className="bg-white shadow-lg rounded-xl border border-gray-200/50 overflow-hidden flex-1 flex flex-col min-h-0">
                <div className="px-4 py-3 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200 flex-shrink-0">
                  <h3 className="text-base font-semibold text-gray-900">All Notifications</h3>
                  <p className="text-xs text-gray-600 mt-0.5">
                    {notifications.length} notification{notifications.length !== 1 ? 's' : ''} found
                  </p>
                </div>
                <div className="flex-1 overflow-auto">
                  {isLoading && notifications.length === 0 ? (
                    <ListItemSkeleton items={6} />
                  ) : notifications.length === 0 ? (
                    <div className="p-8 text-center">
                      <div className="text-gray-400">
                        <svg className="w-10 h-10 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 17h5l-5 5v-5zM15 17H9a4 4 0 01-4-4V8a4 4 0 014-4h6a4 4 0 014 4v5" />
                        </svg>
                        <p className="text-base font-medium text-gray-900 mb-1">No notifications found</p>
                        <p className="text-sm text-gray-600">Create your first notification to get started.</p>
                      </div>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-200">
                      {notifications.map((notification, index) => (
                        <div key={notification._id} className="p-3 hover:bg-gray-50 transition-colors duration-150">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-3 flex-1 min-w-0">
                              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-800 rounded-full flex items-center justify-center text-white text-xs font-medium flex-shrink-0 mt-0.5">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M10 2L13 9h7l-5.5 4 2 7L10 15l-6.5 5 2-7L1 9h7l3-7z"/>
                                </svg>
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="text-sm font-semibold text-gray-900 truncate" title={notification.title}>
                                  {notification.title}
                                </h3>
                                <p className="mt-1 text-xs text-gray-600 line-clamp-2" title={notification.description}>
                                  {notification.description}
                                </p>
                                <p className="mt-1.5 text-xs text-gray-400">
                                  {format(new Date(notification.createdAt), 'MMM d, yyyy h:mm a')}
                                </p>
                              </div>
                            </div>
                            <button
                              onClick={() => setDeleteConfirm({ show: true, notificationId: notification._id })}
                              disabled={isLoading}
                              className="text-red-600 hover:text-red-900 transition-colors p-1 hover:bg-red-50 rounded flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Delete Notification"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
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

      <ConfirmDialog
        isOpen={deleteConfirm.show}
        title="Delete Notification"
        message="Are you sure you want to delete this notification? This action cannot be undone."
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirm({ show: false, notificationId: null })}
        isLoading={isLoading}
      />
    </div>
  );
};

export default AdminNotifications; 