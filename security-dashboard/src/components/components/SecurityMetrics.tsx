import React from 'react';
import { Activity, Shield, AlertTriangle, Users, Database, Eye } from 'lucide-react';

interface SecurityMetric {
  name: string;
  value: number;
  status: 'healthy' | 'warning' | 'critical';
  change: number;
  unit: string;
}

interface SecurityMetricsProps {
  metrics: SecurityMetric[];
}

const SecurityMetrics: React.FC<SecurityMetricsProps> = ({ metrics }) => {
  const getMetricIcon = (name: string) => {
    switch (name) {
      case 'Active Threats':
        return AlertTriangle;
      case 'System Health':
        return Activity;
      case 'Failed Logins':
        return Shield;
      case 'Data Transfers':
        return Database;
      case 'Active Sessions':
        return Users;
      case 'Vulnerabilities':
        return Eye;
      default:
        return Activity;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'text-green-400 bg-green-500/20 border-green-500/30';
      case 'warning':
        return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
      case 'critical':
        return 'text-red-400 bg-red-500/20 border-red-500/30';
      default:
        return 'text-blue-400 bg-blue-500/20 border-blue-500/30';
    }
  };

  const getChangeIcon = (change: number) => {
    if (change > 0) {
      return <span className="text-red-400">↗</span>;
    } else if (change < 0) {
      return <span className="text-green-400">↘</span>;
    }
    return <span className="text-white/40">→</span>;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {metrics.map((metric) => {
        const Icon = getMetricIcon(metric.name);
        const statusColor = getStatusColor(metric.status);
        
        return (
          <div key={metric.name} className="glass-card p-4">
            <div className="flex items-center justify-between mb-3">
              <div className={`p-2 rounded-lg border ${statusColor}`}>
                <Icon className="w-4 h-4" />
              </div>
              {getChangeIcon(metric.change)}
            </div>
            
            <div className="space-y-1">
              <p className="text-2xl font-bold text-white">
                {metric.value.toFixed(1)}{metric.unit}
              </p>
              <p className="text-sm text-white/60">{metric.name}</p>
            </div>
            
            <div className="mt-3 flex items-center justify-between text-xs">
              <span className={`px-2 py-1 rounded-full border ${statusColor}`}>
                {metric.status.charAt(0).toUpperCase() + metric.status.slice(1)}
              </span>
              {metric.change !== 0 && (
                <span className={`${metric.change > 0 ? 'text-red-400' : 'text-green-400'}`}>
                  {Math.abs(metric.change).toFixed(1)}% change
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default SecurityMetrics;