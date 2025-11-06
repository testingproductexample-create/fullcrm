import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import Dashboard from './components/pages/Dashboard';
import SecurityMonitoring from './components/pages/SecurityMonitoring';
import UserManagement from './components/pages/UserManagement';
import ComplianceTracking from './components/pages/ComplianceTracking';
import SecurityReports from './components/pages/SecurityReports';
import Settings from './components/pages/Settings';
import ThreatAlerts from './components/pages/ThreatAlerts';
import { SecurityProvider } from './context/SecurityContext';
import './App.css';

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <SecurityProvider>
      <Router>
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
          {/* Glassmorphism background overlay */}
          <div className="fixed inset-0 bg-white/5 backdrop-blur-3xl pointer-events-none" />
          
          <div className="relative z-10 flex">
            <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
            
            <div className="flex-1 flex flex-col min-h-screen">
              <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
              
              <main className="flex-1 p-6 space-y-6">
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/monitoring" element={<SecurityMonitoring />} />
                  <Route path="/alerts" element={<ThreatAlerts />} />
                  <Route path="/users" element={<UserManagement />} />
                  <Route path="/compliance" element={<ComplianceTracking />} />
                  <Route path="/reports" element={<SecurityReports />} />
                  <Route path="/settings" element={<Settings />} />
                </Routes>
              </main>
            </div>
          </div>
        </div>
      </Router>
    </SecurityProvider>
  );
}

export default App;
