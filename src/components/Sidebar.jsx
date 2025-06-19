import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  UsersIcon,
  CalendarIcon,
  BellIcon,
  ChatBubbleLeftRightIcon,
  PhotoIcon,
  CalculatorIcon,
  UserGroupIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import HiraPlusIcon from '../assets/HiraPlus.jpg';

const Sidebar = ({ isOpen }) => {
  const navigation = [
    { name: 'Users', href: '/admin/dashboard', icon: UsersIcon },
    { name: 'Meetings', href: '/admin/meetings', icon: ClockIcon },
    { name: 'Meals', href: '/admin/meals', icon: CalendarIcon },
    { name: 'Guest Meals', href: '/admin/guest-meals', icon: UserGroupIcon },
    { name: 'Notifications', href: '/admin/notifications', icon: BellIcon },
    { name: 'Messages', href: '/admin/messages', icon: ChatBubbleLeftRightIcon },
    { name: 'Banners', href: '/admin/banner', icon: PhotoIcon },
    { name: 'Bill Generator', href: '/admin/bill-generator', icon: CalculatorIcon }
  ];

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={() => {}} // This will be handled by parent component
        />
      )}
      
      <div 
        className={`fixed left-0 top-0 h-screen bg-green-950 transition-all duration-300 ease-in-out z-30 ${
          isOpen ? 'w-64' : 'w-0 lg:w-20'
      } overflow-hidden`}
    >
        <div className="h-full overflow-y-auto scrollbar-thin scrollbar-thumb-green-700 scrollbar-track-green-900">
          {/* Header Section */}
          <div className={`px-4 py-6 border-b border-green-800/40 ${isOpen ? 'block' : 'hidden lg:block'}`}>
            <div className="flex items-center space-x-3">
              {/* App Icon */}
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg overflow-hidden bg-white/5 backdrop-blur-sm border border-green-700/30">
                  <img 
                    src={HiraPlusIcon} 
                    alt="Hira Plus" 
                    className="w-10 h-10 rounded-lg object-cover"
                  />
                </div>
              </div>
              
              {/* App Title */}
              {isOpen && (
                <div className="flex-1 min-w-0">
                  <h1 className="text-xl font-bold text-white truncate">
                    Hira Plus
                  </h1>
                  <p className="text-sm text-green-300/80 truncate">
                    Admin Dashboard
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Navigation Section */}
          <nav className="flex-1 px-3 py-6 space-y-2">
          {navigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) =>
                  `group flex items-center px-3 py-3 text-sm font-medium rounded-xl transition-all duration-200 transform hover:scale-[1.02] ${
                  isActive
                      ? 'bg-green-800/60 text-white shadow-lg border border-green-600/40 backdrop-blur-sm'
                      : 'text-green-200/90 hover:bg-green-900/60 hover:text-white hover:shadow-md hover:backdrop-blur-sm'
                }`
              }
                title={!isOpen ? item.name : ''}
            >
              {({ isActive }) => (
                <>
                  <div className={`flex items-center justify-center flex-shrink-0 ${isOpen ? 'w-6 h-6 mr-3' : 'w-6 h-6 mx-auto'}`}>
                    <item.icon
                      className="w-5 h-5 transition-colors"
                      aria-hidden="true"
                    />
                  </div>
                  
                  {isOpen && (
                    <span className="truncate">
                      {item.name}
                    </span>
                  )}
                  
                  {/* Active indicator */}
                  {isOpen && isActive && (
                    <div className="ml-auto w-2 h-2 bg-green-300 rounded-full shadow-sm" />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

          {/* Footer Section */}
          {isOpen && (
            <div className="px-4 py-4 border-t border-green-800/40 bg-green-950/40 backdrop-blur-sm">
              <div className="text-center">
                <p className="text-xs text-green-400/80">
                  © 2024 Hira Plus
                </p>
                <p className="text-xs text-green-500/60 mt-1">
                  v1.0.0
                </p>
              </div>
            </div>
          )}

          {/* Collapsed state icon with better spacing */}
          {!isOpen && (
            <div className="hidden lg:block absolute bottom-6 left-0 right-0">
              <div className="flex justify-center px-2">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg overflow-hidden bg-white/5 backdrop-blur-sm border border-green-700/30">
                  <img 
                    src={HiraPlusIcon} 
                    alt="Hira Plus" 
                    className="w-8 h-8 rounded-lg object-cover"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Sidebar; 