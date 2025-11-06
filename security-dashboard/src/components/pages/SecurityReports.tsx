import React, { useState } from 'react';
import { BarChart3, Download, Calendar, Filter, TrendingUp, AlertTriangle, Shield, Activity } from 'lucide-react';

const SecurityReports: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('7d');
  const [selectedReport, setSelectedReport] = useState('overview');

  const reportTypes = [
    {
      id: 'overview',
      name: 'Security Overview',
      description: 'Comprehensive security status and metrics',
      icon: Shield,
      lastGenerated: '2 hours ago'
    },
    {
      id: 'threats',
      name: 'Threat Analysis',
      description: 'Detailed threat intelligence and analysis',
      icon: AlertTriangle,
      lastGenerated: '1 day ago'
    },
    {
      id: 'compliance',
      name: 'Compliance Report',
      description: 'Regulatory compliance status and audit trail',
      icon: BarChart3,
      lastGenerated: '3 days ago'
    },
    {
      id: 'performance',
      name: 'System Performance',
      description: 'Security system performance metrics',
      icon: Activity,
      lastGenerated: '1 week ago'
    }
  ];

  const quickStats = [
    { label: 'Total Threats', value: '1,247', change: '+12%', trend: 'up' },
    { label: 'Incidents Resolved', value: '1,189', change: '+8%', trend: 'up' },
    { label: 'Avg Response Time', value: '2.3min', change: '-15%', trend: 'down' },
    { label: 'System Uptime', value: '99.9%', change: '+0.1%', trend: 'up' }
  ];

  const exportOptions = [
    { format: 'PDF', description: 'Full detailed report' },
    { format: 'Excel', description: 'Data spreadsheet' },
    { format: 'CSV', description: 'Raw data export' },
    { format: 'JSON', description: 'API compatible data' }
  ];

  // Generate mock data for the period
  const getDataForPeriod = (period: string) => {
    const periods = {
      '1d': 6,
      '7d': 7,
      '30d': 30,
      '90d': 12
    };
    
    const count = periods[period as keyof typeof periods] || 7;
    return Array.from({ length: count }, (_, i) => ({
      period: i + 1,
      threats: Math.floor(Math.random() * 50) + 10,
      incidents: Math.floor(Math.random() * 20) + 5,
      compliance: Math.floor(Math.random() * 20) + 80,
      performance: Math.floor(Math.random() * 15) + 85
    }));
  };

  const reportData = getDataForPeriod(selectedPeriod);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Security Reports</h1>
          <p className="text-white/60 mt-1">Generate and analyze comprehensive security reports</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-white/60" />
            <select 
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="px-3 py-1 glass-button bg-white/5 text-white text-sm focus:outline-none"
            >
              <option value="1d">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
            </select>
          </div>
          
          <button className="flex items-center space-x-2 px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/30 rounded-lg transition-colors">
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {quickStats.map((stat, index) => (
          <div key={index} className="glass-card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/60">{stat.label}</p>
                <p className="text-2xl font-bold text-white">{stat.value}</p>
                <p className={`text-sm ${stat.trend === 'up' ? 'text-green-400' : 'text-red-400'}`}>
                  {stat.change} from last period
                </p>
              </div>
              <TrendingUp className={`w-8 h-8 ${stat.trend === 'up' ? 'text-green-400' : 'text-red-400'}`} />
            </div>
          </div>
        ))}
      </div>

      {/* Report Generation */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Report Visualization */}
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-white">Security Metrics Trend</h3>
              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4 text-white/60" />
                <select 
                  value={selectedReport}
                  onChange={(e) => setSelectedReport(e.target.value)}
                  className="px-3 py-1 glass-button bg-white/5 text-white text-sm focus:outline-none"
                >
                  <option value="overview">Overview</option>
                  <option value="threats">Threats</option>
                  <option value="incidents">Incidents</option>
                  <option value="compliance">Compliance</option>
                </select>
              </div>
            </div>
            
            <div className="space-y-6">
              {reportData.map((data, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-white/80">Period {data.period}</span>
                    <span className="text-white/60">{data.threats} threats, {data.incidents} incidents</span>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    <div>
                      <div className="text-xs text-white/60 mb-1">Threats</div>
                      <div className="w-full bg-white/10 rounded h-2">
                        <div className="h-2 bg-red-500 rounded" style={{ width: `${(data.threats / 60) * 100}%` }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-white/60 mb-1">Incidents</div>
                      <div className="w-full bg-white/10 rounded h-2">
                        <div className="h-2 bg-yellow-500 rounded" style={{ width: `${(data.incidents / 30) * 100}%` }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-white/60 mb-1">Compliance</div>
                      <div className="w-full bg-white/10 rounded h-2">
                        <div className="h-2 bg-green-500 rounded" style={{ width: `${data.compliance}%` }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-white/60 mb-1">Performance</div>
                      <div className="w-full bg-white/10 rounded h-2">
                        <div className="h-2 bg-blue-500 rounded" style={{ width: `${data.performance}%` }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Detailed Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="glass-card p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Compliance Score</h3>
              <div className="space-y-4">
                {reportData.slice(0, 6).map((data, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-white/80">Period {data.period}</span>
                    <div className="flex items-center space-x-3">
                      <div className="w-24 bg-white/10 rounded-full h-2">
                        <div className="h-2 bg-green-500 rounded-full" style={{ width: `${data.compliance}%` }}></div>
                      </div>
                      <span className="text-white font-medium w-12 text-right">{data.compliance}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass-card p-6">
              <h3 className="text-lg font-semibold text-white mb-4">System Performance</h3>
              <div className="space-y-4">
                {reportData.slice(0, 6).map((data, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-white/80">Period {data.period}</span>
                    <div className="flex items-center space-x-3">
                      <div className="w-24 bg-white/10 rounded-full h-2">
                        <div className="h-2 bg-blue-500 rounded-full" style={{ width: `${data.performance}%` }}></div>
                      </div>
                      <span className="text-white font-medium w-12 text-right">{data.performance}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Report Generation Panel */}
        <div className="space-y-6">
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Generate Reports</h3>
            
            <div className="space-y-3">
              {reportTypes.map((report) => {
                const Icon = report.icon;
                return (
                  <div key={report.id} className="p-4 glass-button hover:bg-white/10 transition-colors cursor-pointer">
                    <div className="flex items-start space-x-3">
                      <Icon className="w-5 h-5 text-blue-400 mt-1" />
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-white">{report.name}</h4>
                        <p className="text-xs text-white/60 mt-1">{report.description}</p>
                        <p className="text-xs text-white/40 mt-2">Last generated: {report.lastGenerated}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Export Options */}
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Export Options</h3>
            
            <div className="space-y-2">
              {exportOptions.map((option) => (
                <button
                  key={option.format}
                  className="w-full p-3 glass-button hover:bg-white/10 transition-colors text-left"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-medium text-white">{option.format}</span>
                      <p className="text-xs text-white/60">{option.description}</p>
                    </div>
                    <Download className="w-4 h-4 text-white/40" />
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Scheduled Reports */}
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Scheduled Reports</h3>
            
            <div className="space-y-3">
              <div className="p-3 glass-button">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-white">Daily Security Summary</p>
                    <p className="text-xs text-white/60">Every day at 8:00 AM</p>
                  </div>
                  <div className="w-2 h-2 bg-green-500 rounded-full pulse-glow"></div>
                </div>
              </div>
              
              <div className="p-3 glass-button">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-white">Weekly Compliance Report</p>
                    <p className="text-xs text-white/60">Every Monday at 9:00 AM</p>
                  </div>
                  <div className="w-2 h-2 bg-green-500 rounded-full pulse-glow"></div>
                </div>
              </div>
              
              <button className="w-full py-2 text-sm text-blue-400 hover:text-blue-300 transition-colors">
                + Add Scheduled Report
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SecurityReports;