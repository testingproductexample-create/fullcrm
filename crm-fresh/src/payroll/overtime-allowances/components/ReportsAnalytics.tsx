import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './Card';
import { Button } from './Button';
import { OvertimeAllowancesService } from '../service';
import { formatCurrency, formatHours, UAE_LABOR_LAW } from '../uaeCompliantCalculator';
import { OvertimeReport, OvertimeAnalytics } from '../types';
import { 
  FileText, 
  TrendingUp, 
  TrendingDown, 
  BarChart3,
  Download,
  Calendar,
  DollarSign,
  Clock,
  Users,
  Building,
  PieChart,
  AlertTriangle,
  CheckCircle,
  Target
} from 'lucide-react';

interface ReportsAnalyticsProps {
  onDataChange: () => void;
}

export const ReportsAnalytics: React.FC<ReportsAnalyticsProps> = ({ onDataChange }) => {
  const [analytics, setAnalytics] = useState<OvertimeAnalytics | null>(null);
  const [report, setReport] = useState<OvertimeReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().substring(0, 7));
  const [activeView, setActiveView] = useState<'overview' | 'analytics' | 'report'>('overview');

  useEffect(() => {
    loadData();
  }, [selectedMonth]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [analyticsData, reportData] = await Promise.all([
        OvertimeAllowancesService.getOvertimeAnalytics(),
        OvertimeAllowancesService.generateOvertimeReport(selectedMonth),
      ]);
      
      setAnalytics(analyticsData);
      setReport(reportData);
    } catch (error) {
      console.error('Error loading reports and analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateMonthOptions = () => {
    const options = [];
    const currentDate = new Date();
    for (let i = 0; i < 12; i++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const monthStr = date.toISOString().substring(0, 7);
      const label = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
      options.push({ value: monthStr, label });
    }
    return options;
  };

  const exportReport = () => {
    // Mock export functionality
    const data = {
      month: selectedMonth,
      analytics,
      report
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `overtime-allowances-report-${selectedMonth}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <Card className="glass-card border-0">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h2 className="text-2xl font-bold text-gray-900">Reports & Analytics</h2>
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-gray-500" />
                <select
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                >
                  {generateMonthOptions().map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                onClick={exportReport}
                className="glass-button"
              >
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <Button
                onClick={loadData}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* View Tabs */}
      <div className="flex space-x-1 bg-white/50 p-1 rounded-lg">
        {[
          { key: 'overview', label: 'Overview', icon: <BarChart3 className="w-4 h-4" /> },
          { key: 'analytics', label: 'Analytics', icon: <TrendingUp className="w-4 h-4" /> },
          { key: 'report', label: 'Detailed Report', icon: <FileText className="w-4 h-4" /> },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveView(tab.key as any)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
              activeView === tab.key 
                ? 'bg-white shadow-sm text-gray-900' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeView === 'overview' && analytics && (
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="glass-card border-0">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Total Overtime Hours</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatHours(analytics.totalOvertimeHours)}
                    </p>
                    <p className="text-xs text-gray-500">
                      Avg: {formatHours(analytics.averageOvertimeHours)} per employee
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <Clock className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card border-0">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Total Cost</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatCurrency(analytics.costAnalysis.currentMonth)}
                    </p>
                    <p className={`text-xs ${
                      analytics.costAnalysis.variancePercentage > 0 ? 'text-red-600' : 'text-green-600'
                    }`}>
                      {analytics.costAnalysis.variancePercentage > 0 ? (
                        <TrendingUp className="w-3 h-3 inline mr-1" />
                      ) : (
                        <TrendingDown className="w-3 h-3 inline mr-1" />
                      )}
                      {Math.abs(analytics.costAnalysis.variancePercentage)}% vs last month
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-emerald-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card border-0">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Compliance Rate</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {analytics.complianceRate}%
                    </p>
                    <p className="text-xs text-green-600">
                      <CheckCircle className="w-3 h-3 inline mr-1" />
                      UAE Standards
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                    <Target className="w-6 h-6 text-amber-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card border-0">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Departments</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {analytics.departmentOvertime.length}
                    </p>
                    <p className="text-xs text-gray-500">
                      Active in overtime
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                    <Building className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Top Overtime Employees */}
          {analytics.topOvertimeEmployees.length > 0 && (
            <Card className="glass-card border-0">
              <CardHeader>
                <CardTitle className="text-gray-900">Top Overtime Employees</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics.topOvertimeEmployees.map((employee, index) => (
                    <div key={employee.employeeId} className="flex items-center justify-between p-3 rounded-lg bg-white/50 border border-gray-200">
                      <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                          index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : index === 2 ? 'bg-amber-600' : 'bg-blue-500'
                        }`}>
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{employee.employeeName}</p>
                          <p className="text-sm text-gray-600">
                            {formatHours(employee.totalHours)} hours • {formatCurrency(employee.totalAmount)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-gray-900">{formatCurrency(employee.totalAmount)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Analytics Tab */}
      {activeView === 'analytics' && analytics && (
        <div className="space-y-6">
          {/* Department Breakdown */}
          <Card className="glass-card border-0">
            <CardHeader>
              <CardTitle className="text-gray-900">Department Overtime Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.departmentOvertime.map((dept) => {
                  const maxHours = Math.max(...analytics.departmentOvertime.map(d => d.totalHours));
                  const percentage = maxHours > 0 ? (dept.totalHours / maxHours) * 100 : 0;
                  
                  return (
                    <div key={dept.department} className="p-4 rounded-lg bg-white/50 border border-gray-200">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <Building className="w-4 h-4 text-gray-600" />
                          <span className="font-medium text-gray-900">{dept.department}</span>
                        </div>
                        <span className="text-sm text-gray-600">{dept.employeeCount} employees</span>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Total Hours</span>
                          <span className="font-medium">{formatHours(dept.totalHours)}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <div className="text-xs text-gray-500">
                          {percentage.toFixed(1)}% of maximum department overtime
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Cost Analysis */}
          <Card className="glass-card border-0">
            <CardHeader>
              <CardTitle className="text-gray-900">Cost Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-4 rounded-lg bg-white/50 border border-gray-200">
                  <h4 className="font-medium text-gray-900 mb-3">Month-over-Month Comparison</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Current Month</span>
                      <span className="font-medium">{formatCurrency(analytics.costAnalysis.currentMonth)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Previous Month</span>
                      <span className="font-medium">{formatCurrency(analytics.costAnalysis.previousMonth)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Variance</span>
                      <span className={`font-medium ${
                        analytics.costAnalysis.variance > 0 ? 'text-red-600' : 'text-green-600'
                      }`}>
                        {analytics.costAnalysis.variance > 0 ? '+' : ''}{formatCurrency(analytics.costAnalysis.variance)}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="p-4 rounded-lg bg-white/50 border border-gray-200">
                  <h4 className="font-medium text-gray-900 mb-3">UAE Compliance Metrics</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Compliance Rate</span>
                      <span className="font-medium text-green-600">{analytics.complianceRate}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Max Daily Hours</span>
                      <span className="font-medium">{UAE_LABOR_LAW.maxWorkingHours + UAE_LABOR_LAW.maxOvertimeHours}h</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Max Overtime Rate</span>
                      <span className="font-medium">{(UAE_LABOR_LAW.overtimeRates.holiday * 100)}%</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Report Tab */}
      {activeView === 'report' && report && (
        <div className="space-y-6">
          {/* Report Header */}
          <Card className="glass-card border-0">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-gray-900">Monthly Overtime Report</CardTitle>
                  <p className="text-sm text-gray-600">
                    {new Date(selectedMonth).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  {report.complianceStatus === 'compliant' ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-amber-500" />
                  )}
                  <span className={`text-sm font-medium ${
                    report.complianceStatus === 'compliant' ? 'text-green-600' : 'text-amber-600'
                  }`}>
                    {report.complianceStatus.toUpperCase()}
                  </span>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Report Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="glass-card border-0">
              <CardContent className="p-6 text-center">
                <Clock className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-gray-900">{formatHours(report.totalOvertimeHours)}</p>
                <p className="text-sm text-gray-600">Total Overtime Hours</p>
              </CardContent>
            </Card>
            
            <Card className="glass-card border-0">
              <CardContent className="p-6 text-center">
                <DollarSign className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(report.totalOvertimeAmount)}</p>
                <p className="text-sm text-gray-600">Total Overtime Cost</p>
              </CardContent>
            </Card>
            
            <Card className="glass-card border-0">
              <CardContent className="p-6 text-center">
                <Target className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(report.totalAllowances)}</p>
                <p className="text-sm text-gray-600">Total Allowances</p>
              </CardContent>
            </Card>
          </div>

          {/* Department Breakdown */}
          <Card className="glass-card border-0">
            <CardHeader>
              <CardTitle className="text-gray-900">Department Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Department</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Employees</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Overtime Hours</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Overtime Cost</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Allowances</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.departmentBreakdown.map((dept) => (
                      <tr key={dept.department} className="border-b border-gray-100">
                        <td className="py-3 px-4 font-medium text-gray-900">{dept.department}</td>
                        <td className="py-3 px-4 text-gray-700">{dept.employeeCount}</td>
                        <td className="py-3 px-4 text-gray-700">{formatHours(dept.totalOvertimeHours)}</td>
                        <td className="py-3 px-4 text-gray-700">{formatCurrency(dept.totalOvertimeAmount)}</td>
                        <td className="py-3 px-4 text-gray-700">{formatCurrency(dept.totalAllowances)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Compliance Violations */}
          {report.violations && report.violations.length > 0 && (
            <Card className="glass-card border-0 border-amber-200 bg-amber-50/50">
              <CardHeader>
                <CardTitle className="text-amber-800 flex items-center">
                  <AlertTriangle className="w-5 h-5 mr-2" />
                  Compliance Violations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {report.violations.map((violation, index) => (
                    <li key={index} className="text-sm text-amber-700 flex items-start">
                      <span className="w-2 h-2 bg-amber-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                      {violation}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};