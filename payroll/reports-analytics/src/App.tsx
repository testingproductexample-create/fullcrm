import React, { useEffect } from 'react';
import SalaryReportsAnalytics from './components/SalaryReportsAnalytics';
import { useEmployeeData, useMonthlyPayrollData, useQuarterlyData, useDepartmentData, useBudgetData, useMetrics } from './hooks';
import './index.css';

const App: React.FC = () => {
  // Initialize all data hooks
  const { employees, isLoading: employeesLoading, error: employeesError } = useEmployeeData();
  const { data: monthlyData, isLoading: monthlyLoading } = useMonthlyPayrollData('12months');
  const { data: quarterlyData, isLoading: quarterlyLoading } = useQuarterlyData();
  const { data: departmentData } = useDepartmentData(employees);
  const { data: budgetData, isLoading: budgetLoading } = useBudgetData();
  const metrics = useMetrics(monthlyData, budgetData, employees);

  // Global loading state
  const isLoading = employeesLoading || monthlyLoading || quarterlyLoading || budgetLoading;

  // Error handling
  useEffect(() => {
    if (employeesError) {
      console.error('Failed to load employee data:', employeesError);
    }
  }, [employeesError]);

  // Performance monitoring
  useEffect(() => {
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      const loadTime = endTime - startTime;
      console.log(`App loaded in ${loadTime.toFixed(2)}ms`);
      
      // Report performance metrics
      if (window.gtag) {
        window.gtag('event', 'timing_complete', {
          name: 'app_load',
          value: Math.round(loadTime)
        });
      }
    };
  }, []);

  // Render loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' 
      }}>
        <div className="text-center">
          <div className="loading-spinner w-12 h-12 mx-auto mb-4"></div>
          <p className="text-white text-lg font-medium">Loading Salary Analytics...</p>
          <p className="text-white/70 text-sm mt-2">Preparing your dashboard</p>
        </div>
      </div>
    );
  }

  // Render error state
  if (employeesError) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' 
      }}>
        <div className="glass p-8 rounded-xl text-center max-w-md">
          <div className="text-red-400 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">Error Loading Data</h2>
          <p className="text-white/70 mb-4">
            We encountered an issue while loading the salary analytics data.
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="btn-primary"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Render main application
  return (
    <div className="App min-h-screen">
      <SalaryReportsAnalytics />
    </div>
  );
};

export default App;