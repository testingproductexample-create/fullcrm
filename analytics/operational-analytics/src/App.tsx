import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Toaster } from 'react-hot-toast';
import { useUIStore } from './store';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import EmployeeAnalytics from './pages/EmployeeAnalytics';
import OrderAnalytics from './pages/OrderAnalytics';
import ResourceAnalytics from './pages/ResourceAnalytics';
import WorkflowAnalytics from './pages/WorkflowAnalytics';
import AppointmentAnalytics from './pages/AppointmentAnalytics';
import CustomerServiceAnalytics from './pages/CustomerServiceAnalytics';
import QualityControlAnalytics from './pages/QualityControlAnalytics';
import InventoryAnalytics from './pages/InventoryAnalytics';
import CostAnalytics from './pages/CostAnalytics';
import TimeTrackingAnalytics from './pages/TimeTrackingAnalytics';
import PerformanceTargets from './pages/PerformanceTargets';
import Alerts from './pages/Alerts';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import './index.css';

// Create a React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

const App: React.FC = () => {
  const { theme } = useUIStore();

  useEffect(() => {
    // Set the document theme
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className={`min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 ${theme}`}>
          <Layout>
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/employees" element={<EmployeeAnalytics />} />
              <Route path="/orders" element={<OrderAnalytics />} />
              <Route path="/resources" element={<ResourceAnalytics />} />
              <Route path="/workflow" element={<WorkflowAnalytics />} />
              <Route path="/appointments" element={<AppointmentAnalytics />} />
              <Route path="/customer-service" element={<CustomerServiceAnalytics />} />
              <Route path="/quality" element={<QualityControlAnalytics />} />
              <Route path="/inventory" element={<InventoryAnalytics />} />
              <Route path="/costs" element={<CostAnalytics />} />
              <Route path="/time-tracking" element={<TimeTrackingAnalytics />} />
              <Route path="/targets" element={<PerformanceTargets />} />
              <Route path="/alerts" element={<Alerts />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </Layout>
          
          {/* Toast notifications */}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: 'rgba(15, 23, 42, 0.9)',
                color: '#fff',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
              },
              success: {
                iconTheme: {
                  primary: '#10b981',
                  secondary: '#fff',
                },
              },
              error: {
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#fff',
                },
              },
            }}
          />
        </div>
      </Router>
    </QueryClientProvider>
  );
};

export default App;