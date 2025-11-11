'use client';

import { useState, useRef, useCallback } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { DocumentCategory } from '@/types/database';
import {
  CloudArrowUpIcon,
  XMarkIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  ArrowUpTrayIcon,
} from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface UploadFile {
  file: File;
  id: string;
  preview?: string;
  progress: number;
  error?: string;
}

export default function UploadDocumentPage() {
  const supabase = createClientComponentClient();
  const { user, profile } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [categories, setCategories] = useState<DocumentCategory[]>([]);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  
  // Form data
  const [formData, setFormData] = useState({
    category_id: '',
    document_type: 'contract',
    access_level: 'private' as 'private' | 'internal' | 'public' | 'restricted',
    is_confidential: false,
    tags: [] as string[],
    notes: '',
  });

  const documentTypes = [
    { value: 'contract', label: 'Contract' },
    { value: 'measurement_sheet', label: 'Measurement Sheet' },
    { value: 'design_approval', label: 'Design Approval' },
    { value: 'employee_contract', label: 'Employee Contract' },
    { value: 'invoice', label: 'Invoice' },
    { value: 'purchase_order', label: 'Purchase Order' },
    { value: 'quality_report', label: 'Quality Report' },
    { value: 'certificate', label: 'Certificate' },
    { value: 'agreement', label: 'Agreement' },
    { value: 'other', label: 'Other' },
  ];

  useEffect(() => {
    if (profile?.organization_id) {
      fetchCategories();
    }
  }, [profile?.organization_id]);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('document_categories')
        .select('*')
        .eq('organization_id', profile?.organization_id)
        .eq('is_active', true)
        .order('sort_order');

      if (error) throw error;
      setCategories(data || []);
      
      // Set default category
      if (data && data.length > 0) {
        setFormData(prev => ({ ...prev, category_id: data[0].id }));
      }
    } catch (error: any) {
      console.error('Error fetching categories:', error);
      showToast('Failed to load categories', 'error');
    }
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    addFiles(droppedFiles);
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      addFiles(selectedFiles);
    }
  };

  const addFiles = (newFiles: File[]) => {
    const uploadFiles: UploadFile[] = newFiles.map(file => ({
      file,
      id: Math.random().toString(36).substring(7),
      progress: 0,
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
    }));
    setFiles(prev => [...prev, ...uploadFiles]);
  };

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const generateDocumentNumber = async () => {
    try {
      const { data, error } = await supabase.rpc('generate_document_number', {
        org_id: profile?.organization_id,
        doc_type: formData.document_type,
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error generating document number:', error);
      // Fallback to simple number generation
      const prefix = formData.document_type.substring(0, 3).toUpperCase();
      const timestamp = Date.now().toString().slice(-8);
      return `${prefix}-${timestamp}`;
    }
  };

  const uploadFile = async (uploadFile: UploadFile) => {
    try {
      const { file } = uploadFile;
      
      // Generate document number
      const documentNumber = await generateDocumentNumber();
      
      // Create unique file path
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${profile?.organization_id}/${formData.document_type}/${fileName}`;

      // Upload to storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('documents')
        .getPublicUrl(filePath);

      // Calculate retention date (7 years by default)
      const retentionDate = new Date();
      retentionDate.setFullYear(retentionDate.getFullYear() + 7);

      // Create document record
      const { data: docData, error: docError } = await supabase
        .from('documents')
        .insert({
          organization_id: profile?.organization_id,
          document_number: documentNumber,
          title: file.name.replace(/\.[^/.]+$/, ''), // Remove extension
          category_id: formData.category_id || null,
          document_type: formData.document_type,
          file_name: file.name,
          file_size: file.size,
          file_type: fileExt || 'unknown',
          mime_type: file.type || 'application/octet-stream',
          storage_path: filePath,
          storage_bucket: 'documents',
          access_level: formData.access_level,
          is_confidential: formData.is_confidential,
          tags: formData.tags,
          notes: formData.notes,
          retention_date: retentionDate.toISOString().split('T')[0],
          uploaded_by: user?.id,
          status: 'draft',
          approval_status: 'pending',
        })
        .select()
        .single();

      if (docError) throw docError;

      // Create audit log
      await supabase.from('document_audit_logs').insert({
        organization_id: profile?.organization_id,
        document_id: docData.id,
        action: 'upload',
        action_category: 'modification',
        action_details: {
          file_name: file.name,
          file_size: file.size,
          document_type: formData.document_type,
        },
        user_id: user?.id,
        user_name: profile?.full_name,
        user_role: profile?.role,
        document_version: 1,
        document_status: 'draft',
        compliance_event: true,
      });

      return { success: true, data: docData };
    } catch (error: any) {
      console.error('Upload error:', error);
      return { success: false, error: error.message };
    }
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      showToast('Please select files to upload', 'error');
      return;
    }

    if (!formData.category_id) {
      showToast('Please select a category', 'error');
      return;
    }

    setUploading(true);

    try {
      let successCount = 0;
      let failCount = 0;

      for (let i = 0; i < files.length; i++) {
        const uploadFile = files[i];
        
        // Update progress
        setFiles(prev => prev.map(f => 
          f.id === uploadFile.id ? { ...f, progress: 10 } : f
        ));

        const result = await uploadFile(uploadFile);

        if (result.success) {
          successCount++;
          setFiles(prev => prev.map(f => 
            f.id === uploadFile.id ? { ...f, progress: 100 } : f
          ));
        } else {
          failCount++;
          setFiles(prev => prev.map(f => 
            f.id === uploadFile.id ? { ...f, error: result.error || 'Upload failed' } : f
          ));
        }
      }

      if (successCount > 0) {
        showToast(`Successfully uploaded ${successCount} document(s)`, 'success');
        
        // Redirect after 2 seconds
        setTimeout(() => {
          router.push('/dashboard/documents' as any);
        }, 2000);
      }

      if (failCount > 0) {
        showToast(`Failed to upload ${failCount} document(s)`, 'error');
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      showToast('Upload failed: ' + error.message, 'error');
    } finally {
      setUploading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-cyan-50 p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="backdrop-blur-xl bg-white/70 rounded-2xl border border-teal-100 p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">
                Upload Documents
              </h1>
              <p className="text-gray-600 mt-1">Upload documents securely with metadata and categorization</p>
            </div>
            <button
              onClick={() => router.push('/dashboard/documents')}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all"
            >
              Cancel
            </button>
          </div>
        </div>

        {/* Upload Area */}
        <div className="backdrop-blur-xl bg-white/70 rounded-2xl border border-teal-100 p-6 shadow-lg">
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-12 text-center transition-all ${
              dragActive
                ? 'border-teal-500 bg-teal-50'
                : 'border-gray-300 hover:border-teal-400'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileInput}
              className="hidden"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.webp,.txt,.csv"
            />
            
            <CloudArrowUpIcon className="h-16 w-16 text-teal-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Drop files here or click to browse
            </h3>
            <p className="text-gray-600 mb-4">
              Supports: PDF, DOC, DOCX, XLS, XLSX, images, TXT, CSV (Max 50MB per file)
            </p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-6 py-3 bg-gradient-to-r from-teal-600 to-cyan-600 text-white rounded-lg hover:shadow-lg transition-all"
            >
              Select Files
            </button>
          </div>

          {/* File List */}
          {files.length > 0 && (
            <div className="mt-6 space-y-3">
              <h3 className="font-semibold text-gray-900">Selected Files ({files.length})</h3>
              {files.map((uploadFile) => (
                <div
                  key={uploadFile.id}
                  className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg bg-white"
                >
                  {uploadFile.preview ? (
                    <img
                      src={uploadFile.preview}
                      alt={uploadFile.file.name}
                      className="w-12 h-12 object-cover rounded"
                    />
                  ) : (
                    <DocumentTextIcon className="h-12 w-12 text-gray-400" />
                  )}
                  
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{uploadFile.file.name}</p>
                    <p className="text-sm text-gray-600">{formatFileSize(uploadFile.file.size)}</p>
                    
                    {uploadFile.progress > 0 && (
                      <div className="mt-2">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all ${
                              uploadFile.error
                                ? 'bg-red-500'
                                : uploadFile.progress === 100
                                ? 'bg-green-500'
                                : 'bg-teal-600'
                            }`}
                            style={{ width: `${uploadFile.progress}%` }}
                          />
                        </div>
                        {uploadFile.error && (
                          <p className="text-xs text-red-600 mt-1">{uploadFile.error}</p>
                        )}
                      </div>
                    )}
                  </div>

                  {uploadFile.progress === 100 ? (
                    <CheckCircleIcon className="h-6 w-6 text-green-600" />
                  ) : !uploading && (
                    <button
                      onClick={() => removeFile(uploadFile.id)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-all"
                    >
                      <XMarkIcon className="h-5 w-5 text-gray-600" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Metadata Form */}
        <div className="backdrop-blur-xl bg-white/70 rounded-2xl border border-teal-100 p-6 shadow-lg">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Document Information</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.category_id}
                onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="">Select Category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.category_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Document Type <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.document_type}
                onChange={(e) => setFormData({ ...formData, document_type: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                {documentTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Access Level
              </label>
              <select
                value={formData.access_level}
                onChange={(e) => setFormData({ ...formData, access_level: e.target.value as any })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="private">Private (Only me)</option>
                <option value="internal">Internal (Organization)</option>
                <option value="restricted">Restricted (Specific roles)</option>
                <option value="public">Public</option>
              </select>
            </div>

            <div className="flex items-center">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_confidential}
                  onChange={(e) => setFormData({ ...formData, is_confidential: e.target.checked })}
                  className="w-4 h-4 text-teal-600 focus:ring-teal-500 border-gray-300 rounded"
                />
                <span className="text-sm font-medium text-gray-700">Mark as Confidential</span>
              </label>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tags (comma-separated)
              </label>
              <input
                type="text"
                placeholder="e.g., urgent, signed, uae-compliant"
                onChange={(e) => setFormData({ 
                  ...formData, 
                  tags: e.target.value.split(',').map(t => t.trim()).filter(t => t) 
                })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
                placeholder="Additional information about these documents..."
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>
        </div>

        {/* Upload Button */}
        <div className="backdrop-blur-xl bg-white/70 rounded-2xl border border-teal-100 p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">
                {files.length} file(s) selected
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Files will be uploaded to secure storage with encryption
              </p>
            </div>
            <button
              onClick={handleUpload}
              disabled={files.length === 0 || uploading || !formData.category_id}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all ${
                files.length === 0 || uploading || !formData.category_id
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-teal-600 to-cyan-600 text-white hover:shadow-lg'
              }`}
            >
              {uploading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Uploading...
                </>
              ) : (
                <>
                  <ArrowUpTrayIcon className="h-5 w-5" />
                  Upload Documents
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
