import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import HiraPlus from '../../assets/HiraPlus.jpg';
import D4DXLogo from '../../assets/d4dx_logo.png';

const Login = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL_STAGING || 'http://localhost:5000/api/testing';

  const handlePhoneSubmit = async (e) => {
    e.preventDefault();
    if (!phoneNumber || phoneNumber.length < 10) {
      setError('Please enter a valid phone number');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await axios.post(`${API_BASE_URL}/leaders/request-otp`, {
        phoneNumber: phoneNumber
      });

      if (response.data.success) {
        setStep('otp');
        setError('');
      }
    } catch (error) {
      console.error('OTP request error:', error);
      setError(error.response?.data?.message || 'Failed to send OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    if (!otp || otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await axios.post(`${API_BASE_URL}/leaders/verify-otp`, {
        phoneNumber: phoneNumber,
        otp: otp
      });

      if (response.data.success) {
        localStorage.setItem('leaderToken', response.data.token);
        localStorage.setItem('leaderUser', JSON.stringify(response.data.user));
        navigate('/leaders/profile');
      }
    } catch (error) {
      console.error('OTP verification error:', error);
      setError(error.response?.data?.message || 'Invalid OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToPhone = () => {
    setStep('phone');
    setOtp('');
    setError('');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col p-4">
      {/* Main Content - Centered */}
      <div className="flex-1 flex items-center justify-center">
        <div className="w-full max-w-sm">
          {/* Logo and Header */}
          <div className="text-center mb-6">
            <div className="w-16 h-16 mx-auto mb-3 shadow-md rounded-xl overflow-hidden">
              <img 
                src={HiraPlus} 
                alt="HIRA+ Logo" 
                className="w-full h-full object-cover"
              />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Welcome Back</h1>
            <p className="text-sm text-gray-600">Sign in to your HIRA+ Leaders account</p>
          </div>

          {/* Login Card */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          {step === 'phone' ? (
            <form onSubmit={handlePhoneSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 text-sm">+91</span>
                  </div>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="Enter phone number"
                    className="w-full pl-12 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-200 text-sm"
                    maxLength="10"
                  />
                </div>

              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-black text-white py-2.5 px-4 rounded-lg font-medium text-sm hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Sending...
                  </div>
                ) : (
                  'Send OTP'
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleOtpSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Verification Code
                </label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="Enter 6-digit code"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-200 text-sm text-center tracking-widest"
                  maxLength="6"
                />

              </div>

              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={handleBackToPhone}
                  className="flex-1 bg-gray-100 text-gray-700 py-2.5 px-4 rounded-lg font-medium hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2 transition-all duration-200"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 bg-black text-white py-2.5 px-4 rounded-lg font-medium hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                                  {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Verifying...
                  </div>
                ) : (
                  'Verify & Login'
                )}
                </button>
              </div>
            </form>
          )}

          {/* Error Message */}
          {error && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center">
                <svg className="w-4 h-4 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span className="text-red-700 text-xs font-medium">{error}</span>
              </div>
            </div>
          )}
          </div>
        </div>
      </div>

      {/* Footer - Fixed at Bottom */}
      <div className="text-center py-6">
        <div className="flex flex-col items-center space-y-2">
          <img 
            src={D4DXLogo} 
            alt="D4DX Logo" 
            className="w-10 h-10 object-contain"
          />
          <p className="text-[10px] text-gray-500 font-medium">POWERED BY D4DX</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
