import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface ChartData {
  id: string;
  name: string;
  type: 'bar' | 'line' | 'pie' | 'doughnut' | 'area' | 'scatter' | 'bubble' | 'radar' | 'polarArea';
  data: any[];
  xAxis?: string;
  yAxis?: string;
  groupBy?: string;
  filters?: any[];
  realTime?: boolean;
  updateInterval?: number;
}

export interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  category: 'business' | 'compliance' | 'financial' | 'operational' | 'geographic' | 'custom';
  components: ReportComponent[];
  chartConfigs?: ChartData[];
  compliance?: {
    uae: boolean;
    standards: string[];
  };
  shared?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReportComponent {
  id: string;
  type: 'chart' | 'table' | 'text' | 'metric' | 'image' | 'geographic';
  title: string;
  dataSource: string;
  config: any;
  position: { x: number; y: number; w: number; h: number };
  filters?: any[];
  visible: boolean;
  order: number;
}

export interface DashboardConfig {
  id: string;
  name: string;
  description: string;
  layout: 'grid' | 'freeform';
  components: ReportComponent[];
  theme: 'light' | 'dark' | 'colorful';
  refreshInterval?: number;
  autoRefresh: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ScheduleConfig {
  id: string;
  reportId: string;
  frequency: 'hourly' | 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  recipients: string[];
  format: 'pdf' | 'excel' | 'csv' | 'json';
  active: boolean;
  nextRun: Date;
  lastRun?: Date;
  subject?: string;
  message?: string;
}

export interface ComplianceReport {
  id: string;
  type: 'UAE_VAT' | 'UAE_CORP' | 'UAE_LABOR' | 'UAE_TRADE' | 'UAE_DATA_PROTECTION';
  name: string;
  requirements: string[];
  dueDate: Date;
  status: 'draft' | 'review' | 'approved' | 'submitted' | 'overdue';
  components: ReportComponent[];
  recipients: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ReportStore {
  // State
  templates: ReportTemplate[];
  dashboards: DashboardConfig[];
  reports: ReportTemplate[];
  schedules: ScheduleConfig[];
  complianceReports: ComplianceReport[];
  geographicReports: any[];
  currentDashboard: DashboardConfig | null;
  currentReport: ReportTemplate | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  initialize: () => void;
  
  // Template actions
  addTemplate: (template: Omit<ReportTemplate, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateTemplate: (id: string, updates: Partial<ReportTemplate>) => void;
  deleteTemplate: (id: string) => void;
  cloneTemplate: (id: string) => void;
  shareTemplate: (id: string, permissions: string[]) => void;
  
  // Dashboard actions
  addDashboard: (dashboard: Omit<DashboardConfig, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateDashboard: (id: string, updates: Partial<DashboardConfig>) => void;
  deleteDashboard: (id: string) => void;
  setCurrentDashboard: (dashboard: DashboardConfig | null) => void;
  
  // Report actions
  addReport: (report: Omit<ReportTemplate, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateReport: (id: string, updates: Partial<ReportTemplate>) => void;
  deleteReport: (id: string) => void;
  setCurrentReport: (report: ReportTemplate | null) => void;
  
  // Schedule actions
  addSchedule: (schedule: Omit<ScheduleConfig, 'id'>) => void;
  updateSchedule: (id: string, updates: Partial<ScheduleConfig>) => void;
  deleteSchedule: (id: string) => void;
  toggleSchedule: (id: string) => void;
  
  // Compliance actions
  addComplianceReport: (report: Omit<ComplianceReport, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateComplianceReport: (id: string, updates: Partial<ComplianceReport>) => void;
  deleteComplianceReport: (id: string) => void;
  
  // Geographic actions
  addGeographicReport: (report: any) => void;
  updateGeographicReport: (id: string, updates: any) => void;
  deleteGeographicReport: (id: string) => void;
  
  // Utility actions
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  exportData: (data: any[], format: 'pdf' | 'excel' | 'csv' | 'json') => void;
  generateReport: (templateId: string, dataSource: any[]) => Promise<any>;
  validateCompliance: (reportType: string, data: any[]) => Promise<boolean>;
}

const useReportStore = create<ReportStore>()(
  persist(
    (set, get) => ({
      // Initial state
      templates: [],
      dashboards: [],
      reports: [],
      schedules: [],
      complianceReports: [],
      geographicReports: [],
      currentDashboard: null,
      currentReport: null,
      isLoading: false,
      error: null,

      initialize: () => {
        // Load initial data from localStorage or API
        console.log('Initializing report store...');
      },

      // Template actions
      addTemplate: (template) => {
        const newTemplate: ReportTemplate = {
          ...template,
          id: Date.now().toString(),
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        set((state) => ({ templates: [...state.templates, newTemplate] }));
      },

      updateTemplate: (id, updates) => {
        set((state) => ({
          templates: state.templates.map((t) =>
            t.id === id ? { ...t, ...updates, updatedAt: new Date() } : t
          ),
        }));
      },

      deleteTemplate: (id) => {
        set((state) => ({
          templates: state.templates.filter((t) => t.id !== id),
        }));
      },

      cloneTemplate: (id) => {
        const template = get().templates.find((t) => t.id === id);
        if (template) {
          get().addTemplate({
            ...template,
            name: `${template.name} (Copy)`,
            shared: false,
          });
        }
      },

      shareTemplate: (id, permissions) => {
        set((state) => ({
          templates: state.templates.map((t) =>
            t.id === id ? { ...t, shared: true } : t
          ),
        }));
      },

      // Dashboard actions
      addDashboard: (dashboard) => {
        const newDashboard: DashboardConfig = {
          ...dashboard,
          id: Date.now().toString(),
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        set((state) => ({ dashboards: [...state.dashboards, newDashboard] }));
      },

      updateDashboard: (id, updates) => {
        set((state) => ({
          dashboards: state.dashboards.map((d) =>
            d.id === id ? { ...d, ...updates, updatedAt: new Date() } : d
          ),
        }));
      },

      deleteDashboard: (id) => {
        set((state) => ({
          dashboards: state.dashboards.filter((d) => d.id !== id),
        }));
      },

      setCurrentDashboard: (dashboard) => {
        set({ currentDashboard: dashboard });
      },

      // Report actions
      addReport: (report) => {
        const newReport: ReportTemplate = {
          ...report,
          id: Date.now().toString(),
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        set((state) => ({ reports: [...state.reports, newReport] }));
      },

      updateReport: (id, updates) => {
        set((state) => ({
          reports: state.reports.map((r) =>
            r.id === id ? { ...r, ...updates, updatedAt: new Date() } : r
          ),
        }));
      },

      deleteReport: (id) => {
        set((state) => ({
          reports: state.reports.filter((r) => r.id !== id),
        }));
      },

      setCurrentReport: (report) => {
        set({ currentReport: report });
      },

      // Schedule actions
      addSchedule: (schedule) => {
        const newSchedule: ScheduleConfig = {
          ...schedule,
          id: Date.now().toString(),
          nextRun: calculateNextRun(schedule.frequency),
        };
        set((state) => ({ schedules: [...state.schedules, newSchedule] }));
      },

      updateSchedule: (id, updates) => {
        set((state) => ({
          schedules: state.schedules.map((s) =>
            s.id === id ? { ...s, ...updates } : s
          ),
        }));
      },

      deleteSchedule: (id) => {
        set((state) => ({
          schedules: state.schedules.filter((s) => s.id !== id),
        }));
      },

      toggleSchedule: (id) => {
        set((state) => ({
          schedules: state.schedules.map((s) =>
            s.id === id ? { ...s, active: !s.active } : s
          ),
        }));
      },

      // Compliance actions
      addComplianceReport: (report) => {
        const newReport: ComplianceReport = {
          ...report,
          id: Date.now().toString(),
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        set((state) => ({ complianceReports: [...state.complianceReports, newReport] }));
      },

      updateComplianceReport: (id, updates) => {
        set((state) => ({
          complianceReports: state.complianceReports.map((r) =>
            r.id === id ? { ...r, ...updates, updatedAt: new Date() } : r
          ),
        }));
      },

      deleteComplianceReport: (id) => {
        set((state) => ({
          complianceReports: state.complianceReports.filter((r) => r.id !== id),
        }));
      },

      // Geographic actions
      addGeographicReport: (report) => {
        set((state) => ({ geographicReports: [...state.geographicReports, report] }));
      },

      updateGeographicReport: (id, updates) => {
        set((state) => ({
          geographicReports: state.geographicReports.map((r) =>
            r.id === id ? { ...r, ...updates } : r
          ),
        }));
      },

      deleteGeographicReport: (id) => {
        set((state) => ({
          geographicReports: state.geographicReports.filter((r) => r.id !== id),
        }));
      },

      // Utility actions
      setLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error }),

      exportData: (data, format) => {
        // Export logic will be handled by individual components
        console.log(`Exporting ${data.length} records as ${format}`);
      },

      generateReport: async (templateId, dataSource) => {
        const template = get().templates.find((t) => t.id === templateId);
        if (!template) {
          throw new Error('Template not found');
        }

        // Generate report data based on template and data source
        return {
          template: template,
          data: dataSource,
          generatedAt: new Date(),
          summary: {
            totalRecords: dataSource.length,
            componentsGenerated: template.components.length,
            dataPoints: dataSource.length,
          },
        };
      },

      validateCompliance: async (reportType, data) => {
        // UAE compliance validation logic
        const complianceRules = {
          UAE_VAT: ['tax_id', 'invoice_amount', 'vat_amount', 'tax_period'],
          UAE_CORP: ['company_info', 'financial_statements', 'shareholder_info'],
          UAE_LABOR: ['employee_data', 'working_hours', 'wages', 'benefits'],
          UAE_TRADE: ['import_export', 'customs_declarations', 'trade_licenses'],
          UAE_DATA_PROTECTION: ['data_subjects', 'processing_purposes', 'consent_records'],
        };

        const requiredFields = complianceRules[reportType as keyof typeof complianceRules] || [];
        return requiredFields.every(field => 
          data.some(row => row[field] !== undefined && row[field] !== null)
        );
      },
    }),
    {
      name: 'report-store',
      partialize: (state) => ({
        templates: state.templates,
        dashboards: state.dashboards,
        reports: state.reports,
        schedules: state.schedules,
        complianceReports: state.complianceReports,
        geographicReports: state.geographicReports,
      }),
    }
  )
);

// Helper function to calculate next run date for schedules
function calculateNextRun(frequency: ScheduleConfig['frequency']): Date {
  const now = new Date();
  switch (frequency) {
    case 'hourly':
      return new Date(now.getTime() + 60 * 60 * 1000);
    case 'daily':
      return new Date(now.getTime() + 24 * 60 * 60 * 1000);
    case 'weekly':
      return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    case 'monthly':
      return new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
    case 'quarterly':
      return new Date(now.getFullYear(), now.getMonth() + 3, now.getDate());
    case 'yearly':
      return new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
    default:
      return now;
  }
}

export { useReportStore };