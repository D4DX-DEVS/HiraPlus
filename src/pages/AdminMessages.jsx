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

  const handleSubmit = async (e) => {
    e.preventDefault();
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
    }
  };

  const handleSendMessage = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      await axios.post(
        `${import.meta.env.VITE_API_URL}/admin/messages/${sendConfirm.messageId}/send`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setSendConfirm({ show: false, messageId: null });
      fetchMessages();
    } catch (err) {
      setError('Failed to send message to users');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen flex flex-col">
      <Navbar onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
      
      <div className="flex-1 flex">
        <div className={`${isSidebarOpen ? 'w-64' : 'w-0'} transition-all duration-300 ease-in-out`}>
          <Sidebar isOpen={isSidebarOpen} />
        </div>
        
        <main className={`flex-1 overflow-y-auto bg-gray-100 p-6 transition-all duration-300 ease-in-out ${isSidebarOpen ? 'ml-0' : 'ml-0'}`}>
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-semibold text-gray-900">Messages</h1>
              {!showAddForm && (
                <button
                  onClick={() => setShowAddForm(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
                >
                  <PlusIcon className="h-5 w-5 mr-2" />
                  Add Message
                </button>
              )}
            </div>

            {error && (
              <div className="mb-4 rounded-md bg-red-50 p-3">
                <div className="text-sm text-red-700">{error}</div>
              </div>
            )}

            {showAddForm && (
              <div className="mb-8 bg-white shadow-sm rounded-lg p-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">
                  Add New Message
                </h2>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                      Title
                    </label>
                    <input
                      type="text"
                      id="title"
                      value={newMessage.title}
                      onChange={(e) => setNewMessage({ ...newMessage, title: e.target.value })}
                      className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-base py-2"
                      placeholder="Enter message title"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                      Description
                    </label>
                    <textarea
                      id="description"
                      value={newMessage.description}
                      onChange={(e) => setNewMessage({ ...newMessage, description: e.target.value })}
                      rows={6}
                      className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-base py-2"
                      placeholder="Enter message description"
                      required
                    />
                  </div>
                  <div className="flex justify-end space-x-4 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddForm(false);
                        setNewMessage({ title: '', description: '' });
                      }}
                      className="px-6 py-2.5 border border-gray-300 rounded-lg text-base font-medium text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2.5 border border-transparent rounded-lg text-base font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition-colors duration-200"
                    >
                      Create
                    </button>
                  </div>
                </form>
              </div>
            )}

            <div className="bg-white shadow-sm rounded-md overflow-hidden">
              <ul className="divide-y divide-gray-200">
                {messages.map((message) => (
                  <li key={message._id} className="p-6 hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-base font-medium text-gray-900">{message.title}</h3>
                        <p className="mt-1 text-sm text-gray-500">{message.description}</p>
                        <p className="mt-2 text-xs text-gray-400">
                          Created: {format(new Date(message.createdAt), 'MMM d, yyyy h:mm a')}
                          {message.sentToUsers && ' • Sent to users'}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        {!message.sentToUsers && (
                          <button
                            onClick={() => setSendConfirm({ show: true, messageId: message._id })}
                            className="text-indigo-600 hover:text-indigo-900 transition-colors p-1.5 hover:bg-indigo-50 rounded-full"
                            disabled={loading}
                          >
                            <PaperAirplaneIcon className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={() => setDeleteConfirm({ show: true, messageId: message._id })}
                          className="text-red-600 hover:text-red-900 transition-colors p-1.5 hover:bg-red-50 rounded-full"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </main>
      </div>

      <ConfirmDialog
        isOpen={deleteConfirm.show}
        title="Delete Message"
        message="Are you sure you want to delete this message? This action cannot be undone."
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirm({ show: false, messageId: null })}
      />

      <ConfirmDialog
        isOpen={sendConfirm.show}
        title="Send Message"
        message="Are you sure you want to send this message to all verified users via WhatsApp?"
        onConfirm={handleSendMessage}
        onCancel={() => setSendConfirm({ show: false, messageId: null })}
        confirmText="Send"
        confirmButtonClass="bg-indigo-600 hover:bg-indigo-700"
      />
    </div>
  );
};

export default AdminMessages; 