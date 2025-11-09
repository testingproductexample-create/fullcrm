import React, { useState, useEffect, useCallback } from 'react';
import { GridLayout, Layout } from 'react-grid-layout';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Settings, 
  Share, 
  Download, 
  Plus, 
  Filter, 
  Maximize2, 
  Minimize2,
  RefreshCw,
  Bell,
  BarChart3,
  Users,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';
import { useDashboards, useKPIs, useAlerts, useRealTime } from '../hooks';
import { 
  Dashboard, 
  Widget, 
  WidgetType, 
  VisualizationType 
} from '../types';
import { GLASSMORPHISM } from '../data/constants';
import { 
  formatDate, 
  cn, 
  generateId 
} from '../utils/helpers';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

// Widget Components
import { KPIWidget } from './widgets/KPIWidget';
import { ChartWidget } from './widgets/ChartWidget';
import { TableWidget } from './widgets/TableWidget';
import { AlertWidget } from './widgets/AlertWidget';
import { GaugeWidget } from './widgets/GaugeWidget';
import { ProgressWidget } from './widgets/ProgressWidget';
import { WidgetSelector } from './WidgetSelector';
import { FilterPanel } from './FilterPanel';
import { ExportModal } from './ExportModal';
import { ShareModal } from './ShareModal';
import { SettingsPanel } from './SettingsPanel';

interface DashboardComponentProps {
  dashboardId?: string;
  isEditMode?: boolean;
  onDashboardChange?: (dashboard: Dashboard) => void;
}

export const DashboardComponent: React.FC<DashboardComponentProps> = ({
  dashboardId,
  isEditMode = false,
  onDashboardChange
}) => {
  const {
    dashboards,
    currentDashboard,
    layoutMode,
    isPublic,
    setCurrentDashboard,
    setLayoutMode,
    togglePublic,
    addWidget,
    updateWidget,
    removeWidget
  } = useDashboards();

  const { kpis, refreshing, refresh, realTimeEnabled } = useKPIs();
  const { alerts, unreadCount } = useAlerts();
  const { isConnected, subscribe } = useRealTime();

  const [selectedWidgets, setSelectedWidgets] = useState<string[]>([]);
  const [showWidgetSelector, setShowWidgetSelector] = useState(false);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [filterValues, setFilterValues] = useState<Record<string, any>>({});

  // Load dashboard on mount
  useEffect(() => {
    if (dashboardId && dashboards.length > 0) {
      const dashboard = dashboards.find(d => d.id === dashboardId);
      if (dashboard) {
        setCurrentDashboard(dashboard);
      }
    }
  }, [dashboardId, dashboards, setCurrentDashboard]);

  // Set edit mode
  useEffect(() => {
    if (isEditMode) {
      setLayoutMode('edit');
    }
  }, [isEditMode, setLayoutMode]);

  // Real-time updates
  useEffect(() => {
    const unsubscribe = subscribe('kpi_update', (kpiData: any) => {
      console.log('KPI update received:', kpiData);
    });

    const unsubscribeAlert = subscribe('alert', (alertData: any) => {
      console.log('Alert received:', alertData);
    });

    return () => {
      unsubscribe();
      unsubscribeAlert();
    };
  }, [subscribe]);

  // Handle layout changes
  const handleLayoutChange = useCallback((layout: Layout[], layouts: { [key: string]: Layout[] }) => {
    if (!currentDashboard || layoutMode !== 'edit') return;

    const updatedLayout = currentDashboard.layout.map(item => {
      const newLayoutItem = layout.find(l => l.i === item.i);
      if (newLayoutItem) {
        return {
          x: newLayoutItem.x,
          y: newLayoutItem.y,
          w: newLayoutItem.w,
          h: newLayoutItem.h,
          i: newLayoutItem.i
        };
      }
      return item;
    });

    // Update dashboard layout
    updateWidget(currentDashboard.id, currentDashboard.widgets[0]?.id || '', {
      // This would update the layout in the store
    });
  }, [currentDashboard, layoutMode, updateWidget]);

  // Add widget
  const handleAddWidget = useCallback((widget: Omit<Widget, 'id' | 'position'>) => {
    if (!currentDashboard) return;

    const newWidget: Widget = {
      ...widget,
      id: generateId(),
      position: { x: 0, y: 0 }
    };

    addWidget(currentDashboard.id, newWidget);
    setShowWidgetSelector(false);
  }, [currentDashboard, addWidget]);

  // Remove widget
  const handleRemoveWidget = useCallback((widgetId: string) => {
    if (!currentDashboard) return;

    removeWidget(currentDashboard.id, widgetId);
    setSelectedWidgets(prev => prev.filter(id => id !== widgetId));
  }, [currentDashboard, removeWidget]);

  // Export dashboard
  const handleExport = useCallback(() => {
    setShowExportModal(true);
  }, []);

  // Share dashboard
  const handleShare = useCallback(() => {
    setShowShareModal(true);
  }, []);

  // Toggle fullscreen
  const toggleFullscreen = useCallback(() => {
    setIsFullscreen(prev => !prev);
  }, []);

  // Refresh dashboard
  const handleRefresh = useCallback(async () => {
    await refresh();
  }, [refresh]);

  // Auto-refresh
  useEffect(() => {
    if (!realTimeEnabled) return;

    const interval = setInterval(handleRefresh, 30000); // 30 seconds
    return () => clearInterval(interval);
  }, [handleRefresh, realTimeEnabled]);

  if (!currentDashboard) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">No Dashboard Selected</h3>
          <p className="text-gray-500">Select a dashboard to view or create a new one.</p>
        </div>
      </div>
    );
  }

  const widgetComponents = {
    kpi: KPIWidget,
    chart: ChartWidget,
    table: TableWidget,
    gauge: GaugeWidget,
    progress: ProgressWidget,
    alerts: AlertWidget
  };

  return (
    <div className={cn(
      "min-h-screen bg-gradient-to-br from-slate-50 to-slate-100",
      isFullscreen && "fixed inset-0 z-50 bg-white",
      "backdrop-blur-sm"
    )}>
      {/* Header */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className={cn(
          "bg-white/10 backdrop-blur-md border-b border-white/20",
          "p-4 shadow-sm"
        )}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <BarChart3 className="w-6 h-6 text-blue-600" />
              <h1 className="text-xl font-bold text-gray-800">
                {currentDashboard.name}
              </h1>
              {isConnected && (
                <div className="flex items-center space-x-1 text-green-600">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-xs">Live</span>
                </div>
              )}
            </div>
            {currentDashboard.description && (
              <p className="text-sm text-gray-600">{currentDashboard.description}</p>
            )}
          </div>

          <div className="flex items-center space-x-2">
            {/* KPIs Summary */}
            {kpis.length > 0 && (
              <div className="flex items-center space-x-4 px-3 py-1 bg-white/20 rounded-lg">
                <div className="flex items-center space-x-1">
                  <TrendingUp className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium">
                    {kpis.filter(k => k.trend === 'up').length}
                  </span>
                </div>
                <div className="flex items-center space-x-1">
                  <TrendingUp className="w-4 h-4 text-red-600 transform rotate-180" />
                  <span className="text-sm font-medium">
                    {kpis.filter(k => k.trend === 'down').length}
                  </span>
                </div>
              </div>
            )}

            {/* Alerts */}
            {unreadCount > 0 && (
              <button
                className="relative p-2 text-orange-600 hover:bg-orange-100 rounded-lg transition-colors"
                onClick={() => {/* Open alerts panel */}}
              >
                <Bell className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {unreadCount}
                </span>
              </button>
            )}

            {/* Actions */}
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-2 text-gray-600 hover:bg-white/20 rounded-lg transition-colors disabled:opacity-50"
              title="Refresh"
            >
              <RefreshCw className={cn("w-5 h-5", refreshing && "animate-spin")} />
            </button>

            <button
              onClick={() => setShowFilterPanel(!showFilterPanel)}
              className={cn(
                "p-2 rounded-lg transition-colors",
                showFilterPanel 
                  ? "bg-blue-100 text-blue-600" 
                  : "text-gray-600 hover:bg-white/20"
              )}
              title="Filters"
            >
              <Filter className="w-5 h-5" />
            </button>

            {layoutMode === 'edit' && (
              <button
                onClick={() => setShowWidgetSelector(true)}
                className="p-2 text-gray-600 hover:bg-white/20 rounded-lg transition-colors"
                title="Add Widget"
              >
                <Plus className="w-5 h-5" />
              </button>
            )}

            <button
              onClick={handleExport}
              className="p-2 text-gray-600 hover:bg-white/20 rounded-lg transition-colors"
              title="Export"
            >
              <Download className="w-5 h-5" />
            </button>

            <button
              onClick={handleShare}
              className="p-2 text-gray-600 hover:bg-white/20 rounded-lg transition-colors"
              title="Share"
            >
              <Share className="w-5 h-5" />
            </button>

            <button
              onClick={toggleFullscreen}
              className="p-2 text-gray-600 hover:bg-white/20 rounded-lg transition-colors"
              title="Fullscreen"
            >
              {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
            </button>

            <button
              onClick={() => setShowSettings(true)}
              className="p-2 text-gray-600 hover:bg-white/20 rounded-lg transition-colors"
              title="Settings"
            >
              <Settings className="w-5 h-5" />
            </button>

            <button
              onClick={() => setLayoutMode(layoutMode === 'edit' ? 'view' : 'edit')}
              className={cn(
                "px-3 py-1 rounded-lg text-sm font-medium transition-colors",
                layoutMode === 'edit'
                  ? "bg-blue-100 text-blue-600"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              )}
            >
              {layoutMode === 'edit' ? 'View' : 'Edit'}
            </button>
          </div>
        </div>
      </motion.div>

      {/* Filter Panel */}
      <AnimatePresence>
        {showFilterPanel && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-white/10 backdrop-blur-md border-b border-white/20"
          >
            <FilterPanel
              filters={currentDashboard.widgets[0]?.filters || []}
              values={filterValues}
              onChange={setFilterValues}
              onClose={() => setShowFilterPanel(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className={cn(
        "p-6",
        isFullscreen && "h-full overflow-auto"
      )}>
        {currentDashboard.widgets.length === 0 ? (
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">No Widgets Added</h3>
              <p className="text-gray-500 mb-4">Add widgets to start building your dashboard.</p>
              {layoutMode === 'edit' && (
                <button
                  onClick={() => setShowWidgetSelector(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Add Widget
                </button>
              )}
            </div>
          </div>
        ) : (
          <GridLayout
            className="layout"
            layout={currentDashboard.layout}
            cols={12}
            rowHeight={60}
            width={isFullscreen ? window.innerWidth - 48 : 1200}
            onLayoutChange={handleLayoutChange}
            isDraggable={layoutMode === 'edit'}
            isResizable={layoutMode === 'edit'}
            margin={[16, 16]}
            containerPadding={[0, 0]}
            useCSSTransforms={true}
          >
            {currentDashboard.widgets.map((widget) => {
              const WidgetComponent = widgetComponents[widget.type as keyof typeof widgetComponents];
              
              if (!WidgetComponent) {
                return (
                  <div key={widget.id} className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                    <p className="text-red-600">Unknown widget type: {widget.type}</p>
                  </div>
                );
              }

              return (
                <div key={widget.id} className="relative">
                  {layoutMode === 'edit' && (
                    <div className="absolute top-2 right-2 z-10 flex space-x-1">
                      <button
                        onClick={() => {/* Edit widget */}}
                        className="p-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                      >
                        <Settings className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handleRemoveWidget(widget.id)}
                        className="p-1 bg-red-600 text-white rounded hover:bg-red-700"
                      >
                        ×
                      </button>
                    </div>
                  )}
                  <WidgetComponent
                    widget={widget}
                    isEditMode={layoutMode === 'edit'}
                    filters={filterValues}
                  />
                </div>
              );
            })}
          </GridLayout>
        )}
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showWidgetSelector && (
          <WidgetSelector
            onAddWidget={handleAddWidget}
            onClose={() => setShowWidgetSelector(false)}
          />
        )}

        {showExportModal && (
          <ExportModal
            dashboard={currentDashboard}
            onClose={() => setShowExportModal(false)}
          />
        )}

        {showShareModal && (
          <ShareModal
            dashboard={currentDashboard}
            onClose={() => setShowShareModal(false)}
          />
        )}

        {showSettings && (
          <SettingsPanel
            dashboard={currentDashboard}
            onClose={() => setShowSettings(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};