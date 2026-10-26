import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import { PlusIcon, TrashIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import ConfirmDialog from '../components/ConfirmDialog';
import { ListItemSkeleton } from '../components/SkeletonLoaders';

const AdminMessages = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [error, setError] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    const saved = localStorage.getItem('sidebarOpen');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, messageId: null });
  const [sendConfirm, setSendConfirm] = useState({ show: false, messageId: null });
  const [newMessage, setNewMessage] = useState({ title: '', description: '' });
  const [formLoading, setFormLoading] = useState(false);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/admin/messages`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessages(response.data);
    } catch (err) {
      setError('Failed to fetch messages');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  // Save sidebar state to localStorage
  useEffect(() => {
    localStorage.setItem('sidebarOpen', JSON.stringify(isSidebarOpen));
  }, [isSidebarOpen]);

  const handleDelete = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      await axios.delete(`${import.meta.env.VITE_API_URL}/admin/messages/${deleteConfirm.messageId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDeleteConfirm({ show: false, messageId: null });
      fetchMessages();
    } catch (err) {
      setError('Failed to delete message');
    }
  };

  const handleSend = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      await axios.post(
        `${import.meta.env.VITE_API_URL}/admin/messages/${sendConfirm.messageId}/send`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSendConfirm({ show: false, messageId: null });
      fetchMessages();
    } catch (err) {
      setError('Failed to send message');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      await axios.post(`${import.meta.env.VITE_API_URL}/admin/messages`, newMessage, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNewMessage({ title: '', description: '' });
      setShowAddForm(false);
      fetchMessages();
    } catch (err) {
      setError('Failed to create message');
    } finally {
      setFormLoading(false);
    }
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
                        Messages
                      </h1>
                      <div className="flex items-center space-x-3 text-xs">
                        <span className="flex items-center text-green-600">
                          <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5"></div>
                          {messages.length} Messages
                        </span>
                      </div>
                    </div>
                    {!showAddForm && (
                      <button
                        onClick={() => setShowAddForm(true)}
                        className="inline-flex items-center px-3 py-1.5 bg-green-950 text-white font-medium rounded-lg hover:bg-green-900 focus:outline-none focus:ring-2 focus:ring-green-800 focus:ring-offset-2 transition-all duration-200 transform hover:scale-105 shadow-md hover:shadow-lg text-sm"
                      >
                        <PlusIcon className="h-4 w-4 mr-1.5" />
                        Add Message
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

              {showAddForm && (
                <div className="mb-3">
                  <div className="bg-white rounded-xl shadow-lg border border-gray-200/50 p-4 lg:p-5">
                    <div className="mb-3">
                      <h3 className="text-lg font-semibold text-gray-900">Create New Message</h3>
                      <p className="text-sm text-gray-600 mt-1">Compose a new announcement for all users</p>
                    </div>
                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div>
                        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                          Title
                        </label>
                        <input
                          type="text"
                          id="title"
                          name="title"
                          value={newMessage.title}
                          onChange={(e) => setNewMessage({ ...newMessage, title: e.target.value })}
                          required
                          className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                          placeholder="Enter message title"
                        />
                      </div>
                      <div>
                        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                          Description
                        </label>
                        <textarea
                          id="description"
                          name="description"
                          rows={5}
                          value={newMessage.description}
                          onChange={(e) => setNewMessage({ ...newMessage, description: e.target.value })}
                          required
                          className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                          placeholder="Enter message description"
                        />
                      </div>
                      <div className="flex flex-col sm:flex-row justify-end gap-3">
                        <button
                          type="button"
                          onClick={() => setShowAddForm(false)}
                          className="px-6 py-3 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300 transition-all duration-200"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={formLoading}
                          className="px-6 py-3 bg-green-950 text-white font-semibold rounded-lg hover:bg-green-900 focus:outline-none focus:ring-2 focus:ring-green-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {formLoading ? 'Saving...' : 'Save Message'}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* Messages List */}
              <div className="bg-white shadow-lg rounded-xl border border-gray-200/50 overflow-hidden flex-1 flex flex-col min-h-0">
                <div className="px-4 py-3 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200 flex-shrink-0">
                  <h3 className="text-base font-semibold text-gray-900">All Messages</h3>
                  <p className="text-xs text-gray-600 mt-0.5">
                    {messages.length} message{messages.length !== 1 ? 's' : ''} found
                  </p>
                </div>
                <div className="flex-1 overflow-auto">
                  {loading ? (
                    <ListItemSkeleton items={6} />
                  ) : messages.length === 0 ? (
                    <div className="p-8 text-center">
                      <div className="text-gray-400">
                        <svg className="w-10 h-10 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        <p className="text-base font-medium text-gray-900 mb-1">No messages found</p>
                        <p className="text-sm text-gray-600">Create your first message to get started</p>
                      </div>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-200">
                      {messages.map((message) => (
                        <div key={message._id} className="p-3 hover:bg-gray-50 transition-colors duration-150">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-3 flex-1 min-w-0">
                              <div className="w-8 h-8 bg-gradient-to-br from-green-600 to-green-800 rounded-full flex items-center justify-center text-white text-xs font-medium flex-shrink-0 mt-0.5">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                                </svg>
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="text-sm font-semibold text-gray-900 truncate" title={message.title}>
                                  {message.title}
                                </h3>
                                <p className="mt-1 text-xs text-gray-600 line-clamp-2" title={message.description}>
                                  {message.description}
                                </p>
                                <p className="mt-1.5 text-xs text-gray-400">
                                  Created on {format(new Date(message.createdAt), 'MMM d, yyyy')}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <button
                                onClick={() => setSendConfirm({ show: true, messageId: message._id })}
                                className="inline-flex items-center px-2 py-1.5 bg-blue-100 text-blue-700 text-xs font-medium rounded hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                                title="Send Message"
                              >
                                <PaperAirplaneIcon className="h-3 w-3 mr-1" />
                                Send
                              </button>
                              <button
                                onClick={() => setDeleteConfirm({ show: true, messageId: message._id })}
                                className="text-red-600 hover:text-red-900 transition-colors p-1 hover:bg-red-50 rounded"
                                title="Delete Message"
                              >
                                <TrashIcon className="h-4 w-4" />
                              </button>
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

      <ConfirmDialog
        isOpen={deleteConfirm.show}
        title="Confirm Delete"
        message="Are you sure you want to delete this message? This action cannot be undone."
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirm({ show: false, messageId: null })}
      />

      <ConfirmDialog
        isOpen={sendConfirm.show}
        title="Confirm Send"
        message="Are you sure you want to send this message to all users?"
        onConfirm={handleSend}
        onCancel={() => setSendConfirm({ show: false, messageId: null })}
      />
    </div>
  );
};

export default AdminMessages; 