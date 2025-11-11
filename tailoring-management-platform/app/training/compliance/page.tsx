'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ShieldCheckIcon, 
  ExclamationTriangleIcon, 
  ClockIcon, 
  CheckCircleIcon,
  XCircleIcon,
  AlertCircleIcon,
  UserGroupIcon,
  CalendarIcon,
  DocumentTextIcon,
  GlobeAltIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { 
  useComplianceTracking,
  useCertificationRenewalAlerts,
  useEmployeeTrainings,
  useTrainingPrograms
} from '@/hooks/useTraining';

export default function CompliancePage() {
  const [selectedTab, setSelectedTab] = useState('overview');

  const { data: complianceItems = [], isLoading } = useComplianceTracking();
  const { data: renewalAlerts = [] } = useCertificationRenewalAlerts();
  const { data: employeeTrainings = [] } = useEmployeeTrainings();
  const { data: trainingPrograms = [] } = useTrainingPrograms();

  // Calculate compliance statistics
  const compliantItems = complianceItems.filter(item => item.status === 'compliant').length;
  const pendingItems = complianceItems.filter(item => item.status === 'pending').length;
  const warningItems = complianceItems.filter(item => item.status === 'warning').length;
  const overdueItems = complianceItems.filter(item => item.status === 'overdue').length;
  const nonCompliantItems = complianceItems.filter(item => item.status === 'non_compliant').length;

  const totalItems = complianceItems.length;
  const complianceRate = totalItems > 0 ? Math.round((compliantItems / totalItems) * 100) : 0;

  // UAE specific compliance categories
  const uaeComplianceItems = complianceItems.filter(item => 
    item.compliance_type === 'uae_labor_law' || item.compliance_requirement.toLowerCase().includes('uae')
  );

  // Critical alerts (overdue and high-risk warnings)
  const criticalAlerts = complianceItems.filter(item => 
    item.status === 'overdue' || (item.status === 'warning' && item.risk_level >= 3)
  );

  // Certification renewals expiring soon
  const urgentRenewals = renewalAlerts.filter(alert => 
    alert.priority === 'high' || alert.days_until_expiry <= 14
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'compliant': return 'text-green-600 bg-green-50';
      case 'pending': return 'text-blue-600 bg-blue-50';
      case 'warning': return 'text-orange-600 bg-orange-50';
      case 'overdue': return 'text-red-600 bg-red-50';
      case 'non_compliant': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getRiskLevelBadge = (level: number) => {
    if (level >= 4) return <Badge variant="destructive">Critical</Badge>;
    if (level >= 3) return <Badge variant="destructive">High</Badge>;
    if (level >= 2) return <Badge className="bg-orange-100 text-orange-800">Medium</Badge>;
    return <Badge variant="secondary">Low</Badge>;
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">UAE Labor Law Compliance</h1>
          <p className="text-gray-600 mt-2">Monitor regulatory compliance and certification status</p>
        </div>
        <div className="flex items-center space-x-3">
          <div className={`flex items-center px-3 py-2 rounded-lg ${
            complianceRate >= 90 ? 'bg-green-100 text-green-800' :
            complianceRate >= 75 ? 'bg-orange-100 text-orange-800' : 'bg-red-100 text-red-800'
          }`}>
            <ShieldCheckIcon className="h-5 w-5 mr-2" />
            {complianceRate}% Compliant
          </div>
          <Link href="/training/courses?tab=uae">
            <Button className="bg-blue-600 hover:bg-blue-700">
              <GlobeAltIcon className="h-4 w-4 mr-2" />
              UAE Training Courses
            </Button>
          </Link>
        </div>
      </div>

      {/* Critical Alerts Banner */}
      {(criticalAlerts.length > 0 || urgentRenewals.length > 0) && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-3">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-600" />
            <span className="font-medium text-red-800">Immediate Action Required</span>
          </div>
          <div className="space-y-2 text-sm text-red-700">
            {criticalAlerts.length > 0 && (
              <p>• {criticalAlerts.length} compliance requirement{criticalAlerts.length > 1 ? 's are' : ' is'} overdue or high-risk</p>
            )}
            {urgentRenewals.length > 0 && (
              <p>• {urgentRenewals.length} certification{urgentRenewals.length > 1 ? 's expire' : ' expires'} within 14 days</p>
            )}
          </div>
          <div className="mt-3 flex space-x-2">
            <Button size="sm" variant="outline" className="text-red-600 border-red-300">
              View Details
            </Button>
            <Button size="sm" className="bg-red-600 hover:bg-red-700">
              Take Action
            </Button>
          </div>
        </div>
      )}

      {/* Compliance Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <Card className="glass hover-lift">
          <CardContent className="p-6 text-center">
            <div className="p-3 bg-green-100 rounded-full w-fit mx-auto mb-3">
              <CheckCircleIcon className="h-6 w-6 text-green-600" />
            </div>
            <p className="text-2xl font-bold text-green-600">{compliantItems}</p>
            <p className="text-sm text-gray-600">Compliant</p>
          </CardContent>
        </Card>

        <Card className="glass hover-lift">
          <CardContent className="p-6 text-center">
            <div className="p-3 bg-blue-100 rounded-full w-fit mx-auto mb-3">
              <ClockIcon className="h-6 w-6 text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-blue-600">{pendingItems}</p>
            <p className="text-sm text-gray-600">Pending</p>
          </CardContent>
        </Card>

        <Card className="glass hover-lift">
          <CardContent className="p-6 text-center">
            <div className="p-3 bg-orange-100 rounded-full w-fit mx-auto mb-3">
              <AlertCircleIcon className="h-6 w-6 text-orange-600" />
            </div>
            <p className="text-2xl font-bold text-orange-600">{warningItems}</p>
            <p className="text-sm text-gray-600">Warning</p>
          </CardContent>
        </Card>

        <Card className="glass hover-lift">
          <CardContent className="p-6 text-center">
            <div className="p-3 bg-red-100 rounded-full w-fit mx-auto mb-3">
              <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
            </div>
            <p className="text-2xl font-bold text-red-600">{overdueItems}</p>
            <p className="text-sm text-gray-600">Overdue</p>
          </CardContent>
        </Card>

        <Card className="glass hover-lift">
          <CardContent className="p-6 text-center">
            <div className="p-3 bg-red-100 rounded-full w-fit mx-auto mb-3">
              <XCircleIcon className="h-6 w-6 text-red-600" />
            </div>
            <p className="text-2xl font-bold text-red-600">{nonCompliantItems}</p>
            <p className="text-sm text-gray-600">Non-Compliant</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="uae-specific">UAE Requirements</TabsTrigger>
          <TabsTrigger value="certifications">Certifications</TabsTrigger>
          <TabsTrigger value="employees">Employee Status</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Compliance Progress */}
            <Card className="glass">
              <CardHeader>
                <CardTitle>Overall Compliance Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold mb-2">{complianceRate}%</div>
                    <Progress value={complianceRate} className="mb-2" />
                    <p className="text-sm text-gray-600">
                      {compliantItems} of {totalItems} requirements met
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="font-medium">Target: 95%</p>
                      <p className="text-gray-600">Industry Standard</p>
                    </div>
                    <div>
                      <p className="font-medium">{totalItems - compliantItems} Remaining</p>
                      <p className="text-gray-600">Items to Address</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card className="glass">
              <CardHeader>
                <CardTitle>Recent Compliance Updates</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {complianceItems
                    .filter(item => item.completion_date)
                    .slice(0, 4)
                    .map((item) => (
                      <div key={item.id} className="flex items-center space-x-3 p-2 border border-gray-200 rounded">
                        <CheckCircleIcon className="h-5 w-5 text-green-600" />
                        <div className="flex-1">
                          <p className="font-medium text-sm">{item.compliance_requirement}</p>
                          <p className="text-xs text-gray-600">
                            {item.employees?.first_name} {item.employees?.last_name} • {item.completion_date}
                          </p>
                        </div>
                      </div>
                    ))}
                  
                  {complianceItems.filter(item => item.completion_date).length === 0 && (
                    <p className="text-gray-500 text-center py-4">No recent updates</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* All Compliance Items */}
          <Card className="glass">
            <CardHeader>
              <CardTitle>All Compliance Requirements</CardTitle>
              <CardDescription>
                Complete list of regulatory and internal compliance requirements
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {complianceItems.map((item) => (
                  <div key={item.id} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{item.compliance_requirement}</h4>
                        <p className="text-sm text-gray-600">
                          Employee: {item.employees?.first_name} {item.employees?.last_name} • 
                          Department: {item.employees?.department}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getRiskLevelBadge(item.risk_level)}
                        <Badge className={getStatusColor(item.status)}>
                          {item.status}
                        </Badge>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                      <div>
                        <p className="font-medium">Type</p>
                        <p className="text-gray-600">{item.compliance_type}</p>
                      </div>
                      <div>
                        <p className="font-medium">Deadline</p>
                        <p className={`${new Date(item.deadline) < new Date() ? 'text-red-600' : 'text-gray-600'}`}>
                          {item.deadline}
                        </p>
                      </div>
                      <div>
                        <p className="font-medium">Completion</p>
                        <p className="text-gray-600">{item.completion_date || 'Not completed'}</p>
                      </div>
                      <div>
                        <p className="font-medium">Manager</p>
                        <p className="text-gray-600">
                          {item.responsible_manager ? 'Assigned' : 'No manager assigned'}
                        </p>
                      </div>
                    </div>

                    {item.notes && (
                      <div className="p-3 bg-gray-50 rounded text-sm">
                        <p className="font-medium">Notes:</p>
                        <p className="text-gray-600">{item.notes}</p>
                      </div>
                    )}

                    <div className="flex justify-end space-x-2 mt-4">
                      <Button size="sm" variant="outline">View Details</Button>
                      {item.status !== 'compliant' && (
                        <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                          Take Action
                        </Button>
                      )}
                    </div>
                  </div>
                ))}

                {complianceItems.length === 0 && (
                  <div className="text-center py-8">
                    <ShieldCheckIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No compliance requirements found</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* UAE Specific Requirements */}
        <TabsContent value="uae-specific" className="space-y-6">
          <Card className="glass">
            <CardHeader>
              <CardTitle className="flex items-center">
                <GlobeAltIcon className="h-5 w-5 mr-2" />
                UAE Labor Law Requirements
              </CardTitle>
              <CardDescription>
                Specific compliance requirements under UAE federal and emirate laws
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {uaeComplianceItems.map((item) => (
                  <div key={item.id} className="p-4 border border-gray-200 rounded-lg bg-blue-50">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="font-medium text-gray-900">{item.compliance_requirement}</h4>
                        <p className="text-sm text-gray-600">UAE Federal Labor Law</p>
                      </div>
                      <Badge className={getStatusColor(item.status)}>
                        {item.status}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="font-medium">Employee</p>
                        <p>{item.employees?.first_name} {item.employees?.last_name}</p>
                      </div>
                      <div>
                        <p className="font-medium">Deadline</p>
                        <p>{item.deadline}</p>
                      </div>
                      <div>
                        <p className="font-medium">Risk Level</p>
                        {getRiskLevelBadge(item.risk_level)}
                      </div>
                    </div>
                  </div>
                ))}

                {uaeComplianceItems.length === 0 && (
                  <div className="text-center py-8">
                    <GlobeAltIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No UAE-specific requirements found</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* UAE Training Programs */}
          <Card className="glass">
            <CardHeader>
              <CardTitle>UAE Compliance Training Programs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {trainingPrograms
                  .filter(program => 
                    program.program_category === 'Compliance' || 
                    program.program_name.toLowerCase().includes('uae') ||
                    program.program_name.toLowerCase().includes('labor law')
                  )
                  .map((program) => (
                    <div key={program.id} className="p-4 border border-gray-200 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-2">{program.program_name}</h4>
                      <p className="text-sm text-gray-600 mb-3">{program.description}</p>
                      <div className="flex items-center justify-between">
                        <Badge variant={program.is_mandatory ? 'destructive' : 'secondary'}>
                          {program.is_mandatory ? 'Mandatory' : 'Optional'}
                        </Badge>
                        <Link href={`/training/courses/${program.id}`}>
                          <Button size="sm" variant="outline">Enroll</Button>
                        </Link>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Certifications Tab */}
        <TabsContent value="certifications" className="space-y-6">
          <Card className="glass">
            <CardHeader>
              <CardTitle>Certification Renewal Alerts</CardTitle>
              <CardDescription>
                Professional certifications requiring renewal
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {renewalAlerts.map((alert) => (
                  <div key={alert.employee_id} className={`p-4 border rounded-lg ${
                    alert.priority === 'high' ? 'border-red-300 bg-red-50' :
                    alert.priority === 'medium' ? 'border-orange-300 bg-orange-50' :
                    'border-gray-200'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h4 className="font-medium text-gray-900">{alert.certification_name}</h4>
                        <p className="text-sm text-gray-600">{alert.employee_name}</p>
                      </div>
                      <Badge variant={
                        alert.priority === 'high' ? 'destructive' :
                        alert.priority === 'medium' ? 'secondary' : 'outline'
                      }>
                        {alert.days_until_expiry} days left
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-600">
                      Expires: {alert.expiry_date}
                    </div>
                  </div>
                ))}

                {renewalAlerts.length === 0 && (
                  <div className="text-center py-8">
                    <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No upcoming certification renewals</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Employee Status Tab */}
        <TabsContent value="employees" className="space-y-6">
          <Card className="glass">
            <CardHeader>
              <CardTitle>Employee Compliance Summary</CardTitle>
              <CardDescription>
                Individual compliance status across all requirements
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Group compliance items by employee */}
                {Array.from(new Set(complianceItems.map(item => item.employee_id))).map((employeeId) => {
                  const employeeItems = complianceItems.filter(item => item.employee_id === employeeId);
                  const employee = employeeItems[0]?.employees;
                  const compliantCount = employeeItems.filter(item => item.status === 'compliant').length;
                  const compliancePercentage = Math.round((compliantCount / employeeItems.length) * 100);

                  return (
                    <div key={employeeId} className="p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="font-medium text-gray-900">
                            {employee?.first_name} {employee?.last_name}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {employee?.department} • {employeeItems.length} requirements
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-lg">{compliancePercentage}%</p>
                          <p className="text-sm text-gray-600">Compliant</p>
                        </div>
                      </div>
                      
                      <Progress value={compliancePercentage} className="mb-3" />
                      
                      <div className="grid grid-cols-4 gap-2 text-sm">
                        <div className="text-center">
                          <p className="font-medium text-green-600">
                            {employeeItems.filter(item => item.status === 'compliant').length}
                          </p>
                          <p className="text-gray-500">Compliant</p>
                        </div>
                        <div className="text-center">
                          <p className="font-medium text-blue-600">
                            {employeeItems.filter(item => item.status === 'pending').length}
                          </p>
                          <p className="text-gray-500">Pending</p>
                        </div>
                        <div className="text-center">
                          <p className="font-medium text-orange-600">
                            {employeeItems.filter(item => item.status === 'warning').length}
                          </p>
                          <p className="text-gray-500">Warning</p>
                        </div>
                        <div className="text-center">
                          <p className="font-medium text-red-600">
                            {employeeItems.filter(item => item.status === 'overdue' || item.status === 'non_compliant').length}
                          </p>
                          <p className="text-gray-500">Issues</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}