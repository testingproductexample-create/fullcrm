import React, { ReactNode } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { clsx } from 'clsx';

interface MetricCardProps {
  title: string;
  value: number | string;
  unit?: string;
  change?: number;
  changeType?: 'increase' | 'decrease' | 'neutral';
  trend?: 'up' | 'down' | 'stable';
  target?: number;
  icon?: ReactNode;
  description?: string;
  className?: string;
  onClick?: () => void;
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  unit,
  change,
  changeType,
  trend,
  target,
  icon,
  description,
  className,
  onClick,
}) => {
  const getTrendIcon = () => {
    if (trend === 'up') return <TrendingUp size={16} className="text-green-400" />;
    if (trend === 'down') return <TrendingDown size={16} className="text-red-400" />;
    return <Minus size={16} className="text-gray-400" />;
  };

  const getChangeColor = () => {
    if (changeType === 'increase') return 'text-green-400';
    if (changeType === 'decrease') return 'text-red-400';
    return 'text-gray-400';
  };

  const formatValue = (val: number | string): string => {
    if (typeof val === 'number') {
      if (val >= 1000000) {
        return `${(val / 1000000).toFixed(1)}M`;
      }
      if (val >= 1000) {
        return `${(val / 1000).toFixed(1)}K`;
      }
      return val.toLocaleString();
    }
    return val;
  };

  return (
    <div 
      className={clsx(
        'metric-card cursor-pointer',
        onClick && 'hover:scale-105',
        className
      )}
      onClick={onClick}
    >
      <div className="metric-card-header">
        <div className="flex items-center space-x-2">
          {icon && <div className="text-blue-400">{icon}</div>}
          <h3 className="metric-card-title">{title}</h3>
        </div>
        {change !== undefined && (
          <div className="flex items-center space-x-1">
            {getTrendIcon()}
            <span className={clsx('text-sm font-medium', getChangeColor())}>
              {Math.abs(change).toFixed(1)}%
            </span>
          </div>
        )}
      </div>
      
      <div className="mb-4">
        <span className="metric-card-value">
          {formatValue(value)}
        </span>
        {unit && (
          <span className="text-gray-400 text-sm ml-1">
            {unit}
          </span>
        )}
      </div>

      {target && (
        <div className="mb-4">
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-gray-400">Target</span>
            <span className="text-gray-300">{target}{unit || ''}</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div
              className={clsx(
                'h-2 rounded-full transition-all duration-300',
                typeof value === 'number' && value >= target
                  ? 'bg-green-500'
                  : 'bg-blue-500'
              )}
              style={{
                width: `${Math.min(100, ((typeof value === 'number' ? value : 0) / target) * 100)}%`
              }}
            />
          </div>
        </div>
      )}

      {description && (
        <p className="text-xs text-gray-400">{description}</p>
      )}
    </div>
  );
};

export default MetricCard;