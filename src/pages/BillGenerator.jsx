import React, { useState, useEffect, memo } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import { PDFDownloadLink, pdf } from '@react-pdf/renderer';
import { ExclamationTriangleIcon, PencilIcon, TrashIcon, PlusIcon } from '@heroicons/react/24/outline';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import ConfirmDialog from '../components/ConfirmDialog';
import { TableSkeleton } from '../components/SkeletonLoaders';
import { Document, Page, Text, View, StyleSheet, Font, Image } from '@react-pdf/renderer';
import HiraPlus from '../assets/HiraPlus.jpg';
import NotoSerifMalayalam from '../fonts/NotoSerifMalayalam-Regular.ttf';

Font.register({
  family: 'Noto Serif Malayalam',
  src: NotoSerifMalayalam,
});

// Use default fonts for reliable PDF generation
// The Malayalam font file is causing compatibility issues with @react-pdf/renderer
// We'll use default fonts and handle Malayalam text encoding properly
console.log('Using default fonts for PDF generation');

// Helper function to get department share percentage based on department name
const getDepartmentShareForDept = (departmentName, defaultShare) => {
  if (!departmentName) return defaultShare;
  
  const deptName = departmentName.toLowerCase().trim();
  
  // GIO and Solidarity departments: 100% department share (department pays 100%)
  if (deptName === 'gio' || deptName === 'solidarity') {
    return 100;
  }
  
  // All other departments: use the provided default share
  return defaultShare;
};

// Define styles for PDF with updated styling and Malayalam font support
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 15,
  },
  header: {
    fontSize: 10,
    marginBottom: 2,
    textAlign: 'center',
    fontWeight: 'bold',
    color: '#000000', // Black for better printing
    fontFamily: 'Noto Serif Malayalam',
  },
  section: {
    margin: 2,
    padding: 2,
  },
  table: {
    display: 'table',
    width: 'auto',
    marginVertical: 2,
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#000000',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#000000',
    borderBottomStyle: 'solid',
    alignItems: 'center',
    minHeight: 18,
    paddingVertical: 2,
  },
  tableHeader: {
    backgroundColor: '#F5F5F5', // Light gray background
    borderBottomWidth: 2,
    borderBottomColor: '#000000', // Black border
    fontWeight: 'bold',
  },
  tableCell: {
    flex: 1,
    fontSize: 8,
    padding: 2,
    textAlign: 'left',
    color: '#000000',
    borderRightWidth: 1,
    borderRightColor: '#000000',
    fontFamily: 'Noto Serif Malayalam',
  },
  tableCellRight: {
    flex: 1,
    fontSize: 8,
    padding: 2,
    textAlign: 'right',
    color: '#000000',
    borderRightWidth: 1,
    borderRightColor: '#000000',
    fontFamily: 'Noto Serif Malayalam',
  },
  tableCellCompact: {
    flex: 1,
    fontSize: 8,
    padding: 1,
    textAlign: 'center',
    color: '#000000',
    borderRightWidth: 1,
    borderRightColor: '#000000',
    fontFamily: 'Noto Serif Malayalam',
  },
  tableCellRightCompact: {
    flex: 1,
    fontSize: 8,
    padding: 1,
    textAlign: 'right',
    color: '#000000',
    borderRightWidth: 1,
    borderRightColor: '#000000',
    fontFamily: 'Noto Serif Malayalam',
  },
  summaryCard: {
    marginVertical: 4,
    padding: 5,
    borderWidth: 1,
    borderColor: '#000000', // Black border
    borderRadius: 4,
    backgroundColor: '#F5F5F5', // Light gray background
  },
  summaryTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 3,
    color: '#000000', // Black text
    fontFamily: 'Noto Serif Malayalam',
  },
  summaryValue: {
    fontSize: 8,
    color: '#000000', // Black text
    fontFamily: 'Noto Serif Malayalam',
  },
  dateRange: {
    fontSize: 8,
    marginBottom: 2,
    color: '#000000', // Black text
    textAlign: 'center',
    fontFamily: 'Noto Serif Malayalam',
  },
  ratesInfo: {
    fontSize: 8,
    color: '#000000', // Black text
    marginBottom: 3,
    textAlign: 'center',
    fontFamily: 'Noto Serif Malayalam',
  },
  mealCount: {
    fontSize: 7,
    color: '#000000', // Black text
    marginTop: 1,
    fontFamily: 'Noto Serif Malayalam',
  },
  logo: {
    width: 60,
    height: 40,
    marginBottom: 3,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerText: {
    flex: 1,
    textAlign: 'center',
  },
  title: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#000000', // Black text
    marginBottom: 1,
    fontFamily: 'Noto Serif Malayalam',
  },
  subtitle: {
    fontSize: 8,
    color: '#000000', // Black text
    fontFamily: 'Noto Serif Malayalam',
  },
  logoContainer: {
    alignItems: 'center',
    marginRight: 10,
  },
  logoText: {
    fontSize: 7,
    fontWeight: 'bold',
    color: '#000000',
    textAlign: 'center',
    marginTop: 1,
    fontFamily: 'Noto Serif Malayalam',
  },
  totalRow: {
    borderTopWidth: 2,
    borderTopColor: '#374151',
    backgroundColor: '#F3F4F6',
    fontSize: 8,
  },
  totalText: {
    fontSize: 8,
    fontWeight: 'bold',
    fontFamily: 'Noto Serif Malayalam',
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
            src={HiraPlus} 
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
                  <Text style={[styles.tableCell, { flex: 0.6 }]}>S.No.</Text>
                  <Text style={[styles.tableCell, { flex: 1.8 }]}>Name</Text>
                  <Text style={[styles.tableCell, { flex: 1.4 }]}>Dept</Text>
                  <Text style={[styles.tableCellRightCompact, { flex: 0.8 }]}>B</Text>
                  <Text style={[styles.tableCellRightCompact, { flex: 0.8 }]}>L</Text>
                  <Text style={[styles.tableCellRightCompact, { flex: 0.8 }]}>D</Text>
                  <Text style={[styles.tableCellRight, { flex: 1.1 }, styles.verticalLine]}>Total Meals</Text>
                  <Text style={[styles.tableCellRight, { flex: 1.1 }, styles.verticalLine]}>Total Amount</Text>
                  <Text style={[styles.tableCellRight, { flex: 1.1 }, styles.verticalLine]}>Dept. Share</Text>
                  <Text style={[styles.tableCellRight, { flex: 1.1 }]}>Employee Payable</Text>
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
                        <Text style={[styles.tableCell, { flex: 0.6 }]}>{index + 1}</Text>
                        <Text style={[styles.tableCell, { flex: 1.8 }]}>{user.name || 'N/A'}{isIntern ? ' (Intern)' : ''}</Text>
                        <Text style={[styles.tableCell, { flex: 1.4 }]}>{
                          user.department || user.parentDepartment || 'N/A'
                        }</Text>
                        <Text style={[styles.tableCellRightCompact, { flex: 0.8 }]}>{user.breakfastCount || 0}</Text>
                        <Text style={[styles.tableCellRightCompact, { flex: 0.8 }]}>{user.lunchCount || 0}</Text>
                        <Text style={[styles.tableCellRightCompact, { flex: 0.8 }]}>{user.dinnerCount || 0}</Text>
                        <Text style={[styles.tableCellRight, { flex: 1.1 }, styles.verticalLine]}>{totalMeals}</Text>
                        <Text style={[styles.tableCellRight, { flex: 1.1 }, styles.verticalLine]}>{totalMealAmount.toFixed(2)}</Text>
                        <Text style={[styles.tableCellRight, { flex: 1.1 }, styles.verticalLine]}>{deptShareCalc.toFixed(2)}</Text>
                        <Text style={[styles.tableCellRight, { flex: 1.1 }]}>{empPayableCalc.toFixed(2)}</Text>
                      </View>
                    );
                  };

                  return (
                    <>
                      {/* Render interns first */}
                      {interns.length > 0 && (
                        <>
                          <View style={[styles.tableRow, { backgroundColor: '#F59E0B', borderTopWidth: 2, borderTopColor: '#D97706' }]}>
                            <Text style={[styles.tableCell, { flex: 10, fontWeight: 'bold', fontSize: 12, color: 'white', textAlign: 'center' }]}>
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
                            <Text style={[styles.tableCell, { flex: 10, fontWeight: 'bold', fontSize: 12, color: 'white', textAlign: 'center' }]}>
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
                      <Text style={[styles.tableCell, { flex: 2, fontWeight: 'bold', fontSize: 9 }]}>TOTAL ({allUsers.length} )</Text>
                      <Text style={[styles.tableCell, { flex: 1.5, fontWeight: 'bold', fontSize: 9 }]}>-</Text>
                      <Text style={[styles.tableCellRightCompact, { flex: 1, fontWeight: 'bold', fontSize: 9 }]}>{totalBreakfast}</Text>
                      <Text style={[styles.tableCellRightCompact, { flex: 1, fontWeight: 'bold', fontSize: 9 }]}>{totalLunch}</Text>
                      <Text style={[styles.tableCellRightCompact, { flex: 1, fontWeight: 'bold', fontSize: 9 }]}>{totalDinner}</Text>
                      <Text style={[styles.tableCellRight, { flex: 1.2, fontWeight: 'bold', fontSize: 9 }, styles.totalText, styles.verticalLine]}>{totalMealsCount}</Text>
                      <Text style={[styles.tableCellRight, { flex: 1.2, fontWeight: 'bold', fontSize: 9 }, styles.totalText, styles.verticalLine]}>{grandTotal.toFixed(2)}</Text>
                      <Text style={[styles.tableCellRight, { flex: 1.2, fontWeight: 'bold', fontSize: 9 }, styles.totalText, styles.verticalLine]}>{totalDeptShare.toFixed(2)}</Text>
                      <Text style={[styles.tableCellRight, { flex: 1.2, fontWeight: 'bold', fontSize: 9 }, styles.totalText]}>{totalEmpPayable.toFixed(2)}</Text>
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
                  <Text style={[styles.tableCell, { flex: 0.8 }]}>S.No.</Text>
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
                      <Text style={[styles.tableCell, { flex: 0.8 }]}>{idx + 1}</Text>
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
                      <Text style={[styles.tableCell, { flex: 2, fontWeight: 'bold', fontSize: 9 }]}>TOTAL ({filteredDepts.length})</Text>
                      <Text style={[styles.tableCellRight, { flex: 1, fontWeight: 'bold', fontSize: 9 }]}>{totalMeetings}</Text>
                      <Text style={[styles.tableCellRight, { flex: 1, fontWeight: 'bold', fontSize: 9 }]}>{totalAuditorium}</Text>
                      <Text style={[styles.tableCellRight, { flex: 1, fontWeight: 'bold', fontSize: 9 }]}>{totalConference}</Text>
                      <Text style={[styles.tableCellRight, { flex: 1, fontWeight: 'bold', fontSize: 9 }]}>{totalMeetingSpace}</Text>
                      <Text style={[styles.tableCellRight, { flex: 1.2, fontWeight: 'bold', fontSize: 9 }]}>{totalAmount.toFixed(2)}</Text>
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
    // Guest meals section - update department text with sanitizeText
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
                      <Text style={[styles.tableCell, { flex: 2, fontWeight: 'bold', fontSize: 9 }]}>TOTAL ({filteredDepts.length} departments)</Text>
                      <Text style={[styles.tableCellRight, { flex: 1, fontWeight: 'bold', fontSize: 9 }]}>{totalBreakfast}</Text>
                      <Text style={[styles.tableCellRight, { flex: 1, fontWeight: 'bold', fontSize: 9 }]}>{totalLunch}</Text>
                      <Text style={[styles.tableCellRight, { flex: 1, fontWeight: 'bold', fontSize: 9 }]}>{totalDinner}</Text>
                      <Text style={[styles.tableCellRight, { flex: 1.2, fontWeight: 'bold', fontSize: 9 }]}>{totalAmount.toFixed(2)}</Text>
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
                      <Text style={[styles.tableCell, { flex: 2, fontWeight: 'bold', fontSize: 9 }]}>TOTAL ({filteredDepts.length} departments)</Text>
                      <Text style={[styles.tableCellRight, { flex: 1, fontWeight: 'bold', fontSize: 9 }]}>{totalBreakfast}</Text>
                      <Text style={[styles.tableCellRight, { flex: 1, fontWeight: 'bold', fontSize: 9 }]}>{totalLunch}</Text>
                      <Text style={[styles.tableCellRight, { flex: 1, fontWeight: 'bold', fontSize: 9 }]}>{totalDinner}</Text>
                      <Text style={[styles.tableCellRight, { flex: 1, fontWeight: 'bold', fontSize: 9 }]}>{totalMorningSnacks}</Text>
                      <Text style={[styles.tableCellRight, { flex: 1, fontWeight: 'bold', fontSize: 9 }]}>{totalMorningTea}</Text>
                      <Text style={[styles.tableCellRight, { flex: 1, fontWeight: 'bold', fontSize: 9 }]}>{totalEveningSnacks}</Text>
                      <Text style={[styles.tableCellRight, { flex: 1, fontWeight: 'bold', fontSize: 9 }]}>{totalEveningTea}</Text>
                      <Text style={[styles.tableCellRight, { flex: 1.2, fontWeight: 'bold', fontSize: 9 }]}>{totalAmount.toFixed(2)}</Text>
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
                      <Text style={[styles.tableCell, { flex: 2, fontWeight: 'bold', fontSize: 9 }]}>TOTAL ({filteredDepts.length} departments)</Text>
                      <Text style={[styles.tableCellRight, { flex: 1.2, fontWeight: 'bold', fontSize: 9 }]}>{totalFoodShare.toFixed(2)}</Text>
                      <Text style={[styles.tableCellRight, { flex: 1.2, fontWeight: 'bold', fontSize: 9 }]}>{totalRent.toFixed(2)}</Text>
                      <Text style={[styles.tableCellRight, { flex: 1.2, fontWeight: 'bold', fontSize: 9 }]}>{totalMeetingFood.toFixed(2)}</Text>
                      <Text style={[styles.tableCellRight, { flex: 1.2, fontWeight: 'bold', fontSize: 9 }]}>{totalGuestMeals.toFixed(2)}</Text>
                      <Text style={[styles.tableCellRight, { flex: 1.2, fontWeight: 'bold', fontSize: 9 }]}>{grandTotal.toFixed(2)}</Text>
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
            src={HiraPlus} 
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
                  <Text style={[styles.tableCell, { flex: 0.8 }]}>S.No.</Text>
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
                      <Text style={[styles.tableCell, { flex: 0.8 }]}>{idx + 1}</Text>
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
                      <Text style={[styles.tableCell, { flex: 2.4, fontWeight: 'bold', fontSize: 9 }]}>TOTAL ({filteredDepts.length} )</Text>
                      <Text style={[styles.tableCellRight, { flex: 0.9, fontWeight: 'bold', fontSize: 9 }]}>{totalMeetings}</Text>
                      <Text style={[styles.tableCellRight, { flex: 0.9, fontWeight: 'bold', fontSize: 9 }]}>{totalAuditorium}</Text>
                      <Text style={[styles.tableCellRight, { flex: 0.9, fontWeight: 'bold', fontSize: 9 }]}>{totalConference}</Text>
                      <Text style={[styles.tableCellRight, { flex: 0.9, fontWeight: 'bold', fontSize: 9 }]}>{totalMeetingSpace}</Text>
                      <Text style={[styles.tableCellRight, { flex: 1.1, fontWeight: 'bold', fontSize: 9 }]}>{totalAmount.toFixed(2)}</Text>
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
                  <Text style={[styles.tableCell, { flex: 0.8 }]}>S.No.</Text>
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
                        <Text style={[styles.tableCell, { flex: 0.6 }]}>{idx + 1}</Text>
                        <Text style={[styles.tableCell, { flex: 1.8 }]}>{d.department}</Text>
                        <Text style={[styles.tableCellRight, { flex: 0.9 }]}>{d.breakfastCount || 0}</Text>
                        <Text style={[styles.tableCellRight, { flex: 0.9 }]}>{d.lunchCount || 0}</Text>
                        <Text style={[styles.tableCellRight, { flex: 0.9 }]}>{d.dinnerCount || 0}</Text>
                        <Text style={[styles.tableCellRight, { flex: 1.1 }]}>{amt.toFixed(2)}</Text>
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
                      <Text style={[styles.tableCell, { flex: 2.4, fontWeight: 'bold', fontSize: 9 }]}>TOTAL ({filteredDepts.length})</Text>
                      <Text style={[styles.tableCellRight, { flex: 0.9, fontWeight: 'bold', fontSize: 9 }]}>{totalBreakfast}</Text>
                      <Text style={[styles.tableCellRight, { flex: 0.9, fontWeight: 'bold', fontSize: 9 }]}>{totalLunch}</Text>
                      <Text style={[styles.tableCellRight, { flex: 0.9, fontWeight: 'bold', fontSize: 9 }]}>{totalDinner}</Text>
                      <Text style={[styles.tableCellRight, { flex: 1.1, fontWeight: 'bold', fontSize: 9 }]}>{totalAmount.toFixed(2)}</Text>
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
                  <Text style={[styles.tableCell, { flex: 0.8 }]}>S.No.</Text>
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
                      <Text style={[styles.tableCell, { flex: 2, fontWeight: 'bold', fontSize: 9 }]}>TOTAL ({filteredDepts.length} departments)</Text>
                      <Text style={[styles.tableCellRight, { flex: 1, fontWeight: 'bold', fontSize: 9 }]}>{totalBreakfast}</Text>
                      <Text style={[styles.tableCellRight, { flex: 1, fontWeight: 'bold', fontSize: 9 }]}>{totalLunch}</Text>
                      <Text style={[styles.tableCellRight, { flex: 1, fontWeight: 'bold', fontSize: 9 }]}>{totalDinner}</Text>
                      <Text style={[styles.tableCellRight, { flex: 1, fontWeight: 'bold', fontSize: 9 }]}>{totalMorningSnacks}</Text>
                      <Text style={[styles.tableCellRight, { flex: 1, fontWeight: 'bold', fontSize: 9 }]}>{totalMorningTea}</Text>
                      <Text style={[styles.tableCellRight, { flex: 1, fontWeight: 'bold', fontSize: 9 }]}>{totalEveningSnacks}</Text>
                      <Text style={[styles.tableCellRight, { flex: 1, fontWeight: 'bold', fontSize: 9 }]}>{totalEveningTea}</Text>
                      <Text style={[styles.tableCellRight, { flex: 1.2, fontWeight: 'bold', fontSize: 9 }]}>{totalAmount.toFixed(2)}</Text>
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
                  <Text style={[styles.tableCell, { flex: 0.8 }]}>S.No.</Text>
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
                      <Text style={[styles.tableCell, { flex: 2, fontWeight: 'bold', fontSize: 9 }]}>TOTAL ({filteredDepts.length} departments)</Text>
                      <Text style={[styles.tableCellRight, { flex: 1.2, fontWeight: 'bold', fontSize: 9 }]}>{totalFoodShare.toFixed(2)}</Text>
                      <Text style={[styles.tableCellRight, { flex: 1.2, fontWeight: 'bold', fontSize: 9 }]}>{totalRent.toFixed(2)}</Text>
                      <Text style={[styles.tableCellRight, { flex: 1.2, fontWeight: 'bold', fontSize: 9 }]}>{totalMeetingFood.toFixed(2)}</Text>
                      <Text style={[styles.tableCellRight, { flex: 1.2, fontWeight: 'bold', fontSize: 9 }]}>{totalGuestMeals.toFixed(2)}</Text>
                      <Text style={[styles.tableCellRight, { flex: 1.2, fontWeight: 'bold', fontSize: 9 }]}>{grandTotal.toFixed(2)}</Text>
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
            src={HiraPlus} 
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
                            <Text style={{ fontSize: 8, fontWeight: 'bold', color: '#000000' }}>
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
                          <Text style={{ fontSize: 8, fontWeight: 'bold', color: '#000000' }}>
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
                    <Text style={{ fontSize: 8, color: '#6B7280' }}>Total Food Consumed:</Text>
                    <Text style={{ fontSize: 8 }}>{dept.totalFoodAmount?.toFixed(2) || '0.00'}</Text>
                  </View>
                  
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 }}>
                    <Text style={{ fontSize: 8, color: '#6B7280' }}>Department Share:</Text>
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
                    <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#000000' }}>{dept.totalAmount.toFixed(2)}</Text>
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
                  <Text style={{ fontSize: 9, color: '#6B7280' }}>Total Food Consumed:</Text>
                  <Text style={{ fontSize: 9, fontWeight: 'bold' }}>{filteredDepts.reduce((sum, dept) => sum + (dept.totalFoodAmount || 0), 0).toFixed(2)}</Text>
                </View>
                
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                  <Text style={{ fontSize: 9, color: '#6B7280' }}>Department Share:</Text>
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
                  <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#000000' }}>{grandTotal.toFixed(2)}</Text>
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

// Regular Invoice PDF component for non-hierarchical departments
const RegularInvoicePDF = memo(({ invoiceData, selectedDepartment, dateRange }) => {
  console.log('RegularInvoicePDF: Rendering with data:', { invoiceData, selectedDepartment, dateRange });
  
  // Enhanced safety checks to prevent PDF generation errors
  if (!invoiceData || !dateRange?.startDate || !dateRange?.endDate) {
    console.log('RegularInvoicePDF: Missing required data', { invoiceData, dateRange });
    return null;
  }
  
  // Ensure all required fields exist with fallbacks
  const safeInvoiceData = {
    foodShare: Number(invoiceData.foodShare) || 0,
    employeeFoodShare: Number(invoiceData.employeeFoodShare) || 0,
    rentTotal: Number(invoiceData.rentTotal) || 0,
    meetingFoodTotal: Number(invoiceData.meetingFoodTotal) || 0,
    guestMealTotal: Number(invoiceData.guestMealTotal) || 0,
    total: Number(invoiceData.total) || 0,
    meetings: Array.isArray(invoiceData.meetings) ? invoiceData.meetings : []
  };
  
  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <View style={styles.logoContainer}>
        <Image 
          src={HiraPlus} 
          style={styles.logo}
        />
        <Text style={styles.logoText}>Hira Plus</Text>
      </View>
      <View style={styles.headerText}>
        <Text style={styles.title}>
          JAMA AT E ISLAMI HIND KERALA
        </Text>
        <Text style={styles.subtitle}>
          HIRA CENTRE, KOZHIKODE - 673004
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
        {renderHeader()}
        
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
               <Text style={[styles.tableCell, { flex: 3 }]}>Department Food Share</Text>
               <Text style={[styles.tableCellRight, { flex: 1.2 }]}>{safeInvoiceData.foodShare.toFixed(2)}</Text>
             </View>
             <View style={styles.tableRow}>
               <Text style={[styles.tableCell, { flex: 3 }]}>Total Food Share by Employee</Text>
               <Text style={[styles.tableCellRight, { flex: 1.2 }]}>{safeInvoiceData.employeeFoodShare.toFixed(2)}</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, { flex: 3 }]}>Venue Rent</Text>
               <Text style={[styles.tableCellRight, { flex: 1.2 }]}>{safeInvoiceData.rentTotal.toFixed(2)}</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, { flex: 3 }]}>Meeting Food</Text>
               <Text style={[styles.tableCellRight, { flex: 1.2 }]}>{safeInvoiceData.meetingFoodTotal.toFixed(2)}</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, { flex: 3 }]}>Guest Meals</Text>
               <Text style={[styles.tableCellRight, { flex: 1.2 }]}>{safeInvoiceData.guestMealTotal.toFixed(2)}</Text>
            </View>
            <View style={[styles.tableRow, { borderBottomWidth: 0 }]}>
              <Text style={[styles.tableCell, { flex: 3, fontWeight: 'bold' }]}>TOTAL</Text>
               <Text style={[styles.tableCellRight, { flex: 1.2, fontWeight: 'bold' }]}>{safeInvoiceData.total.toFixed(2)}</Text>
            </View>
          </View>
        </View>
        
        

                 {/* Meeting Details */}
         {safeInvoiceData.meetings && safeInvoiceData.meetings.length > 0 && (
          <View style={{ marginBottom: 10 }}>
            <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#374151', marginBottom: 5 }}>Meetings Conducted:</Text>
            <View style={styles.table}>
              <View style={[styles.tableRow, styles.tableHeader]}>
                <Text style={[styles.tableCell, { flex: 2 }]}>Meeting Name</Text>
                <Text style={[styles.tableCell, { flex: 1 }]}>Date</Text>
              </View>
                             {safeInvoiceData.meetings.map((meeting, index) => (
                <View key={index} style={styles.tableRow}>
                  <Text style={[styles.tableCell, { flex: 2, fontSize: 8 }]}>{meeting.title || 'N/A'}</Text>
                  <Text style={[styles.tableCell, { flex: 1, fontSize: 8 }]}>
                    {format(new Date(meeting.startDatetime), 'dd/MM/yyyy')}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </Page>
    </Document>
  );
});

// Hierarchical Invoice PDF component for departments with sub-departments
const HierarchicalInvoicePDF = memo(({ invoiceData, selectedDepartment, selectedSubDepartment, dateRange }) => {
  console.log('HierarchicalInvoicePDF: Rendering with data:', { invoiceData, selectedDepartment, selectedSubDepartment, dateRange });
  
  // Enhanced safety checks to prevent PDF generation errors
  if (!invoiceData || !dateRange?.startDate || !dateRange?.endDate) {
    console.log('HierarchicalInvoicePDF: Missing required data', { invoiceData, dateRange });
    return null;
  }
  
  console.log('HierarchicalInvoicePDF Debug:', {
    invoiceData,
    selectedDepartment,
    selectedSubDepartment,
    subDepartmentBreakdown: invoiceData.subDepartmentBreakdown
  });
  
  // Ensure all required fields exist with fallbacks
  const safeInvoiceData = {
    foodShare: Number(invoiceData.foodShare) || 0,
    employeeFoodShare: Number(invoiceData.employeeFoodShare) || 0,
    rentTotal: Number(invoiceData.rentTotal) || 0,
    meetingFoodTotal: Number(invoiceData.meetingFoodTotal) || 0,
    guestMealTotal: Number(invoiceData.guestMealTotal) || 0,
    total: Number(invoiceData.total) || 0,
    meetings: Array.isArray(invoiceData.meetings) ? invoiceData.meetings : [],
    subDepartmentBreakdown: []
  };
  
  // Safe sub-department breakdown processing
  if (invoiceData.subDepartmentBreakdown && Array.isArray(invoiceData.subDepartmentBreakdown)) {
    try {
      safeInvoiceData.subDepartmentBreakdown = invoiceData.subDepartmentBreakdown.map(item => {
        if (!item || typeof item !== 'object') {
          console.warn('Invalid sub-department item:', item);
          return {
            title: 'Unknown',
            meetings: [],
            meetingFoodTotal: 0,
            rentTotal: 0,
            total: 0
          };
        }
        
        return {
          title: String(item.title || 'Unknown'),
          meetings: Array.isArray(item.meetings) ? item.meetings : [],
          meetingFoodTotal: Number(item.meetingFoodTotal) || 0,
          rentTotal: Number(item.rentTotal) || 0,
          total: Number(item.total) || 0
        };
      });
    } catch (error) {
      console.error('Error processing sub-department breakdown:', error);
      safeInvoiceData.subDepartmentBreakdown = [];
    }
  }
  
  console.log('HierarchicalInvoicePDF Safe Data:', safeInvoiceData);
  
  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <View style={styles.logoContainer}>
        <Image 
          src={HiraPlus} 
          style={styles.logo}
        />
        <Text style={styles.logoText}>Hira Plus</Text>
      </View>
      <View style={styles.headerText}>
        <Text style={styles.title}>
          JAMA AT E ISLAMI HIND KERALA
        </Text>
        <Text style={styles.subtitle}>
          HIRA CENTRE, KOZHIKODE - 673004
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
        {renderHeader()}
        
        {/* Billing details */}
        <View style={{ marginBottom: 10 }}>
          <Text style={{ fontSize: 10, color: '#4B5563' }}>Department: {selectedDepartment}</Text>
          {selectedSubDepartment && (
            <Text style={{ fontSize: 10, color: '#4B5563' }}>Sub-Department: {selectedSubDepartment}</Text>
          )}
          {selectedSubDepartment && (
            <Text style={{ fontSize: 9, color: '#6B7280', fontStyle: 'italic' }}>
              Note: This invoice shows data specifically for the selected sub-department. All calculations (meeting food, rent, etc.) are filtered to show only data from this sub-department.
            </Text>
          )}
          {!selectedSubDepartment && safeInvoiceData.subDepartmentBreakdown && safeInvoiceData.subDepartmentBreakdown.length > 0 && (
            <Text style={{ fontSize: 9, color: '#6B7280', fontStyle: 'italic' }}>
              Note: This invoice shows the complete breakdown for all sub-departments within this Outside Department.
            </Text>
          )}
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
              <Text style={[styles.tableCell, { flex: 3 }]}>Department Food Share</Text>
              <Text style={[styles.tableCellRight, { flex: 1.2 }]}>{safeInvoiceData.foodShare.toFixed(2)}</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, { flex: 3 }]}>Total Food Share by Employee</Text>
              <Text style={[styles.tableCellRight, { flex: 1.2 }]}>{safeInvoiceData.employeeFoodShare.toFixed(2)}</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, { flex: 3 }]}>Venue Rent</Text>
              <Text style={[styles.tableCellRight, { flex: 1.2 }]}>{safeInvoiceData.rentTotal.toFixed(2)}</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, { flex: 3 }]}>Meeting Food</Text>
              <Text style={[styles.tableCellRight, { flex: 1.2 }]}>{safeInvoiceData.meetingFoodTotal.toFixed(2)}</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, { flex: 3 }]}>Guest Meals</Text>
              <Text style={[styles.tableCellRight, { flex: 1.2 }]}>{safeInvoiceData.guestMealTotal.toFixed(2)}</Text>
            </View>
            <View style={[styles.tableRow, { borderBottomWidth: 0 }]}>
              <Text style={[styles.tableCell, { flex: 3, fontWeight: 'bold' }]}>TOTAL</Text>
              <Text style={[styles.tableCellRight, { flex: 1.2, fontWeight: 'bold' }]}>{safeInvoiceData.total.toFixed(2)}</Text>
            </View>
          </View>
        </View>
        
        {/* Sub-Department Breakdown - Only for "All Sub-Departments" */}
        {!selectedSubDepartment && safeInvoiceData.subDepartmentBreakdown && safeInvoiceData.subDepartmentBreakdown.length > 0 && (
          <View style={{ marginBottom: 10 }}>
            <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#374151', marginBottom: 5 }}>Sub-Department Breakdown:</Text>
            <View style={styles.table}>
              <View style={[styles.tableRow, styles.tableHeader]}>
                <Text style={[styles.tableCell, { flex: 2 }]}>Sub-Department</Text>
                <Text style={[styles.tableCell, { flex: 1 }]}>Meetings</Text>
                <Text style={[styles.tableCellRight, { flex: 1 }]}>Meeting Food</Text>
                <Text style={[styles.tableCellRight, { flex: 1 }]}>Rent</Text>
                <Text style={[styles.tableCellRight, { flex: 1 }]}>Total</Text>
              </View>
              {(() => {
                try {
                  return safeInvoiceData.subDepartmentBreakdown.map((subDept, index) => {
                    // Additional safety check for each sub-department
                    const safeSubDept = {
                      title: String(subDept?.title || 'Unknown'),
                      meetings: Array.isArray(subDept?.meetings) ? subDept.meetings : [],
                      meetingFoodTotal: Number(subDept?.meetingFoodTotal) || 0,
                      rentTotal: Number(subDept?.rentTotal) || 0,
                      total: Number(subDept?.total) || 0
                    };
                    
                    return (
                      <View key={index} style={styles.tableRow}>
                        <Text style={[styles.tableCell, { flex: 2, fontSize: 8 }]}>{safeSubDept.title}</Text>
                        <Text style={[styles.tableCell, { flex: 1, fontSize: 8 }]}>{safeSubDept.meetings.length}</Text>
                        <Text style={[styles.tableCellRight, { flex: 1, fontSize: 8 }]}>{safeSubDept.meetingFoodTotal.toFixed(2)}</Text>
                        <Text style={[styles.tableCellRight, { flex: 1, fontSize: 8 }]}>{safeSubDept.rentTotal.toFixed(2)}</Text>
                        <Text style={[styles.tableCellRight, { flex: 1, fontSize: 8, fontWeight: 'bold' }]}>{safeSubDept.total.toFixed(2)}</Text>
                      </View>
                    );
                  });
                } catch (error) {
                  console.error('Error rendering sub-department breakdown:', error);
                  return (
                    <View style={styles.tableRow}>
                      <Text style={[styles.tableCell, { flex: 5, fontSize: 8, color: 'red' }]}>
                        Error rendering sub-department breakdown
                      </Text>
                    </View>
                  );
                }
              })()}
              {/* Total row */}
              {(() => {
                try {
                  const totalMeetings = safeInvoiceData.subDepartmentBreakdown.reduce((sum, subDept) => {
                    const meetingsCount = Array.isArray(subDept?.meetings) ? subDept.meetings.length : 0;
                    return sum + meetingsCount;
                  }, 0);
                  
                  const totalMeetingFood = safeInvoiceData.subDepartmentBreakdown.reduce((sum, subDept) => {
                    const meetingFood = Number(subDept?.meetingFoodTotal) || 0;
                    return sum + meetingFood;
                  }, 0);
                  
                  const totalRent = safeInvoiceData.subDepartmentBreakdown.reduce((sum, subDept) => {
                    const rent = Number(subDept?.rentTotal) || 0;
                    return sum + rent;
                  }, 0);
                  
                  const grandTotal = safeInvoiceData.subDepartmentBreakdown.reduce((sum, subDept) => {
                    const total = Number(subDept?.total) || 0;
                    return sum + total;
                  }, 0);
                  
                  return (
                    <View style={[styles.tableRow, { borderBottomWidth: 0, backgroundColor: '#F3F4F6' }]}>
                      <Text style={[styles.tableCell, { flex: 2, fontSize: 8, fontWeight: 'bold' }]}>TOTAL</Text>
                      <Text style={[styles.tableCell, { flex: 1, fontSize: 8, fontWeight: 'bold' }]}>
                        {totalMeetings}
                      </Text>
                      <Text style={[styles.tableCellRight, { flex: 1, fontSize: 8, fontWeight: 'bold' }]}>
                        {totalMeetingFood.toFixed(2)}
                      </Text>
                      <Text style={[styles.tableCellRight, { flex: 1, fontSize: 8, fontWeight: 'bold' }]}>
                        {totalRent.toFixed(2)}
                      </Text>
                      <Text style={[styles.tableCellRight, { flex: 1, fontSize: 8, fontWeight: 'bold' }]}>
                        {grandTotal.toFixed(2)}
                      </Text>
                    </View>
                  );
                } catch (error) {
                  console.error('Error calculating totals:', error);
                  return (
                    <View style={[styles.tableRow, { borderBottomWidth: 0, backgroundColor: '#F3F4F6' }]}>
                      <Text style={[styles.tableCell, { flex: 5, fontSize: 8, color: 'red', fontWeight: 'bold' }]}>
                        Error calculating totals
                      </Text>
                    </View>
                  );
                }
              })()}
            </View>
          </View>
        )}

        {/* Meeting Details */}
        {safeInvoiceData.meetings && safeInvoiceData.meetings.length > 0 && (
          <View style={{ marginBottom: 10 }}>
            <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#374151', marginBottom: 5 }}>Meetings Conducted:</Text>
            <View style={styles.table}>
              <View style={[styles.tableRow, styles.tableHeader]}>
                <Text style={[styles.tableCell, { flex: 2 }]}>Meeting Name</Text>
                <Text style={[styles.tableCell, { flex: 1 }]}>Date</Text>
              </View>
              {safeInvoiceData.meetings.map((meeting, index) => (
                <View key={index} style={styles.tableRow}>
                  <Text style={[styles.tableCell, { flex: 2, fontSize: 8 }]}>{meeting.title || 'N/A'}</Text>
                  <Text style={[styles.tableCell, { flex: 1, fontSize: 8 }]}>
                    {format(new Date(meeting.startDatetime), 'dd/MM/yyyy')}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </Page>
    </Document>
  );
});

// Accounts PDF component for detailed accounts bill
const AccountsPDF = ({ 
  departmentBillData, 
  dateRange, 
  selectedDepartmentsForAccounts, 
  includeGuestMeals,
  mealRates,
  meetingFoodRates 
}) => {
  if (!departmentBillData?.departments || !dateRange?.startDate || !dateRange?.endDate) return null;
  
  const renderHeader = (title) => (
    <View style={styles.headerContainer}>
      <View style={styles.logoContainer}>
        <Image 
          src={HiraPlus} 
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

  const renderTableHeader = () => (
    <View style={[styles.tableRow, styles.tableHeader]}>
      <Text style={[styles.tableCell, { flex: 0.6 }]}>S.No.</Text>
      <Text style={[styles.tableCell, { flex: 1.1 }]}>Date</Text>
      <Text style={[styles.tableCell, { flex: 1.4 }]}>Department</Text>
      <Text style={[styles.tableCell, { flex: 1.7 }]}>Program</Text>
      <Text style={[styles.tableCell, { flex: 2.1 }]}>Meeting</Text>
      <Text style={[styles.tableCell, { flex: 1.1 }]}>Food/Snacks</Text>
      {includeGuestMeals && (
        <Text style={[styles.tableCell, { flex: 1.1 }]}>Guest Meals</Text>
      )}
      <Text style={[styles.tableCell, { flex: 1.1 }]}>Rent</Text>
    </View>
  );

  const renderTableRow = (item, index) => (
    <View key={index} style={styles.tableRow}>
      <Text style={[styles.tableCell, { flex: 0.6, fontSize: 8 }]}>
        {index + 1}
      </Text>
      <Text style={[styles.tableCell, { flex: 1.1, fontSize: 8 }]}>
          {item.isGuestMealSummary ? format(new Date(), 'dd/MM/yyyy') : format(new Date(item.date), 'dd/MM/yyyy')}
      </Text>
      <Text style={[styles.tableCell, { flex: 1.4, fontSize: 8 }]}>
        {item.department}
      </Text>
      <Text style={[styles.tableCell, { flex: 1.7, fontSize: 8 }]}>
        {item.program}
      </Text>
      <Text style={[styles.tableCell, { flex: 2.1, fontSize: 8 }]}>
        {item.meeting}
      </Text>
      <Text style={[styles.tableCell, { flex: 1.1, fontSize: 8, color: '#000000' }]}>
        ₹{item.foodSnacks?.toLocaleString() || '0'}
      </Text>
      {includeGuestMeals && (
        <Text style={[styles.tableCell, { flex: 1.1, fontSize: 8, color: '#000000' }]}>
          ₹{item.guestMeals?.toLocaleString() || '0'}
        </Text>
      )}
      <Text style={[styles.tableCell, { flex: 1.1, fontSize: 8, color: '#000000' }]}>
        ₹{item.rent?.toLocaleString() || '0'}
      </Text>
    </View>
  );

  const calculateTotals = () => {
    return departmentBillData.departments.reduce((acc, item) => {
      acc.foodSnacks += item.foodSnacks || 0;
      acc.guestMeals += item.guestMeals || 0;
      acc.rent += item.rent || 0;
      acc.total += (item.foodSnacks || 0) + (item.guestMeals || 0) + (item.rent || 0);
      return acc;
    }, { foodSnacks: 0, guestMeals: 0, rent: 0, total: 0 });
  };

  const totals = calculateTotals();

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {renderHeader('HIRA PLUS ACCOUNTS BILL')}
        
        {/* Billing details */}
        <View style={{ marginBottom: 5 }}>
          <Text style={{ fontSize: 8, color: '#4B5563' }}>
            Departments: {selectedDepartmentsForAccounts.join(', ')}
          </Text>
          <Text style={{ fontSize: 8, color: '#4B5563' }}>
            Period: {format(new Date(dateRange.startDate), 'dd/MM/yyyy')} - {format(new Date(dateRange.endDate), 'dd/MM/yyyy')}
          </Text>
          {includeGuestMeals && (
            <Text style={{ fontSize: 8, color: '#4B5563' }}>
              Guest Meals: Included
            </Text>
          )}
        </View>
        
        {/* Detailed bill table */}
        <View style={styles.section}>
          <View style={styles.table}>
            {renderTableHeader()}
            {departmentBillData.departments.map((item, index) => renderTableRow(item, index))}
          </View>
        </View>

        {/* Totals section */}
        <View style={{ marginTop: 10 }}>
          <View style={[styles.tableRow, { borderBottomWidth: 0 }]}>
            <Text style={[styles.tableCell, { flex: 3, fontWeight: 'bold', fontSize: 8 }]}>TOTAL FOOD/SNACKS</Text>
            <Text style={[styles.tableCellRight, { flex: 1.2, fontWeight: 'bold', color: '#000000', fontSize: 8 }]}>
              ₹{totals.foodSnacks.toLocaleString()}
            </Text>
          </View>
          {includeGuestMeals && (
            <View style={[styles.tableRow, { borderBottomWidth: 0 }]}>
              <Text style={[styles.tableCell, { flex: 3, fontWeight: 'bold', fontSize: 8 }]}>TOTAL GUEST MEALS</Text>
              <Text style={[styles.tableCellRight, { flex: 1.2, fontWeight: 'bold', color: '#000000', fontSize: 8 }]}>
                ₹{totals.guestMeals.toLocaleString()}
              </Text>
            </View>
          )}
          <View style={[styles.tableRow, { borderBottomWidth: 0 }]}>
            <Text style={[styles.tableCell, { flex: 3, fontWeight: 'bold', fontSize: 8 }]}>TOTAL RENT</Text>
            <Text style={[styles.tableCellRight, { flex: 1.2, fontWeight: 'bold', color: '#000000', fontSize: 8 }]}>
              ₹{totals.rent.toLocaleString()}
            </Text>
          </View>
          <View style={[styles.tableRow, { borderBottomWidth: 0 }]}>
            <Text style={[styles.tableCell, { flex: 3, fontWeight: 'bold', fontSize: 8 }]}>GRAND TOTAL</Text>
            <Text style={[styles.tableCellRight, { flex: 1.2, fontWeight: 'bold', color: '#000000', fontSize: 8 }]}>
              ₹{totals.total.toLocaleString()}
            </Text>
          </View>
        </View>
      </Page>
    </Document>
  );
};

const BillGenerator = () => {
  // Test text encoding on component mount
  // useEffect(() => {
  //   testTextEncoding();
  // }, []);

  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    const saved = localStorage.getItem('sidebarOpen');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showDeleteConfirmDialog, setShowDeleteConfirmDialog] = useState(false);
  const [deleteListId, setDeleteListId] = useState(null);
  const [billType, setBillType] = useState('food');
  const [includeGuestMeals, setIncludeGuestMeals] = useState(false);
  const [selectedDepartmentsForAccounts, setSelectedDepartmentsForAccounts] = useState([]);
  
  // Custom List Management States
  const [customLists, setCustomLists] = useState([]);
  const [selectedCustomList, setSelectedCustomList] = useState('');
  const [showCustomListForm, setShowCustomListForm] = useState(false);
  const [editingCustomList, setEditingCustomList] = useState(null);
  const [customListForm, setCustomListForm] = useState({
    title: '',
    description: '',
    users: [],
    departments: []
  });
  const [availableUsers, setAvailableUsers] = useState([]);
  // Search query for filtering users in Custom List modal
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [selectedDepartments, setSelectedDepartments] = useState([]);
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
  const [selectedSubDepartment, setSelectedSubDepartment] = useState('');
  const [departments, setDepartments] = useState([]);
  const [fullDepartments, setFullDepartments] = useState([]);
  // Inside BillGenerator component state declarations, add invoiceData
  const [invoiceData, setInvoiceData] = useState(null);
  const [showAllUsers, setShowAllUsers] = useState(false);
  const [pdfKey, setPdfKey] = useState(Date.now());
  const [downloadCount, setDownloadCount] = useState(0);

  // Suppress browser extension errors that cause loops
  useEffect(() => {
    const suppressExtensionErrors = (e) => {
      if (e.message && (
        e.message.includes('content-all.js') ||
        e.message.includes('save-page') ||
        e.message.includes('translate-page') ||
        e.message.includes('Receiving end does not exist') ||
        e.message.includes('Could not establish connection')
      )) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    };

    // Add error listener
    window.addEventListener('error', suppressExtensionErrors);
    window.addEventListener('unhandledrejection', suppressExtensionErrors);

    // Cleanup on unmount
    return () => {
      window.removeEventListener('error', suppressExtensionErrors);
      window.removeEventListener('unhandledrejection', suppressExtensionErrors);
    };
  }, []);

  // Update PDF key when switching between different PDF types or data changes
  useEffect(() => {
    // Force complete component cleanup by updating key
    setPdfKey(Date.now());
  }, [billType, selectedDepartment, selectedSubDepartment, dateRange.startDate, dateRange.endDate]);

  // Additional cleanup when switching between regular and hierarchical departments
  useEffect(() => {
    // Force PDF key update when department changes to ensure clean component state
    setPdfKey(Date.now());
  }, [selectedDepartment]);

  // Force cleanup after any PDF download to prevent state conflicts
  const handlePDFDownload = () => {
    // Force component re-render after a short delay
    setTimeout(() => {
      setPdfKey(Date.now());
    }, 100);
  };

  // Helper function to safely format dates for PDF filenames
  const getSafeFileName = (baseName, dateRange) => {
    try {
      if (dateRange?.startDate) {
        const date = new Date(dateRange.startDate);
        if (!isNaN(date.getTime())) {
          return `${baseName}-${format(date, 'yyyy-MM-dd')}.pdf`;
        }
      }
      return `${baseName}-no-date.pdf`;
    } catch (error) {
      console.error('Error formatting date for filename:', error);
      return `${baseName}-error.pdf`;
    }
  };

  const venues = [
    'Auditorium [2nd Floor]',
    'Conference Hall [3rd Floor]',
    'Meeting Space [1st Floor]'
  ];

  // Helper function to get sub-departments for a hierarchical department
  const getSubDepartmentsForDepartment = (departmentName) => {
    const department = fullDepartments.find(dept => dept.title === departmentName);
    return department && department.isHierarchical ? department.subDepartments || [] : [];
  };

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

  // Function to fetch users by department
  const fetchUsersByDepartment = async (departmentName) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/admin/users/department/${encodeURIComponent(departmentName)}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      return response.data;
    } catch (err) {
      console.error('Failed to fetch users by department:', err);
      return [];
    }
  };

  // Function to handle department selection
  const handleDepartmentSelection = async (departmentName, isSelected) => {
    console.log(`Department selection: ${departmentName}, isSelected: ${isSelected}`);
    
    if (isSelected) {
      // Add department to selected departments
      setSelectedDepartments(prev => [...prev, departmentName]);
      
      // Try to get users from availableUsers first, then fetch if needed
      let departmentUsers = availableUsers.filter(user => 
        user.department === departmentName || user.parentDepartment === departmentName
      );
      
      if (departmentUsers.length === 0) {
        // Fallback to API call if no users found in availableUsers
        departmentUsers = await fetchUsersByDepartment(departmentName);
      }
      
      console.log(`Users for ${departmentName}:`, departmentUsers);
      
      const userIds = departmentUsers.map(user => user._id);
      console.log(`User IDs to add:`, userIds);
      
      setCustomListForm(prev => {
        const newUsers = [...new Set([...prev.users, ...userIds])];
        console.log(`Previous users:`, prev.users);
        console.log(`New users array:`, newUsers);
        
        return {
        ...prev,
        departments: [...prev.departments, departmentName],
          users: newUsers
        };
      });
    } else {
      // Remove department from selected departments
      setSelectedDepartments(prev => prev.filter(dept => dept !== departmentName));
      
      // Remove users from this department from the form
      let departmentUsers = availableUsers.filter(user => 
        user.department === departmentName || user.parentDepartment === departmentName
      );
      
      if (departmentUsers.length === 0) {
        // Fallback to API call if no users found in availableUsers
        departmentUsers = await fetchUsersByDepartment(departmentName);
      }
      
      const userIdsToRemove = departmentUsers.map(user => user._id);
      
      setCustomListForm(prev => ({
        ...prev,
        departments: prev.departments.filter(dept => dept !== departmentName),
        users: prev.users.filter(userId => !userIdsToRemove.includes(userId))
      }));
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
      setCustomListForm({ title: '', description: '', users: [], departments: [] });
      setSelectedDepartments([]);
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
      setCustomListForm({ title: '', description: '', users: [], departments: [] });
      setSelectedDepartments([]);
      fetchCustomLists();
    } catch (err) {
      console.error('Failed to update custom list:', err);
      setError('Failed to update custom list');
    }
  };

  const handleDeleteCustomList = (listId) => {
    setDeleteListId(listId);
    setShowDeleteConfirmDialog(true);
  };

  const confirmDeleteCustomList = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      await axios.delete(
        `${import.meta.env.VITE_API_URL}/admin/custom-lists/${deleteListId}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      fetchCustomLists();
      if (selectedCustomList === deleteListId) {
        setSelectedCustomList('');
      }
      setShowDeleteConfirmDialog(false);
      setDeleteListId(null);
    } catch (err) {
      console.error('Failed to delete custom list:', err);
      setError('Failed to delete custom list');
      setShowDeleteConfirmDialog(false);
      setDeleteListId(null);
    }
  };

  const handleEditCustomList = (list) => {
    setEditingCustomList(list);
    setCustomListForm({
      title: list.title,
      description: list.description || '',
      users: list.users.map(user => user._id),
      departments: list.departments || []
    });
    setSelectedDepartments(list.departments || []);
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
        
        // Store full department data for hierarchical checks
        setFullDepartments(departmentResponse.data.departments);
        
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
            let regularEmpShare = 0;
            regularEmployees.forEach(u => {
              const userTotal = (u.breakfastCount || 0) * mealRates.breakfast +
                              (u.lunchCount || 0) * mealRates.lunch +
                              (u.dinnerCount || 0) * mealRates.dinner;
              const userDeptName = u.department || selectedDepartment || '';
              const userDeptShare = getDepartmentShareForDept(userDeptName, 75); // Default 75% for regular staff
              const userDeptAmount = (userTotal * userDeptShare) / 100;
              const userEmpAmount = userTotal - userDeptAmount;
              regularDeptShare += userDeptAmount;
              regularEmpShare += userEmpAmount;
            });
            
            const foodDeptShare = internDeptShare + regularDeptShare;
            const foodEmpShare = regularEmpShare; // Interns don't pay anything
            
            deptMap[selectedDepartment] = {
              foodShare: foodDeptShare,
              employeeFoodShare: foodEmpShare,
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
                    venue,
                    ...(selectedSubDepartment && { subDepartment: selectedSubDepartment })
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
                  department: selectedDepartment,
                  ...(selectedSubDepartment && { subDepartment: selectedSubDepartment })
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

          // Fetch meetings for this department
          let departmentMeetings = [];
          let subDepartmentBreakdown = [];
          
          try {
            const meetingsResponse = await axios.get(
              `${import.meta.env.VITE_API_URL}/admin/meetings`,
              {
                headers: { Authorization: `Bearer ${token}` }
              }
            );
            
            if (meetingsResponse.data && meetingsResponse.data.meetings) {
              // Get all meetings for this department
              const allDepartmentMeetings = meetingsResponse.data.meetings.filter(meeting => {
                const departmentName = meeting.department?.title || meeting.department;
                const meetingDate = new Date(meeting.startDatetime);
                const startDate = new Date(dateRange.startDate);
                const endDate = new Date(dateRange.endDate);
                
                return departmentName === selectedDepartment && 
                       meetingDate >= startDate && 
                       meetingDate <= endDate;
              });

              // Filter meetings based on selected sub-department
              departmentMeetings = selectedSubDepartment 
                ? allDepartmentMeetings.filter(meeting => meeting.subDepartment === selectedSubDepartment)
                : allDepartmentMeetings;

              // Create sub-department breakdown for hierarchical departments
              const selectedDept = fullDepartments.find(dept => dept.title === selectedDepartment);
              if (selectedDept && selectedDept.isHierarchical) {
                const subDepts = selectedDept.subDepartments || [];

                // If a specific sub-department is selected, only show that one
                const subDeptsToProcess = selectedSubDepartment 
                  ? subDepts.filter(subDept => subDept.title === selectedSubDepartment)
                  : subDepts;

                subDepartmentBreakdown = await Promise.all(subDeptsToProcess.map(async (subDept) => {
                  const subDeptMeetings = allDepartmentMeetings.filter(meeting =>
                    meeting.subDepartment === subDept.title
                  );

                  // Get accurate meeting food data using the same API as main billing
                  let meetingFoodTotal = 0;
                  try {
                    const meetingFoodResp = await axios.get(
                      `${import.meta.env.VITE_API_URL}/admin/meeting-food-bills`,
                      {
                        params: {
                          startDate: dateRange.startDate,
                          endDate: dateRange.endDate,
                          department: selectedDepartment,
                          subDepartment: subDept.title // Pass sub-department filter
                        },
                        headers: { Authorization: `Bearer ${token}` }
                      }
                    );
                    if (meetingFoodResp.data && meetingFoodResp.data.departments && meetingFoodResp.data.departments.length) {
                      const d = meetingFoodResp.data.departments[0];
                      meetingFoodTotal = (
                        (d.breakfast || 0) * meetingFoodRates.breakfast +
                        (d.morningSnacksCount || 0) * meetingFoodRates.morningSnacks +
                        (d.morningTeaCount || 0) * meetingFoodRates.morningTea +
                        (d.lunch || 0) * meetingFoodRates.lunch +
                        (d.eveningSnacksCount || 0) * meetingFoodRates.eveningSnacks +
                        (d.eveningTeaCount || 0) * meetingFoodRates.eveningTea +
                        (d.dinner || 0) * meetingFoodRates.dinner
                      );
                    }
                  } catch (err) {
                    console.error(`Failed to fetch meeting food data for sub-department ${subDept.title}:`, err);
                  }

                  const rentTotal = subDeptMeetings.reduce((sum, meeting) => sum + (meeting.rent || 0), 0);

                  return {
                    title: subDept.title,
                    meetings: subDeptMeetings,
                    meetingFoodTotal,
                    rentTotal,
                    total: meetingFoodTotal + rentTotal
                  };
                }));
              }
            }
          } catch (err) {
            console.error('Failed to fetch meetings:', err);
          }

          const summary = deptMap[selectedDepartment] || { foodShare: 0, rentTotal: 0, meetingFoodTotal: 0, guestMealTotal: 0 };
          summary.total = summary.foodShare + summary.rentTotal + summary.meetingFoodTotal + summary.guestMealTotal;
          summary.meetings = departmentMeetings || [];
          summary.selectedSubDepartment = selectedSubDepartment || null;
          
          // Ensure subDepartmentBreakdown is always a valid array with proper structure
          let safeSubDepartmentBreakdown = [];
          if (subDepartmentBreakdown && Array.isArray(subDepartmentBreakdown)) {
            safeSubDepartmentBreakdown = subDepartmentBreakdown.map(item => ({
              title: item.title || 'Unknown',
              meetings: Array.isArray(item.meetings) ? item.meetings : [],
              meetingFoodTotal: Number(item.meetingFoodTotal) || 0,
              rentTotal: Number(item.rentTotal) || 0,
              total: Number(item.total) || 0
            }));
          }
          
          summary.subDepartmentBreakdown = safeSubDepartmentBreakdown;

          // Ensure all required fields exist for PDF generation
          const safeSummary = {
            foodShare: summary.foodShare || 0,
            employeeFoodShare: summary.employeeFoodShare || 0,
            rentTotal: summary.rentTotal || 0,
            meetingFoodTotal: summary.meetingFoodTotal || 0,
            guestMealTotal: summary.guestMealTotal || 0,
            total: summary.total || 0,
            meetings: Array.isArray(summary.meetings) ? summary.meetings : [],
            subDepartmentBreakdown: safeSubDepartmentBreakdown,
            selectedSubDepartment: summary.selectedSubDepartment || null
          };

          // Debug logging
          console.log('Invoice Data Debug:', {
            selectedDepartment,
            selectedSubDepartment,
            safeSummary,
            subDepartmentBreakdown: safeSubDepartmentBreakdown
          });

          setDepartmentBillData({ departments: [{ department: selectedDepartment, ...safeSummary }] });
          setInvoiceData(safeSummary);
          setTotalAmount(safeSummary.total);
          setDepartmentPayable(safeSummary.total);
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
              } else if (billType === 'accounts') {
          // Check if departments are selected
          if (selectedDepartmentsForAccounts.length === 0) {
            setError('No department is selected');
            setLoading(false);
            return;
          }

          // Accounts bill calculation - generate detailed bill based on meetings
          try {
            const detailedBillData = [];
            
            // Fetch all meetings data
            const meetingsResponse = await axios.get(
              `${import.meta.env.VITE_API_URL}/admin/meetings`,
              {
                headers: { Authorization: `Bearer ${token}` }
              }
            );

            console.log('Meetings response:', meetingsResponse.data);
            console.log('Selected departments:', selectedDepartmentsForAccounts);
            console.log('Date range:', dateRange);
            
            if (meetingsResponse.data && meetingsResponse.data.meetings) {
              console.log('Total meetings found:', meetingsResponse.data.meetings.length);
              
              // Use for...of loop to handle async operations
              for (const meeting of meetingsResponse.data.meetings) {
                const departmentName = meeting.department?.title || meeting.department;
                console.log('Checking meeting:', meeting.title, 'Department:', departmentName, 'Date:', meeting.startDatetime);
                
                // Filter by selected departments
                if (selectedDepartmentsForAccounts.includes(departmentName)) {
                  console.log('Meeting department matches:', departmentName);
                  
                  // Filter by date range
                  const meetingDate = new Date(meeting.startDatetime);
                  const startDate = new Date(dateRange.startDate);
                  const endDate = new Date(dateRange.endDate);
                  
                  console.log('Meeting date:', meetingDate, 'Start date:', startDate, 'End date:', endDate);
                  
                  if (meetingDate >= startDate && meetingDate <= endDate) {
                    console.log('Meeting date is within range, adding to bill');
                    
                    // Check if this is a hierarchical department
                    const selectedDept = fullDepartments.find(dept => dept.title === departmentName);
                    const isHierarchical = selectedDept && selectedDept.isHierarchical;
                    
                    let foodSnacksAmount = 0;
                    
                    if (isHierarchical) {
                      // For hierarchical departments, use accurate API data
                      try {
                        const meetingFoodResp = await axios.get(
                          `${import.meta.env.VITE_API_URL}/admin/meeting-food-bills`,
                          {
                            params: {
                              startDate: dateRange.startDate,
                              endDate: dateRange.endDate,
                              department: departmentName,
                              subDepartment: meeting.subDepartment || undefined
                            },
                            headers: { Authorization: `Bearer ${token}` }
                          }
                        );
                        
                        if (meetingFoodResp.data && meetingFoodResp.data.departments && meetingFoodResp.data.departments.length) {
                          const d = meetingFoodResp.data.departments[0];
                          foodSnacksAmount = (
                            (d.breakfast || 0) * meetingFoodRates.breakfast +
                            (d.lunch || 0) * meetingFoodRates.lunch +
                            (d.dinner || 0) * meetingFoodRates.dinner +
                            (d.morningSnacksCount || 0) * meetingFoodRates.morningSnacks +
                            (d.morningTeaCount || 0) * meetingFoodRates.morningTea +
                            (d.eveningSnacksCount || 0) * meetingFoodRates.eveningSnacks +
                            (d.eveningTeaCount || 0) * meetingFoodRates.eveningTea
                          );
                        }
                      } catch (err) {
                        console.error(`Failed to fetch meeting food data for hierarchical department ${departmentName}:`, err);
                        // Fallback to meeting object data
                        foodSnacksAmount = (
                      (meeting.breakfast || 0) * meetingFoodRates.breakfast +
                      (meeting.lunch || 0) * meetingFoodRates.lunch +
                      (meeting.dinner || 0) * meetingFoodRates.dinner +
                      (meeting.morningSnacksCount || 0) * meetingFoodRates.morningSnacks +
                      (meeting.morningTeaCount || 0) * meetingFoodRates.morningTea +
                      (meeting.eveningSnacksCount || 0) * meetingFoodRates.eveningSnacks +
                      (meeting.eveningTeaCount || 0) * meetingFoodRates.eveningTea
                    );
                      }
                    } else {
                      // For regular departments, use meeting object data (unchanged)
                      foodSnacksAmount = (
                        (meeting.breakfast || 0) * meetingFoodRates.breakfast +
                        (meeting.lunch || 0) * meetingFoodRates.lunch +
                        (meeting.dinner || 0) * meetingFoodRates.dinner +
                        (meeting.morningSnacksCount || 0) * meetingFoodRates.morningSnacks +
                        (meeting.morningTeaCount || 0) * meetingFoodRates.morningTea +
                        (meeting.eveningSnacksCount || 0) * meetingFoodRates.eveningSnacks +
                        (meeting.eveningTeaCount || 0) * meetingFoodRates.eveningTea
                      );
                    }
                    
                    detailedBillData.push({
                      date: meeting.startDatetime,
                      department: departmentName,
                      program: meeting.title || 'N/A',
                      meeting: meeting.description || 'N/A',
                      foodSnacks: foodSnacksAmount,
                      guestMeals: 0, // No guest meals in individual program rows
                      rent: meeting.rent || 0
                    });
                  } else {
                    console.log('Meeting date is outside range');
                  }
                } else {
                  console.log('Meeting department does not match:', departmentName);
                }
              }
            }
            
            console.log('Final detailed bill data:', detailedBillData);

            // Add guest meals data if includeGuestMeals is true
            if (includeGuestMeals) {
              try {
                const guestResponse = await axios.get(
                  `${import.meta.env.VITE_API_URL}/admin/guest-meals`,
                  {
                    headers: { Authorization: `Bearer ${token}` }
                  }
                );

                console.log('Guest meals response:', guestResponse.data);

                // Aggregate guest meals by department
                const guestMealSummary = {};

                if (guestResponse.data && guestResponse.data.guestMeals) {
                  guestResponse.data.guestMeals.forEach(guestMeal => {
                    const departmentName = guestMeal.department?.title || guestMeal.department;
                    
                    // Filter by selected departments
                    if (selectedDepartmentsForAccounts.includes(departmentName)) {
                      // Filter by date range
                      const guestMealDate = new Date(guestMeal.date);
                      const startDate = new Date(dateRange.startDate);
                      const endDate = new Date(dateRange.endDate);
                      
                      console.log('Checking guest meal:', departmentName, 'Date:', guestMealDate);
                      
                      if (guestMealDate >= startDate && guestMealDate <= endDate) {
                        console.log('Guest meal date is within range, adding to summary');
                        
                        if (!guestMealSummary[departmentName]) {
                          guestMealSummary[departmentName] = {
                            breakfastCount: 0,
                            lunchCount: 0,
                            dinnerCount: 0,
                            totalAmount: 0
                          };
                        }
                        
                        guestMealSummary[departmentName].breakfastCount += (guestMeal.breakfastCount || 0);
                        guestMealSummary[departmentName].lunchCount += (guestMeal.lunchCount || 0);
                        guestMealSummary[departmentName].dinnerCount += (guestMeal.dinnerCount || 0);
                        
                        const guestMealAmount = (
                          (guestMeal.breakfastCount || 0) * mealRates.breakfast +
                          (guestMeal.lunchCount || 0) * mealRates.lunch +
                          (guestMeal.dinnerCount || 0) * mealRates.dinner
                        );
                        
                        guestMealSummary[departmentName].totalAmount += guestMealAmount;
                      } else {
                        console.log('Guest meal date is outside range');
                      }
                    } else {
                      console.log('Guest meal department does not match:', departmentName);
                    }
                  });
                }
                
                // Add guest meal summary rows for each department
                Object.entries(guestMealSummary).forEach(([departmentName, summary]) => {
                  if (summary.totalAmount > 0) {
                    detailedBillData.push({
                      date: new Date().toISOString(), // Use current date for summary rows
                      department: departmentName,
                      program: 'Guest Meals Summary',
                      meeting: `Breakfast: ${summary.breakfastCount}, Lunch: ${summary.lunchCount}, Dinner: ${summary.dinnerCount}`,
                      foodSnacks: 0, // Guest meals don't have meeting food/snacks
                      guestMeals: summary.totalAmount,
                      rent: 0, // Guest meals don't have rent
                      isGuestMealSummary: true // Flag to identify summary rows
                    });
                  }
                });
              } catch (err) {
                console.error('Failed to fetch guest meal data:', err);
              }
            }

            // Sort by department first, then by date (guest meal summaries at the end of each department)
            detailedBillData.sort((a, b) => {
              const deptCompare = a.department.localeCompare(b.department);
              if (deptCompare !== 0) return deptCompare;
              
              // Put guest meal summaries at the end of each department
              if (a.isGuestMealSummary && !b.isGuestMealSummary) return 1;
              if (!a.isGuestMealSummary && b.isGuestMealSummary) return -1;
              
              // For non-summary items, sort by date
              if (!a.isGuestMealSummary && !b.isGuestMealSummary) {
              return new Date(a.date) - new Date(b.date);
              }
              
              return 0;
            });

            // Set the detailed bill data
            setDepartmentBillData({ 
              departments: detailedBillData.map(item => ({
                department: item.department,
                date: item.date,
                program: item.program,
                meeting: item.meeting,
                foodSnacks: item.foodSnacks || 0,
                guestMeals: item.guestMeals || 0,
                rent: item.rent,
                total: (item.foodSnacks || 0) + (item.guestMeals || 0) + item.rent,
                isGuestMealSummary: item.isGuestMealSummary || false
              }))
            });

            // Calculate totals including food/snacks and guest meals
            const totalFoodSnacks = detailedBillData.reduce((acc, item) => acc + (item.foodSnacks || 0), 0);
            const totalGuestMeals = detailedBillData.reduce((acc, item) => acc + (item.guestMeals || 0), 0);
            const totalRent = detailedBillData.reduce((acc, item) => acc + (item.rent || 0), 0);
            const grandTotal = totalFoodSnacks + totalGuestMeals + totalRent;
            
            setTotalAmount(grandTotal);
            setDepartmentPayable(grandTotal);
            setEmployeePayable(0);

          } catch (err) {
            console.error('Failed to fetch accounts bill data:', err);
            setError('Failed to fetch accounts bill data');
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
                           billType === 'custom' ? 'Custom List Bills' :
                           billType === 'accounts' ? 'Accounts' : 'Select Bill Type'}
                        </span>
                        {billType === 'accounts' ? (
                          selectedDepartmentsForAccounts.length > 0 && (
                            <span className="flex items-center text-blue-600">
                              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-1.5"></div>
                              {selectedDepartmentsForAccounts.length === 1 
                                ? `${selectedDepartmentsForAccounts[0]} Department`
                                : `${selectedDepartmentsForAccounts.length} Departments Selected`
                              }
                            </span>
                          )
                        ) : (
                          selectedDepartment && (
                            <span className="flex items-center text-blue-600">
                              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-1.5"></div>
                              {selectedDepartment} Department
                            </span>
                          )
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
                          setSelectedSubDepartment(''); // Reset sub-department when bill type changes
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
                          {/* <span className={`mt-1 flex items-center text-sm ${billType === 'food' ? 'text-green-600' : 'text-gray-500'}`}>
                            Employee meals
                          </span> */}
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
                          {/* <span className={`mt-1 flex items-center text-sm ${billType === 'rent' ? 'text-green-600' : 'text-gray-500'}`}>
                            Meeting costs
                          </span> */}
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
                          {/* <span className={`mt-1 flex items-center text-sm ${billType === 'guest' ? 'text-green-600' : 'text-gray-500'}`}>
                            Visitor meals
                          </span> */}
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
                          {/* <span className={`mt-1 flex items-center text-sm ${billType === 'meeting' ? 'text-green-600' : 'text-gray-500'}`}>
                            Event catering
                          </span> */}
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
                          {/* <span className={`mt-1 flex items-center text-sm ${billType === 'department' ? 'text-green-600' : 'text-gray-500'}`}>
                            Summary view of all bill types
                          </span> */}
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
                          {/* <span className={`mt-1 flex items-center text-sm ${billType === 'department-detailed' ? 'text-green-600' : 'text-gray-500'}`}>
                            Individual programs/meetings listed
                          </span> */}
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
                          {/* <span className={`mt-1 flex items-center text-sm ${billType === 'invoice' ? 'text-green-600' : 'text-gray-500'}`}>
                            Department summary
                          </span> */}
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
                          {/* <span className={`mt-1 flex items-center text-sm ${billType === 'custom' ? 'text-green-600' : 'text-gray-500'}`}>
                            Selected users
                          </span> */}
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

                    <label className="relative flex cursor-pointer rounded-lg border border-gray-300 bg-white p-4 shadow-sm focus:outline-none hover:border-green-500 transition-all duration-200">
                      <input
                        type="radio"
                        value="accounts"
                        checked={billType === 'accounts'}
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
                          setIncludeGuestMeals(false);
                          setSelectedDepartmentsForAccounts([]);
                        }}
                        className="sr-only"
                      />
                      <span className="flex flex-1">
                        <span className="flex flex-col">
                          <span className={`block text-sm font-medium ${billType === 'accounts' ? 'text-green-900' : 'text-gray-900'}`}>
                            Accounts
                          </span>
                          {/* <span className={`mt-1 flex items-center text-sm ${billType === 'accounts' ? 'text-green-600' : 'text-gray-500'}`}>
                            Account management
                          </span> */}
                        </span>
                      </span>
                      {billType === 'accounts' && (
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
                  <div className="flex items-center gap-4">
                    <h2 className="text-xl font-semibold text-gray-900">Select Department</h2>
                    {billType !== 'accounts' && (
                      <div className="w-72">
                        <select
                          value={selectedDepartment}
                          onChange={(e) => {
                            const newDepartment = e.target.value;
                            setSelectedDepartment(newDepartment);
                            setSelectedSubDepartment(''); // Reset sub-department when department changes
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
                    )}
                  </div>

                  {/* Sub-Department Selection - Only for Invoice bill type with hierarchical departments */}
                  {billType === 'invoice' && selectedDepartment && (() => {
                    const subDepartments = getSubDepartmentsForDepartment(selectedDepartment);
                    if (subDepartments.length > 0) {
                      return (
                        <div className="mt-4">
                          <div className="flex items-center gap-4">
                            <h3 className="text-lg font-medium text-gray-800">Select Sub-Department (Optional)</h3>
                            <div className="w-72">
                              <select
                                value={selectedSubDepartment}
                                onChange={(e) => {
                                  setSelectedSubDepartment(e.target.value);
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
                                <option value="">All Sub-Departments</option>
                                {subDepartments.map((subDept) => (
                                  <option key={subDept._id} value={subDept.title}>{subDept.title}</option>
                                ))}
                              </select>
                            </div>
                          </div>
                          <p className="mt-2 text-sm text-gray-600">
                            Select a specific sub-department to generate an invoice for that sub-department only, or leave as "All Sub-Departments" for the entire Outside Department.
                          </p>
                        </div>
                      );
                    }
                    return null;
                  })()}

                  {billType === 'accounts' && (
                    <div className="max-w-md">
                      <div>
                        <div className="mb-4">
                          <div className="flex items-center justify-between mb-3">
                            <label className="flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={selectedDepartmentsForAccounts.length === departments.length}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedDepartmentsForAccounts(departments);
                                  } else {
                                    setSelectedDepartmentsForAccounts([]);
                                  }
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
                                className="h-4 w-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                              />
                              <span className="ml-2 text-sm font-medium text-gray-900">Select All Departments</span>
                            </label>
                            <span className="text-xs text-gray-500">
                              {selectedDepartmentsForAccounts.length} of {departments.length} selected
                            </span>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-60 overflow-y-auto border border-gray-200 rounded-lg p-3 bg-gray-50">
                          {departments.map((dept) => (
                            <label key={dept} className="flex items-center cursor-pointer hover:bg-white hover:shadow-sm rounded p-2 transition-all duration-200">
                              <input
                                type="checkbox"
                                checked={selectedDepartmentsForAccounts.includes(dept)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedDepartmentsForAccounts(prev => [...prev, dept]);
                                  } else {
                                    setSelectedDepartmentsForAccounts(prev => prev.filter(d => d !== dept));
                                  }
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
                                className="h-4 w-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                              />
                              <span className="ml-2 text-sm text-gray-700">{dept}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
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

                {/* Accounts Options - Show only for accounts bills */}
                {billType === 'accounts' && (
                  <div className="mb-8">
                    {/* <h2 className="text-xl font-semibold text-gray-900 mb-4">Accounts Options</h2> */}
                    
                    {/* Include Guest Meals Checkbox */}
                    <div className="mb-6">
                      <label className="flex items-center space-x-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={includeGuestMeals}
                          onChange={(e) => setIncludeGuestMeals(e.target.checked)}
                          className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                        />
                        <span className="text-sm font-medium text-gray-700">Include Guest Meals</span>
                      </label>
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
                            setCustomListForm({ title: '', description: '', users: [], departments: [] });
                            setSelectedDepartments([]);
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
                                {selectedList.departments && selectedList.departments.length > 0 && (
                                  <div className="text-sm text-green-600 mt-2">
                                    <strong>{selectedList.departments.length} departments:</strong>
                                    <div className="mt-1 flex flex-wrap gap-1">
                                      {selectedList.departments.map((department, index) => (
                                        <span key={index} className="inline-block bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                                          {department}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}
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
                                setCustomListForm({ title: '', description: '', users: [], departments: [] });
                                setSelectedDepartments([]);
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
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Select Departments ({selectedDepartments.length} selected)
                                <span className="text-xs text-gray-500 ml-2">• Selecting a department automatically adds all its users</span>
                              </label>
                              <div className="border border-gray-300 rounded-lg p-4 max-h-40 overflow-y-auto mb-4">
                                <div className="space-y-2">
                                  {departments.map((department) => (
                                    <label key={department} className="flex items-center">
                                      <input
                                        type="checkbox"
                                        checked={selectedDepartments.includes(department)}
                                        onChange={(e) => handleDepartmentSelection(department, e.target.checked)}
                                        className="h-4 w-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                                      />
                                      <span className="ml-3 text-sm text-gray-900">
                                        {department}
                                      </span>
                                    </label>
                                  ))}
                                </div>
                              </div>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Select Individual Users ({customListForm.users.length} selected)</label>
                              
                              {/* Department summary */}
                              {selectedDepartments.length > 0 && (
                                <div className="mb-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                                  <p className="text-sm font-medium text-green-800 mb-2">Users added from departments:</p>
                                  <div className="space-y-1">
                                    {selectedDepartments.map((dept) => (
                                      <div key={dept} className="text-xs text-green-700">
                                        • {dept}: {availableUsers.filter(user => 
                                          (user.department === dept || user.parentDepartment === dept) && 
                                          customListForm.users.includes(user._id)
                                        ).length} users
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

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
                                          {selectedDepartments.includes(user.department || user.parentDepartment) && (
                                            <span className="text-xs text-green-600 ml-2">• Auto-added from department</span>
                                          )}
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
                                setCustomListForm({ title: '', description: '', users: [], departments: [] });
                                setSelectedDepartments([]);
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
                                            <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">S.No.</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payable</th>
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
                  (billType === 'accounts' && departmentBillData?.departments) ||
                  (billType === 'custom' && billData?.departments)) && (
                                    <div className="mb-8 bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {billType === 'food' ? 'Food Bill Details' : 
                         billType === 'rent' ? `Venue Rent Details${selectedVenue ? ` - ${selectedVenue}` : ''}` : 
                         billType === 'meeting' ? 'Meeting Food Details' : 
                         billType === 'department' ? 'Department Bills (All Types)' :
                         billType === 'department-detailed' ? 'Detailed Department Bills (Individual Programs)' :
                         billType === 'accounts' ? 'Accounts Bill Details' :
                         billType === 'custom' ? `Custom List Bills - ${customListData?.title || 'Selected Users'}` :
                         'Guest Meal Details'}
                      </h3>
                    </div>
                    <div className="overflow-x-auto max-w-full">
                      <table className="w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            {billType !== 'accounts' && (
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Department
                              </th>
                            )}
                            {billType === 'department' && (
                              <>
                                <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">S.No.</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Food Bill (75%)</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rent Bill</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Meeting Food</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Guest Meals</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                              </>
                            )}
                            {billType === 'department-detailed' && (
                              <>
                                <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">S.No.</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Programs</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Food (75%)</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rent</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Meeting Food</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Guest Meals</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                              </>
                            )}
                            {billType === 'food' && (
                              <>
                                <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">S.No.</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Breakfast</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lunch</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dinner</th>
                              </>
                            )}
                            {billType === 'rent' && (
                              <>
                                <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">S.No.</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Meetings</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Auditorium</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Conference Hall</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Meeting Space</th>
                              </>
                            )}
                            {billType === 'guest' && (
                              <>
                                <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">S.No.</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Breakfast</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lunch</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dinner</th>
                              </>
                            )}
                            {billType === 'meeting' && (
                              <>
                                <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">S.No.</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">B</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">L</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">D</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">MS</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">MT</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ES</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ET</th>
                              </>
                            )}
                            {billType === 'accounts' && (
                              <>
                                <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">S.No.</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dept</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Program</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Meeting</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Food</th>
                                {includeGuestMeals && (
                                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Guest</th>
                                )}
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rent</th>
                              </>
                            )}
                            {billType !== 'department' && billType !== 'accounts' && (
                              <>
                                <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">S.No.</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Amount</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dept. Payable</th>
                              </>
                            )}
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {billType === 'department' && departmentBillData?.departments?.map((dept, index) => (
                            <tr key={dept.department} className="hover:bg-gray-50">
                              <td className="px-2 py-4 whitespace-nowrap text-sm text-gray-900">{index + 1}</td>
                              <td className="px-3 py-2 whitespace-nowrap text-xs font-medium text-gray-900">{dept.department}</td>
                              <td className="px-3 py-2 whitespace-nowrap text-xs font-medium text-gray-900">
                                {Math.round(dept.foodShare).toLocaleString()}
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap text-xs font-medium text-gray-900">
                                {Math.round(dept.rentTotal).toLocaleString()}
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap text-xs font-medium text-gray-900">
                                {Math.round(dept.meetingFoodTotal).toLocaleString()}
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap text-xs font-medium text-gray-900">
                                {Math.round(dept.guestMealTotal).toLocaleString()}
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap text-xs font-medium text-gray-900">
                                {Math.round(dept.total).toLocaleString()}
                              </td>
                            </tr>
                          ))}
                          {billType === 'department-detailed' && detailedDepartmentData?.departments?.map((dept) => (
                            <tr key={dept.department} className="hover:bg-gray-50">
                              <td className="px-3 py-2 whitespace-nowrap text-xs font-medium text-gray-900">
                                <div className="space-y-1">
                                  <div className="font-bold text-gray-900">{dept.department}</div>
                                  <div className="text-xs text-gray-500">
                                    {(dept.meetings || []).length} meetings, {(dept.guestMeals || []).length} guest meals
                                  </div>
                                </div>
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-700">
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
                              <td className="px-3 py-2 whitespace-nowrap text-xs font-medium text-gray-900">
                                {Math.round(dept.foodShare || 0).toLocaleString()}
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap text-xs font-medium text-gray-900">
                                {Math.round(dept.totalRentAmount || 0).toLocaleString()}
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap text-xs font-medium text-gray-900">
                                {Math.round(dept.totalMeetingFoodAmount || 0).toLocaleString()}
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap text-xs font-medium text-gray-900">
                                {Math.round(dept.totalGuestMealAmount || 0).toLocaleString()}
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap text-xs font-medium text-gray-900">
                                {Math.round(dept.totalAmount || 0).toLocaleString()}
                              </td>
                            </tr>
                          ))}
                          {billType === 'accounts' && departmentBillData?.departments?.map((item, index) => (
                            <tr key={index} className="hover:bg-gray-50">
                              <td className="px-2 py-2 whitespace-nowrap text-xs text-gray-900">
                                {index + 1}
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                                {format(new Date(item.date), 'dd/MM/yyyy')}
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap text-xs font-medium text-gray-900">
                                {item.department}
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-700">
                                {item.program}
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-700">
                                {item.meeting}
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap text-xs font-medium text-orange-600">
                                ₹{item.foodSnacks.toLocaleString()}
                              </td>
                              {includeGuestMeals && (
                                <td className="px-3 py-2 whitespace-nowrap text-xs font-medium text-teal-600">
                                  ₹{item.guestMeals.toLocaleString()}
                                </td>
                              )}
                              <td className="px-3 py-2 whitespace-nowrap text-xs font-medium text-purple-600">
                                ₹{item.rent.toLocaleString()}
                              </td>
                            </tr>
                          ))}
                          {billType === 'food' && departmentData?.departments?.map((dept, index) => {
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
                                <td className="px-2 py-4 whitespace-nowrap text-sm text-gray-900">{index + 1}</td>
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
                          {billType === 'rent' && rentData?.departments?.map((dept, index) => (
                            <tr key={dept.department} className="hover:bg-gray-50">
                              <td className="px-2 py-4 whitespace-nowrap text-sm text-gray-900">{index + 1}</td>
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
                          {billType === 'guest' && guestMealData?.departments?.map((dept, index) => (
                            <tr key={dept.department} className="hover:bg-gray-50">
                              <td className="px-2 py-4 whitespace-nowrap text-sm text-gray-900">{index + 1}</td>
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
                          {billType === 'meeting' && meetingFoodData?.departments?.map((dept, index) => (
                            <tr key={dept.department} className="hover:bg-gray-50">
                              <td className="px-2 py-4 whitespace-nowrap text-sm text-gray-900">{index + 1}</td>
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
                          {billType === 'custom' && billData?.departments?.map((dept, index) => {
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
                                <td className="px-2 py-4 whitespace-nowrap text-sm text-gray-900">{index + 1}</td>
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
                            <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">S.No.</th>
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
                            <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/12">
                              S.No.
                            </th>
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
                                  <td className="px-2 py-4 text-sm text-gray-900 text-center">
                                    {index + 1}
                                  </td>
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
                                      <td colSpan="10" className="px-2 py-3 text-center text-white font-bold text-xs">
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
                                        <td colSpan="10" className="px-2 py-3 text-center text-white font-bold text-xs">
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
                          <td className="px-2 py-4 text-sm font-bold text-gray-900" colSpan="7">
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

                                    {/* Invoice PDF Download - Simplified Structure */}
                  {(billType === 'invoice' && dateRange?.startDate && dateRange?.endDate) && (
                    <>
                      {/* No Data Available */}
                      {!invoiceData && (
                        <PDFErrorBoundary key={`no-data-boundary-${pdfKey}-${downloadCount}`}>
                          <PDFDownloadLink
                            key={`no-data-pdf-${pdfKey}-${downloadCount}`}
                            document={
                              <Document>
                                <Page size="A4" style={styles.page}>
                                  <Text>No invoice data available. Please generate the bill first.</Text>
                                </Page>
                              </Document>
                            }
                            fileName={getSafeFileName('no-data', dateRange)}
                            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-gray-600 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                          >
                            {({ loading, error }) => {
                              if (loading) return 'Preparing PDF...';
                              if (error) return 'Error generating PDF';
                              return 'No Data Available';
                            }}
                          </PDFDownloadLink>
                        </PDFErrorBoundary>
                      )}



                      {/* Invoice PDF Download - Manual Approach */}
                      {invoiceData && (
                        <button
                          onClick={async () => {
                            try {
                              console.log('Starting invoice PDF generation...');
                              
                              // Create the invoice PDF document
                              const doc = (
                                <Document>
                                  <Page size="A4" style={styles.page}>
                                    {/* Header */}
                                    <View style={styles.headerContainer}>
                                      <View style={styles.logoContainer}>
                                        <Image src={HiraPlus} style={styles.logo} />
                                        <Text style={styles.logoText}>Hira Plus</Text>
                                      </View>
                                      <View style={styles.headerText}>
                                        <Text style={styles.title}>JAMA AT E ISLAMI HIND KERALA</Text>
                                        <Text style={styles.subtitle}>HIRA CENTRE, KOZHIKODE - 673004</Text>
                                        <Text style={styles.subtitle}>
                                          FROM: {dateRange?.startDate ? format(new Date(dateRange.startDate), 'dd/MM/yyyy') : 'N/A'} 
                                          TO: {dateRange?.endDate ? format(new Date(dateRange.endDate), 'dd/MM/yyyy') : 'N/A'}
                                        </Text>
                                      </View>
                                    </View>

                                    {/* Department Info */}
                                    <View style={{ marginBottom: 10 }}>
                                      <Text style={{ fontSize: 10, color: '#4B5563' }}>Department: {selectedDepartment}</Text>
                                      {selectedSubDepartment && (
                                        <Text style={{ fontSize: 10, color: '#4B5563' }}>Sub-Department: {selectedSubDepartment}</Text>
                                      )}
                                      <Text style={{ fontSize: 10, color: '#4B5563' }}>
                                        Period: {dateRange?.startDate ? format(new Date(dateRange.startDate), 'dd/MM/yyyy') : 'N/A'} - {dateRange?.endDate ? format(new Date(dateRange.endDate), 'dd/MM/yyyy') : 'N/A'}
                                      </Text>
                                    </View>

                                    {/* Charge Breakdown */}
                                    <View style={styles.section}>
                                      <View style={styles.table}>
                                        <View style={[styles.tableRow, styles.tableHeader]}>
                                          <Text style={[styles.tableCell, { flex: 3 }]}>Description</Text>
                                          <Text style={[styles.tableCellRight, { flex: 1.2 }]}>Amount</Text>
                                        </View>
                                        <View style={styles.tableRow}>
                                          <Text style={[styles.tableCell, { flex: 3 }]}>Department Food Share</Text>
                                          <Text style={[styles.tableCellRight, { flex: 1.2 }]}>{Number(invoiceData.foodShare || 0).toFixed(2)}</Text>
                                        </View>
                                        <View style={styles.tableRow}>
                                          <Text style={[styles.tableCell, { flex: 3 }]}>Total Food Share by Employee</Text>
                                          <Text style={[styles.tableCellRight, { flex: 1.2 }]}>{Number(invoiceData.employeeFoodShare || 0).toFixed(2)}</Text>
                                        </View>
                                        <View style={styles.tableRow}>
                                          <Text style={[styles.tableCell, { flex: 3 }]}>Venue Rent</Text>
                                          <Text style={[styles.tableCellRight, { flex: 1.2 }]}>{Number(invoiceData.rentTotal || 0).toFixed(2)}</Text>
                                        </View>
                                        <View style={styles.tableRow}>
                                          <Text style={[styles.tableCell, { flex: 3 }]}>Meeting Food</Text>
                                          <Text style={[styles.tableCellRight, { flex: 1.2 }]}>{Number(invoiceData.meetingFoodTotal || 0).toFixed(2)}</Text>
                                        </View>
                                        <View style={styles.tableRow}>
                                          <Text style={[styles.tableCell, { flex: 3 }]}>Guest Meals</Text>
                                          <Text style={[styles.tableCellRight, { flex: 1.2 }]}>{Number(invoiceData.guestMealTotal || 0).toFixed(2)}</Text>
                                        </View>
                                        <View style={[styles.tableRow, { borderBottomWidth: 0 }]}>
                                          <Text style={[styles.tableCell, { flex: 3, fontWeight: 'bold' }]}>TOTAL</Text>
                                          <Text style={[styles.tableCellRight, { flex: 1.2, fontWeight: 'bold' }]}>{Number(invoiceData.total || 0).toFixed(2)}</Text>
                                        </View>
                                      </View>
                                    </View>

                                    {/* Sub-Department Breakdown (if hierarchical) */}
                                    {fullDepartments.find(dept => dept.title === selectedDepartment)?.isHierarchical && 
                                     !selectedSubDepartment && 
                                     invoiceData.subDepartmentBreakdown && 
                                     invoiceData.subDepartmentBreakdown.length > 0 && (
                                      <View style={{ marginBottom: 10 }}>
                                        <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#374151', marginBottom: 5 }}>Sub-Department Breakdown:</Text>
                                        <View style={styles.table}>
                                          <View style={[styles.tableRow, styles.tableHeader]}>
                                            <Text style={[styles.tableCell, { flex: 2 }]}>Sub-Department</Text>
                                            <Text style={[styles.tableCell, { flex: 1 }]}>Meetings</Text>
                                            <Text style={[styles.tableCellRight, { flex: 1 }]}>Meeting Food</Text>
                                            <Text style={[styles.tableCellRight, { flex: 1 }]}>Rent</Text>
                                            <Text style={[styles.tableCellRight, { flex: 1 }]}>Total</Text>
                                          </View>
                                          {invoiceData.subDepartmentBreakdown.map((subDept, index) => (
                                            <View key={index} style={styles.tableRow}>
                                              <Text style={[styles.tableCell, { flex: 2, fontSize: 8 }]}>{subDept.title || 'Unknown'}</Text>
                                              <Text style={[styles.tableCell, { flex: 1, fontSize: 8 }]}>{Array.isArray(subDept.meetings) ? subDept.meetings.length : 0}</Text>
                                              <Text style={[styles.tableCellRight, { flex: 1, fontSize: 8 }]}>{Number(subDept.meetingFoodTotal || 0).toFixed(2)}</Text>
                                              <Text style={[styles.tableCellRight, { flex: 1, fontSize: 8 }]}>{Number(subDept.rentTotal || 0).toFixed(2)}</Text>
                                              <Text style={[styles.tableCellRight, { flex: 1, fontSize: 8, fontWeight: 'bold' }]}>{Number(subDept.total || 0).toFixed(2)}</Text>
                                            </View>
                                          ))}
                                        </View>
                                      </View>
                                    )}

                                    {/* Meeting Details */}
                                    {invoiceData.meetings && Array.isArray(invoiceData.meetings) && invoiceData.meetings.length > 0 && (
                                      <View style={{ marginBottom: 10 }}>
                                        <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#374151', marginBottom: 5 }}>Meetings Conducted:</Text>
                                        <View style={styles.table}>
                                          <View style={[styles.tableRow, styles.tableHeader]}>
                                            <Text style={[styles.tableCell, { flex: 2 }]}>Meeting Name</Text>
                                            <Text style={[styles.tableCell, { flex: 1 }]}>Date</Text>
                                          </View>
                                          {invoiceData.meetings.map((meeting, index) => (
                                            <View key={index} style={styles.tableRow}>
                                              <Text style={[styles.tableCell, { flex: 2, fontSize: 8 }]}>{meeting.title || 'N/A'}</Text>
                                              <Text style={[styles.tableCell, { flex: 1, fontSize: 8 }]}>
                                                {meeting.startDatetime ? format(new Date(meeting.startDatetime), 'dd/MM/yyyy') : 'N/A'}
                                              </Text>
                                            </View>
                                          ))}
                                        </View>
                                      </View>
                                    )}
                                  </Page>
                                </Document>
                              );

                              // Generate PDF blob
                              const blob = await pdf(doc).toBlob();
                              console.log('Invoice PDF blob created, size:', blob.size);

                              // Create download link
                              const url = URL.createObjectURL(blob);
                              const link = document.createElement('a');
                              link.href = url;
                              link.download = getSafeFileName(`invoice-${selectedDepartment}${selectedSubDepartment ? `-${selectedSubDepartment}` : ''}`, dateRange);
                              
                              // Trigger download
                              document.body.appendChild(link);
                              link.click();
                              document.body.removeChild(link);
                              
                              // Clean up
                              URL.revokeObjectURL(url);
                              console.log('Invoice download completed successfully');
                              
                            } catch (error) {
                              console.error('Invoice PDF generation failed:', error);
                              alert('Invoice PDF generation failed: ' + error.message);
                            }
                          }}
                          className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
                        >
                          Download Invoice PDF
                        </button>
                      )}
                    </>
                  )}

                  {(billType === 'accounts' && departmentBillData?.departments) && (
                    <PDFErrorBoundary>
                      <PDFDownloadLink
                        document={
                          <AccountsPDF
                            departmentBillData={departmentBillData}
                            dateRange={dateRange}
                            selectedDepartmentsForAccounts={selectedDepartmentsForAccounts}
                            includeGuestMeals={includeGuestMeals}
                            mealRates={mealRates}
                            meetingFoodRates={meetingFoodRates}
                          />
                        }
                        fileName={`accounts-bill-${selectedDepartmentsForAccounts.join('-')}-${format(new Date(dateRange.startDate), 'yyyy-MM-dd')}.pdf`}
                        className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        {({ loading, error }) => {
                          if (loading) return 'Preparing PDF...';
                          if (error) return 'Error generating PDF';
                          return 'Download Accounts PDF';
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

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirmDialog && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Confirm Delete
              </h3>
              <p className="text-sm text-gray-600 mb-6">
                Are you sure you want to delete this custom list? This action cannot be undone.
              </p>
              <div className="flex justify-center space-x-3">
                <button
                  onClick={() => {
                    setShowDeleteConfirmDialog(false);
                    setDeleteListId(null);
                  }}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300 transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteCustomList}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors duration-200"
                >
                  Yes, Delete
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