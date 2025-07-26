import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import { PlusIcon, TrashIcon, PencilIcon } from '@heroicons/react/24/outline';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import ConfirmDialog from '../components/ConfirmDialog';
import { BannerCardSkeleton } from '../components/SkeletonLoaders';

const AdminBanners = () => {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingBanner, setEditingBanner] = useState(null);
  const [error, setError] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    const saved = localStorage.getItem('sidebarOpen');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, bannerId: null });
  const [newBanner, setNewBanner] = useState({ title: '', bannerImage: null });
  const [editBanner, setEditBanner] = useState({ title: '', bannerImage: null });
  const [previewImage, setPreviewImage] = useState(null);
  const [editPreviewImage, setEditPreviewImage] = useState(null);

  const fetchBanners = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/banner`);
      setBanners(response.data);
    } catch (err) {
      setError('Failed to fetch banners');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  // Save sidebar state to localStorage
  useEffect(() => {
    localStorage.setItem('sidebarOpen', JSON.stringify(isSidebarOpen));
  }, [isSidebarOpen]);

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

  const handleEditImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setEditBanner({ ...editBanner, bannerImage: file });
      setEditPreviewImage(URL.createObjectURL(file));
    }
  };

  const handleEdit = (banner) => {
    setEditingBanner(banner);
    setEditBanner({ title: banner.title, bannerImage: null });
    setEditPreviewImage(null);
    setShowEditForm(true);
    setShowAddForm(false);
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

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('adminToken');
      const formData = new FormData();
      formData.append('title', editBanner.title);
      if (editBanner.bannerImage) {
        formData.append('bannerImage', editBanner.bannerImage);
      }

      await axios.put(`${import.meta.env.VITE_API_URL}/banner/${editingBanner._id}`, formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      setEditBanner({ title: '', bannerImage: null });
      setEditPreviewImage(null);
      setShowEditForm(false);
      setEditingBanner(null);
      fetchBanners();
    } catch (err) {
      setError('Failed to update banner');
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
                        Banners
                      </h1>
                      <div className="flex items-center space-x-3 text-xs">
                        <span className="flex items-center text-green-600">
                          <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5"></div>
                          {banners.length} Active Banners
                        </span>
                      </div>
                    </div>
                    {!showAddForm && !showEditForm && (
                      <button
                        onClick={() => setShowAddForm(true)}
                        className="inline-flex items-center px-3 py-1.5 bg-green-950 text-white font-medium rounded-lg hover:bg-green-900 focus:outline-none focus:ring-2 focus:ring-green-800 focus:ring-offset-2 transition-all duration-200 transform hover:scale-105 shadow-md hover:shadow-lg text-sm"
                      >
                        <PlusIcon className="h-4 w-4 mr-1.5" />
                        Add Banner
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
                    <div className="mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">Create New Banner</h3>
                      <p className="text-sm text-gray-600 mt-1">Upload promotional banners for the mobile app (use jpeg for faster loading)</p>
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

              {showEditForm && editingBanner && (
                <div className="mb-3">
                  <div className="bg-white rounded-xl shadow-lg border border-gray-200/50 p-4 lg:p-5">
                    <div className="mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">Edit Banner</h3>
                      <p className="text-sm text-gray-600 mt-1">Update banner information and image</p>
                    </div>
                    <form onSubmit={handleEditSubmit} className="space-y-6">
                      <div>
                        <label htmlFor="editTitle" className="block text-sm font-medium text-gray-700 mb-2">
                          Title
                        </label>
                        <input
                          type="text"
                          id="editTitle"
                          value={editBanner.title}
                          onChange={(e) => setEditBanner({ ...editBanner, title: e.target.value })}
                          className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                          placeholder="Enter banner title"
                          required
                        />
                      </div>
                      <div>
                        <label htmlFor="editBannerImage" className="block text-sm font-medium text-gray-700 mb-2">
                          Banner Image (optional - leave empty to keep current image)
                        </label>
                        <input
                          type="file"
                          id="editBannerImage"
                          accept="image/*"
                          onChange={handleEditImageChange}
                          className="block w-full text-sm text-gray-500
                            file:mr-4 file:py-3 file:px-4
                            file:rounded-lg file:border-0
                            file:text-sm file:font-semibold
                            file:bg-green-50 file:text-green-700
                            hover:file:bg-green-100 transition-all duration-200"
                        />
                        <div className="mt-4 flex gap-4">
                          <div>
                            <p className="text-sm text-gray-600 mb-2">Current Image:</p>
                            <img
                              src={editingBanner.bannerImage}
                              alt="Current"
                              className="h-40 w-auto object-contain rounded-lg border border-gray-200 shadow-sm"
                            />
                          </div>
                          {editPreviewImage && (
                            <div>
                              <p className="text-sm text-gray-600 mb-2">New Image Preview:</p>
                              <img
                                src={editPreviewImage}
                                alt="Preview"
                                className="h-40 w-auto object-contain rounded-lg border border-gray-200 shadow-sm"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row justify-end gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            setShowEditForm(false);
                            setEditBanner({ title: '', bannerImage: null });
                            setEditPreviewImage(null);
                            setEditingBanner(null);
                          }}
                          className="px-6 py-3 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300 transition-all duration-200"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-6 py-3 bg-green-950 text-white font-semibold rounded-lg hover:bg-green-900 focus:outline-none focus:ring-2 focus:ring-green-800 transition-all duration-200"
                        >
                          Update Banner
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* Banners List */}
              <div className="bg-white shadow-lg rounded-xl border border-gray-200/50 overflow-hidden flex-1 flex flex-col min-h-0">
                <div className="px-4 py-3 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200 flex-shrink-0">
                  <h3 className="text-base font-semibold text-gray-900">All Banners</h3>
                  <p className="text-xs text-gray-600 mt-0.5">
                    {banners.length} banner{banners.length !== 1 ? 's' : ''} found
                  </p>
                </div>
                <div className="flex-1 overflow-auto">
                  {loading ? (
                    <BannerCardSkeleton />
                  ) : banners.length === 0 ? (
                    <div className="p-8 text-center">
                      <div className="text-gray-400">
                        <svg className="w-10 h-10 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <p className="text-base font-medium text-gray-900 mb-1">No banners found</p>
                        <p className="text-sm text-gray-600">Create your first banner to get started</p>
                      </div>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-200">
                      {banners.map((banner) => (
                        <div key={banner._id} className="p-3 hover:bg-gray-50 transition-colors duration-150">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-3 flex-1 min-w-0">
                              <div className="w-16 h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                                <img
                                  src={banner.bannerImage}
                                  alt={banner.title}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="text-sm font-semibold text-gray-900 truncate" title={banner.title}>
                                  {banner.title}
                                </h3>
                                <p className="mt-1.5 text-xs text-gray-400">
                                  Created on {format(new Date(banner.createdAt), 'MMM d, yyyy h:mm a')}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleEdit(banner)}
                                className="text-blue-600 hover:text-blue-900 transition-colors p-1 hover:bg-blue-50 rounded flex-shrink-0"
                                title="Edit Banner"
                              >
                                <PencilIcon className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => setDeleteConfirm({ show: true, bannerId: banner._id })}
                                className="text-red-600 hover:text-red-900 transition-colors p-1 hover:bg-red-50 rounded flex-shrink-0"
                                title="Delete Banner"
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
        title="Delete Banner"
        message="Are you sure you want to delete this banner? This action cannot be undone."
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirm({ show: false, bannerId: null })}
      />
    </div>
  );
};

export default AdminBanners; 