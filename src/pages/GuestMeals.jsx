import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';

const GuestMeals = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [guestMeals, setGuestMeals] = useState([]);
  const [departmentSummary, setDepartmentSummary] = useState([]);
  const [overallTotals, setOverallTotals] = useState({
    totalBreakfast: 0,
    totalLunch: 0,
    totalDinner: 0,
    totalMeals: 0
  });

  const fetchGuestMeals = async () => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('adminToken');
      const url = `${import.meta.env.VITE_API_URL}/admin/guest-meals`;

      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setGuestMeals(response.data.guestMeals || []);
      setDepartmentSummary(response.data.departmentSummary || []);
      setOverallTotals(response.data.overallTotals || {
        totalBreakfast: 0,
        totalLunch: 0,
        totalDinner: 0,
        totalMeals: 0
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch guest meals');
      console.error('Error fetching guest meals:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGuestMeals();
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
      
      <div className="flex pt-[60px] min-h-screen">
        <Sidebar isOpen={isSidebarOpen} />
        
        <main className={`flex-1 bg-gray-100 transition-all duration-300 ease-in-out ${isSidebarOpen ? 'ml-64' : 'ml-0'}`}>
          <div className="p-6">
            <div className="max-w-7xl mx-auto">
              <h1 className="text-2xl font-semibold text-gray-900 mb-6">Guest Meals Management</h1>

              {error && (
                <div className="mb-4 rounded-md bg-red-50 p-3">
                  <div className="text-sm text-red-700">{error}</div>
                </div>
              )}

              {loading ? (
                <div className="text-center py-12">
                  <div className="text-lg text-gray-600">Loading...</div>
                </div>
              ) : (
                <>
                  {/* Summary Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-blue-50 p-6 rounded-lg">
                      <h3 className="text-lg font-medium text-gray-900">Total Breakfast</h3>
                      <p className="text-3xl font-bold text-blue-600">{overallTotals.totalBreakfast}</p>
                    </div>
                    <div className="bg-green-50 p-6 rounded-lg">
                      <h3 className="text-lg font-medium text-gray-900">Total Lunch</h3>
                      <p className="text-3xl font-bold text-green-600">{overallTotals.totalLunch}</p>
                    </div>
                    <div className="bg-yellow-50 p-6 rounded-lg">
                      <h3 className="text-lg font-medium text-gray-900">Total Dinner</h3>
                      <p className="text-3xl font-bold text-yellow-600">{overallTotals.totalDinner}</p>
                    </div>
                    <div className="bg-purple-50 p-6 rounded-lg">
                      <h3 className="text-lg font-medium text-gray-900">Total Meals</h3>
                      <p className="text-3xl font-bold text-purple-600">
                        {overallTotals.totalMeals || overallTotals.totalBreakfast + overallTotals.totalLunch + overallTotals.totalDinner}
                      </p>
                    </div>
                  </div>

                  {/* Department Summary */}
                  {departmentSummary.length > 0 && (
                    <div className="bg-white shadow-sm rounded-lg overflow-hidden mb-8">
                      <div className="px-4 py-5 sm:px-6">
                        <h3 className="text-lg font-medium text-gray-900">Department Summary</h3>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Breakfast</th>
                              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Lunch</th>
                              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Dinner</th>
                              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {departmentSummary.map((dept, index) => (
                              <tr key={dept.department} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{dept.department}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">{dept.totalBreakfast || dept.breakfast || 0}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">{dept.totalLunch || dept.lunch || 0}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">{dept.totalDinner || dept.dinner || 0}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-900">
                                  {dept.totalMeals || dept.total || 0}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Guest Meals List */}
                  {guestMeals.length > 0 && (
                    <div className="bg-white shadow-sm rounded-lg overflow-hidden">
                      <div className="px-4 py-5 sm:px-6">
                        <h3 className="text-lg font-medium text-gray-900">Guest Meals List</h3>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Breakfast</th>
                              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Lunch</th>
                              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Dinner</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Added By</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {guestMeals.map((meal, index) => (
                              <tr key={meal._id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {format(new Date(meal.date), 'MMM d, yyyy')}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{meal.department}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">{meal.breakfastCount || 0}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">{meal.lunchCount || 0}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">{meal.dinnerCount || 0}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {meal.addedBy?.name || 'N/A'} ({meal.addedBy?.department || 'N/A'})
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default GuestMeals; 