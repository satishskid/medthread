import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { Message } from './Message';
import { TaskItem } from './TaskItem';
import { UploadModal } from './UploadModal';
import { FileViewer } from './FileViewer';
import { PaperClipIcon, PaperAirplaneIcon, FolderIcon } from '@heroicons/react/24/outline';

export const ChatWindow: React.FC = () => {
  const {
    messages,
    tasks,
    activePatientId,
    patients,
    addMessage,
    addTask,
    updateTask
  } = useStore();

  const currentPatient = activePatientId ? patients[activePatientId] : null;

  const [inputMessage, setInputMessage] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showFileViewer, setShowFileViewer] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = {
      threadId: currentPatient?.threadId || '',
      role: 'user' as const,
      content: inputMessage,
      messageType: 'text' as const
    };

    addMessage(userMessage);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Simple AI response for now - will be enhanced later
      const aiMessage = {
        threadId: currentPatient?.threadId || '',
        role: 'assistant' as const,
        content: 'Thank you for your message. I\'m processing your request...',
        messageType: 'text' as const
      };

      addMessage(aiMessage);

      // Add a sample task
      addTask({
        threadId: currentPatient?.threadId || '',
        title: 'Follow up on patient inquiry',
        description: `Review and respond to: ${inputMessage}`,
        urgency: 'routine' as const,
        status: 'pending' as const
      });
    } catch (error) {
      console.error('Error generating AI response:', error);
      const errorMessage = {
        threadId: currentPatient?.threadId || '',
        role: 'assistant' as const,
        content: 'I apologize, but I encountered an error processing your request. Please try again.',
        messageType: 'text' as const
      };
      addMessage(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleFileUpload = (files: FileList) => {
    setShowUploadModal(true);
  };

  const activeTasks = tasks.filter(task => task.status !== 'completed' && task.threadId === currentPatient?.threadId);
  const patientMessages = messages.filter(msg => msg.threadId === currentPatient?.threadId);

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {currentPatient ? currentPatient.name : 'Select a Patient'}
              </h2>
              {currentPatient && (
                <p className="text-sm text-gray-500">
                  Status: {currentPatient.status} • Thread: {currentPatient.threadId}
                </p>
              )}
            </div>
            <div className="flex items-center space-x-2">
              {currentPatient && (
                <button
                  onClick={() => setShowFileViewer(true)}
                  className="btn btn-ghost btn-sm"
                  title="View Files"
                >
                  <FolderIcon className="h-5 w-5" />
                </button>
              )}
              {activeTasks.length > 0 && (
                <div className="badge badge-warning">
                  {activeTasks.length} active task{activeTasks.length !== 1 ? 's' : ''}
                </div>
              )}
            </div>
          </div>
      </div>

      {/* Tasks Panel */}
      {activeTasks.length > 0 && (
        <div className="border-b border-gray-200 p-4 bg-yellow-50">
          <h3 className="text-sm font-medium text-gray-900 mb-2">Active Tasks</h3>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {activeTasks.map(task => (
              <TaskItem
                key={task.id}
                task={task}
                onUpdate={(updatedTask) => updateTask(task.id, updatedTask)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {!currentPatient ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <p className="text-lg mb-2">Welcome to MedThread AI</p>
              <p>Select a patient from the sidebar to begin a conversation</p>
            </div>
          </div>
        ) : patientMessages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <p className="text-lg mb-2">Start a conversation</p>
              <p>Ask questions, upload files, or discuss patient care</p>
            </div>
          </div>
        ) : (
          patientMessages.map(message => (
            <Message key={message.id} message={message} />
          ))
        )}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-lg p-3 max-w-xs">
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-medical-blue"></div>
                <span className="text-sm text-gray-600">AI is thinking...</span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      {currentPatient && (
        <div className="border-t border-gray-200 p-4">
          <div className="flex items-end space-x-2">
            <button
              onClick={() => setShowUploadModal(true)}
              className="btn btn-ghost btn-sm"
              disabled={isLoading}
            >
              <PaperClipIcon className="h-5 w-5" />
            </button>
            
            <div className="flex-1">
              <textarea
                ref={textareaRef}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message... (Shift+Enter for new line)"
                className="textarea textarea-bordered w-full resize-none"
                rows={1}
                disabled={isLoading}
                style={{
                  minHeight: '2.5rem',
                  maxHeight: '8rem',
                  height: 'auto'
                }}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = 'auto';
                  target.style.height = target.scrollHeight + 'px';
                }}
              />
            </div>
            
            <button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isLoading}
              className="btn btn-primary"
            >
              <PaperAirplaneIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <UploadModal
          isOpen={showUploadModal}
          onClose={() => setShowUploadModal(false)}
          patientId={currentPatient?.id}
        />
      )}

      {/* File Viewer Modal */}
      {showFileViewer && currentPatient && (
        <FileViewer
          isOpen={showFileViewer}
          onClose={() => setShowFileViewer(false)}
          patientId={currentPatient.id}
        />
      )}
    </div>
  );
};