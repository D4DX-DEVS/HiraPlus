import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { PDFDownloadLink, Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';

// Define styles for PDF
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 40,
  },
  header: {
    fontSize: 24,
    marginBottom: 30,
    textAlign: 'center',
    fontWeight: 'bold',
    color: '#333',
  },
  section: {
    margin: 15,
    padding: 15,
  },
  table: {
    display: 'table',
    width: 'auto',
    marginVertical: 20,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    borderBottomStyle: 'solid',
    alignItems: 'center',
    minHeight: 35,
    paddingVertical: 8,
  },
  tableHeader: {
    backgroundColor: '#F3F4F6',
    borderBottomWidth: 2,
    borderBottomColor: '#D1D5DB',
  },
  tableCell: {
    flex: 1,
    fontSize: 11,
    padding: 8,
    textAlign: 'left',
  },
  tableCellRight: {
    flex: 1,
    fontSize: 11,
    padding: 8,
    textAlign: 'right',
  },
  summaryCard: {
    marginVertical: 15,
    padding: 15,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#374151',
  },
  summaryValue: {
    fontSize: 14,
    color: '#4B5563',
  },
  dateRange: {
    fontSize: 14,
    marginBottom: 20,
    color: '#4B5563',
    textAlign: 'center',
  },
  ratesInfo: {
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 8,
    textAlign: 'center',
  },
  mealCount: {
    fontSize: 10,
    color: '#6B7280',
    marginTop: 2,
  },
});

// PDF Document Component
const BillPDF = ({ billData, dateRange, mealRates, departmentShare, totalAmount, departmentPayable, employeePayable }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <Text style={styles.header}>Monthly Mess Bill Report</Text>
      
      <View style={styles.section}>
        <Text style={styles.dateRange}>
          Billing Period: {format(new Date(dateRange.startDate), 'MMMM d, yyyy')} to {format(new Date(dateRange.endDate), 'MMMM d, yyyy')}
        </Text>

        <Text style={styles.ratesInfo}>
          Meal Rates: Breakfast {String(mealRates.breakfast)} | Lunch {String(mealRates.lunch)} | Dinner {String(mealRates.dinner)}
        </Text>
        <Text style={styles.ratesInfo}>
          Department Share: {String(departmentShare)}%
        </Text>
      </View>

      {/* Summary Section */}
      <View style={[styles.section, { flexDirection: 'row', justifyContent: 'space-between' }]}>
        <View style={[styles.summaryCard, { flex: 1, marginRight: 10 }]}>
          <Text style={styles.summaryTitle}>Total Amount</Text>
          <Text style={styles.summaryValue}>{String(Math.round(totalAmount))}</Text>
        </View>
        <View style={[styles.summaryCard, { flex: 1, marginHorizontal: 10 }]}>
          <Text style={styles.summaryTitle}>Department Share</Text>
          <Text style={styles.summaryValue}>{String(Math.round(departmentPayable))}</Text>
        </View>
        <View style={[styles.summaryCard, { flex: 1, marginLeft: 10 }]}>
          <Text style={styles.summaryTitle}>Employee Payable</Text>
          <Text style={styles.summaryValue}>{String(Math.round(employeePayable))}</Text>
        </View>
      </View>

      {/* Bills Table */}
      <View style={styles.section}>
        <View style={styles.table}>
          {/* Table Header */}
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Text style={[styles.tableCell, { flex: 2 }]}>Name</Text>
            <Text style={[styles.tableCell, { flex: 1.5 }]}>Department</Text>
            <Text style={[styles.tableCellRight, { flex: 1 }]}>Breakfast</Text>
            <Text style={[styles.tableCellRight, { flex: 1 }]}>Lunch</Text>
            <Text style={[styles.tableCellRight, { flex: 1 }]}>Dinner</Text>
            <Text style={[styles.tableCellRight, { flex: 1.2 }]}>Total</Text>
            <Text style={[styles.tableCellRight, { flex: 1.2 }]}>Dept. Share</Text>
            <Text style={[styles.tableCellRight, { flex: 1.2 }]}>Emp. Pay</Text>
          </View>

          {/* Table Body */}
          {billData.users.map((user, index) => {
            const breakfastAmount = user.mealCounts.breakfast * mealRates.breakfast;
            const lunchAmount = user.mealCounts.lunch * mealRates.lunch;
            const dinnerAmount = user.mealCounts.dinner * mealRates.dinner;
            const totalMealAmount = breakfastAmount + lunchAmount + dinnerAmount;
            const deptShare = (totalMealAmount * departmentShare) / 100;
            const empShare = totalMealAmount - deptShare;

            return (
              <View key={user.userId} style={[styles.tableRow, { backgroundColor: index % 2 === 0 ? '#FFFFFF' : '#F9FAFB' }]}>
                <Text style={[styles.tableCell, { flex: 2 }]}>{user.name}</Text>
                <Text style={[styles.tableCell, { flex: 1.5 }]}>{user.department}</Text>
                <View style={[styles.tableCellRight, { flex: 1 }]}>
                  <Text>{String(Math.round(breakfastAmount))}</Text>
                  {user.mealCounts.breakfast > 0 && (
                    <Text style={styles.mealCount}>{String(user.mealCounts.breakfast)} meals</Text>
                  )}
                </View>
                <View style={[styles.tableCellRight, { flex: 1 }]}>
                  <Text>{String(Math.round(lunchAmount))}</Text>
                  {user.mealCounts.lunch > 0 && (
                    <Text style={styles.mealCount}>{String(user.mealCounts.lunch)} meals</Text>
                  )}
                </View>
                <View style={[styles.tableCellRight, { flex: 1 }]}>
                  <Text>{String(Math.round(dinnerAmount))}</Text>
                  {user.mealCounts.dinner > 0 && (
                    <Text style={styles.mealCount}>{String(user.mealCounts.dinner)} meals</Text>
                  )}
                </View>
                <Text style={[styles.tableCellRight, { flex: 1.2 }]}>{String(Math.round(totalMealAmount))}</Text>
                <Text style={[styles.tableCellRight, { flex: 1.2, color: '#059669' }]}>{String(Math.round(deptShare))}</Text>
                <Text style={[styles.tableCellRight, { flex: 1.2, color: '#DC2626' }]}>{String(Math.round(empShare))}</Text>
              </View>
            );
          })}
        </View>
      </View>
    </Page>
  </Document>
);

const BillGenerator = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });
  const [mealRates, setMealRates] = useState({
    breakfast: 30,
    lunch: 60,
    dinner: 20
  });
  const [departmentShare, setDepartmentShare] = useState(80);
  const [billData, setBillData] = useState(null);
  const [totalAmount, setTotalAmount] = useState(0);
  const [employeePayable, setEmployeePayable] = useState(0);
  const [departmentPayable, setDepartmentPayable] = useState(0);

  const handleDateChange = (e) => {
    setDateRange({
      ...dateRange,
      [e.target.name]: e.target.value
    });
  };

  const handleMealRateChange = (e) => {
    setMealRates({
      ...mealRates,
      [e.target.name]: parseFloat(e.target.value) || 0
    });
  };

  const calculateBills = async () => {
    if (!dateRange.startDate || !dateRange.endDate) {
      setError('Please select both start and end dates');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/admin/meal-counts`,
        {
          params: {
            startDate: dateRange.startDate,
            endDate: dateRange.endDate
          },
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      const { overallTotals, users } = response.data;

      // Calculate total amount
      const total = (
        overallTotals.breakfast * mealRates.breakfast +
        overallTotals.lunch * mealRates.lunch +
        overallTotals.dinner * mealRates.dinner
      );

      // Calculate department and employee shares
      const deptShare = (total * departmentShare) / 100;
      const empShare = total - deptShare;

      setTotalAmount(total);
      setDepartmentPayable(deptShare);
      setEmployeePayable(empShare);
      setBillData(response.data);
    } catch (err) {
      setError('Failed to fetch meal data');
      console.error(err);
    } finally {
      setLoading(false);
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
              <h1 className="text-2xl font-semibold text-gray-900 mb-6">Monthly Mess Bill Generator</h1>

              {error && (
                <div className="mb-4 rounded-md bg-red-50 p-3">
                  <div className="text-sm text-red-700">{error}</div>
                </div>
              )}

              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-blue-50 p-6 rounded-lg">
                  <h3 className="text-lg font-medium text-gray-900">Total Amount</h3>
                  <p className="text-3xl font-bold text-blue-600">₹{totalAmount}</p>
                </div>
                <div className="bg-green-50 p-6 rounded-lg">
                  <h3 className="text-lg font-medium text-gray-900">Department Share</h3>
                  <p className="text-3xl font-bold text-green-600">₹{departmentPayable}</p>
                </div>
                <div className="bg-red-50 p-6 rounded-lg">
                  <h3 className="text-lg font-medium text-gray-900">Employee Payable</h3>
                  <p className="text-3xl font-bold text-red-600">₹{employeePayable}</p>
                </div>
              </div>

              <div className="bg-white shadow-sm rounded-lg p-6 mb-8">
                {/* Billing Period */}
                <div className="mb-8">
                  <h2 className="text-lg font-medium text-gray-900 mb-4">Billing Period</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">From Date</label>
                      <input
                        type="date"
                        name="startDate"
                        value={dateRange.startDate}
                        onChange={handleDateChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">To Date</label>
                      <input
                        type="date"
                        name="endDate"
                        value={dateRange.endDate}
                        onChange={handleDateChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Meal Rates */}
                <div className="mb-8">
                  <h2 className="text-lg font-medium text-gray-900 mb-4">Meal Rates (₹)</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Breakfast</label>
                      <input
                        type="number"
                        name="breakfast"
                        value={mealRates.breakfast}
                        onChange={handleMealRateChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Lunch</label>
                      <input
                        type="number"
                        name="lunch"
                        value={mealRates.lunch}
                        onChange={handleMealRateChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Dinner</label>
                      <input
                        type="number"
                        name="dinner"
                        value={mealRates.dinner}
                        onChange={handleMealRateChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Department Share */}
                <div className="mb-8">
                  <h2 className="text-lg font-medium text-gray-900 mb-4">Department Share</h2>
                  <div className="max-w-xs">
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <input
                        type="number"
                        value={departmentShare}
                        onChange={(e) => setDepartmentShare(parseFloat(e.target.value) || 0)}
                        className="block w-full rounded-md border-gray-300 pl-3 pr-12 focus:border-indigo-500 focus:ring-indigo-500"
                        placeholder="Enter percentage"
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                        <span className="text-gray-500 sm:text-sm">%</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Generate Button */}
                <div className="flex justify-end space-x-4">
                  <button
                    onClick={calculateBills}
                    disabled={loading}
                    className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    {loading ? 'Calculating...' : 'Generate Bills'}
                  </button>
                  
                  {billData && (
                    <PDFDownloadLink
                      document={
                        <BillPDF
                          billData={billData}
                          dateRange={dateRange}
                          mealRates={mealRates}
                          departmentShare={departmentShare}
                          totalAmount={totalAmount}
                          departmentPayable={departmentPayable}
                          employeePayable={employeePayable}
                        />
                      }
                      fileName={`mess-bill-${format(new Date(dateRange.startDate), 'yyyy-MM-dd')}.pdf`}
                      className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                    >
                      {({ blob, url, loading, error }) =>
                        loading ? 'Preparing PDF...' : 'Download PDF'
                      }
                    </PDFDownloadLink>
                  )}
                </div>
              </div>

              {/* Generated Bills Table */}
              {billData && (
                <div className="bg-white shadow-sm rounded-lg overflow-hidden">
                  <div className="px-4 py-5 sm:px-6">
                    <h3 className="text-lg font-medium text-gray-900">Generated Bills</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Emp ID</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Breakfast (₹)</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Lunch (₹)</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Dinner (₹)</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total (₹)</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Dept. Share (₹)</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Employee Payable (₹)</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {billData.users.map((user, index) => {
                          const totalMealAmount = (
                            user.mealCounts.breakfast * mealRates.breakfast +
                            user.mealCounts.lunch * mealRates.lunch +
                            user.mealCounts.dinner * mealRates.dinner
                          );
                          const deptShare = (totalMealAmount * departmentShare) / 100;
                          const empShare = totalMealAmount - deptShare;

                          return (
                            <tr key={user.userId} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.userId}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.name}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.department}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                                ₹{(user.mealCounts.breakfast * mealRates.breakfast).toFixed(2)}
                                <br />
                                <span className="text-xs text-gray-500">({user.mealCounts.breakfast})</span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                                ₹{(user.mealCounts.lunch * mealRates.lunch).toFixed(2)}
                                <br />
                                <span className="text-xs text-gray-500">({user.mealCounts.lunch})</span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                                ₹{(user.mealCounts.dinner * mealRates.dinner).toFixed(2)}
                                <br />
                                <span className="text-xs text-gray-500">({user.mealCounts.dinner})</span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-900">
                                ₹{totalMealAmount.toFixed(2)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-green-600">
                                ₹{deptShare.toFixed(2)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-red-600">
                                ₹{empShare.toFixed(2)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default BillGenerator; 