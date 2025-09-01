import React, { useState, useEffect } from 'react';
import { 
  DocumentIcon, 
  PhotoIcon, 
  EyeIcon, 
  ArrowDownTrayIcon, 
  TrashIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { 
  getPatientFiles, 
  getFile, 
  deleteFile, 
  createFileURL, 
  revokeFileURL, 
  formatFileSize, 
  StoredFile 
} from '../db/fileStorage';

interface FileViewerProps {
  patientId: string;
  isOpen: boolean;
  onClose: () => void;
}

export const FileViewer: React.FC<FileViewerProps> = ({ patientId, isOpen, onClose }) => {
  const [files, setFiles] = useState<StoredFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<StoredFile | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  // Load patient files when modal opens
  useEffect(() => {
    if (isOpen && patientId) {
      loadFiles();
    }
  }, [isOpen, patientId]);

  // Cleanup preview URL when component unmounts or preview closes
  useEffect(() => {
    return () => {
      if (previewUrl) {
        revokeFileURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const loadFiles = async () => {
    setLoading(true);
    try {
      const patientFiles = await getPatientFiles(patientId);
      setFiles(patientFiles);
    } catch (error) {
      console.error('Failed to load files:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePreview = async (file: StoredFile) => {
    try {
      // Get full file data
      const fullFile = await getFile(file.id);
      if (!fullFile || !fullFile.data) {
        console.error('File data not available');
        return;
      }

      // Clean up previous preview URL
      if (previewUrl) {
        revokeFileURL(previewUrl);
      }

      // Create new preview URL
      const url = createFileURL(fullFile);
      setPreviewUrl(url);
      setSelectedFile(fullFile);
      setShowPreview(true);
    } catch (error) {
      console.error('Failed to preview file:', error);
    }
  };

  const handleDownload = async (file: StoredFile) => {
    try {
      // Get full file data
      const fullFile = await getFile(file.id);
      if (!fullFile || !fullFile.data) {
        console.error('File data not available');
        return;
      }

      // Create download URL and trigger download
      const url = createFileURL(fullFile);
      const link = document.createElement('a');
      link.href = url;
      link.download = fullFile.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up URL
      revokeFileURL(url);
    } catch (error) {
      console.error('Failed to download file:', error);
    }
  };

  const handleDelete = async (file: StoredFile) => {
    if (!confirm(`Are you sure you want to delete "${file.filename}"?`)) {
      return;
    }

    try {
      const success = await deleteFile(file.id);
      if (success) {
        setFiles(prev => prev.filter(f => f.id !== file.id));
        
        // Close preview if deleted file was being previewed
        if (selectedFile?.id === file.id) {
          closePreview();
        }
      } else {
        console.error('Failed to delete file');
      }
    } catch (error) {
      console.error('Failed to delete file:', error);
    }
  };

  const closePreview = () => {
    if (previewUrl) {
      revokeFileURL(previewUrl);
      setPreviewUrl(null);
    }
    setSelectedFile(null);
    setShowPreview(false);
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) {
      return <PhotoIcon className="h-8 w-8 text-blue-500" />;
    }
    return <DocumentIcon className="h-8 w-8 text-gray-500" />;
  };

  const canPreview = (mimeType: string) => {
    return mimeType.startsWith('image/') || mimeType === 'application/pdf' || mimeType.startsWith('text/');
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Main File Viewer Modal */}
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-4xl mx-4 max-h-[80vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Patient Files</h3>
            <button
              onClick={onClose}
              className="btn btn-ghost btn-sm"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          {/* Files List */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <span className="loading loading-spinner loading-md"></span>
                <span className="ml-2">Loading files...</span>
              </div>
            ) : files.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <DocumentIcon className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p>No files uploaded yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {files.map((file) => (
                  <div key={file.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        {getFileIcon(file.mimeType)}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate" title={file.filename}>
                            {file.filename}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatFileSize(file.size || 0)}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-xs text-gray-400 mb-3">
                      {new Date(file.uploadedAt).toLocaleDateString()}
                    </div>
                    
                    <div className="flex space-x-2">
                      {canPreview(file.mimeType) && (
                        <button
                          onClick={() => handlePreview(file)}
                          className="btn btn-sm btn-outline flex-1"
                          title="Preview"
                        >
                          <EyeIcon className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDownload(file)}
                        className="btn btn-sm btn-outline flex-1"
                        title="Download"
                      >
                        <ArrowDownTrayIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(file)}
                        className="btn btn-sm btn-outline btn-error"
                        title="Delete"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* File Preview Modal */}
      {showPreview && selectedFile && previewUrl && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-60">
          <div className="bg-white rounded-lg p-4 w-full max-w-6xl mx-4 max-h-[90vh] flex flex-col">
            {/* Preview Header */}
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold truncate">{selectedFile.filename}</h4>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleDownload(selectedFile)}
                  className="btn btn-sm btn-outline"
                >
                  <ArrowDownTrayIcon className="h-4 w-4" />
                  Download
                </button>
                <button
                  onClick={closePreview}
                  className="btn btn-sm btn-ghost"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Preview Content */}
            <div className="flex-1 overflow-auto">
              {selectedFile.mimeType.startsWith('image/') ? (
                <img
                  src={previewUrl}
                  alt={selectedFile.filename}
                  className="max-w-full max-h-full object-contain mx-auto"
                />
              ) : selectedFile.mimeType === 'application/pdf' ? (
                <iframe
                  src={previewUrl}
                  className="w-full h-full min-h-[500px]"
                  title={selectedFile.filename}
                />
              ) : selectedFile.mimeType.startsWith('text/') ? (
                <iframe
                  src={previewUrl}
                  className="w-full h-full min-h-[400px] border"
                  title={selectedFile.filename}
                />
              ) : (
                <div className="text-center py-8">
                  <DocumentIcon className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-600">Preview not available for this file type</p>
                  <button
                    onClick={() => handleDownload(selectedFile)}
                    className="btn btn-primary mt-4"
                  >
                    <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                    Download to View
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};