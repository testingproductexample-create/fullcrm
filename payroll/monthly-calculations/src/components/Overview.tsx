import React from 'react';
import { 
  Users, 
  DollarSign, 
  Clock, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  FileText,
  Calculator
} from 'lucide-react';
import { PayrollSummary } from '../../types/payroll';
import { formatAED } from '../../utils/calculations';

interface OverviewProps {
  summary: PayrollSummary | null;
  loading: boolean;
}

const Overview: React.FC<OverviewProps> = ({ summary, loading }) => {
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="glass-card p-6">
              <div className="loading-skeleton h-4 w-20 mb-2"></div>
              <div className="loading-skeleton h-8 w-32"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="glass-card p-8 text-center">
        <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-white mb-2">No Data Available</h3>
        <p className="text-gray-400">No payroll data found for the selected period.</p>
      </div>
    );
  }

  const stats = [
    {
      label: 'Total Employees',
      value: summary.total_employees,
      icon: Users,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/20'
    },
    {
      label: 'Total Gross Salary',
      value: formatAED(summary.total_gross_salary),
      icon: DollarSign,
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-500/10',
      borderColor: 'border-green-500/20'
    },
    {
      label: 'Total Net Salary',
      value: formatAED(summary.total_net_salary),
      icon: TrendingUp,
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-500/10',
      borderColor: 'border-purple-500/20'
    },
    {
      label: 'Pending Approvals',
      value: summary.pending_approvals,
      icon: AlertTriangle,
      color: 'from-orange-500 to-orange-600',
      bgColor: 'bg-orange-500/10',
      borderColor: 'border-orange-500/20'
    }
  ];

  const complianceScore = summary.uae_compliance_score;
  const isCompliant = complianceScore >= 95;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Payroll Overview</h2>
          <p className="text-gray-400">Monthly salary calculations and compliance status</p>
        </div>
        <div className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${
          isCompliant 
            ? 'bg-green-500/10 border-green-500/20 text-green-400'
            : 'bg-orange-500/10 border-orange-500/20 text-orange-400'
        }`}>
          {isCompliant ? (
            <CheckCircle className="w-4 h-4" />
          ) : (
            <AlertTriangle className="w-4 h-4" />
          )}
          <span className="font-medium">
            UAE Compliance: {complianceScore.toFixed(1)}%
          </span>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className={`glass-card p-6 ${stat.borderColor} border`}>
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 rounded-lg ${stat.bgColor} flex items-center justify-center`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-white">{stat.value}</p>
                </div>
              </div>
              <p className="text-sm text-gray-400">{stat.label}</p>
            </div>
          );
        })}
      </div>

      {/* Detailed Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Financial Breakdown */}
        <div className="glass-card p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-white">Financial Breakdown</h3>
          </div>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Gross Salary</span>
              <span className="text-white font-semibold">{formatAED(summary.total_gross_salary)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Total Deductions</span>
              <span className="text-red-400">{formatAED(summary.total_deductions)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Overtime Pay</span>
              <span className="text-blue-400">{formatAED(summary.total_overtime)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Commissions</span>
              <span className="text-purple-400">{formatAED(summary.total_commissions)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Bonuses</span>
              <span className="text-green-400">{formatAED(summary.total_bonuses)}</span>
            </div>
            <div className="border-t border-white/10 pt-4">
              <div className="flex justify-between items-center">
                <span className="text-white font-semibold">Net Salary</span>
                <span className="text-white font-bold text-lg">{formatAED(summary.total_net_salary)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions & Status */}
        <div className="glass-card p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
              <Calculator className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-white">Quick Actions</h3>
          </div>

          <div className="space-y-3">
            <button className="w-full p-4 text-left rounded-lg border border-white/10 hover:bg-white/5 transition-all">
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-blue-400" />
                <div>
                  <p className="text-white font-medium">Process Individual Calculations</p>
                  <p className="text-sm text-gray-400">Create new salary calculations</p>
                </div>
              </div>
            </button>

            <button className="w-full p-4 text-left rounded-lg border border-white/10 hover:bg-white/5 transition-all">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-green-400" />
                <div>
                  <p className="text-white font-medium">Bulk Processing</p>
                  <p className="text-sm text-gray-400">Process multiple employees at once</p>
                </div>
              </div>
            </button>

            <button className="w-full p-4 text-left rounded-lg border border-white/10 hover:bg-white/5 transition-all">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-orange-400" />
                <div>
                  <p className="text-white font-medium">Overtime Management</p>
                  <p className="text-sm text-gray-400">Review and adjust overtime hours</p>
                </div>
              </div>
            </button>

            <button className="w-full p-4 text-left rounded-lg border border-white/10 hover:bg-white/5 transition-all">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-purple-400" />
                <div>
                  <p className="text-white font-medium">Approval Workflow</p>
                  <p className="text-sm text-gray-400">Review pending calculations</p>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Processing Status */}
      {summary.processing_status !== 'idle' && (
        <div className="glass-card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="spinner"></div>
            <h3 className="text-lg font-semibold text-white">Processing Status</h3>
          </div>
          <p className="text-gray-400">
            {summary.processing_status === 'processing' && 'Calculations are being processed...'}
            {summary.processing_status === 'completed' && 'All calculations have been processed successfully.'}
            {summary.processing_status === 'failed' && 'An error occurred during processing.'}
          </p>
        </div>
      )}
    </div>
  );
};

export default Overview;