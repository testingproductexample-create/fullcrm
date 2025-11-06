// Main export for Overtime & Allowances Management System
export { default as OvertimeAllowancesDashboard } from './OvertimeAllowancesDashboard';
export { OvertimeManagement } from './components/OvertimeManagement';
export { AllowancesManagement } from './components/AllowancesManagement';
export { ApprovalWorkflow } from './components/ApprovalWorkflow';
export { ReportsAnalytics } from './components/ReportsAnalytics';
export { ConfigurationPanel } from './components/ConfigurationPanel';

// Types
export type {
  OvertimeRecord,
  AllowanceRecord,
  EmployeeAllowanceConfig,
  OvertimeApproval,
  AttendanceRecord,
  OvertimeReport,
  OvertimeAnalytics,
  UAELaborLawCompliance,
  CalculationRule
} from './types';

// Services
export { OvertimeAllowancesService } from './service';
export { UAEOvertimeCalculator, UAE_LABOR_LAW } from './uaeCompliantCalculator';