import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import UserForm from '../components/UserForm';
import ConfirmDialog from '../components/ConfirmDialog';
import { MagnifyingGlassIcon, TrashIcon, PencilIcon } from '@heroicons/react/24/outline';

// Skeleton Loading Component
const DriverTableSkeleton = () => {
  const skeletonRows = Array.from({ length: 6 }, (_, i) => i);
  
  return (
    <>
      {skeletonRows.map((index) => (
        <tr key={index} className="border-b border-gray-200">
          {/* Name column with avatar */}
          <td className="px-2 py-1.5 whitespace-nowrap">
            <div className="flex items-center">
              <div className="w-7 h-7 bg-gray-300 rounded-full mr-2 flex-shrink-0 shimmer"></div>
              <div className="min-w-0">
                <div className="h-3 bg-gray-300 rounded w-20 shimmer"></div>
              </div>
            </div>
          </td>
          {/* Phone */}
          <td className="px-1 py-1.5 whitespace-nowrap">
            <div className="h-3 bg-gray-300 rounded w-16 shimmer"></div>
          </td>
          {/* Department */}
          <td className="px-1 py-1.5 whitespace-nowrap">
            <div className="h-3 bg-gray-300 rounded w-14 shimmer"></div>
          </td>
          {/* Position */}
          <td className="px-1 py-1.5 whitespace-nowrap">
            <div className="h-3 bg-gray-300 rounded w-16 shimmer"></div>
          </td>
          {/* Status */}
          <td className="px-1 py-1.5 whitespace-nowrap">
            <div className="h-5 bg-gray-300 rounded-full w-8 shimmer"></div>
          </td>
          {/* Driver Status */}
          <td className="px-1 py-1.5 whitespace-nowrap">
            <div className="h-5 bg-gray-300 rounded-full w-6 shimmer"></div>
          </td>
          {/* Actions */}
          <td className="px-1 py-1.5 whitespace-nowrap">
            <div className="flex justify-center items-center space-x-2">
              <div className="w-6 h-6 bg-gray-300 rounded-md shimmer"></div>
              <div className="w-6 h-6 bg-gray-300 rounded-md shimmer"></div>
            </div>
          </td>
        </tr>
      ))}
    </>
  );
};

const AdminDrivers = () => {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    const saved = localStorage.getItem('sidebarOpen');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [departments, setDepartments] = useState([]);
  const [editingDriver, setEditingDriver] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, driverId: null });

  const fetchDepartments = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/auth/departments`);
      setDepartments(response.data.departments || []);
    } catch (err) {
      console.error('Failed to fetch departments:', err);
    }
  };

  const fetchDrivers = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/admin/drivers`);
      setDrivers(response.data);
    } catch (err) {
      console.error('Fetch error:', err.response?.data);
      setError('Failed to fetch drivers');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      await axios.delete(`${import.meta.env.VITE_API_URL}/admin/users/${deleteConfirm.driverId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDeleteConfirm({ show: false, driverId: null });
      fetchDrivers();
    } catch (err) {
      setError('Failed to delete driver');
    }
  };

  useEffect(() => {
    fetchDrivers();
    fetchDepartments();
  }, []);

  // Save sidebar state to localStorage
  useEffect(() => {
    localStorage.setItem('sidebarOpen', JSON.stringify(isSidebarOpen));
  }, [isSidebarOpen]);

  // Filter and sort drivers based on search query and selected department
  const filteredDrivers = drivers.filter(driver => {
    const departmentName = typeof driver.department === 'string' ? driver.department : driver.department?.title || '';
    const matchesSearch = searchQuery.trim() === '' || 
      driver.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      driver.phoneNumber?.includes(searchQuery) ||
      departmentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      driver.designation?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesDepartment = selectedDepartment === '' || departmentName === selectedDepartment;

    return matchesSearch && matchesDepartment;
  }).sort((a, b) => {
    // Sort by department name first, then by name within department
    const deptA = typeof a.department === 'string' ? a.department : a.department?.title || '';
    const deptB = typeof b.department === 'string' ? b.department : b.department?.title || '';
    
    if (deptA !== deptB) {
      return deptA.localeCompare(deptB);
    }
    
    // If same department, sort by name
    return (a.name || '').localeCompare(b.name || '');
  });

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
                        Driver Management
                      </h1>
                      <div className="flex items-center space-x-3 text-xs">
                        <span className="flex items-center text-blue-600">
                          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-1.5"></div>
                          {filteredDrivers.length} Drivers
                        </span>
                        <span className="flex items-center text-green-600">
                          <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5"></div>
                          {filteredDrivers.filter(d => d.status === 'active').length} Active
                        </span>
                        <span className="flex items-center text-gray-600">
                          <div className="w-1.5 h-1.5 bg-gray-500 rounded-full mr-1.5"></div>
                          {filteredDrivers.filter(d => d.status === 'inactive').length} Inactive
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Search and Filter Section */}
              <div className="mb-2 flex-shrink-0">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200/50 p-2">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
                    {/* Search Box */}
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search by name, phone, department, or designation..."
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-all duration-200"
                      />
                    </div>

                    {/* Department Filter */}
                    <div>
                      <select
                        value={selectedDepartment}
                        onChange={(e) => setSelectedDepartment(e.target.value)}
                        className="block w-full px-3 py-2 text-sm border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded-lg bg-white transition-all duration-200"
                      >
                        <option value="">All Departments</option>
                        {departments.map(dept => (
                          <option key={typeof dept === 'string' ? dept : dept._id} value={typeof dept === 'string' ? dept : dept.title}>
                            {typeof dept === 'string' ? dept : dept.title}
                          </option>
                        ))}
                      </select>
                    </div>
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

              {editingDriver && (
                <div className="mb-3 bg-white shadow-lg rounded-xl border border-gray-200/50 p-4 lg:p-5 flex-shrink-0 max-w-4xl mx-auto">
                  <div className="mb-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-lg font-semibold text-gray-900">Edit Driver</h2>
                        <p className="text-sm text-gray-600 mt-1">Update driver information and settings</p>
                      </div>
                      <button
                        onClick={() => setEditingDriver(null)}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                        title="Close"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  <UserForm
                    initialData={editingDriver}
                    onSuccess={() => {
                      setEditingDriver(null);
                      fetchDrivers();
                    }}
                    onCancel={() => setEditingDriver(null)}
                  />
                </div>
              )}

              {/* Drivers Table */}
              <div className="bg-white shadow-lg rounded-xl border border-gray-200/50 overflow-hidden flex-1 flex flex-col min-h-0">
                <div className="flex-1 overflow-auto">
                  <table className="w-full divide-y divide-gray-200 table-fixed">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-2 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider" style={{width: '22%'}}>
                          Name
                        </th>
                        <th className="px-1 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider" style={{width: '13%'}}>
                          Phone
                        </th>
                        <th className="px-1 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider" style={{width: '18%'}}>
                          Department
                        </th>
                        <th className="px-1 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider" style={{width: '18%'}}>
                          Position
                        </th>
                        <th className="px-1 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider" style={{width: '9%'}}>
                          Status
                        </th>
                        <th className="px-1 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider" style={{width: '9%'}}>
                          Driver
                        </th>
                        <th className="px-10 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider" style={{width: '11%'}}>
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {loading ? (
                        <DriverTableSkeleton />
                      ) : filteredDrivers.length === 0 ? (
                        <tr>
                          <td colSpan="7" className="px-6 py-8 text-center">
                            <div className="text-gray-400">
                              <svg className="w-10 h-10 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                              </svg>
                              <p className="text-base font-medium text-gray-900 mb-1">No drivers found</p>
                              <p className="text-sm text-gray-600">Try adjusting your search criteria or check if drivers are properly assigned.</p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        filteredDrivers.map((driver) => (
                          <tr key={driver._id} className="hover:bg-gray-200 transition-colors duration-150">
                            <td className="px-2 py-1.5 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="w-7 h-7 bg-gradient-to-br from-blue-600 to-blue-800 rounded-full flex items-center justify-center text-white text-xs font-medium mr-2 flex-shrink-0">
                                  {driver.name?.charAt(0).toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                  <div className="text-xs font-medium text-gray-900 truncate" title={driver.name}>{driver.name}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-1 py-1.5 whitespace-nowrap text-xs text-gray-900">
                              <div className="truncate" title={driver.phoneNumber}>{driver.phoneNumber}</div>
                            </td>
                            <td className="px-1 py-1.5 whitespace-nowrap text-xs text-gray-900">
                              <div className="truncate" title={typeof driver.department === 'string' ? driver.department : driver.department?.title || 'N/A'}>
                                {typeof driver.department === 'string' ? driver.department : driver.department?.title || 'N/A'}
                              </div>
                            </td>
                            <td className="px-1 py-1.5 whitespace-nowrap text-xs text-gray-900">
                              <div className="truncate" title={driver.designation}>{driver.designation}</div>
                            </td>
                            <td className="px-1 py-1.5 whitespace-nowrap">
                              <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${
                                driver.status === 'active'
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {driver.status === 'active' ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                            <td className="px-1 py-1.5 whitespace-nowrap">
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                🚗 Driver
                              </span>
                            </td>
                            <td className="px-1 py-1.5 whitespace-nowrap">
                              <div className="flex justify-center items-center space-x-2">
                                <button
                                  onClick={() => setEditingDriver(driver)}
                                  className="text-blue-600 hover:text-blue-900 transition-colors p-1 hover:bg-blue-50 rounded-md"
                                  title="Edit Driver"
                                >
                                  <PencilIcon className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => setDeleteConfirm({ show: true, driverId: driver._id })}
                                  className="text-red-600 hover:text-red-900 transition-colors p-1 hover:bg-red-50 rounded-md"
                                  title="Delete Driver"
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
        </main>
      </div>

      <ConfirmDialog
        isOpen={deleteConfirm.show}
        title="Delete Driver"
        message="Are you sure you want to delete this driver? This action cannot be undone."
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirm({ show: false, driverId: null })}
      />
    </div>
  );
};

export default AdminDrivers; 