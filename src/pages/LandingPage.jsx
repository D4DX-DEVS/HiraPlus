import React from 'react';
import { Link } from 'react-router-dom';
import HiraPlus from '../assets/HiraPlus.jpg';

const LandingPage = () => {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <img src={HiraPlus} alt="Hira Plus Logo" className="h-12 w-auto" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Hira Plus</h1>
                <p className="text-sm text-gray-600">Admin Panel</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button className="px-4 py-2 text-gray-600 hover:text-gray-900 font-medium rounded-md">
                About Us
              </button>
              <button className="px-4 py-2 text-gray-600 hover:text-gray-900 font-medium rounded-md">
                Contact
              </button>
              <Link
                to="/admin/login"
                className="px-6 py-2.5 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700 transition-colors duration-200 shadow-sm"
              >
                Login
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Welcome to Hira Plus Management System
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              A comprehensive solution for managing guest meals, meetings, and administrative tasks efficiently.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Meal Management</h3>
              <p className="text-gray-600">
                Streamline meal planning and guest meal tracking with our intuitive management system.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Meeting Coordination</h3>
              <p className="text-gray-600">
                Efficiently organize and manage meetings, including venue bookings and catering arrangements.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Administrative Tools</h3>
              <p className="text-gray-600">
                Comprehensive tools for user management, notifications, and system administration.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-gray-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">About Hira Plus</h3>
              <p className="text-sm text-gray-400">
                Hira Plus is a comprehensive management system designed to streamline administrative tasks and enhance operational efficiency.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Contact Info</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>Email: info@hiraplus.com</li>
                <li>Phone: +1 (123) 456-7890</li>
                <li>Address: 123 Admin Street, City, Country</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-700 mt-8 pt-8 text-sm text-gray-400 text-center">
            <p>&copy; {new Date().getFullYear()} Hira Plus. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage; 