import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Toaster } from 'react-hot-toast';
import Layout from './components/Layout';
import ReportBuilder from './components/ReportBuilder';
import Dashboard from './components/Dashboard';
import TemplateLibrary from './components/TemplateLibrary';
import ReportSchedule from './components/ReportSchedule';
import ComplianceReports from './components/ComplianceReports';
import GeographicReports from './components/GeographicReports';
import DataVisualization from './components/DataVisualization';
import ExportCenter from './components/ExportCenter';
import { useReportStore } from './store/reportStore';

function App() {
  const initializeStore = useReportStore((state) => state.initialize);

  React.useEffect(() => {
    initializeStore();
  }, [initializeStore]);

  return (
    <DndProvider backend={HTML5Backend}>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Layout>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/builder" element={<ReportBuilder />} />
              <Route path="/builder/:templateId" element={<ReportBuilder />} />
              <Route path="/visualization" element={<DataVisualization />} />
              <Route path="/templates" element={<TemplateLibrary />} />
              <Route path="/schedule" element={<ReportSchedule />} />
              <Route path="/compliance" element={<ComplianceReports />} />
              <Route path="/geographic" element={<GeographicReports />} />
              <Route path="/export" element={<ExportCenter />} />
            </Routes>
          </Layout>
          <Toaster position="top-right" />
        </div>
      </Router>
    </DndProvider>
  );
}

export default App;