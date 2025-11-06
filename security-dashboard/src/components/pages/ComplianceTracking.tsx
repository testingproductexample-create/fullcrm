import React, { useState } from 'react';
import { useSecurity } from '../../context/SecurityContext';
import { FileCheck, Play, CheckCircle, AlertCircle, XCircle, Calendar, TrendingUp, Download, RefreshCw } from 'lucide-react';

const ComplianceTracking: React.FC = () => {
  const { compliance, checkCompliance, isLoading } = useSecurity();
  const [selectedStandard, setSelectedStandard] = useState('all');

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'compliant':
        return CheckCircle;
      case 'partial':
        return AlertCircle;
      case 'non-compliant':
        return XCircle;
      default:
        return AlertCircle;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'compliant':
        return 'text-green-400 bg-green-500/20 border-green-500/30';
      case 'partial':
        return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
      case 'non-compliant':
        return 'text-red-400 bg-red-500/20 border-red-500/30';
      default:
        return 'text-gray-400 bg-gray-500/20 border-gray-500/30';
    }
  };

  const getDaysUntilReview = (nextReview: Date) => {
    const now = new Date();
    const diffInDays = Math.ceil((nextReview.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diffInDays;
  };

  const stats = {
    total: compliance.length,
    compliant: compliance.filter(c => c.status === 'compliant').length,
    partial: compliance.filter(c => c.status === 'partial').length,
    nonCompliant: compliance.filter(c => c.status === 'non-compliant').length,
    averageScore: compliance.length > 0 
      ? compliance.reduce((sum, item) => sum + item.score, 0) / compliance.length 
      : 0
  };

  const filteredCompliance = selectedStandard === 'all' 
    ? compliance 
    : compliance.filter(item => item.standard === selectedStandard);

  const uniqueStandards = [...new Set(compliance.map(item => item.standard))];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Compliance Tracking</h1>
          <p className="text-white/60 mt-1">Monitor and manage regulatory compliance status</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button className="flex items-center space-x-2 px-4 py-2 glass-button hover:bg-white/10 text-white">
            <Download className="w-4 h-4" />
            <span>Export Report</span>
          </button>
          
          <button 
            onClick={checkCompliance}
            disabled={isLoading}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/30 rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Run Compliance Check</span>
          </button>
        </div>
      </div>

      {/* Compliance Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="glass-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white/60">Total Standards</p>
              <p className="text-2xl font-bold text-white">{stats.total}</p>
            </div>
            <FileCheck className="w-8 h-8 text-blue-400" />
          </div>
        </div>
        
        <div className="glass-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white/60">Compliant</p>
              <p className="text-2xl font-bold text-green-400">{stats.compliant}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-400" />
          </div>
        </div>
        
        <div className="glass-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white/60">Partial</p>
              <p className="text-2xl font-bold text-yellow-400">{stats.partial}</p>
            </div>
            <AlertCircle className="w-8 h-8 text-yellow-400" />
          </div>
        </div>
        
        <div className="glass-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white/60">Non-Compliant</p>
              <p className="text-2xl font-bold text-red-400">{stats.nonCompliant}</p>
            </div>
            <XCircle className="w-8 h-8 text-red-400" />
          </div>
        </div>
        
        <div className="glass-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white/60">Average Score</p>
              <p className="text-2xl font-bold text-purple-400">{stats.averageScore.toFixed(0)}%</p>
            </div>
            <TrendingUp className="w-8 h-8 text-purple-400" />
          </div>
        </div>
      </div>

      {/* Compliance Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Compliance Trends</h3>
          <div className="space-y-4">
            {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'].map((month, index) => {
              const score = 75 + Math.random() * 20; // Random scores between 75-95
              return (
                <div key={month} className="flex items-center justify-between">
                  <span className="text-white/80">{month}</span>
                  <div className="flex items-center space-x-3">
                    <div className="w-32 bg-white/10 rounded-full h-2">
                      <div 
                        className="h-2 bg-blue-500 rounded-full transition-all duration-500" 
                        style={{ width: `${score}%` }}
                      />
                    </div>
                    <span className="text-white font-medium w-12 text-right">{score.toFixed(0)}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Status Distribution</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 glass-button">
              <div className="flex items-center space-x-3">
                <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                <span className="text-white/80">Compliant</span>
              </div>
              <span className="text-white font-medium">{stats.compliant}</span>
            </div>
            
            <div className="flex items-center justify-between p-3 glass-button">
              <div className="flex items-center space-x-3">
                <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
                <span className="text-white/80">Partial</span>
              </div>
              <span className="text-white font-medium">{stats.partial}</span>
            </div>
            
            <div className="flex items-center justify-between p-3 glass-button">
              <div className="flex items-center space-x-3">
                <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                <span className="text-white/80">Non-Compliant</span>
              </div>
              <span className="text-white font-medium">{stats.nonCompliant}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="glass-card p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <span className="text-sm text-white/80">Filter by Standard:</span>
            <select
              value={selectedStandard}
              onChange={(e) => setSelectedStandard(e.target.value)}
              className="px-3 py-2 glass-button bg-white/5 text-white focus:outline-none"
            >
              <option value="all">All Standards</option>
              {uniqueStandards.map(standard => (
                <option key={standard} value={standard}>{standard}</option>
              ))}
            </select>
          </div>
          
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-white/60" />
            <span className="text-sm text-white/60">Last updated: {new Date().toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      {/* Compliance Items */}
      <div className="space-y-4">
        {filteredCompliance.map((item) => {
          const Icon = getStatusIcon(item.status);
          const colorClass = getStatusColor(item.status);
          const daysUntilReview = getDaysUntilReview(item.nextReview);
          
          return (
            <div key={item.id} className="glass-card p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start space-x-4">
                  <div className={`p-3 rounded-lg border ${colorClass}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-xl font-semibold text-white">{item.standard}</h3>
                      <div className={`px-3 py-1 text-sm rounded-full border ${colorClass}`}>
                        {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                      </div>
                    </div>
                    
                    <p className="text-white/80 mb-3">{item.requirement}</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-white/60">Compliance Score:</span>
                        <div className="flex items-center space-x-2 mt-1">
                          <div className="flex-1 bg-white/10 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full transition-all duration-500 ${
                                item.status === 'compliant' ? 'bg-green-500' :
                                item.status === 'partial' ? 'bg-yellow-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${item.score}%` }}
                            />
                          </div>
                          <span className="text-white font-medium">{item.score}%</span>
                        </div>
                      </div>
                      
                      <div>
                        <span className="text-white/60">Last Check:</span>
                        <p className="text-white font-medium mt-1">{item.lastCheck.toLocaleDateString()}</p>
                      </div>
                      
                      <div>
                        <span className="text-white/60">Next Review:</span>
                        <p className={`font-medium mt-1 ${
                          daysUntilReview > 7 ? 'text-green-400' :
                          daysUntilReview > 0 ? 'text-yellow-400' : 'text-red-400'
                        }`}>
                          {daysUntilReview > 0 ? `${daysUntilReview} days` : 'Overdue'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3 ml-6">
                  <button className="px-4 py-2 glass-button hover:bg-white/10 text-white">
                    View Details
                  </button>
                  
                  <button className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/30 rounded-lg transition-colors">
                    Remediate
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredCompliance.length === 0 && (
        <div className="glass-card p-12 text-center">
          <FileCheck className="w-16 h-16 text-white/40 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white/80 mb-2">No compliance items found</h3>
          <p className="text-white/60">No compliance items match your current filter criteria.</p>
        </div>
      )}
    </div>
  );
};

export default ComplianceTracking;