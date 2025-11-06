import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs';
import { 
  FileText, 
  Download, 
  TrendingUp, 
  TrendingDown,
  Calendar, 
  BarChart3,
  PieChart,
  Activity,
  AlertTriangle,
  CheckCircle,
  Users,
  Shield,
  Clock,
  Globe
} from 'lucide-react';
import { createClient } from '../../../../lib/supabase';
import { formatDate, formatDateTime } from '../../utils/uuid';

interface ComplianceReport {
  id: string;
  reportName: string;
  reportType: string;
  reportPeriodStart: string;
  reportPeriodEnd: string;
  reportData: any;
  keyMetrics: any;
  riskSummary: string;
  complianceScore: number;
  recommendations: string[];
  actionItems: string[];
  reportStatus: string;
  generatedBy?: string;
  approvedBy?: string;
  approvalDate?: string;
  publishedDate?: string;
  distributionList: string[];
  nextReportDate?: string;
  createdAt: string;
  updatedAt: string;
}

export const ComplianceReporting: React.FC<{ userId?: string; userRole?: string }> = ({ 
  userId, 
  userRole = 'user' 
}) => {
  const [reports, setReports] = useState<ComplianceReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('current_month');
  
  const [reportFilters, setReportFilters] = useState({
    reportType: 'monthly',
    startDate: '',
    endDate: '',
    includeMetrics: true,
    includeRecommendations: true,
    includeActionItems: true
  });

  const supabase = createClient();

  const reportTypes = [
    { value: 'monthly', label: 'Monthly Report', description: 'Monthly compliance overview' },
    { value: 'quarterly', label: 'Quarterly Report', description: 'Quarterly compliance review' },
    { value: 'annual', label: 'Annual Report', description: 'Annual compliance assessment' },
    { value: 'ad_hoc', label: 'Ad-hoc Report', description: 'Custom report on demand' },
    { value: 'incident_based', label: 'Incident-based Report', description: 'Report triggered by incidents' }
  ];

  const periods = [
    { value: 'current_month', label: 'Current Month' },
    { value: 'last_month', label: 'Last Month' },
    { value: 'current_quarter', label: 'Current Quarter' },
    { value: 'last_quarter', label: 'Last Quarter' },
    { value: 'current_year', label: 'Current Year' },
    { value: 'last_year', label: 'Last Year' },
    { value: 'custom', label: 'Custom Period' }
  ];

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('compliance_reports')
        .select('*')
        .order('created_at', { ascending: false });

      // Regular users might have limited access to reports
      if (userRole === 'user') {
        // Users can only see published reports
        query = query.eq('report_status', 'published');
      }

      const { data, error } = await query;

      if (error) throw error;
      setReports(data || []);
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateReport = async () => {
    try {
      setGenerating(true);

      // Get date range based on selected period
      const dateRange = getDateRange(selectedPeriod);
      
      // Collect data for the reporting period
      const reportData = await collectReportData(dateRange.start, dateRange.end);
      
      // Calculate compliance score
      const complianceScore = calculateComplianceScore(reportData);
      
      // Generate recommendations and action items
      const { recommendations, actionItems } = generateRecommendations(reportData, complianceScore);
      
      // Create report record
      const report = {
        report_name: `${reportTypes.find(rt => rt.value === reportFilters.reportType)?.label} - ${formatDate(new Date())}`,
        report_type: reportFilters.reportType,
        report_period_start: dateRange.start.toISOString().split('T')[0],
        report_period_end: dateRange.end.toISOString().split('T')[0],
        report_data: reportData,
        key_metrics: {
          totalConsents: reportData.consentMetrics?.total || 0,
          activeConsents: reportData.consentMetrics?.active || 0,
          dataSubjectRequests: reportData.requestMetrics?.total || 0,
          pendingRequests: reportData.requestMetrics?.pending || 0,
          overdueRequests: reportData.requestMetrics?.overdue || 0,
          processingActivities: reportData.activityMetrics?.total || 0,
          highRiskActivities: reportData.activityMetrics?.highRisk || 0,
          complianceIncidents: reportData.incidentMetrics?.total || 0,
          openIncidents: reportData.incidentMetrics?.open || 0
        },
        risk_summary: generateRiskSummary(reportData),
        compliance_score: complianceScore,
        recommendations: recommendations,
        action_items: actionItems,
        report_status: 'draft',
        generated_by: userId,
        distribution_list: [],
        next_report_date: getNextReportDate(reportFilters.reportType)
      };

      const { data, error } = await supabase
        .from('compliance_reports')
        .insert([report])
        .select()
        .single();

      if (error) throw error;

      setReports([data, ...reports]);
    } catch (error) {
      console.error('Error generating report:', error);
    } finally {
      setGenerating(false);
    }
  };

  const collectReportData = async (startDate: Date, endDate: Date) => {
    // This would collect all the data for the reporting period
    const [consentMetrics, requestMetrics, activityMetrics, incidentMetrics] = await Promise.all([
      getConsentMetrics(startDate, endDate),
      getRequestMetrics(startDate, endDate),
      getActivityMetrics(),
      getIncidentMetrics(startDate, endDate)
    ]);

    return {
      consentMetrics,
      requestMetrics,
      activityMetrics,
      incidentMetrics,
      reportPeriod: { start: startDate, end: endDate }
    };
  };

  const getConsentMetrics = async (startDate: Date, endDate: Date) => {
    const { data } = await supabase
      .from('consent_records')
      .select('*')
      .gte('consent_date', startDate.toISOString())
      .lte('consent_date', endDate.toISOString());

    if (!data) return { total: 0, active: 0, expired: 0, withdrawn: 0 };

    const now = new Date();
    const expired = data.filter(c => c.consent_expiry && new Date(c.consent_expiry) < now);
    const active = data.filter(c => c.is_active && !c.withdrawal_date);
    const withdrawn = data.filter(c => c.withdrawal_date);

    return {
      total: data.length,
      active: active.length,
      expired: expired.length,
      withdrawn: withdrawn.length
    };
  };

  const getRequestMetrics = async (startDate: Date, endDate: Date) => {
    const { data } = await supabase
      .from('data_subject_requests')
      .select('*')
      .gte('request_date', startDate.toISOString())
      .lte('request_date', endDate.toISOString());

    if (!data) return { total: 0, pending: 0, completed: 0, overdue: 0 };

    const pending = data.filter(r => r.request_status === 'pending' || r.request_status === 'in_progress');
    const completed = data.filter(r => r.request_status === 'completed');
    const overdue = data.filter(r => 
      (r.request_status === 'pending' || r.request_status === 'in_progress') &&
      new Date(r.processing_deadline) < new Date()
    );

    return {
      total: data.length,
      pending: pending.length,
      completed: completed.length,
      overdue: overdue.length
    };
  };

  const getActivityMetrics = async () => {
    const { data } = await supabase
      .from('data_processing_activities')
      .select('*')
      .eq('is_active', true);

    if (!data) return { total: 0, highRisk: 0, mediumRisk: 0, lowRisk: 0 };

    const highRisk = data.filter(a => a.risk_level === 'high' || a.risk_level === 'critical');
    const mediumRisk = data.filter(a => a.risk_level === 'medium');
    const lowRisk = data.filter(a => a.risk_level === 'low');

    return {
      total: data.length,
      highRisk: highRisk.length,
      mediumRisk: mediumRisk.length,
      lowRisk: lowRisk.length
    };
  };

  const getIncidentMetrics = async (startDate: Date, endDate: Date) => {
    const { data } = await supabase
      .from('compliance_incidents')
      .select('*')
      .gte('incident_date', startDate.toISOString())
      .lte('incident_date', endDate.toISOString());

    if (!data) return { total: 0, open: 0, resolved: 0, critical: 0 };

    const open = data.filter(i => i.incident_status === 'investigating' || i.incident_status === 'contained');
    const resolved = data.filter(i => i.incident_status === 'resolved' || i.incident_status === 'closed');
    const critical = data.filter(i => i.severity_level === 'critical' || i.severity_level === 'high');

    return {
      total: data.length,
      open: open.length,
      resolved: resolved.length,
      critical: critical.length
    };
  };

  const calculateComplianceScore = (data: any): number => {
    let score = 100;

    // Deduct for overdue requests
    if (data.requestMetrics?.overdue > 0) {
      score -= data.requestMetrics.overdue * 10;
    }

    // Deduct for expired consents
    if (data.consentMetrics?.expired > 0) {
      score -= data.consentMetrics.expired * 3;
    }

    // Deduct for high-risk activities
    if (data.activityMetrics?.highRisk > 0) {
      score -= data.activityMetrics.highRisk * 8;
    }

    // Deduct for open incidents
    if (data.incidentMetrics?.open > 0) {
      score -= data.incidentMetrics.open * 15;
    }

    return Math.max(0, Math.min(100, score));
  };

  const generateRecommendations = (data: any, score: number) => {
    const recommendations = [];
    const actionItems = [];

    if (data.requestMetrics?.overdue > 0) {
      recommendations.push('Address overdue data subject requests immediately to maintain compliance');
      actionItems('Review and prioritize all pending data subject requests');
    }

    if (data.consentMetrics?.expired > 0) {
      recommendations.push('Renew expired consents to ensure lawful processing');
      actionItems('Contact users to renew expired consents');
    }

    if (data.activityMetrics?.highRisk > 0) {
      recommendations.push('Conduct DPEA for high-risk processing activities');
      actionItems('Schedule DPEA for all high-risk activities');
    }

    if (data.incidentMetrics?.open > 0) {
      recommendations.push('Resolve open compliance incidents to minimize risk');
      actionItems('Investigate and resolve all open compliance incidents');
    }

    if (score < 70) {
      recommendations.push('Overall compliance score is below acceptable threshold');
      actionItems('Implement comprehensive compliance improvement plan');
    }

    return { recommendations, actionItems };
  };

  const generateRiskSummary = (data: any): string => {
    const risks = [];

    if (data.requestMetrics?.overdue > 0) {
      risks.push(`${data.requestMetrics.overdue} overdue data subject requests`);
    }

    if (data.consentMetrics?.expired > 0) {
      risks.push(`${data.consentMetrics.expired} expired consents requiring renewal`);
    }

    if (data.activityMetrics?.highRisk > 0) {
      risks.push(`${data.activityMetrics.highRisk} high-risk processing activities without DPEA`);
    }

    if (data.incidentMetrics?.open > 0) {
      risks.push(`${data.incidentMetrics.open} open compliance incidents`);
    }

    return risks.length > 0 
      ? `Key risks identified: ${risks.join(', ')}`
      : 'No significant compliance risks identified during the reporting period';
  };

  const getDateRange = (period: string) => {
    const now = new Date();
    let start: Date, end: Date;

    switch (period) {
      case 'current_month':
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        break;
      case 'last_month':
        start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        end = new Date(now.getFullYear(), now.getMonth(), 0);
        break;
      case 'current_quarter':
        const quarter = Math.floor(now.getMonth() / 3);
        start = new Date(now.getFullYear(), quarter * 3, 1);
        end = new Date(now.getFullYear(), quarter * 3 + 3, 0);
        break;
      case 'last_quarter':
        const lastQuarter = Math.floor((now.getMonth() - 3) / 3);
        start = new Date(now.getFullYear(), lastQuarter * 3, 1);
        end = new Date(now.getFullYear(), lastQuarter * 3 + 3, 0);
        break;
      case 'current_year':
        start = new Date(now.getFullYear(), 0, 1);
        end = new Date(now.getFullYear(), 11, 31);
        break;
      case 'last_year':
        start = new Date(now.getFullYear() - 1, 0, 1);
        end = new Date(now.getFullYear() - 1, 11, 31);
        break;
      default:
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    }

    return { start, end };
  };

  const getNextReportDate = (reportType: string): string => {
    const now = new Date();
    let nextDate: Date;

    switch (reportType) {
      case 'monthly':
        nextDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        break;
      case 'quarterly':
        nextDate = new Date(now.getFullYear(), now.getMonth() + 3, 1);
        break;
      case 'annual':
        nextDate = new Date(now.getFullYear() + 1, 0, 1);
        break;
      default:
        nextDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    }

    return nextDate.toISOString().split('T')[0];
  };

  const exportReport = (report: ComplianceReport, format: 'pdf' | 'excel' | 'json') => {
    // In a real implementation, this would generate and download the report in the specified format
    console.log(`Exporting report ${report.id} as ${format}`);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
        return <Badge className="bg-green-500">Published</Badge>;
      case 'approved':
        return <Badge className="bg-blue-500">Approved</Badge>;
      case 'review':
        return <Badge variant="secondary">Under Review</Badge>;
      default:
        return <Badge variant="outline">Draft</Badge>;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const canGenerateReports = ['admin', 'compliance_officer', 'dpo'].includes(userRole);

  if (loading) {
    return <div className="flex justify-center py-8">Loading compliance reports...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center space-x-2">
            <FileText className="h-6 w-6 text-blue-600" />
            <span>Compliance Reporting</span>
          </h2>
          <p className="text-gray-600">Generate and manage compliance reports and analytics</p>
        </div>
        {canGenerateReports && (
          <Button onClick={generateReport} disabled={generating}>
            {generating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Generating...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Generate Report
              </>
            )}
          </Button>
        )}
      </div>

      {/* Report Generation Form */}
      {canGenerateReports && (
        <Card>
          <CardHeader>
            <CardTitle>Generate New Report</CardTitle>
            <CardDescription>Create a new compliance report</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="reportType">Report Type</Label>
                <Select 
                  value={reportFilters.reportType} 
                  onValueChange={(value) => setReportFilters({ ...reportFilters, reportType: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {reportTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        <div>
                          <div className="font-medium">{type.label}</div>
                          <div className="text-sm text-gray-500">{type.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="period">Reporting Period</Label>
                <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {periods.map((period) => (
                      <SelectItem key={period.value} value={period.value}>
                        {period.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {selectedPeriod === 'custom' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={reportFilters.startDate}
                    onChange={(e) => setReportFilters({ ...reportFilters, startDate: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="endDate">End Date</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={reportFilters.endDate}
                    onChange={(e) => setReportFilters({ ...reportFilters, endDate: e.target.value })}
                  />
                </div>
              </div>
            )}

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="includeMetrics"
                  checked={reportFilters.includeMetrics}
                  onChange={(e) => setReportFilters({ ...reportFilters, includeMetrics: e.target.checked })}
                />
                <Label htmlFor="includeMetrics">Include Metrics</Label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="includeRecommendations"
                  checked={reportFilters.includeRecommendations}
                  onChange={(e) => setReportFilters({ ...reportFilters, includeRecommendations: e.target.checked })}
                />
                <Label htmlFor="includeRecommendations">Include Recommendations</Label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="includeActionItems"
                  checked={reportFilters.includeActionItems}
                  onChange={(e) => setReportFilters({ ...reportFilters, includeActionItems: e.target.checked })}
                />
                <Label htmlFor="includeActionItems">Include Action Items</Label>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <FileText className="h-5 w-5 text-blue-600" />
              <div>
                <div className="text-2xl font-bold">{reports.length}</div>
                <div className="text-sm text-gray-600">Total Reports</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <div className="text-2xl font-bold">
                  {reports.filter(r => r.reportStatus === 'published').length}
                </div>
                <div className="text-sm text-gray-600">Published</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-yellow-600" />
              <div>
                <div className="text-2xl font-bold">
                  {reports.filter(r => r.reportStatus === 'draft' || r.reportStatus === 'review').length}
                </div>
                <div className="text-sm text-gray-600">In Progress</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-purple-600" />
              <div>
                <div className="text-2xl font-bold">
                  {reports.length > 0 ? Math.round(reports.reduce((sum, r) => sum + r.complianceScore, 0) / reports.length) : 0}%
                </div>
                <div className="text-sm text-gray-600">Avg. Score</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Reports List */}
      <Card>
        <CardHeader>
          <CardTitle>Compliance Reports</CardTitle>
          <CardDescription>
            View and manage compliance reports
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="reports">
            <TabsList>
              <TabsTrigger value="reports">Reports</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>
            
            <TabsContent value="reports" className="space-y-4">
              {reports.map((report) => (
                <div key={report.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <h3 className="font-semibold flex items-center space-x-2">
                        <span>{report.reportName}</span>
                        {getStatusBadge(report.reportStatus)}
                      </h3>
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <span>Type: {reportTypes.find(rt => rt.value === report.reportType)?.label}</span>
                        <span>Period: {formatDate(report.reportPeriodStart)} - {formatDate(report.reportPeriodEnd)}</span>
                        {report.publishedDate && (
                          <span>Published: {formatDate(report.publishedDate)}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="text-right">
                        <div className={`text-lg font-bold ${getScoreColor(report.complianceScore)}`}>
                          {report.complianceScore}%
                        </div>
                        <div className="text-xs text-gray-500">Compliance Score</div>
                      </div>
                      <div className="flex space-x-1">
                        <Button size="sm" variant="outline">
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 p-3 rounded-md">
                    <div className="text-sm space-y-1">
                      <div><strong>Key Metrics:</strong></div>
                      <div className="grid grid-cols-4 gap-4 text-xs">
                        <div>Consents: {report.keyMetrics?.totalConsents || 0}</div>
                        <div>Requests: {report.keyMetrics?.dataSubjectRequests || 0}</div>
                        <div>Activities: {report.keyMetrics?.processingActivities || 0}</div>
                        <div>Incidents: {report.keyMetrics?.complianceIncidents || 0}</div>
                      </div>
                    </div>
                  </div>

                  {report.recommendations && report.recommendations.length > 0 && (
                    <div className="bg-blue-50 p-3 rounded-md">
                      <div className="text-sm">
                        <strong>Top Recommendations:</strong>
                        <ul className="list-disc list-inside mt-1">
                          {report.recommendations.slice(0, 3).map((rec, index) => (
                            <li key={index}>{rec}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}

                  {report.riskSummary && (
                    <div className="bg-yellow-50 p-3 rounded-md">
                      <div className="text-sm">
                        <strong>Risk Summary:</strong> {report.riskSummary}
                      </div>
                    </div>
                  )}
                </div>
              ))}
              
              {reports.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No compliance reports found. Generate your first report to get started.
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="analytics" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Compliance Score Trend */}
                <Card>
                  <CardHeader>
                    <CardTitle>Compliance Score Trend</CardTitle>
                    <CardDescription>Compliance score over time</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64 flex items-center justify-center text-gray-500">
                      <div className="text-center">
                        <BarChart3 className="h-12 w-12 mx-auto mb-2" />
                        <p>Compliance score trend chart would be displayed here</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Risk Distribution */}
                <Card>
                  <CardHeader>
                    <CardTitle>Risk Distribution</CardTitle>
                    <CardDescription>Breakdown of risk levels across activities</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64 flex items-center justify-center text-gray-500">
                      <div className="text-center">
                        <PieChart className="h-12 w-12 mx-auto mb-2" />
                        <p>Risk distribution chart would be displayed here</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Request Response Times */}
                <Card>
                  <CardHeader>
                    <CardTitle>Data Subject Request Response Times</CardTitle>
                    <CardDescription>Average response times for different request types</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64 flex items-center justify-center text-gray-500">
                      <div className="text-center">
                        <Activity className="h-12 w-12 mx-auto mb-2" />
                        <p>Response time analytics would be displayed here</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Compliance Metrics Overview */}
                <Card>
                  <CardHeader>
                    <CardTitle>Compliance Metrics Overview</CardTitle>
                    <CardDescription>Key compliance metrics and indicators</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Consent Renewal Rate</span>
                        <span className="text-sm font-medium">85%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Data Subject Request Completion Rate</span>
                        <span className="text-sm font-medium">92%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">DPEA Coverage</span>
                        <span className="text-sm font-medium">78%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Incident Resolution Time</span>
                        <span className="text-sm font-medium">3.2 days</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default ComplianceReporting;