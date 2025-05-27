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
    <div className="min-h-screen flex flex-col">
      <Navbar onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
      
      <div className="flex pt-[60px] min-h-screen">
        <Sidebar isOpen={isSidebarOpen} />
        
        <main className={`flex-1 bg-gray-100 transition-all duration-300 ease-in-out ${isSidebarOpen ? 'ml-64' : 'ml-0'}`}>
          <div className="p-6">
            <div className="max-w-7xl mx-auto">
              <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-semibold text-gray-900">Banners</h1>
                {!showAddForm && (
                  <button
                    onClick={() => setShowAddForm(true)}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
                  >
                    <PlusIcon className="h-5 w-5 mr-2" />
                    Add Banner
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
                    Add New Banner
                  </h2>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                      <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                        Title
                      </label>
                      <input
                        type="text"
                        id="title"
                        value={newBanner.title}
                        onChange={(e) => setNewBanner({ ...newBanner, title: e.target.value })}
                        className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-base py-2"
                        placeholder="Enter banner title"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="bannerImage" className="block text-sm font-medium text-gray-700">
                        Banner Image
                      </label>
                      <input
                        type="file"
                        id="bannerImage"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="mt-1 block w-full text-sm text-gray-500
                          file:mr-4 file:py-2 file:px-4
                          file:rounded-md file:border-0
                          file:text-sm file:font-semibold
                          file:bg-indigo-50 file:text-indigo-700
                          hover:file:bg-indigo-100"
                        required
                      />
                      {previewImage && (
                        <div className="mt-2">
                          <img
                            src={previewImage}
                            alt="Preview"
                            className="h-32 w-auto object-contain rounded-lg"
                          />
                        </div>
                      )}
                    </div>
                    <div className="flex justify-end space-x-4 pt-4">
                      <button
                        type="button"
                        onClick={() => {
                          setShowAddForm(false);
                          setNewBanner({ title: '', bannerImage: null });
                          setPreviewImage(null);
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
                  {banners.map((banner) => (
                    <li key={banner._id} className="p-6 hover:bg-gray-50">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-4">
                            <img
                              src={banner.bannerImage}
                              alt={banner.title}
                              className="h-24 w-auto object-contain rounded-lg"
                            />
                            <div>
                              <h3 className="text-base font-medium text-gray-900">{banner.title}</h3>
                              <p className="mt-2 text-xs text-gray-400">
                                Created: {format(new Date(banner.createdAt), 'MMM d, yyyy h:mm a')}
                              </p>
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => setDeleteConfirm({ show: true, bannerId: banner._id })}
                          className="text-red-600 hover:text-red-900 transition-colors p-1.5 hover:bg-red-50 rounded-full"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
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