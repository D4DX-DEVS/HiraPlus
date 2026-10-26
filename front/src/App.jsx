import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import AdminDepartments from './pages/AdminDepartments';
import AdminVehicles from './pages/AdminVehicles';
import AdminTravels from './pages/AdminTravels';
import AdminDrivers from './pages/AdminDrivers';
import AdminMeals from './pages/AdminMeals';
import AdminMenus from './pages/AdminMenus';
import AdminNotifications from './pages/AdminNotifications';
import AdminMessages from './pages/AdminMessages';
import AdminBanners from './pages/AdminBanners';
import AdminTags from './pages/AdminTags';
import AdminRoles from './pages/AdminRoles';
import BillGenerator from './pages/BillGenerator';
import GuestMeals from './pages/GuestMeals';
import Meetings from './pages/Meetings';
import LandingPage from './pages/LandingPage';
import AboutUs from './pages/AboutUs';

// Leaders Pages
import LeadersLogin from './pages/leaders/Login';
import LeadersProfile from './pages/leaders/Profile';
import LeadersMeetings from './pages/leaders/Meetings';
import LeadersCreateMeeting from './pages/leaders/CreateMeeting';
import LeadersSchedules from './pages/leaders/Schedules';
import LeadersConflicts from './pages/leaders/Conflicts';

// Protected Route component for Admin
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('adminToken');
  if (!token) {
    return <Navigate to="/admin/login" replace />;
  }
  return children;
};

// Protected Route component for Leaders
const LeadersProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('leaderToken');
  if (!token) {
    return <Navigate to="/leaders/login" replace />;
  }
  return children;
};

function App() {
  return (
    <Router>
      <Routes>
        {/* Landing page as root */}
        <Route path="/" element={<LandingPage />} />
        
        {/* About Us page */}
        <Route path="/about-us" element={<AboutUs />} />
        
        {/* Admin routes */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/departments"
          element={
            <ProtectedRoute>
              <AdminDepartments />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/vehicles"
          element={
            <ProtectedRoute>
              <AdminVehicles />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/travels"
          element={
            <ProtectedRoute>
              <AdminTravels />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/drivers"
          element={
            <ProtectedRoute>
              <AdminDrivers />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/meals"
          element={
            <ProtectedRoute>
              <AdminMeals />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/menus"
          element={
            <ProtectedRoute>
              <AdminMenus />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/notifications"
          element={
            <ProtectedRoute>
              <AdminNotifications />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/messages"
          element={
            <ProtectedRoute>
              <AdminMessages />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/banner"
          element={
            <ProtectedRoute>
              <AdminBanners />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/tags"
          element={
            <ProtectedRoute>
              <AdminTags />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/roles"
          element={
            <ProtectedRoute>
              <AdminRoles />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/bill-generator"
          element={
            <ProtectedRoute>
              <BillGenerator />
            </ProtectedRoute>
          }
        />
        <Route
          path='/admin/guest-meals'
          element={
            <ProtectedRoute>
              <GuestMeals />
            </ProtectedRoute>
          }
        />
        <Route
          path='/admin/meetings'
          element={
            <ProtectedRoute>
              <Meetings />
            </ProtectedRoute>
          }
        />
        
        {/* Leaders routes */}
        <Route path="/leaders/login" element={<LeadersLogin />} />
        <Route
          path="/leaders/profile"
          element={
            <LeadersProtectedRoute>
              <LeadersProfile />
            </LeadersProtectedRoute>
          }
        />
        <Route
          path="/leaders/meetings"
          element={
            <LeadersProtectedRoute>
              <LeadersMeetings />
            </LeadersProtectedRoute>
          }
        />
        <Route
          path="/leaders/meetings/create"
          element={
            <LeadersProtectedRoute>
              <LeadersCreateMeeting />
            </LeadersProtectedRoute>
          }
        />
        <Route
          path="/leaders/meetings/edit/:id"
          element={
            <LeadersProtectedRoute>
              <LeadersCreateMeeting />
            </LeadersProtectedRoute>
          }
        />
        <Route
          path="/leaders/schedules"
          element={
            <LeadersProtectedRoute>
              <LeadersSchedules />
            </LeadersProtectedRoute>
          }
        />
        <Route
          path="/leaders/conflicts"
          element={
            <LeadersProtectedRoute>
              <LeadersConflicts />
            </LeadersProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
