import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRightOnRectangleIcon, Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import ConfirmDialog from './ConfirmDialog';

const Navbar = ({ onToggleSidebar, isSidebarOpen }) => {
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
      <nav className={`fixed top-0 right-0 z-40 bg-white/80 backdrop-blur-sm h-[60px] transition-all duration-300 border-b border-gray-200/50 ${
        isSidebarOpen ? 'left-64' : 'left-0 lg:left-20'
      }`}>
        <div className="h-full px-4 lg:px-6">
          <div className="flex items-center justify-between h-full">
            {/* Left section with menu button */}
            <div className="flex items-center space-x-4">
              <button
                onClick={onToggleSidebar}
                className="p-2 rounded-lg text-gray-700 hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-200 transition-all duration-200"
                aria-label="Toggle sidebar"
              >
                {isSidebarOpen ? (
                  <XMarkIcon className="h-6 w-6" />
                ) : (
                  <Bars3Icon className="h-6 w-6" />
                )}
              </button>
            </div>

            {/* Center section - empty for now */}
            <div className="flex-1"></div>

            {/* Right section with user info and logout */}
            <div className="flex items-center space-x-4">
              {/* User menu */}
              <div className="flex items-center space-x-3">
                <div className="hidden md:block text-right">
                  <p className="text-sm font-medium text-gray-900">Admin</p>
                  <p className="text-xs text-gray-600">Administrator</p>
                </div>
                
                {/* User avatar and logout */}
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-green-600 to-green-800 rounded-full flex items-center justify-center text-white text-sm font-medium">
                    A
                  </div>
                  
                  <button
                    onClick={handleLogoutClick}
                    className="inline-flex items-center px-3 py-2 bg-white/80 backdrop-blur-sm border border-gray-200 text-sm font-medium rounded-lg text-gray-700 hover:bg-gray-50 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-200 shadow-sm"
                  >
                    <ArrowRightOnRectangleIcon className="h-4 w-4 lg:h-4 lg:w-4 lg:mr-2" />
                    <span className="hidden lg:inline">Logout</span>
                  </button>
                </div>
              </div>
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