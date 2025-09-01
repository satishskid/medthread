import React, { useState } from 'react';
import { getDefaultConfig, LicenseConfig } from '../hooks/useLicenseConfig';
import { useStore } from '../store/useStore';
import { 
  UserIcon, 
  BuildingOffice2Icon, 
  MapPinIcon,
  CheckCircleIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';

export const Onboarding: React.FC = () => {
  const { setCurrentUser } = useStore();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    specialty: '',
    doctorName: '',
    hospital: '',
    location: '',
    customConfig: null as LicenseConfig | null
  });

  const specialties = [
    { id: 'fertility', name: 'Fertility & Reproductive Medicine', description: 'IVF, OHSS monitoring, embryo assessment' },
    { id: 'pediatrics', name: 'Pediatrics', description: 'Child health, development, vaccinations' },
    { id: 'radiology', name: 'Radiology', description: 'Medical imaging interpretation' },
    { id: 'general', name: 'General Medicine', description: 'Primary care and internal medicine' }
  ];

  const handleSpecialtySelect = (specialtyId: string) => {
    const config = getDefaultConfig(specialtyId);
    setFormData(prev => ({ 
      ...prev, 
      specialty: specialtyId,
      customConfig: config
    }));
    setStep(2);
  };

  const handlePersonalization = () => {
    if (!formData.customConfig) return;

    const personalizedConfig = {
      ...formData.customConfig,
      hospital: formData.hospital || formData.customConfig.hospital,
      location: formData.location || formData.customConfig.location
    };

    setFormData(prev => ({ ...prev, customConfig: personalizedConfig }));
    setStep(3);
  };

  const handleComplete = () => {
    if (!formData.customConfig) return;

    // Save license configuration
    localStorage.setItem('licenseConfig', JSON.stringify(formData.customConfig));

    // Set current user
    setCurrentUser({
      id: 'user_' + Date.now(),
      name: formData.doctorName,
      role: 'doctor',
      department: formData.customConfig.department
    });

    // Redirect to main app
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-medical-blue to-medical-green flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-medical-blue text-white p-6">
          <h1 className="text-2xl font-bold mb-2">Welcome to MedThread AI</h1>
          <p className="opacity-90">Let's set up your personalized medical AI assistant</p>
          
          {/* Progress Steps */}
          <div className="flex items-center space-x-4 mt-6">
            {[1, 2, 3].map((stepNum) => (
              <div key={stepNum} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step >= stepNum ? 'bg-white text-medical-blue' : 'bg-white bg-opacity-30 text-white'
                }`}>
                  {step > stepNum ? <CheckCircleIcon className="h-5 w-5" /> : stepNum}
                </div>
                {stepNum < 3 && (
                  <ArrowRightIcon className="h-4 w-4 mx-2 opacity-60" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {step === 1 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Choose Your Medical Specialty</h2>
              <p className="text-gray-600 mb-6">Select your primary area of practice to customize the AI's knowledge base and capabilities.</p>
              
              <div className="grid gap-4">
                {specialties.map((specialty) => (
                  <button
                    key={specialty.id}
                    onClick={() => handleSpecialtySelect(specialty.id)}
                    className="text-left p-4 border-2 border-gray-200 rounded-lg hover:border-medical-blue hover:bg-blue-50 transition-colors"
                  >
                    <h3 className="font-medium text-gray-900 mb-1">{specialty.name}</h3>
                    <p className="text-sm text-gray-600">{specialty.description}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Personalize Your Setup</h2>
              <p className="text-gray-600 mb-6">Provide some basic information to customize your experience.</p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <UserIcon className="h-4 w-4 inline mr-1" />
                    Your Name
                  </label>
                  <input
                    type="text"
                    value={formData.doctorName}
                    onChange={(e) => setFormData(prev => ({ ...prev, doctorName: e.target.value }))}
                    className="input input-bordered w-full"
                    placeholder="Dr. Jane Smith"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <BuildingOffice2Icon className="h-4 w-4 inline mr-1" />
                    Hospital/Clinic Name
                  </label>
                  <input
                    type="text"
                    value={formData.hospital}
                    onChange={(e) => setFormData(prev => ({ ...prev, hospital: e.target.value }))}
                    className="input input-bordered w-full"
                    placeholder="General Hospital"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <MapPinIcon className="h-4 w-4 inline mr-1" />
                    Location
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                    className="input input-bordered w-full"
                    placeholder="New York, NY"
                  />
                </div>
              </div>
              
              <div className="flex justify-between mt-8">
                <button
                  onClick={() => setStep(1)}
                  className="btn btn-ghost"
                >
                  Back
                </button>
                <button
                  onClick={handlePersonalization}
                  disabled={!formData.doctorName.trim()}
                  className="btn btn-primary"
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {step === 3 && formData.customConfig && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Review Configuration</h2>
              <p className="text-gray-600 mb-6">Your AI assistant is ready with the following configuration:</p>
              
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">AI Name:</span>
                    <div className="text-medical-blue font-medium">{formData.customConfig.aiName}</div>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Department:</span>
                    <div>{formData.customConfig.department}</div>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Hospital:</span>
                    <div>{formData.customConfig.hospital}</div>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Location:</span>
                    <div>{formData.customConfig.location}</div>
                  </div>
                </div>
                
                <div>
                  <span className="font-medium text-gray-700 text-sm">Capabilities:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {formData.customConfig.multimodal?.canRead?.map((capability, index) => (
                      <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                        {capability}
                      </span>
                    ))}
                  </div>
                </div>
                
                <div>
                  <span className="font-medium text-gray-700 text-sm">Visit Types:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {formData.customConfig.visitTypes?.slice(0, 3).map((type, index) => (
                      <span key={index} className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                        {type}
                      </span>
                    ))}
                    {formData.customConfig.visitTypes && formData.customConfig.visitTypes.length > 3 && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                        +{formData.customConfig.visitTypes.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex justify-between mt-8">
                <button
                  onClick={() => setStep(2)}
                  className="btn btn-ghost"
                >
                  Back
                </button>
                <button
                  onClick={handleComplete}
                  className="btn btn-primary"
                >
                  Complete Setup
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};