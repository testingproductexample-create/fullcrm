import React, { useState } from 'react';
import { useSecurity } from '../../context/SecurityContext';
import { Search, Filter, Clock, AlertTriangle, CheckCircle, XCircle, Bell, Plus, Archive } from 'lucide-react';

const ThreatAlerts: React.FC = () => {
  const { alerts, resolveAlert } = useSecurity();
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('timestamp');

  const getAlertIcon = (type: string, resolved: boolean) => {
    if (resolved) return CheckCircle;
    
    switch (type) {
      case 'critical':
        return XCircle;
      case 'warning':
        return AlertTriangle;
      case 'info':
        return Bell;
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
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} days ago`;
  };

  const filteredAlerts = alerts
    .filter(alert => {
      if (searchTerm && !alert.title.toLowerCase().includes(searchTerm.toLowerCase()) && 
          !alert.message.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      
      if (filter === 'unresolved' && alert.resolved) return false;
      if (filter === 'critical' && alert.type !== 'critical') return false;
      if (filter === 'warning' && alert.type !== 'warning') return false;
      if (filter === 'info' && alert.type !== 'info') return false;
      
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'timestamp') {
        return b.timestamp.getTime() - a.timestamp.getTime();
      }
      return 0;
    });

  const stats = {
    total: alerts.length,
    unresolved: alerts.filter(a => !a.resolved).length,
    critical: alerts.filter(a => a.type === 'critical' && !a.resolved).length,
    resolved: alerts.filter(a => a.resolved).length
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Threat Alerts</h1>
          <p className="text-white/60 mt-1">Manage and monitor security threats and alerts</p>
        </div>
        
        <button className="flex items-center space-x-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 rounded-lg transition-colors">
          <Plus className="w-4 h-4" />
          <span>Create Alert</span>
        </button>
      </div>

      {/* Alert Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white/60">Total Alerts</p>
              <p className="text-2xl font-bold text-white">{stats.total}</p>
            </div>
            <Bell className="w-8 h-8 text-blue-400" />
          </div>
        </div>
        
        <div className="glass-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white/60">Unresolved</p>
              <p className="text-2xl font-bold text-yellow-400">{stats.unresolved}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-yellow-400" />
          </div>
        </div>
        
        <div className="glass-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white/60">Critical</p>
              <p className="text-2xl font-bold text-red-400">{stats.critical}</p>
            </div>
            <XCircle className="w-8 h-8 text-red-400" />
          </div>
        </div>
        
        <div className="glass-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white/60">Resolved</p>
              <p className="text-2xl font-bold text-green-400">{stats.resolved}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-400" />
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="glass-card p-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-3 md:space-y-0">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/40" />
              <input
                type="text"
                placeholder="Search alerts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 glass-button bg-white/5 text-white placeholder-white/40 focus:outline-none focus:bg-white/10 w-64"
              />
            </div>
            
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-3 py-2 glass-button bg-white/5 text-white focus:outline-none"
            >
              <option value="all">All Alerts</option>
              <option value="unresolved">Unresolved</option>
              <option value="critical">Critical</option>
              <option value="warning">Warning</option>
              <option value="info">Info</option>
            </select>
          </div>
          
          <div className="flex items-center space-x-3">
            <span className="text-sm text-white/80">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 glass-button bg-white/5 text-white focus:outline-none"
            >
              <option value="timestamp">Time</option>
              <option value="severity">Severity</option>
              <option value="status">Status</option>
            </select>
            
            <button className="flex items-center space-x-2 px-3 py-2 glass-button hover:bg-white/10 text-white">
              <Archive className="w-4 h-4" />
              <span>Archive</span>
            </button>
          </div>
        </div>
      </div>

      {/* Alerts List */}
      <div className="space-y-4">
        {filteredAlerts.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No alerts found</h3>
            <p className="text-white/60">All security alerts have been resolved or no alerts match your current filters.</p>
          </div>
        ) : (
          filteredAlerts.map((alert) => {
            const Icon = getAlertIcon(alert.type, alert.resolved);
            const colorClass = getAlertColor(alert.type, alert.resolved);
            
            return (
              <div
                key={alert.id}
                className={`glass-card p-6 transition-all duration-200 hover:scale-[1.01] ${
                  alert.resolved ? 'opacity-75' : ''
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    <div className={`p-3 rounded-lg border ${colorClass}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className={`text-lg font-semibold ${alert.resolved ? 'text-white/60' : 'text-white'}`}>
                          {alert.title}
                        </h3>
                        <div className={`px-3 py-1 text-xs rounded-full border ${colorClass}`}>
                          {alert.resolved ? 'Resolved' : alert.type.charAt(0).toUpperCase() + alert.type.slice(1)}
                        </div>
                      </div>
                      
                      <p className={`text-sm mb-3 ${alert.resolved ? 'text-white/60' : 'text-white/80'}`}>
                        {alert.message}
                      </p>
                      
                      <div className="flex items-center space-x-6 text-sm text-white/60">
                        <div className="flex items-center space-x-1">
                          <Clock className="w-4 h-4" />
                          <span>{getTimeAgo(alert.timestamp)}</span>
                        </div>
                        <span>Source: {alert.source}</span>
                        <span>ID: {alert.id}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3 ml-6">
                    {!alert.resolved && (
                      <button
                        onClick={() => resolveAlert(alert.id)}
                        className="px-4 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/30 rounded-lg transition-colors"
                      >
                        Resolve
                      </button>
                    )}
                    
                    <button className="px-4 py-2 glass-button hover:bg-white/10 text-white">
                      Investigate
                    </button>
                    
                    <button className="px-3 py-2 glass-button hover:bg-white/10 text-white">
                      <Archive className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ThreatAlerts;