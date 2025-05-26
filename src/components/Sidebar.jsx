import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  UsersIcon,
  CalendarIcon,
  BellIcon,
  ChatBubbleLeftRightIcon,
  PhotoIcon,
  CalculatorIcon
} from '@heroicons/react/24/outline';

const Sidebar = ({ isOpen }) => {
  const navigation = [
    { name: 'Users', href: '/admin/dashboard', icon: UsersIcon },
    { name: 'Meals', href: '/admin/meals', icon: CalendarIcon },
    { name: 'Notifications', href: '/admin/notifications', icon: BellIcon },
    { name: 'Messages', href: '/admin/messages', icon: ChatBubbleLeftRightIcon },
    { name: 'Banners', href: '/admin/banner', icon: PhotoIcon },
    { name: 'Bill Generator', href: '/admin/bill-generator', icon: CalculatorIcon }
  ];

  return (
    <div className={`${isOpen ? 'block' : 'hidden'} md:block bg-gray-800 h-[calc(100vh-60px)] top-[60px] fixed left-0`}>
      <div className="h-full overflow-y-auto">
        <nav className="flex-1 px-2 py-4 space-y-1">
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