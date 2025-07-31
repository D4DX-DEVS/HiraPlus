import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon,
  MagnifyingGlassIcon,
  TruckIcon
} from '@heroicons/react/24/outline';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import ConfirmDialog from '../components/ConfirmDialog';
import { GridSkeleton } from '../components/SkeletonLoaders';

const AdminVehicles = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    const saved = localStorage.getItem('sidebarOpen');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [formData, setFormData] = useState({
    vehicleName: '',
    vehicleNumber: ''
  });
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, vehicleId: null });

  const fetchVehicles = async () => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('adminToken');
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/admin/vehicles`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setVehicles(response.data.vehicles || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch vehicles');
      console.error('Error fetching vehicles:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.vehicleName.trim() || !formData.vehicleNumber.trim()) {
      setError('Vehicle name and number are required');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('adminToken');
      
      if (editingVehicle) {
        // Update vehicle
        const response = await axios.put(
          `${import.meta.env.VITE_API_URL}/admin/vehicles/${editingVehicle._id}`,
          formData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        setVehicles(prev => prev.map(vehicle => 
          vehicle._id === editingVehicle._id ? response.data.vehicle : vehicle
        ));
      } else {
        // Add new vehicle
        const response = await axios.post(
          `${import.meta.env.VITE_API_URL}/admin/vehicles`,
          formData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        setVehicles(prev => [response.data.vehicle, ...prev]);
      }

      setShowModal(false);
      setFormData({ vehicleName: '', vehicleNumber: '' });
      setEditingVehicle(null);
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Failed to save vehicle');
      console.error('Error saving vehicle:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (vehicle) => {
    setEditingVehicle(vehicle);
    setFormData({
      vehicleName: vehicle.vehicleName,
      vehicleNumber: vehicle.vehicleNumber
    });
    setShowModal(true);
    setError('');
  };

  const handleDelete = async (vehicleId) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      
      await axios.delete(`${import.meta.env.VITE_API_URL}/admin/vehicles/${vehicleId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setVehicles(prev => prev.filter(vehicle => vehicle._id !== vehicleId));
      setDeleteConfirm({ show: false, vehicleId: null });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete vehicle');
      console.error('Error deleting vehicle:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredVehicles = vehicles.filter(vehicle =>
    vehicle.vehicleName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    vehicle.vehicleNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    fetchVehicles();
  }, []);

  // Save sidebar state to localStorage
  useEffect(() => {
    localStorage.setItem('sidebarOpen', JSON.stringify(isSidebarOpen));
  }, [isSidebarOpen]);

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
                        Vehicle Management
                      </h1>
                      <div className="flex items-center space-x-3 text-xs">
                        <span className="flex items-center text-green-600">
                          <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5"></div>
                          {filteredVehicles.length} Vehicle{filteredVehicles.length !== 1 ? 's' : ''}
                        </span>
                        <span className="flex items-center text-blue-600">
                          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-1.5"></div>
                          {filteredVehicles.length} Total
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setEditingVehicle(null);
                        setFormData({ vehicleName: '', vehicleNumber: '' });
                        setShowModal(true);
                        setError('');
                      }}
                      className="inline-flex items-center px-3 py-1.5 bg-green-950 text-white font-medium rounded-lg hover:bg-green-900 focus:outline-none focus:ring-2 focus:ring-green-800 focus:ring-offset-2 transition-all duration-200 transform hover:scale-105 shadow-md hover:shadow-lg text-sm"
                    >
                      <PlusIcon className="h-4 w-4 mr-1.5" />
                      Add Vehicle
                    </button>
                  </div>
                </div>
              </div>

              {/* Search Section */}
              <div className="mb-3">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200/50 p-2">
                  <div className="relative max-w-md">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search vehicles..."
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm transition-all duration-200"
                    />
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

              {/* Add/Edit Form */}
              {showModal && (
                <div className="mb-3 bg-white shadow-lg rounded-xl border border-gray-200/50 p-4 lg:p-5 flex-shrink-0 max-w-2xl mx-auto">
                  <div className="mb-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-lg font-semibold text-gray-900">
                          {editingVehicle ? 'Edit Vehicle' : 'Add Vehicle'}
                        </h2>
                        <p className="text-sm text-gray-600 mt-1">
                          {editingVehicle ? 'Update vehicle information' : 'Create a new vehicle'}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setShowModal(false);
                          setEditingVehicle(null);
                          setFormData({ vehicleName: '', vehicleNumber: '' });
                          setError('');
                        }}
                        className="text-gray-400 hover:text-gray-600 text-xl font-semibold"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                  
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Vehicle Name
                      </label>
                      <input
                        type="text"
                        value={formData.vehicleName}
                        onChange={(e) => setFormData(prev => ({ ...prev, vehicleName: e.target.value }))}
                        placeholder="Enter vehicle name"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
                        maxLength={100}
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Vehicle Number
                      </label>
                      <input
                        type="text"
                        value={formData.vehicleNumber}
                        onChange={(e) => setFormData(prev => ({ ...prev, vehicleNumber: e.target.value.toUpperCase() }))}
                        placeholder="Enter vehicle number (e.g., KL-01-1234)"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm font-mono"
                        maxLength={20}
                        pattern="[A-Z0-9-]{1,20}"
                        required
                      />
                      <p className="text-xs text-gray-500 mt-1">Use uppercase letters, numbers, and hyphens only</p>
                    </div>
                    
                    <div className="flex justify-end space-x-3 pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setShowModal(false);
                          setEditingVehicle(null);
                          setFormData({ vehicleName: '', vehicleNumber: '' });
                          setError('');
                        }}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={loading}
                        className="px-4 py-2 text-sm font-medium text-white bg-green-950 border border-transparent rounded-lg hover:bg-green-900 focus:outline-none focus:ring-2 focus:ring-green-800 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {loading ? 'Saving...' : (editingVehicle ? 'Update Vehicle' : 'Add Vehicle')}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Vehicles Table */}
              <div className="flex-1 bg-white rounded-lg shadow-sm border border-gray-200/50 overflow-hidden">
                <div className="h-full overflow-auto">
                  {loading && !showModal ? (
                    <div className="min-w-full">
                      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 sticky top-0 z-10">
                        <div className="grid grid-cols-12 gap-4 items-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          <div className="col-span-4">Vehicle Name</div>
                          <div className="col-span-3">Vehicle Number</div>
                          <div className="col-span-3">Created Date</div>
                          <div className="col-span-2 text-center">Actions</div>
                        </div>
                      </div>
                      <GridSkeleton />
                    </div>
                  ) : (
                    <div className="min-w-full">
                      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 sticky top-0 z-10">
                        <div className="grid grid-cols-12 gap-4 items-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          <div className="col-span-4">Vehicle Name</div>
                          <div className="col-span-3">Vehicle Number</div>
                          <div className="col-span-3">Created Date</div>
                          <div className="col-span-2 text-center">Actions</div>
                        </div>
                      </div>

                      <div className="divide-y divide-gray-200">
                        {filteredVehicles.length === 0 ? (
                          <div className="px-4 py-8 text-center text-gray-500">
                            <TruckIcon className="mx-auto h-12 w-12 text-gray-400 mb-3" />
                            <p className="text-sm">No vehicles found</p>
                            {searchQuery && (
                              <p className="text-xs text-gray-400 mt-1">
                                Try adjusting your search criteria
                              </p>
                            )}
                          </div>
                        ) : (
                          filteredVehicles.map((vehicle) => (
                            <div key={vehicle._id} className="px-4 py-3 hover:bg-gray-50 transition-colors">
                              <div className="grid grid-cols-12 gap-4 items-center text-sm">
                                <div className="col-span-4">
                                  <div className="font-medium text-gray-900">{vehicle.vehicleName}</div>
                                </div>
                                <div className="col-span-3">
                                  <span className="font-mono text-gray-700 bg-gray-100 px-2 py-1 rounded text-xs">
                                    {vehicle.vehicleNumber}
                                  </span>
                                </div>
                                <div className="col-span-3 text-gray-500">
                                  {format(new Date(vehicle.createdAt), 'MMM dd, yyyy')}
                                </div>
                                <div className="col-span-2 flex justify-center space-x-2">
                                  <button
                                    onClick={() => handleEdit(vehicle)}
                                    className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                                    title="Edit vehicle"
                                  >
                                    <PencilIcon className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={() => setDeleteConfirm({ show: true, vehicleId: vehicle._id })}
                                    className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                                    title="Delete vehicle"
                                  >
                                    <TrashIcon className="h-4 w-4" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
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
        onCancel={() => setDeleteConfirm({ show: false, vehicleId: null })}
        onConfirm={() => handleDelete(deleteConfirm.vehicleId)}
        title="Delete Vehicle"
        message="Are you sure you want to delete this vehicle? This action cannot be undone."
      />
    </div>
  );
};

export default AdminVehicles;