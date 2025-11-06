import React from 'react';
import { AlertTriangle, Clock, CheckCircle, XCircle } from 'lucide-react';

interface SecurityAlert {
  id: string;
  type: 'critical' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: Date;
  source: string;
  resolved: boolean;
}

interface ThreatOverviewProps {
  alerts: SecurityAlert[];
}

const ThreatOverview: React.FC<ThreatOverviewProps> = ({ alerts }) => {
  const getAlertIcon = (type: string, resolved: boolean) => {
    if (resolved) return CheckCircle;
    
    switch (type) {
      case 'critical':
        return XCircle;
      case 'warning':
        return AlertTriangle;
      case 'info':
        return Clock;
      default:
        return AlertTriangle;
    }
  };

  const getAlertColor = (type: string, resolved: boolean) => {
    if (resolved) return 'text-green-400 bg-green-500/20 border-green-500/30';
    
    switch (type) {
      case 'critical':
        return 'text-red-400 bg-red-500/20 border-red-500/30';
      case 'warning':
        return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
      case 'info':
        return 'text-blue-400 bg-blue-500/20 border-blue-500/30';
      default:
        return 'text-gray-400 bg-gray-500/20 border-gray-500/30';
    }
  };

  const getTimeAgo = (timestamp: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - timestamp.getTime()) / 60000);
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  const activeAlerts = alerts.filter(alert => !alert.resolved);
  const criticalAlerts = activeAlerts.filter(alert => alert.type === 'critical');
  const warningAlerts = activeAlerts.filter(alert => alert.type === 'warning');

  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white">Threat Overview</h2>
        <div className="flex items-center space-x-4 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded-full pulse-glow"></div>
            <span className="text-white/80">{criticalAlerts.length} Critical</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <span className="text-white/80">{warningAlerts.length} Warning</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span className="text-white/80">{alerts.filter(a => a.type === 'info' && !a.resolved).length} Info</span>
          </div>
        </div>
      </div>

      <div className="space-y-4 max-h-80 overflow-y-auto">
        {alerts.slice(0, 5).map((alert) => {
          const Icon = getAlertIcon(alert.type, alert.resolved);
          const colorClass = getAlertColor(alert.type, alert.resolved);
          
          return (
            <div
              key={alert.id}
              className={`p-4 rounded-lg border transition-all duration-200 hover:scale-[1.01] ${
                alert.resolved 
                  ? 'bg-white/5 border-white/10 opacity-60' 
                  : colorClass
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1">
                  <div className={`p-1 rounded border ${colorClass}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className={`text-sm font-semibold ${alert.resolved ? 'text-white/60' : 'text-white'}`}>
                      {alert.title}
                    </h3>
                    <p className={`text-xs mt-1 ${alert.resolved ? 'text-white/40' : 'text-white/70'}`}>
                      {alert.message}
                    </p>
                    <div className="flex items-center space-x-3 mt-2 text-xs">
                      <span className="text-white/50">{alert.source}</span>
                      <span className="text-white/50">{getTimeAgo(alert.timestamp)}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 ml-3">
                  {!alert.resolved && (
                    <button className="px-3 py-1 text-xs bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors">
                      Resolve
                    </button>
                  )}
                  <div className={`px-2 py-1 text-xs rounded-full border ${colorClass}`}>
                    {alert.resolved ? 'Resolved' : alert.type.charAt(0).toUpperCase() + alert.type.slice(1)}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {alerts.length === 0 && (
        <div className="text-center py-8">
          <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
          <p className="text-white/60">No security alerts at this time</p>
        </div>
      )}

      <div className="mt-6 pt-4 border-t border-white/10">
        <button className="w-full py-2 text-sm text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
          View All Alerts ({alerts.length})
        </button>
      </div>
    </div>
  );
};

export default ThreatOverview;