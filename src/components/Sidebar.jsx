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
  ClockIcon,
  BuildingOfficeIcon,
  BookOpenIcon
} from '@heroicons/react/24/outline';
import HiraPlusIcon from '../assets/HiraPlus.jpg';

const Sidebar = ({ isOpen }) => {
  const navigation = [
    { name: 'Users', href: '/admin/dashboard', icon: UsersIcon },
    { name: 'Departments', href: '/admin/departments', icon: BuildingOfficeIcon },
    { name: 'Meetings', href: '/admin/meetings', icon: ClockIcon },
    { name: 'Meals', href: '/admin/meals', icon: CalendarIcon },
    { name: 'Menu Management', href: '/admin/menus', icon: BookOpenIcon },
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
        className={`fixed left-0 top-0 h-screen bg-gradient-to-b from-green-950 to-green-900 transition-all duration-300 ease-in-out z-30 ${
          isOpen ? 'w-64' : 'w-0 lg:w-16'
      } overflow-hidden shadow-2xl`}
    >
        <div className="h-full flex flex-col">
          {/* Header Section */}
          <div className={`px-3 py-4 border-b border-green-800/30 ${isOpen ? 'block' : 'hidden lg:block'}`}>
            <div className="flex items-center space-x-2">
              {/* App Icon */}
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center shadow-lg overflow-hidden bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-green-700/40 hover:scale-105 transition-transform duration-200">
                  <img 
                    src={HiraPlusIcon} 
                    alt="Hira Plus" 
                    className="w-8 h-8 rounded-md object-cover"
                  />
                </div>
              </div>
              
              {/* App Title */}
              {isOpen && (
                <div className="flex-1 min-w-0">
                  <h1 className="text-lg font-bold text-white truncate">
                    Hira Plus
                  </h1>
                  <p className="text-xs text-green-300/70 truncate">
                    Admin Panel
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Navigation Section */}
          <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto scrollbar-thin scrollbar-thumb-green-700 scrollbar-track-green-900">
          {navigation.map((item, index) => (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) =>
                  `group relative flex items-center px-2 py-2.5 text-sm font-medium rounded-lg transition-all duration-300 transform hover:scale-[1.02] hover:translate-x-1 ${
                  isActive
                      ? 'bg-gradient-to-r from-green-600/80 to-green-700/60 text-white shadow-lg border border-green-500/50 backdrop-blur-sm'
                      : 'text-green-200/80 hover:bg-gradient-to-r hover:from-green-800/50 hover:to-green-900/40 hover:text-white hover:shadow-md hover:backdrop-blur-sm'
                }`
              }
                title={!isOpen ? item.name : ''}
                style={{
                  animationDelay: `${index * 50}ms`
                }}
            >
              {({ isActive }) => (
                <>
                  {/* Animated border for active state */}
                  {isActive && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-green-300 to-green-400 rounded-r-full shadow-sm" />
                  )}
                  
                  <div className={`flex items-center justify-center flex-shrink-0 ${isOpen ? 'w-5 h-5 mr-3' : 'w-5 h-5 mx-auto'}`}>
                    <item.icon
                      className={`w-4 h-4 transition-all duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}
                      aria-hidden="true"
                    />
                  </div>
                  
                  {isOpen && (
                    <span className="truncate font-medium">
                      {item.name}
                    </span>
                  )}
                  
                  {/* Subtle glow effect on hover */}
                  <div className={`absolute inset-0 rounded-lg bg-gradient-to-r from-green-400/0 to-green-300/0 group-hover:from-green-400/5 group-hover:to-green-300/5 transition-all duration-300 ${isActive ? 'from-green-300/10 to-green-400/10' : ''}`} />
                  
                  {/* Active indicator dot */}
                  {isOpen && isActive && (
                    <div className="ml-auto w-1.5 h-1.5 bg-green-300 rounded-full shadow-sm animate-pulse" />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

          {/* Footer Section - Always at bottom */}
          {isOpen && (
            <div className="mt-auto px-3 py-3 border-t border-green-800/30 bg-gradient-to-r from-green-950/60 to-green-900/40 backdrop-blur-sm">
              <div className="text-center">
                <p className="text-xs text-green-400/70 font-medium">
                  © 2025 Hira Plus
                </p>
                <p className="text-xs text-green-500/50 mt-0.5">
                  v1.0.0
                </p>
              </div>
            </div>
          )}

          {/* Collapsed state icon with better spacing */}
          {!isOpen && (
            <div className="hidden lg:block mt-auto mb-4 px-1">
              <div className="flex justify-center">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center shadow-lg overflow-hidden bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-green-700/40 hover:scale-110 transition-all duration-300 hover:shadow-xl">
                  <img 
                    src={HiraPlusIcon} 
                    alt="Hira Plus" 
                    className="w-7 h-7 rounded-md object-cover"
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