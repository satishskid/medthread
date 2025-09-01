import React, { useEffect, useState } from 'react';
import { useStore } from './store/useStore';
import { ChatWindow } from './components/ChatWindow';
import { PatientDashboard } from './components/PatientDashboard';
import { AIInfoPanel } from './components/AIInfoPanel';
import { RoleGuard } from './components/RoleGuard';
import { useLicenseConfig } from './hooks/useLicenseConfig';

function App() {
  const { currentUser, activePatientId } = useStore();
  const { config, isLoading } = useLicenseConfig();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="loading loading-spinner loading-lg text-primary"></div>
        <span className="ml-4 text-lg">Initializing MedThread AI...</span>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">License Configuration Required</h1>
          <p className="text-gray-600 mb-6">Please complete the onboarding process to configure your specialty.</p>
          <button 
            className="btn btn-primary"
            onClick={() => window.location.href = '/onboard'}
          >
            Start Onboarding
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-base-100">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-80' : 'w-16'} transition-all duration-300 bg-base-200 border-r border-base-300`}>
        <div className="p-4">
          <div className="flex items-center justify-between mb-6">
            <div className={`${sidebarOpen ? 'block' : 'hidden'}`}>
              <h1 className="text-xl font-bold text-primary">{config.aiName}</h1>
              <p className="text-sm text-base-content/70">{config.department}</p>
            </div>
            <button 
              className="btn btn-ghost btn-sm"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? '←' : '→'}
            </button>
          </div>
          
          {sidebarOpen && (
            <>
              <PatientDashboard />
              <AIInfoPanel />
            </>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {activePatientId ? (
          <RoleGuard allowedRoles={['doctor', 'nurse', 'specialist']}>
            <ChatWindow />
          </RoleGuard>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="text-6xl mb-4">🏥</div>
              <h2 className="text-2xl font-bold mb-2">Welcome to {config.aiName}</h2>
              <p className="text-base-content/70 mb-6">
                Select a patient from the sidebar or start a new consultation
              </p>
              <button className="btn btn-primary">
                New Patient Thread
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;