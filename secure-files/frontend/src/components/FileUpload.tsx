import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import { filesApi, formatFileSize } from '../services/api';
import toast from 'react-hot-toast';

interface FileUploadProps {
  onUploadComplete?: (uploadedFiles: any[]) => void;
  onUploadStart?: () => void;
  category?: string;
}

interface FileWithProgress {
  file: File;
  id: string;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
  result?: any;
}

export function FileUpload({ onUploadComplete, onUploadStart, category }: FileUploadProps) {
  const [files, setFiles] = useState<FileWithProgress[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles: FileWithProgress[] = acceptedFiles.map((file) => ({
      file,
      id: Math.random().toString(36).substr(2, 9),
      progress: 0,
      status: 'pending',
    }));
    setFiles((prev) => [...prev, ...newFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif'],
      'application/pdf': ['.pdf'],
      'text/plain': ['.txt'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'text/csv': ['.csv'],
    },
    maxSize: 100 * 1024 * 1024, // 100MB
    maxFiles: 10,
  });

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const uploadFile = async (fileWithProgress: FileWithProgress) => {
    try {
      setFiles((prev) =>
        prev.map((f) =>
          f.id === fileWithProgress.id
            ? { ...f, status: 'uploading', progress: 0 }
            : f
        )
      );

      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setFiles((prev) =>
          prev.map((f) =>
            f.id === fileWithProgress.id && f.progress < 90
              ? { ...f, progress: f.progress + 10 }
              : f
          )
        );
      }, 200);

      const response = await filesApi.uploadFiles([fileWithProgress.file], category);
      
      clearInterval(progressInterval);

      setFiles((prev) =>
        prev.map((f) =>
          f.id === fileWithProgress.id
            ? { ...f, progress: 100, status: 'success', result: response.data }
            : f
        )
      );

      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Upload failed';
      setFiles((prev) =>
        prev.map((f) =>
          f.id === fileWithProgress.id
            ? { ...f, status: 'error', error: errorMessage }
            : f
        )
      );
      throw error;
    }
  };

  const uploadAllFiles = async () => {
    const pendingFiles = files.filter((f) => f.status === 'pending');
    if (pendingFiles.length === 0) return;

    setIsUploading(true);
    onUploadStart?.();

    try {
      const uploadPromises = pendingFiles.map((file) => uploadFile(file));
      const results = await Promise.allSettled(uploadPromises);
      
      const successfulUploads = results
        .filter((result) => result.status === 'fulfilled')
        .map((result) => (result as PromiseFulfilledResult<any>).value);

      const failedUploads = results.filter((result) => result.status === 'rejected');

      if (successfulUploads.length > 0) {
        onUploadComplete?.(successfulUploads);
        toast.success(`${successfulUploads.length} file(s) uploaded successfully`);
      }

      if (failedUploads.length > 0) {
        toast.error(`${failedUploads.length} file(s) failed to upload`);
      }
    } catch (error) {
      toast.error('Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const clearCompleted = () => {
    setFiles((prev) => prev.filter((f) => f.status !== 'success'));
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) return '🖼️';
    if (file.type.includes('pdf')) return '📄';
    if (file.type.includes('word')) return '📝';
    if (file.type.includes('excel') || file.type.includes('spreadsheet')) return '📊';
    return '📄';
  };

  return (
    <div className="space-y-6">
      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          isDragActive
            ? 'border-blue-400 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
      >
        <input {...getInputProps()} />
        <Upload className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-4 text-lg font-medium text-gray-900">
          {isDragActive ? 'Drop files here' : 'Upload Files'}
        </h3>
        <p className="mt-2 text-sm text-gray-600">
          Drag and drop files here, or click to select files
        </p>
        <p className="mt-1 text-xs text-gray-500">
          Supports: Images, PDF, Documents, Spreadsheets (max 100MB, 10 files)
        </p>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-lg font-medium text-gray-900">
              Files to Upload ({files.length})
            </h4>
            <div className="space-x-2">
              {files.some((f) => f.status === 'success') && (
                <button
                  onClick={clearCompleted}
                  className="text-sm text-gray-600 hover:text-gray-900"
                >
                  Clear Completed
                </button>
              )}
              {files.some((f) => f.status === 'pending') && (
                <button
                  onClick={uploadAllFiles}
                  disabled={isUploading}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-md text-sm font-medium"
                >
                  {isUploading ? 'Uploading...' : 'Upload All'}
                </button>
              )}
            </div>
          </div>

          <div className="space-y-2">
            {files.map((fileWithProgress) => (
              <div
                key={fileWithProgress.id}
                className="flex items-center space-x-4 p-3 bg-white border rounded-lg"
              >
                <div className="text-2xl">
                  {getFileIcon(fileWithProgress.file)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {fileWithProgress.file.name}
                    </p>
                    <div className="flex items-center space-x-2">
                      {fileWithProgress.status === 'success' && (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      )}
                      {fileWithProgress.status === 'error' && (
                        <AlertCircle className="h-5 w-5 text-red-500" />
                      )}
                      <button
                        onClick={() => removeFile(fileWithProgress.id)}
                        disabled={fileWithProgress.status === 'uploading'}
                        className="text-gray-400 hover:text-gray-600 disabled:cursor-not-allowed"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 mt-1">
                    <p className="text-xs text-gray-500">
                      {formatFileSize(fileWithProgress.file.size)}
                    </p>
                    {fileWithProgress.status === 'uploading' && (
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all duration-200"
                          style={{ width: `${fileWithProgress.progress}%` }}
                        />
                      </div>
                    )}
                  </div>
                  
                  {fileWithProgress.error && (
                    <p className="text-xs text-red-600 mt-1">
                      {fileWithProgress.error}
                    </p>
                  )}
                  
                  {fileWithProgress.status === 'success' && (
                    <p className="text-xs text-green-600 mt-1">
                      Uploaded successfully
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}