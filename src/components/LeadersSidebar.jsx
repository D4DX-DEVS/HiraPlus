import React, { useState } from 'react';
import { 
  UserIcon, 
  CalendarIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import HiraPlus from '../assets/HiraPlus.jpg';
import D4DXLogoWhite from '../assets/dxLogoWhite.png';

const LeadersSidebar = ({ isOpen, onToggle, activePage, onPageChange, onLogout }) => {
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  
  const handleLogoutClick = () => {
    setShowLogoutModal(true);
  };

  const handleConfirmLogout = () => {
    setShowLogoutModal(false);
    onLogout();
  };

  const handleCancelLogout = () => {
    setShowLogoutModal(false);
  };

  const menuItems = [
    { id: 'profile', name: 'Profile', icon: UserIcon },
    { id: 'meetings', name: 'Meetings', icon: CalendarIcon },
    { id: 'schedules', name: 'Schedules', icon: ClockIcon },
    { id: 'conflicts', name: 'Conflicts', icon: ExclamationTriangleIcon },
  ];

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={onToggle}
        />
      )}

                    {/* Sidebar */}
              <div className={`
                fixed top-0 left-0 h-screen shadow-lg z-50 transition-all duration-300 ease-in-out
                ${isOpen ? 'w-64' : 'w-16'} 
                ${!isOpen ? '-translate-x-full md:translate-x-0' : 'translate-x-0'}
              `} style={{ backgroundColor: '#080325' }}>
                 {/* Header */}
         <div className="flex items-center justify-between p-4 border-b border-gray-600">
           {isOpen && (
             <h1 className="text-xl font-bold text-white">LEADERS PORTAL</h1>
           )}
                       <button
              onClick={onToggle}
              className="p-2 rounded-lg hover:bg-gray-700 transition-colors"
            >
              <div className="w-6 h-6 rounded overflow-hidden">
                <img 
                  src={HiraPlus} 
                  alt="HIRA+ Logo" 
                  className="w-full h-full object-cover"
                />
              </div>
            </button>
         </div>

        {/* Navigation Menu */}
        <nav className="p-4">
          <ul className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.id}>
                  <button
                    onClick={() => onPageChange(item.id)}
                    className={`
                      w-full flex items-center justify-center px-3 py-2 rounded-lg transition-all duration-200
                      ${isOpen ? 'justify-start' : 'justify-center'}
                      ${activePage === item.id 
                        ? 'text-white bg-[#191A38]' 
                        : 'text-gray-300 hover:bg-gray-700 hover:bg-opacity-70'
                      }
                    `}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    {isOpen && (
                      <span className="ml-3 font-medium">{item.name}</span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

                 {/* Logout Button */}
         <div className={`
           absolute bottom-16 transition-all duration-300
           ${isOpen ? 'left-4 right-4' : 'left-2 right-2'}
         `}>
           <button
             onClick={handleLogoutClick}
             className={`
               w-full flex items-center py-2 rounded-lg transition-all duration-200
               ${isOpen ? 'px-4' : 'px-2'} justify-center
               text-red-400 hover:bg-red-900 hover:bg-opacity-70
             `}
           >
             <ArrowRightOnRectangleIcon className="w-5 h-5 flex-shrink-0" />
             {isOpen && (
               <span className="ml-3 font-medium">Logout</span>
             )}
           </button>
         </div>

         {/* D4DX Logo and Powered By Text */}
         <div className={`
           absolute bottom-4 transition-all duration-300
           ${isOpen ? 'left-15 right-4' : 'left-2 right-2'}
         `}>
           <div className={`
             flex items-center transition-all duration-200
             ${isOpen ? 'justify-start space-x-2' : 'justify-center'}
           `}>
             <img 
               src={D4DXLogoWhite} 
               alt="D4DX Logo" 
               className="w-6 h-6 object-contain flex-shrink-0"
             />
             {isOpen && (
               <span className="text-[10px] text-gray-400 font-medium">POWERED BY D4DX</span>
             )}
           </div>
         </div>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4 shadow-lg border border-gray-200">
            <div className="text-center">
              {/* Warning Icon */}
              <div className="mx-auto flex items-center justify-center w-12 h-12 bg-red-100 rounded-full mb-4">
                <ArrowRightOnRectangleIcon className="w-6 h-6 text-red-600" />
              </div>
              
              {/* Confirmation Message */}
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Logout?
              </h3>
              <p className="text-sm text-gray-600 mb-6">
                Are you sure you want to logout?
              </p>
              
              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handleCancelLogout}
                  className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200 transition-colors text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmLogout}
                  className="flex-1 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors text-sm font-medium"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default LeadersSidebar;



