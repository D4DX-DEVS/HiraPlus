import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { ExclamationTriangleIcon, PencilIcon, TrashIcon, PlusIcon } from '@heroicons/react/24/outline';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import ConfirmDialog from '../components/ConfirmDialog';
import { TableSkeleton } from '../components/SkeletonLoaders';
import { Document, Page, Text, View, StyleSheet, Font, Image } from '@react-pdf/renderer';

// Helper function to get department share percentage based on department name
const getDepartmentShareForDept = (departmentName, defaultShare) => {
  if (!departmentName) return defaultShare;
  
  const deptName = departmentName.toLowerCase().trim();
  
  // GIO and Solidarity departments: 0% department share (employees pay 100%)
  if (deptName === 'gio' || deptName === 'solidarity') {
    return 0;
  }
  
  // All other departments: use the provided default share
  return defaultShare;
};

// Define styles for PDF with updated styling
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 30,
  },
  header: {
    fontSize: 12,
    marginBottom: 3,
    textAlign: 'center',
    fontWeight: 'bold',
    color: '#059669', // App theme green
  },
  section: {
    margin: 3,
    padding: 3,
  },
  table: {
    display: 'table',
    width: 'auto',
    marginVertical: 3,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    borderBottomStyle: 'solid',
    alignItems: 'center',
    minHeight: 25,
    paddingVertical: 4,
  },
  tableHeader: {
    backgroundColor: '#F0FDF4', // Light green background
    borderBottomWidth: 2,
    borderBottomColor: '#059669', // App theme green
  },
  tableCell: {
    flex: 1,
    fontSize: 9,
    padding: 3,
    textAlign: 'left',
  },
  tableCellRight: {
    flex: 1,
    fontSize: 9,
    padding: 3,
    textAlign: 'right',
  },
  tableCellCompact: {
    flex: 1,
    fontSize: 9,
    padding: 2,
    textAlign: 'center',
  },
  tableCellRightCompact: {
    flex: 1,
    fontSize: 9,
    padding: 2,
    textAlign: 'right',
  },
  summaryCard: {
    marginVertical: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: '#059669', // App theme green
    borderRadius: 6,
    backgroundColor: '#F0FDF4', // Light green background
  },
  summaryTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#059669', // App theme green
  },
  summaryValue: {
    fontSize: 10,
    color: '#4B5563',
  },
  dateRange: {
    fontSize: 9,
    marginBottom: 3,
    color: '#4B5563',
    textAlign: 'center',
  },
  ratesInfo: {
    fontSize: 10,
    color: '#4B5563',
    marginBottom: 5,
    textAlign: 'center',
  },
  mealCount: {
    fontSize: 8,
    color: '#6B7280',
    marginTop: 1,
  },
  logo: {
    width: 80,
    height: 50,
    marginBottom: 5,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  headerText: {
    flex: 1,
    textAlign: 'center',
  },
  title: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#059669', // App theme green
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 10,
    color: '#4B5563',
  },
  logoContainer: {
    alignItems: 'center',
    marginRight: 15,
  },
  logoText: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#059669',
    textAlign: 'center',
    marginTop: 2,
  },
  totalRow: {
    borderTopWidth: 2,
    borderTopColor: '#374151',
    backgroundColor: '#F3F4F6',
    fontSize: 9,
  },
  totalText: {
    fontSize: 9,
    fontWeight: 'bold',
  },
  verticalLine: {
    borderRightWidth: 1,
    borderRightColor: '#D1D5DB',
    borderRightStyle: 'solid',
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
const BillPDF = ({
  billData,
  rentData,
  guestMealData,
  meetingFoodData,
  departmentBillData,
  dateRange,
  mealRates,
  meetingFoodRates,
  departmentShare,
  totalAmount,
  departmentPayable,
  employeePayable,
  selectedDepartment,
  billType,
  selectedVenue,
  customListData,
}) => {
  try {
    // Validate date range
    if (!dateRange?.startDate || !dateRange?.endDate) {
      console.error('Missing date range');
      return null;
    }

    // Helper to render header section
    const renderHeader = (title) => (
      <View style={styles.headerContainer}>
        <View style={styles.logoContainer}>
          <Image 
            src="/src/assets/HiraPlus.jpg" 
            style={styles.logo}
          />
          <Text style={styles.logoText}>Hira Plus</Text>
        </View>
        <View style={styles.headerText}>
          <Text style={styles.title}>
            {title}
          </Text>
          <Text style={styles.subtitle}>
            FROM: {format(new Date(dateRange.startDate), 'dd/MM/yyyy')} TO: {format(new Date(dateRange.endDate), 'dd/MM/yyyy')}
          </Text>
        </View>
      </View>
    );

    /* ------------- FOOD & CUSTOM LIST (employee-level) ------------- */
    if (billType === 'food' || billType === 'custom') {
      if (!billData?.departments) {
        console.error('Missing bill data');
        return null;
      }

      const headerTitle =
        billType === 'food'
          ? 'HIRA MESS FEE CALCULATION - ALL STAFF'
          : `HIRA MESS FEE CALCULATION - CUSTOM LIST: ${customListData?.title || ''}`;

      return (
        <Document>
          <Page size="A4" style={styles.page}>
            {renderHeader(headerTitle)}

            {/* Employee Details Table */}
            <View style={styles.section}>
              <View style={styles.table}>
                <View style={[styles.tableRow, styles.tableHeader]}>
                  <Text style={[styles.tableCell, { flex: 2 }]}>Name</Text>
                  <Text style={[styles.tableCell, { flex: 1.5 }]}>Dept</Text>
                  <Text style={[styles.tableCellRightCompact, { flex: 1 }]}>B</Text>
                  <Text style={[styles.tableCellRightCompact, { flex: 1 }]}>L</Text>
                  <Text style={[styles.tableCellRightCompact, { flex: 1 }]}>D</Text>
                  <Text style={[styles.tableCellRight, { flex: 1.2 }, styles.verticalLine]}>Total Meals</Text>
                  <Text style={[styles.tableCellRight, { flex: 1.2 }, styles.verticalLine]}>Total Amount</Text>
                  <Text style={[styles.tableCellRight, { flex: 1.2 }, styles.verticalLine]}>Dept. Share</Text>
                  <Text style={[styles.tableCellRight, { flex: 1.2 }]}>Employee Payable</Text>
                </View>

                {(() => {
                  // Get all users and separate into interns and regular employees
                  const allUsers = billData.departments
                    .filter((dept) => !selectedDepartment || dept.department === selectedDepartment)
                    .map((dept) => dept.users.map((user) => ({ ...user, parentDepartment: dept.department })))
                    .flat()
                    .filter((user) => !user.isFreeFood);

                  // Debug logging for PDF generation
                  console.log('PDF Generation - All Users:', allUsers);
                  console.log('PDF Generation - Sample user:', allUsers[0]);

                  // Using real database values for isIntern field
                  console.log('PDF Generation - Using real isIntern values from database');

                  const interns = allUsers.filter(user => user.isIntern === true);
                  const regularEmployees = allUsers.filter(user => user.isIntern !== true);
                  
                  console.log('PDF - Interns found:', interns.length);
                  console.log('PDF - Regular employees found:', regularEmployees.length);

                  const renderUser = (user, index, isIntern = false) => {
                    const breakfastAmount = (user.breakfastCount || 0) * mealRates.breakfast;
                    const lunchAmount = (user.lunchCount || 0) * mealRates.lunch;
                    const dinnerAmount = (user.dinnerCount || 0) * mealRates.dinner;
                    const totalMealAmount = breakfastAmount + lunchAmount + dinnerAmount;
                    const totalMeals =
                      (user.breakfastCount || 0) + (user.lunchCount || 0) + (user.dinnerCount || 0);
                    
                    // For interns: 100% department share, 0% employee share
                    // For regular employees: use department-specific share percentage
                    const userDeptName = user.department || user.parentDepartment || '';
                    const userDeptShare = isIntern ? 100 : getDepartmentShareForDept(userDeptName, departmentShare);
                    const deptShareCalc = (totalMealAmount * userDeptShare) / 100;
                    const empPayableCalc = totalMealAmount - deptShareCalc;

                    return (
                      <View key={`${user.userId}-${index}-${isIntern ? 'intern' : 'regular'}`} style={[styles.tableRow, isIntern && { backgroundColor: '#FEF3C7' }]}>
                        <Text style={[styles.tableCell, { flex: 2 }]}>{user.name || 'N/A'}{isIntern ? ' (Intern)' : ''}</Text>
                        <Text style={[styles.tableCell, { flex: 1.5 }]}>{
                          user.department || user.parentDepartment || 'N/A'
                        }</Text>
                        <Text style={[styles.tableCellRightCompact, { flex: 1 }]}>{user.breakfastCount || 0}</Text>
                        <Text style={[styles.tableCellRightCompact, { flex: 1 }]}>{user.lunchCount || 0}</Text>
                        <Text style={[styles.tableCellRightCompact, { flex: 1 }]}>{user.dinnerCount || 0}</Text>
                        <Text style={[styles.tableCellRight, { flex: 1.2 }, styles.verticalLine]}>{totalMeals}</Text>
                        <Text style={[styles.tableCellRight, { flex: 1.2 }, styles.verticalLine]}>{totalMealAmount.toFixed(2)}</Text>
                        <Text style={[styles.tableCellRight, { flex: 1.2 }, styles.verticalLine]}>{deptShareCalc.toFixed(2)}</Text>
                        <Text style={[styles.tableCellRight, { flex: 1.2 }]}>{empPayableCalc.toFixed(2)}</Text>
                      </View>
                    );
                  };

                  return (
                    <>
                      {/* Render interns first */}
                      {interns.length > 0 && (
                        <>
                          <View style={[styles.tableRow, { backgroundColor: '#F59E0B', borderTopWidth: 2, borderTopColor: '#D97706' }]}>
                            <Text style={[styles.tableCell, { flex: 9, fontWeight: 'bold', fontSize: 12, color: 'white', textAlign: 'center' }]}>
                              INTERNS ({interns.length} students) - 100% Department Share
                            </Text>
                          </View>
                          {interns.map((user, index) => renderUser(user, index, true))}
                        </>
                      )}
                      
                      {/* Render regular employees */}
                      {regularEmployees.length > 0 && (
                        <>
                          {interns.length > 0 && (
                                                      <View style={[styles.tableRow, { backgroundColor: '#6B7280', borderTopWidth: 2, borderTopColor: '#4B5563' }]}>
                            <Text style={[styles.tableCell, { flex: 9, fontWeight: 'bold', fontSize: 12, color: 'white', textAlign: 'center' }]}>
                              REGULAR EMPLOYEES ({regularEmployees.length} staff) - {getDepartmentShareForDept(allUsers[0]?.department || allUsers[0]?.parentDepartment, departmentShare)}% Department Share
                            </Text>
                          </View>
                          )}
                          {regularEmployees.map((user, index) => renderUser(user, index, false))}
                        </>
                      )}
                    </>
                  );
                })()}

                {/* Total Row for Food/Custom Bills */}
                {(() => {
                  const allUsers = billData.departments
                    .filter((dept) => !selectedDepartment || dept.department === selectedDepartment)
                    .map((dept) => dept.users.map((user) => ({ ...user, parentDepartment: dept.department })))
                                      .flat()
                  .filter((user) => !user.isFreeFood);
                  
                  // Using real database values for isIntern field  
                  console.log('Total Calculation - Using real isIntern values from database');

                  // Separate interns from regular employees
                  const interns = allUsers.filter(user => user.isIntern === true);
                  const regularEmployees = allUsers.filter(user => user.isIntern !== true);

                  console.log('Total Calculation - Interns:', interns.length, 'Regular:', regularEmployees.length);
                  
                  const totalBreakfast = allUsers.reduce((sum, user) => sum + (user.breakfastCount || 0), 0);
                  const totalLunch = allUsers.reduce((sum, user) => sum + (user.lunchCount || 0), 0);
                  const totalDinner = allUsers.reduce((sum, user) => sum + (user.dinnerCount || 0), 0);
                  const totalMealsCount = totalBreakfast + totalLunch + totalDinner;
                  
                  // Calculate separate totals for interns and regular employees
                  const internTotal = interns.reduce((sum, user) => {
                    const userTotal = (user.breakfastCount || 0) * mealRates.breakfast +
                                    (user.lunchCount || 0) * mealRates.lunch +
                                    (user.dinnerCount || 0) * mealRates.dinner;
                    return sum + userTotal;
                  }, 0);
                  
                  const regularTotal = regularEmployees.reduce((sum, user) => {
                    const userTotal = (user.breakfastCount || 0) * mealRates.breakfast +
                                    (user.lunchCount || 0) * mealRates.lunch +
                                    (user.dinnerCount || 0) * mealRates.dinner;
                    return sum + userTotal;
                  }, 0);
                  
                  const grandTotal = internTotal + regularTotal;
                  
                  // Calculate department and employee shares with different ratios
                  const internDeptShare = internTotal; // 100% for interns
                  const internEmpShare = 0; // 0% for interns
                  
                  // Calculate regular employee share based on department-specific policies
                  let regularDeptShare = 0;
                  let regularEmpShare = 0;
                  
                  regularEmployees.forEach(user => {
                    const userTotal = (user.breakfastCount || 0) * mealRates.breakfast +
                                    (user.lunchCount || 0) * mealRates.lunch +
                                    (user.dinnerCount || 0) * mealRates.dinner;
                    const userDeptName = user.department || user.parentDepartment || '';
                    const userDeptShare = getDepartmentShareForDept(userDeptName, departmentShare);
                    const userDeptAmount = (userTotal * userDeptShare) / 100;
                    const userEmpAmount = userTotal - userDeptAmount;
                    
                    regularDeptShare += userDeptAmount;
                    regularEmpShare += userEmpAmount;
                  });
                  
                  const totalDeptShare = internDeptShare + regularDeptShare;
                  const totalEmpPayable = internEmpShare + regularEmpShare;

                  return (
                    <View style={[styles.tableRow, styles.totalRow]}>
                      <Text style={[styles.tableCell, { flex: 2, fontWeight: 'bold' }, styles.totalText]}>TOTAL ({allUsers.length} )</Text>
                      <Text style={[styles.tableCell, { flex: 1.5, fontWeight: 'bold' }, styles.totalText]}>-</Text>
                      <Text style={[styles.tableCellRightCompact, { flex: 1, fontWeight: 'bold' }, styles.totalText]}>{totalBreakfast}</Text>
                      <Text style={[styles.tableCellRightCompact, { flex: 1, fontWeight: 'bold' }, styles.totalText]}>{totalLunch}</Text>
                      <Text style={[styles.tableCellRightCompact, { flex: 1, fontWeight: 'bold' }, styles.totalText]}>{totalDinner}</Text>
                      <Text style={[styles.tableCellRight, { flex: 1.2, fontWeight: 'bold' }, styles.totalText, styles.verticalLine]}>{totalMealsCount}</Text>
                      <Text style={[styles.tableCellRight, { flex: 1.2, fontWeight: 'bold' }, styles.totalText, styles.verticalLine]}>{grandTotal.toFixed(2)}</Text>
                      <Text style={[styles.tableCellRight, { flex: 1.2, fontWeight: 'bold' }, styles.totalText, styles.verticalLine]}>{totalDeptShare.toFixed(2)}</Text>
                      <Text style={[styles.tableCellRight, { flex: 1.2, fontWeight: 'bold' }, styles.totalText]}>{totalEmpPayable.toFixed(2)}</Text>
                    </View>
                  );
                })()}
              </View>
            </View>
          </Page>
        </Document>
      );
    }

    /* --------------------- VENUE RENT -------------------- */
    if (billType === 'rent') {
      if (!rentData?.departments) {
        console.error('Missing rent data');
        return null;
      }

      const headerTitle = selectedVenue
        ? `HIRA VENUE RENT BILL - ${selectedVenue}`
        : 'HIRA VENUE RENT BILL - ALL VENUES';

      return (
        <Document>
          <Page size="A4" style={styles.page}>
            {renderHeader(headerTitle)}
            <View style={styles.section}>
              <View style={styles.table}>
                <View style={[styles.tableRow, styles.tableHeader]}>
                  <Text style={[styles.tableCell, { flex: 2 }]}>Department</Text>
                  <Text style={[styles.tableCellRight, { flex: 1 }]}>Meetings</Text>
                  <Text style={[styles.tableCellRight, { flex: 1 }]}>Aud.</Text>
                  <Text style={[styles.tableCellRight, { flex: 1 }]}>Conf.</Text>
                  <Text style={[styles.tableCellRight, { flex: 1 }]}>Mtg Sp.</Text>
                  <Text style={[styles.tableCellRight, { flex: 1.2 }]}>Amount</Text>
                </View>
                {rentData.departments
                  .filter((d) => !selectedDepartment || d.department === selectedDepartment)
                  .map((d, idx) => (
                    <View key={idx} style={styles.tableRow}>
                      <Text style={[styles.tableCell, { flex: 2 }]}>{d.department}</Text>
                      <Text style={[styles.tableCellRight, { flex: 1 }]}>{d.meetingCount || 0}</Text>
                      <Text style={[styles.tableCellRight, { flex: 1 }]}>{d.auditoriumCount || 0}</Text>
                      <Text style={[styles.tableCellRight, { flex: 1 }]}>{d.conferenceHallCount || 0}</Text>
                      <Text style={[styles.tableCellRight, { flex: 1 }]}>{d.meetingSpaceCount || 0}</Text>
                      <Text style={[styles.tableCellRight, { flex: 1.2 }]}>{(d.amount || 0).toFixed(2)}</Text>
                    </View>
                  ))}

                {/* Total Row for Rent Bills */}
                {(() => {
                  const filteredDepts = rentData.departments.filter((d) => !selectedDepartment || d.department === selectedDepartment);
                  const totalMeetings = filteredDepts.reduce((sum, d) => sum + (d.meetingCount || 0), 0);
                  const totalAuditorium = filteredDepts.reduce((sum, d) => sum + (d.auditoriumCount || 0), 0);
                  const totalConference = filteredDepts.reduce((sum, d) => sum + (d.conferenceHallCount || 0), 0);
                  const totalMeetingSpace = filteredDepts.reduce((sum, d) => sum + (d.meetingSpaceCount || 0), 0);
                  const totalAmount = filteredDepts.reduce((sum, d) => sum + (d.amount || 0), 0);

                  return (
                    <View style={[styles.tableRow, { borderTopWidth: 2, borderTopColor: '#374151', backgroundColor: '#F3F4F6' }]}>
                      <Text style={[styles.tableCell, { flex: 2, fontWeight: 'bold', fontSize: 12 }]}>TOTAL ({filteredDepts.length} departments)</Text>
                      <Text style={[styles.tableCellRight, { flex: 1, fontWeight: 'bold', fontSize: 12 }]}>{totalMeetings}</Text>
                      <Text style={[styles.tableCellRight, { flex: 1, fontWeight: 'bold', fontSize: 12 }]}>{totalAuditorium}</Text>
                      <Text style={[styles.tableCellRight, { flex: 1, fontWeight: 'bold', fontSize: 12 }]}>{totalConference}</Text>
                      <Text style={[styles.tableCellRight, { flex: 1, fontWeight: 'bold', fontSize: 12 }]}>{totalMeetingSpace}</Text>
                      <Text style={[styles.tableCellRight, { flex: 1.2, fontWeight: 'bold', fontSize: 12 }]}>{totalAmount.toFixed(2)}</Text>
                    </View>
                  );
                })()}
              </View>
            </View>
          </Page>
        </Document>
      );
    }

    /* --------------------- GUEST MEALS -------------------- */
    if (billType === 'guest') {
      if (!guestMealData?.departments) {
        console.error('Missing guest meal data');
        return null;
      }

      return (
        <Document>
          <Page size="A4" style={styles.page}>
            {renderHeader('HIRA GUEST MEAL BILL')}
            <View style={styles.section}>
              <View style={styles.table}>
                <View style={[styles.tableRow, styles.tableHeader]}>
                  <Text style={[styles.tableCell, { flex: 2 }]}>Department</Text>
                  <Text style={[styles.tableCellRight, { flex: 1 }]}>B</Text>
                  <Text style={[styles.tableCellRight, { flex: 1 }]}>L</Text>
                  <Text style={[styles.tableCellRight, { flex: 1 }]}>D</Text>
                  <Text style={[styles.tableCellRight, { flex: 1.2 }]}>Amount</Text>
                </View>
                {guestMealData.departments
                  .filter((d) => !selectedDepartment || d.department === selectedDepartment)
                  .map((d, idx) => {
                    const amt =
                      d.breakfastCount * mealRates.breakfast +
                      d.lunchCount * mealRates.lunch +
                      d.dinnerCount * mealRates.dinner;
                    return (
                      <View key={idx} style={styles.tableRow}>
                        <Text style={[styles.tableCell, { flex: 2 }]}>{d.department}</Text>
                        <Text style={[styles.tableCellRight, { flex: 1 }]}>{d.breakfastCount || 0}</Text>
                        <Text style={[styles.tableCellRight, { flex: 1 }]}>{d.lunchCount || 0}</Text>
                        <Text style={[styles.tableCellRight, { flex: 1 }]}>{d.dinnerCount || 0}</Text>
                        <Text style={[styles.tableCellRight, { flex: 1.2 }]}>{amt.toFixed(2)}</Text>
                      </View>
                    );
                  })}

                {/* Total Row for Guest Meals */}
                {(() => {
                  const filteredDepts = guestMealData.departments.filter((d) => !selectedDepartment || d.department === selectedDepartment);
                  const totalBreakfast = filteredDepts.reduce((sum, d) => sum + (d.breakfastCount || 0), 0);
                  const totalLunch = filteredDepts.reduce((sum, d) => sum + (d.lunchCount || 0), 0);
                  const totalDinner = filteredDepts.reduce((sum, d) => sum + (d.dinnerCount || 0), 0);
                  const totalAmount = filteredDepts.reduce((sum, d) => {
                    return sum + (d.breakfastCount * mealRates.breakfast + d.lunchCount * mealRates.lunch + d.dinnerCount * mealRates.dinner);
                  }, 0);

                  return (
                    <View style={[styles.tableRow, { borderTopWidth: 2, borderTopColor: '#374151', backgroundColor: '#F3F4F6' }]}>
                      <Text style={[styles.tableCell, { flex: 2, fontWeight: 'bold', fontSize: 12 }]}>TOTAL ({filteredDepts.length} departments)</Text>
                      <Text style={[styles.tableCellRight, { flex: 1, fontWeight: 'bold', fontSize: 12 }]}>{totalBreakfast}</Text>
                      <Text style={[styles.tableCellRight, { flex: 1, fontWeight: 'bold', fontSize: 12 }]}>{totalLunch}</Text>
                      <Text style={[styles.tableCellRight, { flex: 1, fontWeight: 'bold', fontSize: 12 }]}>{totalDinner}</Text>
                      <Text style={[styles.tableCellRight, { flex: 1.2, fontWeight: 'bold', fontSize: 12 }]}>{totalAmount.toFixed(2)}</Text>
                    </View>
                  );
                })()}
              </View>
            </View>
          </Page>
        </Document>
      );
    }

    /* --------------------- MEETING FOOD -------------------- */
    if (billType === 'meeting') {
      if (!meetingFoodData?.departments) {
        console.error('Missing meeting food data');
        return null;
      }

      return (
        <Document>
          <Page size="A4" style={styles.page}>
            {renderHeader('HIRA MEETING FOOD BILL')}
            <View style={styles.section}>
              <View style={styles.table}>
                <View style={[styles.tableRow, styles.tableHeader]}>
                  <Text style={[styles.tableCell, { flex: 2 }]}>Department</Text>
                  <Text style={[styles.tableCellRight, { flex: 1 }]}>B</Text>
                  <Text style={[styles.tableCellRight, { flex: 1 }]}>L</Text>
                  <Text style={[styles.tableCellRight, { flex: 1 }]}>D</Text>
                  <Text style={[styles.tableCellRight, { flex: 1 }]}>MS</Text>
                  <Text style={[styles.tableCellRight, { flex: 1 }]}>MT</Text>
                  <Text style={[styles.tableCellRight, { flex: 1 }]}>ES</Text>
                  <Text style={[styles.tableCellRight, { flex: 1 }]}>ET</Text>
                  <Text style={[styles.tableCellRight, { flex: 1.2 }]}>Amount</Text>
                </View>
                {meetingFoodData.departments
                  .filter((d) => !selectedDepartment || d.department === selectedDepartment)
                  .map((d, idx) => {
                    const amt =
                      (d.breakfast || 0) * meetingFoodRates.breakfast +
                      (d.lunch || 0) * meetingFoodRates.lunch +
                      (d.dinner || 0) * meetingFoodRates.dinner +
                      (d.morningSnacksCount || 0) * meetingFoodRates.morningSnacks +
                      (d.morningTeaCount || 0) * meetingFoodRates.morningTea +
                      (d.eveningSnacksCount || 0) * meetingFoodRates.eveningSnacks +
                      (d.eveningTeaCount || 0) * meetingFoodRates.eveningTea;
                    return (
                      <View key={idx} style={styles.tableRow}>
                        <Text style={[styles.tableCell, { flex: 2 }]}>{d.department}</Text>
                        <Text style={[styles.tableCellRight, { flex: 1 }]}>{d.breakfast || 0}</Text>
                        <Text style={[styles.tableCellRight, { flex: 1 }]}>{d.lunch || 0}</Text>
                        <Text style={[styles.tableCellRight, { flex: 1 }]}>{d.dinner || 0}</Text>
                        <Text style={[styles.tableCellRight, { flex: 1 }]}>{d.morningSnacksCount || 0}</Text>
                        <Text style={[styles.tableCellRight, { flex: 1 }]}>{d.morningTeaCount || 0}</Text>
                        <Text style={[styles.tableCellRight, { flex: 1 }]}>{d.eveningSnacksCount || 0}</Text>
                        <Text style={[styles.tableCellRight, { flex: 1 }]}>{d.eveningTeaCount || 0}</Text>
                        <Text style={[styles.tableCellRight, { flex: 1.2 }]}>{amt.toFixed(2)}</Text>
                      </View>
                    );
                  })}

                {/* Total Row for Meeting Food */}
                {(() => {
                  const filteredDepts = meetingFoodData.departments.filter((d) => !selectedDepartment || d.department === selectedDepartment);
                  const totalBreakfast = filteredDepts.reduce((sum, d) => sum + (d.breakfast || 0), 0);
                  const totalLunch = filteredDepts.reduce((sum, d) => sum + (d.lunch || 0), 0);
                  const totalDinner = filteredDepts.reduce((sum, d) => sum + (d.dinner || 0), 0);
                  const totalMorningSnacks = filteredDepts.reduce((sum, d) => sum + (d.morningSnacksCount || 0), 0);
                  const totalMorningTea = filteredDepts.reduce((sum, d) => sum + (d.morningTeaCount || 0), 0);
                  const totalEveningSnacks = filteredDepts.reduce((sum, d) => sum + (d.eveningSnacksCount || 0), 0);
                  const totalEveningTea = filteredDepts.reduce((sum, d) => sum + (d.eveningTeaCount || 0), 0);
                  const totalAmount = filteredDepts.reduce((sum, d) => {
                    return sum + (
                      (d.breakfast || 0) * meetingFoodRates.breakfast +
                      (d.lunch || 0) * meetingFoodRates.lunch +
                      (d.dinner || 0) * meetingFoodRates.dinner +
                      (d.morningSnacksCount || 0) * meetingFoodRates.morningSnacks +
                      (d.morningTeaCount || 0) * meetingFoodRates.morningTea +
                      (d.eveningSnacksCount || 0) * meetingFoodRates.eveningSnacks +
                      (d.eveningTeaCount || 0) * meetingFoodRates.eveningTea
                    );
                  }, 0);

                  return (
                    <View style={[styles.tableRow, { borderTopWidth: 2, borderTopColor: '#374151', backgroundColor: '#F3F4F6' }]}>
                      <Text style={[styles.tableCell, { flex: 2, fontWeight: 'bold', fontSize: 12 }]}>TOTAL ({filteredDepts.length} departments)</Text>
                      <Text style={[styles.tableCellRight, { flex: 1, fontWeight: 'bold', fontSize: 12 }]}>{totalBreakfast}</Text>
                      <Text style={[styles.tableCellRight, { flex: 1, fontWeight: 'bold', fontSize: 12 }]}>{totalLunch}</Text>
                      <Text style={[styles.tableCellRight, { flex: 1, fontWeight: 'bold', fontSize: 12 }]}>{totalDinner}</Text>
                      <Text style={[styles.tableCellRight, { flex: 1, fontWeight: 'bold', fontSize: 12 }]}>{totalMorningSnacks}</Text>
                      <Text style={[styles.tableCellRight, { flex: 1, fontWeight: 'bold', fontSize: 12 }]}>{totalMorningTea}</Text>
                      <Text style={[styles.tableCellRight, { flex: 1, fontWeight: 'bold', fontSize: 12 }]}>{totalEveningSnacks}</Text>
                      <Text style={[styles.tableCellRight, { flex: 1, fontWeight: 'bold', fontSize: 12 }]}>{totalEveningTea}</Text>
                      <Text style={[styles.tableCellRight, { flex: 1.2, fontWeight: 'bold', fontSize: 12 }]}>{totalAmount.toFixed(2)}</Text>
                    </View>
                  );
                })()}
              </View>
            </View>
          </Page>
        </Document>
      );
    }

    /* ------------------- DEPARTMENT SUMMARY ------------------ */
    if (billType === 'department') {
      if (!departmentBillData?.departments) {
        console.error('Missing department bill data');
        return null;
      }

      return (
        <Document>
          <Page size="A4" style={styles.page}>
            {renderHeader('HIRA DEPARTMENT BILL SUMMARY')}
            <View style={styles.section}>
              <View style={styles.table}>
                <View style={[styles.tableRow, styles.tableHeader]}>
                  <Text style={[styles.tableCell, { flex: 2 }]}>Department</Text>
                  <Text style={[styles.tableCellRight, { flex: 1.2 }]}>Food (75%)</Text>
                  <Text style={[styles.tableCellRight, { flex: 1.2 }]}>Rent</Text>
                  <Text style={[styles.tableCellRight, { flex: 1.2 }]}>Meeting</Text>
                  <Text style={[styles.tableCellRight, { flex: 1.2 }]}>Guest</Text>
                  <Text style={[styles.tableCellRight, { flex: 1.2 }]}>Total</Text>
                </View>
                {departmentBillData.departments
                  .filter((d) => !selectedDepartment || d.department === selectedDepartment)
                  .map((d, idx) => (
                    <View key={idx} style={styles.tableRow}>
                      <Text style={[styles.tableCell, { flex: 2 }]}>{d.department}</Text>
                      <Text style={[styles.tableCellRight, { flex: 1.2 }]}>{d.foodShare?.toFixed(2)}</Text>
                      <Text style={[styles.tableCellRight, { flex: 1.2 }]}>{d.rentTotal?.toFixed(2)}</Text>
                      <Text style={[styles.tableCellRight, { flex: 1.2 }]}>{d.meetingFoodTotal?.toFixed(2)}</Text>
                      <Text style={[styles.tableCellRight, { flex: 1.2 }]}>{d.guestMealTotal?.toFixed(2)}</Text>
                      <Text style={[styles.tableCellRight, { flex: 1.2 }]}>{d.total?.toFixed(2)}</Text>
                    </View>
                  ))}

                {/* Total Row for Department Summary */}
                {(() => {
                  const filteredDepts = departmentBillData.departments.filter((d) => !selectedDepartment || d.department === selectedDepartment);
                  const totalFoodShare = filteredDepts.reduce((sum, d) => sum + (d.foodShare || 0), 0);
                  const totalRent = filteredDepts.reduce((sum, d) => sum + (d.rentTotal || 0), 0);
                  const totalMeetingFood = filteredDepts.reduce((sum, d) => sum + (d.meetingFoodTotal || 0), 0);
                  const totalGuestMeals = filteredDepts.reduce((sum, d) => sum + (d.guestMealTotal || 0), 0);
                  const grandTotal = filteredDepts.reduce((sum, d) => sum + (d.total || 0), 0);

                  return (
                    <View style={[styles.tableRow, { borderTopWidth: 2, borderTopColor: '#374151', backgroundColor: '#F3F4F6' }]}>
                      <Text style={[styles.tableCell, { flex: 2, fontWeight: 'bold', fontSize: 12 }]}>TOTAL ({filteredDepts.length} departments)</Text>
                      <Text style={[styles.tableCellRight, { flex: 1.2, fontWeight: 'bold', fontSize: 12 }]}>{totalFoodShare.toFixed(2)}</Text>
                      <Text style={[styles.tableCellRight, { flex: 1.2, fontWeight: 'bold', fontSize: 12 }]}>{totalRent.toFixed(2)}</Text>
                      <Text style={[styles.tableCellRight, { flex: 1.2, fontWeight: 'bold', fontSize: 12 }]}>{totalMeetingFood.toFixed(2)}</Text>
                      <Text style={[styles.tableCellRight, { flex: 1.2, fontWeight: 'bold', fontSize: 12 }]}>{totalGuestMeals.toFixed(2)}</Text>
                      <Text style={[styles.tableCellRight, { flex: 1.2, fontWeight: 'bold', fontSize: 12 }]}>{grandTotal.toFixed(2)}</Text>
                    </View>
                  );
                })()}
              </View>
            </View>
          </Page>
        </Document>
      );
    }

    console.error('Unsupported bill type');
    return null;
  } catch (error) {
    console.error('Error rendering PDF:', error);
    return null;
  }
};

// New PDF component for other bill types (Rent, Guest, Meeting, Department)
const SummaryPDF = ({
  billType,
  dateRange,
  rentData,
  guestMealData,
  meetingFoodData,
  departmentBillData,
  mealRates,
  meetingFoodRates,
  selectedDepartment,
  selectedVenue,
}) => {
  try {
    if (!dateRange?.startDate || !dateRange?.endDate) {
      console.error('Missing date range');
      return null;
    }

    // Helper to render header section
    const renderHeader = (title) => (
      <View style={styles.headerContainer}>
        <View style={styles.logoContainer}>
          <Image 
            src="/src/assets/HiraPlus.jpg" 
            style={styles.logo}
          />
          <Text style={styles.logoText}>Hira Plus</Text>
        </View>
        <View style={styles.headerText}>
          <Text style={styles.title}>
            {title}
          </Text>
          <Text style={styles.subtitle}>
            FROM: {format(new Date(dateRange.startDate), 'dd/MM/yyyy')} TO: {format(new Date(dateRange.endDate), 'dd/MM/yyyy')}
          </Text>
        </View>
      </View>
    );

    /* --------------------- RENT --------------------- */
    if (billType === 'rent') {
      if (!rentData?.departments) return null;
      const headerTitle = selectedVenue
        ? `HIRA VENUE RENT BILL - ${selectedVenue}`
        : 'HIRA VENUE RENT BILL - ALL VENUES';

      return (
        <Document>
          <Page size="A4" style={styles.page}>
            {renderHeader(headerTitle)}
            <View style={styles.section}>
              <View style={styles.table}>
                <View style={[styles.tableRow, styles.tableHeader]}>
                  <Text style={[styles.tableCell, { flex: 2 }]}>Department</Text>
                  <Text style={[styles.tableCellRight, { flex: 1 }]}>Meetings</Text>
                  <Text style={[styles.tableCellRight, { flex: 1 }]}>Aud.</Text>
                  <Text style={[styles.tableCellRight, { flex: 1 }]}>Conf.</Text>
                  <Text style={[styles.tableCellRight, { flex: 1 }]}>Mtg Sp.</Text>
                  <Text style={[styles.tableCellRight, { flex: 1.2 }]}>Amount</Text>
                </View>
                {rentData.departments
                  .filter((d) => !selectedDepartment || d.department === selectedDepartment)
                  .map((d, idx) => (
                    <View key={idx} style={styles.tableRow}>
                      <Text style={[styles.tableCell, { flex: 2 }]}>{d.department}</Text>
                      <Text style={[styles.tableCellRight, { flex: 1 }]}>{d.meetingCount || 0}</Text>
                      <Text style={[styles.tableCellRight, { flex: 1 }]}>{d.auditoriumCount || 0}</Text>
                      <Text style={[styles.tableCellRight, { flex: 1 }]}>{d.conferenceHallCount || 0}</Text>
                      <Text style={[styles.tableCellRight, { flex: 1 }]}>{d.meetingSpaceCount || 0}</Text>
                      <Text style={[styles.tableCellRight, { flex: 1.2 }]}>{(d.amount || 0).toFixed(2)}</Text>
                    </View>
                  ))}

                {/* Total Row for Rent Bills */}
                {(() => {
                  const filteredDepts = rentData.departments.filter((d) => !selectedDepartment || d.department === selectedDepartment);
                  const totalMeetings = filteredDepts.reduce((sum, d) => sum + (d.meetingCount || 0), 0);
                  const totalAuditorium = filteredDepts.reduce((sum, d) => sum + (d.auditoriumCount || 0), 0);
                  const totalConference = filteredDepts.reduce((sum, d) => sum + (d.conferenceHallCount || 0), 0);
                  const totalMeetingSpace = filteredDepts.reduce((sum, d) => sum + (d.meetingSpaceCount || 0), 0);
                  const totalAmount = filteredDepts.reduce((sum, d) => sum + (d.amount || 0), 0);

                  return (
                    <View style={[styles.tableRow, { borderTopWidth: 2, borderTopColor: '#374151', backgroundColor: '#F3F4F6' }]}>
                      <Text style={[styles.tableCell, { flex: 2, fontWeight: 'bold', fontSize: 12 }]}>TOTAL ({filteredDepts.length} departments)</Text>
                      <Text style={[styles.tableCellRight, { flex: 1, fontWeight: 'bold', fontSize: 12 }]}>{totalMeetings}</Text>
                      <Text style={[styles.tableCellRight, { flex: 1, fontWeight: 'bold', fontSize: 12 }]}>{totalAuditorium}</Text>
                      <Text style={[styles.tableCellRight, { flex: 1, fontWeight: 'bold', fontSize: 12 }]}>{totalConference}</Text>
                      <Text style={[styles.tableCellRight, { flex: 1, fontWeight: 'bold', fontSize: 12 }]}>{totalMeetingSpace}</Text>
                      <Text style={[styles.tableCellRight, { flex: 1.2, fontWeight: 'bold', fontSize: 12 }]}>{totalAmount.toFixed(2)}</Text>
                    </View>
                  );
                })()}
              </View>
            </View>
          </Page>
        </Document>
      );
    }

    /* --------------------- GUEST MEALS --------------------- */
    if (billType === 'guest') {
      if (!guestMealData?.departments) return null;

      return (
        <Document>
          <Page size="A4" style={styles.page}>
            {renderHeader('HIRA GUEST MEAL BILL')}
            <View style={styles.section}>
              <View style={styles.table}>
                <View style={[styles.tableRow, styles.tableHeader]}>
                  <Text style={[styles.tableCell, { flex: 2 }]}>Department</Text>
                  <Text style={[styles.tableCellRight, { flex: 1 }]}>B</Text>
                  <Text style={[styles.tableCellRight, { flex: 1 }]}>L</Text>
                  <Text style={[styles.tableCellRight, { flex: 1 }]}>D</Text>
                  <Text style={[styles.tableCellRight, { flex: 1.2 }]}>Amount</Text>
                </View>
                {guestMealData.departments
                  .filter((d) => !selectedDepartment || d.department === selectedDepartment)
                  .map((d, idx) => {
                    const amt =
                      d.breakfastCount * mealRates.breakfast +
                      d.lunchCount * mealRates.lunch +
                      d.dinnerCount * mealRates.dinner;
                    return (
                      <View key={idx} style={styles.tableRow}>
                        <Text style={[styles.tableCell, { flex: 2 }]}>{d.department}</Text>
                        <Text style={[styles.tableCellRight, { flex: 1 }]}>{d.breakfastCount || 0}</Text>
                        <Text style={[styles.tableCellRight, { flex: 1 }]}>{d.lunchCount || 0}</Text>
                        <Text style={[styles.tableCellRight, { flex: 1 }]}>{d.dinnerCount || 0}</Text>
                        <Text style={[styles.tableCellRight, { flex: 1.2 }]}>{amt.toFixed(2)}</Text>
                      </View>
                    );
                  })}

                {/* Total Row for Guest Meals */}
                {(() => {
                  const filteredDepts = guestMealData.departments.filter((d) => !selectedDepartment || d.department === selectedDepartment);
                  const totalBreakfast = filteredDepts.reduce((sum, d) => sum + (d.breakfastCount || 0), 0);
                  const totalLunch = filteredDepts.reduce((sum, d) => sum + (d.lunchCount || 0), 0);
                  const totalDinner = filteredDepts.reduce((sum, d) => sum + (d.dinnerCount || 0), 0);
                  const totalAmount = filteredDepts.reduce((sum, d) => {
                    return sum + (d.breakfastCount * mealRates.breakfast + d.lunchCount * mealRates.lunch + d.dinnerCount * mealRates.dinner);
                  }, 0);

                  return (
                    <View style={[styles.tableRow, { borderTopWidth: 2, borderTopColor: '#374151', backgroundColor: '#F3F4F6' }]}>
                      <Text style={[styles.tableCell, { flex: 2, fontWeight: 'bold', fontSize: 12 }]}>TOTAL ({filteredDepts.length} departments)</Text>
                      <Text style={[styles.tableCellRight, { flex: 1, fontWeight: 'bold', fontSize: 12 }]}>{totalBreakfast}</Text>
                      <Text style={[styles.tableCellRight, { flex: 1, fontWeight: 'bold', fontSize: 12 }]}>{totalLunch}</Text>
                      <Text style={[styles.tableCellRight, { flex: 1, fontWeight: 'bold', fontSize: 12 }]}>{totalDinner}</Text>
                      <Text style={[styles.tableCellRight, { flex: 1.2, fontWeight: 'bold', fontSize: 12 }]}>{totalAmount.toFixed(2)}</Text>
                    </View>
                  );
                })()}
              </View>
            </View>
          </Page>
        </Document>
      );
    }

    /* --------------------- MEETING FOOD --------------------- */
    if (billType === 'meeting') {
      if (!meetingFoodData?.departments) return null;

      return (
        <Document>
          <Page size="A4" style={styles.page}>
            {renderHeader('HIRA MEETING FOOD BILL')}
            <View style={styles.section}>
              <View style={styles.table}>
                <View style={[styles.tableRow, styles.tableHeader]}>
                  <Text style={[styles.tableCell, { flex: 2 }]}>Department</Text>
                  <Text style={[styles.tableCellRight, { flex: 1 }]}>B</Text>
                  <Text style={[styles.tableCellRight, { flex: 1 }]}>L</Text>
                  <Text style={[styles.tableCellRight, { flex: 1 }]}>D</Text>
                  <Text style={[styles.tableCellRight, { flex: 1 }]}>MS</Text>
                  <Text style={[styles.tableCellRight, { flex: 1 }]}>MT</Text>
                  <Text style={[styles.tableCellRight, { flex: 1 }]}>ES</Text>
                  <Text style={[styles.tableCellRight, { flex: 1 }]}>ET</Text>
                  <Text style={[styles.tableCellRight, { flex: 1.2 }]}>Amount</Text>
                </View>
                {meetingFoodData.departments
                  .filter((d) => !selectedDepartment || d.department === selectedDepartment)
                  .map((d, idx) => {
                    const amt =
                      (d.breakfast || 0) * meetingFoodRates.breakfast +
                      (d.lunch || 0) * meetingFoodRates.lunch +
                      (d.dinner || 0) * meetingFoodRates.dinner +
                      (d.morningSnacksCount || 0) * meetingFoodRates.morningSnacks +
                      (d.morningTeaCount || 0) * meetingFoodRates.morningTea +
                      (d.eveningSnacksCount || 0) * meetingFoodRates.eveningSnacks +
                      (d.eveningTeaCount || 0) * meetingFoodRates.eveningTea;
                    return (
                      <View key={idx} style={styles.tableRow}>
                        <Text style={[styles.tableCell, { flex: 2 }]}>{d.department}</Text>
                        <Text style={[styles.tableCellRight, { flex: 1 }]}>{d.breakfast || 0}</Text>
                        <Text style={[styles.tableCellRight, { flex: 1 }]}>{d.lunch || 0}</Text>
                        <Text style={[styles.tableCellRight, { flex: 1 }]}>{d.dinner || 0}</Text>
                        <Text style={[styles.tableCellRight, { flex: 1 }]}>{d.morningSnacksCount || 0}</Text>
                        <Text style={[styles.tableCellRight, { flex: 1 }]}>{d.morningTeaCount || 0}</Text>
                        <Text style={[styles.tableCellRight, { flex: 1 }]}>{d.eveningSnacksCount || 0}</Text>
                        <Text style={[styles.tableCellRight, { flex: 1 }]}>{d.eveningTeaCount || 0}</Text>
                        <Text style={[styles.tableCellRight, { flex: 1.2 }]}>{amt.toFixed(2)}</Text>
                      </View>
                    );
                  })}

                {/* Total Row for Meeting Food */}
                {(() => {
                  const filteredDepts = meetingFoodData.departments.filter((d) => !selectedDepartment || d.department === selectedDepartment);
                  const totalBreakfast = filteredDepts.reduce((sum, d) => sum + (d.breakfast || 0), 0);
                  const totalLunch = filteredDepts.reduce((sum, d) => sum + (d.lunch || 0), 0);
                  const totalDinner = filteredDepts.reduce((sum, d) => sum + (d.dinner || 0), 0);
                  const totalMorningSnacks = filteredDepts.reduce((sum, d) => sum + (d.morningSnacksCount || 0), 0);
                  const totalMorningTea = filteredDepts.reduce((sum, d) => sum + (d.morningTeaCount || 0), 0);
                  const totalEveningSnacks = filteredDepts.reduce((sum, d) => sum + (d.eveningSnacksCount || 0), 0);
                  const totalEveningTea = filteredDepts.reduce((sum, d) => sum + (d.eveningTeaCount || 0), 0);
                  const totalAmount = filteredDepts.reduce((sum, d) => {
                    return sum + (
                      (d.breakfast || 0) * meetingFoodRates.breakfast +
                      (d.lunch || 0) * meetingFoodRates.lunch +
                      (d.dinner || 0) * meetingFoodRates.dinner +
                      (d.morningSnacksCount || 0) * meetingFoodRates.morningSnacks +
                      (d.morningTeaCount || 0) * meetingFoodRates.morningTea +
                      (d.eveningSnacksCount || 0) * meetingFoodRates.eveningSnacks +
                      (d.eveningTeaCount || 0) * meetingFoodRates.eveningTea
                    );
                  }, 0);

                  return (
                    <View style={[styles.tableRow, { borderTopWidth: 2, borderTopColor: '#374151', backgroundColor: '#F3F4F6' }]}>
                      <Text style={[styles.tableCell, { flex: 2, fontWeight: 'bold', fontSize: 12 }]}>TOTAL ({filteredDepts.length} departments)</Text>
                      <Text style={[styles.tableCellRight, { flex: 1, fontWeight: 'bold', fontSize: 12 }]}>{totalBreakfast}</Text>
                      <Text style={[styles.tableCellRight, { flex: 1, fontWeight: 'bold', fontSize: 12 }]}>{totalLunch}</Text>
                      <Text style={[styles.tableCellRight, { flex: 1, fontWeight: 'bold', fontSize: 12 }]}>{totalDinner}</Text>
                      <Text style={[styles.tableCellRight, { flex: 1, fontWeight: 'bold', fontSize: 12 }]}>{totalMorningSnacks}</Text>
                      <Text style={[styles.tableCellRight, { flex: 1, fontWeight: 'bold', fontSize: 12 }]}>{totalMorningTea}</Text>
                      <Text style={[styles.tableCellRight, { flex: 1, fontWeight: 'bold', fontSize: 12 }]}>{totalEveningSnacks}</Text>
                      <Text style={[styles.tableCellRight, { flex: 1, fontWeight: 'bold', fontSize: 12 }]}>{totalEveningTea}</Text>
                      <Text style={[styles.tableCellRight, { flex: 1.2, fontWeight: 'bold', fontSize: 12 }]}>{totalAmount.toFixed(2)}</Text>
                    </View>
                  );
                })()}
              </View>
            </View>
          </Page>
        </Document>
      );
    }

    /* --------------------- DEPARTMENT SUMMARY --------------------- */
    if (billType === 'department') {
      if (!departmentBillData?.departments) return null;

      return (
        <Document>
          <Page size="A4" style={styles.page}>
            {renderHeader('HIRA DEPARTMENT BILL SUMMARY')}
            <View style={styles.section}>
              <View style={styles.table}>
                <View style={[styles.tableRow, styles.tableHeader]}>
                  <Text style={[styles.tableCell, { flex: 2 }]}>Department</Text>
                  <Text style={[styles.tableCellRight, { flex: 1.2 }]}>Food (75%)</Text>
                  <Text style={[styles.tableCellRight, { flex: 1.2 }]}>Rent</Text>
                  <Text style={[styles.tableCellRight, { flex: 1.2 }]}>Meeting Food</Text>
                  <Text style={[styles.tableCellRight, { flex: 1.2 }]}>Guest Meals</Text>
                  <Text style={[styles.tableCellRight, { flex: 1.2 }]}>Total</Text>
                </View>
                {departmentBillData.departments
                  .filter((d) => !selectedDepartment || d.department === selectedDepartment)
                  .map((d, idx) => (
                    <View key={idx} style={styles.tableRow}>
                      <Text style={[styles.tableCell, { flex: 2 }]}>{d.department}</Text>
                      <Text style={[styles.tableCellRight, { flex: 1.2 }]}>{d.foodShare?.toFixed(2)}</Text>
                      <Text style={[styles.tableCellRight, { flex: 1.2 }]}>{d.rentTotal?.toFixed(2)}</Text>
                      <Text style={[styles.tableCellRight, { flex: 1.2 }]}>{d.meetingFoodTotal?.toFixed(2)}</Text>
                      <Text style={[styles.tableCellRight, { flex: 1.2 }]}>{d.guestMealTotal?.toFixed(2)}</Text>
                      <Text style={[styles.tableCellRight, { flex: 1.2 }]}>{d.total?.toFixed(2)}</Text>
                    </View>
                  ))}

                {/* Total Row for Department Summary */}
                {(() => {
                  const filteredDepts = departmentBillData.departments.filter((d) => !selectedDepartment || d.department === selectedDepartment);
                  const totalFoodShare = filteredDepts.reduce((sum, d) => sum + (d.foodShare || 0), 0);
                  const totalRent = filteredDepts.reduce((sum, d) => sum + (d.rentTotal || 0), 0);
                  const totalMeetingFood = filteredDepts.reduce((sum, d) => sum + (d.meetingFoodTotal || 0), 0);
                  const totalGuestMeals = filteredDepts.reduce((sum, d) => sum + (d.guestMealTotal || 0), 0);
                  const grandTotal = filteredDepts.reduce((sum, d) => sum + (d.total || 0), 0);

                  return (
                    <View style={[styles.tableRow, { borderTopWidth: 2, borderTopColor: '#374151', backgroundColor: '#F3F4F6' }]}>
                      <Text style={[styles.tableCell, { flex: 2, fontWeight: 'bold', fontSize: 12 }]}>TOTAL ({filteredDepts.length} departments)</Text>
                      <Text style={[styles.tableCellRight, { flex: 1.2, fontWeight: 'bold', fontSize: 12 }]}>{totalFoodShare.toFixed(2)}</Text>
                      <Text style={[styles.tableCellRight, { flex: 1.2, fontWeight: 'bold', fontSize: 12 }]}>{totalRent.toFixed(2)}</Text>
                      <Text style={[styles.tableCellRight, { flex: 1.2, fontWeight: 'bold', fontSize: 12 }]}>{totalMeetingFood.toFixed(2)}</Text>
                      <Text style={[styles.tableCellRight, { flex: 1.2, fontWeight: 'bold', fontSize: 12 }]}>{totalGuestMeals.toFixed(2)}</Text>
                      <Text style={[styles.tableCellRight, { flex: 1.2, fontWeight: 'bold', fontSize: 12 }]}>{grandTotal.toFixed(2)}</Text>
                    </View>
                  );
                })()}
              </View>
            </View>
          </Page>
        </Document>
      );
    }

    return null;
  } catch (err) {
    console.error('Error rendering Summary PDF:', err);
    return null;
  }
};

// Detailed Department PDF showing individual meetings/programs
const DetailedDepartmentPDF = ({
  detailedDepartmentData,
  dateRange,
  mealRates,
  meetingFoodRates,
  selectedDepartment
}) => {
  try {
    if (!detailedDepartmentData?.departments || !dateRange?.startDate || !dateRange?.endDate) {
      console.error('Missing detailed department data or date range');
      return null;
    }

    const headerTitle = selectedDepartment
      ? `DETAILED DEPARTMENT BILL - ${selectedDepartment}`
      : 'DETAILED DEPARTMENT BILLS - ALL DEPARTMENTS';

    const renderHeader = (title) => (
      <View style={styles.headerContainer}>
        <View style={styles.logoContainer}>
          <Image 
            src="/src/assets/HiraPlus.jpg" 
            style={styles.logo}
          />
          <Text style={styles.logoText}>Hira Plus</Text>
        </View>
        <View style={styles.headerText}>
          <Text style={styles.title}>
            {title}
          </Text>
          <Text style={styles.subtitle}>
            FROM: {format(new Date(dateRange.startDate), 'dd/MM/yyyy')} TO: {format(new Date(dateRange.endDate), 'dd/MM/yyyy')}
          </Text>
        </View>
      </View>
    );

    return (
      <Document>
        <Page size="A4" style={styles.page}>
          {renderHeader(headerTitle)}
          
          {detailedDepartmentData.departments
            .filter(dept => !selectedDepartment || dept.department === selectedDepartment)
            .map((dept, deptIndex) => (
              <View key={deptIndex} style={{ marginBottom: 25 }}>
                {/* Department Header */}
                <View style={{ marginBottom: 10, backgroundColor: '#F3F4F6', padding: 8, borderRadius: 4 }}>
                  <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#374151' }}>
                    {dept.department.toUpperCase()}
                  </Text>
                </View>

                {/* Individual Meetings/Programs */}
                {dept.meetings && dept.meetings.length > 0 && (
                  <View style={{ marginBottom: 15 }}>
                    <Text style={{ fontSize: 10, fontWeight: 'bold', marginBottom: 8, color: '#4B5563' }}>
                      MEETINGS & PROGRAMS:
                    </Text>
                    
                    {dept.meetings.map((meeting, meetingIndex) => (
                      <View key={meetingIndex} style={{ marginBottom: 12, paddingLeft: 10 }}>
                        <Text style={{ fontSize: 9, fontWeight: 'bold', marginBottom: 4 }}>
                          {meetingIndex + 1}. {meeting.title}
                        </Text>
                        
                        <View style={{ flexDirection: 'row', marginBottom: 2 }}>
                          <Text style={{ fontSize: 7, flex: 1, color: '#6B7280' }}>
                            Date: {format(new Date(meeting.startDatetime), 'dd/MM/yyyy')}
                          </Text>
                          <Text style={{ fontSize: 7, flex: 1, color: '#6B7280' }}>
                            Time: {format(new Date(meeting.startDatetime), 'HH:mm')} - {format(new Date(meeting.endDatetime), 'HH:mm')}
                          </Text>
                        </View>
                        
                        <View style={{ flexDirection: 'row', marginBottom: 2 }}>
                          <Text style={{ fontSize: 7, flex: 1, color: '#6B7280' }}>
                            Venue: {meeting.hall}
                          </Text>
                          <Text style={{ fontSize: 7, flex: 1, color: '#6B7280' }}>
                            Participants: {meeting.noOfPersons}
                          </Text>
                        </View>

                        {/* Meeting costs breakdown */}
                        <View style={{ flexDirection: 'row', marginTop: 4, paddingTop: 4, borderTopWidth: 1, borderTopColor: '#E5E7EB' }}>
                          <View style={{ flex: 1 }}>
                            <Text style={{ fontSize: 7, color: '#374151' }}>Venue Rent: {meeting.rentAmount.toFixed(2)}</Text>
                            {meeting.foodRequired && (
                              <Text style={{ fontSize: 7, color: '#374151' }}>
                                Food: {meeting.meetingFoodAmount.toFixed(2)}
                                {(meeting.foodCounts.breakfast > 0 || meeting.foodCounts.lunch > 0 || meeting.foodCounts.dinner > 0 ||
                                  meeting.foodCounts.morningSnacksCount > 0 || meeting.foodCounts.morningTeaCount > 0 ||
                                  meeting.foodCounts.eveningSnacksCount > 0 || meeting.foodCounts.eveningTeaCount > 0) && (
                                  <Text style={{ fontSize: 6, color: '#6B7280' }}>
                                    {' '}(B:{meeting.foodCounts.breakfast} L:{meeting.foodCounts.lunch} D:{meeting.foodCounts.dinner} MS:{meeting.foodCounts.morningSnacksCount} MT:{meeting.foodCounts.morningTeaCount} ES:{meeting.foodCounts.eveningSnacksCount} ET:{meeting.foodCounts.eveningTeaCount})
                                  </Text>
                                )}
                              </Text>
                            )}
                          </View>
                          <View style={{ alignItems: 'flex-end' }}>
                            <Text style={{ fontSize: 8, fontWeight: 'bold', color: '#059669' }}>
                              Total: {meeting.totalMeetingAmount.toFixed(2)}
                            </Text>
                          </View>
                        </View>
                      </View>
                    ))}
                  </View>
                )}

                {/* Guest Meals */}
                {dept.guestMeals && dept.guestMeals.length > 0 && (
                  <View style={{ marginBottom: 15 }}>
                    <Text style={{ fontSize: 10, fontWeight: 'bold', marginBottom: 8, color: '#4B5563' }}>
                      GUEST MEALS:
                    </Text>
                    
                    {dept.guestMeals.map((guestMeal, guestIndex) => (
                      <View key={guestIndex} style={{ marginBottom: 8, paddingLeft: 10 }}>
                        <View style={{ flexDirection: 'row', marginBottom: 2 }}>
                          <Text style={{ fontSize: 8, flex: 1 }}>
                            Date: {format(new Date(guestMeal.date), 'dd/MM/yyyy')}
                          </Text>
                          <Text style={{ fontSize: 8, flex: 1 }}>
                            {guestMeal.description}
                          </Text>
                        </View>
                        
                        <View style={{ flexDirection: 'row' }}>
                          <Text style={{ fontSize: 7, flex: 1, color: '#6B7280' }}>
                            B: {guestMeal.breakfastCount}, L: {guestMeal.lunchCount}, D: {guestMeal.dinnerCount}
                          </Text>
                          <Text style={{ fontSize: 8, fontWeight: 'bold', color: '#059669' }}>
                            Amount: {guestMeal.amount.toFixed(2)}
                          </Text>
                        </View>
                      </View>
                    ))}
                  </View>
                )}

                {/* Department Summary */}
                <View style={{ backgroundColor: '#F9FAFB', padding: 8, borderRadius: 4, borderWidth: 1, borderColor: '#E5E7EB' }}>
                  <Text style={{ fontSize: 10, fontWeight: 'bold', marginBottom: 6, color: '#374151' }}>
                    DEPARTMENT SUMMARY:
                  </Text>
                  
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 }}>
                    <Text style={{ fontSize: 8, color: '#6B7280' }}>Regular Food (75%):</Text>
                    <Text style={{ fontSize: 8 }}>{dept.foodShare.toFixed(2)}</Text>
                  </View>
                  
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 }}>
                    <Text style={{ fontSize: 8, color: '#6B7280' }}>Venue Rent:</Text>
                    <Text style={{ fontSize: 8 }}>{dept.totalRentAmount.toFixed(2)}</Text>
                  </View>
                  
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 }}>
                    <Text style={{ fontSize: 8, color: '#6B7280' }}>Meeting Food:</Text>
                    <Text style={{ fontSize: 8 }}>{dept.totalMeetingFoodAmount.toFixed(2)}</Text>
                  </View>
                  
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                    <Text style={{ fontSize: 8, color: '#6B7280' }}>Guest Meals:</Text>
                    <Text style={{ fontSize: 8 }}>{dept.totalGuestMealAmount.toFixed(2)}</Text>
                  </View>
                  
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#374151', paddingTop: 4 }}>
                    <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#374151' }}>TOTAL PAYABLE:</Text>
                    <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#059669' }}>{dept.totalAmount.toFixed(2)}</Text>
                  </View>
                </View>
              </View>
            ))}

          {/* Overall Summary */}
          {(() => {
            const filteredDepts = detailedDepartmentData.departments.filter(dept => !selectedDepartment || dept.department === selectedDepartment);
            const grandTotalFood = filteredDepts.reduce((sum, dept) => sum + (dept.foodShare || 0), 0);
            const grandTotalRent = filteredDepts.reduce((sum, dept) => sum + (dept.totalRentAmount || 0), 0);
            const grandTotalMeetingFood = filteredDepts.reduce((sum, dept) => sum + (dept.totalMeetingFoodAmount || 0), 0);
            const grandTotalGuestMeals = filteredDepts.reduce((sum, dept) => sum + (dept.totalGuestMealAmount || 0), 0);
            const grandTotal = filteredDepts.reduce((sum, dept) => sum + (dept.totalAmount || 0), 0);

            return (
              <View style={{ marginTop: 20, backgroundColor: '#F3F4F6', padding: 12, borderRadius: 6 }}>
                <Text style={{ fontSize: 12, fontWeight: 'bold', marginBottom: 10, textAlign: 'center', color: '#374151' }}>
                  OVERALL SUMMARY ({filteredDepts.length} departments)
                </Text>
                
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                  <Text style={{ fontSize: 9, color: '#6B7280' }}>Regular Food (75%):</Text>
                  <Text style={{ fontSize: 9, fontWeight: 'bold' }}>{grandTotalFood.toFixed(2)}</Text>
                </View>
                
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                  <Text style={{ fontSize: 9, color: '#6B7280' }}>Venue Rent:</Text>
                  <Text style={{ fontSize: 9, fontWeight: 'bold' }}>{grandTotalRent.toFixed(2)}</Text>
                </View>
                
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                  <Text style={{ fontSize: 9, color: '#6B7280' }}>Meeting Food:</Text>
                  <Text style={{ fontSize: 9, fontWeight: 'bold' }}>{grandTotalMeetingFood.toFixed(2)}</Text>
                </View>
                
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                  <Text style={{ fontSize: 9, color: '#6B7280' }}>Guest Meals:</Text>
                  <Text style={{ fontSize: 9, fontWeight: 'bold' }}>{grandTotalGuestMeals.toFixed(2)}</Text>
                </View>
                
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 2, borderTopColor: '#374151', paddingTop: 6 }}>
                  <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#374151' }}>GRAND TOTAL:</Text>
                  <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#059669' }}>{grandTotal.toFixed(2)}</Text>
                </View>
              </View>
            );
          })()}
        </Page>
      </Document>
    );

  } catch (err) {
    console.error('Error rendering Detailed Department PDF:', err);
    return null;
  }
};

// Insert the new InvoicePDF component just before BillGenerator definition
const InvoicePDF = ({ invoiceData, selectedDepartment, dateRange }) => {
  if (!invoiceData || !dateRange?.startDate || !dateRange?.endDate) return null;
  
  const renderHeader = (title) => (
    <View style={styles.headerContainer}>
      <View style={styles.logoContainer}>
        <Image 
          src="/src/assets/HiraPlus.jpg" 
          style={styles.logo}
        />
        <Text style={styles.logoText}>Hira Plus</Text>
      </View>
      <View style={styles.headerText}>
        <Text style={styles.title}>
          {title}
        </Text>
        <Text style={styles.subtitle}>
          FROM: {format(new Date(dateRange.startDate), 'dd/MM/yyyy')} TO: {format(new Date(dateRange.endDate), 'dd/MM/yyyy')}
        </Text>
      </View>
    </View>
  );
  
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {renderHeader('HIRA PLUS INVOICE')}
        
        {/* Billing details */}
        <View style={{ marginBottom: 10 }}>
          <Text style={{ fontSize: 10, color: '#4B5563' }}>Department: {selectedDepartment}</Text>
          <Text style={{ fontSize: 10, color: '#4B5563' }}>
            Period: {format(new Date(dateRange.startDate), 'dd/MM/yyyy')} - {format(new Date(dateRange.endDate), 'dd/MM/yyyy')}
          </Text>
        </View>
        
        {/* Charge breakdown table */}
        <View style={styles.section}>
          <View style={styles.table}>
            <View style={[styles.tableRow, styles.tableHeader]}>
              <Text style={[styles.tableCell, { flex: 3 }]}>Description</Text>
              <Text style={[styles.tableCellRight, { flex: 1.2 }]}>Amount</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, { flex: 3 }]}>Food Bill Share (75%)</Text>
              <Text style={[styles.tableCellRight, { flex: 1.2 }]}>{invoiceData.foodShare?.toFixed(2)}</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, { flex: 3 }]}>Venue Rent</Text>
              <Text style={[styles.tableCellRight, { flex: 1.2 }]}>{invoiceData.rentTotal?.toFixed(2)}</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, { flex: 3 }]}>Meeting Food</Text>
              <Text style={[styles.tableCellRight, { flex: 1.2 }]}>{invoiceData.meetingFoodTotal?.toFixed(2)}</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, { flex: 3 }]}>Guest Meals</Text>
              <Text style={[styles.tableCellRight, { flex: 1.2 }]}>{invoiceData.guestMealTotal?.toFixed(2)}</Text>
            </View>
            <View style={[styles.tableRow, { borderBottomWidth: 0 }]}>
              <Text style={[styles.tableCell, { flex: 3, fontWeight: 'bold' }]}>TOTAL</Text>
              <Text style={[styles.tableCellRight, { flex: 1.2, fontWeight: 'bold' }]}>{invoiceData.total?.toFixed(2)}</Text>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
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
  
  // Custom List Management States
  const [customLists, setCustomLists] = useState([]);
  const [selectedCustomList, setSelectedCustomList] = useState('');
  const [showCustomListForm, setShowCustomListForm] = useState(false);
  const [editingCustomList, setEditingCustomList] = useState(null);
  const [customListForm, setCustomListForm] = useState({
    title: '',
    description: '',
    users: []
  });
  const [availableUsers, setAvailableUsers] = useState([]);
  // Search query for filtering users in Custom List modal
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [customListData, setCustomListData] = useState(null);
  const [selectedVenue, setSelectedVenue] = useState('');
  const [rentData, setRentData] = useState(null);
  const [guestMealData, setGuestMealData] = useState(null);
  const [meetingFoodData, setMeetingFoodData] = useState(null);
  const [departmentBillData, setDepartmentBillData] = useState(null);
  const [detailedDepartmentData, setDetailedDepartmentData] = useState(null);
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
  // Inside BillGenerator component state declarations, add invoiceData
  const [invoiceData, setInvoiceData] = useState(null);
  const [showAllUsers, setShowAllUsers] = useState(false);

  const venues = [
    'Auditorium [2nd Floor]',
    'Conference Hall [3rd Floor]',
    'Meeting Space [1st Floor]'
  ];

  // Custom List Management Functions
  const fetchCustomLists = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/admin/custom-lists`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setCustomLists(response.data);
    } catch (err) {
      console.error('Failed to fetch custom lists:', err);
      setError('Failed to fetch custom lists');
    }
  };

  const handleCreateCustomList = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      await axios.post(
        `${import.meta.env.VITE_API_URL}/admin/custom-lists`,
        customListForm,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setShowCustomListForm(false);
      setCustomListForm({ title: '', description: '', users: [] });
      fetchCustomLists();
    } catch (err) {
      console.error('Failed to create custom list:', err);
      setError('Failed to create custom list');
    }
  };

  const handleUpdateCustomList = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      await axios.put(
        `${import.meta.env.VITE_API_URL}/admin/custom-lists/${editingCustomList._id}`,
        customListForm,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setShowCustomListForm(false);
      setEditingCustomList(null);
      setCustomListForm({ title: '', description: '', users: [] });
      fetchCustomLists();
    } catch (err) {
      console.error('Failed to update custom list:', err);
      setError('Failed to update custom list');
    }
  };

  const handleDeleteCustomList = async (listId) => {
    if (!window.confirm('Are you sure you want to delete this custom list?')) {
      return;
    }
    try {
      const token = localStorage.getItem('adminToken');
      await axios.delete(
        `${import.meta.env.VITE_API_URL}/admin/custom-lists/${listId}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      fetchCustomLists();
      if (selectedCustomList === listId) {
        setSelectedCustomList('');
      }
    } catch (err) {
      console.error('Failed to delete custom list:', err);
      setError('Failed to delete custom list');
    }
  };

  const handleEditCustomList = (list) => {
    setEditingCustomList(list);
    setCustomListForm({
      title: list.title,
      description: list.description || '',
      users: list.users.map(user => user._id)
    });
    setShowCustomListForm(true);
  };

  const calculateCustomListBills = async () => {
    if (!selectedCustomList) {
      setError('Please select a custom list');
      return;
    }

    try {
      const token = localStorage.getItem('adminToken');
      
      // Get the selected custom list details
      const customListResponse = await axios.get(
        `${import.meta.env.VITE_API_URL}/admin/custom-lists/${selectedCustomList}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      const customList = customListResponse.data;
      console.log('Custom List Data:', customList);
      
      if (!customList.users || customList.users.length === 0) {
        setError('Selected custom list has no users');
        return;
      }

      // Fetch user-wise meal counts for the date range
      const userResponse = await axios.get(
        `${import.meta.env.VITE_API_URL}/admin/department-user-meals`,
        {
          params: {
            startDate: dateRange.startDate,
            endDate: dateRange.endDate
          },
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      console.log('User Response Data:', userResponse.data);

      if (userResponse.data && userResponse.data.departments) {
        // Filter the data to only include users from the custom list
        const customListUserIds = customList.users.map(user => user._id);
        console.log('Custom List User IDs:', customListUserIds);
        
        const filteredDepartments = userResponse.data.departments.map(dept => {
          console.log('Processing department:', dept.department);
          const filteredUsers = dept.users.filter(user => {
            console.log('Checking user:', user.userId, 'against list:', customListUserIds);
            return customListUserIds.includes(user.userId);
          });
          console.log('Filtered users for', dept.department, ':', filteredUsers);
          return {
            ...dept,
            users: filteredUsers
          };
        }).filter(dept => dept.users.length > 0);

        console.log('Filtered Departments:', filteredDepartments);

        // Set the filtered data as billData
        setBillData({ departments: filteredDepartments });
        setCustomListData(customList);

        // Calculate totals for custom list users
        let total = 0;
        filteredDepartments.forEach(dept => {
          dept.users.forEach(user => {
            if (!user.isFreeFood) {
              const userTotal = (
                (user.breakfastCount || 0) * mealRates.breakfast +
                (user.lunchCount || 0) * mealRates.lunch +
                (user.dinnerCount || 0) * mealRates.dinner
              );
              console.log(`User ${user.name}: B:${user.breakfastCount} L:${user.lunchCount} D:${user.dinnerCount} = ${userTotal}`);
              total += userTotal;
            }
          });
        });

        console.log('Total calculated:', total);
        console.log('Department share:', departmentShare);

        const deptShare = (total * departmentShare) / 100;
        const empShare = total - deptShare;

        setTotalAmount(total);
        setDepartmentPayable(deptShare);
        setEmployeePayable(empShare);
      }
    } catch (err) {
      console.error('Failed to calculate custom list bills:', err);
      setError('Failed to calculate custom list bills: ' + err.message);
    }
  };

  // Fetch departments and custom lists on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('adminToken');
        
        // Fetch departments from dedicated endpoint
        const departmentResponse = await axios.get(
          `${import.meta.env.VITE_API_URL}/admin/departments`,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );
        
        // Extract department titles from the response
        const departmentTitles = departmentResponse.data.departments
          .map(dept => dept.title)
          .filter(title => title && title.trim().length > 0)
          .sort();
        
        setDepartments(departmentTitles);

        // Fetch custom lists
        const customListResponse = await axios.get(
          `${import.meta.env.VITE_API_URL}/admin/custom-lists`,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );
        setCustomLists(customListResponse.data);

        // Fetch available users for custom list management
        const usersResponse = await axios.get(
          `${import.meta.env.VITE_API_URL}/admin/users/list`,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );
        setAvailableUsers(usersResponse.data);
        
      } catch (err) {
        console.error('Failed to fetch data:', err);
        setError('Failed to fetch data');
      }
    };
    fetchData();
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
    if (billType === 'custom' && !selectedCustomList) {
      setError('Please select a custom list');
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

          // Calculate total amount with separate handling for interns and regular employees
          let internTotal = 0;
          let regularTotal = 0;
          
          if (userResponse.data && userResponse.data.departments) {
            userResponse.data.departments
              .filter(dept => !selectedDepartment || dept.department === selectedDepartment)
              .forEach(dept => {
                dept.users
                  .filter(user => !user.isFreeFood) // Exclude free food users
                  .forEach(user => {
                    const userTotal = (user.breakfastCount || 0) * mealRates.breakfast +
                                    (user.lunchCount || 0) * mealRates.lunch +
                                    (user.dinnerCount || 0) * mealRates.dinner;
                    
                    if (user.isIntern === true) {
                      internTotal += userTotal;
                      console.log(`Intern ${user.name}: ${userTotal} added to internTotal`);
                    } else {
                      regularTotal += userTotal;
                      console.log(`Regular ${user.name}: ${userTotal} added to regularTotal`);
                    }
                  });
              });
          }

          const total = internTotal + regularTotal;

          // Calculate department and employee shares with different ratios
          const internDeptShare = internTotal; // 100% for interns
          const internEmpShare = 0; // 0% for interns
          
          // Calculate regular employee share based on department-specific policies
          let regularDeptShare = 0;
          let regularEmpShare = 0;
          
          if (userResponse.data && userResponse.data.departments) {
            userResponse.data.departments
              .filter(dept => !selectedDepartment || dept.department === selectedDepartment)
              .forEach(dept => {
                dept.users
                  .filter(user => !user.isFreeFood && user.isIntern !== true) // Regular employees only
                  .forEach(user => {
                    const userTotal = (user.breakfastCount || 0) * mealRates.breakfast +
                                    (user.lunchCount || 0) * mealRates.lunch +
                                    (user.dinnerCount || 0) * mealRates.dinner;
                    const userDeptName = user.department || dept.department || '';
                    const userDeptShare = getDepartmentShareForDept(userDeptName, departmentShare);
                    const userDeptAmount = (userTotal * userDeptShare) / 100;
                    const userEmpAmount = userTotal - userDeptAmount;
                    
                    regularDeptShare += userDeptAmount;
                    regularEmpShare += userEmpAmount;
                  });
              });
          }
          
          const deptShare = internDeptShare + regularDeptShare;
          const empShare = internEmpShare + regularEmpShare;

          setTotalAmount(total);
          setDepartmentPayable(deptShare);
          setEmployeePayable(empShare);
        }

        // Ensure we have valid user data before setting state
        if (userResponse.data && (userResponse.data.departments || userResponse.data.users)) {
          // Debug: Log the actual API response to verify isIntern field is present
          console.log('API Response from /admin/department-user-meals:', userResponse.data);
          if (userResponse.data.departments && userResponse.data.departments[0] && userResponse.data.departments[0].users) {
            console.log('Sample user from API:', userResponse.data.departments[0].users[0]);
            console.log('All users isIntern values:', userResponse.data.departments[0].users.map(u => ({ name: u.name, isIntern: u.isIntern })));
          }
          setBillData(userResponse.data);
        }
      } else if (billType === 'custom') {
        // Custom list bill calculation
        await calculateCustomListBills();
      } else if (billType === 'rent') {
        // Fetch rent data
        if (selectedVenue) {
          // Single-venue flow (existing)
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
          // Use dynamic rent amounts from meeting records
          const enhancedDepartments = rentResponse.data.departments.map(dept => ({
            ...dept,
            amount: dept.totalRent || 0, // Use totalRent from aggregated meeting records
            auditoriumCount: selectedVenue === 'Auditorium [2nd Floor]' ? dept.meetingCount : 0,
            conferenceHallCount: selectedVenue === 'Conference Hall [3rd Floor]' ? dept.meetingCount : 0,
            meetingSpaceCount: selectedVenue === 'Meeting Space [1st Floor]' ? dept.meetingCount : 0
          }));
          
          setRentData({ departments: enhancedDepartments });
          const total = enhancedDepartments
            .filter(dept => !selectedDepartment || dept.department === selectedDepartment)
            .reduce((acc, dept) => acc + dept.amount, 0);

            const deptShare = (total * departmentShare) / 100;
            const empShare = total - deptShare;

            setTotalAmount(total);
            setDepartmentPayable(deptShare);
            setEmployeePayable(empShare);
          }
        } else {
          // All-venues flow – aggregate per venue
          const deptMap = {};
          for (const venue of venues) {
            try {
              const resp = await axios.get(
                `${import.meta.env.VITE_API_URL}/admin/department-rent-bills`,
                {
                  params: {
                    startDate: dateRange.startDate,
                    endDate: dateRange.endDate,
                    department: selectedDepartment || undefined,
                    venue
                  },
                  headers: { Authorization: `Bearer ${token}` }
                }
              );
              if (resp.data && resp.data.departments) {
                resp.data.departments.forEach(d => {
                  if (!deptMap[d.department]) {
                    deptMap[d.department] = { 
                      meetingCount: 0, 
                      amount: 0,
                      auditoriumCount: 0,
                      conferenceHallCount: 0,
                      meetingSpaceCount: 0
                    };
                  }
                  deptMap[d.department].meetingCount += d.meetingCount;
                  deptMap[d.department].amount += d.totalRent || 0; // Use dynamic rent from meetings
                  
                  // Map venue names to specific counts
                  if (venue === 'Auditorium [2nd Floor]') {
                    deptMap[d.department].auditoriumCount = d.meetingCount;
                  } else if (venue === 'Conference Hall [3rd Floor]') {
                    deptMap[d.department].conferenceHallCount = d.meetingCount;
                  } else if (venue === 'Meeting Space [1st Floor]') {
                    deptMap[d.department].meetingSpaceCount = d.meetingCount;
                  }
                });
              }
            } catch (err) {
              console.error('Rent data fetch error for', venue, err);
            }
          }

          const aggregated = Object.entries(deptMap)
            .map(([department, info]) => ({ 
              department, 
              meetingCount: info.meetingCount, 
              amount: info.amount,
              auditoriumCount: info.auditoriumCount,
              conferenceHallCount: info.conferenceHallCount,
              meetingSpaceCount: info.meetingSpaceCount
            }))
            .sort((a,b) => a.department.localeCompare(b.department));

          setRentData({ departments: aggregated });

          const total = aggregated.reduce((acc, d) => acc + d.amount, 0);
          const deptShare = (total * departmentShare) / 100;
          const empShare = total - deptShare;

          setTotalAmount(total);
          setDepartmentPayable(deptShare);
          setEmployeePayable(empShare);
        }
      } else if (billType === 'department') {
        // Department bill - combine all bill types (food, rent, meeting food, guest meals)
        try {
          const deptMap = {};
          
          // 1. Fetch and process food data (75% department share)
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

          if (userResponse.data && userResponse.data.departments) {
            userResponse.data.departments
              .filter(dept => !selectedDepartment || dept.department === selectedDepartment)
              .forEach(dept => {
                const billableUsers = dept.users.filter(user => !user.isFreeFood);
                
                // Separate interns from regular employees
                const interns = billableUsers.filter(user => user.isIntern === true);
                const regularEmployees = billableUsers.filter(user => user.isIntern !== true);
                
                console.log(`Department ${dept.department} - Interns: ${interns.length}, Regular: ${regularEmployees.length}`);
                
                // Calculate totals for interns (100% department share)
                const internTotal = interns.reduce((acc, user) => {
                  return acc + (
                    (user.breakfastCount || 0) * mealRates.breakfast +
                    (user.lunchCount || 0) * mealRates.lunch +
                    (user.dinnerCount || 0) * mealRates.dinner
                  );
                }, 0);
                const internDeptShare = internTotal; // 100% for interns
                
                // Calculate totals for regular employees with department-specific shares
                let regularDeptShare = 0;
                regularEmployees.forEach(user => {
                  const userTotal = (user.breakfastCount || 0) * mealRates.breakfast +
                                  (user.lunchCount || 0) * mealRates.lunch +
                                  (user.dinnerCount || 0) * mealRates.dinner;
                  const userDeptName = user.department || dept.department || '';
                  const userDeptShare = getDepartmentShareForDept(userDeptName, 75); // Default 75% for regular staff
                  const userDeptAmount = (userTotal * userDeptShare) / 100;
                  regularDeptShare += userDeptAmount;
                });
                
                const foodDeptShare = internDeptShare + regularDeptShare;

                deptMap[dept.department] = {
                  department: dept.department,
                  foodShare: foodDeptShare,
                  rentTotal: 0,
                  meetingFoodTotal: 0,
                  guestMealTotal: 0,
                  total: foodDeptShare
                };
              });
          }

          // 2. Add rent data for all venues (100% department share)
          for (const venue of venues) {
            try {
              const rentResponse = await axios.get(
                `${import.meta.env.VITE_API_URL}/admin/department-rent-bills`,
                {
                  params: {
                    startDate: dateRange.startDate,
                    endDate: dateRange.endDate,
                    department: selectedDepartment || undefined,
                    venue
                  },
                  headers: { Authorization: `Bearer ${token}` }
                }
              );
              
              if (rentResponse.data && rentResponse.data.departments) {
                rentResponse.data.departments.forEach(dept => {
                  const rentAmount = dept.totalRent || 0; // Use dynamic rent from meetings
                  
                  if (!deptMap[dept.department]) {
                    deptMap[dept.department] = {
                      department: dept.department,
                      foodShare: 0,
                      rentTotal: 0,
                      meetingFoodTotal: 0,
                      guestMealTotal: 0,
                      total: 0
                    };
                  }
                  
                  deptMap[dept.department].rentTotal += rentAmount;
                });
              }
            } catch (err) {
              console.error(`Failed to fetch rent data for ${venue}:`, err);
            }
          }

          // 3. Add meeting food data (100% department share)
          try {
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
              meetingResponse.data.departments.forEach(dept => {
                const meetingFoodAmount = (
                  (dept.breakfast || 0) * meetingFoodRates.breakfast +
                  (dept.lunch || 0) * meetingFoodRates.lunch +
                  (dept.dinner || 0) * meetingFoodRates.dinner +
                  (dept.morningSnacksCount || 0) * meetingFoodRates.morningSnacks +
                  (dept.morningTeaCount || 0) * meetingFoodRates.morningTea +
                  (dept.eveningSnacksCount || 0) * meetingFoodRates.eveningSnacks +
                  (dept.eveningTeaCount || 0) * meetingFoodRates.eveningTea
                );

                if (!deptMap[dept.department]) {
                  deptMap[dept.department] = {
                    department: dept.department,
                    foodShare: 0,
                    rentTotal: 0,
                    meetingFoodTotal: 0,
                    guestMealTotal: 0,
                    total: 0
                  };
                }

                deptMap[dept.department].meetingFoodTotal = meetingFoodAmount;
              });
            }
          } catch (err) {
            console.error('Failed to fetch meeting food data:', err);
          }

          // 4. Add guest meal data (100% department share)
          try {
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
              guestResponse.data.departments.forEach(dept => {
                const guestMealAmount = (
                  dept.breakfastCount * mealRates.breakfast +
                  dept.lunchCount * mealRates.lunch +
                  dept.dinnerCount * mealRates.dinner
                );

                if (!deptMap[dept.department]) {
                  deptMap[dept.department] = {
                    department: dept.department,
                    foodShare: 0,
                    rentTotal: 0,
                    meetingFoodTotal: 0,
                    guestMealTotal: 0,
                    total: 0
                  };
                }

                deptMap[dept.department].guestMealTotal = guestMealAmount;
              });
            }
          } catch (err) {
            console.error('Failed to fetch guest meal data:', err);
          }

          // 5. Calculate totals for each department
          Object.values(deptMap).forEach(dept => {
            dept.total = dept.foodShare + dept.rentTotal + dept.meetingFoodTotal + dept.guestMealTotal;
          });

          const combinedData = Object.values(deptMap).sort((a, b) => a.department.localeCompare(b.department));
          setDepartmentBillData({ departments: combinedData });

          const grandTotal = combinedData.reduce((acc, dept) => acc + dept.total, 0);
          setTotalAmount(grandTotal);
          setDepartmentPayable(grandTotal);
          setEmployeePayable(0);

        } catch (err) {
          console.error('Failed to fetch department bill data:', err);
          setError('Failed to fetch department bill data');
        }
      } else if (billType === 'invoice') {
        if (!selectedDepartment) {
          setError('Please select a department to generate an invoice');
          setLoading(false);
          return;
        }
        try {
          const token = localStorage.getItem('adminToken');
          const deptMap = {};
          const venues = [
            'Auditorium [2nd Floor]',
            'Conference Hall [3rd Floor]',
            'Meeting Space [1st Floor]'
          ];

          // Food (75%)
          const userResp = await axios.get(
            `${import.meta.env.VITE_API_URL}/admin/department-user-meals`,
            {
              params: {
                startDate: dateRange.startDate,
                endDate: dateRange.endDate,
                department: selectedDepartment
              },
              headers: { Authorization: `Bearer ${token}` }
            }
          );
          if (userResp.data && userResp.data.departments && userResp.data.departments.length) {
            const dept = userResp.data.departments[0];
            const billableUsers = dept.users.filter(u => !u.isFreeFood);
            
            // Separate interns from regular employees
            const interns = billableUsers.filter(u => u.isIntern === true);
            const regularEmployees = billableUsers.filter(u => u.isIntern !== true);
            
            console.log(`Invoice - ${selectedDepartment} - Interns: ${interns.length}, Regular: ${regularEmployees.length}`);
            
            // Calculate totals for interns (100% department share)
            const internTotal = interns.reduce((acc, u) => acc + (
              (u.breakfastCount || 0) * mealRates.breakfast +
              (u.lunchCount || 0) * mealRates.lunch +
              (u.dinnerCount || 0) * mealRates.dinner
            ), 0);
            const internDeptShare = internTotal; // 100% for interns
            
            // Calculate totals for regular employees with department-specific shares
            let regularDeptShare = 0;
            regularEmployees.forEach(u => {
              const userTotal = (u.breakfastCount || 0) * mealRates.breakfast +
                              (u.lunchCount || 0) * mealRates.lunch +
                              (u.dinnerCount || 0) * mealRates.dinner;
              const userDeptName = u.department || selectedDepartment || '';
              const userDeptShare = getDepartmentShareForDept(userDeptName, 75); // Default 75% for regular staff
              const userDeptAmount = (userTotal * userDeptShare) / 100;
              regularDeptShare += userDeptAmount;
            });
            
            const foodDeptShare = internDeptShare + regularDeptShare;
            
            deptMap[selectedDepartment] = {
              foodShare: foodDeptShare,
              rentTotal: 0,
              meetingFoodTotal: 0,
              guestMealTotal: 0
            };
          }

          // Rent (100%) across venues
          for (const venue of venues) {
            try {
              const rentResp = await axios.get(
                `${import.meta.env.VITE_API_URL}/admin/department-rent-bills`,
                {
                  params: {
                    startDate: dateRange.startDate,
                    endDate: dateRange.endDate,
                    department: selectedDepartment,
                    venue
                  },
                  headers: { Authorization: `Bearer ${token}` }
                }
              );
              if (rentResp.data && rentResp.data.departments && rentResp.data.departments.length) {
                const d = rentResp.data.departments[0];
                const amount = d.totalRent || 0; // Use dynamic rent from meetings
                if (!deptMap[selectedDepartment]) deptMap[selectedDepartment] = { foodShare: 0, rentTotal: 0, meetingFoodTotal: 0, guestMealTotal: 0 };
                deptMap[selectedDepartment].rentTotal += amount;
              }
            } catch { /* ignore */ }
          }

          // Meeting food (100%)
          try {
            const meetingResp = await axios.get(
              `${import.meta.env.VITE_API_URL}/admin/meeting-food-bills`,
              {
                params: {
                  startDate: dateRange.startDate,
                  endDate: dateRange.endDate,
                  department: selectedDepartment
                },
                headers: { Authorization: `Bearer ${token}` }
              }
            );
            if (meetingResp.data && meetingResp.data.departments && meetingResp.data.departments.length) {
              const d = meetingResp.data.departments[0];
              const meetingAmt = (
                (d.breakfast || 0) * meetingFoodRates.breakfast +
                (d.lunch || 0) * meetingFoodRates.lunch +
                (d.dinner || 0) * meetingFoodRates.dinner +
                (d.morningSnacksCount || 0) * meetingFoodRates.morningSnacks +
                (d.morningTeaCount || 0) * meetingFoodRates.morningTea +
                (d.eveningSnacksCount || 0) * meetingFoodRates.eveningSnacks +
                (d.eveningTeaCount || 0) * meetingFoodRates.eveningTea
              );
              if (!deptMap[selectedDepartment]) deptMap[selectedDepartment] = { foodShare: 0, rentTotal: 0, meetingFoodTotal: 0, guestMealTotal: 0 };
              deptMap[selectedDepartment].meetingFoodTotal = meetingAmt;
            }
          } catch {}

          // Guest meals (100%)
          try {
            const guestResp = await axios.get(
              `${import.meta.env.VITE_API_URL}/admin/department-guest-meals`,
              {
                params: {
                  startDate: dateRange.startDate,
                  endDate: dateRange.endDate,
                  department: selectedDepartment
                },
                headers: { Authorization: `Bearer ${token}` }
              }
            );
            if (guestResp.data && guestResp.data.departments && guestResp.data.departments.length) {
              const d = guestResp.data.departments[0];
              const guestAmt = d.breakfastCount * mealRates.breakfast + d.lunchCount * mealRates.lunch + d.dinnerCount * mealRates.dinner;
              if (!deptMap[selectedDepartment]) deptMap[selectedDepartment] = { foodShare: 0, rentTotal: 0, meetingFoodTotal: 0, guestMealTotal: 0 };
              deptMap[selectedDepartment].guestMealTotal = guestAmt;
            }
          } catch {}

          const summary = deptMap[selectedDepartment] || { foodShare: 0, rentTotal: 0, meetingFoodTotal: 0, guestMealTotal: 0 };
          summary.total = summary.foodShare + summary.rentTotal + summary.meetingFoodTotal + summary.guestMealTotal;

          setDepartmentBillData({ departments: [{ department: selectedDepartment, ...summary }] });
          setInvoiceData(summary);
          setTotalAmount(summary.total);
          setDepartmentPayable(summary.total);
          setEmployeePayable(0);
        } catch (err) {
          console.error('Failed to generate invoice:', err);
          setError('Failed to generate invoice');
        }
      } else if (billType === 'department-detailed') {
        // Detailed department bill with individual meetings/programs
        try {
          const detailedResponse = await axios.get(
            `${import.meta.env.VITE_API_URL}/admin/department-bills-detailed`,
            {
              params: {
                startDate: dateRange.startDate,
                endDate: dateRange.endDate,
                department: selectedDepartment || undefined
              },
              headers: { Authorization: `Bearer ${token}` }
            }
          );

          if (detailedResponse.data && detailedResponse.data.departments) {
            setDetailedDepartmentData(detailedResponse.data);
            
            // Calculate total amount from all departments
            const grandTotal = detailedResponse.data.departments
              .filter(dept => !selectedDepartment || dept.department === selectedDepartment)
              .reduce((sum, dept) => sum + (dept.totalAmount || 0), 0);

            setTotalAmount(grandTotal);
            setDepartmentPayable(grandTotal);
            setEmployeePayable(0);
          }
        } catch (err) {
          console.error('Failed to fetch detailed department bills:', err);
          setError('Failed to fetch detailed department bills');
        }
      } else if (billType === 'custom') {
        // Custom list bill calculation
        await calculateCustomListBills();
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
                           billType === 'guest' ? 'Guest Meals' :
                           billType === 'department' ? 'Department Bills (All Types)' : 
                           billType === 'invoice' ? 'Invoice' :
                           billType === 'custom' ? 'Custom List Bills' : 'Select Bill Type'}
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
                        {billType === 'custom' && selectedCustomList && customLists.find(list => list._id === selectedCustomList) && (
                          <span className="flex items-center text-orange-600">
                            <div className="w-1.5 h-1.5 bg-orange-500 rounded-full mr-1.5"></div>
                            {customLists.find(list => list._id === selectedCustomList)?.title}
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-4">
                    <label className="relative flex cursor-pointer rounded-lg border border-gray-300 bg-white p-4 shadow-sm focus:outline-none hover:border-green-500 transition-all duration-200">
                      <input
                        type="radio"
                        value="food"
                        checked={billType === 'food'}
                        onChange={(e) => {
                          setBillType(e.target.value);
                          setSelectedVenue('');
                          setSelectedCustomList('');
                          setRentData(null);
                          setBillData(null);
                          setGuestMealData(null);
                          setMeetingFoodData(null);
                          setDepartmentBillData(null);
                          setCustomListData(null);
                          setDepartmentData(null);
                          setTotalAmount(0);
                          setEmployeePayable(0);
                          setDepartmentPayable(0);
                          setDepartmentShare(75);
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
                          setSelectedCustomList('');
                          setRentData(null);
                          setBillData(null);
                          setGuestMealData(null);
                          setMeetingFoodData(null);
                          setDepartmentBillData(null);
                          setCustomListData(null);
                          setDepartmentData(null);
                          setTotalAmount(0);
                          setEmployeePayable(0);
                          setDepartmentPayable(0);
                          setDepartmentShare(100);
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
                          setSelectedCustomList('');
                          setRentData(null);
                          setBillData(null);
                          setGuestMealData(null);
                          setMeetingFoodData(null);
                          setDepartmentBillData(null);
                          setCustomListData(null);
                          setDepartmentData(null);
                          setTotalAmount(0);
                          setEmployeePayable(0);
                          setDepartmentPayable(0);
                          setDepartmentShare(100);
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
                          setSelectedCustomList('');
                          setRentData(null);
                          setBillData(null);
                          setGuestMealData(null);
                          setMeetingFoodData(null);
                          setDepartmentBillData(null);
                          setCustomListData(null);
                          setDepartmentData(null);
                          setTotalAmount(0);
                          setEmployeePayable(0);
                          setDepartmentPayable(0);
                          setDepartmentShare(100);
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
                    
                    <label className="relative flex cursor-pointer rounded-lg border border-gray-300 bg-white p-4 shadow-sm focus:outline-none hover:border-green-500 transition-all duration-200">
                      <input
                        type="radio"
                        value="department"
                        checked={billType === 'department'}
                        onChange={(e) => {
                          setBillType(e.target.value);
                          setSelectedVenue('');
                          setSelectedCustomList('');
                          setRentData(null);
                          setBillData(null);
                          setGuestMealData(null);
                          setMeetingFoodData(null);
                          setDepartmentBillData(null);
                          setDetailedDepartmentData(null);
                          setCustomListData(null);
                          setDepartmentData(null);
                          setTotalAmount(0);
                          setEmployeePayable(0);
                          setDepartmentPayable(0);
                          setDepartmentShare(75);
                        }}
                        className="sr-only"
                      />
                      <span className="flex flex-1">
                        <span className="flex flex-col">
                          <span className={`block text-sm font-medium ${billType === 'department' ? 'text-green-900' : 'text-gray-900'}`}>
                            Department Bill (Summary)
                          </span>
                          <span className={`mt-1 flex items-center text-sm ${billType === 'department' ? 'text-green-600' : 'text-gray-500'}`}>
                            Summary view of all bill types
                          </span>
                        </span>
                      </span>
                      {billType === 'department' && (
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
                        value="department-detailed"
                        checked={billType === 'department-detailed'}
                        onChange={(e) => {
                          setBillType(e.target.value);
                          setSelectedVenue('');
                          setSelectedCustomList('');
                          setRentData(null);
                          setBillData(null);
                          setGuestMealData(null);
                          setMeetingFoodData(null);
                          setDepartmentBillData(null);
                          setDetailedDepartmentData(null);
                          setCustomListData(null);
                          setDepartmentData(null);
                          setTotalAmount(0);
                          setEmployeePayable(0);
                          setDepartmentPayable(0);
                          setDepartmentShare(75);
                        }}
                        className="sr-only"
                      />
                      <span className="flex flex-1">
                        <span className="flex flex-col">
                          <span className={`block text-sm font-medium ${billType === 'department-detailed' ? 'text-green-900' : 'text-gray-900'}`}>
                            Department Bill (Detailed)
                          </span>
                          <span className={`mt-1 flex items-center text-sm ${billType === 'department-detailed' ? 'text-green-600' : 'text-gray-500'}`}>
                            Individual programs/meetings listed
                          </span>
                        </span>
                      </span>
                      {billType === 'department-detailed' && (
                        <div className="h-5 w-5 text-green-600 ml-[-5px]">
                          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </label>

                    <label className="relative flex cursor-pointer rounded-lg border border-gray-300 bg-white p-4 shadow-sm focus:outline-none hover:border-green-500 transition-all duration-200">
                      <input
                        type="radio"
                        value="invoice"
                        checked={billType === 'invoice'}
                        onChange={(e) => {
                          setBillType(e.target.value);
                          setSelectedVenue('');
                          setSelectedCustomList('');
                          setRentData(null);
                          setBillData(null);
                          setGuestMealData(null);
                          setMeetingFoodData(null);
                          setDepartmentBillData(null);
                          setInvoiceData(null);
                          setCustomListData(null);
                          setDepartmentData(null);
                          setTotalAmount(0);
                          setEmployeePayable(0);
                          setDepartmentPayable(0);
                          setDepartmentShare(75);
                        }}
                        className="sr-only"
                      />
                      <span className="flex flex-1">
                        <span className="flex flex-col">
                          <span className={`block text-sm font-medium ${billType === 'invoice' ? 'text-green-900' : 'text-gray-900'}`}>
                            Invoice
                          </span>
                          <span className={`mt-1 flex items-center text-sm ${billType === 'invoice' ? 'text-green-600' : 'text-gray-500'}`}>
                            Department summary
                          </span>
                        </span>
                      </span>
                      {billType === 'invoice' && (
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
                        value="custom"
                        checked={billType === 'custom'}
                        onChange={(e) => {
                          setBillType(e.target.value);
                          setSelectedVenue('');
                          setSelectedDepartment('');
                          setRentData(null);
                          setBillData(null);
                          setGuestMealData(null);
                          setMeetingFoodData(null);
                          setDepartmentBillData(null);
                          setCustomListData(null);
                          setDepartmentData(null);
                          setTotalAmount(0);
                          setEmployeePayable(0);
                          setDepartmentPayable(0);
                          setDepartmentShare(75);
                        }}
                        className="sr-only"
                      />
                      <span className="flex flex-1">
                        <span className="flex flex-col">
                          <span className={`block text-sm font-medium ${billType === 'custom' ? 'text-green-900' : 'text-gray-900'}`}>
                            Custom List
                          </span>
                          <span className={`mt-1 flex items-center text-sm ${billType === 'custom' ? 'text-green-600' : 'text-gray-500'}`}>
                            Selected users
                          </span>
                        </span>
                      </span>
                      {billType === 'custom' && (
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
                        setDepartmentBillData(null);
                        setTotalAmount(0);
                        setEmployeePayable(0);
                        setDepartmentPayable(0);
                      }}
                      className="block w-full px-4 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 rounded-lg bg-white transition-all duration-200"
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
                        className="block w-full px-4 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 rounded-lg bg-white transition-all duration-200"
                      >
                        <option value="">All Venues</option>
                        <option value="__select__" disabled>──────────</option>
                        {venues.map((venue) => (
                          <option key={venue} value={venue}>{venue}</option>
                        ))}
                      </select>

                    </div>
                  </div>
                )}

                {/* Custom List Management - Show only for custom bills */}
                {billType === 'custom' && (
                  <div className="mb-8">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Custom List Management</h2>
                    
                    {/* Custom List Selection */}
                    <div className="mb-6">
                      <div className="flex items-end gap-4 mb-4">
                        <div className="flex-1 max-w-md">
                          <label className="block text-sm font-medium text-gray-700 mb-2">Select Custom List</label>
                          <select
                            value={selectedCustomList}
                            onChange={(e) => {
                              setSelectedCustomList(e.target.value);
                              setBillData(null);
                              setCustomListData(null);
                              setTotalAmount(0);
                              setEmployeePayable(0);
                              setDepartmentPayable(0);
                              setShowAllUsers(false);
                            }}
                            className="block w-full px-4 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 rounded-lg bg-white transition-all duration-200"
                          >
                            <option value="">Choose a custom list...</option>
                            {customLists.map((list) => (
                              <option key={list._id} value={list._id}>
                                {list.title} ({list.users?.length || 0} users)
                              </option>
                            ))}
                          </select>
                        </div>
                        <button
                          onClick={() => {
                            setCustomListForm({ title: '', description: '', users: [] });
                            setEditingCustomList(null);
                            setShowCustomListForm(true);
                          }}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors duration-200"
                        >
                          Create New
                        </button>
                      </div>

                      {/* Show selected custom list details */}
                      {selectedCustomList && customLists.find(list => list._id === selectedCustomList) && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          {(() => {
                            const selectedList = customLists.find(list => list._id === selectedCustomList);
                            return (
                              <div>
                                <div className="flex items-center justify-between mb-2">
                                  <h4 className="font-medium text-blue-900">{selectedList.title}</h4>
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => handleEditCustomList(selectedList)}
                                      className="text-blue-600 hover:text-blue-800 text-sm"
                                    >
                                      Edit
                                    </button>
                                    <button
                                      onClick={() => handleDeleteCustomList(selectedList._id)}
                                      className="text-red-600 hover:text-red-800 text-sm"
                                    >
                                      Delete
                                    </button>
                                  </div>
                                </div>
                                {selectedList.description && (
                                  <p className="text-sm text-blue-700 mb-2">{selectedList.description}</p>
                                )}
                                <div className="text-sm text-blue-600">
                                  <strong>{selectedList.users?.length || 0} users:</strong>
                                  <div className="mt-1 flex flex-wrap gap-1">
                                    {selectedList.users?.slice(0, showAllUsers ? selectedList.users.length : 5).map(user => (
                                      <span key={user._id} className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                                        {user.name}
                                      </span>
                                    ))}
                                    {selectedList.users?.length > 5 && !showAllUsers && (
                                      <button
                                        onClick={() => setShowAllUsers(true)}
                                        className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs hover:bg-blue-200 cursor-pointer transition-colors duration-200"
                                      >
                                        +{selectedList.users.length - 5} more
                                      </button>
                                    )}
                                    {showAllUsers && selectedList.users?.length > 5 && (
                                      <button
                                        onClick={() => setShowAllUsers(false)}
                                        className="inline-block bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs hover:bg-gray-200 cursor-pointer transition-colors duration-200"
                                      >
                                        Show less
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      )}
                    </div>

                    {/* Custom List Form Modal */}
                    {showCustomListForm && (
                      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
                        <div className="bg-white p-6 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                          <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold text-gray-900">
                              {editingCustomList ? 'Edit Custom List' : 'Create Custom List'}
                            </h3>
                            <button
                              onClick={() => {
                                setShowCustomListForm(false);
                                setEditingCustomList(null);
                                setCustomListForm({ title: '', description: '', users: [] });
                              }}
                              className="text-gray-400 hover:text-gray-600"
                            >
                              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                              </svg>
                            </button>
                          </div>

                          <div className="space-y-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                              <input
                                type="text"
                                value={customListForm.title}
                                onChange={(e) => setCustomListForm({ ...customListForm, title: e.target.value })}
                                className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                placeholder="Enter list title"
                                required
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                              <textarea
                                value={customListForm.description}
                                onChange={(e) => setCustomListForm({ ...customListForm, description: e.target.value })}
                                className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                placeholder="Optional description"
                                rows="3"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Select Users ({customListForm.users.length} selected)</label>

                              {/* User search bar */}
                              <input
                                type="text"
                                value={userSearchQuery}
                                onChange={(e) => setUserSearchQuery(e.target.value)}
                                placeholder="Search users..."
                                className="block w-full mb-3 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                              />

                              <div className="border border-gray-300 rounded-lg p-4 max-h-60 overflow-y-auto">
                                <div className="space-y-2">
                                  {availableUsers
                                    .filter((user) => {
                                      const q = userSearchQuery.toLowerCase();
                                      if (!q) return true;
                                      return (
                                        (user.displayName && user.displayName.toLowerCase().includes(q)) ||
                                        (user.name && user.name.toLowerCase().includes(q)) ||
                                        (user.phoneNumber && user.phoneNumber.toString().toLowerCase().includes(q))
                                      );
                                    })
                                    .map((user) => (
                                      <label key={user._id} className="flex items-center">
                                        <input
                                          type="checkbox"
                                          checked={customListForm.users.includes(user._id)}
                                          onChange={(e) => {
                                            if (e.target.checked) {
                                              setCustomListForm({
                                                ...customListForm,
                                                users: [...customListForm.users, user._id]
                                              });
                                            } else {
                                              setCustomListForm({
                                                ...customListForm,
                                                users: customListForm.users.filter(id => id !== user._id)
                                              });
                                            }
                                          }}
                                          className="h-4 w-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                                        />
                                        <span className="ml-3 text-sm text-gray-900">
                                          {user.displayName || `${user.name} (${user.phoneNumber})`}
                                        </span>
                                      </label>
                                    ))}
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="flex justify-end space-x-3 mt-6">
                            <button
                              onClick={() => {
                                setShowCustomListForm(false);
                                setEditingCustomList(null);
                                setCustomListForm({ title: '', description: '', users: [] });
                              }}
                              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300 transition-colors duration-200"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={editingCustomList ? handleUpdateCustomList : handleCreateCustomList}
                              disabled={!customListForm.title.trim()}
                              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {editingCustomList ? 'Update List' : 'Create List'}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
                    <h3 className="text-sm font-semibold text-gray-900 mb-1">Total Amount</h3>
                    <p className="text-2xl font-bold text-blue-600">{Math.round(totalAmount).toLocaleString()}</p>
                  </div>
                  <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
                    <h3 className="text-sm font-semibold text-gray-900 mb-1">Department Share</h3>
                    <p className="text-2xl font-bold text-green-600">{Math.round(departmentPayable).toLocaleString()}</p>
                  </div>
                  {(billType === 'food' || billType === 'custom') && (
                  <div className="bg-gradient-to-r from-red-50 to-red-100 p-4 rounded-lg border border-red-200">
                    <h3 className="text-sm font-semibold text-gray-900 mb-1">Employee Payable</h3>
                    <p className="text-2xl font-bold text-red-600">{Math.round(employeePayable).toLocaleString()}</p>
                  </div>
                  )}
                </div>

                {/* Bill Details Table - Show after calculation */}
                {loading ? (
                  <div className="mb-8 bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-900">
                        Calculating Bill Details...
                      </h3>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payable</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          <TableSkeleton rows={6} columns={4} />
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : ((billType === 'food' && departmentData?.departments) || 
                  (billType === 'rent' && rentData?.departments) ||
                  (billType === 'guest' && guestMealData?.departments) ||
                  (billType === 'meeting' && meetingFoodData?.departments) ||
                  (billType === 'department' && departmentBillData?.departments) ||
                  (billType === 'department-detailed' && detailedDepartmentData?.departments) ||
                  (billType === 'custom' && billData?.departments)) && (
                  <div className="mb-8 bg-white rounded-xl border border-gray-200 overflow-hidden">
                                        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {billType === 'food' ? 'Food Bill Details' : 
                         billType === 'rent' ? `Venue Rent Details${selectedVenue ? ` - ${selectedVenue}` : ''}` : 
                         billType === 'meeting' ? 'Meeting Food Details' : 
                         billType === 'department' ? 'Department Bills (All Types)' :
                         billType === 'department-detailed' ? 'Detailed Department Bills (Individual Programs)' :
                         billType === 'custom' ? `Custom List Bills - ${customListData?.title || 'Selected Users'}` :
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
                            {billType === 'department' && (
                              <>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Food Bill (75%)</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rent Bill</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Meeting Food</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Guest Meals</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                              </>
                            )}
                            {billType === 'department-detailed' && (
                              <>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Programs</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Food (75%)</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rent</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Meeting Food</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Guest Meals</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                              </>
                            )}
                            {billType === 'food' && (
                              <>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Breakfast</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lunch</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dinner</th>
                              </>
                            )}
                            {billType === 'rent' && (
                              <>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Meetings</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Auditorium</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Conference Hall</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Meeting Space</th>
                              </>
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
                            {billType !== 'department' && (
                              <>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Amount</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dept. Payable</th>
                              </>
                            )}
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {billType === 'department' && departmentBillData?.departments?.map((dept) => (
                            <tr key={dept.department} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{dept.department}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                                {Math.round(dept.foodShare).toLocaleString()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-purple-600">
                                {Math.round(dept.rentTotal).toLocaleString()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-orange-600">
                                {Math.round(dept.meetingFoodTotal).toLocaleString()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-teal-600">
                                {Math.round(dept.guestMealTotal).toLocaleString()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                                {Math.round(dept.total).toLocaleString()}
                              </td>
                            </tr>
                          ))}
                          {billType === 'department-detailed' && detailedDepartmentData?.departments?.map((dept) => (
                            <tr key={dept.department} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                <div className="space-y-1">
                                  <div className="font-bold text-gray-900">{dept.department}</div>
                                  <div className="text-xs text-gray-500">
                                    {(dept.meetings || []).length} meetings, {(dept.guestMeals || []).length} guest meals
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                <div className="space-y-1">
                                  {(dept.meetings || []).map((meeting, idx) => (
                                    <div key={idx} className="text-xs">
                                      <div className="font-medium">{meeting.title}</div>
                                      <div className="text-gray-500">
                                        {format(new Date(meeting.startDatetime), 'dd/MM/yyyy')} • {meeting.hall}
                                      </div>
                                    </div>
                                  ))}
                                  {(dept.guestMeals || []).map((guestMeal, idx) => (
                                    <div key={idx} className="text-xs">
                                      <div className="font-medium">{guestMeal.description}</div>
                                      <div className="text-gray-500">
                                        {format(new Date(guestMeal.date), 'dd/MM/yyyy')} • B:{guestMeal.breakfastCount} L:{guestMeal.lunchCount} D:{guestMeal.dinnerCount}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                                {Math.round(dept.foodShare || 0).toLocaleString()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-purple-600">
                                {Math.round(dept.totalRentAmount || 0).toLocaleString()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-orange-600">
                                {Math.round(dept.totalMeetingFoodAmount || 0).toLocaleString()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-teal-600">
                                {Math.round(dept.totalGuestMealAmount || 0).toLocaleString()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                                {Math.round(dept.totalAmount || 0).toLocaleString()}
                              </td>
                            </tr>
                          ))}
                          {billType === 'food' && departmentData?.departments?.map((dept) => {
                            // Calculate actual billable amounts from user data with intern separation
                            let actualBreakfast = 0, actualLunch = 0, actualDinner = 0;
                            let internTotal = 0, regularTotal = 0;
                            
                            if (billData?.departments) {
                              const matchingDept = billData.departments.find(d => d.department === dept.department);
                              if (matchingDept) {
                                const billableUsers = matchingDept.users.filter(user => !user.isFreeFood);
                                actualBreakfast = billableUsers.reduce((sum, user) => sum + (user.breakfastCount || 0), 0);
                                actualLunch = billableUsers.reduce((sum, user) => sum + (user.lunchCount || 0), 0);
                                actualDinner = billableUsers.reduce((sum, user) => sum + (user.dinnerCount || 0), 0);
                                
                                // Separate interns and regular employees for correct department share calculation
                                billableUsers.forEach(user => {
                                  const userTotal = (user.breakfastCount || 0) * mealRates.breakfast +
                                                  (user.lunchCount || 0) * mealRates.lunch +
                                                  (user.dinnerCount || 0) * mealRates.dinner;
                                  
                                  if (user.isIntern === true) {
                                    internTotal += userTotal; // 100% department share for interns
                                  } else {
                                    regularTotal += userTotal; // 75% department share for regular employees
                                  }
                                });
                              }
                            }
                            
                            const totalAmount = (actualBreakfast * mealRates.breakfast) + (actualLunch * mealRates.lunch) + (actualDinner * mealRates.dinner);
                            
                            // Calculate department payable with correct intern/regular ratios and department-specific shares
                            const internDeptShare = internTotal; // 100% for interns
                            
                            // Calculate regular employee share based on department-specific policies
                            let regularDeptShare = 0;
                            if (billData?.departments) {
                              const matchingDept = billData.departments.find(d => d.department === dept.department);
                              if (matchingDept) {
                                const billableUsers = matchingDept.users.filter(user => !user.isFreeFood && user.isIntern !== true);
                                billableUsers.forEach(user => {
                                  const userTotal = (user.breakfastCount || 0) * mealRates.breakfast +
                                                  (user.lunchCount || 0) * mealRates.lunch +
                                                  (user.dinnerCount || 0) * mealRates.dinner;
                                  const userDeptName = user.department || dept.department || '';
                                  const userDeptShare = getDepartmentShareForDept(userDeptName, departmentShare);
                                  const userDeptAmount = (userTotal * userDeptShare) / 100;
                                  regularDeptShare += userDeptAmount;
                                });
                              }
                            }
                            
                            const deptPayable = internDeptShare + regularDeptShare;
                            
                            return (
                              <tr key={dept.department} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{dept.department}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{actualBreakfast}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{actualLunch}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{actualDinner}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                                  {Math.round(totalAmount).toLocaleString()}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                                  {Math.round(deptPayable).toLocaleString()}
                                </td>
                              </tr>
                            );
                          })}
                          {billType === 'rent' && rentData?.departments?.map((dept) => (
                            <tr key={dept.department} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{dept.department}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{dept.meetingCount || 0}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{dept.auditoriumCount || 0}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{dept.conferenceHallCount || 0}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{dept.meetingSpaceCount || 0}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                                {Math.round(dept.amount || 0).toLocaleString()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                                {Math.round(dept.amount || 0).toLocaleString()}
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
                                {Math.round((dept.breakfastCount * mealRates.breakfast) + (dept.lunchCount * mealRates.lunch) + (dept.dinnerCount * mealRates.dinner)).toLocaleString()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                                {Math.round((dept.breakfastCount * mealRates.breakfast) + (dept.lunchCount * mealRates.lunch) + (dept.dinnerCount * mealRates.dinner)).toLocaleString()}
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
                                {Math.round(
                                  (dept.breakfast || 0) * meetingFoodRates.breakfast +
                                  (dept.lunch || 0) * meetingFoodRates.lunch +
                                  (dept.dinner || 0) * meetingFoodRates.dinner +
                                  (dept.morningSnacksCount || 0) * meetingFoodRates.morningSnacks +
                                  (dept.morningTeaCount || 0) * meetingFoodRates.morningTea +
                                  (dept.eveningSnacksCount || 0) * meetingFoodRates.eveningSnacks +
                                  (dept.eveningTeaCount || 0) * meetingFoodRates.eveningTea
                                ).toLocaleString()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                                {Math.round(
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
                          {billType === 'custom' && billData?.departments?.map((dept) => {
                            // Calculate actual billable amounts from custom list user data with intern separation
                            let actualBreakfast = 0, actualLunch = 0, actualDinner = 0;
                            let internTotal = 0, regularTotal = 0;
                            
                            const billableUsers = dept.users.filter(user => !user.isFreeFood);
                            actualBreakfast = billableUsers.reduce((sum, user) => sum + (user.breakfastCount || 0), 0);
                            actualLunch = billableUsers.reduce((sum, user) => sum + (user.lunchCount || 0), 0);
                            actualDinner = billableUsers.reduce((sum, user) => sum + (user.dinnerCount || 0), 0);
                            
                            // Separate interns and regular employees for correct department share calculation
                            billableUsers.forEach(user => {
                              const userTotal = (user.breakfastCount || 0) * mealRates.breakfast +
                                              (user.lunchCount || 0) * mealRates.lunch +
                                              (user.dinnerCount || 0) * mealRates.dinner;
                              
                              if (user.isIntern === true) {
                                internTotal += userTotal; // 100% department share for interns
                              } else {
                                regularTotal += userTotal; // 75% department share for regular employees
                              }
                            });
                            
                            const totalAmount = (actualBreakfast * mealRates.breakfast) + (actualLunch * mealRates.lunch) + (actualDinner * mealRates.dinner);
                            
                            // Calculate department payable with correct intern/regular ratios and department-specific shares
                            const internDeptShare = internTotal; // 100% for interns
                            
                            // Calculate regular employee share based on department-specific policies
                            let regularDeptShare = 0;
                            const regularEmployees = billableUsers.filter(user => !user.isFreeFood && user.isIntern !== true);
                            regularEmployees.forEach(user => {
                              const userTotal = (user.breakfastCount || 0) * mealRates.breakfast +
                                              (user.lunchCount || 0) * mealRates.lunch +
                                              (user.dinnerCount || 0) * mealRates.dinner;
                              const userDeptName = user.department || dept.department || '';
                              const userDeptShare = getDepartmentShareForDept(userDeptName, departmentShare);
                              const userDeptAmount = (userTotal * userDeptShare) / 100;
                              regularDeptShare += userDeptAmount;
                            });
                            
                            const deptPayable = internDeptShare + regularDeptShare;
                            
                            return (
                              <tr key={dept.department} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{dept.department}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{actualBreakfast}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{actualLunch}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{actualDinner}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                                  {Math.round(totalAmount).toLocaleString()}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                                  {Math.round(deptPayable).toLocaleString()}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* User-wise Bill Details Table - Show for food and custom bills */}
                {loading && (billType === 'food' || billType === 'custom') ? (
                  <div className="mb-8 bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-900">
                        Loading Individual Employee Bills...
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Calculating detailed breakdown of each employee's meal consumption
                      </p>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Breakfast</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lunch</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dinner</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Meals</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Amount</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dept. Share</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee Payable</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          <TableSkeleton rows={8} columns={9} />
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (billType === 'food' || billType === 'custom') && billData?.departments && (
                  <div className="mb-8 bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-900">
                        Individual Employee Bills{billType === 'custom' ? ` - ${customListData?.title || 'Custom List'}` : ''}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Detailed breakdown of each employee's meal consumption and bill amount
                        {billType === 'custom' && ` (Custom list: ${customListData?.title || 'Selected users'})`}
                      </p>
                    </div>
                    <div className="w-full">
                      <table className="w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
                              Employee Name
                            </th>
                            <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
                              Department
                            </th>
                            <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-1/12">
                              B
                            </th>
                            <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-1/12">
                              L
                            </th>
                            <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-1/12">
                              D
                            </th>
                            <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-1/12">
                              Total
                            </th>
                            <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-1/12">
                              Amount
                            </th>
                            <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-1/12">
                              Dept. Share
                            </th>
                            <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-1/12">
                              Employee
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {(() => {
                            // Get all users and separate into interns and regular employees
                            const allUsers = billData.departments
                              .filter(dept => !selectedDepartment || dept.department === selectedDepartment)
                              .map(dept => dept.users.map(user => ({ ...user, parentDepartment: dept.department })))
                              .flat()
                              .filter(user => !user.isFreeFood);

                            // Debug logging to see the data structure
                            console.log('All Users Data for Bill:', allUsers);
                            console.log('Sample user structure:', allUsers[0]);
                            console.log('Users with isIntern field:', allUsers.map(u => ({ name: u.name, isIntern: u.isIntern, department: u.department || u.parentDepartment })));

                            // Real intern detection - using actual database values
                            console.log('Real intern detection - checking actual isIntern values from database');
                            
                            // Show actual intern counts
                            const actualInterns = allUsers.filter(user => user.isIntern === true);
                            const actualRegular = allUsers.filter(user => user.isIntern !== true);
                            console.log(`ACTUAL DATA: ${actualInterns.length} interns, ${actualRegular.length} regular employees`);
                            
                            if (actualInterns.length > 0) {
                              console.log('Real interns found:', actualInterns.map(u => u.name));
                            } else {
                              console.log('⚠️ NO REAL INTERNS FOUND - Make sure isIntern=true is set in database for actual interns');
                            }

                            const interns = allUsers.filter(user => user.isIntern === true);
                            const regularEmployees = allUsers.filter(user => user.isIntern !== true);
                            
                            console.log('Filtered Interns:', interns);
                            console.log('Filtered Regular Employees:', regularEmployees);

                            const renderUser = (user, index, isIntern = false) => {
                              const breakfastAmount = (user.breakfastCount || 0) * mealRates.breakfast;
                              const lunchAmount = (user.lunchCount || 0) * mealRates.lunch;
                              const dinnerAmount = (user.dinnerCount || 0) * mealRates.dinner;
                              const totalMealAmount = breakfastAmount + lunchAmount + dinnerAmount;
                              const totalMeals = (user.breakfastCount || 0) + (user.lunchCount || 0) + (user.dinnerCount || 0);
                              
                              // For interns: 100% department share, 0% employee share
                              // For regular employees: use department-specific share percentage
                              const userDeptName = user.department || user.parentDepartment || '';
                              const userDeptShare = isIntern ? 100 : getDepartmentShareForDept(userDeptName, departmentShare);
                              const deptShare = (totalMealAmount * userDeptShare) / 100;
                              const empPayable = totalMealAmount - deptShare;

                              return (
                                <tr key={`${user.userId}-${index}-${isIntern ? 'intern' : 'regular'}`} className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} ${isIntern ? 'bg-yellow-50 border-l-4 border-orange-400' : ''}`}>
                                  <td className="px-2 py-4 text-sm font-medium text-gray-900 truncate">
                                    {user.name || 'N/A'}{isIntern ? ' 📚' : ''}
                                  </td>
                                  <td className="px-2 py-4 text-sm text-gray-500 truncate">
                                    {user.department || user.parentDepartment || 'N/A'}
                                  </td>
                                  <td className="px-2 py-4 text-sm text-gray-500 text-center">
                                    <div className="flex flex-col">
                                      <span className="text-xs">{user.breakfastCount || 0}</span>
                                      <span className="text-xs text-gray-400">{breakfastAmount.toFixed(0)}</span>
                                    </div>
                                  </td>
                                  <td className="px-2 py-4 text-sm text-gray-500 text-center">
                                    <div className="flex flex-col">
                                      <span className="text-xs">{user.lunchCount || 0}</span>
                                      <span className="text-xs text-gray-400">{lunchAmount.toFixed(0)}</span>
                                    </div>
                                  </td>
                                  <td className="px-2 py-4 text-sm text-gray-500 text-center">
                                    <div className="flex flex-col">
                                      <span className="text-xs">{user.dinnerCount || 0}</span>
                                      <span className="text-xs text-gray-400">{dinnerAmount.toFixed(0)}</span>
                                    </div>
                                  </td>
                                  <td className="px-2 py-4 text-sm text-gray-500 text-center">
                                    <span className="font-medium text-xs">{totalMeals}</span>
                                  </td>
                                  <td className="px-2 py-4 text-sm font-semibold text-blue-600 text-center">
                                    <span className="text-xs">{totalMealAmount.toFixed(0)}</span>
                                  </td>
                                  <td className="px-2 py-4 text-sm font-semibold text-green-600 text-center">
                                    <span className="text-xs">{deptShare.toFixed(0)}</span>
                                  </td>
                                  <td className="px-2 py-4 text-sm font-semibold text-red-600 text-center">
                                    <span className="text-xs">{empPayable.toFixed(0)}</span>
                                  </td>
                                </tr>
                              );
                            };

                            return (
                              <>
                                {/* Render interns first */}
                                {interns.length > 0 && (
                                  <>
                                    <tr className="bg-orange-500">
                                      <td colSpan="9" className="px-2 py-3 text-center text-white font-bold text-xs">
                                        🎓 INTERNS ({interns.length} students) - 100% Department Share, 0% Employee Share
                                      </td>
                                    </tr>
                                    {interns.map((user, index) => renderUser(user, index, true))}
                                  </>
                                )}
                                
                                {/* Render regular employees */}
                                {regularEmployees.length > 0 && (
                                  <>
                                    {interns.length > 0 && (
                                      <tr className="bg-gray-600">
                                        <td colSpan="9" className="px-2 py-3 text-center text-white font-bold text-xs">
                                          👥 REGULAR EMPLOYEES ({regularEmployees.length} staff) - Department-specific Share Rates
                                        </td>
                                      </tr>
                                    )}
                                    {regularEmployees.map((user, index) => renderUser(user, index, false))}
                                  </>
                                )}
                              </>
                            );
                          })()}
                        </tbody>
                      </table>
                      
                      {/* Summary Row */}
                      <tfoot className="bg-gray-100 border-t-2 border-gray-300">
                        <tr>
                          <td className="px-2 py-4 text-sm font-bold text-gray-900" colSpan="6">
                            TOTAL ({billData.departments
                              .filter(dept => !selectedDepartment || dept.department === selectedDepartment)
                              .reduce((acc, dept) => acc + dept.users.filter(user => !user.isFreeFood).length, 0)} employees)
                          </td>
                          <td className="px-2 py-4 text-sm font-bold text-blue-600 text-center">
                            <span className="text-xs">{Math.round(totalAmount).toLocaleString()}</span>
                          </td>
                          <td className="px-2 py-4 text-sm font-bold text-green-600 text-center">
                            <span className="text-xs">{Math.round(departmentPayable).toLocaleString()}</span>
                          </td>
                          <td className="px-2 py-4 text-sm font-bold text-red-600 text-center">
                            <span className="text-xs">{Math.round(employeePayable).toLocaleString()}</span>
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
                        className="block w-full px-4 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 rounded-lg bg-white transition-all duration-200"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">To Date</label>
                      <input
                        type="date"
                        name="endDate"
                        value={dateRange.endDate}
                        onChange={handleDateChange}
                        className="block w-full px-4 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 rounded-lg bg-white transition-all duration-200"
                      />
                    </div>
                  </div>
                </div>



                {/* Meal Rates (show for food, guest, and custom bills) */}
                {(billType === 'food' || billType === 'guest' || billType === 'custom') && (
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
                {(billType === 'food' || billType === 'custom') ? (
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
                ) : (
                  <div className="mb-8">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Department Share</h2>
                    <p className="text-sm text-gray-700">
                      {billType === 'department' 
                        ? '75% for food bills, 100% for venue rent' 
                        : '100% (applies to all non-food bills)'}
                    </p>
                  </div>
                )}

                {/* Generate Button */}
                <div className="flex justify-end space-x-4">
                  <button
                    onClick={handleGenerateClick}
                    disabled={loading}
                    className="inline-flex items-center px-6 py-3 bg-green-950 text-white font-semibold rounded-lg hover:bg-green-900 focus:outline-none focus:ring-2 focus:ring-green-800 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50"
                  >
                    {loading ? 'Calculating...' : 'Generate Bills'}
                  </button>
                  
                  {(billType === 'food' && billData && departmentData?.departments) && (
                    <PDFErrorBoundary>
                      <PDFDownloadLink
                        document={
                          <BillPDF
                            billData={billData}
                            rentData={rentData}
                            guestMealData={guestMealData}
                            meetingFoodData={meetingFoodData}
                            departmentBillData={departmentBillData}
                            dateRange={dateRange}
                            mealRates={mealRates}
                            meetingFoodRates={meetingFoodRates}

                            departmentShare={departmentShare}
                            totalAmount={totalAmount}
                            departmentPayable={departmentPayable}
                            employeePayable={employeePayable}
                            departmentData={departmentData}
                            selectedDepartment={selectedDepartment}
                            billType={billType}
                            selectedVenue={selectedVenue}
                            customListData={customListData}
                          />
                        }
                        fileName={`employee-meal-details-${format(new Date(dateRange.startDate), 'yyyy-MM-dd')}${selectedDepartment ? `-${selectedDepartment}` : ''}.pdf`}
                        className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                      >
                        {({ blob, url, loading, error }) => {
                          if (loading) return 'Preparing PDF...';
                          if (error) {
                            console.error('PDF generation error:', error);
                            return 'Error generating PDF';
                          }
                          return 'Download Employee Details PDF';
                        }}
                      </PDFDownloadLink>
                    </PDFErrorBoundary>
                  )}

                  {(billType === 'custom' && billData) && (
                    <PDFErrorBoundary>
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
                            billType={billType}
                            customListData={customListData}
                          />
                        }
                        fileName={`custom-list-bill-${customListData?.title || 'custom'}-${format(new Date(dateRange.startDate), 'yyyy-MM-dd')}.pdf`}
                        className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                      >
                        {({ blob, url, loading, error }) => {
                          if (loading) return 'Preparing PDF...';
                          if (error) {
                            console.error('PDF generation error:', error);
                            return 'Error generating PDF';
                          }
                          return 'Download Custom List PDF';
                        }}
                      </PDFDownloadLink>
                    </PDFErrorBoundary>
                  )}

                  {/* New PDF buttons for other bill types */}
                  {(billType === 'rent' && rentData?.departments) && (
                    <PDFErrorBoundary>
                      <PDFDownloadLink
                        document={
                          <SummaryPDF
                            billType={billType}
                            dateRange={dateRange}
                            rentData={rentData}
                            selectedVenue={selectedVenue}
                            selectedDepartment={selectedDepartment}
                          />
                        }
                        fileName={`venue-rent-${selectedVenue ? selectedVenue.replace(/\s+/g, '-') : 'all'}-${format(new Date(dateRange.startDate), 'yyyy-MM-dd')}.pdf`}
                        className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                      >
                        {({ loading, error }) => {
                          if (loading) return 'Preparing PDF...';
                          if (error) return 'Error generating PDF';
                          return 'Download Rent PDF';
                        }}
                      </PDFDownloadLink>
                    </PDFErrorBoundary>
                  )}

                  {(billType === 'guest' && guestMealData?.departments) && (
                    <PDFErrorBoundary>
                      <PDFDownloadLink
                        document={
                          <SummaryPDF
                            billType={billType}
                            dateRange={dateRange}
                            guestMealData={guestMealData}
                            mealRates={mealRates}
                            selectedDepartment={selectedDepartment}
                          />
                        }
                        fileName={`guest-meals-${format(new Date(dateRange.startDate), 'yyyy-MM-dd')}.pdf`}
                        className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
                      >
                        {({ loading, error }) => {
                          if (loading) return 'Preparing PDF...';
                          if (error) return 'Error generating PDF';
                          return 'Download Guest Meals PDF';
                        }}
                      </PDFDownloadLink>
                    </PDFErrorBoundary>
                  )}

                  {(billType === 'meeting' && meetingFoodData?.departments) && (
                    <PDFErrorBoundary>
                      <PDFDownloadLink
                        document={
                          <SummaryPDF
                            billType={billType}
                            dateRange={dateRange}
                            meetingFoodData={meetingFoodData}
                            meetingFoodRates={meetingFoodRates}
                            selectedDepartment={selectedDepartment}
                          />
                        }
                        fileName={`meeting-food-${format(new Date(dateRange.startDate), 'yyyy-MM-dd')}.pdf`}
                        className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        {({ loading, error }) => {
                          if (loading) return 'Preparing PDF...';
                          if (error) return 'Error generating PDF';
                          return 'Download Meeting Food PDF';
                        }}
                      </PDFDownloadLink>
                    </PDFErrorBoundary>
                  )}

                  {(billType === 'department' && departmentBillData?.departments) && (
                    <PDFErrorBoundary>
                      <PDFDownloadLink
                        document={
                          <SummaryPDF
                            billType={billType}
                            dateRange={dateRange}
                            departmentBillData={departmentBillData}
                            selectedDepartment={selectedDepartment}
                          />
                        }
                        fileName={`department-bill-summary-${format(new Date(dateRange.startDate), 'yyyy-MM-dd')}.pdf`}
                        className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        {({ loading, error }) => {
                          if (loading) return 'Preparing PDF...';
                          if (error) return 'Error generating PDF';
                          return 'Download Department Summary PDF';
                        }}
                      </PDFDownloadLink>
                    </PDFErrorBoundary>
                  )}

                  {(billType === 'department-detailed' && detailedDepartmentData?.departments) && (
                    <PDFErrorBoundary>
                      <PDFDownloadLink
                        document={
                          <DetailedDepartmentPDF
                            detailedDepartmentData={detailedDepartmentData}
                            dateRange={dateRange}
                            mealRates={mealRates}
                            meetingFoodRates={meetingFoodRates}

                            selectedDepartment={selectedDepartment}
                          />
                        }
                        fileName={`department-bill-detailed-${format(new Date(dateRange.startDate), 'yyyy-MM-dd')}.pdf`}
                        className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                      >
                        {({ loading, error }) => {
                          if (loading) return 'Preparing PDF...';
                          if (error) return 'Error generating PDF';
                          return 'Download Detailed Department PDF';
                        }}
                      </PDFDownloadLink>
                    </PDFErrorBoundary>
                  )}

                  {(billType === 'invoice' && invoiceData) && (
                    <PDFErrorBoundary>
                      <PDFDownloadLink
                        document={<InvoicePDF invoiceData={invoiceData} selectedDepartment={selectedDepartment} dateRange={dateRange} />}
                        fileName={`invoice-${selectedDepartment}-${format(new Date(dateRange.startDate), 'yyyy-MM-dd')}.pdf`}
                        className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
                      >
                        {({ loading, error }) => {
                          if (loading) return 'Preparing PDF...';
                          if (error) return 'Error generating PDF';
                          return 'Download Invoice PDF';
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