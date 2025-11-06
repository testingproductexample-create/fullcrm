import React from 'react';
import { Activity, Shield, Database, Network, Zap, TrendingUp } from 'lucide-react';

const SecurityHealth: React.FC = () => {
  const healthMetrics = [
    {
      name: 'Firewall Status',
      status: 'healthy',
      value: 98,
      icon: Shield,
      color: 'text-green-400'
    },
    {
      name: 'Network Traffic',
      status: 'healthy',
      value: 85,
      icon: Network,
      color: 'text-blue-400'
    },
    {
      name: 'Database Security',
      status: 'warning',
      value: 76,
      icon: Database,
      color: 'text-yellow-400'
    },
    {
      name: 'System Performance',
      status: 'healthy',
      value: 92,
      icon: Activity,
      color: 'text-green-400'
    },
    {
      name: 'Response Time',
      status: 'healthy',
      value: 88,
      icon: Zap,
      color: 'text-green-400'
    },
    {
      name: 'Security Score',
      status: 'healthy',
      value: 94,
      icon: TrendingUp,
      color: 'text-green-400'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-500/20 border-green-500/30';
      case 'warning':
        return 'bg-yellow-500/20 border-yellow-500/30';
      case 'critical':
        return 'bg-red-500/20 border-red-500/30';
      default:
        return 'bg-gray-500/20 border-gray-500/30';
    }
  };

  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white">Security Health</h2>
        <div className="text-right">
          <div className="text-2xl font-bold text-green-400">94%</div>
          <div className="text-xs text-white/60">Overall Health</div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {healthMetrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <div key={metric.name} className="p-4 glass-button">
              <div className="flex items-center justify-between mb-3">
                <Icon className={`w-6 h-6 ${metric.color}`} />
                <div className={`px-2 py-1 text-xs rounded border ${getStatusColor(metric.status)}`}>
                  {metric.status}
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="text-2xl font-bold text-white">{metric.value}%</div>
                <p className="text-sm text-white/60">{metric.name}</p>
              </div>
              
              <div className="mt-3">
                <div className="w-full bg-white/10 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-500 ${
                      metric.status === 'healthy' ? 'bg-green-500' :
                      metric.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${metric.value}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 pt-4 border-t border-white/10">
        <div className="flex items-center justify-between">
          <div className="text-sm text-white/80">
            Last security scan: 2 hours ago
          </div>
          <button className="px-4 py-2 text-sm bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors">
            Run Health Check
          </button>
        </div>
      </div>
    </div>
  );
};

export default SecurityHealth;