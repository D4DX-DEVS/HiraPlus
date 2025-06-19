import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import AdminDepartments from './pages/AdminDepartments';
import AdminMeals from './pages/AdminMeals';
import AdminNotifications from './pages/AdminNotifications';
import AdminMessages from './pages/AdminMessages';
import AdminBanners from './pages/AdminBanners';
import BillGenerator from './pages/BillGenerator';
import GuestMeals from './pages/GuestMeals';
import Meetings from './pages/Meetings';
import LandingPage from './pages/LandingPage';

// Protected Route component
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('adminToken');
  if (!token) {
    return <Navigate to="/admin/login" replace />;
  }
  return children;
};

function App() {
  return (
    <Router>
      <Routes>
        {/* Landing page as root */}
        <Route path="/" element={<LandingPage />} />
        
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
          path="/admin/meals"
          element={
            <ProtectedRoute>
              <AdminMeals />
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
      </Routes>
    </Router>
  );
}

export default App;
