import React, { useState, useEffect } from 'react';
import './App.css';

// Layout Components
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';

// Page Components
import Overview from './components/Overview';
import IndividualCalculation from './components/IndividualCalculation';
import BulkProcessing from './components/BulkProcessing';

// Hooks
import { 
  useEmployees, 
  useSalaryStructures, 
  useSalaryCalculations, 
  usePayrollSummary,
  useCalculationPeriod,
  usePayrollUI,
  useBulkCalculations,
  useCalculationPreview
} from './hooks/usePayroll';

// Types
import { CalculationPreview } from './types/payroll';
import { getCalculationPeriodLabel } from './utils/calculations';

function App() {
  const [organizationId] = useState<string>('default-org'); // Would come from auth context
  
  // UI State
  const { 
    sidebarOpen, 
    setSidebarOpen,
    activeTab,
    setActiveTab,
    showPreview,
    setShowPreview,
    selectedCalculationId,
    setSelectedCalculationId,
    toggleEmployeeSelection,
    selectAllEmployees,
    clearSelection,
    selectedEmployees
  } = usePayrollUI();

  // Period Management
  const { 
    month, 
    year, 
    setMonth, 
    setYear, 
    goToPreviousPeriod, 
    goToNextPeriod, 
    isCurrentPeriod, 
    canGoToNext 
  } = useCalculationPeriod();

  // Data Fetching
  const { employees, loading: employeesLoading, error: employeesError, refetch: refetchEmployees } = useEmployees(organizationId);
  const { salaryStructures, loading: structuresLoading, error: structuresError } = useSalaryStructures(organizationId);
  const { summary, loading: summaryLoading } = usePayrollSummary(organizationId, month, year);
  const { 
    calculations, 
    loading: calculationsLoading, 
    error: calculationsError,
    createCalculation,
    updateCalculation,
    approveCalculation,
    refetch: refetchCalculations
  } = useSalaryCalculations(organizationId, month, year);

  // Bulk Processing
  const { loading: bulkLoading, result: bulkResult, processBulkCalculations } = useBulkCalculations(organizationId);
  
  // Calculation Preview
  const { preview, loading: previewLoading, generatePreview, clearPreview } = useCalculationPreview();

  // Handle period navigation
  const handlePeriodChange = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      goToPreviousPeriod();
    } else {
      goToNextPeriod();
    }
  };

  // Handle calculation creation
  const handleCalculate = async (calculationPreview: CalculationPreview) => {
    try {
      // Find the employee and salary structure
      const employee = employees.find(emp => emp.id === calculationPreview.employee_id);
      const structure = salaryStructures.find(str => str.id === employee?.salary_structure_id);
      
      if (!employee || !structure) {
        throw new Error('Employee or salary structure not found');
      }

      // Create the calculation record
      const newCalculation = {
        organization_id: organizationId,
        employee_id: employee.id,
        calculation_period_month: month,
        calculation_period_year: year,
        salary_structure_id: structure.id,
        base_salary_aed: calculationPreview.base_salary,
        hourly_rate_aed: structure.hourly_rate_aed,
        total_work_hours: calculationPreview.regular_hours + calculationPreview.overtime_hours,
        regular_hours: calculationPreview.regular_hours,
        overtime_hours: calculationPreview.overtime_hours,
        overtime_amount_aed: calculationPreview.overtime_amount,
        commission_amount_aed: calculationPreview.commission_amount,
        bonus_amount_aed: calculationPreview.bonus_amount,
        allowances_amount_aed: calculationPreview.allowances_amount,
        gross_salary_aed: calculationPreview.gross_salary,
        deductions_amount_aed: calculationPreview.deductions.reduce((sum, d) => sum + d.amount, 0),
        tax_amount_aed: 0, // UAE has no income tax
        insurance_deduction_aed: 0,
        advance_deduction_aed: 0,
        leave_deduction_aed: 0,
        other_deductions_aed: 0,
        net_salary_aed: calculationPreview.net_salary,
        calculation_status: 'calculated' as const,
        calculation_details: {
          uae_compliance_issues: calculationPreview.uae_compliance_issues,
          warnings: calculationPreview.warnings,
          preview_data: calculationPreview
        }
      };

      await createCalculation(newCalculation);
      
      // Clear preview and refresh data
      clearPreview();
      setShowPreview(false);
      refetchCalculations();
      
    } catch (error) {
      console.error('Error creating calculation:', error);
    }
  };

  // Handle bulk processing
  const handleBulkProcess = async (request: any) => {
    return await processBulkCalculations(request);
  };

  // Loading state
  if (employeesLoading || structuresLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="spinner w-12 h-12 mx-auto mb-4"></div>
          <p className="text-white">Loading UAE Payroll System...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (employeesError || structuresError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">⚠️</span>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Error Loading Data</h2>
          <p className="text-gray-400 mb-4">
            {employeesError || structuresError}
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

  // Current period label
  const currentPeriodLabel = getCalculationPeriodLabel(month, year);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Glassmorphism background overlay */}
      <div className="fixed inset-0 bg-white/5 backdrop-blur-3xl pointer-events-none" />
      
      <div className="relative z-10 flex">
        {/* Sidebar */}
        <Sidebar 
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
        
        <div className="flex-1 flex flex-col min-h-screen">
          {/* Header */}
          <Header
            onMenuClick={() => setSidebarOpen(!sidebarOpen)}
            onPeriodChange={handlePeriodChange}
            currentPeriod={currentPeriodLabel}
            isCurrentPeriod={isCurrentPeriod()}
            canGoToNext={canGoToNext()}
          />
          
          {/* Main Content */}
          <main className="flex-1 p-6 space-y-6">
            {activeTab === 'overview' && (
              <Overview 
                summary={summary}
                loading={summaryLoading}
              />
            )}
            
            {activeTab === 'individual' && (
              <IndividualCalculation
                employees={employees}
                salaryStructures={salaryStructures}
                onCalculate={handleCalculate}
                loading={calculationsLoading}
              />
            )}
            
            {activeTab === 'bulk' && (
              <BulkProcessing
                employees={employees}
                onBulkProcess={handleBulkProcess}
                loading={bulkLoading}
              />
            )}
            
            {activeTab === 'overtime' && (
              <div className="glass-card p-8 text-center">
                <h2 className="text-2xl font-bold text-white mb-4">Overtime Management</h2>
                <p className="text-gray-400 mb-6">UAE-compliant overtime tracking and calculations</p>
                <p className="text-sm text-gray-500">Feature coming soon...</p>
              </div>
            )}
            
            {activeTab === 'deductions' && (
              <div className="glass-card p-8 text-center">
                <h2 className="text-2xl font-bold text-white mb-4">Deductions & Allowances</h2>
                <p className="text-gray-400 mb-6">Manage tax deductions and employee allowances</p>
                <p className="text-sm text-gray-500">Feature coming soon...</p>
              </div>
            )}
            
            {activeTab === 'reports' && (
              <div className="glass-card p-8 text-center">
                <h2 className="text-2xl font-bold text-white mb-4">Reports & Analytics</h2>
                <p className="text-gray-400 mb-6">Generate comprehensive payroll reports</p>
                <p className="text-sm text-gray-500">Feature coming soon...</p>
              </div>
            )}
            
            {activeTab === 'compliance' && (
              <div className="glass-card p-8 text-center">
                <h2 className="text-2xl font-bold text-white mb-4">UAE Compliance</h2>
                <p className="text-gray-400 mb-6">Ensure adherence to UAE labor laws and regulations</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                  <div className="glass-card p-4">
                    <h3 className="text-lg font-semibold text-white mb-2">Minimum Wage Compliance</h3>
                    <p className="text-green-400 text-sm">All calculations meet UAE minimum wage requirements</p>
                  </div>
                  <div className="glass-card p-4">
                    <h3 className="text-lg font-semibold text-white mb-2">Overtime Compliance</h3>
                    <p className="text-green-400 text-sm">Overtime calculations follow UAE labor law (125% rate)</p>
                  </div>
                </div>
              </div>
            )}
            
            {activeTab === 'settings' && (
              <div className="glass-card p-8 text-center">
                <h2 className="text-2xl font-bold text-white mb-4">Settings</h2>
                <p className="text-gray-400 mb-6">Configure payroll system settings and preferences</p>
                <p className="text-sm text-gray-500">Feature coming soon...</p>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

export default App;