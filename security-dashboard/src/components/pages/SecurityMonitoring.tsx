import React, { useState, useEffect } from 'react';
import { useSecurity } from '../../context/SecurityContext';
import { Play, Pause, RotateCcw, Filter, Search, Download, Activity, TrendingUp } from 'lucide-react';

const SecurityMonitoring: React.FC = () => {
  const { events, addEvent } = useSecurity();
  const [isMonitoring, setIsMonitoring] = useState(true);
  const [timeRange, setTimeRange] = useState('24h');
  const [filter, setFilter] = useState('all');

  // Mock data for simple metrics
  const trafficMetrics = {
    incoming: 1250,
    outgoing: 890,
    threats: 15,
    bandwidth: 85
  };

  // Simulate real-time event generation
  useEffect(() => {
    if (isMonitoring) {
      const interval = setInterval(() => {
        const eventTypes = ['login', 'access', 'data', 'system'] as const;
        const severities = ['low', 'medium', 'high', 'critical'] as const;
        const statuses = ['pending', 'investigating', 'resolved'] as const;
        
        const randomEvent = {
          type: eventTypes[Math.floor(Math.random() * eventTypes.length)],
          severity: severities[Math.floor(Math.random() * severities.length)],
          description: `Security event detected: ${Math.random().toString(36).substr(2, 9)}`,
          source: `source_${Math.floor(Math.random() * 1000)}`,
          status: statuses[Math.floor(Math.random() * statuses.length)]
        };
        
        addEvent(randomEvent);
      }, 10000); // Add event every 10 seconds

      return () => clearInterval(interval);
    }
  }, [isMonitoring, addEvent]);

  const toggleMonitoring = () => {
    setIsMonitoring(!isMonitoring);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Security Monitoring</h1>
          <p className="text-white/60 mt-1">Real-time security event monitoring and analysis</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-white/80">Time Range:</span>
            <select 
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-3 py-1 glass-button bg-white/5 text-white text-sm focus:outline-none"
            >
              <option value="1h">1 Hour</option>
              <option value="6h">6 Hours</option>
              <option value="24h">24 Hours</option>
              <option value="7d">7 Days</option>
            </select>
          </div>
          
          <button
            onClick={toggleMonitoring}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
              isMonitoring 
                ? 'bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30' 
                : 'bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/30'
            }`}
          >
            {isMonitoring ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            <span>{isMonitoring ? 'Pause' : 'Start'}</span>
          </button>
          
          <button className="flex items-center space-x-2 px-4 py-2 glass-button hover:bg-white/10 text-white">
            <RotateCcw className="w-4 h-4" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Monitoring Status */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white/60">Status</p>
              <p className={`text-lg font-bold ${isMonitoring ? 'text-green-400' : 'text-red-400'}`}>
                {isMonitoring ? 'Active' : 'Paused'}
              </p>
            </div>
            <div className={`w-3 h-3 rounded-full ${isMonitoring ? 'bg-green-500 pulse-glow' : 'bg-red-500'}`}></div>
          </div>
        </div>
        
        <div className="glass-card p-4">
          <div className="text-sm text-white/60">Events Today</div>
          <div className="text-2xl font-bold text-white">1,247</div>
        </div>
        
        <div className="glass-card p-4">
          <div className="text-sm text-white/60">Critical Alerts</div>
          <div className="text-2xl font-bold text-red-400">3</div>
        </div>
        
        <div className="glass-card p-4">
          <div className="text-sm text-white/60">Response Time</div>
          <div className="text-2xl font-bold text-green-400">12ms</div>
        </div>
      </div>

      {/* Traffic Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Network Traffic</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-white/80">Incoming Traffic</span>
              <span className="text-white font-bold">{trafficMetrics.incoming} MB</span>
            </div>
            <div className="w-full bg-white/10 rounded-full h-2">
              <div className="h-2 bg-blue-500 rounded-full" style={{ width: '75%' }}></div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-white/80">Outgoing Traffic</span>
              <span className="text-white font-bold">{trafficMetrics.outgoing} MB</span>
            </div>
            <div className="w-full bg-white/10 rounded-full h-2">
              <div className="h-2 bg-green-500 rounded-full" style={{ width: '60%' }}></div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-white/80">Threats Detected</span>
              <span className="text-white font-bold">{trafficMetrics.threats}</span>
            </div>
            <div className="w-full bg-white/10 rounded-full h-2">
              <div className="h-2 bg-red-500 rounded-full" style={{ width: '25%' }}></div>
            </div>
          </div>
        </div>

        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold text-white mb-4">System Performance</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-white/80">CPU Usage</span>
              <span className="text-white font-bold">{trafficMetrics.bandwidth}%</span>
            </div>
            <div className="w-full bg-white/10 rounded-full h-2">
              <div className="h-2 bg-yellow-500 rounded-full" style={{ width: `${trafficMetrics.bandwidth}%` }}></div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-white/80">Memory Usage</span>
              <span className="text-white font-bold">68%</span>
            </div>
            <div className="w-full bg-white/10 rounded-full h-2">
              <div className="h-2 bg-blue-500 rounded-full" style={{ width: '68%' }}></div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-white/80">Disk Usage</span>
              <span className="text-white font-bold">45%</span>
            </div>
            <div className="w-full bg-white/10 rounded-full h-2">
              <div className="h-2 bg-green-500 rounded-full" style={{ width: '45%' }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* Live Event Stream */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Live Event Stream</h3>
          
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-white/60" />
              <select 
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="px-3 py-1 glass-button bg-white/5 text-white text-sm focus:outline-none"
              >
                <option value="all">All Events</option>
                <option value="critical">Critical</option>
                <option value="high">High Severity</option>
                <option value="medium">Medium Severity</option>
                <option value="low">Low Severity</option>
              </select>
            </div>
            
            <button className="flex items-center space-x-2 px-3 py-1 glass-button hover:bg-white/10 text-white text-sm">
              <Download className="w-4 h-4" />
              <span>Export</span>
            </button>
          </div>
        </div>

        <div className="max-h-96 overflow-y-auto space-y-2">
          {events.slice(0, 20).map((event) => (
            <div
              key={event.id}
              className="flex items-center justify-between p-3 glass-button hover:bg-white/10 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <div className={`w-3 h-3 rounded-full ${
                  event.severity === 'critical' ? 'bg-red-500' :
                  event.severity === 'high' ? 'bg-orange-500' :
                  event.severity === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                } ${event.status === 'pending' ? 'pulse-glow' : ''}`}></div>
                
                <div>
                  <p className="text-sm text-white">{event.description}</p>
                  <p className="text-xs text-white/60">
                    {event.source} • {event.timestamp.toLocaleTimeString()} • {event.type}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <span className={`px-2 py-1 text-xs rounded border ${
                  event.severity === 'critical' ? 'text-red-400 bg-red-500/20 border-red-500/30' :
                  event.severity === 'high' ? 'text-orange-400 bg-orange-500/20 border-orange-500/30' :
                  event.severity === 'medium' ? 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30' :
                  'text-green-400 bg-green-500/20 border-green-500/30'
                }`}>
                  {event.severity}
                </span>
                <span className={`px-2 py-1 text-xs rounded border ${
                  event.status === 'resolved' ? 'text-green-400 bg-green-500/20 border-green-500/30' :
                  event.status === 'investigating' ? 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30' :
                  'text-blue-400 bg-blue-500/20 border-blue-500/30'
                }`}>
                  {event.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SecurityMonitoring;