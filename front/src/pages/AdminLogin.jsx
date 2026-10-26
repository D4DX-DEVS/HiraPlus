import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { LockClosedIcon, PhoneIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/solid';
import HiraPlus from '../assets/HiraPlus.jpg';
import BuildingBg from '../assets/build.jpg';

const AdminLogin = () => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/admin/login`, {
        phoneNumber,
        password
      });

      const { token } = response.data;
      localStorage.setItem('adminToken', token);
      navigate('/admin/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative">
      {/* Background Image with Overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url(${BuildingBg})`,
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-800/80 via-emerald-700/75 to-teal-800/80"></div>
      </div>

      {/* Content Container */}
      <div className="relative z-10 w-full max-w-md mx-auto px-4">
        <div className="bg-white/95 backdrop-blur-sm p-8 rounded-2xl shadow-2xl border border-emerald-100">
        {/* Logo and Title Section */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-emerald-50 rounded-2xl mb-6 shadow-lg">
              <img src={HiraPlus} alt="Hira Plus Logo" className="w-14 h-14 object-contain" />
          </div>
            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-emerald-800">Hira Plus</h1>
              <h2 className="text-xl font-semibold text-gray-800 mb-2">Admin Login</h2>
              <p className="text-emerald-600 text-sm">
                Sign in to access your management dashboard
            </p>
          </div>
        </div>

          <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
              <div className="rounded-xl bg-red-50 p-4 border border-red-200">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <div className="text-sm text-red-800 font-medium">{error}</div>
                </div>
              </div>
            </div>
          )}

            <div className="space-y-5">
            <div>
                <label htmlFor="phone-number" className="block text-sm font-semibold text-gray-700 mb-2">
                Phone Number
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <PhoneIcon className="h-5 w-5 text-emerald-500" aria-hidden="true" />
                </div>
                <input
                  id="phone-number"
                  name="phoneNumber"
                  type="tel"
                  required
                    className="appearance-none block w-full pl-12 pr-4 py-3.5 border border-gray-300 rounded-xl placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-base transition duration-200 ease-in-out bg-white/90"
                  placeholder="Enter your phone number"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                    disabled={isLoading}
                />
              </div>
            </div>

            <div>
                <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <LockClosedIcon className="h-5 w-5 text-emerald-500" aria-hidden="true" />
                </div>
                <input
                  id="password"
                  name="password"
                    type={showPassword ? "text" : "password"}
                  required
                    className="appearance-none block w-full pl-12 pr-12 py-3.5 border border-gray-300 rounded-xl placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-base transition duration-200 ease-in-out bg-white/90"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-4 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      <EyeSlashIcon className="h-5 w-5 text-gray-400 hover:text-emerald-500 transition-colors" />
                    ) : (
                      <EyeIcon className="h-5 w-5 text-gray-400 hover:text-emerald-500 transition-colors" />
                    )}
                  </button>
                </div>
            </div>
          </div>

            <div className="pt-2">
            <button
              type="submit"
                disabled={isLoading}
                className="group relative w-full flex justify-center py-3.5 px-4 border border-transparent text-base font-semibold rounded-xl text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition duration-200 ease-in-out shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Signing in...
                  </>
                ) : (
                  <>
              Sign in to Dashboard
                    <svg className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </>
                )}
            </button>
          </div>
        </form>

          {/* Additional Info */}
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              Secure admin access to Hira Plus Management System
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-sm text-emerald-100">
            &copy; {new Date().getFullYear()} Hira Plus. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin; 