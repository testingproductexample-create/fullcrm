import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, 
  AlertTriangle, 
  CheckCircle, 
  Info, 
  XCircle, 
  Clock, 
  User,
  Check,
  X,
  Settings,
  Filter,
  Eye,
  EyeOff,
  MoreVertical,
  RefreshCw,
  Volume2,
  VolumeX
} from 'lucide-react';
import { Alert as AlertType } from '../../types';
import { useAlerts } from '../../hooks';
import { 
  formatRelativeTime,
  formatDateTime,
  cn
} from '../../utils/helpers';
import { GLASSMORPHISM, COLOR_SCHEMES } from '../../data/constants';

interface AlertWidgetProps {
  widget: any;
  isEditMode?: boolean;
  filters?: Record<string, any>;
  className?: string;
}

export const AlertWidget: React.FC<AlertWidgetProps> = ({
  widget,
  isEditMode = false,
  filters = {},
  className
}) => {
  const {
    alerts,
    unreadCount,
    isLoading,
    filter,
    severity,
    setFilter,
    setSeverityFilter,
    acknowledge,
    resolve,
    dismiss
  } = useAlerts();

  const [showSettings, setShowSettings] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [selectedAlert, setSelectedAlert] = useState<string | null>(null);

  // Filter alerts based on widget configuration
  const filteredAlerts = useMemo(() => {
    let filtered = alerts;

    // Apply severity filter
    if (severity !== 'all') {
      filtered = filtered.filter(alert => alert.severity === severity);
    }

    // Apply type filter
    if (widget.configuration?.alertTypes && widget.configuration.alertTypes.length > 0) {
      filtered = filtered.filter(alert => 
        widget.configuration.alertTypes.includes(alert.type)
      );
    }

    // Apply limit
    const limit = widget.configuration?.maxAlerts || 20;
    return filtered.slice(0, limit);
  }, [alerts, severity, widget]);

  // Group alerts by severity
  const alertsBySeverity = useMemo(() => {
    return filteredAlerts.reduce((acc, alert) => {
      if (!acc[alert.severity]) {
        acc[alert.severity] = [];
      }
      acc[alert.severity].push(alert);
      return acc;
    }, {} as Record<string, AlertType[]>);
  }, [filteredAlerts]);

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'info':
      default:
        return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'error':
        return 'border-red-200 bg-red-50/20';
      case 'warning':
        return 'border-yellow-200 bg-yellow-50/20';
      case 'success':
        return 'border-green-200 bg-green-50/20';
      case 'info':
      default:
        return 'border-blue-200 bg-blue-50/20';
    }
  };

  const getSeverityTextColor = (severity: string) => {
    switch (severity) {
      case 'error':
        return 'text-red-700';
      case 'warning':
        return 'text-yellow-700';
      case 'success':
        return 'text-green-700';
      case 'info':
      default:
        return 'text-blue-700';
    }
  };

  const handleAcknowledge = async (alertId: string) => {
    try {
      await acknowledge(alertId);
      if (soundEnabled) {
        // Play acknowledgment sound
        playSound('success');
      }
    } catch (error) {
      console.error('Failed to acknowledge alert:', error);
    }
  };

  const handleResolve = async (alertId: string) => {
    try {
      await resolve(alertId);
      if (soundEnabled) {
        // Play resolution sound
        playSound('success');
      }
    } catch (error) {
      console.error('Failed to resolve alert:', error);
    }
  };

  const handleDismiss = (alertId: string) => {
    dismiss(alertId);
  };

  const playSound = (type: 'success' | 'error' | 'warning' | 'info') => {
    // This would play actual sounds in a real implementation
    console.log(`Playing ${type} sound`);
  };

  const playNotificationSound = (severity: string) => {
    if (soundEnabled && !document.hasFocus()) {
      switch (severity) {
        case 'error':
        case 'critical':
          playSound('error');
          break;
        case 'warning':
          playSound('warning');
          break;
        case 'success':
          playSound('success');
          break;
        case 'info':
        default:
          playSound('info');
          break;
      }
    }
  };

  // Auto refresh alerts
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      // This would refresh alerts from the API
      console.log('Refreshing alerts...');
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [autoRefresh]);

  // Play sound for new high-priority alerts
  useEffect(() => {
    const newCriticalAlerts = alerts.filter(alert => 
      !alert.acknowledged && 
      (alert.severity === 'error' || alert.severity === 'critical')
    );

    if (newCriticalAlerts.length > 0) {
      playNotificationSound('error');
    }
  }, [alerts, soundEnabled]);

  const severityCounts = useMemo(() => {
    return {
      all: alerts.length,
      unread: unreadCount,
      error: alerts.filter(a => a.severity === 'error').length,
      warning: alerts.filter(a => a.severity === 'warning').length,
      success: alerts.filter(a => a.severity === 'success').length,
      info: alerts.filter(a => a.severity === 'info').length
    };
  }, [alerts, unreadCount]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "bg-white/10 backdrop-blur-md border border-white/20 rounded-xl shadow-lg",
        "overflow-hidden",
        className
      )}
    >
      {/* Header */}
      <div className="p-6 border-b border-white/20">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Bell className="w-6 h-6 text-gray-700" />
              {unreadCount > 0 && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center"
                >
                  {unreadCount > 99 ? '99+' : unreadCount}
                </motion.div>
              )}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800">
                {widget.title || 'Alerts'}
              </h3>
              {widget.description && (
                <p className="text-sm text-gray-600">{widget.description}</p>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={cn(
                "p-2 rounded-lg transition-colors",
                soundEnabled 
                  ? "text-blue-600 bg-blue-100" 
                  : "text-gray-400 hover:text-gray-600"
              )}
              title="Toggle Sound"
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={cn(
                "p-2 rounded-lg transition-colors",
                autoRefresh 
                  ? "text-green-600 bg-green-100" 
                  : "text-gray-400 hover:text-gray-600"
              )}
              title="Auto Refresh"
            >
              <RefreshCw className={cn("w-4 h-4", autoRefresh && "animate-spin")} />
            </button>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              title="Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filters and Stats */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <select
              value={severity}
              onChange={(e) => setSeverityFilter(e.target.value as any)}
              className="px-3 py-1 border border-gray-300 rounded bg-white/50 text-sm"
            >
              <option value="all">All Severity ({severityCounts.all})</option>
              <option value="error">Error ({severityCounts.error})</option>
              <option value="warning">Warning ({severityCounts.warning})</option>
              <option value="success">Success ({severityCounts.success})</option>
              <option value="info">Info ({severityCounts.info})</option>
            </select>
          </div>

          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-red-500 rounded-full" />
              <span className="text-gray-600">{severityCounts.error} errors</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-yellow-500 rounded-full" />
              <span className="text-gray-600">{severityCounts.warning} warnings</span>
            </div>
            {unreadCount > 0 && (
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                <span className="text-blue-600 font-medium">{unreadCount} unread</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Settings Panel */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-white/5 border-b border-white/20 p-4"
          >
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Alert Types
                </label>
                <div className="space-y-2">
                  {['threshold', 'anomaly', 'system', 'custom'].map(type => (
                    <label key={type} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        className="rounded border-gray-300"
                        defaultChecked={true}
                      />
                      <span className="text-sm text-gray-600 capitalize">{type}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Alerts Displayed
                </label>
                <input
                  type="number"
                  min="5"
                  max="100"
                  defaultValue={20}
                  className="w-full px-3 py-2 border border-gray-300 rounded bg-white/50 text-sm"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Alerts List */}
      <div className="max-h-96 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <RefreshCw className="w-6 h-6 text-gray-400 animate-spin" />
          </div>
        ) : filteredAlerts.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-center">
            <div>
              <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
              <p className="text-sm text-gray-600">No alerts to display</p>
            </div>
          </div>
        ) : (
          <div className="p-4 space-y-3">
            <AnimatePresence>
              {filteredAlerts.map((alert, index) => (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: index * 0.05 }}
                  className={cn(
                    "border rounded-lg p-4 transition-all duration-200",
                    "hover:shadow-md cursor-pointer",
                    getSeverityColor(alert.severity),
                    !alert.acknowledged && "ring-2 ring-blue-200",
                    selectedAlert === alert.id && "ring-2 ring-blue-400"
                  )}
                  onClick={() => setSelectedAlert(
                    selectedAlert === alert.id ? null : alert.id
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      {getSeverityIcon(alert.severity)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className={cn(
                            "text-sm font-medium truncate",
                            getSeverityTextColor(alert.severity)
                          )}>
                            {alert.title}
                          </h4>
                          {!alert.acknowledged && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                          {alert.message}
                        </p>
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-1">
                              <Clock className="w-3 h-3" />
                              <span>{formatRelativeTime(alert.triggeredAt)}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <User className="w-3 h-3" />
                              <span className="capitalize">{alert.source}</span>
                            </div>
                          </div>
                          {alert.resolvedAt && (
                            <div className="flex items-center space-x-1 text-green-600">
                              <CheckCircle className="w-3 h-3" />
                              <span>Resolved</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-1 ml-2">
                      {!alert.acknowledged && !alert.resolvedAt && (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAcknowledge(alert.id);
                            }}
                            className="p-1 text-green-600 hover:bg-green-100 rounded transition-colors"
                            title="Acknowledge"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleResolve(alert.id);
                            }}
                            className="p-1 text-blue-600 hover:bg-blue-100 rounded transition-colors"
                            title="Resolve"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDismiss(alert.id);
                        }}
                        className="p-1 text-red-600 hover:bg-red-100 rounded transition-colors"
                        title="Dismiss"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Expanded Alert Details */}
                  <AnimatePresence>
                    {selectedAlert === alert.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="mt-3 pt-3 border-t border-white/20"
                      >
                        <div className="grid grid-cols-2 gap-4 text-xs">
                          <div>
                            <span className="text-gray-500">Triggered:</span>
                            <div className="font-medium text-gray-700">
                              {formatDateTime(alert.triggeredAt)}
                            </div>
                          </div>
                          {alert.acknowledgedBy && (
                            <div>
                              <span className="text-gray-500">Acknowledged by:</span>
                              <div className="font-medium text-gray-700">
                                {alert.acknowledgedBy}
                              </div>
                            </div>
                          )}
                          {alert.resolvedBy && (
                            <div>
                              <span className="text-gray-500">Resolved by:</span>
                              <div className="font-medium text-gray-700">
                                {alert.resolvedBy}
                              </div>
                            </div>
                          )}
                          <div>
                            <span className="text-gray-500">Type:</span>
                            <div className="font-medium text-gray-700 capitalize">
                              {alert.type}
                            </div>
                          </div>
                        </div>
                        
                        {alert.threshold && (
                          <div className="mt-2 text-xs">
                            <span className="text-gray-500">Threshold:</span>
                            <div className="font-medium text-gray-700">
                              {alert.threshold.metric} {alert.threshold.operator} {alert.threshold.value}
                            </div>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Footer */}
      {filteredAlerts.length > 0 && (
        <div className="p-4 border-t border-white/20 bg-white/5">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>
              Showing {filteredAlerts.length} of {alerts.length} alerts
            </span>
            {unreadCount > 0 && (
              <button className="text-blue-600 hover:text-blue-800 font-medium">
                Mark all as read
              </button>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
};