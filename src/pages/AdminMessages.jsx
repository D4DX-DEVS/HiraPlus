import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import { PlusIcon, TrashIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import ConfirmDialog from '../components/ConfirmDialog';

const AdminMessages = () => {
  const [messages, setMessages] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [error, setError] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, messageId: null });
  const [sendConfirm, setSendConfirm] = useState({ show: false, messageId: null });
  const [newMessage, setNewMessage] = useState({ title: '', description: '' });
  const [loading, setLoading] = useState(false);

  const fetchMessages = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/admin/messages`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessages(response.data);
    } catch (err) {
      setError('Failed to fetch messages');
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

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
    setLoading(true);
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
      setLoading(false);
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
          <div className="h-full pt-[64px] px-4 lg:px-6 pb-4 lg:pb-6">
            <div className="max-w-7xl mx-auto h-full flex flex-col">
              {/* Header Section */}
              <div className="mb-4 flex-shrink-0">
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200/50 p-6 lg:p-8">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div>
                      <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
                        Messages
                      </h1>
                      <p className="text-gray-600 text-lg">
                        Create and manage announcements for all users
                      </p>
                      <div className="flex items-center mt-3 space-x-4 text-sm">
                        <span className="flex items-center text-green-600">
                          <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                          {messages.length} Messages
                        </span>
                      </div>
                    </div>
                    {!showAddForm && (
                      <button
                        onClick={() => setShowAddForm(true)}
                        className="inline-flex items-center px-6 py-3 bg-green-950 text-white font-semibold rounded-xl hover:bg-green-900 focus:outline-none focus:ring-2 focus:ring-green-800 focus:ring-offset-2 transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
                      >
                        <PlusIcon className="h-5 w-5 mr-2" />
                        Add Message
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {error && (
                <div className="mb-6 bg-gradient-to-r from-red-50 to-red-100 border border-red-200 rounded-xl p-4">
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-red-500 rounded-full mr-3"></div>
                    <div className="text-sm text-red-700 font-medium">{error}</div>
                  </div>
                </div>
              )}

              {showAddForm && (
                <div className="mb-6">
                  <div className="bg-white rounded-xl shadow-lg border border-gray-200/50 p-6">
                    <div className="mb-4">
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
                          disabled={loading}
                          className="px-6 py-3 bg-green-950 text-white font-semibold rounded-lg hover:bg-green-900 focus:outline-none focus:ring-2 focus:ring-green-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {loading ? 'Saving...' : 'Save Message'}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* Messages List */}
              <div className="bg-white shadow-lg rounded-xl border border-gray-200/50 overflow-hidden">
                <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">All Messages</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Manage and send announcements to users
                  </p>
                </div>
                <div className="divide-y divide-gray-200">
                  {messages.length === 0 ? (
                    <div className="p-8 text-center">
                      <div className="text-gray-400 text-lg mb-2">No messages found</div>
                      <p className="text-gray-500 text-sm">Create your first message to get started</p>
                    </div>
                  ) : (
                    messages.map((message) => (
                      <div key={message._id} className="p-6 hover:bg-gray-50 transition-colors duration-150">
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">{message.title}</h3>
                            <p className="text-gray-600 mb-3 line-clamp-2">{message.description}</p>
                            <div className="flex items-center text-xs text-gray-500">
                              <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mr-2"></div>
                              Created on {format(new Date(message.createdAt), 'MMM d, yyyy')}
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => setSendConfirm({ show: true, messageId: message._id })}
                              className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-700 font-medium rounded-lg hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                            >
                              <PaperAirplaneIcon className="h-4 w-4 mr-2" />
                              Send
                            </button>
                            <button
                              onClick={() => setDeleteConfirm({ show: true, messageId: message._id })}
                              className="inline-flex items-center px-4 py-2 bg-red-100 text-red-700 font-medium rounded-lg hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-500 transition-all duration-200"
                            >
                              <TrashIcon className="h-4 w-4 mr-2" />
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
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