import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { UserIcon, LockClosedIcon, BuildingOffice2Icon } from '@heroicons/react/24/outline';

interface LoginProps {
  onLogin: (user: any) => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Get hospital info and users from localStorage
  const hospitalInfo = JSON.parse(localStorage.getItem('hospitalInfo') || '{}');
  const hospitalUsers = JSON.parse(localStorage.getItem('hospitalUsers') || '[]');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Find user with matching credentials
    const user = hospitalUsers.find((u: any) => 
      u.username === credentials.username && u.password === credentials.password
    );

    if (user) {
      // Get license config for department
      const licenseConfig = JSON.parse(localStorage.getItem('licenseConfig') || '{}');
      
      // Create user object with department info
      const loggedInUser = {
        id: user.id,
        name: user.name,
        role: user.role,
        department: licenseConfig.department || hospitalInfo.specialty
      };
      
      onLogin(loggedInUser);
    } else {
      setError('Invalid username or password');
    }
    
    setLoading(false);
  };

  const resetSetup = () => {
    if (confirm('This will clear all setup data and restart the onboarding process. Are you sure?')) {
      localStorage.removeItem('setupComplete');
      localStorage.removeItem('hospitalInfo');
      localStorage.removeItem('hospitalUsers');
      localStorage.removeItem('licenseConfig');
      localStorage.removeItem('groqApiKey');
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-medical-blue to-medical-teal flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        {/* Hospital Info Header */}
        <div className="text-center mb-8">
          <div className="bg-medical-blue bg-opacity-10 rounded-full p-3 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <BuildingOffice2Icon className="h-8 w-8 text-medical-blue" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {hospitalInfo.name || 'Medical Center'}
          </h1>
          <p className="text-gray-600">
            {hospitalInfo.specialty} • {hospitalInfo.location}
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <UserIcon className="h-4 w-4 inline mr-1" />
              Username
            </label>
            <input
              type="text"
              value={credentials.username}
              onChange={(e) => setCredentials(prev => ({ ...prev, username: e.target.value }))}
              className="input input-bordered w-full"
              placeholder="Enter your username"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <LockClosedIcon className="h-4 w-4 inline mr-1" />
              Password
            </label>
            <input
              type="password"
              value={credentials.password}
              onChange={(e) => setCredentials(prev => ({ ...prev, password: e.target.value }))}
              className="input input-bordered w-full"
              placeholder="Enter your password"
              required
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary w-full"
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        {/* Available Users Info */}
        {hospitalUsers.length > 0 && (
          <div className="mt-8 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Available Users:</h4>
            <div className="space-y-1">
              {hospitalUsers.map((user: any) => (
                <div key={user.id} className="text-sm text-gray-600">
                  <span className="font-medium">{user.name}</span>
                  <span className="ml-2">({user.role})</span>
                  <span className="ml-2 text-gray-500">@{user.username}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Reset Setup */}
        <div className="mt-6 text-center">
          <button
            onClick={resetSetup}
            className="text-sm text-gray-500 hover:text-gray-700 underline"
          >
            Reset Setup
          </button>
        </div>
      </div>
    </div>
  );
}