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
    <div 
      className={`fixed left-0 top-[60px] h-[calc(100vh-60px)] bg-gray-800 transition-all duration-300 ease-in-out ${
        isOpen ? 'w-64' : 'w-0'
      } overflow-hidden`}
    >
      <div className="h-full overflow-y-auto">
        <nav className="flex-1 px-2 py-4 space-y-1 min-w-[256px]">
          {navigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) =>
                `group flex items-center px-4 py-3 text-base font-medium rounded-md transition-colors duration-200 ${
                  isActive
                    ? 'bg-gray-900 text-white'
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`
              }
            >
              <item.icon
                className="mr-3 flex-shrink-0 h-6 w-6"
                aria-hidden="true"
              />
              {item.name}
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  );
};

export default Sidebar; 