import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import ConfirmDialog from '../components/ConfirmDialog';

const AdminBanners = () => {
  const [banners, setBanners] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [error, setError] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, bannerId: null });
  const [newBanner, setNewBanner] = useState({ title: '', bannerImage: null });
  const [previewImage, setPreviewImage] = useState(null);

  const fetchBanners = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/banner`);
      setBanners(response.data);
    } catch (err) {
      setError('Failed to fetch banners');
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  const handleDelete = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      await axios.delete(`${import.meta.env.VITE_API_URL}/banner/${deleteConfirm.bannerId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDeleteConfirm({ show: false, bannerId: null });
      fetchBanners();
    } catch (err) {
      setError('Failed to delete banner');
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setNewBanner({ ...newBanner, bannerImage: file });
      setPreviewImage(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('adminToken');
      const formData = new FormData();
      formData.append('title', newBanner.title);
      formData.append('bannerImage', newBanner.bannerImage);

      await axios.post(`${import.meta.env.VITE_API_URL}/banner`, formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      setNewBanner({ title: '', bannerImage: null });
      setPreviewImage(null);
      setShowAddForm(false);
      fetchBanners();
    } catch (err) {
      setError('Failed to create banner');
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
                        Banners
                      </h1>
                      <p className="text-gray-600 text-lg">
                        Manage promotional banners displayed in the mobile app
                      </p>
                      <div className="flex items-center mt-3 space-x-4 text-sm">
                        <span className="flex items-center text-green-600">
                          <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                          {banners.length} Active Banners
                        </span>
                      </div>
                    </div>
                    {!showAddForm && (
                      <button
                        onClick={() => setShowAddForm(true)}
                        className="inline-flex items-center px-6 py-3 bg-green-950 text-white font-semibold rounded-xl hover:bg-green-900 focus:outline-none focus:ring-2 focus:ring-green-800 focus:ring-offset-2 transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
                      >
                        <PlusIcon className="h-5 w-5 mr-2" />
                        Add Banner
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
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold text-gray-900">Create New Banner</h3>
                      <p className="text-sm text-gray-600 mt-1">Upload promotional banners for the mobile app</p>
                    </div>
                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div>
                        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                          Title
                        </label>
                        <input
                          type="text"
                          id="title"
                          value={newBanner.title}
                          onChange={(e) => setNewBanner({ ...newBanner, title: e.target.value })}
                          className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                          placeholder="Enter banner title"
                          required
                        />
                      </div>
                      <div>
                        <label htmlFor="bannerImage" className="block text-sm font-medium text-gray-700 mb-2">
                          Banner Image
                        </label>
                        <input
                          type="file"
                          id="bannerImage"
                          accept="image/*"
                          onChange={handleImageChange}
                          className="block w-full text-sm text-gray-500
                            file:mr-4 file:py-3 file:px-4
                            file:rounded-lg file:border-0
                            file:text-sm file:font-semibold
                            file:bg-green-50 file:text-green-700
                            hover:file:bg-green-100 transition-all duration-200"
                          required
                        />
                        {previewImage && (
                          <div className="mt-4">
                            <p className="text-sm text-gray-600 mb-2">Preview:</p>
                            <img
                              src={previewImage}
                              alt="Preview"
                              className="h-40 w-auto object-contain rounded-lg border border-gray-200 shadow-sm"
                            />
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col sm:flex-row justify-end gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            setShowAddForm(false);
                            setNewBanner({ title: '', bannerImage: null });
                            setPreviewImage(null);
                          }}
                          className="px-6 py-3 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300 transition-all duration-200"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-6 py-3 bg-green-950 text-white font-semibold rounded-lg hover:bg-green-900 focus:outline-none focus:ring-2 focus:ring-green-800 transition-all duration-200"
                        >
                          Create Banner
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* Banners List */}
              <div className="bg-white shadow-lg rounded-xl border border-gray-200/50 overflow-hidden">
                <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">All Banners</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Manage promotional banners for the mobile application
                  </p>
                </div>
                <div className="divide-y divide-gray-200">
                  {banners.length === 0 ? (
                    <div className="p-8 text-center">
                      <div className="text-gray-400 text-lg mb-2">No banners found</div>
                      <p className="text-gray-500 text-sm">Create your first banner to get started</p>
                    </div>
                  ) : (
                    banners.map((banner) => (
                      <div key={banner._id} className="p-6 hover:bg-gray-50 transition-colors duration-150">
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                          <div className="flex items-center space-x-4 flex-1">
                            <img
                              src={banner.bannerImage}
                              alt={banner.title}
                              className="h-20 w-32 object-cover rounded-lg border border-gray-200 shadow-sm"
                            />
                            <div className="flex-1">
                              <h3 className="text-lg font-semibold text-gray-900 mb-1">{banner.title}</h3>
                              <div className="flex items-center text-xs text-gray-500">
                                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mr-2"></div>
                                Created on {format(new Date(banner.createdAt), 'MMM d, yyyy h:mm a')}
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() => setDeleteConfirm({ show: true, bannerId: banner._id })}
                            className="inline-flex items-center px-4 py-2 bg-red-100 text-red-700 font-medium rounded-lg hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-500 transition-all duration-200"
                          >
                            <TrashIcon className="h-4 w-4 mr-2" />
                            Delete
                          </button>
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
        title="Delete Banner"
        message="Are you sure you want to delete this banner? This action cannot be undone."
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirm({ show: false, bannerId: null })}
      />
    </div>
  );
};

export default AdminBanners; 