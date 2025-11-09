import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { 
  DashboardMetrics, 
  Employee, 
  Order, 
  PerformanceMetric, 
  SystemAlert,
  FilterOptions,
  KPI
} from '../types';

// UI State
interface UIState {
  sidebarOpen: boolean;
  theme: 'light' | 'dark';
  loading: boolean;
  error: string | null;
  notifications: Notification[];
}

interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}

interface UIStore extends UIState {
  toggleSidebar: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  markNotificationAsRead: (id: string) => void;
  clearNotifications: () => void;
  clearError: () => void;
}

// Data State
interface DataState {
  dashboardMetrics: DashboardMetrics | null;
  employees: Employee[];
  orders: Order[];
  performanceMetrics: PerformanceMetric[];
  systemAlerts: SystemAlert[];
  kpis: KPI[];
  filters: FilterOptions;
  lastUpdated: string | null;
}

interface DataStore extends DataState {
  setDashboardMetrics: (metrics: DashboardMetrics) => void;
  setEmployees: (employees: Employee[]) => void;
  setOrders: (orders: Order[]) => void;
  setPerformanceMetrics: (metrics: PerformanceMetric[]) => void;
  setSystemAlerts: (alerts: SystemAlert[]) => void;
  setKpis: (kpis: KPI[]) => void;
  setFilters: (filters: FilterOptions) => void;
  updateLastUpdated: () => void;
}

// Filter State
interface FilterState {
  activeFilters: FilterOptions;
  presetFilters: Record<string, FilterOptions>;
  setActiveFilters: (filters: FilterOptions) => void;
  savePresetFilter: (name: string, filters: FilterOptions) => void;
  loadPresetFilter: (name: string) => void;
  resetFilters: () => void;
}

// Analytics State
interface AnalyticsState {
  selectedTimeRange: '1d' | '7d' | '30d' | '90d' | '1y';
  selectedDepartment: string | null;
  selectedEmployee: string | null;
  isRealTimeEnabled: boolean;
  refreshInterval: number;
  chartType: 'line' | 'bar' | 'area' | 'pie' | 'doughnut';
  setTimeRange: (range: '1d' | '7d' | '30d' | '90d' | '1y') => void;
  setDepartment: (department: string | null) => void;
  setEmployee: (employee: string | null) => void;
  toggleRealTime: () => void;
  setRefreshInterval: (interval: number) => void;
  setChartType: (type: 'line' | 'bar' | 'area' | 'pie' | 'doughnut') => void;
}

// Dashboard State
interface DashboardState {
  widgets: DashboardWidget[];
  layout: string;
  isEditMode: boolean;
  autoRefresh: boolean;
  refreshRate: number;
  addWidget: (widget: DashboardWidget) => void;
  removeWidget: (id: string) => void;
  updateWidget: (id: string, updates: Partial<DashboardWidget>) => void;
  setLayout: (layout: string) => void;
  setEditMode: (editMode: boolean) => void;
  toggleAutoRefresh: () => void;
  setRefreshRate: (rate: number) => void;
}

interface DashboardWidget {
  id: string;
  type: 'metric' | 'chart' | 'table' | 'alert' | 'gauge' | 'progress';
  title: string;
  position: { x: number; y: number; w: number; h: number };
  config: any;
  dataSource: string;
  refreshInterval?: number;
  lastUpdated?: string;
  enabled: boolean;
}

// Initialize default filters
const defaultFilters: FilterOptions = {
  dateRange: {
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    end: new Date(),
  },
  departments: [],
  employees: [],
  categories: [],
  status: [],
  priority: [],
  location: undefined,
};

// Create stores
const useUIStore = create<UIStore>()(
  devtools(
    (set) => ({
      // Initial state
      sidebarOpen: true,
      theme: 'dark',
      loading: false,
      error: null,
      notifications: [],

      // Actions
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setTheme: (theme) => set({ theme }),
      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),
      
      addNotification: (notification) => set((state) => ({
        notifications: [
          {
            ...notification,
            id: `notification_${Date.now()}_${Math.random()}`,
            timestamp: new Date().toISOString(),
            read: false,
          },
          ...state.notifications,
        ],
      })),
      
      markNotificationAsRead: (id) => set((state) => ({
        notifications: state.notifications.map(notif =>
          notif.id === id ? { ...notif, read: true } : notif
        ),
      })),
      
      clearNotifications: () => set({ notifications: [] }),
      clearError: () => set({ error: null }),
    }),
    {
      name: 'ui-store',
    }
  )
);

const useDataStore = create<DataStore>()(
  devtools(
    (set) => ({
      // Initial state
      dashboardMetrics: null,
      employees: [],
      orders: [],
      performanceMetrics: [],
      systemAlerts: [],
      kpis: [],
      filters: defaultFilters,
      lastUpdated: null,

      // Actions
      setDashboardMetrics: (metrics) => set({ dashboardMetrics: metrics }),
      setEmployees: (employees) => set({ employees }),
      setOrders: (orders) => set({ orders }),
      setPerformanceMetrics: (performanceMetrics) => set({ performanceMetrics }),
      setSystemAlerts: (systemAlerts) => set({ systemAlerts }),
      setKpis: (kpis) => set({ kpis }),
      setFilters: (filters) => set({ filters }),
      updateLastUpdated: () => set({ lastUpdated: new Date().toISOString() }),
    }),
    {
      name: 'data-store',
    }
  )
);

const useFilterStore = create<FilterState>()(
  devtools(
    (set) => ({
      // Initial state
      activeFilters: defaultFilters,
      presetFilters: {
        'Last 7 Days': {
          ...defaultFilters,
          dateRange: {
            start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            end: new Date(),
          },
        },
        'Last 30 Days': {
          ...defaultFilters,
          dateRange: {
            start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            end: new Date(),
          },
        },
        'This Quarter': {
          ...defaultFilters,
          dateRange: {
            start: new Date(new Date().getFullYear(), Math.floor(new Date().getMonth() / 3) * 3, 1),
            end: new Date(),
          },
        },
      },

      // Actions
      setActiveFilters: (filters) => set({ activeFilters: filters }),
      savePresetFilter: (name, filters) => set((state) => ({
        presetFilters: {
          ...state.presetFilters,
          [name]: filters,
        },
      })),
      loadPresetFilter: (name) => set((state) => ({
        activeFilters: state.presetFilters[name] || defaultFilters,
      })),
      resetFilters: () => set({ activeFilters: defaultFilters }),
    }),
    {
      name: 'filter-store',
    }
  )
);

const useAnalyticsStore = create<AnalyticsState>()(
  devtools(
    (set) => ({
      // Initial state
      selectedTimeRange: '30d',
      selectedDepartment: null,
      selectedEmployee: null,
      isRealTimeEnabled: false,
      refreshInterval: 30000, // 30 seconds
      chartType: 'line',

      // Actions
      setTimeRange: (range) => set({ selectedTimeRange: range }),
      setDepartment: (department) => set({ selectedDepartment: department }),
      setEmployee: (employee) => set({ selectedEmployee: employee }),
      toggleRealTime: () => set((state) => ({ isRealTimeEnabled: !state.isRealTimeEnabled })),
      setRefreshInterval: (interval) => set({ refreshInterval: interval }),
      setChartType: (type) => set({ chartType: type }),
    }),
    {
      name: 'analytics-store',
    }
  )
);

const useDashboardStore = create<DashboardState>()(
  devtools(
    (set) => ({
      // Initial state
      widgets: [
        {
          id: 'metrics_overview',
          type: 'metric',
          title: 'Key Performance Indicators',
          position: { x: 0, y: 0, w: 12, h: 4 },
          config: { showChange: true, showTarget: true },
          dataSource: 'dashboardMetrics',
          enabled: true,
        },
        {
          id: 'orders_chart',
          type: 'chart',
          title: 'Order Trends',
          position: { x: 0, y: 4, w: 8, h: 6 },
          config: { chartType: 'line', timeRange: '30d' },
          dataSource: 'orders',
          refreshInterval: 60000,
          enabled: true,
        },
        {
          id: 'performance_chart',
          type: 'chart',
          title: 'Employee Performance',
          position: { x: 8, y: 4, w: 4, h: 6 },
          config: { chartType: 'bar', metricType: 'efficiency' },
          dataSource: 'performanceMetrics',
          refreshInterval: 120000,
          enabled: true,
        },
        {
          id: 'alerts_table',
          type: 'table',
          title: 'System Alerts',
          position: { x: 0, y: 10, w: 12, h: 4 },
          config: { showOnlyUnresolved: true, limit: 10 },
          dataSource: 'systemAlerts',
          refreshInterval: 30000,
          enabled: true,
        },
        {
          id: 'resource_utilization',
          type: 'gauge',
          title: 'Resource Utilization',
          position: { x: 0, y: 14, w: 6, h: 4 },
          config: { showTarget: true, target: 80 },
          dataSource: 'resourceUtilization',
          refreshInterval: 180000,
          enabled: true,
        },
        {
          id: 'quality_score',
          type: 'progress',
          title: 'Quality Score',
          position: { x: 6, y: 14, w: 6, h: 4 },
          config: { showTrend: true, target: 95 },
          dataSource: 'qualityMetrics',
          refreshInterval: 240000,
          enabled: true,
        },
      ],
      layout: 'grid',
      isEditMode: false,
      autoRefresh: true,
      refreshRate: 60000,

      // Actions
      addWidget: (widget) => set((state) => ({ 
        widgets: [...state.widgets, widget] 
      })),
      
      removeWidget: (id) => set((state) => ({ 
        widgets: state.widgets.filter(widget => widget.id !== id) 
      })),
      
      updateWidget: (id, updates) => set((state) => ({
        widgets: state.widgets.map(widget =>
          widget.id === id ? { ...widget, ...updates } : widget
        ),
      })),
      
      setLayout: (layout) => set({ layout }),
      setEditMode: (editMode) => set({ isEditMode: editMode }),
      toggleAutoRefresh: () => set((state) => ({ autoRefresh: !state.autoRefresh })),
      setRefreshRate: (rate) => set({ refreshRate: rate }),
    }),
    {
      name: 'dashboard-store',
    }
  )
);

export { useUIStore, useDataStore, useFilterStore, useAnalyticsStore, useDashboardStore };

// Export all store types
export type {
  UIStore,
  DataStore,
  FilterState,
  AnalyticsState,
  DashboardState,
};