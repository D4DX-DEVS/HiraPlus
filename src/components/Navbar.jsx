import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRightOnRectangleIcon, Bars3Icon } from '@heroicons/react/24/outline';
import ConfirmDialog from './ConfirmDialog';

const Navbar = ({ onToggleSidebar }) => {
  const navigate = useNavigate();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogoutClick = () => {
    setShowLogoutConfirm(true);
  };

  const handleLogoutConfirm = () => {
    localStorage.removeItem('adminToken');
    setShowLogoutConfirm(false);
    navigate('/admin/login');
  };

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 h-[60px]">
        <div className="h-full px-6">
          <div className="flex items-center justify-between h-full">
            {/* Left section with menu button */}
            <div className="flex items-center">
              <button
                onClick={onToggleSidebar}
                className="p-2 rounded-md text-gray-500 hover:text-gray-700 focus:outline-none"
              >
                <Bars3Icon className="h-6 w-6" />
              </button>
            </div>

            {/* Center section with title */}
            <div className="flex-1 flex justify-center">
              <h1 className="text-xl font-semibold text-gray-800">Mess Management</h1>
            </div>

            {/* Right section with logout button */}
            <div className="flex items-center">
              <button
                onClick={handleLogoutClick}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 focus:outline-none transition-colors"
              >
                <ArrowRightOnRectangleIcon className="h-5 w-5 mr-2" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <ConfirmDialog
        isOpen={showLogoutConfirm}
        title="Confirm Logout"
        message="Are you sure you want to log out?"
        onConfirm={handleLogoutConfirm}
        onCancel={() => setShowLogoutConfirm(false)}
      />
    </>
  );
};

export default Navbar; 