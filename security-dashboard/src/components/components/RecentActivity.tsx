import React from 'react';
import { Activity, AlertTriangle, CheckCircle, Clock, TrendingUp, TrendingDown } from 'lucide-react';

interface SecurityEvent {
  id: string;
  type: 'login' | 'access' | 'data' | 'system';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  timestamp: Date;
  source: string;
  status: 'pending' | 'investigating' | 'resolved';
}

interface RecentActivityProps {
  events: SecurityEvent[];
}

const RecentActivity: React.FC<RecentActivityProps> = ({ events }) => {
  const getEventIcon = (type: string) => {
    switch (type) {
      case 'login':
        return Activity;
      case 'access':
        return Clock;
      case 'data':
        return TrendingUp;
      case 'system':
        return CheckCircle;
      default:
        return Activity;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'text-red-400 bg-red-500/20 border-red-500/30';
      case 'high':
        return 'text-orange-400 bg-orange-500/20 border-orange-500/30';
      case 'medium':
        return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
      case 'low':
        return 'text-green-400 bg-green-500/20 border-green-500/30';
      default:
        return 'text-gray-400 bg-gray-500/20 border-gray-500/30';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'resolved':
        return 'text-green-400 bg-green-500/20 border-green-500/30';
      case 'investigating':
        return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
      case 'pending':
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

  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white">Recent Activity</h2>
        <div className="flex items-center space-x-2 text-sm">
          <div className="w-2 h-2 bg-green-500 rounded-full pulse-glow"></div>
          <span className="text-white/80">Live Feed</span>
        </div>
      </div>

      <div className="space-y-3 max-h-80 overflow-y-auto">
        {events.map((event) => {
          const Icon = getEventIcon(event.type);
          const severityColor = getSeverityColor(event.severity);
          const statusColor = getStatusColor(event.status);
          
          return (
            <div
              key={event.id}
              className="p-3 glass-button hover:bg-white/10 transition-colors"
            >
              <div className="flex items-start space-x-3">
                <div className={`p-1.5 rounded border ${severityColor}`}>
                  <Icon className="w-3 h-3" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-sm font-medium text-white">{event.description}</h3>
                    <div className={`px-2 py-1 text-xs rounded-full border ${statusColor}`}>
                      {event.status}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-xs text-white/60">
                    <span>Source: {event.source}</span>
                    <span>{getTimeAgo(event.timestamp)}</span>
                  </div>
                  
                  <div className="mt-1">
                    <div className={`inline-block px-2 py-1 text-xs rounded border ${severityColor}`}>
                      {event.severity.charAt(0).toUpperCase() + event.severity.slice(1)} • {event.type}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {events.length === 0 && (
        <div className="text-center py-8">
          <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
          <p className="text-white/60">No recent activity</p>
        </div>
      )}

      <div className="mt-6 pt-4 border-t border-white/10">
        <button className="w-full py-2 text-sm text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
          View All Activity
        </button>
      </div>
    </div>
  );
};

export default RecentActivity;