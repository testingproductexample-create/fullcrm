import React from 'react';
import { AlertTriangle, TrendingUp, Shield, Eye } from 'lucide-react';

const TopThreats: React.FC = () => {
  const threats = [
    {
      id: '1',
      name: 'SQL Injection Attempts',
      severity: 'high',
      count: 23,
      trend: 'up',
      description: 'Multiple SQL injection attempts detected from external IPs',
      timeframe: '24h'
    },
    {
      id: '2',
      name: 'Brute Force Attacks',
      severity: 'medium',
      count: 15,
      trend: 'up',
      description: 'Coordinated brute force attacks on user accounts',
      timeframe: '12h'
    },
    {
      id: '3',
      name: 'DDoS Traffic',
      severity: 'low',
      count: 8,
      trend: 'down',
      description: 'Unusual traffic patterns detected',
      timeframe: '6h'
    },
    {
      id: '4',
      name: 'Malware Detection',
      severity: 'high',
      count: 3,
      trend: 'stable',
      description: 'Malicious files quarantined',
      timeframe: '1h'
    }
  ];

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'text-red-400 bg-red-500/20 border-red-500/30';
      case 'medium':
        return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
      case 'low':
        return 'text-green-400 bg-green-500/20 border-green-500/30';
      default:
        return 'text-gray-400 bg-gray-500/20 border-gray-500/30';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return TrendingUp;
      case 'down':
        return TrendingUp;
      default:
        return Eye;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'up':
        return 'text-red-400';
      case 'down':
        return 'text-green-400';
      default:
        return 'text-white/40';
    }
  };

  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white">Top Threats</h2>
        <div className="flex items-center space-x-2 text-sm">
          <AlertTriangle className="w-4 h-4 text-red-400" />
          <span className="text-white/80">Last 24 hours</span>
        </div>
      </div>

      <div className="space-y-4">
        {threats.map((threat, index) => {
          const TrendIcon = getTrendIcon(threat.trend);
          const severityColor = getSeverityColor(threat.severity);
          const trendColor = getTrendColor(threat.trend);
          
          return (
            <div
              key={threat.id}
              className="p-4 glass-button hover:bg-white/10 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center justify-center w-8 h-8 bg-white/10 rounded-lg text-white font-bold text-sm">
                    {index + 1}
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white">{threat.name}</h3>
                    <p className="text-xs text-white/60">{threat.description}</p>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg font-bold text-white">{threat.count}</span>
                    <TrendIcon className={`w-4 h-4 ${trendColor}`} />
                  </div>
                  <div className="text-xs text-white/50">{threat.timeframe}</div>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className={`px-3 py-1 text-xs rounded-full border ${severityColor}`}>
                  {threat.severity.charAt(0).toUpperCase() + threat.severity.slice(1)} Severity
                </div>
                
                <div className="flex items-center space-x-2">
                  <button className="px-3 py-1 text-xs bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors">
                    Investigate
                  </button>
                  <button className="px-3 py-1 text-xs bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-full border border-blue-500/30 transition-colors">
                    View Details
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 pt-4 border-t border-white/10">
        <div className="flex items-center justify-between">
          <div className="text-sm text-white/80">
            Threat intelligence updated every 5 minutes
          </div>
          <button className="px-4 py-2 text-sm bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors">
            View All Threats
          </button>
        </div>
      </div>
    </div>
  );
};

export default TopThreats;