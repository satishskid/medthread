import React, { useState, useRef } from 'react';
import { XMarkIcon, DocumentIcon, PhotoIcon } from '@heroicons/react/24/outline';
import { useStore } from '../store/useStore';
import { storeFile, validateFile, formatFileSize, StoredFile } from '../db/fileStorage';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientId?: string;
}

export const UploadModal: React.FC<UploadModalProps> = ({ isOpen, onClose, patientId }) => {
  const { addMessage } = useStore();
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      handleFiles(files);
    }
  };

  const handleFiles = (files: File[]) => {
    const validFiles: File[] = [];
    const invalidFiles: string[] = [];
    
    files.forEach(file => {
      const validation = validateFile(file);
      if (validation.valid) {
        validFiles.push(file);
      } else {
        invalidFiles.push(`${file.name}: ${validation.error}`);
      }
    });
    
    // Show validation errors if any
    if (invalidFiles.length > 0) {
      console.warn('Invalid files:', invalidFiles);
      // You could show a toast notification here
    }
    
    setUploadedFiles(prev => [...prev, ...validFiles]);
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const processFiles = async () => {
    if (uploadedFiles.length === 0 || !patientId) return;
    
    setIsProcessing(true);
    const storedFiles: StoredFile[] = [];
    const errors: string[] = [];
    
    try {
      // Process each file
      for (const file of uploadedFiles) {
        try {
          // Validate file before storage
          const validation = validateFile(file);
          if (!validation.valid) {
            errors.push(`${file.name}: ${validation.error}`);
            continue;
          }
          
          // Store file in database
          const storedFile = await storeFile(file, patientId);
          storedFiles.push(storedFile);
          
          const fileType = file.type.startsWith('image/') ? 'image' : 'document';
          
          // Create a message for the uploaded file
          const fileMessage = {
            threadId: patientId,
            role: 'user' as const,
            content: `Uploaded ${fileType}: ${file.name} (${formatFileSize(file.size)})`,
            messageType: fileType as 'image' | 'document',
            attachments: [storedFile.id] // Store file ID instead of filename
          };
          
          addMessage(fileMessage);
          
          // Add AI response about the file
          const aiResponse = {
            threadId: patientId,
            role: 'assistant' as const,
            content: `I've successfully stored the ${fileType} "${file.name}" in your medical records. ${fileType === 'image' ? 'I can analyze medical images for relevant findings and help identify key observations.' : 'I can extract and analyze text content from documents to help with clinical documentation.'} How would you like me to help with this file?`,
            messageType: 'text' as const
          };
          
          addMessage(aiResponse);
          
        } catch (fileError) {
          console.error(`Error storing file ${file.name}:`, fileError);
          errors.push(`${file.name}: Storage failed`);
        }
      }
      
      // Show summary message if there were errors
      if (errors.length > 0) {
        const errorMessage = {
          threadId: patientId,
          role: 'assistant' as const,
          content: `⚠️ Some files could not be processed:\n${errors.join('\n')}\n\nSuccessfully stored ${storedFiles.length} file(s).`,
          messageType: 'text' as const
        };
        addMessage(errorMessage);
      }
      
      // Clear uploaded files and close modal
      setUploadedFiles([]);
      onClose();
      
    } catch (error) {
      console.error('Error processing files:', error);
      const errorMessage = {
        threadId: patientId || '',
        role: 'assistant' as const,
        content: '❌ An error occurred while processing your files. Please try again.',
        messageType: 'text' as const
      };
      addMessage(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) {
      return <PhotoIcon className="h-8 w-8 text-blue-500" />;
    }
    return <DocumentIcon className="h-8 w-8 text-gray-500" />;
  };

  // formatFileSize is now imported from fileStorage.ts

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Upload Files</h3>
          <button
            onClick={onClose}
            className="btn btn-ghost btn-sm"
            disabled={isProcessing}
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Upload Area */}
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            isDragging
              ? 'border-blue-400 bg-blue-50'
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="space-y-2">
            <DocumentIcon className="h-12 w-12 text-gray-400 mx-auto" />
            <div>
              <p className="text-sm font-medium">Drop files here or click to browse</p>
              <p className="text-xs text-gray-500">
                Supports images, PDFs, and text files (max 10MB each)
              </p>
            </div>
          </div>
          
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,.pdf,.txt,.doc,.docx"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>

        {/* Uploaded Files List */}
        {uploadedFiles.length > 0 && (
          <div className="mt-4">
            <h4 className="text-sm font-medium mb-2">Selected Files:</h4>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {uploadedFiles.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div className="flex items-center space-x-2">
                    {getFileIcon(file)}
                    <div>
                      <p className="text-sm font-medium truncate max-w-32">{file.name}</p>
                      <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => removeFile(index)}
                    className="btn btn-ghost btn-xs"
                    disabled={isProcessing}
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end space-x-2 mt-6">
          <button
            onClick={onClose}
            className="btn btn-ghost"
            disabled={isProcessing}
          >
            Cancel
          </button>
          <button
            onClick={processFiles}
            disabled={uploadedFiles.length === 0 || isProcessing}
            className="btn btn-primary"
          >
            {isProcessing ? (
              <>
                <span className="loading loading-spinner loading-sm"></span>
                Processing...
              </>
            ) : (
              `Upload ${uploadedFiles.length} file${uploadedFiles.length !== 1 ? 's' : ''}`
            )}
          </button>
        </div>
      </div>
    </div>
  );
};