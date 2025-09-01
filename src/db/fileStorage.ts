import { getDB } from './initDB';
import { v4 as uuidv4 } from 'uuid';

// File storage interface
export interface StoredFile {
  id: string;
  patientId: string;
  filename: string;
  mimeType: string;
  size: number;
  uploadedAt: string;
  data?: Uint8Array;
}

// Convert File to Uint8Array
const fileToUint8Array = (file: File): Promise<Uint8Array> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const arrayBuffer = reader.result as ArrayBuffer;
      resolve(new Uint8Array(arrayBuffer));
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(file);
  });
};

// Store file in database
export const storeFile = async (file: File, patientId: string): Promise<StoredFile> => {
  try {
    const db = getDB();
    const fileId = uuidv4();
    const fileData = await fileToUint8Array(file);
    const uploadedAt = new Date().toISOString();
    
    // Store file in DocumentReference table
    const stmt = db.prepare(`
      INSERT INTO DocumentReference (id, patientId, filename, mimeType, data, uploadedAt)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run([
      fileId,
      patientId,
      file.name,
      file.type,
      fileData,
      uploadedAt
    ]);
    
    stmt.free();
    
    const storedFile: StoredFile = {
      id: fileId,
      patientId,
      filename: file.name,
      mimeType: file.type,
      size: file.size,
      uploadedAt,
      data: fileData
    };
    
    console.log(`📁 File stored: ${file.name} (${file.size} bytes)`);
    return storedFile;
    
  } catch (error) {
    console.error('❌ Failed to store file:', error);
    throw new Error(`Failed to store file: ${error}`);
  }
};

// Retrieve file from database
export const getFile = async (fileId: string): Promise<StoredFile | null> => {
  try {
    const db = getDB();
    const stmt = db.prepare(`
      SELECT id, patientId, filename, mimeType, data, uploadedAt
      FROM DocumentReference
      WHERE id = ?
    `);
    
    const result = stmt.getAsObject([fileId]);
    stmt.free();
    
    if (!result || Object.keys(result).length === 0) {
      return null;
    }
    
    return {
      id: result.id as string,
      patientId: result.patientId as string,
      filename: result.filename as string,
      mimeType: result.mimeType as string,
      size: (result.data as Uint8Array)?.length || 0,
      uploadedAt: result.uploadedAt as string,
      data: result.data as Uint8Array
    };
    
  } catch (error) {
    console.error('❌ Failed to retrieve file:', error);
    return null;
  }
};

// Get all files for a patient
export const getPatientFiles = async (patientId: string): Promise<StoredFile[]> => {
  try {
    const db = getDB();
    const stmt = db.prepare(`
      SELECT id, patientId, filename, mimeType, uploadedAt
      FROM DocumentReference
      WHERE patientId = ?
      ORDER BY uploadedAt DESC
    `);
    
    const results = stmt.all([patientId]);
    stmt.free();
    
    return results.map((row: any) => ({
      id: row.id,
      patientId: row.patientId,
      filename: row.filename,
      mimeType: row.mimeType,
      size: 0, // Size not included in list query for performance
      uploadedAt: row.uploadedAt
    }));
    
  } catch (error) {
    console.error('❌ Failed to retrieve patient files:', error);
    return [];
  }
};

// Delete file from database
export const deleteFile = async (fileId: string): Promise<boolean> => {
  try {
    const db = getDB();
    const stmt = db.prepare(`
      DELETE FROM DocumentReference
      WHERE id = ?
    `);
    
    const result = stmt.run([fileId]);
    stmt.free();
    
    const deleted = result.changes > 0;
    if (deleted) {
      console.log(`🗑️ File deleted: ${fileId}`);
    }
    
    return deleted;
    
  } catch (error) {
    console.error('❌ Failed to delete file:', error);
    return false;
  }
};

// Create downloadable blob URL from stored file
export const createFileURL = (storedFile: StoredFile): string => {
  if (!storedFile.data) {
    throw new Error('File data not available');
  }
  
  const blob = new Blob([storedFile.data], { type: storedFile.mimeType });
  return URL.createObjectURL(blob);
};

// Clean up blob URL
export const revokeFileURL = (url: string): void => {
  URL.revokeObjectURL(url);
};

// Get file size statistics for a patient
export const getPatientStorageStats = async (patientId: string): Promise<{ totalFiles: number; totalSize: number }> => {
  try {
    const db = getDB();
    const stmt = db.prepare(`
      SELECT COUNT(*) as count, SUM(LENGTH(data)) as totalSize
      FROM DocumentReference
      WHERE patientId = ?
    `);
    
    const result = stmt.getAsObject([patientId]);
    stmt.free();
    
    return {
      totalFiles: (result.count as number) || 0,
      totalSize: (result.totalSize as number) || 0
    };
    
  } catch (error) {
    console.error('❌ Failed to get storage stats:', error);
    return { totalFiles: 0, totalSize: 0 };
  }
};

// Validate file before storage
export const validateFile = (file: File): { valid: boolean; error?: string } => {
  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  const ALLOWED_TYPES = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'text/plain',
    'text/csv',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];
  
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File size exceeds 10MB limit (${Math.round(file.size / 1024 / 1024)}MB)`
    };
  }
  
  if (!ALLOWED_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: `File type not supported: ${file.type}`
    };
  }
  
  return { valid: true };
};

// Format file size for display
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};