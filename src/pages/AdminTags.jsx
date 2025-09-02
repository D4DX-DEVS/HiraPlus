import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  MagnifyingGlassIcon,
  TagIcon,
  ChevronDownIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import ConfirmDialog from '../components/ConfirmDialog';
import { TableSkeleton } from '../components/SkeletonLoaders';

// Tag Form Component
const TagForm = ({ initialData, onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    tagName: initialData?.tagName || ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('adminToken');
      const endpoint = initialData 
        ? `${import.meta.env.VITE_API_URL}/tags/${initialData._id}`
        : `${import.meta.env.VITE_API_URL}/tags`;
      
      const method = initialData ? 'put' : 'post';

      await axios({
        method,
        url: endpoint,
        data: formData,
        headers: { Authorization: `Bearer ${token}` }
      });

      onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="flex min-h-screen items-end justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div 
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity backdrop-blur-sm" 
          aria-hidden="true"
          onClick={onCancel}
        ></div>

        {/* This element is to trick the browser into centering the modal contents. */}
        <span className="hidden sm:inline-block sm:h-screen sm:align-middle" aria-hidden="true">&#8203;</span>

        {/* Dialog panel */}
        <div className="relative inline-block transform overflow-hidden rounded-lg bg-white text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-md sm:align-middle">
          <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
            <div className="flex items-center mb-4">
              <TagIcon className="h-6 w-6 text-green-600 mr-2" />
              <h3 className="text-lg font-medium text-gray-900">
                {initialData ? 'Edit Tag' : 'Create New Tag'}
              </h3>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="rounded-md bg-red-50 p-3">
                  <div className="text-sm text-red-700">{error}</div>
                </div>
              )}
              
              <div>
                <label htmlFor="tagName" className="block text-sm font-medium text-gray-700 mb-1">
                  Tag Name
                </label>
                <input
                  type="text"
                  id="tagName"
                  name="tagName"
                  value={formData.tagName}
                  onChange={handleChange}
                  required
                  className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 text-sm"
                  placeholder="Enter tag name"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={onCancel}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-950 hover:bg-green-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  {loading ? 'Saving...' : (initialData ? 'Update' : 'Create')}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

// Skeleton Loading Component
const TagTableSkeleton = () => {
  const skeletonRows = Array.from({ length: 6 }, (_, i) => i);
  
  return (
    <>
      {skeletonRows.map((index) => (
        <tr key={index} className="border-b border-gray-200">
          <td className="px-2 py-1.5 whitespace-nowrap">
            <div className="flex items-center">
              <div className="w-7 h-7 bg-gray-300 rounded-full mr-2 flex-shrink-0 shimmer"></div>
              <div className="min-w-0">
                <div className="h-3 bg-gray-300 rounded w-20 shimmer"></div>
              </div>
            </div>
          </td>
          <td className="px-1 py-1.5 whitespace-nowrap">
            <div className="h-3 bg-gray-300 rounded w-16 shimmer"></div>
          </td>
          <td className="px-1 py-1.5 whitespace-nowrap text-center">
            <div className="flex justify-center space-x-1">
              <div className="w-6 h-6 bg-gray-300 rounded shimmer"></div>
              <div className="w-6 h-6 bg-gray-300 rounded shimmer"></div>
            </div>
          </td>
        </tr>
      ))}
    </>
  );
};

const AdminTags = () => {
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingTag, setEditingTag] = useState(null);
  const [error, setError] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    const saved = localStorage.getItem('sidebarOpen');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, tagId: null });
  const [searchQuery, setSearchQuery] = useState('');

  const fetchTags = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/tags`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTags(response.data || []);
    } catch (err) {
      setError('Failed to fetch tags');
      console.error('Fetch tags error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTags();
  }, []);

  const handleDelete = async (tagId) => {
    try {
      const token = localStorage.getItem('adminToken');
      await axios.delete(`${import.meta.env.VITE_API_URL}/tags/${tagId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchTags();
      setDeleteConfirm({ show: false, tagId: null });
    } catch (err) {
      setError('Failed to delete tag');
      console.error('Delete tag error:', err);
    }
  };

  const handleFormSuccess = () => {
    setShowAddForm(false);
    setEditingTag(null);
    fetchTags();
  };

  const handleFormCancel = () => {
    setShowAddForm(false);
    setEditingTag(null);
  };

  // Filter tags based on search query
  const filteredTags = tags.filter(tag =>
    tag.tagName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar 
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
      />
      
      <div className="flex">
        <Sidebar isOpen={isSidebarOpen} />
        
        <div className={`flex-1 transition-all duration-300 ${isSidebarOpen ? 'ml-64' : 'ml-16'}`}>
          <div className="pt-20 p-6">
            {/* Header */}
            <div className="mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                    <TagIcon className="h-8 w-8 text-green-600 mr-3" />
                    Tag Management
                  </h1>
                  <p className="text-gray-600 mt-1">Manage tags for user categorization</p>
                </div>
                <div className="flex items-center space-x-4">
                  {/* Search Bar */}
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      placeholder="Search tags..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="block w-64 pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                  <button
                    onClick={() => setShowAddForm(true)}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-950 hover:bg-green-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Add Tag
                  </button>
                </div>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-4 rounded-md bg-red-50 p-4">
                <div className="text-sm text-red-700">{error}</div>
              </div>
            )}

            {/* Tags Table */}
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Tags ({filteredTags.length})
                </h3>
                <p className="mt-1 max-w-2xl text-sm text-gray-500">
                  All available tags in the system
                </p>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tag
                      </th>
                      <th className="px-1 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Created
                      </th>
                      <th className="px-1 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {loading ? (
                      <TagTableSkeleton />
                    ) : filteredTags.length === 0 ? (
                      <tr>
                        <td colSpan="3" className="px-6 py-12 text-center text-sm text-gray-500">
                          {searchQuery ? 'No tags found matching your search.' : 'No tags found. Create your first tag!'}
                        </td>
                      </tr>
                    ) : (
                      filteredTags.map((tag) => (
                        <tr key={tag._id} className="hover:bg-gray-50">
                          <td className="px-2 py-1.5 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-7 w-7">
                                <div className="h-7 w-7 rounded-full bg-green-100 flex items-center justify-center">
                                  <TagIcon className="h-4 w-4 text-green-600" />
                                </div>
                              </div>
                              <div className="ml-2 min-w-0">
                                <div className="text-sm font-medium text-gray-900 truncate">
                                  {tag.tagName}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-1 py-1.5 whitespace-nowrap text-sm text-gray-500">
                            {format(new Date(tag.createdAt), 'MMM dd, yyyy')}
                          </td>
                          <td className="px-1 py-1.5 whitespace-nowrap text-center text-sm font-medium">
                            <div className="flex justify-center space-x-1">
                              <button
                                onClick={() => setEditingTag(tag)}
                                className="text-green-600 hover:text-green-900 p-1 rounded-md hover:bg-green-50"
                                title="Edit tag"
                              >
                                <PencilIcon className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => setDeleteConfirm({ show: true, tagId: tag._id })}
                                className="text-red-600 hover:text-red-900 p-1 rounded-md hover:bg-red-50"
                                title="Delete tag"
                              >
                                <TrashIcon className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tag Form Modal */}
      {(showAddForm || editingTag) && (
        <TagForm
          initialData={editingTag}
          onSuccess={handleFormSuccess}
          onCancel={handleFormCancel}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirm.show}
        onClose={() => setDeleteConfirm({ show: false, tagId: null })}
        onConfirm={() => handleDelete(deleteConfirm.tagId)}
        title="Delete Tag"
        message="Are you sure you want to delete this tag? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />
    </div>
  );
};

export default AdminTags;
