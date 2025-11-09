import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  RefreshCw, 
  Settings, 
  CheckCircle, 
  Clock, 
  TrendingUp, 
  AlertTriangle,
  Target,
  Play,
  Pause
} from 'lucide-react';
import { Widget } from '../../types';
import { useWidgetData } from '../../hooks';
import { 
  formatNumber, 
  formatCurrency, 
  formatPercentage,
  formatTime,
  cn
} from '../../utils/helpers';
import { GLASSMORPHISM, COLOR_SCHEMES } from '../../data/constants';

interface ProgressWidgetProps {
  widget: Widget;
  isEditMode?: boolean;
  filters?: Record<string, any>;
  className?: string;
}

export const ProgressWidget: React.FC<ProgressWidgetProps> = ({
  widget,
  isEditMode = false,
  filters = {},
  className
}) => {
  const { data, loading, error, refetch } = useWidgetData(widget);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [isAnimating, setIsAnimating] = useState(true);

  // Simulate progress data
  const progressData = useMemo(() => {
    if (data && data.progress !== undefined) {
      return {
        progress: data.progress,
        total: data.total || 100,
        completed: data.completed || (data.progress / 100) * (data.total || 100),
        remaining: data.remaining || (data.total || 100) - (data.progress / 100) * (data.total || 100),
        label: data.label || widget.title,
        unit: data.unit || '',
        target: data.target || 100,
        timeElapsed: data.timeElapsed || 0,
        estimatedTimeRemaining: data.estimatedTimeRemaining || 0,
        status: data.status || 'in-progress',
        color: data.color || getColorByProgress(data.progress)
      };
    }

    // Default mock data
    const progress = Math.random() * 100;
    const total = 100;
    const completed = (progress / 100) * total;
    const remaining = total - completed;
    const timeElapsed = Math.floor(Math.random() * 3600); // seconds
    const estimatedRemaining = Math.floor((remaining / (completed / Math.max(timeElapsed, 1))) * 60); // minutes
    
    return {
      progress,
      total,
      completed,
      remaining,
      label: widget.title,
      unit: '',
      target: 100,
      timeElapsed,
      estimatedTimeRemaining: estimatedRemaining,
      status: progress >= 100 ? 'completed' : progress > 0 ? 'in-progress' : 'not-started',
      color: getColorByProgress(progress)
    };
  }, [data, widget]);

  const getColorByProgress = (progress: number) => {
    if (progress >= 100) return COLOR_SCHEMES.success[500];
    if (progress >= 75) return COLOR_SCHEMES.primary[500];
    if (progress >= 50) return COLOR_SCHEMES.warning[500];
    return COLOR_SCHEMES.error[500];
  };

  const getStatusInfo = () => {
    switch (progressData.status) {
      case 'completed':
        return { 
          status: 'Completed', 
          color: 'text-green-600', 
          icon: CheckCircle,
          bgColor: 'bg-green-100'
        };
      case 'in-progress':
        return { 
          status: 'In Progress', 
          color: 'text-blue-600', 
          icon: Clock,
          bgColor: 'bg-blue-100'
        };
      case 'paused':
        return { 
          status: 'Paused', 
          color: 'text-yellow-600', 
          icon: Pause,
          bgColor: 'bg-yellow-100'
        };
      case 'not-started':
        return { 
          status: 'Not Started', 
          color: 'text-gray-600', 
          icon: Play,
          bgColor: 'bg-gray-100'
        };
      default:
        return { 
          status: 'Unknown', 
          color: 'text-gray-600', 
          icon: Clock,
          bgColor: 'bg-gray-100'
        };
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
    const unit = progressData.unit;
    if (unit === '$') return formatCurrency(value);
    if (unit === '%') return formatPercentage(value);
    return formatNumber(value);
  };

  const getProgressBarStyle = () => {
    const colors = {
      background: `linear-gradient(90deg, ${progressData.color}, ${progressData.color}dd)`,
      height: '8px',
      borderRadius: '4px',
      transition: 'all 0.3s ease'
    };
    return colors;
  };

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
      <div className="flex items-start justify-between mb-6">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-800 mb-1">
            {widget.title}
          </h3>
          {widget.description && (
            <p className="text-sm text-gray-600">{widget.description}</p>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          <div className={cn(
            "px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1",
            statusInfo.bgColor,
            statusInfo.color
          )}>
            <StatusIcon className="w-3 h-3" />
            <span>{statusInfo.status}</span>
          </div>
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

      {/* Main Progress Display */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-800">
              {progressData.progress.toFixed(1)}%
            </div>
            <div className="text-sm text-gray-500">Progress</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-semibold text-gray-700">
              {formatValue(progressData.completed)}
            </div>
            <div className="text-sm text-gray-500">Completed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-semibold text-gray-700">
              {formatValue(progressData.remaining)}
            </div>
            <div className="text-sm text-gray-500">Remaining</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="relative">
          <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
            <motion.div
              initial={{ width: 0 }}
              animate={{ 
                width: `${Math.min(progressData.progress, 100)}%` 
              }}
              transition={{ 
                duration: isAnimating ? 1.5 : 0, 
                delay: 0.2,
                ease: "easeOut"
              }}
              className="h-2 rounded-full"
              style={{ 
                background: `linear-gradient(90deg, ${progressData.color}, ${progressData.color}cc)`,
                boxShadow: `0 0 10px ${progressData.color}40`
              }}
            />
          </div>
          
          {/* Target Line */}
          {progressData.target < 100 && (
            <div 
              className="absolute top-0 h-2 w-0.5 bg-gray-600"
              style={{ left: `${progressData.target}%` }}
            />
          )}
        </div>

        {/* Progress Indicators */}
        <div className="flex items-center justify-between text-xs text-gray-500 mt-2">
          <span>0%</span>
          {progressData.target < 100 && (
            <span>Target: {progressData.target}%</span>
          )}
          <span>100%</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-white/5 rounded-lg p-3">
          <div className="flex items-center space-x-2 mb-1">
            <Target className="w-4 h-4 text-gray-600" />
            <span className="text-sm text-gray-600">Total Goal</span>
          </div>
          <div className="text-lg font-semibold text-gray-800">
            {formatValue(progressData.total)}
          </div>
        </div>

        <div className="bg-white/5 rounded-lg p-3">
          <div className="flex items-center space-x-2 mb-1">
            <TrendingUp className="w-4 h-4 text-gray-600" />
            <span className="text-sm text-gray-600">Completion Rate</span>
          </div>
          <div className="text-lg font-semibold text-gray-800">
            {((progressData.completed / progressData.total) * 100).toFixed(1)}%
          </div>
        </div>
      </div>

      {/* Time Information */}
      {(progressData.timeElapsed > 0 || progressData.estimatedTimeRemaining > 0) && (
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-white/5 rounded-lg p-3">
            <div className="text-sm text-gray-600 mb-1">Time Elapsed</div>
            <div className="text-lg font-semibold text-gray-800">
              {formatTime(progressData.timeElapsed)}
            </div>
          </div>
          <div className="bg-white/5 rounded-lg p-3">
            <div className="text-sm text-gray-600 mb-1">Est. Time Remaining</div>
            <div className="text-lg font-semibold text-gray-800">
              {formatTime(progressData.estimatedTimeRemaining)}
            </div>
          </div>
        </div>
      )}

      {/* Progress Milestones */}
      <div className="mb-4">
        <div className="text-sm text-gray-600 mb-2">Milestones</div>
        <div className="flex items-center space-x-2">
          {[25, 50, 75, 100].map(milestone => (
            <div key={milestone} className="flex flex-col items-center">
              <div className={cn(
                "w-3 h-3 rounded-full border-2",
                progressData.progress >= milestone
                  ? "bg-green-500 border-green-500"
                  : "border-gray-300 bg-white"
              )} />
              <div className="text-xs text-gray-500 mt-1">{milestone}%</div>
            </div>
          ))}
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
            <div className="grid grid-cols-1 gap-3 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-500">Last updated:</span>
                <span className="text-gray-700">{new Date().toLocaleTimeString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Status:</span>
                <span className={cn("font-medium", statusInfo.color)}>
                  {statusInfo.status}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Progress rate:</span>
                <span className="text-gray-700">
                  {progressData.timeElapsed > 0 
                    ? `${(progressData.completed / (progressData.timeElapsed / 3600)).toFixed(2)}/hour`
                    : 'N/A'
                  }
                </span>
              </div>
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