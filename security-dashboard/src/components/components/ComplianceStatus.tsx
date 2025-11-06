import React from 'react';
import { FileCheck, CheckCircle, AlertCircle, XCircle, Calendar, TrendingUp } from 'lucide-react';

interface ComplianceItem {
  id: string;
  standard: string;
  requirement: string;
  status: 'compliant' | 'partial' | 'non-compliant';
  lastCheck: Date;
  score: number;
  nextReview: Date;
}

interface ComplianceStatusProps {
  compliance: ComplianceItem[];
}

const ComplianceStatus: React.FC<ComplianceStatusProps> = ({ compliance }) => {
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
    const diffInDays = Math.ceil((nextReview.getTime() - now.getTime()) / (1000 * 3600 * 24));
    return diffInDays;
  };

  const overallScore = compliance.length > 0 
    ? compliance.reduce((sum, item) => sum + item.score, 0) / compliance.length 
    : 0;

  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white">Compliance Status</h2>
        <div className="text-right">
          <div className="text-2xl font-bold text-white">{overallScore.toFixed(0)}%</div>
          <div className="text-xs text-white/60">Overall Score</div>
        </div>
      </div>

      <div className="space-y-4">
        {compliance.map((item) => {
          const Icon = getStatusIcon(item.status);
          const colorClass = getStatusColor(item.status);
          const daysUntilReview = getDaysUntilReview(item.nextReview);
          
          return (
            <div key={item.id} className="p-4 glass-button">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg border ${colorClass}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white">{item.standard}</h3>
                    <p className="text-xs text-white/60">{item.requirement}</p>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="text-lg font-bold text-white">{item.score}%</div>
                  <div className={`text-xs px-2 py-1 rounded-full border ${colorClass}`}>
                    {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-xs text-white/60">
                <div>
                  <span className="text-white/40">Last Check:</span>
                  <div className="font-medium">{item.lastCheck.toLocaleDateString()}</div>
                </div>
                <div>
                  <span className="text-white/40">Next Review:</span>
                  <div className="font-medium">
                    {daysUntilReview > 0 ? `${daysUntilReview} days` : 'Overdue'}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 pt-4 border-t border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-4 h-4 text-green-400" />
              <span className="text-white/80">Improving</span>
            </div>
          </div>
          
          <button className="px-4 py-2 text-sm bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors">
            Run Compliance Check
          </button>
        </div>
      </div>
    </div>
  );
};

export default ComplianceStatus;