import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import ConfirmDialog from '../components/ConfirmDialog';

const AdminNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
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
    <div className="min-h-screen flex flex-col">
      <Navbar onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
      
      <div className="flex pt-[60px] min-h-screen">
        <Sidebar isOpen={isSidebarOpen} />
        
        <main className={`flex-1 bg-gray-100 transition-all duration-300 ease-in-out ${isSidebarOpen ? 'ml-64' : 'ml-0'}`}>
          <div className="p-6">
            <div className="max-w-7xl mx-auto">
              <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-semibold text-gray-900">Notifications</h1>
                {!showAddForm && (
                  <button
                    onClick={() => setShowAddForm(true)}
                    disabled={isLoading}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <PlusIcon className="h-5 w-5 mr-2" />
                    Add Notification
                  </button>
                )}
              </div>

              {error && (
                <div className="mb-4 rounded-md bg-red-50 p-3">
                  <div className="text-sm text-red-700">{error}</div>
                </div>
              )}

              {success && (
                <div className="mb-4 rounded-md bg-green-50 p-3">
                  <div className="text-sm text-green-700">{success}</div>
                </div>
              )}

              {showAddForm && (
                <div className="mb-8 bg-white shadow-sm rounded-lg p-8">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">
                    Add New Notification
                  </h2>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                      <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                        Title
                      </label>
                      <input
                        type="text"
                        id="title"
                        value={newNotification.title}
                        onChange={(e) => setNewNotification({ ...newNotification, title: e.target.value })}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        placeholder="Enter notification title"
                        disabled={isLoading}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                        Description
                      </label>
                      <textarea
                        id="description"
                        value={newNotification.description}
                        onChange={(e) => setNewNotification({ ...newNotification, description: e.target.value })}
                        rows={6}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        placeholder="Enter notification description"
                        disabled={isLoading}
                        required
                      />
                    </div>
                    <div className="flex justify-end space-x-4 pt-4">
                      <button
                        type="button"
                        onClick={() => {
                          setShowAddForm(false);
                          setNewNotification({ title: '', description: '' });
                        }}
                        disabled={isLoading}
                        className="px-6 py-2.5 border border-gray-300 rounded-lg text-base font-medium text-gray-700 hover:bg-gray-50 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="px-6 py-2.5 border border-transparent rounded-lg text-base font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
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
              )}

              <div className="bg-white shadow-sm rounded-md overflow-hidden">
                {isLoading && notifications.length === 0 ? (
                  <div className="p-6 text-center text-gray-500">Loading notifications...</div>
                ) : notifications.length === 0 ? (
                  <div className="p-6 text-center text-gray-500">No notifications found</div>
                ) : (
                  <ul className="divide-y divide-gray-200">
                    {notifications.map((notification) => (
                      <li key={notification._id} className="p-6 hover:bg-gray-50">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="text-base font-medium text-gray-900">{notification.title}</h3>
                            <p className="mt-1 text-sm text-gray-500">{notification.description}</p>
                            <p className="mt-2 text-xs text-gray-400">
                              Created: {format(new Date(notification.createdAt), 'MMM d, yyyy h:mm a')}
                            </p>
                          </div>
                          <button
                            onClick={() => setDeleteConfirm({ show: true, notificationId: notification._id })}
                            disabled={isLoading}
                            className="text-red-600 hover:text-red-900 transition-colors p-1.5 hover:bg-red-50 rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
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