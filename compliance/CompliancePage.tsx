import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '../../../components/ui/alert';
import { Badge } from '../../../components/ui/badge';
import { 
  Shield, 
  Users, 
  FileText, 
  AlertTriangle, 
  TrendingUp,
  CheckCircle,
  Settings,
  BarChart3,
  Download
} from 'lucide-react';
import { pdplComplianceService } from '../../compliance/core/PDPLComplianceService';
import ConsentManager from '../../compliance/components/ConsentManager';
import DataSubjectRightsManager from '../../compliance/components/DataSubjectRightsManager';
import PrivacyPolicyManager from '../../compliance/components/PrivacyPolicyManager';
import DPEAManager from '../../compliance/components/DPEAManager';
import ComplianceReporting from '../../compliance/components/ComplianceReporting';

export const CompliancePage: React.FC<{ userId?: string; userRole?: string }> = ({ 
  userId, 
  userRole = 'user' 
}) => {
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  useEffect(() => {
    fetchMetrics();
    
    // Auto-refresh metrics every 5 minutes
    const interval = setInterval(fetchMetrics, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center space-x-2">
            <Shield className="h-8 w-8 text-blue-600" />
            <span>PDPL Compliance Center</span>
          </h1>
          <p className="text-gray-600 mt-1">
            UAE Personal Data Protection Law compliance management and monitoring
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </span>
          <Button onClick={fetchMetrics} variant="outline" size="sm" disabled={loading}>
            <BarChart3 className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Compliance Overview */}
      <Card className={`${metrics ? getComplianceScoreBg(metrics.complianceScore) : 'bg-gray-100'} border-l-4 border-l-blue-500`}>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Compliance Overview</span>
            {metrics && (
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5" />
                <span className={`text-3xl font-bold ${getComplianceScoreColor(metrics.complianceScore)}`}>
                  {metrics.complianceScore}%
                </span>
              </div>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {metrics ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{metrics.totalConsents}</div>
                  <div className="text-sm text-gray-600">Total Consents</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{metrics.dataSubjectRequests}</div>
                  <div className="text-sm text-gray-600">Data Subject Requests</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{metrics.processingActivities}</div>
                  <div className="text-sm text-gray-600">Processing Activities</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{metrics.incidentCount}</div>
                  <div className="text-sm text-gray-600">Compliance Incidents</div>
                </div>
              </div>
              
              <div className="mt-4 text-sm text-gray-600">
                {metrics.complianceScore >= 90 ? 'Excellent compliance status - All systems operating optimally' : 
                 metrics.complianceScore >= 70 ? 'Good compliance with room for improvement' : 
                 'Requires immediate attention - Critical compliance issues detected'}
              </div>
            </>
          ) : (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-500">Loading compliance data...</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Critical Alerts */}
      {metrics && (
        <div className="space-y-2">
          {metrics.overdueRequests > 0 && (
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle className="text-red-800">Urgent: Overdue Data Subject Requests</AlertTitle>
              <AlertDescription className="text-red-700">
                {metrics.overdueRequests} data subject request(s) are past the 30-day deadline. 
                Immediate action required to maintain compliance.
              </AlertDescription>
            </Alert>
          )}
          
          {metrics.consentExpiryAlerts > 0 && (
            <Alert className="border-yellow-200 bg-yellow-50">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle className="text-yellow-800">Consent Expiry Alerts</AlertTitle>
              <AlertDescription className="text-yellow-700">
                {metrics.consentExpiryAlerts} consent(s) have expired and require renewal to ensure lawful processing.
              </AlertDescription>
            </Alert>
          )}
          
          {metrics.highRiskActivities > 0 && (
            <Alert className="border-orange-200 bg-orange-50">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle className="text-orange-800">High-Risk Processing Activities</AlertTitle>
              <AlertDescription className="text-orange-700">
                {metrics.highRiskActivities} processing activity/activities require DPEA (Data Protection Impact Assessment) 
                to ensure adequate risk mitigation.
              </AlertDescription>
            </Alert>
          )}
          
          {metrics.openIncidents > 0 && (
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle className="text-red-800">Open Compliance Incidents</AlertTitle>
              <AlertDescription className="text-red-700">
                {metrics.openIncidents} compliance incident(s) require immediate investigation and resolution 
                to prevent further regulatory exposure.
              </AlertDescription>
            </Alert>
          )}
          
          {metrics.overdueRequests === 0 && metrics.consentExpiryAlerts === 0 && 
           metrics.highRiskActivities === 0 && metrics.openIncidents === 0 && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4" />
              <AlertTitle className="text-green-800">All Clear</AlertTitle>
              <AlertDescription className="text-green-700">
                No immediate compliance issues detected. All systems are operating within acceptable parameters.
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}

      {/* Main Compliance Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="consents">Consents</TabsTrigger>
          <TabsTrigger value="requests">Data Rights</TabsTrigger>
          <TabsTrigger value="policies">Policies</TabsTrigger>
          <TabsTrigger value="dpea">DPEA</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
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
                      <FileText className="h-4 w-4 mr-2" />
                      Create Data Subject Request
                    </Button>
                    <Button className="w-full justify-start" variant="outline">
                      <Shield className="h-4 w-4 mr-2" />
                      New Privacy Policy
                    </Button>
                    <Button className="w-full justify-start" variant="outline">
                      <Users className="h-4 w-4 mr-2" />
                      Add Processing Activity
                    </Button>
                    <Button className="w-full justify-start" variant="outline">
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      Report Compliance Incident
                    </Button>
                  </>
                )}
                <Button className="w-full justify-start" variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Download Compliance Report
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <Settings className="h-4 w-4 mr-2" />
                  Compliance Settings
                </Button>
              </CardContent>
            </Card>

            {/* Compliance Status */}
            <Card>
              <CardHeader>
                <CardTitle>Compliance Status</CardTitle>
                <CardDescription>Current compliance metrics and trends</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {metrics ? (
                  <>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Active Consents</span>
                        <div className="flex items-center space-x-2">
                          <div className="w-24 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-green-500 h-2 rounded-full" 
                              style={{ 
                                width: `${metrics.totalConsents > 0 ? (metrics.activeConsents / metrics.totalConsents) * 100 : 0}%` 
                              }}
                            ></div>
                          </div>
                          <span className="text-sm text-gray-600">
                            {metrics.activeConsents}/{metrics.totalConsents}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Request Completion Rate</span>
                        <div className="flex items-center space-x-2">
                          <div className="w-24 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-500 h-2 rounded-full" 
                              style={{ 
                                width: `${metrics.dataSubjectRequests > 0 ? 
                                  ((metrics.dataSubjectRequests - metrics.pendingRequests) / metrics.dataSubjectRequests) * 100 : 0}%` 
                              }}
                            ></div>
                          </div>
                          <span className="text-sm text-gray-600">
                            {metrics.dataSubjectRequests - metrics.pendingRequests}/{metrics.dataSubjectRequests}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-sm">DPEA Coverage</span>
                        <div className="flex items-center space-x-2">
                          <div className="w-24 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-purple-500 h-2 rounded-full" 
                              style={{ 
                                width: `${metrics.processingActivities > 0 ? 
                                  ((metrics.processingActivities - metrics.highRiskActivities) / metrics.processingActivities) * 100 : 100}%` 
                              }}
                            ></div>
                          </div>
                          <span className="text-sm text-gray-600">
                            {metrics.processingActivities - metrics.highRiskActivities}/{metrics.processingActivities}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Incident Resolution</span>
                        <div className="flex items-center space-x-2">
                          <div className="w-24 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-red-500 h-2 rounded-full" 
                              style={{ 
                                width: `${metrics.incidentCount > 0 ? 
                                  ((metrics.incidentCount - metrics.openIncidents) / metrics.incidentCount) * 100 : 100}%` 
                              }}
                            ></div>
                          </div>
                          <span className="text-sm text-gray-600">
                            {metrics.incidentCount - metrics.openIncidents}/{metrics.incidentCount}
                          </span>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    Loading compliance metrics...
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="consents">
          <ConsentManager userId={userId} userRole={userRole} />
        </TabsContent>

        <TabsContent value="requests">
          <DataSubjectRightsManager userId={userId} userRole={userRole} />
        </TabsContent>

        <TabsContent value="policies">
          <PrivacyPolicyManager />
        </TabsContent>

        <TabsContent value="dpea">
          <DPEAManager userId={userId} userRole={userRole} />
        </TabsContent>

        <TabsContent value="reports">
          <ComplianceReporting userId={userId} userRole={userRole} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CompliancePage;