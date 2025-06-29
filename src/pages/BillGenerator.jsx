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

// Add ErrorBoundary component
class PDFErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <button className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-red-600">
          Error generating PDF
        </button>
      );
    }

    return this.props.children;
  }
}

// PDF Document Component
const BillPDF = ({ billData, rentData, guestMealData, meetingFoodData, dateRange, mealRates, meetingFoodRates, rentRate, departmentShare, totalAmount, departmentPayable, employeePayable, departmentData, selectedDepartment, billType, selectedVenue }) => {
  try {
    // Early return if required data is missing
    if (!dateRange?.startDate || !dateRange?.endDate) {
      console.error('Missing date range');
      return null;
    }

    // For rent bills, ensure we have rentData
    if (billType === 'rent' && (!rentData?.departments || rentData.departments.length === 0)) {
      console.error('Missing rent data');
      return null;
    }

    // For food bills, ensure we have billData and departmentData
    if (billType === 'food' && (!billData?.departments || !departmentData?.departments)) {
      console.error('Missing food bill data');
      return null;
    }

    // For guest meals, ensure we have guestMealData
    if (billType === 'guest' && (!guestMealData?.departments || guestMealData.departments.length === 0)) {
      console.error('Missing guest meal data');
      return null;
    }

    // For meeting food, ensure we have meetingFoodData
    if (billType === 'meeting' && (!meetingFoodData?.departments || meetingFoodData.departments.length === 0)) {
      console.error('Missing meeting food / snacks data');
      return null;
    }

    // Get the appropriate departments based on bill type
    const departments = billType === 'food' 
      ? departmentData.departments
      : billType === 'rent' ? rentData.departments 
      : billType === 'meeting' ? meetingFoodData.departments
      : guestMealData.departments;

    const filteredDepartments = departments.filter(
      dept => !selectedDepartment || dept.department === selectedDepartment
    );

    return (
      <Document>
        <Page size="A4" style={styles.page}>
          <Text style={styles.header}>
            {billType === 'food' ? 'Monthly Mess Bill Report' 
             : billType === 'rent' ? `Monthly Venue Rent Report${selectedVenue ? ` - ${selectedVenue}` : ''}` 
             : billType === 'meeting' ? 'Monthly Meeting Food Report'
             : 'Monthly Guest Meals Report'}
            {selectedDepartment ? ` - ${selectedDepartment} Department` : ''}
          </Text>
          
          <View style={styles.section}>
            <Text style={styles.dateRange}>
              Billing Period: {format(new Date(dateRange.startDate), 'MMMM d, yyyy')} to {format(new Date(dateRange.endDate), 'MMMM d, yyyy')}
            </Text>

            {billType === 'food' ? (
              <Text style={styles.ratesInfo}>
                Meal Rates: Breakfast {mealRates?.breakfast || 0} | Lunch {mealRates?.lunch || 0} | Dinner {mealRates?.dinner || 0}
              </Text>
            ) : billType === 'rent' ? (
              <Text style={styles.ratesInfo}>
                Venue: {selectedVenue || 'All Venues'} | Rent Rate: ₹{rentRate || 0} per meeting
              </Text>
            ) : billType === 'meeting' ? (
              <>
                <Text style={styles.ratesInfo}>
                  Meeting Food / Snacks Rates: Breakfast {meetingFoodRates?.breakfast || 0} | Lunch {meetingFoodRates?.lunch || 0} | Dinner {meetingFoodRates?.dinner || 0}
                </Text>
                <Text style={styles.ratesInfo}>
                  Snacks & Tea: Morning Snacks {meetingFoodRates?.morningSnacks || 0} | Morning Tea {meetingFoodRates?.morningTea || 0} | Evening Snacks {meetingFoodRates?.eveningSnacks || 0} | Evening Tea {meetingFoodRates?.eveningTea || 0}
                </Text>
              </>
            ) : (
              <Text style={styles.ratesInfo}>
                Guest Meal Rates: Breakfast {mealRates?.breakfast || 0} | Lunch {mealRates?.lunch || 0} | Dinner {mealRates?.dinner || 0}
              </Text>
            )}
            <Text style={styles.ratesInfo}>
              Department Share: {departmentShare || 0}%
            </Text>
          </View>

          {/* Summary Section */}
          <View style={[styles.section, { flexDirection: 'row', justifyContent: 'space-between' }]}>
            <View style={[styles.summaryCard, { flex: 1, marginRight: 10 }]}>
              <Text style={styles.summaryTitle}>Total Amount</Text>
              <Text style={styles.summaryValue}>{Math.round(totalAmount || 0)}</Text>
            </View>
            <View style={[styles.summaryCard, { flex: 1, marginHorizontal: 10 }]}>
              <Text style={styles.summaryTitle}>Department Share</Text>
              <Text style={styles.summaryValue}>{Math.round(departmentPayable || 0)}</Text>
            </View>
            <View style={[styles.summaryCard, { flex: 1, marginLeft: 10 }]}>
              <Text style={styles.summaryTitle}>Employee Payable</Text>
              <Text style={styles.summaryValue}>{Math.round(employeePayable || 0)}</Text>
            </View>
          </View>

          {/* Rent Bills Table */}
          {billType === 'rent' && (
            <View style={styles.section}>
              <Text style={[styles.summaryTitle, { marginBottom: 10 }]}>
                {selectedDepartment ? `${selectedDepartment} Department Rent Summary` : 'Department-wise Rent Summary'}
                {selectedVenue ? ` - ${selectedVenue}` : ''}
              </Text>
              <View style={styles.table}>
                <View style={[styles.tableRow, styles.tableHeader]}>
                  <Text style={[styles.tableCell, { flex: 2 }]}>Department</Text>
                  <Text style={styles.tableCellRight}>Meetings</Text>
                  <Text style={[styles.tableCellRight, { flex: 1.2 }]}>Total Rent</Text>
                  <Text style={[styles.tableCellRight, { flex: 1.2 }]}>Dept. Share</Text>
                  <Text style={[styles.tableCellRight, { flex: 1.2 }]}>Emp. Share</Text>
                </View>

                {filteredDepartments.map((dept) => {
                  if (!dept) return null;
                  const totalRent = (dept.meetingCount || 0) * (rentRate || 0);
                  const deptShare = (totalRent * (departmentShare || 0)) / 100;
                  const empShare = totalRent - deptShare;

                  return (
                    <View key={dept.department} style={styles.tableRow}>
                      <Text style={[styles.tableCell, { flex: 2 }]}>{dept.department || ''}</Text>
                      <Text style={styles.tableCellRight}>{dept.meetingCount || 0}</Text>
                      <Text style={[styles.tableCellRight, { flex: 1.2 }]}>{Math.round(totalRent)}</Text>
                      <Text style={[styles.tableCellRight, { flex: 1.2 }]}>{Math.round(deptShare)}</Text>
                      <Text style={[styles.tableCellRight, { flex: 1.2 }]}>{Math.round(empShare)}</Text>
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          {/* Food Bills Tables */}
          {billType === 'food' && (
            <>
              {filteredDepartments.length > 0 && (
                <View style={styles.section}>
                  <Text style={[styles.summaryTitle, { marginBottom: 10 }]}>
                    {selectedDepartment ? `${selectedDepartment} Department Summary` : 'Department-wise Summary'}
                  </Text>
                  <View style={styles.table}>
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

                    {filteredDepartments.map((dept) => {
                      if (!dept) return null;
                      
                      // Calculate actual totals from billable users only
                      let actualBreakfast = 0, actualLunch = 0, actualDinner = 0, actualTotal = 0;
                      if (billData?.departments) {
                        const matchingDept = billData.departments.find(d => d.department === dept.department);
                        if (matchingDept) {
                          const billableUsers = matchingDept.users.filter(user => !user.isFreeFood);
                          actualBreakfast = billableUsers.reduce((sum, user) => sum + (user.breakfastCount || 0), 0);
                          actualLunch = billableUsers.reduce((sum, user) => sum + (user.lunchCount || 0), 0);
                          actualDinner = billableUsers.reduce((sum, user) => sum + (user.dinnerCount || 0), 0);
                          actualTotal = actualBreakfast + actualLunch + actualDinner;
                        }
                      }
                      
                      const deptTotal = (
                        actualBreakfast * (mealRates?.breakfast || 0) +
                        actualLunch * (mealRates?.lunch || 0) +
                        actualDinner * (mealRates?.dinner || 0)
                      );
                      const deptShare = (deptTotal * (departmentShare || 0)) / 100;
                      const empShare = deptTotal - deptShare;

                      return (
                        <View key={dept.department} style={styles.tableRow}>
                          <Text style={[styles.tableCell, { flex: 2 }]}>{dept.department || ''}</Text>
                          <Text style={styles.tableCellRight}>{actualBreakfast}</Text>
                          <Text style={styles.tableCellRight}>{actualLunch}</Text>
                          <Text style={styles.tableCellRight}>{actualDinner}</Text>
                          <Text style={styles.tableCellRight}>{actualTotal}</Text>
                          <Text style={[styles.tableCellRight, { flex: 1.2 }]}>{Math.round(deptTotal)}</Text>
                          <Text style={[styles.tableCellRight, { flex: 1.2 }]}>{Math.round(deptShare)}</Text>
                          <Text style={[styles.tableCellRight, { flex: 1.2 }]}>{Math.round(empShare)}</Text>
                        </View>
                      );
                    })}
                  </View>
                </View>
              )}

              {billData?.departments && (
                <View style={styles.section}>
                  <Text style={[styles.summaryTitle, { marginBottom: 10 }]}>
                    {selectedDepartment ? `${selectedDepartment} Employee Details` : 'Employee-wise Details'}
                  </Text>
                  <View style={styles.table}>
                    <View style={[styles.tableRow, styles.tableHeader]}>
                      <Text style={[styles.tableCell, { flex: 2 }]}>Name</Text>
                      <Text style={[styles.tableCell, { flex: 1.5 }]}>Department</Text>
                      <Text style={[styles.tableCellRight, { flex: 1 }]}>Breakfast</Text>
                      <Text style={[styles.tableCellRight, { flex: 1 }]}>Lunch</Text>
                      <Text style={[styles.tableCellRight, { flex: 1 }]}>Dinner</Text>
                      <Text style={[styles.tableCellRight, { flex: 1.2 }]}>Total</Text>
                      <Text style={[styles.tableCellRight, { flex: 1.2 }]}>Dept. Share ()</Text>
                      <Text style={[styles.tableCellRight, { flex: 1.2 }]}>Employee Payable ()</Text>
                    </View>

                    {billData.departments
                      .filter(dept => !selectedDepartment || dept.department === selectedDepartment)
                      .map(dept => dept.users.map(user => ({ ...user, parentDepartment: dept.department })))
                      .flat()
                      .filter(user => !user.isFreeFood) // Exclude users with free food
                      .map((user, index) => {
                        const breakfastAmount = (user.breakfastCount || 0) * mealRates.breakfast;
                        const lunchAmount = (user.lunchCount || 0) * mealRates.lunch;
                        const dinnerAmount = (user.dinnerCount || 0) * mealRates.dinner;
                        const totalMealAmount = breakfastAmount + lunchAmount + dinnerAmount;
                        const totalMeals = (user.breakfastCount || 0) + (user.lunchCount || 0) + (user.dinnerCount || 0);
                        const deptShare = (totalMealAmount * departmentShare) / 100;
                        const empPayable = totalMealAmount - deptShare;

                        return (
                          <View key={`${user.userId}-${index}`} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} style={styles.tableRow}>
                            <Text style={[styles.tableCell, { flex: 2 }]}>{user.name || 'N/A'}</Text>
                            <Text style={[styles.tableCell, { flex: 1.5 }]}>{user.department || user.parentDepartment || 'N/A'}</Text>
                            <Text style={[styles.tableCellRight, { flex: 1 }]}>{breakfastAmount.toFixed(2)}</Text>
                            <Text style={[styles.tableCellRight, { flex: 1 }]}>{lunchAmount.toFixed(2)}</Text>
                            <Text style={[styles.tableCellRight, { flex: 1 }]}>{dinnerAmount.toFixed(2)}</Text>
                            <Text style={[styles.tableCellRight, { flex: 1.2 }]}>{totalMeals}</Text>
                            <Text style={[styles.tableCellRight, { flex: 1.2 }]}>{totalMealAmount.toFixed(2)}</Text>
                            <Text style={[styles.tableCellRight, { flex: 1.2 }]}>{deptShare.toFixed(2)}</Text>
                            <Text style={[styles.tableCellRight, { flex: 1.2 }]}>{empPayable.toFixed(2)}</Text>
                          </View>
                        );
                      })}
                  </View>
                </View>
              )}
            </>
          )}

          {/* Meeting Food Table */}
          {meetingFoodData?.departments && billType === 'meeting' && (
            <View style={styles.section}>
              <Text style={[styles.summaryTitle, { marginBottom: 10 }]}>
                {selectedDepartment ? `${selectedDepartment} Department Meeting Food / Snacks Summary` : 'Department-wise Meeting Food / Snacks Summary'}
              </Text>
              <View style={styles.table}>
                <View style={[styles.tableRow, styles.tableHeader]}>
                  <Text style={[styles.tableCell, { flex: 1.5 }]}>Department</Text>
                  <Text style={[styles.tableCellRight, { flex: 0.8 }]}>B</Text>
                  <Text style={[styles.tableCellRight, { flex: 0.8 }]}>L</Text>
                  <Text style={[styles.tableCellRight, { flex: 0.8 }]}>D</Text>
                  <Text style={[styles.tableCellRight, { flex: 0.8 }]}>MS</Text>
                  <Text style={[styles.tableCellRight, { flex: 0.8 }]}>MT</Text>
                  <Text style={[styles.tableCellRight, { flex: 0.8 }]}>ES</Text>
                  <Text style={[styles.tableCellRight, { flex: 0.8 }]}>ET</Text>
                  <Text style={[styles.tableCellRight, { flex: 1 }]}>Amount</Text>
                  <Text style={[styles.tableCellRight, { flex: 1 }]}>Dept.</Text>
                  <Text style={[styles.tableCellRight, { flex: 1 }]}>Emp.</Text>
                </View>

                {filteredDepartments.map((dept) => {
                  if (!dept) return null;
                  const deptTotal = (
                    (dept.breakfast || 0) * meetingFoodRates.breakfast +
                    (dept.lunch || 0) * meetingFoodRates.lunch +
                    (dept.dinner || 0) * meetingFoodRates.dinner +
                    (dept.morningSnacksCount || 0) * meetingFoodRates.morningSnacks +
                    (dept.morningTeaCount || 0) * meetingFoodRates.morningTea +
                    (dept.eveningSnacksCount || 0) * meetingFoodRates.eveningSnacks +
                    (dept.eveningTeaCount || 0) * meetingFoodRates.eveningTea
                  );
                  const deptShare = (deptTotal * departmentShare) / 100;
                  const empShare = deptTotal - deptShare;

                  return (
                    <View key={dept.department} style={styles.tableRow}>
                      <Text style={[styles.tableCell, { flex: 1.5 }]}>{dept.department || ''}</Text>
                      <Text style={[styles.tableCellRight, { flex: 0.8 }]}>{dept.breakfast || 0}</Text>
                      <Text style={[styles.tableCellRight, { flex: 0.8 }]}>{dept.lunch || 0}</Text>
                      <Text style={[styles.tableCellRight, { flex: 0.8 }]}>{dept.dinner || 0}</Text>
                      <Text style={[styles.tableCellRight, { flex: 0.8 }]}>{dept.morningSnacksCount || 0}</Text>
                      <Text style={[styles.tableCellRight, { flex: 0.8 }]}>{dept.morningTeaCount || 0}</Text>
                      <Text style={[styles.tableCellRight, { flex: 0.8 }]}>{dept.eveningSnacksCount || 0}</Text>
                      <Text style={[styles.tableCellRight, { flex: 0.8 }]}>{dept.eveningTeaCount || 0}</Text>
                      <Text style={[styles.tableCellRight, { flex: 1 }]}>{Math.round(deptTotal)}</Text>
                      <Text style={[styles.tableCellRight, { flex: 1 }]}>{Math.round(deptShare)}</Text>
                      <Text style={[styles.tableCellRight, { flex: 1 }]}>{Math.round(empShare)}</Text>
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          {/* Guest Meals Table */}
          {guestMealData?.departments && billType === 'guest' && (
            <View style={styles.section}>
              <Text style={[styles.summaryTitle, { marginBottom: 10 }]}>
                {selectedDepartment ? `${selectedDepartment} Department Guest Meals Summary` : 'Department-wise Guest Meals Summary'}
              </Text>
              <View style={styles.table}>
                <View style={[styles.tableRow, styles.tableHeader]}>
                  <Text style={[styles.tableCell, { flex: 2 }]}>Department</Text>
                  <Text style={styles.tableCellRight}>Breakfast</Text>
                  <Text style={styles.tableCellRight}>Lunch</Text>
                  <Text style={styles.tableCellRight}>Dinner</Text>
                  <Text style={styles.tableCellRight}>Total Meals</Text>
                  <Text style={[styles.tableCellRight, { flex: 1.2 }]}>Total Amount</Text>
                  <Text style={[styles.tableCellRight, { flex: 1.2 }]}>Dept. Share</Text>
                  <Text style={[styles.tableCellRight, { flex: 1.2 }]}>Emp. Share</Text>
                </View>

                {filteredDepartments.map((dept) => {
                  if (!dept) return null;
                  const deptTotal = (
                    dept.breakfastCount * mealRates.breakfast +
                    dept.lunchCount * mealRates.lunch +
                    dept.dinnerCount * mealRates.dinner
                  );
                  const deptShare = (deptTotal * departmentShare) / 100;
                  const empShare = deptTotal - deptShare;

                  return (
                    <View key={dept.department} style={styles.tableRow}>
                      <Text style={[styles.tableCell, { flex: 2 }]}>{dept.department || ''}</Text>
                      <Text style={styles.tableCellRight}>{dept.breakfastCount || 0}</Text>
                      <Text style={styles.tableCellRight}>{dept.lunchCount || 0}</Text>
                      <Text style={styles.tableCellRight}>{dept.dinnerCount || 0}</Text>
                      <Text style={styles.tableCellRight}>{dept.totalMeals || 0}</Text>
                      <Text style={[styles.tableCellRight, { flex: 1.2 }]}>{Math.round(deptTotal)}</Text>
                      <Text style={[styles.tableCellRight, { flex: 1.2 }]}>{Math.round(deptShare)}</Text>
                      <Text style={[styles.tableCellRight, { flex: 1.2 }]}>{Math.round(empShare)}</Text>
                    </View>
                  );
                })}
              </View>
            </View>
          )}
        </Page>
      </Document>
    );
  } catch (error) {
    console.error('Error rendering PDF:', error);
    return null;
  }
};

const BillGenerator = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    const saved = localStorage.getItem('sidebarOpen');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [billType, setBillType] = useState('food');
  const [selectedVenue, setSelectedVenue] = useState('');
  const [rentRates, setRentRates] = useState({
    'Auditorium [2nd Floor]': 2000,
    'Conference Hall [3rd Floor]': 1500,
    'Meeting Space [1st Floor]': 1000
  });
  const [rentData, setRentData] = useState(null);
  const [guestMealData, setGuestMealData] = useState(null);
  const [meetingFoodData, setMeetingFoodData] = useState(null);
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });
  const [mealRates, setMealRates] = useState({
    breakfast: 40,
    lunch: 80,
    dinner: 40
  });
  const [meetingFoodRates, setMeetingFoodRates] = useState({
    breakfast: 40,
    lunch: 80,
    dinner: 40,
    morningSnacks: 12,
    morningTea: 12,
    eveningSnacks: 12,
    eveningTea: 12
  });
  const [departmentShare, setDepartmentShare] = useState(75);
  const [billData, setBillData] = useState(null);
  const [departmentData, setDepartmentData] = useState(null);
  const [totalAmount, setTotalAmount] = useState(0);
  const [employeePayable, setEmployeePayable] = useState(0);
  const [departmentPayable, setDepartmentPayable] = useState(0);
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [departments, setDepartments] = useState([]);

  const venues = [
    'Auditorium [2nd Floor]',
    'Conference Hall [3rd Floor]',
    'Meeting Space [1st Floor]'
  ];

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
          .map(user => {
            // Handle both string and object department formats
            if (typeof user.department === 'string') {
              return user.department;
            } else if (user.department && typeof user.department === 'object') {
              return user.department.title;
            }
            return null;
          })
          .filter(dept => dept && dept.trim && dept.trim())
        )].sort();
        setDepartments(uniqueDepartments);
      } catch (err) {
        console.error('Failed to fetch departments:', err);
        setError('Failed to fetch departments');
      }
    };
    fetchDepartments();
  }, []);

  // Save sidebar state to localStorage
  useEffect(() => {
    localStorage.setItem('sidebarOpen', JSON.stringify(isSidebarOpen));
  }, [isSidebarOpen]);

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

  const handleMeetingFoodRateChange = (e) => {
    setMeetingFoodRates({
      ...meetingFoodRates,
      [e.target.name]: parseFloat(e.target.value) || 0
    });
  };

  const handleGenerateClick = () => {
    if (!dateRange.startDate || !dateRange.endDate) {
      setError('Please select both start and end dates');
      return;
    }
    setShowConfirmDialog(true);
  };

  const calculateBills = async () => {
    if (!dateRange.startDate || !dateRange.endDate) {
      setError('Please select both start and end dates');
      return;
    }

    setLoading(true);
    setError('');
    setShowConfirmDialog(false);

    try {
      const token = localStorage.getItem('adminToken');
      
      if (billType === 'meeting') {
        // Meeting food bill calculation
        const meetingResponse = await axios.get(
          `${import.meta.env.VITE_API_URL}/admin/meeting-food-bills`,
          {
            params: {
              startDate: dateRange.startDate,
              endDate: dateRange.endDate,
              department: selectedDepartment || undefined
            },
            headers: { Authorization: `Bearer ${token}` }
          }
        );

        if (meetingResponse.data && meetingResponse.data.departments) {
          setMeetingFoodData(meetingResponse.data);
          const total = meetingResponse.data.departments
            .filter(dept => !selectedDepartment || dept.department === selectedDepartment)
            .reduce((acc, dept) => {
              return acc + (
                (dept.breakfast || 0) * meetingFoodRates.breakfast +
                (dept.lunch || 0) * meetingFoodRates.lunch +
                (dept.dinner || 0) * meetingFoodRates.dinner +
                (dept.morningSnacksCount || 0) * meetingFoodRates.morningSnacks +
                (dept.morningTeaCount || 0) * meetingFoodRates.morningTea +
                (dept.eveningSnacksCount || 0) * meetingFoodRates.eveningSnacks +
                (dept.eveningTeaCount || 0) * meetingFoodRates.eveningTea
              );
            }, 0);

          const deptShare = (total * departmentShare) / 100;
          const empShare = total - deptShare;

          setTotalAmount(total);
          setDepartmentPayable(deptShare);
          setEmployeePayable(empShare);
        }
      } else if (billType === 'guest') {
        // Guest meal bill calculation
        const guestResponse = await axios.get(
          `${import.meta.env.VITE_API_URL}/admin/department-guest-meals`,
          {
            params: {
              startDate: dateRange.startDate,
              endDate: dateRange.endDate,
              department: selectedDepartment || undefined
            },
            headers: { Authorization: `Bearer ${token}` }
          }
        );

        if (guestResponse.data && guestResponse.data.departments) {
          setGuestMealData(guestResponse.data);
          const total = guestResponse.data.departments
            .filter(dept => !selectedDepartment || dept.department === selectedDepartment)
            .reduce((acc, dept) => {
              return acc + (
                dept.breakfastCount * mealRates.breakfast +
                dept.lunchCount * mealRates.lunch +
                dept.dinnerCount * mealRates.dinner
              );
            }, 0);

          const deptShare = (total * departmentShare) / 100;
          const empShare = total - deptShare;

          setTotalAmount(total);
          setDepartmentPayable(deptShare);
          setEmployeePayable(empShare);
        }
      } else if (billType === 'food') {
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

          // Calculate total amount excluding free food users
          let total = 0;
          if (userResponse.data && userResponse.data.departments) {
            total = userResponse.data.departments
              .filter(dept => !selectedDepartment || dept.department === selectedDepartment)
              .reduce((acc, dept) => {
                const deptTotal = dept.users
                  .filter(user => !user.isFreeFood) // Exclude free food users
                  .reduce((userAcc, user) => {
                    return userAcc + (
                      (user.breakfastCount || 0) * mealRates.breakfast +
                      (user.lunchCount || 0) * mealRates.lunch +
                      (user.dinnerCount || 0) * mealRates.dinner
                    );
                  }, 0);
                return acc + deptTotal;
              }, 0);
          }

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
      } else if (billType === 'rent') {
        // Fetch rent data
        if (!selectedVenue) {
          setError('Please select a venue for rent bill calculation');
          return;
        }

        const rentResponse = await axios.get(
          `${import.meta.env.VITE_API_URL}/admin/department-rent-bills`,
          {
            params: {
              startDate: dateRange.startDate,
              endDate: dateRange.endDate,
              department: selectedDepartment || undefined,
              venue: selectedVenue
            },
            headers: { Authorization: `Bearer ${token}` }
          }
        );

        if (rentResponse.data) {
          setRentData(rentResponse.data);
          const total = rentResponse.data.departments
            .filter(dept => !selectedDepartment || dept.department === selectedDepartment)
            .reduce((acc, dept) => acc + (dept.meetingCount * rentRates[selectedVenue] || 0), 0);

          const deptShare = (total * departmentShare) / 100;
          const empShare = total - deptShare;

          setTotalAmount(total);
          setDepartmentPayable(deptShare);
          setEmployeePayable(empShare);
        }
      }
    } catch (err) {
      console.error('Failed to fetch data:', err);
      setError('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  // Add null checks for PDF generation
  const canGeneratePDF = billData && departmentData && 
    departmentData.departments && 
    (billData.departments || billData.users);

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
                        Monthly Bill Generator
                      </h1>
                      <div className="flex items-center space-x-3 text-xs">
                        <span className="flex items-center text-green-600">
                          <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5"></div>
                          {billType === 'food' ? 'Food Bills' : 
                           billType === 'rent' ? 'Venue Rent' : 
                           billType === 'meeting' ? 'Meeting Food / Snacks' : 
                           billType === 'guest' ? 'Guest Meals' : 'Select Bill Type'}
                        </span>
                        {selectedDepartment && (
                          <span className="flex items-center text-blue-600">
                            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-1.5"></div>
                            {selectedDepartment} Department
                          </span>
                        )}
                        {billType === 'rent' && selectedVenue && (
                          <span className="flex items-center text-purple-600">
                            <div className="w-1.5 h-1.5 bg-purple-500 rounded-full mr-1.5"></div>
                            {selectedVenue}
                          </span>
                        )}
                      </div>
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

              <div className="bg-white shadow-lg rounded-xl border border-gray-200/50 p-4 lg:p-5 mb-6">
                {/* Bill Type Selection */}
                <div className="mb-8">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Bill Type</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <label className="relative flex cursor-pointer rounded-lg border border-gray-300 bg-white p-4 shadow-sm focus:outline-none hover:border-green-500 transition-all duration-200">
                      <input
                        type="radio"
                        value="food"
                        checked={billType === 'food'}
                        onChange={(e) => {
                          setBillType(e.target.value);
                          setSelectedVenue('');
                          setRentData(null);
                          setBillData(null);
                          setGuestMealData(null);
                          setMeetingFoodData(null);
                          setDepartmentData(null);
                          setTotalAmount(0);
                          setEmployeePayable(0);
                          setDepartmentPayable(0);
                        }}
                        className="sr-only"
                      />
                      <span className="flex flex-1">
                        <span className="flex flex-col">
                          <span className={`block text-sm font-medium ${billType === 'food' ? 'text-green-900' : 'text-gray-900'}`}>
                            Food Bills
                          </span>
                          <span className={`mt-1 flex items-center text-sm ${billType === 'food' ? 'text-green-600' : 'text-gray-500'}`}>
                            Employee meals
                          </span>
                        </span>
                      </span>
                      {billType === 'food' && (
                        <div className="h-5 w-5 text-green-600">
                          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </label>
                    
                    <label className="relative flex cursor-pointer rounded-lg border border-gray-300 bg-white p-4 shadow-sm focus:outline-none hover:border-green-500 transition-all duration-200">
                      <input
                        type="radio"
                        value="rent"
                        checked={billType === 'rent'}
                        onChange={(e) => {
                          setBillType(e.target.value);
                          setSelectedVenue('');
                          setRentData(null);
                          setBillData(null);
                          setGuestMealData(null);
                          setMeetingFoodData(null);
                          setDepartmentData(null);
                          setTotalAmount(0);
                          setEmployeePayable(0);
                          setDepartmentPayable(0);
                        }}
                        className="sr-only"
                      />
                      <span className="flex flex-1">
                        <span className="flex flex-col">
                          <span className={`block text-sm font-medium ${billType === 'rent' ? 'text-green-900' : 'text-gray-900'}`}>
                            Venue Rent
                          </span>
                          <span className={`mt-1 flex items-center text-sm ${billType === 'rent' ? 'text-green-600' : 'text-gray-500'}`}>
                            Meeting costs
                          </span>
                        </span>
                      </span>
                      {billType === 'rent' && (
                        <div className="h-5 w-5 text-green-600">
                          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </label>
                    
                    <label className="relative flex cursor-pointer rounded-lg border border-gray-300 bg-white p-4 shadow-sm focus:outline-none hover:border-green-500 transition-all duration-200">
                      <input
                        type="radio"
                        value="guest"
                        checked={billType === 'guest'}
                        onChange={(e) => {
                          setBillType(e.target.value);
                          setSelectedVenue('');
                          setRentData(null);
                          setBillData(null);
                          setGuestMealData(null);
                          setMeetingFoodData(null);
                          setDepartmentData(null);
                          setTotalAmount(0);
                          setEmployeePayable(0);
                          setDepartmentPayable(0);
                        }}
                        className="sr-only"
                      />
                      <span className="flex flex-1">
                        <span className="flex flex-col">
                          <span className={`block text-sm font-medium ${billType === 'guest' ? 'text-green-900' : 'text-gray-900'}`}>
                            Guest Meals
                          </span>
                          <span className={`mt-1 flex items-center text-sm ${billType === 'guest' ? 'text-green-600' : 'text-gray-500'}`}>
                            Visitor meals
                          </span>
                        </span>
                      </span>
                      {billType === 'guest' && (
                        <div className="h-5 w-5 text-green-600">
                          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </label>
                    
                    <label className="relative flex cursor-pointer rounded-lg border border-gray-300 bg-white p-4 shadow-sm focus:outline-none hover:border-green-500 transition-all duration-200">
                      <input
                        type="radio"
                        value="meeting"
                        checked={billType === 'meeting'}
                        onChange={(e) => {
                          setBillType(e.target.value);
                          setSelectedVenue('');
                          setRentData(null);
                          setBillData(null);
                          setGuestMealData(null);
                          setMeetingFoodData(null);
                          setDepartmentData(null);
                          setTotalAmount(0);
                          setEmployeePayable(0);
                          setDepartmentPayable(0);
                        }}
                        className="sr-only"
                      />
                      <span className="flex flex-1">
                        <span className="flex flex-col">
                          <span className={`block text-sm font-medium ${billType === 'meeting' ? 'text-green-900' : 'text-gray-900'}`}>
                            Meeting Food / Snacks
                          </span>
                          <span className={`mt-1 flex items-center text-sm ${billType === 'meeting' ? 'text-green-600' : 'text-gray-500'}`}>
                            Event catering
                          </span>
                        </span>
                      </span>
                      {billType === 'meeting' && (
                        <div className="h-5 w-5 text-green-600">
                          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </label>
                  </div>
                </div>

                {/* Department Selection */}
                <div className="mb-8">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Select Department</h2>
                  <div className="max-w-md">
                    <select
                      value={selectedDepartment}
                      onChange={(e) => {
                        const newDepartment = e.target.value;
                        setSelectedDepartment(newDepartment);
                        // Reset data to prevent stale data from showing
                        setBillData(null);
                        setDepartmentData(null);
                        setRentData(null);
                        setGuestMealData(null);
                        setMeetingFoodData(null);
                        setTotalAmount(0);
                        setEmployeePayable(0);
                        setDepartmentPayable(0);
                      }}
                      className="block w-full px-4 py-3 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 rounded-lg bg-white transition-all duration-200"
                    >
                      <option value="">All Departments</option>
                      {departments.map((dept) => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Venue Selection - Show only for rent bills */}
                {billType === 'rent' && (
                  <div className="mb-8">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Select Venue</h2>
                    <div className="max-w-md">
                      <select
                        value={selectedVenue}
                        onChange={(e) => {
                          setSelectedVenue(e.target.value);
                          // Reset rent data when venue changes
                          setRentData(null);
                          setTotalAmount(0);
                          setEmployeePayable(0);
                          setDepartmentPayable(0);
                        }}
                        className="block w-full px-4 py-3 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 rounded-lg bg-white transition-all duration-200"
                      >
                        <option value="">Select Venue</option>
                        {venues.map((venue) => (
                          <option key={venue} value={venue}>{venue}</option>
                        ))}
                      </select>
                      {selectedVenue && (
                        <p className="mt-2 text-sm text-gray-600">
                          Rent Rate: ₹{rentRates[selectedVenue]?.toLocaleString()} per meeting
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-6 rounded-xl border border-blue-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Total Amount</h3>
                    <p className="text-3xl font-bold text-blue-600">₹{Math.round(totalAmount).toLocaleString()}</p>
                  </div>
                  <div className="bg-gradient-to-r from-green-50 to-green-100 p-6 rounded-xl border border-green-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Department Share</h3>
                    <p className="text-3xl font-bold text-green-600">₹{Math.round(departmentPayable).toLocaleString()}</p>
                  </div>
                  <div className="bg-gradient-to-r from-red-50 to-red-100 p-6 rounded-xl border border-red-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Employee Payable</h3>
                    <p className="text-3xl font-bold text-red-600">₹{Math.round(employeePayable).toLocaleString()}</p>
                  </div>
                </div>

                {/* Bill Details Table - Show after calculation */}
                {((billType === 'food' && departmentData?.departments) || 
                  (billType === 'rent' && rentData?.departments) ||
                  (billType === 'guest' && guestMealData?.departments) ||
                  (billType === 'meeting' && meetingFoodData?.departments)) && (
                  <div className="mb-8 bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {billType === 'food' ? 'Food Bill Details' : 
                         billType === 'rent' ? `Venue Rent Details${selectedVenue ? ` - ${selectedVenue}` : ''}` : 
                         billType === 'meeting' ? 'Meeting Food Details' : 
                         'Guest Meal Details'}
                      </h3>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Department
                            </th>
                            {billType === 'food' && (
                              <>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Breakfast</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lunch</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dinner</th>
                              </>
                            )}
                            {billType === 'rent' && (
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Meetings</th>
                            )}
                            {billType === 'guest' && (
                              <>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Breakfast</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lunch</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dinner</th>
                              </>
                            )}
                            {billType === 'meeting' && (
                              <>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">B</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">L</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">D</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">MS</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">MT</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ES</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ET</th>
                              </>
                            )}
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Amount</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {billType === 'food' && departmentData?.departments?.map((dept) => {
                            // Calculate actual billable amounts from user data
                            let actualBreakfast = 0, actualLunch = 0, actualDinner = 0;
                            if (billData?.departments) {
                              const matchingDept = billData.departments.find(d => d.department === dept.department);
                              if (matchingDept) {
                                const billableUsers = matchingDept.users.filter(user => !user.isFreeFood);
                                actualBreakfast = billableUsers.reduce((sum, user) => sum + (user.breakfastCount || 0), 0);
                                actualLunch = billableUsers.reduce((sum, user) => sum + (user.lunchCount || 0), 0);
                                actualDinner = billableUsers.reduce((sum, user) => sum + (user.dinnerCount || 0), 0);
                              }
                            }
                            const totalAmount = (actualBreakfast * mealRates.breakfast) + (actualLunch * mealRates.lunch) + (actualDinner * mealRates.dinner);
                            
                            return (
                              <tr key={dept.department} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{dept.department}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{actualBreakfast}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{actualLunch}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{actualDinner}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                                  ₹{Math.round(totalAmount).toLocaleString()}
                                </td>
                              </tr>
                            );
                          })}
                          {billType === 'rent' && rentData?.departments?.map((dept) => (
                            <tr key={dept.department} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{dept.department}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{dept.meetingCount || 0}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                                ₹{Math.round(dept.meetingCount * rentRates[selectedVenue] || 0).toLocaleString()}
                              </td>
                            </tr>
                          ))}
                          {billType === 'guest' && guestMealData?.departments?.map((dept) => (
                            <tr key={dept.department} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{dept.department}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{dept.breakfastCount || 0}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{dept.lunchCount || 0}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{dept.dinnerCount || 0}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                                ₹{Math.round((dept.breakfastCount * mealRates.breakfast) + (dept.lunchCount * mealRates.lunch) + (dept.dinnerCount * mealRates.dinner)).toLocaleString()}
                              </td>
                            </tr>
                          ))}
                          {billType === 'meeting' && meetingFoodData?.departments?.map((dept) => (
                            <tr key={dept.department} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{dept.department}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{dept.breakfast || 0}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{dept.lunch || 0}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{dept.dinner || 0}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{dept.morningSnacksCount || 0}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{dept.morningTeaCount || 0}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{dept.eveningSnacksCount || 0}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{dept.eveningTeaCount || 0}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                                ₹{Math.round(
                                  (dept.breakfast || 0) * meetingFoodRates.breakfast +
                                  (dept.lunch || 0) * meetingFoodRates.lunch +
                                  (dept.dinner || 0) * meetingFoodRates.dinner +
                                  (dept.morningSnacksCount || 0) * meetingFoodRates.morningSnacks +
                                  (dept.morningTeaCount || 0) * meetingFoodRates.morningTea +
                                  (dept.eveningSnacksCount || 0) * meetingFoodRates.eveningSnacks +
                                  (dept.eveningTeaCount || 0) * meetingFoodRates.eveningTea
                                ).toLocaleString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* User-wise Bill Details Table - Show for food bills only */}
                {billType === 'food' && billData?.departments && (
                  <div className="mb-8 bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-900">
                        Individual Employee Bills
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Detailed breakdown of each employee's meal consumption and bill amount
                      </p>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Employee Name
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Department
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Breakfast
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Lunch
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Dinner
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Total Meals
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Total Amount
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Dept. Share
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Employee Payable
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {billData.departments
                            .filter(dept => !selectedDepartment || dept.department === selectedDepartment)
                            .map(dept => dept.users.map(user => ({ ...user, parentDepartment: dept.department })))
                            .flat()
                            .filter(user => !user.isFreeFood) // Exclude users with free food
                            .map((user, index) => {
                              const breakfastAmount = (user.breakfastCount || 0) * mealRates.breakfast;
                              const lunchAmount = (user.lunchCount || 0) * mealRates.lunch;
                              const dinnerAmount = (user.dinnerCount || 0) * mealRates.dinner;
                              const totalMealAmount = breakfastAmount + lunchAmount + dinnerAmount;
                              const totalMeals = (user.breakfastCount || 0) + (user.lunchCount || 0) + (user.dinnerCount || 0);
                              const deptShare = (totalMealAmount * departmentShare) / 100;
                              const empPayable = totalMealAmount - deptShare;

                              return (
                                <tr key={`${user.userId}-${index}`} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                    {user.name || 'N/A'}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {user.department || user.parentDepartment || 'N/A'}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    <div className="flex flex-col">
                                      <span>{user.breakfastCount || 0}</span>
                                      <span className="text-xs text-gray-400">₹{breakfastAmount.toFixed(2)}</span>
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    <div className="flex flex-col">
                                      <span>{user.lunchCount || 0}</span>
                                      <span className="text-xs text-gray-400">₹{lunchAmount.toFixed(2)}</span>
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    <div className="flex flex-col">
                                      <span>{user.dinnerCount || 0}</span>
                                      <span className="text-xs text-gray-400">₹{dinnerAmount.toFixed(2)}</span>
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    <span className="font-medium">{totalMeals}</span>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-blue-600">
                                    ₹{totalMealAmount.toFixed(2)}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                                    ₹{deptShare.toFixed(2)}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-red-600">
                                    ₹{empPayable.toFixed(2)}
                                  </td>
                                </tr>
                              );
                            })}
                        </tbody>
                      </table>
                      
                      {/* Summary Row */}
                      <tfoot className="bg-gray-100 border-t-2 border-gray-300">
                        <tr>
                          <td className="px-6 py-4 text-sm font-bold text-gray-900" colSpan="6">
                            TOTAL ({billData.departments
                              .filter(dept => !selectedDepartment || dept.department === selectedDepartment)
                              .reduce((acc, dept) => acc + dept.users.filter(user => !user.isFreeFood).length, 0)} employees)
                          </td>
                          <td className="px-6 py-4 text-sm font-bold text-blue-600">
                            ₹{Math.round(totalAmount).toLocaleString()}
                          </td>
                          <td className="px-6 py-4 text-sm font-bold text-green-600">
                            ₹{Math.round(departmentPayable).toLocaleString()}
                          </td>
                          <td className="px-6 py-4 text-sm font-bold text-red-600">
                            ₹{Math.round(employeePayable).toLocaleString()}
                          </td>
                        </tr>
                      </tfoot>
                    </div>
                  </div>
                )}

                {/* Billing Period */}
                <div className="mb-8">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Billing Period</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">From Date</label>
                      <input
                        type="date"
                        name="startDate"
                        value={dateRange.startDate}
                        onChange={handleDateChange}
                        className="block w-full px-4 py-3 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 rounded-lg bg-white transition-all duration-200"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">To Date</label>
                      <input
                        type="date"
                        name="endDate"
                        value={dateRange.endDate}
                        onChange={handleDateChange}
                        className="block w-full px-4 py-3 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 rounded-lg bg-white transition-all duration-200"
                      />
                    </div>
                  </div>
                </div>

                {/* Rent Rate (show only for rent bills) */}
                {billType === 'rent' && (
                  <div className="mb-8">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Venue Rent Rates (₹ per meeting)</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {venues.map((venue) => (
                        <div key={venue}>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            {venue}
                          </label>
                          <input
                            type="number"
                            value={rentRates[venue]}
                            onChange={(e) => setRentRates(prev => ({
                              ...prev,
                              [venue]: parseFloat(e.target.value) || 0
                            }))}
                            className="block w-full px-4 py-3 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 rounded-lg bg-white transition-all duration-200"
                            placeholder="Enter rent amount"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Meal Rates (show for food and guest bills) */}
                {(billType === 'food' || billType === 'guest') && (
                  <div className="mb-8">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Meal Rates</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Breakfast</label>
                        <input
                          type="number"
                          name="breakfast"
                          value={mealRates.breakfast}
                          onChange={handleMealRateChange}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Lunch</label>
                        <input
                          type="number"
                          name="lunch"
                          value={mealRates.lunch}
                          onChange={handleMealRateChange}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Dinner</label>
                        <input
                          type="number"
                          name="dinner"
                          value={mealRates.dinner}
                          onChange={handleMealRateChange}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Meeting Food Rates (show for meeting bills) */}
                {billType === 'meeting' && (
                  <div className="mb-8">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Meeting Food Rates</h2>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Breakfast</label>
                        <input
                          type="number"
                          name="breakfast"
                          value={meetingFoodRates.breakfast}
                          onChange={handleMeetingFoodRateChange}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Lunch</label>
                        <input
                          type="number"
                          name="lunch"
                          value={meetingFoodRates.lunch}
                          onChange={handleMeetingFoodRateChange}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Dinner</label>
                        <input
                          type="number"
                          name="dinner"
                          value={meetingFoodRates.dinner}
                          onChange={handleMeetingFoodRateChange}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Morning Snacks</label>
                        <input
                          type="number"
                          name="morningSnacks"
                          value={meetingFoodRates.morningSnacks}
                          onChange={handleMeetingFoodRateChange}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Morning Tea</label>
                        <input
                          type="number"
                          name="morningTea"
                          value={meetingFoodRates.morningTea}
                          onChange={handleMeetingFoodRateChange}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Evening Snacks</label>
                        <input
                          type="number"
                          name="eveningSnacks"
                          value={meetingFoodRates.eveningSnacks}
                          onChange={handleMeetingFoodRateChange}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Evening Tea</label>
                        <input
                          type="number"
                          name="eveningTea"
                          value={meetingFoodRates.eveningTea}
                          onChange={handleMeetingFoodRateChange}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Department Share */}
                <div className="mb-8">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Department Share</h2>
                  <div className="max-w-xs">
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <input
                        type="number"
                        value={departmentShare}
                        onChange={(e) => setDepartmentShare(parseFloat(e.target.value) || 0)}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
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
                    onClick={handleGenerateClick}
                    disabled={loading}
                    className="inline-flex items-center px-6 py-3 bg-green-950 text-white font-semibold rounded-lg hover:bg-green-900 focus:outline-none focus:ring-2 focus:ring-green-800 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50"
                  >
                    {loading ? 'Calculating...' : 'Generate Bills'}
                  </button>
                  
                  {((billType === 'food' && billData && departmentData?.departments) || 
                    (billType === 'rent' && rentData?.departments) ||
                    (billType === 'guest' && guestMealData?.departments) ||
                    (billType === 'meeting' && meetingFoodData?.departments)) && (
                    <PDFErrorBoundary>
                      <PDFDownloadLink
                        document={
                          <BillPDF
                            billData={billData}
                            rentData={rentData}
                            guestMealData={guestMealData}
                            meetingFoodData={meetingFoodData}
                            dateRange={dateRange}
                            mealRates={mealRates}
                            meetingFoodRates={meetingFoodRates}
                            rentRate={rentRates[selectedVenue] || 0}
                            departmentShare={departmentShare}
                            totalAmount={totalAmount}
                            departmentPayable={departmentPayable}
                            employeePayable={employeePayable}
                            departmentData={departmentData}
                            selectedDepartment={selectedDepartment}
                            billType={billType}
                            selectedVenue={selectedVenue}
                          />
                        }
                        fileName={`${billType === 'food' ? 'mess-bill' : billType === 'rent' ? 'rent-bill' : billType === 'meeting' ? 'meeting-food-bill' : 'guest-meal-bill'}-${format(new Date(dateRange.startDate), 'yyyy-MM-dd')}${selectedDepartment ? `-${selectedDepartment}` : ''}.pdf`}
                        className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                      >
                        {({ blob, url, loading, error }) => {
                          if (loading) return 'Preparing PDF...';
                          if (error) {
                            console.error('PDF generation error:', error);
                            return 'Error generating PDF';
                          }
                          return 'Download PDF';
                        }}
                      </PDFDownloadLink>
                    </PDFErrorBoundary>
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Confirmation Dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 mb-4">
                <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Confirm Bill Generation
              </h3>
              <p className="text-sm text-gray-600 mb-6">
                Are you sure you have checked the {billType === 'rent' ? 'venue rates' : 'food rates'} and department share before generating the bill?
              </p>
              <div className="flex justify-center space-x-3">
                <button
                  onClick={() => setShowConfirmDialog(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300 transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={calculateBills}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors duration-200"
                >
                  Yes, Generate
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BillGenerator; 