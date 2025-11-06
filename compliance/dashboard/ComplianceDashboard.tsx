import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { Progress } from '../../../components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '../../../components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs';
import { 
  Shield, 
  Users, 
  FileText, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Clock,
  TrendingUp,
  Database,
  Settings,
  Download,
  RefreshCw,
  Eye,
  Plus
} from 'lucide-react';
import { pdplComplianceService, ComplianceMetrics } from '../../core/PDPLComplianceService';

interface ComplianceDashboardProps {
  userId: string;
  userRole: string;
}

export const ComplianceDashboard: React.FC<ComplianceDashboardProps> = ({ userId, userRole }) => {
  const [metrics, setMetrics] = useState<ComplianceMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      const data = await pdplComplianceService.getComplianceMetrics();
      setMetrics(data);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching compliance metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
    
    // Auto-refresh every 5 minutes
    const interval = setInterval(fetchMetrics, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const getComplianceScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getComplianceScoreBg = (score: number) => {
    if (score >= 90) return 'bg-green-100';
    if (score >= 70) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  const canManageCompliance = ['admin', 'compliance_officer', 'dpo'].includes(userRole);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center space-x-2">
          <RefreshCw className="h-6 w-6 animate-spin" />
          <span>Loading compliance data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center space-x-2">
            <Shield className="h-8 w-8 text-blue-600" />
            <span>PDPL Compliance Dashboard</span>
          </h1>
          <p className="text-gray-600 mt-1">
            UAE Personal Data Protection Law compliance management
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </span>
          <Button onClick={fetchMetrics} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Compliance Score Card */}
      {metrics && (
        <Card className={`${getComplianceScoreBg(metrics.complianceScore)} border-l-4 border-l-blue-500`}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Overall Compliance Score</span>
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5" />
                <span className={`text-3xl font-bold ${getComplianceScoreColor(metrics.complianceScore)}`}>
                  {metrics.complianceScore}%
                </span>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Progress value={metrics.complianceScore} className="mb-2" />
            <p className="text-sm text-gray-600">
              {metrics.complianceScore >= 90 ? 'Excellent compliance status' : 
               metrics.complianceScore >= 70 ? 'Good compliance with room for improvement' : 
               'Requires immediate attention'}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Consents */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Consents</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics?.activeConsents || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              of {metrics?.totalConsents || 0} total consents
            </p>
            {metrics && metrics.consentExpiryAlerts > 0 && (
              <Badge variant="destructive" className="mt-2">
                <AlertTriangle className="h-3 w-3 mr-1" />
                {metrics.consentExpiryAlerts} expiring soon
              </Badge>
            )}
          </CardContent>
        </Card>

        {/* Data Subject Requests */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Data Subject Requests</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics?.dataSubjectRequests || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {metrics?.pendingRequests || 0} pending
            </p>
            {metrics && metrics.overdueRequests > 0 && (
              <Badge variant="destructive" className="mt-2">
                <XCircle className="h-3 w-3 mr-1" />
                {metrics.overdueRequests} overdue
              </Badge>
            )}
          </CardContent>
        </Card>

        {/* Processing Activities */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Processing Activities</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics?.processingActivities || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {metrics?.highRiskActivities || 0} high risk
            </p>
            {metrics && metrics.highRiskActivities > 0 && (
              <Badge variant="secondary" className="mt-2">
                <AlertTriangle className="h-3 w-3 mr-1" />
                High risk activities
              </Badge>
            )}
          </CardContent>
        </Card>

        {/* Incidents */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Compliance Incidents</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics?.incidentCount || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {metrics?.openIncidents || 0} open
            </p>
            {metrics && metrics.openIncidents > 0 && (
              <Badge variant="destructive" className="mt-2">
                <XCircle className="h-3 w-3 mr-1" />
                Open incidents
              </Badge>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Detailed Views */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="consents">Consents</TabsTrigger>
          <TabsTrigger value="requests">Data Subject Requests</TabsTrigger>
          <TabsTrigger value="activities">Processing Activities</TabsTrigger>
          <TabsTrigger value="policies">Privacy Policies</TabsTrigger>
          <TabsTrigger value="incidents">Incidents</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Common compliance management tasks</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {canManageCompliance && (
                  <>
                    <Button className="w-full justify-start" variant="outline">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Data Subject Request
                    </Button>
                    <Button className="w-full justify-start" variant="outline">
                      <Plus className="h-4 w-4 mr-2" />
                      New Privacy Policy
                    </Button>
                    <Button className="w-full justify-start" variant="outline">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Processing Activity
                    </Button>
                    <Button className="w-full justify-start" variant="outline">
                      <Plus className="h-4 w-4 mr-2" />
                      Report Compliance Incident
                    </Button>
                  </>
                )}
                <Button className="w-full justify-start" variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Download Compliance Report
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <Eye className="h-4 w-4 mr-2" />
                  View Audit Trail
                </Button>
              </CardContent>
            </Card>

            {/* Alerts */}
            <Card>
              <CardHeader>
                <CardTitle>Compliance Alerts</CardTitle>
                <CardDescription>Items requiring attention</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {metrics && metrics.overdueRequests > 0 && (
                  <Alert>
                    <XCircle className="h-4 w-4" />
                    <AlertTitle>Overdue Requests</AlertTitle>
                    <AlertDescription>
                      {metrics.overdueRequests} data subject request(s) are past the 30-day deadline
                    </AlertDescription>
                  </Alert>
                )}
                
                {metrics && metrics.consentExpiryAlerts > 0 && (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Consent Expiry</AlertTitle>
                    <AlertDescription>
                      {metrics.consentExpiryAlerts} consent(s) have expired and need renewal
                    </AlertDescription>
                  </Alert>
                )}

                {metrics && metrics.highRiskActivities > 0 && (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>High Risk Processing</AlertTitle>
                    <AlertDescription>
                      {metrics.highRiskActivities} processing activity/activities require DPEA review
                    </AlertDescription>
                  </Alert>
                )}

                {metrics && metrics.openIncidents > 0 && (
                  <Alert>
                    <XCircle className="h-4 w-4" />
                    <AlertTitle>Open Incidents</AlertTitle>
                    <AlertDescription>
                      {metrics.openIncidents} compliance incident(s) require resolution
                    </AlertDescription>
                  </Alert>
                )}

                {(!metrics || (metrics.overdueRequests === 0 && 
                             metrics.consentExpiryAlerts === 0 && 
                             metrics.highRiskActivities === 0 && 
                             metrics.openIncidents === 0)) && (
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertTitle>All Clear</AlertTitle>
                    <AlertDescription>
                      No immediate compliance issues detected
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="consents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Consent Management</CardTitle>
              <CardDescription>Manage user consents and permissions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                Consent management interface would be implemented here
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="requests" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Data Subject Requests</CardTitle>
              <CardDescription>Manage access, rectification, and erasure requests</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                Data subject request management interface would be implemented here
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activities" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Data Processing Activities</CardTitle>
              <CardDescription>Track and manage data processing operations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                Processing activity management interface would be implemented here
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="policies" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Privacy Policies</CardTitle>
              <CardDescription>Manage privacy policies and disclosures</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                Privacy policy management interface would be implemented here
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="incidents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Compliance Incidents</CardTitle>
              <CardDescription>Track and manage compliance incidents and breaches</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                Incident management interface would be implemented here
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ComplianceDashboard;