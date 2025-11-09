import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';
import { 
  KPI, 
  Dashboard, 
  Widget, 
  Alert, 
  User, 
  UserPreferences, 
  RealtimeMessage,
  PerformanceMetrics,
  DataSource
} from '../types';
import { 
  KPIS, 
  ALERT_THRESHOLDS, 
  DATA_SOURCES,
  DEFAULT_DASHBOARDS,
  DATE_RANGES 
} from '../data/constants';
import { saveToStorage, loadFromStorage } from '../utils/helpers';

// KPI Store
interface KPIState {
  kpis: KPI[];
  isLoading: boolean;
  lastUpdated: Date | null;
  error: string | null;
  refreshInterval: number;
  realTimeEnabled: boolean;
}

interface KPIActions {
  updateKPI: (kpi: Partial<KPI> & { id: string }) => void;
  setKPIs: (kpis: KPI[]) => void;
  refreshKPIs: () => Promise<void>;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setRefreshInterval: (interval: number) => void;
  toggleRealTime: () => void;
  reset: () => void;
}

const useKPIStore = create<KPIState & KPIActions>()(
  devtools(
    subscribeWithSelector((set, get) => ({
      kpis: loadFromStorage('kpis', []),
      isLoading: false,
      lastUpdated: loadFromStorage('kpis-updated', null),
      error: null,
      refreshInterval: 30000, // 30 seconds
      realTimeEnabled: true,

      updateKPI: (kpiData) => {
        set((state) => {
          const updatedKpis = state.kpis.map(kpi => 
            kpi.id === kpiData.id 
              ? { ...kpi, ...kpiData, lastUpdated: new Date() }
              : kpi
          );
          saveToStorage('kpis', updatedKpis);
          return { 
            kpis: updatedKpis, 
            lastUpdated: new Date(),
            error: null 
          };
        });
      },

      setKPIs: (kpis) => {
        set((state) => {
          saveToStorage('kpis', kpis);
          return { kpis, lastUpdated: new Date() };
        });
      },

      refreshKPIs: async () => {
        set({ isLoading: true, error: null });
        try {
          // Simulate API call
          await new Promise(resolve => setTimeout(resolve, 1000));
          const updatedKPIs = KPIS.map(kpi => ({
            ...kpi,
            value: Math.random() * (kpi.target || 100000),
            trendPercentage: Math.random() * 20 - 10,
            trend: Math.random() > 0.5 ? 'up' : 'down' as const,
            lastUpdated: new Date()
          }));
          get().setKPIs(updatedKPIs);
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to refresh KPIs' });
        } finally {
          set({ isLoading: false });
        }
      },

      setLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error }),
      setRefreshInterval: (interval) => set({ refreshInterval: interval }),
      toggleRealTime: () => set((state) => ({ realTimeEnabled: !state.realTimeEnabled })),
      reset: () => set({
        kpis: [],
        isLoading: false,
        lastUpdated: null,
        error: null
      })
    }))
  )
);

// Dashboard Store
interface DashboardState {
  dashboards: Dashboard[];
  currentDashboard: Dashboard | null;
  isLoading: boolean;
  error: string | null;
  layoutMode: 'edit' | 'view';
  isPublic: boolean;
}

interface DashboardActions {
  setDashboards: (dashboards: Dashboard[]) => void;
  setCurrentDashboard: (dashboard: Dashboard | null) => void;
  addDashboard: (dashboard: Dashboard) => void;
  updateDashboard: (dashboardId: string, updates: Partial<Dashboard>) => void;
  deleteDashboard: (dashboardId: string) => void;
  addWidget: (dashboardId: string, widget: Widget) => void;
  updateWidget: (dashboardId: string, widgetId: string, updates: Partial<Widget>) => void;
  removeWidget: (dashboardId: string, widgetId: string) => void;
  setLayoutMode: (mode: 'edit' | 'view') => void;
  togglePublic: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

const useDashboardStore = create<DashboardState & DashboardActions>()(
  devtools(
    subscribeWithSelector((set, get) => ({
      dashboards: loadFromStorage('dashboards', [
        {
          id: 'default-executive',
          name: 'Executive Overview',
          description: 'High-level business insights for executives',
          userId: 'current-user',
          widgets: [],
          layout: [],
          isDefault: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          isPublic: false,
          tags: ['executive', 'overview']
        }
      ]),
      currentDashboard: null,
      isLoading: false,
      error: null,
      layoutMode: 'view',
      isPublic: false,

      setDashboards: (dashboards) => {
        saveToStorage('dashboards', dashboards);
        set({ dashboards });
      },

      setCurrentDashboard: (dashboard) => {
        set({ currentDashboard: dashboard });
        if (dashboard) {
          set({ isPublic: dashboard.isPublic });
        }
      },

      addDashboard: (dashboard) => {
        set((state) => {
          const newDashboards = [...state.dashboards, dashboard];
          saveToStorage('dashboards', newDashboards);
          return { dashboards: newDashboards };
        });
      },

      updateDashboard: (dashboardId, updates) => {
        set((state) => {
          const updatedDashboards = state.dashboards.map(dashboard =>
            dashboard.id === dashboardId
              ? { ...dashboard, ...updates, updatedAt: new Date() }
              : dashboard
          );
          saveToStorage('dashboards', updatedDashboards);
          
          const updatedCurrent = state.currentDashboard?.id === dashboardId
            ? { ...state.currentDashboard, ...updates, updatedAt: new Date() }
            : state.currentDashboard;
            
          return { 
            dashboards: updatedDashboards,
            currentDashboard: updatedCurrent
          };
        });
      },

      deleteDashboard: (dashboardId) => {
        set((state) => {
          const filteredDashboards = state.dashboards.filter(d => d.id !== dashboardId);
          const newCurrent = state.currentDashboard?.id === dashboardId
            ? null
            : state.currentDashboard;
          saveToStorage('dashboards', filteredDashboards);
          return { 
            dashboards: filteredDashboards,
            currentDashboard: newCurrent
          };
        });
      },

      addWidget: (dashboardId, widget) => {
        set((state) => {
          const updatedDashboards = state.dashboards.map(dashboard => {
            if (dashboard.id === dashboardId) {
              return {
                ...dashboard,
                widgets: [...dashboard.widgets, widget],
                updatedAt: new Date()
              };
            }
            return dashboard;
          });
          saveToStorage('dashboards', updatedDashboards);
          
          return { dashboards: updatedDashboards };
        });
      },

      updateWidget: (dashboardId, widgetId, updates) => {
        set((state) => {
          const updatedDashboards = state.dashboards.map(dashboard => {
            if (dashboard.id === dashboardId) {
              return {
                ...dashboard,
                widgets: dashboard.widgets.map(widget =>
                  widget.id === widgetId ? { ...widget, ...updates } : widget
                ),
                updatedAt: new Date()
              };
            }
            return dashboard;
          });
          saveToStorage('dashboards', updatedDashboards);
          
          return { dashboards: updatedDashboards };
        });
      },

      removeWidget: (dashboardId, widgetId) => {
        set((state) => {
          const updatedDashboards = state.dashboards.map(dashboard => {
            if (dashboard.id === dashboardId) {
              return {
                ...dashboard,
                widgets: dashboard.widgets.filter(widget => widget.id !== widgetId),
                updatedAt: new Date()
              };
            }
            return dashboard;
          });
          saveToStorage('dashboards', updatedDashboards);
          
          return { dashboards: updatedDashboards };
        });
      },

      setLayoutMode: (mode) => set({ layoutMode: mode }),
      togglePublic: () => set((state) => ({ isPublic: !state.isPublic })),
      setLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error }),
      reset: () => set({
        dashboards: [],
        currentDashboard: null,
        isLoading: false,
        error: null,
        layoutMode: 'view',
        isPublic: false
      })
    }))
  )
);

// Alert Store
interface AlertState {
  alerts: Alert[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  filter: 'all' | 'unread' | 'acknowledged' | 'resolved';
  severity: 'all' | 'info' | 'warning' | 'error' | 'success';
}

interface AlertActions {
  setAlerts: (alerts: Alert[]) => void;
  addAlert: (alert: Alert) => void;
  acknowledgeAlert: (alertId: string, userId: string) => void;
  resolveAlert: (alertId: string, userId: string) => void;
  dismissAlert: (alertId: string) => void;
  markAsRead: (alertId: string) => void;
  setFilter: (filter: 'all' | 'unread' | 'acknowledged' | 'resolved') => void;
  setSeverityFilter: (severity: 'all' | 'info' | 'warning' | 'error' | 'success') => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearAll: () => void;
}

const useAlertStore = create<AlertState & AlertActions>()(
  devtools(
    subscribeWithSelector((set, get) => ({
      alerts: loadFromStorage('alerts', Object.values(ALERT_THRESHOLDS)),
      unreadCount: 0,
      isLoading: false,
      error: null,
      filter: 'all',
      severity: 'all',

      setAlerts: (alerts) => {
        const unreadCount = alerts.filter(alert => !alert.acknowledged).length;
        set({ alerts, unreadCount });
      },

      addAlert: (alert) => {
        set((state) => {
          const newAlerts = [alert, ...state.alerts];
          const unreadCount = newAlerts.filter(a => !a.acknowledged).length;
          return { alerts: newAlerts, unreadCount };
        });
      },

      acknowledgeAlert: (alertId, userId) => {
        set((state) => {
          const updatedAlerts = state.alerts.map(alert =>
            alert.id === alertId
              ? { ...alert, acknowledged: true, acknowledgedBy: userId, acknowledgedAt: new Date() }
              : alert
          );
          const unreadCount = updatedAlerts.filter(alert => !alert.acknowledged).length;
          return { alerts: updatedAlerts, unreadCount };
        });
      },

      resolveAlert: (alertId, userId) => {
        set((state) => {
          const updatedAlerts = state.alerts.map(alert =>
            alert.id === alertId
              ? { ...alert, resolvedAt: new Date(), resolvedBy: userId }
              : alert
          );
          const unreadCount = updatedAlerts.filter(alert => !alert.acknowledged).length;
          return { alerts: updatedAlerts, unreadCount };
        });
      },

      dismissAlert: (alertId) => {
        set((state) => {
          const filteredAlerts = state.alerts.filter(alert => alert.id !== alertId);
          const unreadCount = filteredAlerts.filter(alert => !alert.acknowledged).length;
          return { alerts: filteredAlerts, unreadCount };
        });
      },

      markAsRead: (alertId) => {
        set((state) => {
          const updatedAlerts = state.alerts.map(alert =>
            alert.id === alertId ? { ...alert, acknowledged: true } : alert
          );
          const unreadCount = updatedAlerts.filter(alert => !alert.acknowledged).length;
          return { alerts: updatedAlerts, unreadCount };
        });
      },

      setFilter: (filter) => set({ filter }),
      setSeverityFilter: (severity) => set({ severity }),
      setLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error }),
      clearAll: () => set({ alerts: [], unreadCount: 0 })
    }))
  )
);

// User Store
interface UserState {
  user: User | null;
  preferences: UserPreferences;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

interface UserActions {
  setUser: (user: User | null) => void;
  updatePreferences: (preferences: Partial<UserPreferences>) => void;
  setAuthenticated: (authenticated: boolean) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  logout: () => void;
}

const defaultPreferences: UserPreferences = {
  theme: 'light',
  language: 'en',
  timezone: 'UTC',
  notifications: {
    email: true,
    push: true,
    inApp: true,
    frequency: 'immediate'
  },
  dashboardLayout: {
    widgets: [],
    layout: [],
    isCustom: false
  },
  defaultDateRange: {
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    end: new Date()
  },
  refreshInterval: 30000,
  exportFormat: 'pdf',
  glassmorphismIntensity: 0.1,
  animations: true
};

const useUserStore = create<UserState & UserActions>()(
  devtools(
    subscribeWithSelector((set, get) => ({
      user: loadFromStorage('user', null),
      preferences: loadFromStorage('user-preferences', defaultPreferences),
      isAuthenticated: false,
      isLoading: false,
      error: null,

      setUser: (user) => {
        set({ user });
        if (user) {
          saveToStorage('user', user);
        } else {
          saveToStorage('user', null);
        }
      },

      updatePreferences: (preferences) => {
        set((state) => {
          const updatedPreferences = { ...state.preferences, ...preferences };
          saveToStorage('user-preferences', updatedPreferences);
          return { preferences: updatedPreferences };
        });
      },

      setAuthenticated: (authenticated) => set({ isAuthenticated: authenticated }),
      setLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error }),
      logout: () => {
        set({
          user: null,
          preferences: defaultPreferences,
          isAuthenticated: false,
          error: null
        });
        saveToStorage('user', null);
        saveToStorage('user-preferences', defaultPreferences);
      }
    }))
  )
);

// Real-time Store
interface RealtimeState {
  isConnected: boolean;
  connections: RealtimeMessage[];
  isReconnecting: boolean;
  lastPing: Date | null;
  latency: number;
}

interface RealtimeActions {
  setConnected: (connected: boolean) => void;
  addConnection: (connection: RealtimeMessage) => void;
  removeConnection: (connectionId: string) => void;
  setReconnecting: (reconnecting: boolean) => void;
  updatePing: () => void;
  setLatency: (latency: number) => void;
  sendMessage: (message: RealtimeMessage) => void;
}

const useRealtimeStore = create<RealtimeState & RealtimeActions>()(
  devtools((set, get) => ({
    isConnected: false,
    connections: [],
    isReconnecting: false,
    lastPing: null,
    latency: 0,

    setConnected: (connected) => set({ isConnected: connected }),
    addConnection: (connection) => set((state) => ({
      connections: [...state.connections, connection]
    })),
    removeConnection: (connectionId) => set((state) => ({
      connections: state.connections.filter(conn => conn.id !== connectionId)
    })),
    setReconnecting: (reconnecting) => set({ isReconnecting: reconnecting }),
    updatePing: () => set({ lastPing: new Date() }),
    setLatency: (latency) => set({ latency }),
    sendMessage: (message) => {
      // Simulate sending message
      console.log('Sending message:', message);
    }
  }))
);

// Performance Store
interface PerformanceState {
  metrics: PerformanceMetrics | null;
  isRecording: boolean;
  history: PerformanceMetrics[];
}

interface PerformanceActions {
  setMetrics: (metrics: PerformanceMetrics) => void;
  startRecording: () => void;
  stopRecording: () => void;
  addToHistory: (metrics: PerformanceMetrics) => void;
  clearHistory: () => void;
}

const usePerformanceStore = create<PerformanceState & PerformanceActions>()(
  devtools((set, get) => ({
    metrics: null,
    isRecording: false,
    history: [],

    setMetrics: (metrics) => set({ metrics }),
    startRecording: () => set({ isRecording: true }),
    stopRecording: () => set({ isRecording: false }),
    addToHistory: (metrics) => set((state) => ({
      history: [...state.history.slice(-99), metrics] // Keep last 100 entries
    })),
    clearHistory: () => set({ history: [] })
  }))
);

// Export Store
interface ExportState {
  isExporting: boolean;
  progress: number;
  lastExport: Date | null;
  error: string | null;
  exportHistory: Array<{
    id: string;
    type: string;
    format: string;
    timestamp: Date;
    status: 'success' | 'error' | 'pending';
  }>;
}

interface ExportActions {
  setExporting: (exporting: boolean) => void;
  setProgress: (progress: number) => void;
  setLastExport: (timestamp: Date) => void;
  setError: (error: string | null) => void;
  addToHistory: (exportItem: ExportState['exportHistory'][0]) => void;
  removeFromHistory: (exportId: string) => void;
  clearHistory: () => void;
}

const useExportStore = create<ExportState & ExportActions>()(
  devtools((set, get) => ({
    isExporting: false,
    progress: 0,
    lastExport: null,
    error: null,
    exportHistory: loadFromStorage('export-history', []),

    setExporting: (exporting) => set({ isExporting: exporting }),
    setProgress: (progress) => set({ progress }),
    setLastExport: (timestamp) => set({ lastExport: timestamp }),
    setError: (error) => set({ error }),
    addToHistory: (exportItem) => set((state) => {
      const newHistory = [exportItem, ...state.exportHistory.slice(0, 49)]; // Keep last 50
      saveToStorage('export-history', newHistory);
      return { exportHistory: newHistory };
    }),
    removeFromHistory: (exportId) => set((state) => {
      const filteredHistory = state.exportHistory.filter(exp => exp.id !== exportId);
      saveToStorage('export-history', filteredHistory);
      return { exportHistory: filteredHistory };
    }),
    clearHistory: () => set({ exportHistory: [] })
  }))
);

// Integration Store
interface IntegrationState {
  dataSources: DataSource[];
  isLoading: boolean;
  error: string | null;
  lastSync: Date | null;
  isSyncing: boolean;
}

interface IntegrationActions {
  setDataSources: (dataSources: DataSource[]) => void;
  updateDataSource: (id: string, updates: Partial<DataSource>) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setLastSync: (timestamp: Date) => void;
  setSyncing: (syncing: boolean) => void;
  triggerSync: (dataSourceId: string) => Promise<void>;
}

const useIntegrationStore = create<IntegrationState & IntegrationActions>()(
  devtools((set, get) => ({
    dataSources: DATA_SOURCES,
    isLoading: false,
    error: null,
    lastSync: null,
    isSyncing: false,

    setDataSources: (dataSources) => set({ dataSources }),
    updateDataSource: (id, updates) => set((state) => ({
      dataSources: state.dataSources.map(ds => 
        ds.id === id ? { ...ds, ...updates } : ds
      )
    })),
    setLoading: (loading) => set({ isLoading: loading }),
    setError: (error) => set({ error }),
    setLastSync: (timestamp) => set({ lastSync: timestamp }),
    setSyncing: (syncing) => set({ isSyncing: syncing }),
    triggerSync: async (dataSourceId) => {
      set({ isSyncing: true, error: null });
      try {
        // Simulate sync operation
        await new Promise(resolve => setTimeout(resolve, 2000));
        set({ lastSync: new Date() });
      } catch (error) {
        set({ error: error instanceof Error ? error.message : 'Sync failed' });
      } finally {
        set({ isSyncing: false });
      }
    }
  }))
);

// Export all stores
export {
  useKPIStore,
  useDashboardStore,
  useAlertStore,
  useUserStore,
  useRealtimeStore,
  usePerformanceStore,
  useExportStore,
  useIntegrationStore
};