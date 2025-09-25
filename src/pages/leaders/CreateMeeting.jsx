import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import LeadersSidebar from '../../components/LeadersSidebar';
import {
    ArrowLeftIcon,
    CalendarIcon,
    ClockIcon,
    UserGroupIcon,
    MapPinIcon,
    DocumentTextIcon,
    TagIcon
} from '@heroicons/react/24/outline';

const CreateMeeting = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const location = useLocation();
    const [participants, setParticipants] = useState([]);
    const [tags, setTags] = useState([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [meetingData, setMeetingData] = useState(null);
    const [showTagSelection, setShowTagSelection] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [showAlertModal, setShowAlertModal] = useState(false);
    const [alertMessage, setAlertMessage] = useState('');
    
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL_STAGING || 'http://localhost:5000/api/testing';
    const [formData, setFormData] = useState({
        title: '',
        type: '',
        date: '',
        startTime: '',
        endTime: '',
        mode: '',
        locationLink: '',
        description: '',
        agenda: '',
        participants: [],
        sendNotifications: true
    });

    useEffect(() => {
        fetchUserData();
        fetchParticipants();
        fetchTags();
        
        // Check if we're in editing mode
        if (id) {
            setIsEditing(true);
            fetchMeetingData(id);
        } else if (location.state?.isEditing && location.state?.meetingData) {
            setIsEditing(true);
            setMeetingData(location.state.meetingData);
            populateFormData(location.state.meetingData);
        }
    }, [id, location.state]);

    // Auto-select creator when user is loaded and not editing
    useEffect(() => {
        if (user && user._id && !isEditing && !formData.participants.includes(user._id)) {
            setFormData(prev => ({
                ...prev,
                participants: [user._id, ...prev.participants]
            }));
        }
    }, [user, isEditing]);

    const fetchUserData = async () => {
        try {
            const token = localStorage.getItem('leaderToken');
            const response = await axios.get(`${API_BASE_URL}/leaders/profile`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log('User data fetched:', response.data.user);
            console.log('User role:', response.data.user?.role);
            setUser(response.data.user);
        } catch (error) {
            console.error('Error fetching user data:', error);
        }
    };

    const fetchMeetingData = async (meetingId) => {
        try {
            const token = localStorage.getItem('leaderToken');
            const response = await axios.get(`${API_BASE_URL}/leaders-meetings/${meetingId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            if (response.data.success) {
                const meeting = response.data.data;
                setMeetingData(meeting);
                populateFormData(meeting);
            }
        } catch (error) {
            console.error('Error fetching meeting data:', error);
            showCustomAlert('Failed to load meeting data');
            setTimeout(() => {
                navigate('/leaders/meetings');
            }, 2000);
        }
    };

    const populateFormData = (meeting) => {
        // Convert ISO datetime to separate date and time fields
        const formatDateForInput = (isoString) => {
            if (!isoString) return '';
            const date = new Date(isoString);
            // Use UTC methods to get the date as stored in backend
            const year = date.getUTCFullYear();
            const month = String(date.getUTCMonth() + 1).padStart(2, '0');
            const day = String(date.getUTCDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        };

        const formatTimeForInput = (isoString) => {
            if (!isoString) return '';
            const date = new Date(isoString);
            // Use UTC methods to get the time as stored in backend
            const hours = String(date.getUTCHours()).padStart(2, '0');
            const minutes = String(date.getUTCMinutes()).padStart(2, '0');
            return `${hours}:${minutes}`;
        };

        // Extract participant IDs (excluding the creator)
        const participantIds = meeting.participants
            .filter(p => p.participant._id.toString() !== meeting.createdBy._id.toString())
            .map(p => p.participant._id.toString());

        setFormData({
            title: meeting.title || '',
            type: meeting.type || '',
            date: formatDateForInput(meeting.startDatetime),
            startTime: formatTimeForInput(meeting.startDatetime),
            endTime: formatTimeForInput(meeting.endDatetime),
            mode: meeting.mode || '',
            locationLink: meeting.locationLink || '',
            description: meeting.description || '',
            agenda: meeting.agenda || '',
            participants: participantIds,
            sendNotifications: meeting.sendNotifications !== undefined ? meeting.sendNotifications : true
        });
    };

    const fetchParticipants = async () => {
        try {
            const token = localStorage.getItem('leaderToken');
            const response = await axios.get(`${API_BASE_URL}/leaders/all`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const allLeaders = [
                ...(response.data.data.superLeaders || []),
                ...(response.data.data.regularLeaders || [])
            ];
            
            // Include the creator in the participants list
            const participantsWithCreator = user ? [user, ...allLeaders] : allLeaders;
            
            setParticipants(participantsWithCreator);
            console.log('Participants fetched successfully (including creator):', participantsWithCreator);
            console.log('First participant structure:', participantsWithCreator[0]);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching participants:', error);
            setLoading(false);
        }
    };

    const fetchTags = async () => {
        try {
            const token = localStorage.getItem('leaderToken');
            
            // Use the correct tags endpoint - tags are mounted at /api/tags (not under /testing)
            const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
            const response = await axios.get(`${baseUrl}/tags`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            // The tags API returns tags directly in response.data
            const tagsData = response.data || [];
            setTags(tagsData);
            console.log('Tags fetched successfully:', tagsData);
            console.log('First tag structure:', tagsData[0]);
        } catch (error) {
            console.error('Error fetching tags:', error);
            console.log('Full error details:', {
                message: error.message,
                status: error.response?.status,
                statusText: error.response?.statusText,
                url: error.config?.url
            });
            
            // Set empty tags array to prevent further errors
            setTags([]);
        }
    };

    const handleCreateMeeting = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const token = localStorage.getItem('leaderToken');
            
            // Combine date and time fields into datetime strings
            // Create proper ISO strings that represent UTC time (backend timezone)
            const startDatetime = formData.date && formData.startTime ? `${formData.date}T${formData.startTime}:00.000Z` : '';
            const endDatetime = formData.date && formData.endTime ? `${formData.date}T${formData.endTime}:00.000Z` : '';
            
            const processedFormData = {
                title: formData.title,
                type: formData.type,
                startDatetime,
                endDatetime,
                mode: formData.mode,
                locationLink: formData.locationLink,
                description: formData.description,
                agenda: formData.agenda,
                sendNotifications: formData.sendNotifications,
                // Filter out any null/undefined values from participants
                participants: formData.participants.filter(participantId => participantId != null)
            };


            let response;
            
            if (isEditing) {
                // Update existing meeting
                const meetingId = id || meetingData?._id;
                response = await axios.put(`${API_BASE_URL}/leaders-meetings/${meetingId}`, processedFormData, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            } else {
                // Create new meeting
                console.log('User role check:', {
                    user: user,
                    role: user?.role,
                    roleName: user?.role?.name,
                    isSuperLeader: user?.role?.name === 'super leader'
                });
                
                const endpoint = user?.role?.name === 'super leader'
                    ? `${API_BASE_URL}/leaders-meetings/super-leader/create`
                    : `${API_BASE_URL}/leaders-meetings/create`;
                
                console.log('Selected endpoint:', endpoint);
                
                response = await axios.post(endpoint, processedFormData, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            }

            if (response.data.success) {
                setShowSuccessModal(true);
                // Auto-navigate after 2 seconds
                setTimeout(() => {
                    navigate('/leaders/meetings');
                }, 2000);
            }
        } catch (error) {
            console.error(`Error ${isEditing ? 'updating' : 'creating'} meeting:`, error);
            showCustomAlert(error.response?.data?.message || `Failed to ${isEditing ? 'update' : 'create'} meeting`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleTagSelection = (tagId) => {
        const tag = tags.find(t => t._id === tagId);
        if (tag) {
            console.log('Tag selected:', tag);
            console.log('Current participants:', participants);
            
            // Find all participants who have this tag
            const participantsWithTag = participants.filter(participant => 
                participant.tags && participant.tags.some(participantTag => 
                    (typeof participantTag === 'string' ? participantTag : participantTag._id) === tagId
                )
            );
            
            console.log('Participants with tag:', participantsWithTag);
            
            // Get their IDs
            const participantIds = participantsWithTag.map(p => p._id);
            
            // Add them to selected participants (avoiding duplicates) and ensure creator is always included
            const creatorId = user?._id;
            const allParticipantIds = creatorId ? [creatorId, ...participantIds] : participantIds;
            const newParticipants = [...new Set([...formData.participants, ...allParticipantIds])];
            setFormData({ ...formData, participants: newParticipants });
            
            console.log(`Selected tag "${tag.tagName || tag.name}": ${participantIds.length} participants added`);
            console.log('New participants list:', newParticipants);
        }
    };

    const handleRemoveTagSelection = (tagId) => {
        const tag = tags.find(t => t._id === tagId);
        if (tag) {
            // Find all participants who have this tag
            const participantsWithTag = participants.filter(participant => 
                participant.tags && participant.tags.some(participantTag => 
                    (typeof participantTag === 'string' ? participantTag : participantTag._id) === tagId
                )
            );
            
            // Get their IDs
            const participantIds = participantsWithTag.map(p => p._id);
            
            // Remove them from selected participants, but always keep the creator
            const creatorId = user?._id;
            const newParticipants = formData.participants.filter(id => 
                !participantIds.includes(id) || (creatorId && id === creatorId)
            );
            setFormData({ ...formData, participants: newParticipants });
            
            console.log(`Deselected tag "${tag.tagName || tag.name}": ${participantIds.length} participants removed`);
        }
    };

    const isTagSelected = (tagId) => {
        const tag = tags.find(t => t._id === tagId);
        if (tag) {
            // Find all participants who have this tag
            const participantsWithTag = participants.filter(participant => 
                participant.tags && participant.tags.some(participantTag => 
                    (typeof participantTag === 'string' ? participantTag : participantTag._id) === tagId
                )
            );
            
            // Check if ALL participants with this tag are selected (excluding creator as they're always selected)
            const participantIds = participantsWithTag.map(p => p._id);
            const creatorId = user?._id;
            const nonCreatorParticipants = participantIds.filter(id => id !== creatorId);
            
            return nonCreatorParticipants.length > 0 && nonCreatorParticipants.every(id => formData.participants.includes(id));
        }
        return false;
    };

    const handleToggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    const handlePageChange = (page) => {
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

    const showCustomAlert = (message) => {
        setAlertMessage(message);
        setShowAlertModal(true);
    };

    if (loading) {
        return (
            <div className="flex min-h-screen bg-gray-50">
                <LeadersSidebar
                    isOpen={isSidebarOpen}
                    onToggle={handleToggleSidebar}
                    activePage="meetings"
                    onPageChange={handlePageChange}
                    onLogout={handleLogout}
                />
                <main className={`flex-1 transition-all duration-300 ${isSidebarOpen ? 'lg:ml-80' : 'lg:ml-24'}`}>
                    <div className="flex justify-center items-center py-16">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen bg-gray-50">
            <LeadersSidebar
                isOpen={isSidebarOpen}
                onToggle={handleToggleSidebar}
                activePage="meetings"
                onPageChange={handlePageChange}
                onLogout={handleLogout}
            />
            <main className={`flex-1 transition-all duration-300 ${isSidebarOpen ? 'lg:ml-80' : 'lg:ml-24'}`}>
                <div className="p-8">
                    {/* Header */}
                    <div className="mb-8 relative">
                        <button
                            onClick={() => navigate('/leaders/meetings')}
                            className="absolute top-0 right-0 p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-all duration-200"
                            title="Close"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                        <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-2">
                            {isEditing ? 'Edit Meeting' : 'Create New Meeting'}
                        </h1>
                    </div>

                    {/* Create Meeting Form */}
                    <div className="max-w-4xl mx-auto">
                        <form onSubmit={handleCreateMeeting} className="space-y-6">
                            {/* Basic Information */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Meeting Title *
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.title}
                                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                            placeholder="Enter meeting title"
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all duration-200 hover:border-gray-400"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Meeting Type *
                                        </label>
                                        <select
                                            required
                                            value={formData.type}
                                            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all duration-200 hover:border-gray-400"
                                        >
                                            <option value="">Select Type</option>
                                            <option value="Team Meeting">Team Meeting</option>
                                            <option value="Client Meeting">Client Meeting</option>
                                            <option value="Review Meeting">Review Meeting</option>
                                            <option value="Planning Meeting">Planning Meeting</option>
                                            <option value="Performance Review">Performance Review</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Date & Time */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold text-gray-900">Date & Time</h3>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Meeting Date *
                                        </label>
                                        <input
                                            type="date"
                                            required
                                            value={formData.date}
                                            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all duration-200 hover:border-gray-400"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Start Time *
                                        </label>
                                        <input
                                            type="time"
                                            required
                                            value={formData.startTime}
                                            onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all duration-200 hover:border-gray-400"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            End Time *
                                        </label>
                                        <input
                                            type="time"
                                            required
                                            value={formData.endTime}
                                            onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all duration-200 hover:border-gray-400"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Meeting Details */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold text-gray-900">Meeting Details</h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Meeting Mode *
                                        </label>
                                        <select
                                            required
                                            value={formData.mode}
                                            onChange={(e) => setFormData({ ...formData, mode: e.target.value })}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all duration-200 hover:border-gray-400"
                                        >
                                            <option value="">Select Mode</option>
                                            <option value="online">Online</option>
                                            <option value="offline">Offline</option>
                                            <option value="hybrid">Hybrid</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Location
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.locationLink}
                                            onChange={(e) => setFormData({ ...formData, locationLink: e.target.value })}
                                            placeholder="Enter location or meeting link"
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all duration-200 hover:border-gray-400"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Description
                                    </label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        rows="3"
                                        placeholder="Enter meeting description"
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all duration-200 hover:border-gray-400"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Agenda
                                    </label>
                                    <textarea
                                        value={formData.agenda}
                                        onChange={(e) => setFormData({ ...formData, agenda: e.target.value })}
                                        rows="3"
                                        placeholder="Enter meeting agenda"
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all duration-200 hover:border-gray-400"
                                    />
                                </div>
                            </div>

                            {/* Notification Settings */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold text-gray-900">Notification Settings</h3>
                                
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-3">
                                            <div className="flex items-center">
                                                <input
                                                    type="checkbox"
                                                    id="sendNotifications"
                                                    checked={formData.sendNotifications}
                                                    onChange={(e) => setFormData({ ...formData, sendNotifications: e.target.checked })}
                                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                                />
                                                <label htmlFor="sendNotifications" className="ml-2 text-sm font-medium text-gray-900">
                                                    Send WhatsApp notifications to participants
                                                </label>
                                            </div>
                                        </div>
                                        <div className="text-sm text-blue-600">
                                            {formData.sendNotifications ? 'Enabled' : 'Disabled'}
                                        </div>
                                    </div>
                                    <p className="text-xs text-blue-600 mt-2">
                                        When enabled, participants will receive WhatsApp messages about this meeting. 
                                        You can disable this if you prefer to notify participants through other means.
                                    </p>
                                </div>
                            </div>

                            {/* Participants */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold text-gray-900">Participants *</h3>

                {/* Tag Selection Toggle */}
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={() => setShowTagSelection(!showTagSelection)}
                        className={`px-4 py-2 rounded-lg border transition-all duration-200 flex items-center gap-2 ${
                            showTagSelection 
                                ? 'text-white border-[#080325] hover:bg-[#0a0a2a]' 
                                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                        }`}
                        style={{
                            backgroundColor: showTagSelection ? '#080325' : undefined
                        }}
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                        <span className="text-sm font-medium">
                            {showTagSelection ? 'Hide Tag Selection' : 'Show Tag Selection'}
                        </span>
                    </button>
                    <span className="text-sm text-gray-600">
                        Selected: {formData.participants.length} participant(s)
                    </span>
                </div>

                {/* Tag-based Selection */}
                {showTagSelection && (
                    <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
                        <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                            </svg>
                            Available Tags
                        </h4>
                        
                        {tags.length === 0 ? (
                            <div className="text-center py-4">
                                <p className="text-sm text-gray-500">No tags available</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {tags.map((tag) => {
                                    const isSelected = isTagSelected(tag._id);
                                    
                                    return (
                                        <label 
                                            key={tag._id} 
                                            className={`flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer ${
                                                isSelected 
                                                    ? 'bg-[#080325] text-white border-[#080325] hover:bg-[#0a0a2a]' 
                                                    : 'bg-white border-gray-200 hover:bg-gray-50'
                                            }`}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={isSelected}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        handleTagSelection(tag._id);
                                                    } else {
                                                        handleRemoveTagSelection(tag._id);
                                                    }
                                                }}
                                                className="rounded border-gray-300 text-[#080325] focus:ring-[#080325] w-4 h-4"
                                            />
                                            <div className="flex-1 min-w-0">
                                                <span className="text-sm font-medium block truncate">
                                                    {tag.tagName || tag.name || 'Unknown Tag'}
                                                </span>
                                            </div>
                                        </label>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {/* Individual Participant Selection */}
                <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                        </svg>
                        Individual Selection
                    </h4>
                    <div className="max-h-48 overflow-y-auto">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {participants.map((participant) => {
                                const isCreator = user && participant._id === user._id;
                                const isSelected = formData.participants.includes(participant._id);
                                
                                return (
                                    <label 
                                        key={participant._id} 
                                        className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                                            isCreator 
                                                ? 'bg-blue-50 border-blue-200 cursor-not-allowed' 
                                                : 'hover:bg-white border-transparent hover:border-gray-200 cursor-pointer'
                                        }`}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={isSelected}
                                            disabled={isCreator}
                                            onChange={(e) => {
                                                if (!isCreator) {
                                                    if (e.target.checked) {
                                                        setFormData({
                                                            ...formData,
                                                            participants: [...formData.participants, participant._id]
                                                        });
                                                    } else {
                                                        setFormData({
                                                            ...formData,
                                                            participants: formData.participants.filter(id => id !== participant._id)
                                                        });
                                                    }
                                                }
                                            }}
                                            className={`rounded border-gray-300 text-gray-900 focus:ring-gray-900 w-4 h-4 ${
                                                isCreator ? 'opacity-50 cursor-not-allowed' : ''
                                            }`}
                                        />
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-medium text-gray-900 block truncate">
                                                    {participant.name}
                                                </span>
                                                {isCreator && (
                                                    <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                                                        Creator
                                                    </span>
                                                )}
                                            </div>
                                            <span className="text-xs text-gray-500 capitalize">
                                                {participant.role?.name || 'No Role'}
                                            </span>
                                            {isCreator && (
                                                <div className="text-xs text-blue-600 mt-1">
                                                    
                                                </div>
                                            )}
                                        </div>
                                    </label>
                                );
                            })}
                        </div>
                    </div>
                </div>
                            </div>

                             {/* Action Buttons */}
                             <div className="flex gap-4 pt-6 border-t border-gray-200">
                                 <button
                                     type="submit"
                                     disabled={isSubmitting}
                                     className="flex-1 bg-gradient-to-r from-gray-900 to-gray-800 text-white px-6 py-3 rounded-lg hover:from-gray-800 hover:to-gray-700 transition-all duration-200 shadow-lg hover:shadow-xl font-semibold text-base disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                 >
                                     {isSubmitting ? (
                                         <>
                                             <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                             <span>{isEditing ? 'Updating Meeting...' : 'Creating Meeting...'}</span>
                                         </>
                                     ) : (
                                         isEditing ? 'Update Meeting' : 'Create Meeting'
                                     )}
                                 </button>
                                 <button
                                     type="button"
                                     onClick={() => navigate('/leaders/meetings')}
                                     disabled={isSubmitting}
                                     className="flex-1 bg-gray-100 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-200 transition-all duration-200 border border-gray-300 font-medium text-base disabled:opacity-50 disabled:cursor-not-allowed"
                                 >
                                     Cancel
                                 </button>
                             </div>
                        </form>
                    </div>
                </div>
            </main>

            {/* Success Modal */}
            {showSuccessModal && (
                <div className="fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl border border-gray-200/50 transform transition-all duration-300 scale-100">
                        <div className="text-center">
                            {/* Success Icon */}
                            <div className="mx-auto flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-6">
                                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            
                            {/* Success Message */}
                            <h3 className="text-2xl font-bold text-gray-900 mb-3">
                                {isEditing ? 'Meeting Updated!' : 'Meeting Created!'}
                            </h3>
                            <p className="text-gray-600 mb-6">
                                {isEditing 
                                    ? 'Your meeting has been successfully updated and participants have been notified.' 
                                    : 'Your meeting has been successfully created and participants have been notified.'
                                }
                            </p>
                            
                            {/* Progress Bar */}
                            <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
                                <div className="bg-green-500 h-2 rounded-full transition-all duration-2000 ease-linear" style={{ width: '100%' }}></div>
                            </div>
                            
                            <p className="text-sm text-gray-500">Redirecting to meetings page...</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Custom Alert Modal */}
            {showAlertModal && (
                <div className="fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center z-50">
                    <div className="bg-white/95 backdrop-blur-md rounded-xl w-full max-w-md mx-4 shadow-2xl border border-gray-200/50 transform transition-all duration-300 scale-100">
                        {/* Header with Project Theme */}
                        <div className="bg-[#080325] text-white px-6 py-4 rounded-t-xl">
                            <div className="flex justify-between items-center">
                                <h2 className="text-xl font-bold text-white">Alert</h2>
                                <button
                                    onClick={() => setShowAlertModal(false)}
                                    className="text-white/80 hover:text-white p-1.5 hover:bg-white/10 rounded-full transition-colors"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        {/* Content Area */}
                        <div className="p-6">
                            <div className="text-center">
                                {/* Warning Icon */}
                                <div className="mx-auto flex items-center justify-center w-12 h-12 bg-red-100 rounded-full mb-4">
                                    <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                    </svg>
                                </div>
                                
                                {/* Alert Message */}
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                    Error
                                </h3>
                                <p className="text-sm text-gray-600 mb-6">
                                    {alertMessage}
                                </p>
                                
                                {/* Action Button */}
                                <button
                                    onClick={() => setShowAlertModal(false)}
                                    className="w-full bg-[#080325] text-white px-4 py-2 rounded-lg hover:bg-[#0a0a2a] transition-all duration-200 font-medium"
                                >
                                    OK
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CreateMeeting;
