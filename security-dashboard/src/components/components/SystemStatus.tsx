import React from 'react';
import { Server, Database, Cloud, Wifi, Shield, Zap } from 'lucide-react';

const SystemStatus: React.FC = () => {
  const systemComponents = [
    {
      name: 'Web Servers',
      status: 'healthy',
      uptime: '99.9%',
      responseTime: '45ms',
      icon: Server,
      color: 'text-green-400'
    },
    {
      name: 'Database',
      status: 'healthy',
      uptime: '100%',
      responseTime: '12ms',
      icon: Database,
      color: 'text-green-400'
    },
    {
      name: 'Cloud Services',
      status: 'warning',
      uptime: '98.2%',
      responseTime: '89ms',
      icon: Cloud,
      color: 'text-yellow-400'
    },
    {
      name: 'Network',
      status: 'healthy',
      uptime: '99.8%',
      responseTime: '23ms',
      icon: Wifi,
      color: 'text-green-400'
    },
    {
      name: 'Firewall',
      status: 'healthy',
      uptime: '100%',
      responseTime: '1ms',
      icon: Shield,
      color: 'text-green-400'
    },
    {
      name: 'Load Balancer',
      status: 'healthy',
      uptime: '99.7%',
      responseTime: '8ms',
      icon: Zap,
      color: 'text-green-400'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'text-green-400 bg-green-500/20 border-green-500/30';
      case 'warning':
        return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
      case 'critical':
        return 'text-red-400 bg-red-500/20 border-red-500/30';
      default:
        return 'text-gray-400 bg-gray-500/20 border-gray-500/30';
    }
  };

  const getStatusDot = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-500';
      case 'warning':
        return 'bg-yellow-500';
      case 'critical':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const healthyCount = systemComponents.filter(c => c.status === 'healthy').length;
  const warningCount = systemComponents.filter(c => c.status === 'warning').length;
  const totalComponents = systemComponents.length;

  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white">System Status</h2>
        <div className="text-right">
          <div className="text-2xl font-bold text-green-400">{((healthyCount / totalComponents) * 100).toFixed(0)}%</div>
          <div className="text-xs text-white/60">Systems Healthy</div>
        </div>
      </div>

      <div className="space-y-3">
        {systemComponents.map((component) => {
          const Icon = component.icon;
          const statusColor = getStatusColor(component.status);
          const statusDot = getStatusDot(component.status);
          
          return (
            <div
              key={component.name}
              className="p-3 glass-button hover:bg-white/10 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg border ${statusColor}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-white">{component.name}</h3>
                    <div className="flex items-center space-x-3 text-xs text-white/60">
                      <span>Uptime: {component.uptime}</span>
                      <span>Response: {component.responseTime}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${statusDot} pulse-glow`}></div>
                  <div className={`px-2 py-1 text-xs rounded border ${statusColor}`}>
                    {component.status.charAt(0).toUpperCase() + component.status.slice(1)}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 pt-4 border-t border-white/10">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="text-center p-3 glass-button">
            <div className="text-lg font-bold text-green-400">{healthyCount}</div>
            <div className="text-xs text-white/60">Healthy</div>
          </div>
          <div className="text-center p-3 glass-button">
            <div className="text-lg font-bold text-yellow-400">{warningCount}</div>
            <div className="text-xs text-white/60">Warning</div>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="text-sm text-white/80">
            Last updated: 2 minutes ago
          </div>
          <button className="px-4 py-2 text-sm bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors">
            View Details
          </button>
        </div>
      </div>
    </div>
  );
};

export default SystemStatus;