import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './components/Card';
import { Button } from './components/Button';
import { Badge } from './components/Badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/Tabs';
import { OvertimeManagement } from './components/OvertimeManagement';
import { AllowancesManagement } from './components/AllowancesManagement';
import { ApprovalWorkflow } from './components/ApprovalWorkflow';
import { ReportsAnalytics } from './components/ReportsAnalytics';
import { ConfigurationPanel } from './components/ConfigurationPanel';
import { formatCurrency, formatHours } from './uaeCompliantCalculator';
import { OvertimeAllowancesService } from './service';
import { OvertimeAnalytics, OvertimeRecord, AllowanceRecord } from './types';
import { 
  Clock, 
  DollarSign, 
  Users, 
  TrendingUp, 
  FileText, 
  Settings,
  CheckCircle,
  AlertTriangle,
  Calendar,
  Filter
} from 'lucide-react';

export const OvertimeAllowancesDashboard: React.FC = () => {
  const [analytics, setAnalytics] = useState<OvertimeAnalytics | null>(null);
  const [recentOvertime, setRecentOvertime] = useState<OvertimeRecord[]>([]);
  const [recentAllowances, setRecentAllowances] = useState<AllowanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [analyticsData, overtimeData, allowancesData] = await Promise.all([
        OvertimeAllowancesService.getOvertimeAnalytics(),
        OvertimeAllowancesService.getOvertimeRecords(undefined, undefined, undefined),
        OvertimeAllowancesService.getAllowanceRecords(),
      ]);

      setAnalytics(analyticsData);
      setRecentOvertime(overtimeData.slice(0, 5));
      setRecentAllowances(allowancesData.slice(0, 5));
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading Overtime & Allowances Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="glass-card p-6 rounded-2xl">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Overtime & Allowances Management
              </h1>
              <p className="text-gray-600">
                UAE Labor Law Compliant Overtime Calculations & Employee Allowances
              </p>
            </div>
            <div className="flex space-x-3">
              <Button 
                variant="outline" 
                className="glass-button"
                onClick={() => setActiveTab('reports')}
              >
                <FileText className="w-4 h-4 mr-2" />
                Reports
              </Button>
              <Button 
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg"
                onClick={() => setActiveTab('config')}
              >
                <Settings className="w-4 h-4 mr-2" />
                Configure
              </Button>
            </div>
          </div>
        </div>

        {/* UAE Compliance Status */}
        {analytics && (
          <div className="glass-card p-4 rounded-2xl border border-emerald-200 bg-emerald-50/50">
            <div className="flex items-center space-x-3">
              <CheckCircle className="w-6 h-6 text-emerald-600" />
              <div>
                <h3 className="font-semibold text-emerald-900">UAE Labor Law Compliance</h3>
                <p className="text-sm text-emerald-700">
                  {analytics.complianceRate}% compliant • All overtime calculations follow UAE regulations
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Key Metrics Cards */}
        {analytics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="glass-card border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">Total Overtime Hours</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatHours(analytics.totalOvertimeHours)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Avg: {formatHours(analytics.averageOvertimeHours)} per employee
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <Clock className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">Overtime Cost</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatCurrency(analytics.costAnalysis.currentMonth)}
                    </p>
                    <p className={`text-xs mt-1 ${
                      analytics.costAnalysis.variancePercentage > 0 ? 'text-red-600' : 'text-green-600'
                    }`}>
                      {analytics.costAnalysis.variancePercentage > 0 ? '↗' : '↘'} 
                      {Math.abs(analytics.costAnalysis.variancePercentage)}% vs last month
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-emerald-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">Active Employees</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {recentAllowances.length}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {recentOvertime.filter(o => o.status === 'pending').length} pending approvals
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                    <Users className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">Compliance Rate</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {analytics.complianceRate}%
                    </p>
                    <p className="text-xs text-green-600 mt-1">
                      <CheckCircle className="w-3 h-3 inline mr-1" />
                      UAE Standards Met
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-amber-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Department Breakdown */}
        {analytics && analytics.departmentOvertime.length > 0 && (
          <Card className="glass-card border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-gray-900">Department Overtime Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {analytics.departmentOvertime.map((dept) => (
                  <div key={dept.department} className="p-4 rounded-lg bg-white/50 border border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900">{dept.department}</h4>
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                        {dept.employeeCount} employees
                      </Badge>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Hours:</span> {formatHours(dept.totalHours)}
                      </p>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full"
                          style={{ 
                            width: `${Math.min((dept.totalHours / 50) * 100, 100)}%` 
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Tabs Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 glass-card p-1">
            <TabsTrigger value="overview" className="data-[state=active]:bg-white/50">
              <Clock className="w-4 h-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="overtime" className="data-[state=active]:bg-white/50">
              <Clock className="w-4 h-4 mr-2" />
              Overtime
            </TabsTrigger>
            <TabsTrigger value="allowances" className="data-[state=active]:bg-white/50">
              <DollarSign className="w-4 h-4 mr-2" />
              Allowances
            </TabsTrigger>
            <TabsTrigger value="approvals" className="data-[state=active]:bg-white/50">
              <CheckCircle className="w-4 h-4 mr-2" />
              Approvals
            </TabsTrigger>
            <TabsTrigger value="config" className="data-[state=active]:bg-white/50">
              <Settings className="w-4 h-4 mr-2" />
              Config
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Overtime Records */}
              <Card className="glass-card border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-gray-900 flex items-center">
                    <Clock className="w-5 h-5 mr-2" />
                    Recent Overtime
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {recentOvertime.map((record) => (
                      <div key={record.id} className="flex items-center justify-between p-3 rounded-lg bg-white/50 border border-gray-200">
                        <div>
                          <p className="font-medium text-gray-900">{record.employeeName}</p>
                          <p className="text-sm text-gray-600">{record.date} • {record.department}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-gray-900">
                            {formatHours(record.overtimeHours)}
                          </p>
                          <Badge 
                            variant={record.status === 'approved' ? 'default' : 'secondary'}
                            className={`${
                              record.status === 'approved' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-yellow-100 text-yellow-800'
                            }`}
                          >
                            {record.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Recent Allowance Records */}
              <Card className="glass-card border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-gray-900 flex items-center">
                    <DollarSign className="w-5 h-5 mr-2" />
                    Active Allowances
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {recentAllowances.map((allowance) => (
                      <div key={allowance.id} className="flex items-center justify-between p-3 rounded-lg bg-white/50 border border-gray-200">
                        <div>
                          <p className="font-medium text-gray-900">{allowance.employeeName}</p>
                          <p className="text-sm text-gray-600 capitalize">
                            {allowance.allowanceType} • {allowance.department}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-gray-900">
                            {formatCurrency(allowance.amount)}
                          </p>
                          <Badge 
                            variant="default"
                            className="bg-blue-100 text-blue-800"
                          >
                            Active
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="overtime">
            <OvertimeManagement onDataChange={loadDashboardData} />
          </TabsContent>

          <TabsContent value="allowances">
            <AllowancesManagement onDataChange={loadDashboardData} />
          </TabsContent>

          <TabsContent value="approvals">
            <ApprovalWorkflow onDataChange={loadDashboardData} />
          </TabsContent>

          <TabsContent value="config">
            <ConfigurationPanel onDataChange={loadDashboardData} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default OvertimeAllowancesDashboard;