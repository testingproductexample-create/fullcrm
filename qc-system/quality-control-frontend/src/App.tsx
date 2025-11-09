import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import MainLayout from './components/layout/MainLayout';
import Dashboard from './pages/Dashboard';
import Inspections from './pages/Inspections';
import InspectionDetails from './pages/InspectionDetails';
import CreateInspection from './pages/CreateInspection';
import Defects from './pages/Defects';
import DefectDetails from './pages/DefectDetails';
import Audits from './pages/Audits';
import AuditDetails from './pages/AuditDetails';
import CreateAudit from './pages/CreateAudit';
import Training from './pages/Training';
import Standards from './pages/Standards';
import Compliance from './pages/Compliance';
import Feedback from './pages/Feedback';
import Metrics from './pages/Metrics';
import Settings from './pages/Settings';
import './App.css';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <Routes>
          <Route path="/" element={<MainLayout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            
            <Route path="inspections" element={<Inspections />} />
            <Route path="inspections/create" element={<CreateInspection />} />
            <Route path="inspections/:id" element={<InspectionDetails />} />
            
            <Route path="defects" element={<Defects />} />
            <Route path="defects/:id" element={<DefectDetails />} />
            
            <Route path="audits" element={<Audits />} />
            <Route path="audits/create" element={<CreateAudit />} />
            <Route path="audits/:id" element={<AuditDetails />} />
            
            <Route path="training" element={<Training />} />
            <Route path="standards" element={<Standards />} />
            <Route path="compliance" element={<Compliance />} />
            <Route path="feedback" element={<Feedback />} />
            <Route path="metrics" element={<Metrics />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Routes>
        <Toaster />
      </div>
    </Router>
  );
}

export default App;
