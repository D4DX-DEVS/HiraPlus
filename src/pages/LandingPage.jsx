import React from 'react';
import { Link } from 'react-router-dom';
import HiraPlus from '../assets/HiraPlus.jpg';
import BuildingBg from '../assets/build.jpg';

const LandingPage = () => {
  return (
    <div className="min-h-screen flex flex-col relative bg-gradient-to-br from-emerald-800 via-emerald-700 to-teal-800">
      {/* Building Background Image - Over Footer Area */}
      <div 
        className="absolute bottom-0 left-0 right-0 h-80 bg-cover bg-center bg-no-repeat opacity-30"
        style={{
          backgroundImage: `url(${BuildingBg})`,
        }}
      ></div>

      {/* Content Container */}
      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Main Content */}
        <main className="flex-grow flex items-center">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full">
            {/* Hero Section */}
            <div className="text-center mb-16">
              <div className="mb-8">
                <div className="inline-flex items-center justify-center w-24 h-24 bg-white/20 backdrop-blur-sm rounded-2xl mb-6 shadow-2xl">
                  <div className="w-16 h-16 bg-white rounded-xl flex items-center justify-center shadow-lg">
                    <img src={HiraPlus} alt="Hira Plus" className="w-12 h-12 object-contain" />
                  </div>
                </div>
              </div>
              <h2 className="text-5xl md:text-6xl font-bold text-white mb-6 drop-shadow-lg">
                Welcome to <span className="text-emerald-300">Hira Plus</span>
              </h2>
              <p className="text-xl md:text-2xl text-emerald-100 max-w-4xl mx-auto mb-8 drop-shadow">
              Hira Plus Management System is a powerful and intuitive digital platform designed to streamline and optimize your operations, offering a comprehensive suite of tools to enhance efficiency and productivity.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
                <Link
                  to="/admin/login"
                  className="inline-flex items-center px-8 py-4 bg-white text-emerald-800 font-semibold rounded-xl hover:bg-emerald-50 transition-all duration-200 shadow-2xl hover:shadow-3xl transform hover:-translate-y-1 text-lg"
                >
                  Admin Portal
                  <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Link>
                <Link
                  to="/leaders/login"
                  className="inline-flex items-center px-8 py-4 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 transition-all duration-200 shadow-2xl hover:shadow-3xl transform hover:-translate-y-1 text-lg"
                >
                  Leaders Portal
                  <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Link>
              </div>
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
              <div className="bg-white/10 backdrop-blur-sm p-8 rounded-2xl shadow-xl border border-white/20 hover:bg-white/15 transition-all duration-300 transform hover:-translate-y-2">
                <div className="w-12 h-12 bg-emerald-400 rounded-xl flex items-center justify-center mb-6 shadow-lg">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <h3 className="text-2xl font-semibold text-white mb-4">Meal Management</h3>
                <ul className="text-emerald-100 leading-relaxed space-y-2">
                  <li className="flex items-start">
                    <span className="text-emerald-300 mr-2">•</span>
                    Automates meal planning and production
                  </li>
                  <li className="flex items-start">
                    <span className="text-emerald-300 mr-2">•</span>
                    Reduces errors such as wrong meal planning and production
                  </li>
                  <li className="flex items-start">
                    <span className="text-emerald-300 mr-2">•</span>
                    Optimizes kitchen operations and minimizes food waste
                  </li>
                </ul>
              </div>
              
              <div className="bg-white/10 backdrop-blur-sm p-8 rounded-2xl shadow-xl border border-white/20 hover:bg-white/15 transition-all duration-300 transform hover:-translate-y-2">
                <div className="w-12 h-12 bg-emerald-400 rounded-xl flex items-center justify-center mb-6 shadow-lg">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-semibold text-white mb-4">Meeting Coordination</h3>
                <ul className="text-emerald-100 leading-relaxed space-y-2">
                  <li className="flex items-start">
                    <span className="text-emerald-300 mr-2">•</span>
                    Simplifies scheduling and managing meetings
                  </li>
                  <li className="flex items-start">
                    <span className="text-emerald-300 mr-2">•</span>
                    Automates appointment booking and sends reminders
                  </li>
                  <li className="flex items-start">
                    <span className="text-emerald-300 mr-2">•</span>
                    Prevents scheduling conflicts and updates in real-time
                  </li>
                  <li className="flex items-start">
                    <span className="text-emerald-300 mr-2">•</span>
                    Supports communication and collaboration among participants
                  </li>
                </ul>
              </div>
              
              <div className="bg-white/10 backdrop-blur-sm p-8 rounded-2xl shadow-xl border border-white/20 hover:bg-white/15 transition-all duration-300 transform hover:-translate-y-2">
                <div className="w-12 h-12 bg-emerald-400 rounded-xl flex items-center justify-center mb-6 shadow-lg">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-semibold text-white mb-4">Administrative Tools</h3>
                <ul className="text-emerald-100 leading-relaxed space-y-2">
                  <li className="flex items-start">
                    <span className="text-emerald-300 mr-2">•</span>
                    Includes software for system and user management
                  </li>
                  <li className="flex items-start">
                    <span className="text-emerald-300 mr-2">•</span>
                    Provides utilities for monitoring, troubleshooting, and security
                  </li>
                  <li className="flex items-start">
                    <span className="text-emerald-300 mr-2">•</span>
                    Enhances document management and task tracking
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="bg-emerald-900/90 backdrop-blur-sm text-emerald-100 border-t border-emerald-700/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div className="md:col-span-2">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-lg">
                    <img src={HiraPlus} alt="Hira Plus" className="w-8 h-8 object-contain" />
                  </div>
                  <h3 className="text-xl font-bold text-white">Hira Plus</h3>
                </div>
                <p className="text-sm text-emerald-200 leading-relaxed max-w-md">
                Hira Plus Management System is a powerful and intuitive digital platform designed to streamline and optimize your operations, offering a comprehensive suite of tools to enhance efficiency and productivity.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-4 text-white">Quick Links</h3>
                <ul className="space-y-3 text-sm text-emerald-200">
                  <li>
                    <Link to="/admin/login" className="hover:text-white transition-colors duration-200 flex items-center">
                      <span className="mr-2">→</span>
                      Admin Portal
                    </Link>
                  </li>
                  <li>
                    <Link to="/about-us" className="hover:text-white transition-colors duration-200 flex items-center">
                      <span className="mr-2">→</span>
                      About Us
                    </Link>
                  </li>
                  <li>
                    <a 
                      href="https://d4dx.co/contacts-us/" 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="hover:text-white transition-colors duration-200 flex items-center"
                    >
                      <span className="mr-2">→</span>
                      Contact Us
                    </a>
                  </li>
                  <li>
                    <a 
                      href="https://d4dx.co/privacy-policy/" 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="hover:text-white transition-colors duration-200 flex items-center"
                    >
                      <span className="mr-2">→</span>
                      Privacy Policy
                    </a>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-4 text-white">Support</h3>
                <ul className="space-y-3 text-sm text-emerald-200">
                  <li className="flex items-center">
                    <svg className="w-4 h-4 mr-2 text-emerald-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    mail@d4dx.co
                  </li>
                  <li className="flex items-center">
                    <svg className="w-4 h-4 mr-2 text-emerald-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                   +91 98958 04006
                  </li>
                  <li className="flex items-start">
                    <svg className="w-4 h-4 mr-2 mt-0.5 text-emerald-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="leading-relaxed">	
                      Atharwala Apartment, <br />
                      First Floor, 5/3520G, (44/1342) <br />
                      Mavoor Road, Thiruthiyad, <br />
                      Kozhikode, Kerala 673004</span>
                  </li>
                </ul>
              </div>
            </div>
            <div className="border-t border-emerald-700/50 mt-10 pt-8">
              <div className="flex flex-col md:flex-row justify-between items-center text-sm text-emerald-200">
                <p>&copy; {new Date().getFullYear()} Hira Plus. All rights reserved.</p>
                <p className="mt-2 md:mt-0">
                  Powered by{' '}
                  <a 
                    href="https://d4dx.co/" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-emerald-300 hover:text-white transition-colors duration-200 font-medium"
                  >
                    D4DX Innovations
                  </a>
                </p>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default LandingPage; 