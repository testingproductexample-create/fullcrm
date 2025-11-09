import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  RefreshCw, 
  Settings, 
  ExternalLink,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { Widget, KPI } from '../../types';
import { useKPI, useWidgetData } from '../../hooks';
import { 
  formatNumber, 
  formatCurrency, 
  formatPercentage, 
  formatCompactNumber,
  calculateTrend, 
  calculatePercentageOfTarget,
  isPerformanceGood,
  cn
} from '../../utils/helpers';
import { GLASSMORPHISM, COLOR_SCHEMES } from '../../data/constants';

interface KPIWidgetProps {
  widget: Widget;
  isEditMode?: boolean;
  filters?: Record<string, any>;
  className?: string;
}

export const KPIWidget: React.FC<KPIWidgetProps> = ({
  widget,
  isEditMode = false,
  filters = {},
  className
}) => {
  const { data: kpiData, loading, error, refetch } = useWidgetData(widget);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  // Simulate KPI data if none provided
  const kpi = useMemo<KPI>(() => {
    if (kpiData && kpiData.value !== undefined) {
      return {
        id: widget.id,
        name: widget.title,
        value: kpiData.value,
        previousValue: kpiData.previousValue || kpiData.value * 0.9,
        target: kpiData.target || 100,
        unit: kpiData.unit || '',
        trend: kpiData.trend || 'up',
        trendPercentage: kpiData.change || 5,
        category: widget.dataSource as any,
        lastUpdated: new Date(),
        isRealTime: true,
        format: widget.configuration.customConfig?.format || 'number'
      };
    }
    
    // Default mock data
    const baseValue = Math.random() * 100000;
    const previousValue = baseValue * (0.85 + Math.random() * 0.3);
    const trend = calculateTrend(baseValue, previousValue);
    
    return {
      id: widget.id,
      name: widget.title,
      value: baseValue,
      previousValue,
      target: baseValue * 1.2,
      unit: kpiData?.unit || '$',
      trend: trend.trend,
      trendPercentage: trend.percentage,
      category: widget.dataSource as any,
      lastUpdated: new Date(),
      isRealTime: true,
      format: 'currency'
    };
  }, [kpiData, widget]);

  const formatValue = (value: number, format: string): string => {
    switch (format) {
      case 'currency':
        return formatCurrency(value);
      case 'percentage':
        return formatPercentage(value);
      case 'compact':
        return formatCompactNumber(value);
      case 'time':
        return formatNumber(value, 0) + 's';
      default:
        return formatNumber(value);
    }
  };

  const getTrendIcon = () => {
    switch (kpi.trend) {
      case 'up':
        return <TrendingUp className="w-5 h-5 text-green-600" />;
      case 'down':
        return <TrendingDown className="w-5 h-5 text-red-600" />;
      default:
        return <Minus className="w-5 h-5 text-gray-600" />;
    }
  };

  const getTrendColor = () => {
    switch (kpi.trend) {
      case 'up':
        return 'text-green-600';
      case 'down':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getCategoryColor = (category: string): string => {
    const colors: Record<string, string> = {
      revenue: COLOR_SCHEMES.success[600],
      orders: COLOR_SCHEMES.primary[600],
      customers: COLOR_SCHEMES.warning[600],
      productivity: COLOR_SCHEMES.purple[600],
      financial: COLOR_SCHEMES.error[600],
      operational: COLOR_SCHEMES.blue[600]
    };
    return colors[category] || COLOR_SCHEMES.gray[600];
  };

  const getPerformanceStatus = () => {
    if (!kpi.target) return { status: 'neutral', color: 'text-gray-600' };
    
    const percentage = calculatePercentageOfTarget(kpi.value, kpi.target);
    
    if (percentage >= 100) {
      return { status: 'excellent', color: 'text-green-600' };
    } else if (percentage >= 80) {
      return { status: 'good', color: 'text-blue-600' };
    } else if (percentage >= 60) {
      return { status: 'fair', color: 'text-yellow-600' };
    } else {
      return { status: 'poor', color: 'text-red-600' };
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetch();
    } finally {
      setIsRefreshing(false);
    }
  };

  const performanceStatus = getPerformanceStatus();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      className={cn(
        "relative bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6 shadow-lg",
        "hover:shadow-xl transition-all duration-300",
        className
      )}
      style={{
        background: `linear-gradient(135deg, ${getCategoryColor(kpi.category)}10, ${getCategoryColor(kpi.category)}05)`,
        borderColor: `${getCategoryColor(kpi.category)}30`
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-sm font-medium text-gray-600 mb-1">
            {widget.title}
          </h3>
          <p className="text-xs text-gray-500 truncate">
            {widget.description || kpi.category}
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          {isRealTimeIndicator()}
          {isEditMode && (
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <Settings className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Main Value */}
      <div className="mb-4">
        <div className="flex items-baseline space-x-2">
          <span className="text-3xl font-bold text-gray-800">
            {formatValue(kpi.value, kpi.format)}
          </span>
          {kpi.unit && !['currency', 'percentage'].includes(kpi.format) && (
            <span className="text-sm text-gray-500 font-medium">
              {kpi.unit}
            </span>
          )}
        </div>
      </div>

      {/* Trend and Target */}
      <div className="space-y-3">
        {/* Trend */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {getTrendIcon()}
            <span className={cn("text-sm font-medium", getTrendColor())}>
              {Math.abs(kpi.trendPercentage).toFixed(1)}%
            </span>
            <span className="text-xs text-gray-500">vs last period</span>
          </div>
          <span className="text-xs text-gray-400">
            {kpi.lastUpdated.toLocaleTimeString()}
          </span>
        </div>

        {/* Target Progress */}
        {kpi.target && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500">Target Progress</span>
              <span className={cn("font-medium", performanceStatus.color)}>
                {calculatePercentageOfTarget(kpi.value, kpi.target).toFixed(1)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <motion.div
                initial={{ width: 0 }}
                animate={{ 
                  width: `${Math.min(calculatePercentageOfTarget(kpi.value, kpi.target), 100)}%` 
                }}
                transition={{ duration: 1, delay: 0.2 }}
                className={cn(
                  "h-2 rounded-full",
                  performanceStatus.status === 'excellent' && "bg-green-500",
                  performanceStatus.status === 'good' && "bg-blue-500",
                  performanceStatus.status === 'fair' && "bg-yellow-500",
                  performanceStatus.status === 'poor' && "bg-red-500"
                )}
              />
            </div>
          </div>
        )}
      </div>

      {/* Performance Indicator */}
      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {performanceStatus.status === 'excellent' && (
            <CheckCircle className="w-4 h-4 text-green-500" />
          )}
          {performanceStatus.status === 'poor' && (
            <AlertTriangle className="w-4 h-4 text-red-500" />
          )}
          <span className={cn("text-xs font-medium", performanceStatus.color)}>
            {performanceStatus.status.charAt(0).toUpperCase() + performanceStatus.status.slice(1)}
          </span>
        </div>
        
        <button
          onClick={handleRefresh}
          disabled={isRefreshing || loading}
          className="p-1 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
          title="Refresh"
        >
          <RefreshCw className={cn("w-4 h-4", isRefreshing && "animate-spin")} />
        </button>
      </div>

      {/* Details Panel */}
      {showDetails && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="mt-4 pt-4 border-t border-white/20 space-y-2"
        >
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-gray-500">Previous:</span>
              <div className="font-medium text-gray-700">
                {formatValue(kpi.previousValue || 0, kpi.format)}
              </div>
            </div>
            <div>
              <span className="text-gray-500">Target:</span>
              <div className="font-medium text-gray-700">
                {formatValue(kpi.target || 0, kpi.format)}
              </div>
            </div>
          </div>
          
          {widget.query && (
            <div className="text-xs text-gray-500">
              <span>Query: {widget.query.entity}</span>
            </div>
          )}
        </motion.div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="absolute inset-0 bg-white/50 backdrop-blur-sm rounded-xl flex items-center justify-center">
          <RefreshCw className="w-6 h-6 text-gray-400 animate-spin" />
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="absolute inset-0 bg-red-50/80 backdrop-blur-sm rounded-xl flex items-center justify-center">
          <div className="text-center">
            <AlertTriangle className="w-6 h-6 text-red-500 mx-auto mb-2" />
            <p className="text-xs text-red-600">{error}</p>
            <button
              onClick={handleRefresh}
              className="mt-2 text-xs text-red-700 hover:text-red-800"
            >
              Retry
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );

  function isRealTimeIndicator() {
    if (!kpi.isRealTime) return null;
    
    return (
      <div className="flex items-center space-x-1">
        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
        <span className="text-xs text-green-600 font-medium">Live</span>
      </div>
    );
  }
};

// Hook to create KPI widgets
export const useCreateKPIWidget = () => {
  const createKPIWidget = useCallback((config: {
    name: string;
    description?: string;
    category: KPI['category'];
    target?: number;
    format: KPI['format'];
    unit?: string;
    isRealTime?: boolean;
    dataSource?: string;
  }) => {
    return {
      id: Math.random().toString(36).substr(2, 9),
      type: 'kpi' as WidgetType,
      title: config.name,
      description: config.description,
      dataSource: config.dataSource || 'internal',
      query: {
        entity: 'kpi',
        fields: ['value'],
        filters: []
      },
      visualization: 'metric' as VisualizationType,
      configuration: {
        showLegend: false,
        showGrid: false,
        showLabels: false,
        colors: [],
        animation: true,
        responsive: true,
        customConfig: {
          format: config.format,
          unit: config.unit
        }
      },
      filters: [],
      refreshInterval: 30,
      size: { width: 300, height: 150 },
      position: { x: 0, y: 0 }
    } as Widget;
  }, []);

  return { createKPIWidget };
};