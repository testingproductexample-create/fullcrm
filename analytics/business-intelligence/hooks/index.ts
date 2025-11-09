import { useState, useEffect, useCallback, useMemo } from 'react';
import { useKPIStore, useDashboardStore, useAlertStore, useUserStore, useRealtimeStore } from '../stores/dashboardStore';
import { services } from '../services/apiService';
import { KPI, Dashboard, Widget, Alert, UserPreferences, RealtimeMessage } from '../types';
import { debounce } from '../utils/helpers';

// KPI Hooks
export const useKPIs = () => {
  const { kpis, isLoading, error, lastUpdated, refreshInterval, realTimeEnabled } = useKPIStore();
  const { refreshKPIs, setRefreshInterval, toggleRealTime } = useKPIStore();

  const [refreshing, setRefreshing] = useState(false);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshKPIs();
    } finally {
      setRefreshing(false);
    }
  }, [refreshKPIs]);

  // Auto refresh KPIs
  useEffect(() => {
    if (!realTimeEnabled) return;

    const interval = setInterval(() => {
      refresh();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [refresh, refreshInterval, realTimeEnabled]);

  // Get KPIs by category
  const getKPIsByCategory = useCallback((category: string) => {
    return kpis.filter(kpi => kpi.category === category);
  }, [kpis]);

  // Get single KPI
  const getKPI = useCallback((id: string) => {
    return kpis.find(kpi => kpi.id === id);
  }, [kpis]);

  return {
    kpis,
    isLoading,
    error,
    lastUpdated,
    refreshing,
    refresh,
    getKPIsByCategory,
    getKPI,
    setRefreshInterval,
    toggleRealTime,
    realTimeEnabled
  };
};

export const useKPI = (kpiId: string) => {
  const { getKPI } = useKPIs();
  const kpi = useMemo(() => getKPI(kpiId), [getKPI, kpiId]);
  return kpi;
};

// Dashboard Hooks
export const useDashboards = () => {
  const { dashboards, currentDashboard, isLoading, error, layoutMode, isPublic } = useDashboardStore();
  const { 
    setCurrentDashboard, 
    addDashboard, 
    updateDashboard, 
    deleteDashboard, 
    setLayoutMode, 
    togglePublic 
  } = useDashboardStore();

  const createDashboard = useCallback(async (dashboardData: Omit<Dashboard, 'id' | 'createdAt' | 'updatedAt'>) => {
    const dashboard = await services.dashboard.createDashboard(dashboardData);
    addDashboard(dashboard);
    return dashboard;
  }, [addDashboard]);

  const duplicateDashboard = useCallback(async (dashboardId: string, name: string) => {
    const dashboard = await services.dashboard.duplicateDashboard(dashboardId, name);
    addDashboard(dashboard);
    return dashboard;
  }, [addDashboard]);

  const shareDashboard = useCallback(async (dashboardId: string, isPublic: boolean) => {
    const dashboard = await services.dashboard.shareDashboard(dashboardId, isPublic);
    updateDashboard(dashboardId, { isPublic });
    return dashboard;
  }, [updateDashboard]);

  return {
    dashboards,
    currentDashboard,
    isLoading,
    error,
    layoutMode,
    isPublic,
    setCurrentDashboard,
    addDashboard,
    updateDashboard,
    deleteDashboard,
    createDashboard,
    duplicateDashboard,
    shareDashboard,
    setLayoutMode,
    togglePublic
  };
};

export const useDashboard = (dashboardId?: string) => {
  const { currentDashboard, setCurrentDashboard } = useDashboards();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!dashboardId) return;

    const loadDashboard = async () => {
      setLoading(true);
      setError(null);
      try {
        const dashboard = await services.dashboard.getDashboard(dashboardId);
        setCurrentDashboard(dashboard);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, [dashboardId, setCurrentDashboard]);

  return { dashboard: currentDashboard, loading, error };
};

// Widget Hooks
export const useWidget = (widgetId: string) => {
  const { currentDashboard } = useDashboards();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const widget = useMemo(() => {
    if (!currentDashboard) return null;
    return currentDashboard.widgets.find(w => w.id === widgetId);
  }, [currentDashboard, widgetId]);

  const refreshData = useCallback(async () => {
    if (!widget) return;

    setLoading(true);
    setError(null);
    try {
      const widgetData = await services.widget.getWidgetData(widget);
      setData(widgetData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load widget data');
    } finally {
      setLoading(false);
    }
  }, [widget]);

  useEffect(() => {
    if (widget) {
      refreshData();
    }
  }, [widget, refreshData]);

  return {
    widget,
    data,
    loading,
    error,
    refreshData
  };
};

export const useWidgetData = (widget: Widget) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const widgetData = await services.widget.getWidgetData(widget);
      setData(widgetData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load widget data');
    } finally {
      setLoading(false);
    }
  }, [widget]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Auto refresh based on widget configuration
  useEffect(() => {
    if (!widget.refreshInterval) return;

    const interval = setInterval(fetchData, widget.refreshInterval * 1000);
    return () => clearInterval(interval);
  }, [fetchData, widget.refreshInterval]);

  return { data, loading, error, refetch: fetchData };
};

// Alert Hooks
export const useAlerts = () => {
  const { alerts, unreadCount, isLoading, error, filter, severity } = useAlertStore();
  const { 
    setFilter, 
    setSeverityFilter, 
    acknowledgeAlert, 
    resolveAlert, 
    dismissAlert, 
    markAsRead 
  } = useAlertStore();

  const filteredAlerts = useMemo(() => {
    return alerts.filter(alert => {
      const matchesFilter = 
        filter === 'all' ||
        (filter === 'unread' && !alert.acknowledged) ||
        (filter === 'acknowledged' && alert.acknowledged) ||
        (filter === 'resolved' && alert.resolvedAt);

      const matchesSeverity = 
        severity === 'all' || alert.severity === severity;

      return matchesFilter && matchesSeverity;
    });
  }, [alerts, filter, severity]);

  const handleAcknowledge = useCallback(async (alertId: string) => {
    try {
      await services.alert.acknowledgeAlert(alertId);
      acknowledgeAlert(alertId, 'current-user');
    } catch (error) {
      console.error('Failed to acknowledge alert:', error);
    }
  }, [acknowledgeAlert]);

  const handleResolve = useCallback(async (alertId: string) => {
    try {
      await services.alert.resolveAlert(alertId);
      resolveAlert(alertId, 'current-user');
    } catch (error) {
      console.error('Failed to resolve alert:', error);
    }
  }, [resolveAlert]);

  return {
    alerts: filteredAlerts,
    unreadCount,
    isLoading,
    error,
    filter,
    severity,
    setFilter,
    setSeverityFilter,
    acknowledge: handleAcknowledge,
    resolve: handleResolve,
    dismiss: dismissAlert,
    markAsRead
  };
};

// User and Preferences Hooks
export const useUser = () => {
  const { user, isAuthenticated, setUser, logout } = useUserStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadUser = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const currentUser = await services.user.getCurrentUser();
      setUser(currentUser);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load user');
    } finally {
      setLoading(false);
    }
  }, [setUser]);

  useEffect(() => {
    if (!user) {
      loadUser();
    }
  }, [user, loadUser]);

  return {
    user,
    isAuthenticated: !!user,
    loading,
    error,
    loadUser,
    logout
  };
};

export const usePreferences = () => {
  const { preferences, updatePreferences } = useUserStore();

  const updatePreference = useCallback(<K extends keyof UserPreferences>(
    key: K,
    value: UserPreferences[K]
  ) => {
    updatePreferences({ [key]: value });
  }, [updatePreferences]);

  const resetPreferences = useCallback(() => {
    // This would typically call an API to reset preferences
    console.log('Resetting preferences to defaults');
  }, []);

  return {
    preferences,
    updatePreference,
    resetPreferences
  };
};

// Real-time Hooks
export const useRealTime = () => {
  const { 
    isConnected, 
    connections, 
    isReconnecting, 
    lastPing, 
    latency,
    setConnected,
    addConnection,
    removeConnection,
    setReconnecting,
    updatePing,
    setLatency,
    sendMessage
  } = useRealtimeStore();

  useEffect(() => {
    // Connect to WebSocket
    services.realtime.connect();

    // Set up event listeners
    const handleConnect = () => setConnected(true);
    const handleDisconnect = () => setConnected(false);
    const handleReconnect = () => setReconnecting(true);
    const handleMessage = (message: RealtimeMessage) => {
      addConnection(message);
    };

    services.realtime.subscribe('connected', handleConnect);
    services.realtime.subscribe('disconnected', handleDisconnect);
    services.realtime.subscribe('reconnecting', handleReconnect);
    services.realtime.subscribe('message', handleMessage);

    return () => {
      // Cleanup
      services.realtime.disconnect();
    };
  }, [setConnected, setReconnecting, addConnection]);

  const subscribe = useCallback((event: string, callback: Function) => {
    services.realtime.subscribe(event, callback);
    return () => services.realtime.unsubscribe(event, callback);
  }, []);

  const ping = useCallback(() => {
    const start = services.realtime.ping();
    const pingCheck = setTimeout(() => {
      setLatency(Date.now() - start);
    }, 100);
    return pingCheck;
  }, [setLatency]);

  return {
    isConnected,
    connections,
    isReconnecting,
    lastPing,
    latency,
    subscribe,
    sendMessage,
    ping
  };
};

// Export Hooks
export const useExport = () => {
  const { 
    isExporting, 
    progress, 
    lastExport, 
    error, 
    exportHistory,
    setExporting,
    setProgress,
    setLastExport,
    setError,
    addToHistory
  } = useKPIStore() as any; // Use export store when available

  const exportDashboard = useCallback(async (request: any) => {
    setExporting(true);
    setProgress(0);
    setError(null);

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 500);

      const blob = await services.export.exportDashboard(request);
      clearInterval(progressInterval);
      setProgress(100);

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `dashboard-${request.dashboardId}.${request.config.format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      setLastExport(new Date());
      
      addToHistory({
        id: Date.now().toString(),
        type: 'dashboard',
        format: request.config.format,
        timestamp: new Date(),
        status: 'success'
      });

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed');
    } finally {
      setExporting(false);
    }
  }, [setExporting, setProgress, setError, setLastExport, addToHistory]);

  return {
    exportDashboard,
    isExporting,
    progress,
    lastExport,
    error,
    exportHistory
  };
};

// Custom Chart Hook
export const useChartData = (data: any[], xField: string, yField: string, options?: any) => {
  const chartData = useMemo(() => {
    if (!data || data.length === 0) {
      return { labels: [], datasets: [] };
    }

    const labels = data.map(item => item[xField]);
    const datasets = [{
      label: yField,
      data: data.map(item => item[yField]),
      ...options
    }];

    return { labels, datasets };
  }, [data, xField, yField, options]);

  return chartData;
};

// Filter Hook
export const useFilters = (initialFilters: any[] = []) => {
  const [filters, setFilters] = useState(initialFilters);
  const [activeFilters, setActiveFilters] = useState<any[]>([]);

  const addFilter = useCallback((filter: any) => {
    setFilters(prev => [...prev, filter]);
  }, []);

  const removeFilter = useCallback((filterId: string) => {
    setFilters(prev => prev.filter(f => f.id !== filterId));
    setActiveFilters(prev => prev.filter(f => f.id !== filterId));
  }, []);

  const updateFilter = useCallback((filterId: string, updates: any) => {
    setFilters(prev => prev.map(f => f.id === filterId ? { ...f, ...updates } : f));
    setActiveFilters(prev => prev.map(f => f.id === filterId ? { ...f, ...updates } : f));
  }, []);

  const applyFilters = useCallback(() => {
    const applied = filters.filter(f => f.value !== undefined && f.value !== null);
    setActiveFilters(applied);
  }, [filters]);

  const clearFilters = useCallback(() => {
    setActiveFilters([]);
  }, []);

  const debouncedApplyFilters = useMemo(
    () => debounce(applyFilters, 300),
    [applyFilters]
  );

  return {
    filters,
    activeFilters,
    addFilter,
    removeFilter,
    updateFilter,
    applyFilters: debouncedApplyFilters,
    clearFilters
  };
};

// Data Fetching Hook
export const useData = <T>(
  fetchFn: () => Promise<T>,
  dependencies: any[] = [],
  options: {
    enabled?: boolean;
    refetchInterval?: number;
    staleTime?: number;
  } = {}
) => {
  const { enabled = true, refetchInterval, staleTime = 5 * 60 * 1000 } = options;
  
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFetch, setLastFetch] = useState<Date | null>(null);

  const fetchData = useCallback(async () => {
    if (!enabled) return;
    if (staleTime && lastFetch && Date.now() - lastFetch.getTime() < staleTime) {
      return; // Skip if data is still fresh
    }

    setLoading(true);
    setError(null);
    try {
      const result = await fetchFn();
      setData(result);
      setLastFetch(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  }, [fetchFn, enabled, staleTime, lastFetch]);

  useEffect(() => {
    fetchData();
  }, [fetchData, ...dependencies]);

  useEffect(() => {
    if (!refetchInterval) return;

    const interval = setInterval(fetchData, refetchInterval);
    return () => clearInterval(interval);
  }, [fetchData, refetchInterval]);

  const refetch = useCallback(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch, lastFetch };
};

// Performance Hook
export const usePerformance = () => {
  const [metrics, setMetrics] = useState<any>(null);
  const [recording, setRecording] = useState(false);

  const startRecording = useCallback(() => {
    setRecording(true);
    // Start performance monitoring
    const interval = setInterval(() => {
      // Simulate performance metrics
      const newMetrics = {
        loadTime: Math.random() * 2000,
        renderTime: Math.random() * 1000,
        dataLoadTime: Math.random() * 500,
        memoryUsage: Math.random() * 100,
        timestamp: new Date()
      };
      setMetrics(newMetrics);
    }, 1000);

    return interval;
  }, []);

  const stopRecording = useCallback((intervalId: NodeJS.Timeout) => {
    setRecording(false);
    clearInterval(intervalId);
  }, []);

  return {
    metrics,
    recording,
    startRecording,
    stopRecording
  };
};

// Window Size Hook
export const useWindowSize = () => {
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0
  });

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return windowSize;
};

// Debounced Value Hook
export const useDebouncedValue = <T>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// Local Storage Hook
export const useLocalStorage = <T>(key: string, initialValue: T) => {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = useCallback((value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  }, [key, storedValue]);

  const removeValue = useCallback(() => {
    try {
      window.localStorage.removeItem(key);
      setStoredValue(initialValue);
    } catch (error) {
      console.error(`Error removing localStorage key "${key}":`, error);
    }
  }, [key, initialValue]);

  return [storedValue, setValue, removeValue] as const;
};