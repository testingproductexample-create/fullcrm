import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  RefreshCw, 
  Settings, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  AlertTriangle,
  CheckCircle,
  Target
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { Widget } from '../../types';
import { useWidgetData } from '../../hooks';
import { 
  formatNumber, 
  formatCurrency, 
  formatPercentage,
  calculatePercentageOfTarget,
  getColorByCategory,
  cn
} from '../../utils/helpers';
import { GLASSMORPHISM, COLOR_SCHEMES } from '../../data/constants';

interface GaugeWidgetProps {
  widget: Widget;
  isEditMode?: boolean;
  filters?: Record<string, any>;
  className?: string;
}

export const GaugeWidget: React.FC<GaugeWidgetProps> = ({
  widget,
  isEditMode = false,
  filters = {},
  className
}) => {
  const { data, loading, error, refetch } = useWidgetData(widget);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  // Simulate gauge data
  const gaugeData = useMemo(() => {
    if (data && data.value !== undefined) {
      return {
        value: data.value,
        target: data.target || 100,
        min: data.min || 0,
        max: data.max || 200,
        label: data.label || widget.title,
        unit: data.unit || '',
        color: data.color || getColorByCategory(widget.dataSource)
      };
    }

    // Default mock data
    const max = 100;
    const value = Math.random() * max * 0.8;
    const target = max * 0.9;
    
    return {
      value,
      target,
      min: 0,
      max,
      label: widget.title,
      unit: '',
      color: getColorByCategory(widget.dataSource)
    };
  }, [data, widget]);

  const percentage = Math.min((gaugeData.value / gaugeData.max) * 100, 100);
  const targetPercentage = Math.min((gaugeData.target / gaugeData.max) * 100, 100);

  const getGaugeColor = (percentage: number, targetPercentage: number) => {
    if (percentage >= targetPercentage) {
      return COLOR_SCHEMES.success[500];
    } else if (percentage >= targetPercentage * 0.8) {
      return COLOR_SCHEMES.warning[500];
    } else {
      return COLOR_SCHEMES.error[500];
    }
  };

  const getStatusInfo = () => {
    const perfPercentage = (gaugeData.value / gaugeData.target) * 100;
    
    if (perfPercentage >= 100) {
      return { status: 'Excellent', color: 'text-green-600', icon: CheckCircle };
    } else if (perfPercentage >= 80) {
      return { status: 'Good', color: 'text-blue-600', icon: TrendingUp };
    } else if (perfPercentage >= 60) {
      return { status: 'Fair', color: 'text-yellow-600', icon: Minus };
    } else {
      return { status: 'Poor', color: 'text-red-600', icon: AlertTriangle };
    }
  };

  const statusInfo = getStatusInfo();
  const StatusIcon = statusInfo.icon;

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetch();
    } finally {
      setIsRefreshing(false);
    }
  };

  const formatValue = (value: number) => {
    const unit = gaugeData.unit;
    if (unit === '$') return formatCurrency(value);
    if (unit === '%') return formatPercentage(value);
    return formatNumber(value);
  };

  // Calculate arc data for gauge
  const getArcData = () => {
    const valueAngle = (percentage / 100) * 180;
    const targetAngle = (targetPercentage / 100) * 180;
    
    return [
      { name: 'progress', value: percentage, color: getGaugeColor(percentage, targetPercentage) },
      { name: 'remaining', value: 100 - percentage, color: 'rgba(0,0,0,0.1)' }
    ];
  };

  const arcData = getArcData();

  // Create pie chart data for circular gauge
  const pieData = [
    { name: 'progress', value: percentage, color: getGaugeColor(percentage, targetPercentage) },
    { name: 'remaining', value: 100 - percentage, color: 'rgba(0,0,0,0.1)' }
  ];

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
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-800 mb-1">
            {widget.title}
          </h3>
          {widget.description && (
            <p className="text-sm text-gray-600">{widget.description}</p>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
            title="Details"
          >
            <Settings className="w-4 h-4" />
          </button>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing || loading}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw className={cn("w-4 h-4", isRefreshing && "animate-spin")} />
          </button>
        </div>
      </div>

      {/* Gauge Container */}
      <div className="relative h-48 mb-4">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              startAngle={90}
              endAngle={-270}
              innerRadius={60}
              outerRadius={80}
              dataKey="value"
              strokeWidth={0}
            >
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>

        {/* Center Content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-800 mb-1">
              {formatValue(gaugeData.value)}
            </div>
            {gaugeData.unit && !['$', '%'].includes(gaugeData.unit) && (
              <div className="text-sm text-gray-500">{gaugeData.unit}</div>
            )}
          </div>
        </div>

        {/* Target Marker */}
        <div className="absolute bottom-0 left-0 right-0 h-2">
          <div 
            className="h-full bg-white/30 rounded-full relative"
          >
            <div 
              className="absolute top-0 h-full bg-gray-600 rounded-full transition-all duration-1000"
              style={{ width: `${targetPercentage}%` }}
            />
            <div 
              className="absolute top-0 h-full w-1 bg-gray-800 rounded transition-all duration-1000"
              style={{ left: `${targetPercentage - 0.5}%` }}
            />
          </div>
        </div>
      </div>

      {/* Status and Progress */}
      <div className="space-y-3">
        {/* Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <StatusIcon className={cn("w-4 h-4", statusInfo.color)} />
            <span className={cn("text-sm font-medium", statusInfo.color)}>
              {statusInfo.status}
            </span>
          </div>
          <div className="text-sm text-gray-600">
            {percentage.toFixed(1)}% of max
          </div>
        </div>

        {/* Target Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-500">Target Progress</span>
            <span className={cn("font-medium", statusInfo.color)}>
              {((gaugeData.value / gaugeData.target) * 100).toFixed(1)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <motion.div
              initial={{ width: 0 }}
              animate={{ 
                width: `${Math.min((gaugeData.value / gaugeData.target) * 100, 100)}%` 
              }}
              transition={{ duration: 1, delay: 0.2 }}
              className="h-2 rounded-full"
              style={{ backgroundColor: getGaugeColor(percentage, targetPercentage) }}
            />
          </div>
        </div>

        {/* Additional Metrics */}
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div>
            <span className="text-gray-500">Current</span>
            <div className="font-medium text-gray-700">
              {formatValue(gaugeData.value)}
            </div>
          </div>
          <div>
            <span className="text-gray-500">Target</span>
            <div className="font-medium text-gray-700">
              {formatValue(gaugeData.target)}
            </div>
          </div>
        </div>
      </div>

      {/* Details Panel */}
      <AnimatePresence>
        {showDetails && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 pt-4 border-t border-white/20 space-y-3"
          >
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-gray-500">Range</span>
                <div className="font-medium text-gray-700">
                  {formatValue(gaugeData.min)} - {formatValue(gaugeData.max)}
                </div>
              </div>
              <div>
                <span className="text-gray-500">Performance</span>
                <div className={cn("font-medium", statusInfo.color)}>
                  {((gaugeData.value / gaugeData.target) * 100).toFixed(1)}% of target
                </div>
              </div>
            </div>
            
            <div className="text-xs text-gray-500">
              <span>Last updated: {new Date().toLocaleTimeString()}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
};