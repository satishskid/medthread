import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { PlusIcon, UserIcon, ClockIcon } from '@heroicons/react/24/outline';

export const PatientDashboard: React.FC = () => {
  const { patients, activePatientId, setActivePatient, addPatient } = useStore();
  const [showAddForm, setShowAddForm] = useState(false);
  const [newPatientName, setNewPatientName] = useState('');

  const patientList = Object.values(patients);

  const handleAddPatient = () => {
    if (!newPatientName.trim()) return;

    const threadId = `thread_${Date.now()}`;
    const newPatient = {
      threadId,
      name: newPatientName.trim(),
      demographics: {},
      messages: [],
      tasks: [],
      fhirResources: [],
      status: 'active' as const
    };

    addPatient(newPatient);
    setNewPatientName('');
    setShowAddForm(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'discharged':
        return 'bg-blue-100 text-blue-800';
      case 'archived':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="w-80 bg-white border-r border-gray-200 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Patients</h2>
          <button
            onClick={() => setShowAddForm(true)}
            className="btn btn-primary btn-sm"
          >
            <PlusIcon className="h-4 w-4" />
            Add
          </button>
        </div>

        {/* Add Patient Form */}
        {showAddForm && (
          <div className="space-y-2">
            <input
              type="text"
              placeholder="Patient name"
              value={newPatientName}
              onChange={(e) => setNewPatientName(e.target.value)}
              className="input input-bordered input-sm w-full"
              onKeyPress={(e) => e.key === 'Enter' && handleAddPatient()}
              autoFocus
            />
            <div className="flex space-x-2">
              <button
                onClick={handleAddPatient}
                className="btn btn-primary btn-xs flex-1"
                disabled={!newPatientName.trim()}
              >
                Add
              </button>
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setNewPatientName('');
                }}
                className="btn btn-ghost btn-xs flex-1"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Patient List */}
      <div className="flex-1 overflow-y-auto">
        {patientList.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            <UserIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No patients yet</p>
            <p className="text-xs">Add a patient to get started</p>
          </div>
        ) : (
          <div className="space-y-1 p-2">
            {patientList.map((patient) => {
              const isActive = activePatientId === patient.id;
              const messageCount = patient.messages?.length || 0;
              const taskCount = patient.tasks?.filter(t => t.status !== 'completed').length || 0;
              
              return (
                <div
                  key={patient.id}
                  onClick={() => setActivePatient(patient.id)}
                  className={`p-3 rounded-lg cursor-pointer transition-colors ${
                    isActive
                      ? 'bg-medical-blue text-white'
                      : 'hover:bg-gray-50 border border-gray-200'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <UserIcon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-gray-400'}`} />
                        <h3 className={`font-medium text-sm ${isActive ? 'text-white' : 'text-gray-900'}`}>
                          {patient.name}
                        </h3>
                      </div>
                      
                      <div className="mt-1 flex items-center space-x-2">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          isActive ? 'bg-white bg-opacity-20 text-white' : getStatusColor(patient.status)
                        }`}>
                          {patient.status}
                        </span>
                      </div>
                      
                      <div className={`mt-2 text-xs ${isActive ? 'text-white text-opacity-75' : 'text-gray-500'}`}>
                        <div className="flex items-center space-x-3">
                          <span>{messageCount} messages</span>
                          {taskCount > 0 && (
                            <span className="flex items-center space-x-1">
                              <ClockIcon className="h-3 w-3" />
                              <span>{taskCount} tasks</span>
                            </span>
                          )}
                        </div>
                        <div className="mt-1">
                          Created: {patient.createdAt ? new Date(patient.createdAt).toLocaleDateString() : 'Unknown'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="text-xs text-gray-500 text-center">
          {patientList.length} patient{patientList.length !== 1 ? 's' : ''} total
        </div>
      </div>
    </div>
  );
};