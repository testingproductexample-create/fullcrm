import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Toaster } from 'react-hot-toast';

import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Layout } from './components/Layout';

// Pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import DashboardPage from './pages/DashboardPage';
import FilesPage from './pages/files/FilesPage';
import FileUploadPage from './pages/files/FileUploadPage';
import FileDetailsPage from './pages/files/FileDetailsPage';
import SharedFilesPage from './pages/sharing/SharedFilesPage';
import ShareLinkPage from './pages/sharing/ShareLinkPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import UserManagementPage from './pages/admin/UserManagementPage';
import AuditLogsPage from './pages/admin/AuditLogsPage';
import SettingsPage from './pages/settings/SettingsPage';
import ProfilePage from './pages/settings/ProfilePage';
import SecurityPage from './pages/settings/SecurityPage';
import NotFoundPage from './pages/NotFoundPage';

// Styles
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <div className="min-h-screen bg-gray-50">
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              
              {/* Share Link Routes (Public) */}
              <Route path="/share/:token" element={<ShareLinkPage />} />

              {/* Protected Routes */}
              <Route path="/" element={
                <ProtectedRoute>
                  <Layout>
                    <Navigate to="/dashboard" replace />
                  </Layout>
                </ProtectedRoute>
              } />
              
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <Layout>
                    <DashboardPage />
                  </Layout>
                </ProtectedRoute>
              } />
              
              {/* File Management Routes */}
              <Route path="/files" element={
                <ProtectedRoute>
                  <Layout>
                    <FilesPage />
                  </Layout>
                </ProtectedRoute>
              } />
              
              <Route path="/files/upload" element={
                <ProtectedRoute>
                  <Layout>
                    <FileUploadPage />
                  </Layout>
                </ProtectedRoute>
              } />
              
              <Route path="/files/:id" element={
                <ProtectedRoute>
                  <Layout>
                    <FileDetailsPage />
                  </Layout>
                </ProtectedRoute>
              } />
              
              {/* Sharing Routes */}
              <Route path="/shared" element={
                <ProtectedRoute>
                  <Layout>
                    <SharedFilesPage />
                  </Layout>
                </ProtectedRoute>
              } />
              
              {/* Admin Routes */}
              <Route path="/admin" element={
                <ProtectedRoute requiredRole="admin">
                  <Layout>
                    <AdminDashboard />
                  </Layout>
                </ProtectedRoute>
              } />
              
              <Route path="/admin/users" element={
                <ProtectedRoute requiredRole="admin">
                  <Layout>
                    <UserManagementPage />
                  </Layout>
                </ProtectedRoute>
              } />
              
              <Route path="/admin/audit" element={
                <ProtectedRoute requiredRole="admin">
                  <Layout>
                    <AuditLogsPage />
                  </Layout>
                </ProtectedRoute>
              } />
              
              {/* Settings Routes */}
              <Route path="/settings" element={
                <ProtectedRoute>
                  <Layout>
                    <SettingsPage />
                  </Layout>
                </ProtectedRoute>
              } />
              
              <Route path="/profile" element={
                <ProtectedRoute>
                  <Layout>
                    <ProfilePage />
                  </Layout>
                </ProtectedRoute>
              } />
              
              <Route path="/security" element={
                <ProtectedRoute>
                  <Layout>
                    <SecurityPage />
                  </Layout>
                </ProtectedRoute>
              } />
              
              {/* 404 Route */}
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
            
            {/* Toast Notifications */}
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                className: 'bg-white border border-gray-200 text-gray-900',
                success: {
                  iconTheme: {
                    primary: '#10B981',
                    secondary: '#ffffff',
                  },
                },
                error: {
                  iconTheme: {
                    primary: '#EF4444',
                    secondary: '#ffffff',
                  },
                },
              }}
            />
          </div>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;