import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import LeadersSidebar from '../../components/LeadersSidebar';
import LeadersDeleteConfirmModal from '../../components/LeadersDeleteConfirmModal';
import { 
  ChevronLeftIcon, 
  ChevronRightIcon,
  PlusIcon,
  CalendarIcon,
  ClockIcon,
  MapPinIcon,
  EyeIcon,
  TrashIcon,
  PencilIcon
} from '@heroicons/react/24/outline';

const Schedules = () => {
  const navigate = useNavigate();
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [viewMode, setViewMode] = useState('calendar'); // 'calendar' or 'list'
  const [displayedScheduleIndex, setDisplayedScheduleIndex] = useState({}); // Track which schedule to show for each cell
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [scheduleToDelete, setScheduleToDelete] = useState(null);
  
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL_STAGING || 'http://localhost:5000/api/testing';
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    scheduleType: '',
    startDateTime: '',
    endDateTime: '',
    description: '',
    agendaItems: [],
    locationLink: '',
    priority: 'low',
    recurring: false,
    recurrencePattern: {
      frequency: '',
      interval: 1,
      endDate: '',
      daysOfWeek: []
    }
  });

  useEffect(() => {
    fetchSchedules();
  }, []);

  const fetchSchedules = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('leaderToken');
      const response = await axios.get(`${API_BASE_URL}/schedules`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSchedules(response.data.data || []);
    } catch (error) {
      console.error('Error fetching schedules:', error);
      setError('Failed to load schedules');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSchedule = async (e) => {
    e.preventDefault();
    
    // Validate recurring schedule requirements
    if (formData.recurring) {
      if (!formData.recurrencePattern.frequency) {
        alert('Frequency is required for recurring schedules');
        return;
      }
      
      if (formData.recurrencePattern.frequency === 'weekly' && formData.recurrencePattern.daysOfWeek.length === 0) {
        alert('Please select at least one day of the week for weekly recurring schedules');
        return;
      }
    }
    
    try {
      const token = localStorage.getItem('leaderToken');
      
      // Prepare the data to send
      const scheduleData = {
        ...formData,
        // Convert date strings to proper format if needed
        startDateTime: formData.startDateTime,
        endDateTime: formData.endDateTime,
        // Only include recurrencePattern if recurring is true
        recurrencePattern: formData.recurring ? formData.recurrencePattern : null
      };
      
      const response = await axios.post(`${API_BASE_URL}/schedules`, scheduleData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setShowCreateModal(false);
        setFormData({
          title: '',
          subtitle: '',
          scheduleType: '',
          startDateTime: '',
          endDateTime: '',
          description: '',
          agendaItems: [],
          locationLink: '',
          priority: 'low',
          recurring: false,
          recurrencePattern: {
            frequency: '',
            interval: 1,
            endDate: '',
            daysOfWeek: []
          }
        });
        fetchSchedules();
        alert(response.data.message || 'Schedule created successfully!');
      }
    } catch (error) {
      console.error('Error creating schedule:', error);
      alert(error.response?.data?.message || 'Failed to create schedule');
    }
  };

  const handleToggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handlePageChange = (page) => {
    // Navigate to the corresponding route
    if (page === 'profile') {
      navigate('/leaders/profile');
    } else if (page === 'meetings') {
      navigate('/leaders/meetings');
    } else if (page === 'schedules') {
      navigate('/leaders/schedules');
    } else if (page === 'conflicts') {
      navigate('/leaders/conflicts');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('leaderToken');
    localStorage.removeItem('leaderUser');
    window.location.href = '/';
  };

  const handleDeleteSchedule = (schedule) => {
    // Only allow deletion of low priority schedules
    if (schedule.priority !== 'low') {
      alert('Only low priority schedules can be deleted. High and medium priority schedules cannot be deleted.');
      return;
    }
    setScheduleToDelete(schedule);
    setShowDeleteModal(true);
  };

  const confirmDeleteSchedule = async () => {
    if (!scheduleToDelete) return;

    const token = localStorage.getItem('leaderToken');
    await axios.delete(`${API_BASE_URL}/schedules/${scheduleToDelete._id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    setSchedules(schedules.filter(schedule => schedule._id !== scheduleToDelete._id));
    setScheduleToDelete(null);
  };

  const handleViewSchedule = (schedule) => {
    setSelectedSchedule(schedule);
  };

  const handleScheduleHover = (dateKey, scheduleIndex) => {
    setDisplayedScheduleIndex(prev => ({
      ...prev,
      [dateKey]: scheduleIndex
    }));
  };

  const handleScheduleLeave = (dateKey) => {
    setDisplayedScheduleIndex(prev => ({
      ...prev,
      [dateKey]: 0 // Reset to first schedule
    }));
  };

  const handleScheduleWheel = (e, dateKey, totalSchedules) => {
    e.preventDefault();
    e.stopPropagation();
    
    const currentIndex = displayedScheduleIndex[dateKey] || 0;
    let newIndex;
    
    if (e.deltaY > 0) {
      // Scroll down - next schedule
      newIndex = (currentIndex + 1) % totalSchedules;
    } else {
      // Scroll up - previous schedule
      newIndex = currentIndex === 0 ? totalSchedules - 1 : currentIndex - 1;
    }
    
    setDisplayedScheduleIndex(prev => ({
      ...prev,
      [dateKey]: newIndex
    }));
  };

  // Calendar helper functions
  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const getPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const getNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      timeZone: 'UTC'
    });
  };

  // Helper function to format date from date string (for list view)
  const formatDateFromString = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      timeZone: 'UTC'
    });
  };

  const formatTime = (date) => {
    // Debug logging to check UTC conversion
    console.log('Schedules - Original date:', date);
    console.log('Schedules - UTC time:', date.toUTCString());
    
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: 'UTC'
    });
  };

  const getSchedulesForDate = (date) => {
    const daySchedules = schedules.filter(schedule => {
      const scheduleDate = new Date(schedule.startDateTime);
      return scheduleDate.getDate() === date.getDate() &&
             scheduleDate.getMonth() === date.getMonth() &&
             scheduleDate.getFullYear() === date.getFullYear();
    });
    
    // Sort schedules: overridden schedules first, then by priority (high to low), then by start time
    return daySchedules.sort((a, b) => {
      // First priority: overridden schedules
      if (a.overridden && !b.overridden) return -1;
      if (!a.overridden && b.overridden) return 1;
      
      // Second priority: priority level (high > medium > low)
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      
      // Third priority: start time (earlier first)
      return new Date(a.startDateTime) - new Date(b.startDateTime);
    });
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Helper function to group schedules by date
  const groupSchedulesByDate = () => {
    const grouped = {};
    
    schedules.forEach(schedule => {
      // Create a UTC date object for consistent grouping
      const scheduleDate = new Date(schedule.startDateTime);
      const utcYear = scheduleDate.getUTCFullYear();
      const utcMonth = scheduleDate.getUTCMonth();
      const utcDay = scheduleDate.getUTCDate();
      
      // Create a consistent date key using UTC components
      const dateKey = `${utcYear}-${String(utcMonth + 1).padStart(2, '0')}-${String(utcDay).padStart(2, '0')}`;
      
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(schedule);
    });

    // Sort dates and schedules within each date
    return Object.keys(grouped)
      .sort((a, b) => new Date(a) - new Date(b))
      .reduce((acc, date) => {
        acc[date] = grouped[date].sort((a, b) => {
          // First priority: overridden schedules
          if (a.overridden && !b.overridden) return -1;
          if (!a.overridden && b.overridden) return 1;
          
          // Second priority: priority level (high > medium > low)
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
          if (priorityDiff !== 0) return priorityDiff;
          
          // Third priority: start time (earlier first)
          return new Date(a.startDateTime) - new Date(b.startDateTime);
        });
        return acc;
      }, {});
  };

  // Helper function to get day name
  const getDayName = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      timeZone: 'UTC'
    });
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDayOfMonth = getFirstDayOfMonth(currentDate);
    
    // Calculate number of weeks needed
    const totalCells = firstDayOfMonth + daysInMonth;
    const weeksNeeded = Math.ceil(totalCells / 7);
    
    // Determine cell height based on number of weeks
    const cellHeight = weeksNeeded > 5 ? 'h-20' : 'h-24';
    
    const days = [];

    // Add cells for previous month days
    const prevMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 0);
    const daysInPrevMonth = prevMonth.getDate();
    for (let i = firstDayOfMonth - 1; i >= 0; i--) {
      const dayNumber = daysInPrevMonth - i;
      days.push(
        <div key={`prev-${dayNumber}`} className={`border border-gray-200 bg-gray-50 ${cellHeight} flex flex-col`}>
          <div className="text-sm font-medium mb-1 flex-shrink-0 text-gray-400 opacity-60">
            {dayNumber}
          </div>
          <div className="flex-1"></div>
        </div>
      );
    }

    // Add cells for each day of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      const daySchedules = getSchedulesForDate(date);
      const isToday = date.toDateString() === new Date().toDateString();
      const isSelected = selectedDate && date.toDateString() === selectedDate.toDateString();

      days.push(
                  <div 
            key={day}
            className={`border border-[#080325] p-1 cursor-pointer transition-colors flex flex-col ${cellHeight} ${
              isToday ? 'bg-blue-50 border-blue-300' : 
              isSelected ? 'bg-gray-100 border-gray-400' : 
              'bg-white hover:bg-gray-50'
            }`}
          onClick={() => setSelectedDate(date)}
        >
          <div className="text-sm font-medium mb-1 flex-shrink-0">
            {day}
          </div>
          <div className="flex-1 flex flex-col">
            {daySchedules.length > 0 ? (
              <>
                <div
                  className={`text-xs p-1 rounded border ${(() => {
                    const currentIndex = displayedScheduleIndex[date.toDateString()] || 0;
                    const currentSchedule = daySchedules[currentIndex] || daySchedules[0];
                    let baseClasses = getPriorityColor(currentSchedule?.priority || daySchedules[0].priority);
                    // Add special styling for overridden schedules
                    if (currentSchedule?.overridden) {
                      baseClasses = baseClasses.replace('border-', 'border-2 border-');
                      baseClasses += ' ring-2 ring-orange-300 ring-opacity-50';
                    }
                    return baseClasses;
                  })()} cursor-pointer hover:opacity-80 flex-1 relative`}
                  onClick={(e) => {
                    e.stopPropagation();
                    const currentIndex = displayedScheduleIndex[date.toDateString()] || 0;
                    handleViewSchedule(daySchedules[currentIndex]);
                  }}
                  onWheel={(e) => {
                    if (daySchedules.length > 1) {
                      handleScheduleWheel(e, date.toDateString(), daySchedules.length);
                    }
                  }}
                  title={`${(() => {
                    const currentIndex = displayedScheduleIndex[date.toDateString()] || 0;
                    const currentSchedule = daySchedules[currentIndex] || daySchedules[0];
                    const overriddenText = currentSchedule?.overridden ? ' (OVERRIDDEN)' : '';
                    return `${currentSchedule.title} - ${formatTime(new Date(currentSchedule.startDateTime))}${overriddenText} ${daySchedules.length > 1 ? '(Scroll to change)' : ''}`;
                  })()}`}
                >
                  {/* Overridden indicator */}
                  {(() => {
                    const currentIndex = displayedScheduleIndex[date.toDateString()] || 0;
                    const currentSchedule = daySchedules[currentIndex] || daySchedules[0];
                    return currentSchedule?.overridden ? (
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-orange-500 rounded-full border-2 border-white shadow-sm"></div>
                    ) : null;
                  })()}
                  
                  <div className="font-medium truncate">
                    {(() => {
                      const currentIndex = displayedScheduleIndex[date.toDateString()] || 0;
                      return daySchedules[currentIndex]?.title || daySchedules[0].title;
                    })()}
                  </div>
                  <div className="text-xs opacity-75">
                    {(() => {
                      const currentIndex = displayedScheduleIndex[date.toDateString()] || 0;
                      return formatTime(new Date(daySchedules[currentIndex]?.startDateTime || daySchedules[0].startDateTime));
                    })()}
                  </div>
                </div>
                {daySchedules.length > 1 && (
                  <div className="flex items-center justify-center mt-1">
                    <div className="flex space-x-1">
                      {daySchedules.map((_, index) => (
                        <div 
                          key={index} 
                          className={`w-1 h-1 rounded-full cursor-pointer transition-colors ${
                            (displayedScheduleIndex[date.toDateString()] || 0) === index 
                              ? 'bg-gray-600' 
                              : 'bg-gray-400 hover:bg-gray-500'
                          }`}
                          onMouseEnter={() => handleScheduleHover(date.toDateString(), index)}
                          onMouseLeave={() => handleScheduleLeave(date.toDateString())}
                          title={`Schedule ${index + 1}: ${daySchedules[index].title}`}
                        ></div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="flex-1"></div>
            )}
          </div>
        </div>
      );
    }

    // Add cells for upcoming month days only to complete the last week
    const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), daysInMonth);
    const lastDayOfWeek = lastDayOfMonth.getDay(); // 0 = Sunday, 6 = Saturday
    const remainingCellsInWeek = 6 - lastDayOfWeek; // Days needed to complete the week
    
    for (let day = 1; day <= remainingCellsInWeek; day++) {
      days.push(
        <div key={`next-${day}`} className={`border border-gray-200 bg-gray-50 ${cellHeight} flex flex-col`}>
          <div className="text-sm font-medium mb-1 flex-shrink-0 text-gray-400 opacity-60">
            {day}
          </div>
          <div className="flex-1"></div>
        </div>
      );
    }

    return days;
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const renderListView = () => {
    const groupedSchedules = groupSchedulesByDate();
    
    if (Object.keys(groupedSchedules).length === 0) {
      return (
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 text-center hover:shadow-xl transition-all duration-300">
          <div className="w-16 h-16 bg-[#080325]/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <ClockIcon className="w-8 h-8 text-[#080325]" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">No schedules found</h3>
          <p className="text-sm text-gray-600 mb-4">Create your first schedule to get started.</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-[#080325] text-white px-6 py-2 rounded-lg hover:bg-[#0a0a2a] transition-all duration-200 font-medium"
          >
            Create Schedule
          </button>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {Object.entries(groupedSchedules).map(([dateKey, daySchedules]) => (
          <div key={dateKey} className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300">
            <div className="bg-[#080325] px-4 py-2 border-b border-[#080325]">
              <h3 className="text-base font-bold text-white">
                {getDayName(dateKey)}, {formatDateFromString(dateKey)}
              </h3>
              <p className="text-xs text-white/80">
                {daySchedules.length} schedule{daySchedules.length !== 1 ? 's' : ''}
              </p>
            </div>
            <div className="divide-y divide-gray-100">
              {daySchedules.map((schedule) => (
                <div key={schedule._id} className="p-3 hover:bg-gray-50 transition-all duration-200 border-l-4 border-transparent hover:border-[#080325]">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-sm font-bold text-gray-900 truncate">{schedule.title}</h4>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${getPriorityColor(schedule.priority)}`}>
                          {schedule.priority}
                        </span>
                        {schedule.recurring && (
                          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
                            Recurring
                          </span>
                        )}
                      </div>
                      
                      {schedule.subtitle && (
                        <p className="text-xs text-gray-600 mb-1 truncate font-medium">{schedule.subtitle}</p>
                      )}
                      
                      <div className="flex items-center gap-3 text-xs text-gray-600 mb-1">
                        <div className="flex items-center gap-1">
                          <ClockIcon className="w-3 h-3 text-[#080325]" />
                          <span className="font-medium">{formatTime(new Date(schedule.startDateTime))} - {formatTime(new Date(schedule.endDateTime))}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <CalendarIcon className="w-3 h-3 text-[#080325]" />
                          <span className="font-medium">{schedule.scheduleType}</span>
                        </div>
                      </div>
                      
                      {schedule.description && (
                        <p className="text-xs text-gray-700 line-clamp-1 leading-relaxed">{schedule.description}</p>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-1 ml-3 flex-shrink-0">
                      <button
                        onClick={() => handleViewSchedule(schedule)}
                        className="p-1.5 text-gray-500 hover:text-[#080325] hover:bg-gray-100 rounded-lg transition-all duration-200 hover:shadow-sm"
                        title="View Details"
                      >
                        <EyeIcon className="w-4 h-4" />
                      </button>
                      {schedule.priority === 'low' && (
                        <button
                          onClick={() => handleDeleteSchedule(schedule)}
                          className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all duration-200 hover:shadow-sm"
                          title="Delete Schedule"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <LeadersSidebar 
        isOpen={isSidebarOpen}
        onToggle={handleToggleSidebar}
        activePage="schedules"
        onPageChange={handlePageChange}
        onLogout={handleLogout}
      />
      <main className={`flex-1 transition-all duration-300 ${isSidebarOpen ? 'lg:ml-80' : 'lg:ml-24'}`}>
         <div className="p-2 pr-6 pt-6">
                                           {/* Header */}
            <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center mb-8 gap-3">
              <div>
                <h1 className="text-2xl lg:text-5xl font-bold text-gray-900 mb-1">
                  {viewMode === 'calendar' ? 'Calendar' : 'Schedule List'}
                </h1>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                {/* View Toggle */}
                <div className="flex bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setViewMode('calendar')}
                    className={`px-4 py-2 rounded text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                      viewMode === 'calendar'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <CalendarIcon className="w-4 h-4" />
                    Calendar
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`px-4 py-2 rounded text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                      viewMode === 'list'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <ClockIcon className="w-4 h-4" />
                    List
                  </button>
                </div>
                
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="bg-gray-900 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-gray-800 transition-all duration-200 shadow-sm hover:shadow-md text-sm font-medium"
                >
                  <PlusIcon className="w-4 h-4" />
                  <span>Create Schedule</span>
                </button>
              </div>
            </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="flex justify-center items-center py-16">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
            </div>
          )}

                     {/* Calendar View */}
           {!loading && viewMode === 'calendar' && (
             <div className="bg-white rounded-lg shadow-sm border border-[#080325] overflow-hidden -ml-2 flex flex-col h-[calc(100vh-120px)]">
               {/* Calendar Header */}
               <div className="flex justify-between items-center p-3 border-b border-[#080325] flex-shrink-0 bg-[#080325] text-white">
                 <div className="flex items-center gap-3">
                   <h2 className="text-lg font-bold text-white">
                     {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                   </h2>
                 </div>
                 <div className="flex items-center gap-1">
                   <button
                     onClick={getPreviousMonth}
                     className="p-1.5 text-gray-300 hover:text-white hover:bg-gray-700/50 rounded transition-colors"
                   >
                     <ChevronLeftIcon className="w-4 h-4" />
                   </button>
                   <button
                     onClick={goToToday}
                     className="px-3 py-1.5 text-xs font-medium text-white bg-gray-700/50 hover:bg-gray-600/50 rounded transition-colors"
                   >
                     Today
                   </button>
                   <button
                     onClick={getNextMonth}
                     className="p-1.5 text-gray-300 hover:text-white hover:bg-gray-700/50 rounded transition-colors"
                   >
                     <ChevronRightIcon className="w-4 h-4" />
                   </button>
                 </div>
               </div>

               {/* Calendar Grid */}
               <div className="flex-1 flex flex-col p-2">
                 {/* Day Headers */}
                 <div className="grid grid-cols-7 gap-0.5 mb-1 flex-shrink-0">
                   {dayNames.map((day) => (
                     <div key={day} className="text-center text-xs font-medium text-gray-600 py-1">
                       {day}
                     </div>
                   ))}
                 </div>

                 {/* Calendar Days */}
                 <div className="grid grid-cols-7 gap-0.5 flex-1">
                   {renderCalendar()}
                 </div>
               </div>
             </div>
           )}

                       {/* List View */}
            {!loading && viewMode === 'list' && (
              <div className="space-y-3">
                {renderListView()}
              </div>
            )}
        </div>
      </main>

      {/* Create Schedule Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white/95 backdrop-blur-md rounded-lg w-full max-w-2xl h-[80vh] flex flex-col shadow-2xl border border-gray-200/50">
            {/* Header Section with Sidebar Color */}
            <div className="bg-[#080325] text-white px-4 py-1.5 rounded-t-lg">
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-2xl font-bold text-white mb-0.5">Create New Schedule</h1>
                </div>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-1 rounded-full hover:bg-gray-700/50 transition-colors duration-200 text-gray-300 hover:text-white"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
                        {/* Form Content - Scrollable Middle Section */}
            <div className="flex-1 overflow-hidden">
              <div className={`p-4 ${formData.recurring ? 'overflow-y-auto h-full' : ''}`}>
                
                <form className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-0.5">
                    Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all duration-200 hover:border-gray-400"
                    placeholder="Enter schedule title"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-0.5">
                    Subtitle
                  </label>
                  <input
                    type="text"
                    value={formData.subtitle}
                    onChange={(e) => setFormData({...formData, subtitle: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all duration-200 hover:border-gray-400"
                    placeholder="Enter subtitle (optional)"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-0.5">
                    Schedule Type *
                  </label>
                  <select
                    required
                    value={formData.scheduleType}
                    onChange={(e) => setFormData({...formData, scheduleType: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all duration-200 hover:border-gray-400"
                  >
                    <option value="">Select Type</option>
                    <option value="Meeting">Meeting</option>
                    <option value="Personal Appointment">Personal Appointment</option>
                    <option value="Work Block">Work Block</option>
                    <option value="Out of Office">Out of Office</option>
                    <option value="Visits">Visits</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-0.5">
                      Start Date & Time *
                    </label>
                    <input
                      type="datetime-local"
                      required
                      value={formData.startDateTime}
                      onChange={(e) => setFormData({...formData, startDateTime: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all duration-200 hover:border-gray-400"
                      placeholder="dd/mm/yyyy --:--"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-0.5">
                      End Date & Time *
                    </label>
                    <input
                      type="datetime-local"
                      required
                      value={formData.endDateTime}
                      onChange={(e) => setFormData({...formData, endDateTime: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all duration-200 hover:border-gray-400"
                      placeholder="dd/mm/yyyy --:--"
                    />
                  </div>
                </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-0.5">
                    Priority
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({...formData, priority: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all duration-200 hover:border-gray-400"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-0.5">
                    Location
                  </label>
                  <input
                    type="text"
                    value={formData.locationLink}
                    onChange={(e) => setFormData({...formData, locationLink: e.target.value})}
                    placeholder="Enter location/meeting link"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all duration-200 hover:border-gray-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-0.5">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  rows="2"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all duration-200 hover:border-gray-400"
                  placeholder="Enter schedule description (optional)"
                />
              </div>

              {/* Recurring Schedule Section */}
              <div className="border-t border-gray-200 pt-2">
                <div className="flex items-center mb-2">
                  <input
                    type="checkbox"
                    id="recurring"
                    checked={formData.recurring}
                    onChange={(e) => setFormData({...formData, recurring: e.target.checked})}
                    className="w-4 h-4 text-gray-900 border-gray-300 rounded focus:ring-gray-900"
                  />
                  <label htmlFor="recurring" className="ml-2 text-sm font-medium text-gray-700">
                    Make this a recurring schedule
                  </label>
                </div>

                {formData.recurring && (
                                      <div className="space-y-2 bg-gray-50/80 backdrop-blur-sm p-3 rounded-lg border border-gray-200/50">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                                                  <label className="block text-sm font-medium text-gray-700 mb-0.5">
                            Frequency *
                          </label>
                        <select
                          required={formData.recurring}
                          value={formData.recurrencePattern.frequency}
                          onChange={(e) => setFormData({
                            ...formData, 
                            recurrencePattern: {
                              ...formData.recurrencePattern,
                              frequency: e.target.value
                            }
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all duration-200 hover:border-gray-400"
                        >
                          <option value="">Select Frequency</option>
                          <option value="daily">Daily</option>
                          <option value="weekly">Weekly</option>
                          <option value="monthly">Monthly</option>
                        </select>
                      </div>

                      <div>
                                                  <label className="block text-sm font-medium text-gray-700 mb-0.5">
                            Interval
                          </label>
                        <input
                          type="number"
                          min="1"
                          value={formData.recurrencePattern.interval}
                          onChange={(e) => setFormData({
                            ...formData, 
                            recurrencePattern: {
                              ...formData.recurrencePattern,
                              interval: parseInt(e.target.value) || 1
                            }
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all duration-200 hover:border-gray-400"
                        />
                      </div>
                    </div>

                    {formData.recurrencePattern.frequency === 'weekly' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Days of Week
                        </label>
                        <div className="grid grid-cols-7 gap-2">
                          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
                            <label key={day} className="flex items-center">
                              <input
                                type="checkbox"
                                checked={formData.recurrencePattern.daysOfWeek.includes(index)}
                                onChange={(e) => {
                                  const newDays = e.target.checked
                                    ? [...formData.recurrencePattern.daysOfWeek, index]
                                    : formData.recurrencePattern.daysOfWeek.filter(d => d !== index);
                                  setFormData({
                                    ...formData,
                                    recurrencePattern: {
                                      ...formData.recurrencePattern,
                                      daysOfWeek: newDays
                                    }
                                  });
                                }}
                                className="w-4 h-4 text-gray-900 border-gray-300 rounded focus:ring-gray-900"
                              />
                              <span className="ml-1 text-sm text-gray-700">{day}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}

                    <div>
                                              <label className="block text-sm font-medium text-gray-700 mb-0.5">
                          End Date (Optional)
                        </label>
                      <input
                        type="date"
                        value={formData.recurrencePattern.endDate}
                        onChange={(e) => setFormData({
                          ...formData, 
                          recurrencePattern: {
                            ...formData.recurrencePattern,
                            endDate: e.target.value
                          }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all duration-200 hover:border-gray-400"
                      />
                    </div>
                  </div>
                )}
              </div>

                </form>
              </div>
            </div>

            {/* Fixed Footer Section */}
            <div className="border-t border-gray-200 bg-white/95 backdrop-blur-md px-4 py-3">
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleCreateSchedule}
                  className="flex-1 bg-gradient-to-r from-gray-900 to-gray-800 text-white px-4 py-2.5 rounded-lg hover:from-gray-800 hover:to-gray-700 transition-all duration-200 shadow-lg hover:shadow-xl font-semibold"
                >
                  Create Schedule
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 bg-gray-100 text-gray-700 px-4 py-2.5 rounded-lg hover:bg-gray-200 transition-all duration-200 border border-gray-300 font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Schedule Modal */}
      {selectedSchedule && (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white/95 backdrop-blur-md rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl border border-gray-200/50">
            {/* Themed Header */}
            <div className="bg-[#080325] text-white px-6 py-4 rounded-t-xl">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-white">Schedule Details</h2>
                <button
                  onClick={() => setSelectedSchedule(null)}
                  className="text-white/80 hover:text-white p-1.5 hover:bg-white/10 rounded-full transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">

            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">{selectedSchedule.title}</h3>
                {selectedSchedule.subtitle && (
                  <p className="text-sm text-gray-600 mb-2">{selectedSchedule.subtitle}</p>
                )}
                <div className="flex items-center gap-2 mb-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${getPriorityColor(selectedSchedule.priority)}`}>
                    {selectedSchedule.priority} priority
                  </span>
                  <span className="text-xs text-gray-600">{selectedSchedule.scheduleType}</span>
                  {selectedSchedule.recurring && (
                    <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
                      Recurring
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1 text-sm">Date & Time</h4>
                  <p className="text-sm text-gray-700">
                    {formatDate(new Date(selectedSchedule.startDateTime))} - {formatDate(new Date(selectedSchedule.endDateTime))}
                  </p>
                  <p className="text-sm text-gray-700">
                    {formatTime(new Date(selectedSchedule.startDateTime))} - {formatTime(new Date(selectedSchedule.endDateTime))}
                  </p>
                </div>

                {selectedSchedule.locationLink && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1 text-sm">Location</h4>
                    <a 
                      href={selectedSchedule.locationLink} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-[#080325] hover:underline text-sm"
                    >
                      {selectedSchedule.locationLink}
                    </a>
                  </div>
                )}
              </div>

              {selectedSchedule.description && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1 text-sm">Description</h4>
                  <p className="text-sm text-gray-700">{selectedSchedule.description}</p>
                </div>
              )}

              {selectedSchedule.recurring && selectedSchedule.recurrencePattern && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1 text-sm">Recurrence Pattern</h4>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-sm text-gray-700">
                      <strong>Frequency:</strong> {selectedSchedule.recurrencePattern.frequency}
                    </p>
                    <p className="text-sm text-gray-700">
                      <strong>Interval:</strong> Every {selectedSchedule.recurrencePattern.interval} {selectedSchedule.recurrencePattern.frequency === 'daily' ? 'day(s)' : selectedSchedule.recurrencePattern.frequency === 'weekly' ? 'week(s)' : 'month(s)'}
                    </p>
                    {selectedSchedule.recurrencePattern.frequency === 'weekly' && selectedSchedule.recurrencePattern.daysOfWeek && selectedSchedule.recurrencePattern.daysOfWeek.length > 0 && (
                      <p className="text-sm text-gray-700">
                        <strong>Days:</strong> {selectedSchedule.recurrencePattern.daysOfWeek.map(day => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][day]).join(', ')}
                      </p>
                    )}
                    {selectedSchedule.recurrencePattern.endDate && (
                      <p className="text-sm text-gray-700">
                        <strong>End Date:</strong> {formatDate(new Date(selectedSchedule.recurrencePattern.endDate))}
                      </p>
                    )}
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-3 border-t border-gray-200">
                {selectedSchedule.priority === 'low' && (
                  <button
                    onClick={() => handleDeleteSchedule(selectedSchedule)}
                    className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2 text-sm"
                  >
                    <TrashIcon className="w-4 h-4" />
                    Delete Schedule
                  </button>
                )}
                <button
                  onClick={() => setSelectedSchedule(null)}
                  className={`${selectedSchedule.priority === 'low' ? 'flex-1' : 'w-full'} bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors text-sm`}
                >
                  Close
                </button>
              </div>
            </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <LeadersDeleteConfirmModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setScheduleToDelete(null);
        }}
        onConfirm={confirmDeleteSchedule}
        title="Delete Schedule"
        message="Are you sure you want to delete this schedule?"
        itemName={scheduleToDelete?.title}
        confirmText="Delete Schedule"
        cancelText="Cancel"
      />
    </div>
  );
};

export default Schedules;