import React from 'react';
import { Message as MessageType } from '../store/useStore';

interface MessageProps {
  message: MessageType;
}

export const Message: React.FC<MessageProps> = ({ message }) => {
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div
        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
          isUser
            ? 'bg-medical-blue text-white'
            : isSystem
            ? 'bg-gray-100 text-gray-700 border'
            : 'bg-white border border-gray-200 text-gray-900'
        }`}
      >
        {/* Message Content */}
        <div className="whitespace-pre-wrap">{message.content}</div>

        {/* Attachments */}
        {message.attachments && message.attachments.length > 0 && (
          <div className="mt-2 space-y-1">
            {message.attachments.map((attachment, index) => (
              <div key={index} className="text-xs opacity-75">
                📎 {attachment}
              </div>
            ))}
          </div>
        )}

        {/* FHIR Resources */}
        {message.fhirResources && message.fhirResources.length > 0 && (
          <div className="mt-2">
            <div className="text-xs opacity-75 mb-1">FHIR Resources:</div>
            {message.fhirResources.map((resource, index) => (
              <div key={index} className="text-xs bg-blue-50 px-2 py-1 rounded mb-1">
                {resource}
              </div>
            ))}
          </div>
        )}

        {/* Reasoning (for AI messages) */}
        {message.reasoning && (
          <details className="mt-2">
            <summary className="text-xs cursor-pointer opacity-75 hover:opacity-100">
              View AI Reasoning
            </summary>
            <div className="text-xs mt-1 p-2 bg-gray-50 rounded border">
              {message.reasoning}
            </div>
          </details>
        )}

        {/* Timestamp */}
        <div className="text-xs opacity-50 mt-2">
          {message.timestamp.toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
};