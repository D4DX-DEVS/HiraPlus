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
const BillPDF = ({ billData, dateRange, mealRates, departmentShare, totalAmount, departmentPayable, employeePayable, departmentData, selectedDepartment }) => {
  // Safely filter departments
  const filteredDepartments = departmentData?.departments?.filter(
    dept => !selectedDepartment || dept.department === selectedDepartment
  ) || [];

  // Safely get users from departments
  const filteredUsers = billData?.departments
    ?.filter(dept => !selectedDepartment || dept.department === selectedDepartment)
    ?.map(dept => dept.users)
    ?.flat() || [];

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.header}>
          Monthly Mess Bill Report
          {selectedDepartment && ` - ${selectedDepartment} Department`}
        </Text>
        
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

        {/* Department-wise Summary Table */}
        {filteredDepartments.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.summaryTitle, { marginBottom: 10 }]}>
              {selectedDepartment ? `${selectedDepartment} Department Summary` : 'Department-wise Summary'}
            </Text>
            <View style={styles.table}>
              {/* Table Header */}
              <View style={[styles.tableRow, styles.tableHeader]}>
                <Text style={[styles.tableCell, { flex: 2 }]}>Department</Text>
                <Text style={styles.tableCellRight}>B</Text>
                <Text style={styles.tableCellRight}>L</Text>
                <Text style={styles.tableCellRight}>D</Text>
                <Text style={styles.tableCellRight}>Total</Text>
                <Text style={[styles.tableCellRight, { flex: 1.2 }]}>Amount</Text>
                <Text style={[styles.tableCellRight, { flex: 1.2 }]}>Dept.</Text>
                <Text style={[styles.tableCellRight, { flex: 1.2 }]}>Emp.</Text>
              </View>

              {/* Department Rows */}
              {filteredDepartments.map((dept) => {
                const deptTotal = (
                  dept.breakfastCount * mealRates.breakfast +
                  dept.lunchCount * mealRates.lunch +
                  dept.dinnerCount * mealRates.dinner
                );
                const deptShare = (deptTotal * departmentShare) / 100;
                const empShare = deptTotal - deptShare;

                return (
                  <View key={dept.department} style={styles.tableRow}>
                    <Text style={[styles.tableCell, { flex: 2 }]}>{dept.department}</Text>
                    <Text style={styles.tableCellRight}>{dept.breakfastCount}</Text>
                    <Text style={styles.tableCellRight}>{dept.lunchCount}</Text>
                    <Text style={styles.tableCellRight}>{dept.dinnerCount}</Text>
                    <Text style={styles.tableCellRight}>{dept.totalMeals}</Text>
                    <Text style={[styles.tableCellRight, { flex: 1.2 }]}>{Math.round(deptTotal)}</Text>
                    <Text style={[styles.tableCellRight, { flex: 1.2 }]}>{Math.round(deptShare)}</Text>
                    <Text style={[styles.tableCellRight, { flex: 1.2 }]}>{Math.round(empShare)}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* User-wise Bills Table */}
        {filteredUsers.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.summaryTitle, { marginBottom: 10 }]}>
              {selectedDepartment ? `${selectedDepartment} Employee Details` : 'Employee-wise Details'}
            </Text>
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
              {filteredUsers.map((user, index) => {
                const breakfastAmount = user.breakfastCount * mealRates.breakfast;
                const lunchAmount = user.lunchCount * mealRates.lunch;
                const dinnerAmount = user.dinnerCount * mealRates.dinner;
                const totalMealAmount = breakfastAmount + lunchAmount + dinnerAmount;
                const deptShare = (totalMealAmount * departmentShare) / 100;
                const empShare = totalMealAmount - deptShare;

                return (
                  <View key={user.userId} style={[styles.tableRow, { backgroundColor: index % 2 === 0 ? '#FFFFFF' : '#F9FAFB' }]}>
                    <Text style={[styles.tableCell, { flex: 2 }]}>{user.name}</Text>
                    <Text style={[styles.tableCell, { flex: 1.5 }]}>{user.department}</Text>
                    <View style={[styles.tableCellRight, { flex: 1 }]}>
                      <Text>{String(Math.round(breakfastAmount))}</Text>
                      {user.breakfastCount > 0 && (
                        <Text style={styles.mealCount}>{String(user.breakfastCount)} meals</Text>
                      )}
                    </View>
                    <View style={[styles.tableCellRight, { flex: 1 }]}>
                      <Text>{String(Math.round(lunchAmount))}</Text>
                      {user.lunchCount > 0 && (
                        <Text style={styles.mealCount}>{String(user.lunchCount)} meals</Text>
                      )}
                    </View>
                    <View style={[styles.tableCellRight, { flex: 1 }]}>
                      <Text>{String(Math.round(dinnerAmount))}</Text>
                      {user.dinnerCount > 0 && (
                        <Text style={styles.mealCount}>{String(user.dinnerCount)} meals</Text>
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
        )}
      </Page>
    </Document>
  );
};

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
  const [departmentData, setDepartmentData] = useState(null);
  const [totalAmount, setTotalAmount] = useState(0);
  const [employeePayable, setEmployeePayable] = useState(0);
  const [departmentPayable, setDepartmentPayable] = useState(0);
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [departments, setDepartments] = useState([]);

  // Fetch departments on component mount
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const token = localStorage.getItem('adminToken');
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/admin/users`,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );
        // Extract unique departments and filter out empty values
        const uniqueDepartments = [...new Set(response.data
          .map(user => user.department)
          .filter(dept => dept && dept.trim())
        )].sort();
        setDepartments(uniqueDepartments);
      } catch (err) {
        console.error('Failed to fetch departments:', err);
        setError('Failed to fetch departments');
      }
    };
    fetchDepartments();
  }, []);

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
      
      // Fetch user-wise meal counts
      const userResponse = await axios.get(
        `${import.meta.env.VITE_API_URL}/admin/department-user-meals`,
        {
          params: {
            startDate: dateRange.startDate,
            endDate: dateRange.endDate,
            department: selectedDepartment || undefined
          },
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      // Fetch department-wise meal counts
      const deptResponse = await axios.get(
        `${import.meta.env.VITE_API_URL}/admin/department-meal-counts`,
        {
          params: {
            startDate: dateRange.startDate,
            endDate: dateRange.endDate,
            department: selectedDepartment || undefined
          },
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      // Ensure we have valid data before setting state
      if (deptResponse.data && deptResponse.data.departments) {
        setDepartmentData(deptResponse.data);

        // Calculate total amount from department data
        const total = deptResponse.data.departments
          .filter(dept => !selectedDepartment || dept.department === selectedDepartment)
          .reduce((acc, dept) => {
            return acc + (
              dept.breakfastCount * mealRates.breakfast +
              dept.lunchCount * mealRates.lunch +
              dept.dinnerCount * mealRates.dinner
            );
          }, 0);

        // Calculate department and employee shares
        const deptShare = (total * departmentShare) / 100;
        const empShare = total - deptShare;

        setTotalAmount(total);
        setDepartmentPayable(deptShare);
        setEmployeePayable(empShare);
      }

      // Ensure we have valid user data before setting state
      if (userResponse.data && (userResponse.data.departments || userResponse.data.users)) {
        setBillData(userResponse.data);
      }
    } catch (err) {
      console.error('Failed to fetch meal data:', err);
      setError('Failed to fetch meal data');
    } finally {
      setLoading(false);
    }
  };

  // Add null checks for PDF generation
  const canGeneratePDF = billData && departmentData && 
    departmentData.departments && 
    (billData.departments || billData.users);

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
                  <p className="text-3xl font-bold text-blue-600">₹{Math.round(totalAmount)}</p>
                </div>
                <div className="bg-green-50 p-6 rounded-lg">
                  <h3 className="text-lg font-medium text-gray-900">Department Share</h3>
                  <p className="text-3xl font-bold text-green-600">₹{Math.round(departmentPayable)}</p>
                </div>
                <div className="bg-red-50 p-6 rounded-lg">
                  <h3 className="text-lg font-medium text-gray-900">Employee Payable</h3>
                  <p className="text-3xl font-bold text-red-600">₹{Math.round(employeePayable)}</p>
                </div>
              </div>

              <div className="bg-white shadow-sm rounded-lg p-6 mb-8">
                {/* Department Selection */}
                <div className="mb-8">
                  <h2 className="text-lg font-medium text-gray-900 mb-4">Select Department</h2>
                  <div className="max-w-xs">
                    <select
                      value={selectedDepartment}
                      onChange={(e) => {
                        const newDepartment = e.target.value;
                        setSelectedDepartment(newDepartment);
                        // Reset data to prevent stale data from showing
                        setBillData(null);
                        setDepartmentData(null);
                        setTotalAmount(0);
                        setEmployeePayable(0);
                        setDepartmentPayable(0);
                      }}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    >
                      <option value="">All Departments</option>
                      {departments.map((dept) => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
                    </select>
                  </div>
                </div>

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
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">To Date</label>
                      <input
                        type="date"
                        name="endDate"
                        value={dateRange.endDate}
                        onChange={handleDateChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
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
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Lunch</label>
                      <input
                        type="number"
                        name="lunch"
                        value={mealRates.lunch}
                        onChange={handleMealRateChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Dinner</label>
                      <input
                        type="number"
                        name="dinner"
                        value={mealRates.dinner}
                        onChange={handleMealRateChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
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
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
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
                  
                  {billData && departmentData && departmentData.departments && (
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
                          departmentData={departmentData}
                          selectedDepartment={selectedDepartment}
                        />
                      }
                      fileName={`mess-bill-${format(new Date(dateRange.startDate), 'yyyy-MM-dd')}${selectedDepartment ? `-${selectedDepartment}` : ''}.pdf`}
                      className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                    >
                      {({ blob, url, loading, error }) =>
                        loading ? 'Preparing PDF...' : 'Download PDF'
                      }
                    </PDFDownloadLink>
                  )}
                </div>
              </div>

              {/* Department-wise Summary */}
              {departmentData?.departments && (
                <div className="bg-white shadow-sm rounded-lg overflow-hidden mb-8">
                  <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900">
                      {selectedDepartment ? `${selectedDepartment} Department Summary` : 'Department-wise Summary'}
                    </h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Breakfast</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Lunch</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Dinner</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total Meals</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total Amount (₹)</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Dept. Share (₹)</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Emp. Share (₹)</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {departmentData.departments
                          .filter(dept => !selectedDepartment || dept.department === selectedDepartment)
                          .map((dept, index) => {
                            const deptTotal = (
                              dept.breakfastCount * mealRates.breakfast +
                              dept.lunchCount * mealRates.lunch +
                              dept.dinnerCount * mealRates.dinner
                            );
                            const deptShare = (deptTotal * departmentShare) / 100;
                            const empShare = deptTotal - deptShare;

                            return (
                              <tr key={dept.department} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                  {dept.department}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                                  {dept.breakfastCount}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                                  {dept.lunchCount}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                                  {dept.dinnerCount}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                                  {dept.totalMeals}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-900">
                                  ₹{deptTotal.toFixed(2)}
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

              {/* Generated Bills Table */}
              {billData?.departments && (
                <div className="bg-white shadow-sm rounded-lg overflow-hidden">
                  <div className="px-4 py-5 sm:px-6">
                    <h3 className="text-lg font-medium text-gray-900">
                      {selectedDepartment ? `${selectedDepartment} Employee Details` : 'Generated Bills'}
                    </h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
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
                        {billData.departments
                          .filter(dept => !selectedDepartment || dept.department === selectedDepartment)
                          .map(dept => dept.users)
                          .flat()
                          .map((user, index) => {
                            const breakfastAmount = user.breakfastCount * mealRates.breakfast;
                            const lunchAmount = user.lunchCount * mealRates.lunch;
                            const dinnerAmount = user.dinnerCount * mealRates.dinner;
                            const totalMealAmount = breakfastAmount + lunchAmount + dinnerAmount;
                            const deptShare = (totalMealAmount * departmentShare) / 100;
                            const empShare = totalMealAmount - deptShare;

                            return (
                              <tr key={user.userId} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.name}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.department}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                                  ₹{breakfastAmount.toFixed(2)}
                                  <br />
                                  <span className="text-xs text-gray-500">({user.breakfastCount})</span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                                  ₹{lunchAmount.toFixed(2)}
                                  <br />
                                  <span className="text-xs text-gray-500">({user.lunchCount})</span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                                  ₹{dinnerAmount.toFixed(2)}
                                  <br />
                                  <span className="text-xs text-gray-500">({user.dinnerCount})</span>
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