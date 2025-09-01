import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { useLicenseConfig } from '../hooks/useLicenseConfig';
import { 
  CpuChipIcon, 
  InformationCircleIcon, 
  Cog6ToothIcon,
  ChevronDownIcon,
  ChevronUpIcon
} from '@heroicons/react/24/outline';

export const AIInfoPanel: React.FC = () => {
  const { reasoningLog, currentUser } = useStore();
  const { config } = useLicenseConfig();
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<'config' | 'reasoning' | 'stats'>('config');

  const recentReasoning = reasoningLog.slice(-5).reverse();

  return (
    <div className="w-80 bg-gray-50 border-l border-gray-200 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CpuChipIcon className="h-5 w-5 text-medical-blue" />
            <h2 className="text-lg font-semibold text-gray-900">
              {config?.aiName || 'MedThread AI'}
            </h2>
          </div>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="btn btn-ghost btn-sm"
          >
            {isExpanded ? (
              <ChevronUpIcon className="h-4 w-4" />
            ) : (
              <ChevronDownIcon className="h-4 w-4" />
            )}
          </button>
        </div>
        
        {config && (
          <div className="mt-2">
            <p className="text-sm text-gray-600">{config.department}</p>
            <p className="text-xs text-gray-500">{config.hospital}</p>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 bg-white">
        <div className="flex">
          {[
            { id: 'config', label: 'Config', icon: Cog6ToothIcon },
            { id: 'reasoning', label: 'Reasoning', icon: CpuChipIcon },
            { id: 'stats', label: 'Stats', icon: InformationCircleIcon }
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id as any)}
              className={`flex-1 px-3 py-2 text-xs font-medium border-b-2 transition-colors ${
                activeTab === id
                  ? 'border-medical-blue text-medical-blue'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon className="h-4 w-4 mx-auto mb-1" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'config' && (
          <div className="space-y-4">
            {config ? (
              <>
                {/* AI Configuration */}
                <div className="bg-white rounded-lg p-3 border">
                  <h3 className="font-medium text-sm mb-2">AI Configuration</h3>
                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="font-medium">Language:</span> {config.language}
                    </div>
                    <div>
                      <span className="font-medium">Location:</span> {config.location}
                    </div>
                  </div>
                </div>

                {/* Capabilities */}
                <div className="bg-white rounded-lg p-3 border">
                  <h3 className="font-medium text-sm mb-2">Capabilities</h3>
                  <div className="space-y-1">
                    {config.multimodal?.canRead?.map((capability, index) => (
                      <div key={index} className="text-xs bg-blue-50 px-2 py-1 rounded">
                        {capability}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Visit Types */}
                <div className="bg-white rounded-lg p-3 border">
                  <h3 className="font-medium text-sm mb-2">Visit Types</h3>
                  <div className="space-y-1">
                    {config.visitTypes?.map((type, index) => (
                      <div key={index} className="text-xs bg-green-50 px-2 py-1 rounded">
                        {type}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Boundaries */}
                <div className="bg-white rounded-lg p-3 border">
                  <h3 className="font-medium text-sm mb-2">Safety Boundaries</h3>
                  <div className="space-y-2">
                    <div>
                      <div className="font-medium text-xs text-red-600 mb-1">Do Not Diagnose:</div>
                      {config.boundaries?.doNotDiagnose?.map((item, index) => (
                        <div key={index} className="text-xs bg-red-50 px-2 py-1 rounded mb-1">
                          {item}
                        </div>
                      ))}
                    </div>
                    <div>
                      <div className="font-medium text-xs text-orange-600 mb-1">Escalate to Human:</div>
                      {config.boundaries?.escalateToHuman?.map((item, index) => (
                        <div key={index} className="text-xs bg-orange-50 px-2 py-1 rounded mb-1">
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center text-gray-500 py-8">
                <Cog6ToothIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No configuration loaded</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'reasoning' && (
          <div className="space-y-3">
            {recentReasoning.length > 0 ? (
              recentReasoning.map((log) => (
                <div key={log.id} className="bg-white rounded-lg p-3 border">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-gray-600">
                      Confidence: {Math.round(log.confidence * 100)}%
                    </span>
                    <span className="text-xs text-gray-500">
                      {log.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-xs text-gray-700 mb-2">{log.reasoning}</p>
                  {log.evidence && log.evidence.length > 0 && (
                    <div>
                      <div className="text-xs font-medium text-gray-600 mb-1">Evidence:</div>
                      {log.evidence.map((item, index) => (
                        <div key={index} className="text-xs bg-blue-50 px-2 py-1 rounded mb-1">
                          {item}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center text-gray-500 py-8">
                <CpuChipIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No reasoning logs yet</p>
                <p className="text-xs">AI reasoning will appear here</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'stats' && (
          <div className="space-y-4">
            <div className="bg-white rounded-lg p-3 border">
              <h3 className="font-medium text-sm mb-2">Session Stats</h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span>Current User:</span>
                  <span className="font-medium">{currentUser?.name || 'Not logged in'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Role:</span>
                  <span className="font-medium">{currentUser?.role || 'Unknown'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Reasoning Logs:</span>
                  <span className="font-medium">{reasoningLog.length}</span>
                </div>
              </div>
            </div>

            {config && (
              <div className="bg-white rounded-lg p-3 border">
                <h3 className="font-medium text-sm mb-2">Knowledge Base</h3>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span>Guidelines:</span>
                    <span className="font-medium">{config.guidelines?.length || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Textbooks:</span>
                    <span className="font-medium">{config.textbooks?.length || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Journals:</span>
                    <span className="font-medium">{config.journals?.length || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tools:</span>
                    <span className="font-medium">{config.tools?.length || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Formulary:</span>
                    <span className="font-medium">{config.formulary?.length || 0}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};