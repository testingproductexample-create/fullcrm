import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';
import toast from 'react-hot-toast';

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle common errors
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error: AxiosError) => {
    const { response } = error;

    if (response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      if (window.location.pathname !== '/login') {
        toast.error('Session expired. Please log in again.');
        window.location.href = '/login';
      }
    } else if (response?.status === 403) {
      // Forbidden
      toast.error('You do not have permission to perform this action.');
    } else if (response?.status === 429) {
      // Rate limit exceeded
      toast.error('Too many requests. Please try again later.');
    } else if (response?.status === 500) {
      // Server error
      toast.error('Server error. Please try again later.');
    } else if (error.code === 'NETWORK_ERROR' || !response) {
      // Network error
      toast.error('Network error. Please check your connection.');
    }

    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  login: (credentials: { email: string; password: string }) =>
    api.post('/auth/login', credentials),

  register: (userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role?: string;
  }) => api.post('/auth/register', userData),

  logout: () => api.post('/auth/logout'),

  refreshToken: (token: string) =>
    api.post('/auth/refresh', { token }),

  changePassword: (passwords: {
    currentPassword: string;
    newPassword: string;
  }) => api.post('/auth/change-password', passwords),

  getProfile: () => api.get('/auth/me'),

  updateProfile: (data: any) => api.patch('/auth/me', data),
};

// Files API
export const filesApi = {
  // Get all files with pagination and filters
  getFiles: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    category?: string;
  }) => api.get('/files', { params }),

  // Get single file metadata
  getFile: (id: string) => api.get(`/files/${id}`),

  // Upload files
  uploadFiles: (files: File[], category?: string) => {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file);
    });
    if (category) {
      formData.append('category', category);
    }

    return api.post('/files/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  // Download file
  downloadFile: (id: string) =>
    api.get(`/files/${id}/download`, {
      responseType: 'blob',
    }),

  // Delete file
  deleteFile: (id: string) => api.delete(`/files/${id}`),

  // Update file metadata
  updateFile: (id: string, data: any) => api.patch(`/files/${id}`, data),

  // Bulk operations
  bulkOperation: (action: string, fileIds: string[], data?: any) =>
    api.post('/files/bulk', { action, fileIds, data }),
};

// Sharing API
export const sharingApi = {
  // Create share link
  createShare: (data: {
    fileId: string;
    expiresIn?: number;
    maxDownloads?: number;
    password?: string;
    allowDownload?: boolean;
  }) => api.post('/sharing/create', data),

  // Get share information
  getShare: (token: string) => api.get(`/sharing/${token}`),

  // Download file via share
  downloadSharedFile: (token: string, password?: string) =>
    api.get(`/sharing/${token}/download`, {
      params: { password },
      responseType: 'blob',
    }),

  // Get user's shares
  getUserShares: (params?: {
    page?: number;
    limit?: number;
  }) => api.get('/sharing/my/shares', { params }),

  // Revoke share
  revokeShare: (shareId: string) => api.delete(`/sharing/${shareId}`),

  // Update share settings
  updateShare: (shareId: string, data: any) =>
    api.patch(`/sharing/${shareId}`, data),

  // Get share statistics
  getShareStats: (shareId: string) =>
    api.get(`/sharing/${shareId}/stats`),
};

// Audit API
export const auditApi = {
  // Get audit logs
  getAuditLogs: (params?: {
    page?: number;
    limit?: number;
    eventType?: string;
    userId?: string;
    ipAddress?: string;
    startDate?: string;
    endDate?: string;
    severity?: string;
  }) => api.get('/audit/logs', { params }),

  // Get security incidents
  getSecurityIncidents: (params?: {
    page?: number;
    limit?: number;
    incidentType?: string;
    userId?: string;
    ipAddress?: string;
    startDate?: string;
    endDate?: string;
    resolved?: boolean;
  }) => api.get('/audit/security-incidents', { params }),

  // Get user activity
  getUserActivity: (userId: string, params?: {
    page?: number;
    limit?: number;
    startDate?: string;
    endDate?: string;
  }) => api.get(`/audit/user-activity/${userId}`, { params }),

  // Get file access history
  getFileAccessHistory: (fileId: string, params?: {
    page?: number;
    limit?: number;
  }) => api.get(`/audit/file-access/${fileId}`, { params }),

  // Get system statistics
  getSystemStatistics: (params?: {
    period?: string;
  }) => api.get('/audit/statistics', { params }),

  // Resolve security incident
  resolveSecurityIncident: (incidentId: string, data: {
    resolution: string;
    status?: string;
  }) => api.patch(`/audit/security-incidents/${incidentId}/resolve`, data),

  // Export audit logs
  exportAuditLogs: (params?: {
    startDate?: string;
    endDate?: string;
    eventType?: string;
    format?: string;
  }) => api.get('/audit/export', { 
    params,
    responseType: params?.format === 'json' ? 'json' : 'blob',
  }),
};

// Admin API
export const adminApi = {
  // Get system overview
  getSystemOverview: () => api.get('/admin/overview'),

  // Get all users
  getUsers: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
    status?: string;
  }) => api.get('/admin/users', { params }),

  // Get user details
  getUser: (userId: string) => api.get(`/admin/users/${userId}`),

  // Update user
  updateUser: (userId: string, data: any) =>
    api.patch(`/admin/users/${userId}`, data),

  // Delete user
  deleteUser: (userId: string) => api.delete(`/admin/users/${userId}`),

  // Get system configuration
  getSystemConfig: () => api.get('/admin/config'),

  // Update system configuration
  updateSystemConfig: (data: any) => api.patch('/admin/config', data),

  // Get storage statistics
  getStorageStats: (params?: {
    period?: string;
  }) => api.get('/admin/storage', { params }),

  // Perform maintenance
  performMaintenance: (action: string) =>
    api.post('/admin/maintenance', { action }),
};

// Utility functions
export const downloadFile = (response: any, filename: string) => {
  const blob = new Blob([response.data], {
    type: response.headers['content-type'],
  });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const getFileIcon = (mimetype: string): string => {
  if (mimetype.startsWith('image/')) return '🖼️';
  if (mimetype.startsWith('video/')) return '🎥';
  if (mimetype.startsWith('audio/')) return '🎵';
  if (mimetype.includes('pdf')) return '📄';
  if (mimetype.includes('document') || mimetype.includes('word')) return '📝';
  if (mimetype.includes('spreadsheet') || mimetype.includes('excel')) return '📊';
  if (mimetype.includes('presentation') || mimetype.includes('powerpoint')) return '📽️';
  if (mimetype.includes('zip') || mimetype.includes('rar')) return '📦';
  if (mimetype === 'text/plain') return '📄';
  return '📄';
};

// Export default API instance
export default api;