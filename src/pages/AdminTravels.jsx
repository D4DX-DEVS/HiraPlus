import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import { 
  MagnifyingGlassIcon,
  MapPinIcon,
  ClockIcon,
  TruckIcon,
  UserIcon,
  FunnelIcon,
  CalendarIcon,
  DocumentArrowDownIcon
} from '@heroicons/react/24/outline';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { GridSkeleton } from '../components/SkeletonLoaders';
import HiraPlus from '../assets/HiraPlus.jpg';

// PDF Component for Travel Records
const TravelPDF = ({ travels, selectedVehicle, selectedUser, dateRange }) => {
  const styles = StyleSheet.create({
    page: {
      flexDirection: 'column',
      backgroundColor: '#FFFFFF',
      padding: 30,
      fontSize: 10,
    },
    headerContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 20,
    },
    logoContainer: {
      alignItems: 'center',
      marginRight: 15,
    },
    logo: {
      width: 80,
      height: 50,
      marginBottom: 5,
    },
    logoText: {
      fontSize: 12,
      fontWeight: 'bold',
      color: '#000000',
    },
    headerText: {
      flex: 1,
      textAlign: 'center',
    },
    title: {
      fontSize: 16,
      fontWeight: 'bold',
      color: '#000000',
      marginBottom: 5,
    },
    subtitle: {
      fontSize: 12,
      color: '#374151',
      marginBottom: 10,
    },
    table: {
      display: 'table',
      width: 'auto',
      marginVertical: 10,
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
      minHeight: 30,
    },
    tableHeader: {
      backgroundColor: '#F5F5F5',
      borderBottomWidth: 2,
      borderBottomColor: '#000000',
      fontWeight: 'bold',
    },
    dateCell: {
      flex: 1.2,
      fontSize: 8,
      padding: 5,
      textAlign: 'center',
      borderRightWidth: 1,
      borderRightColor: '#000000',
      color: '#000000',
    },
    locationCell: {
      flex: 1.5,
      fontSize: 8,
      padding: 5,
      textAlign: 'center',
      borderRightWidth: 1,
      borderRightColor: '#000000',
      color: '#000000',
    },
    kmCell: {
      flex: 0.8,
      fontSize: 8,
      padding: 5,
      textAlign: 'center',
      borderRightWidth: 1,
      borderRightColor: '#000000',
      color: '#000000',
    },
    timeCell: {
      flex: 1,
      fontSize: 8,
      padding: 5,
      textAlign: 'center',
      borderRightWidth: 1,
      borderRightColor: '#000000',
      color: '#000000',
    },
    userCell: {
      flex: 1.2,
      fontSize: 8,
      padding: 5,
      textAlign: 'center',
      borderRightWidth: 1,
      borderRightColor: '#000000',
      color: '#000000',
    },
    signatureCell: {
      flex: 1,
      fontSize: 8,
      padding: 5,
      textAlign: 'center',
      color: '#000000',
    },
    filterInfo: {
      fontSize: 10,
      marginBottom: 10,
      color: '#374151',
    },
  });

  const calculateTotalKm = (startKm, endKm) => {
    return endKm - startKm;
  };

  const formatDate = (date) => {
    return format(new Date(date), 'dd/MM/yyyy');
  };

  const getFilterInfo = () => {
    const filters = [];
    if (selectedVehicle) filters.push(`Vehicle: ${selectedVehicle}`);
    if (selectedUser) filters.push(`User: ${selectedUser}`);
    if (dateRange.startDate && dateRange.endDate) {
      filters.push(`Date Range: ${formatDate(dateRange.startDate)} - ${formatDate(dateRange.endDate)}`);
    }
    return filters.length > 0 ? `Filters: ${filters.join(', ')}` : 'All Travel Records';
  };

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
          {getFilterInfo()}
        </Text>
      </View>
    </View>
  );

  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        {renderHeader('Travel Records Report')}
        
        <View style={styles.table}>
          {/* Table Header */}
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Text style={styles.dateCell}>Date</Text>
            <Text style={styles.locationCell}>From</Text>
            <Text style={styles.locationCell}>To</Text>
            <Text style={styles.kmCell}>Start KM</Text>
            <Text style={styles.kmCell}>End KM</Text>
            <Text style={styles.kmCell}>Total KM</Text>
            <Text style={styles.timeCell}>Start Time</Text>
            <Text style={styles.timeCell}>End Time</Text>
            <Text style={styles.userCell}>User Name</Text>
            <Text style={styles.signatureCell}>Signature</Text>
          </View>
          
          {/* Table Rows */}
          {travels.map((travel, index) => (
            <View key={travel._id} style={styles.tableRow}>
              <Text style={styles.dateCell}>{formatDate(travel.date)}</Text>
              <Text style={styles.locationCell}>{travel.fromLocation || 'N/A'}</Text>
              <Text style={styles.locationCell}>{travel.toLocation || 'N/A'}</Text>
              <Text style={styles.kmCell}>{travel.startKm || 'N/A'}</Text>
              <Text style={styles.kmCell}>{travel.endKm || 'N/A'}</Text>
              <Text style={styles.kmCell}>{calculateTotalKm(travel.startKm, travel.endKm)}</Text>
              <Text style={styles.timeCell}>{travel.startTime || 'N/A'}</Text>
              <Text style={styles.timeCell}>{travel.endTime || 'N/A'}</Text>
              <Text style={styles.userCell}>{travel.user?.name || 'N/A'}</Text>
              <Text style={styles.signatureCell}></Text>
            </View>
          ))}
        </View>
      </Page>
    </Document>
  );
};

// PDF Error Boundary Component
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
      return <div className="text-red-600 text-sm">Error generating PDF</div>;
    }
    return this.props.children;
  }
}

const AdminTravels = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    const saved = localStorage.getItem('sidebarOpen');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [travels, setTravels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  // New state for sorting and filtering
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [selectedUser, setSelectedUser] = useState('');
  const [dateFilter, setDateFilter] = useState({
    startDate: '',
    endDate: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [vehicles, setVehicles] = useState([]);
  const [users, setUsers] = useState([]);
  const [showDownloadOptions, setShowDownloadOptions] = useState(false);

  const fetchTravels = async () => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('adminToken');
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/admin/travel/all`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setTravels(response.data || []);
      
      // Extract unique vehicles for filter dropdown
      const uniqueVehicles = [...new Set(response.data
        .filter(travel => travel.vehicle?.vehicleName)
        .map(travel => travel.vehicle.vehicleName)
      )].sort();
      setVehicles(uniqueVehicles);

      // Extract unique users for filter dropdown
      const uniqueUsers = [...new Set(response.data
        .filter(travel => travel.user?.name)
        .map(travel => travel.user.name)
      )].sort();
      setUsers(uniqueUsers);
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Failed to fetch travels');
      console.error('Error fetching travels:', err);
    } finally {
      setLoading(false);
    }
  };

  const calculateTotalKm = (startKm, endKm) => {
    return endKm - startKm;
  };

  const calculateDuration = (startTime, endTime) => {
    if (!startTime || !endTime) return 'N/A';
    
    try {
      const [startHour, startMin] = startTime.split(':').map(Number);
      const [endHour, endMin] = endTime.split(':').map(Number);
      
      let totalMinutes = (endHour * 60 + endMin) - (startHour * 60 + startMin);
      
      if (totalMinutes < 0) {
        totalMinutes += 24 * 60; // Handle overnight trips
      }
      
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;
      
      return `${hours}h ${minutes}m`;
    } catch {
      return 'N/A';
    }
  };

  const isDateInRange = (travelDate, startDate, endDate) => {
    if (!startDate || !endDate) return true;
    
    const travel = new Date(travelDate);
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    return travel >= start && travel <= end;
  };

  const filteredTravels = travels.filter(travel => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = (
      travel.fromLocation?.toLowerCase().includes(searchLower) ||
      travel.toLocation?.toLowerCase().includes(searchLower) ||
      travel.user?.name?.toLowerCase().includes(searchLower) ||
      travel.vehicle?.vehicleName?.toLowerCase().includes(searchLower) ||
      travel.vehicle?.vehicleNumber?.toLowerCase().includes(searchLower) ||
      travel.description?.toLowerCase().includes(searchLower)
    );
    
    const matchesVehicle = !selectedVehicle || travel.vehicle?.vehicleName === selectedVehicle;
    const matchesUser = !selectedUser || travel.user?.name === selectedUser;
    const matchesDateRange = isDateInRange(travel.date, dateFilter.startDate, dateFilter.endDate);
    
    return matchesSearch && matchesVehicle && matchesUser && matchesDateRange;
  });

  const clearFilters = () => {
    setSelectedVehicle('');
    setSelectedUser('');
    setDateFilter({ startDate: '', endDate: '' });
    setSearchQuery('');
  };

  const hasActiveFilters = selectedVehicle || selectedUser || dateFilter.startDate || dateFilter.endDate || searchQuery;

  useEffect(() => {
    fetchTravels();
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
                        Travel Records
                      </h1>
                      <div className="flex items-center space-x-3 text-xs">
                        <span className="flex items-center text-green-600">
                          <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5"></div>
                          {filteredTravels.length} Travel{filteredTravels.length !== 1 ? 's' : ''}
                        </span>
                        <span className="flex items-center text-blue-600">
                          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-1.5"></div>
                          {travels.length} Total
                        </span>
                        {hasActiveFilters && (
                          <span className="flex items-center text-orange-600">
                            <div className="w-1.5 h-1.5 bg-orange-500 rounded-full mr-1.5"></div>
                            Filtered
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {filteredTravels.length > 0 && (
                        <PDFErrorBoundary>
                          <PDFDownloadLink
                            document={
                              <TravelPDF
                                travels={filteredTravels}
                                selectedVehicle={selectedVehicle}
                                selectedUser={selectedUser}
                                dateRange={dateFilter}
                              />
                            }
                            fileName={`travel-records-${format(new Date(), 'yyyy-MM-dd')}.pdf`}
                            className="flex items-center space-x-1 px-3 py-1.5 rounded-lg text-sm font-medium bg-green-100 text-green-700 border border-green-200 hover:bg-green-200 transition-colors"
                          >
                            {({ loading, error }) => {
                              if (loading) return 'Preparing PDF...';
                              if (error) return 'Error generating PDF';
                              return (
                                <>
                                  <DocumentArrowDownIcon className="h-4 w-4" />
                                  <span>Download PDF</span>
                                </>
                              );
                            }}
                          </PDFDownloadLink>
                        </PDFErrorBoundary>
                      )}
                      <button
                        onClick={() => setShowDownloadOptions(!showDownloadOptions)}
                        className="flex items-center space-x-1 px-3 py-1.5 rounded-lg text-sm font-medium bg-blue-100 text-blue-700 border border-blue-200 hover:bg-blue-200 transition-colors"
                      >
                        <FunnelIcon className="h-4 w-4" />
                        <span>Download Options</span>
                      </button>
                      <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                          hasActiveFilters 
                            ? 'bg-orange-100 text-orange-700 border border-orange-200' 
                            : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200'
                        }`}
                      >
                        <FunnelIcon className="h-4 w-4" />
                        <span>Filters</span>
                        {hasActiveFilters && (
                          <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                        )}
                      </button>
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <MapPinIcon className="h-4 w-4" />
                        <span>View Only</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Filters Section */}
              {showFilters && (
                <div className="mb-3 bg-white rounded-lg shadow-sm border border-gray-200/50 p-3">
                  <div className="grid grid-cols-1 lg:grid-cols-5 gap-3">
                    {/* Search */}
                    <div className="lg:col-span-2">
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Search
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />
                        </div>
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Search by location, user, vehicle..."
                          className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm transition-all duration-200"
                        />
                      </div>
                    </div>

                    {/* Vehicle Filter */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Vehicle
                      </label>
                      <select
                        value={selectedVehicle}
                        onChange={(e) => setSelectedVehicle(e.target.value)}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm transition-all duration-200"
                      >
                        <option value="">All Vehicles</option>
                        {vehicles.map((vehicle) => (
                          <option key={vehicle} value={vehicle}>
                            {vehicle}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* User Filter */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        User (Driver)
                      </label>
                      <select
                        value={selectedUser}
                        onChange={(e) => setSelectedUser(e.target.value)}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm transition-all duration-200"
                      >
                        <option value="">All Users</option>
                        {users.map((user) => (
                          <option key={user} value={user}>
                            {user}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Date Range */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Date Range
                      </label>
                      <div className="flex space-x-2">
                        <input
                          type="date"
                          value={dateFilter.startDate}
                          onChange={(e) => setDateFilter({...dateFilter, startDate: e.target.value})}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        />
                        <input
                          type="date"
                          value={dateFilter.endDate}
                          onChange={(e) => setDateFilter({...dateFilter, endDate: e.target.value})}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Filter Actions */}
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200">
                    <div className="text-xs text-gray-500">
                      {hasActiveFilters && (
                        <span>
                          Showing {filteredTravels.length} of {travels.length} travels
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      {hasActiveFilters && (
                        <button
                          onClick={clearFilters}
                          className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 border border-gray-200 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                          Clear All
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Download Options Section */}
              {showDownloadOptions && (
                <div className="mb-3 bg-white rounded-lg shadow-sm border border-gray-200/50 p-3">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-medium text-gray-900">Download Options</h3>
                    <button
                      onClick={() => setShowDownloadOptions(false)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      ×
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                    {/* Download All */}
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <h4 className="text-xs font-medium text-gray-900 mb-2">Download All Records</h4>
                      <PDFErrorBoundary>
                        <PDFDownloadLink
                          document={
                            <TravelPDF
                              travels={filteredTravels}
                              selectedVehicle={selectedVehicle}
                              selectedUser={selectedUser}
                              dateRange={dateFilter}
                            />
                          }
                          fileName={`travel-records-${format(new Date(), 'yyyy-MM-dd')}.pdf`}
                          className="inline-flex items-center px-3 py-2 text-xs font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
                        >
                          {({ loading, error }) => {
                            if (loading) return 'Preparing PDF...';
                            if (error) return 'Error generating PDF';
                            return 'Download All';
                          }}
                        </PDFDownloadLink>
                      </PDFErrorBoundary>
                    </div>

                    {/* Download by Vehicle */}
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <h4 className="text-xs font-medium text-gray-900 mb-2">Download by Vehicle</h4>
                      {vehicles.map((vehicle) => (
                        <PDFErrorBoundary key={vehicle}>
                          <PDFDownloadLink
                            document={
                              <TravelPDF
                                travels={travels.filter(travel => travel.vehicle?.vehicleName === vehicle)}
                                selectedVehicle={vehicle}
                                selectedUser=""
                                dateRange={{ startDate: '', endDate: '' }}
                              />
                            }
                            fileName={`travel-records-${vehicle.replace(/\s+/g, '-')}-${format(new Date(), 'yyyy-MM-dd')}.pdf`}
                            className="block w-full mb-1 px-2 py-1 text-xs font-medium text-white bg-blue-600 rounded hover:bg-blue-700 transition-colors text-center"
                          >
                            {({ loading, error }) => {
                              if (loading) return 'Preparing...';
                              if (error) return 'Error';
                              return vehicle;
                            }}
                          </PDFDownloadLink>
                        </PDFErrorBoundary>
                      ))}
                    </div>

                    {/* Download by User */}
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <h4 className="text-xs font-medium text-gray-900 mb-2">Download by User</h4>
                      {users.map((user) => (
                        <PDFErrorBoundary key={user}>
                          <PDFDownloadLink
                            document={
                              <TravelPDF
                                travels={travels.filter(travel => travel.user?.name === user)}
                                selectedVehicle=""
                                selectedUser={user}
                                dateRange={{ startDate: '', endDate: '' }}
                              />
                            }
                            fileName={`travel-records-${user.replace(/\s+/g, '-')}-${format(new Date(), 'yyyy-MM-dd')}.pdf`}
                            className="block w-full mb-1 px-2 py-1 text-xs font-medium text-white bg-purple-600 rounded hover:bg-purple-700 transition-colors text-center"
                          >
                            {({ loading, error }) => {
                              if (loading) return 'Preparing...';
                              if (error) return 'Error';
                              return user;
                            }}
                          </PDFDownloadLink>
                        </PDFErrorBoundary>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Search Section (when filters are collapsed) */}
              {!showFilters && (
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
                        placeholder="Search travels by location, user, vehicle..."
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm transition-all duration-200"
                      />
                    </div>
                  </div>
                </div>
              )}

              {error && (
                <div className="mb-3 bg-gradient-to-r from-red-50 to-red-100 border border-red-200 rounded-xl p-3 flex-shrink-0">
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-red-500 rounded-full mr-3"></div>
                    <div className="text-sm text-red-700 font-medium">{error}</div>
                  </div>
                </div>
              )}

              {/* Travels Table */}
              <div className="flex-1 bg-white rounded-lg shadow-sm border border-gray-200/50 overflow-hidden">
                <div className="h-full overflow-auto">
                  {loading ? (
                    <div className="min-w-full">
                      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 sticky top-0 z-10">
                        <div className="grid grid-cols-12 gap-4 items-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          <div className="col-span-2">Date & Time</div>
                          <div className="col-span-2">User & Vehicle</div>
                          <div className="col-span-3">Route</div>
                          <div className="col-span-2">Distance</div>
                          <div className="col-span-2">Duration</div>
                          <div className="col-span-1">Status</div>
                        </div>
                      </div>
                      <GridSkeleton />
                    </div>
                  ) : (
                    <div className="min-w-full">
                      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 sticky top-0 z-10">
                        <div className="grid grid-cols-12 gap-4 items-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          <div className="col-span-2">Date & Time</div>
                          <div className="col-span-2">User & Vehicle</div>
                          <div className="col-span-3">Route</div>
                          <div className="col-span-2">Distance</div>
                          <div className="col-span-2">Duration</div>
                          <div className="col-span-1">Status</div>
                        </div>
                      </div>

                      <div className="divide-y divide-gray-200">
                        {filteredTravels.length === 0 ? (
                          <div className="px-4 py-8 text-center text-gray-500">
                            <MapPinIcon className="mx-auto h-12 w-12 text-gray-400 mb-3" />
                            <p className="text-sm">
                              {hasActiveFilters ? 'No travels match your filters' : 'No travels found'}
                            </p>
                            {hasActiveFilters && (
                              <button
                                onClick={clearFilters}
                                className="text-xs text-green-600 hover:text-green-700 mt-1 underline"
                              >
                                Clear filters
                              </button>
                            )}
                          </div>
                        ) : (
                          filteredTravels.map((travel) => (
                            <div key={travel._id} className="px-4 py-3 hover:bg-gray-50 transition-colors">
                              <div className="grid grid-cols-12 gap-4 items-center text-sm">
                                {/* Date & Time */}
                                <div className="col-span-2">
                                  <div className="font-medium text-gray-900">
                                    {format(new Date(travel.date), 'MMM dd, yyyy')}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {travel.startTime} - {travel.endTime}
                                  </div>
                                </div>
                                
                                {/* User & Vehicle */}
                                <div className="col-span-2">
                                  <div className="flex items-center space-x-2 mb-1">
                                    <UserIcon className="h-3 w-3 text-gray-400" />
                                    <span className="font-medium text-gray-900 text-xs">
                                      {travel.user?.name || 'Unknown User'}
                                    </span>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <TruckIcon className="h-3 w-3 text-gray-400" />
                                    <span className="text-xs text-gray-600">
                                      {travel.vehicle?.vehicleNumber || 'N/A'}
                                    </span>
                                  </div>
                                </div>
                                
                                {/* Route */}
                                <div className="col-span-3">
                                  <div className="flex items-center space-x-2">
                                    <span className="font-medium text-gray-900">{travel.fromLocation}</span>
                                    <span className="text-gray-400">→</span>
                                    <span className="font-medium text-gray-900">{travel.toLocation}</span>
                                  </div>
                                  {travel.description && (
                                    <div className="text-xs text-gray-500 mt-1 truncate">
                                      {travel.description}
                                    </div>
                                  )}
                                </div>
                                
                                {/* Distance */}
                                <div className="col-span-2">
                                  <div className="text-sm font-medium text-gray-900">
                                    {calculateTotalKm(travel.startKm, travel.endKm)} km
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {travel.startKm} → {travel.endKm}
                                  </div>
                                </div>
                                
                                {/* Duration */}
                                <div className="col-span-2">
                                  <div className="flex items-center space-x-1">
                                    <ClockIcon className="h-3 w-3 text-gray-400" />
                                    <span className="text-sm text-gray-700">
                                      {calculateDuration(travel.startTime, travel.endTime)}
                                    </span>
                                  </div>
                                </div>
                                
                                {/* Status */}
                                <div className="col-span-1">
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                    Completed
                                  </span>
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
    </div>
  );
};

export default AdminTravels;