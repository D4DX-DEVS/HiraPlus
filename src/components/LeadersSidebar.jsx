import React from 'react';
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
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}

                    {/* Sidebar */}
              <div className={`
                fixed top-0 left-0 h-screen shadow-lg z-50 transition-all duration-300 ease-in-out
                ${isOpen ? 'w-64' : 'w-16'} 
                ${!isOpen && '-translate-x-full lg:translate-x-0'}
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
             onClick={onLogout}
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
    </>
  );
};

export default LeadersSidebar;
