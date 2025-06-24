import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import HiraPlus from '../assets/HiraPlus.jpg';

const AboutUs = () => {
  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  return (
    <div className="min-h-screen flex flex-col relative bg-gradient-to-br from-emerald-800 via-emerald-700 to-teal-800">
      {/* Content Container */}
      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Header */}
        <header className="bg-white/10 backdrop-blur-sm border-b border-emerald-700/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <Link to="/" className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-lg">
                  <img src={HiraPlus} alt="Hira Plus" className="w-8 h-8 object-contain" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">Hira Plus</h1>
                  <p className="text-xs text-emerald-200">Management System</p>
                </div>
              </Link>
              <Link
                to="/"
                className="px-6 py-2.5 bg-white/20 backdrop-blur-sm text-white font-medium rounded-lg hover:bg-white/30 transition-all duration-200 border border-white/20"
              >
                ← Back to Home
              </Link>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-grow">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            {/* Hero Section */}
            <div className="text-center mb-16">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl mb-6 shadow-2xl">
                <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center shadow-lg">
                  <img src={HiraPlus} alt="Hira Plus" className="w-10 h-10 object-contain" />
                </div>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 drop-shadow-lg">
                About <span className="text-emerald-300">Hira Plus</span>
              </h1>
              <div className="w-24 h-1 bg-emerald-400 mx-auto rounded-full mb-8"></div>
            </div>

            {/* Content Sections */}
            <div className="space-y-12">
              {/* Main About Section */}
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 md:p-12 shadow-xl border border-white/20">
                <div className="max-w-4xl mx-auto">
                  <div className="flex items-center mb-6">
                    <div className="w-8 h-8 bg-emerald-400 rounded-lg flex items-center justify-center mr-4">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h2 className="text-2xl md:text-3xl font-semibold text-white">About Us</h2>
                  </div>
                  <p className="text-lg text-emerald-100 leading-relaxed">
                    Hira Plus is a cutting-edge digital platform developed by{' '}
                    <a 
                      href="https://d4dx.co/" 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-emerald-300 hover:text-white transition-colors font-medium underline"
                    >
                      D4DX Innovations LLP
                    </a>
                    , designed to provide seamless solutions in management and operational domains. Our mission is to empower users with innovative technology that simplifies complex processes and enhances productivity.
                  </p>
                </div>
              </div>

              {/* Vision and Commitment Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Vision Section */}
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-white/20 hover:bg-white/15 transition-all duration-300">
                  <div className="flex items-center mb-6">
                    <div className="w-8 h-8 bg-emerald-400 rounded-lg flex items-center justify-center mr-4">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </div>
                    <h3 className="text-xl md:text-2xl font-semibold text-white">Our Vision</h3>
                  </div>
                  <p className="text-emerald-100 leading-relaxed">
                    To be a leading platform that transforms the way users interact with digital services by offering intuitive, reliable, and efficient solutions tailored to their needs.
                  </p>
                </div>

                {/* Commitment Section */}
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-white/20 hover:bg-white/15 transition-all duration-300">
                  <div className="flex items-center mb-6">
                    <div className="w-8 h-8 bg-emerald-400 rounded-lg flex items-center justify-center mr-4">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                    </div>
                    <h3 className="text-xl md:text-2xl font-semibold text-white">Our Commitment</h3>
                  </div>
                  <p className="text-emerald-100 leading-relaxed">
                    At Hira Plus, we are committed to delivering value through technology by focusing on quality, accessibility, and customer satisfaction. We strive to create a platform that not only meets but exceeds user expectations.
                  </p>
                </div>
              </div>

              {/* Key Features */}
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 md:p-12 shadow-xl border border-white/20">
                <div className="max-w-4xl mx-auto">
                  <div className="flex items-center mb-8">
                    <div className="w-8 h-8 bg-emerald-400 rounded-lg flex items-center justify-center mr-4">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h3 className="text-2xl md:text-3xl font-semibold text-white">Why Choose Hira Plus?</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-emerald-400 rounded-full mt-2 flex-shrink-0"></div>
                      <div>
                        <h4 className="text-lg font-medium text-white mb-1">Innovative Technology</h4>
                        <p className="text-emerald-200 text-sm">Cutting-edge solutions powered by modern technology stack</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-emerald-400 rounded-full mt-2 flex-shrink-0"></div>
                      <div>
                        <h4 className="text-lg font-medium text-white mb-1">User-Centric Design</h4>
                        <p className="text-emerald-200 text-sm">Intuitive interfaces designed with user experience in mind</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-emerald-400 rounded-full mt-2 flex-shrink-0"></div>
                      <div>
                        <h4 className="text-lg font-medium text-white mb-1">Reliable Performance</h4>
                        <p className="text-emerald-200 text-sm">Robust and scalable platform ensuring consistent performance</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-emerald-400 rounded-full mt-2 flex-shrink-0"></div>
                      <div>
                        <h4 className="text-lg font-medium text-white mb-1">Continuous Innovation</h4>
                        <p className="text-emerald-200 text-sm">Regular updates and improvements based on user feedback</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* CTA Section */}
              <div className="text-center">
                <div className="bg-gradient-to-r from-emerald-500/20 to-teal-500/20 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-white/20">
                  <h3 className="text-2xl font-semibold text-white mb-4">Ready to Get Started?</h3>
                  <p className="text-emerald-100 mb-6 max-w-2xl mx-auto">
                    Experience the power of Hira Plus and transform your operational efficiency today.
                  </p>
                  <Link
                    to="/admin/login"
                    className="inline-flex items-center px-8 py-3 bg-white text-emerald-800 font-semibold rounded-xl hover:bg-emerald-50 transition-all duration-200 shadow-xl hover:shadow-2xl transform hover:-translate-y-1"
                  >
                    Access Platform
                    <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="bg-emerald-900/90 backdrop-blur-sm text-emerald-100 border-t border-emerald-700/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center">
              <div className="flex items-center justify-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-lg">
                  <img src={HiraPlus} alt="Hira Plus" className="w-6 h-6 object-contain" />
                </div>
                <span className="text-lg font-semibold text-white">Hira Plus</span>
              </div>
              <p className="text-sm text-emerald-200 mb-4">
                Powered by{' '}
                <a 
                  href="https://d4dx.co/" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-emerald-300 hover:text-white transition-colors duration-200 font-medium"
                >
                  D4DX Innovations LLP
                </a>
              </p>
              <p className="text-xs text-emerald-300">
                &copy; {new Date().getFullYear()} Hira Plus. All rights reserved.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default AboutUs; 