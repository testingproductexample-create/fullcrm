'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  MagnifyingGlassIcon,
  CalendarIcon,
  DocumentTextIcon,
  ClockIcon,
  AlertTriangleIcon,
  EyeIcon,
  PencilIcon,
  BellIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { useComplianceTracking, useLegalReferences } from '@/hooks/useLegal';
import type { ComplianceFilters } from '@/types/legal';

export default function ComplianceTracking() {
  const [selectedTab, setSelectedTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<ComplianceFilters>({});

  // Data hooks
  const { data: complianceItems = [], isLoading } = useComplianceTracking(filters);
  const { data: legalReferences = [] } = useLegalReferences();

  // Filter compliance items by tab and search
  const filteredItems = complianceItems.filter(item => {
    const matchesSearch = !searchTerm || 
      item.requirement_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.compliance_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    switch (selectedTab) {
      case 'compliant':
        return item.compliance_status === 'compliant';
      case 'non_compliant':
        return item.compliance_status === 'non_compliant';
      case 'pending':
        return item.compliance_status === 'pending';
      case 'review':
        return item.compliance_status === 'under_review';
      default:
        return true;
    }
  });

  const getComplianceStatusColor = (status: string) => {
    switch (status) {
      case 'compliant': return 'text-green-600 bg-green-100';
      case 'non_compliant': return 'text-red-600 bg-red-100';
      case 'pending': return 'text-orange-600 bg-orange-100';
      case 'under_review': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'critical': return 'text-red-600 bg-red-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getComplianceTypeIcon = (type: string) => {
    switch (type) {
      case 'contract_law': return <DocumentTextIcon className="h-4 w-4" />;
      case 'labor_law': return <ShieldCheckIcon className="h-4 w-4" />;
      case 'commercial_law': return <DocumentTextIcon className="h-4 w-4" />;
      case 'tax_law': return <DocumentTextIcon className="h-4 w-4" />;
      case 'data_protection': return <ShieldCheckIcon className="h-4 w-4" />;
      default: return <ShieldCheckIcon className="h-4 w-4" />;
    }
  };

  const calculateOverallScore = () => {
    if (complianceItems.length === 0) return 100;
    const compliantCount = complianceItems.filter(item => item.compliance_status === 'compliant').length;
    return Math.round((compliantCount / complianceItems.length) * 100);
  };

  const getCriticalIssues = () => {
    return complianceItems.filter(item => 
      item.compliance_status === 'non_compliant' && 
      item.risk_level === 'critical'
    );
  };

  const getUpcomingDeadlines = () => {
    const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    return complianceItems.filter(item => 
      item.next_review_date && 
      new Date(item.next_review_date) <= thirtyDaysFromNow &&
      item.compliance_status !== 'compliant'
    );
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const overallScore = calculateOverallScore();
  const criticalIssues = getCriticalIssues();
  const upcomingDeadlines = getUpcomingDeadlines();

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Legal Compliance Tracking</h1>
          <p className="text-gray-600 mt-2">Monitor and manage UAE legal compliance requirements</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <Button className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto">
            <ShieldCheckIcon className="h-4 w-4 mr-2" />
            New Compliance Check
          </Button>
          <Button variant="outline" className="w-full sm:w-auto">
            <DocumentTextIcon className="h-4 w-4 mr-2" />
            View Reports
          </Button>
        </div>
      </div>

      {/* Critical Issues Alert */}
      {criticalIssues.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <XCircleIcon className="h-5 w-5 text-red-600" />
            <span className="font-medium text-red-800">Critical Compliance Issues</span>
          </div>
          <div className="mt-2 text-sm text-red-700">
            <p>{criticalIssues.length} critical issue{criticalIssues.length > 1 ? 's' : ''} requiring immediate attention</p>
          </div>
          <div className="mt-3 flex gap-2">
            <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white">
              Review Critical Issues
            </Button>
          </div>
        </div>
      )}

      {/* Upcoming Deadlines Alert */}
      {upcomingDeadlines.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <ExclamationTriangleIcon className="h-5 w-5 text-orange-600" />
            <span className="font-medium text-orange-800">Upcoming Review Deadlines</span>
          </div>
          <div className="mt-2 text-sm text-orange-700">
            <p>{upcomingDeadlines.length} compliance review{upcomingDeadlines.length > 1 ? 's' : ''} due within 30 days</p>
          </div>
        </div>
      )}

      {/* Compliance Score Overview */}
      <Card className="glass">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheckIcon className="h-5 w-5" />
              Overall Compliance Score
            </div>
            <Badge className={overallScore >= 90 ? 'text-green-600 bg-green-100' : 
                            overallScore >= 75 ? 'text-yellow-600 bg-yellow-100' : 'text-red-600 bg-red-100'}>
              {overallScore >= 90 ? 'Excellent' : 
               overallScore >= 75 ? 'Good' : 'Needs Improvement'}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="flex justify-between text-sm mb-2">
                <span>Compliance Status</span>
                <span>{overallScore}%</span>
              </div>
              <Progress value={overallScore} className="h-3" />
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-blue-600">{overallScore}%</div>
              <div className="text-sm text-gray-600">
                {complianceItems.filter(item => item.compliance_status === 'compliant').length} of {complianceItems.length} compliant
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="glass hover-lift">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Requirements</p>
                <p className="text-3xl font-bold text-blue-600">{complianceItems.length}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <DocumentTextIcon className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass hover-lift">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Compliant</p>
                <p className="text-3xl font-bold text-green-600">
                  {complianceItems.filter(item => item.compliance_status === 'compliant').length}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <CheckCircleIcon className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass hover-lift">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Non-Compliant</p>
                <p className="text-3xl font-bold text-red-600">
                  {complianceItems.filter(item => item.compliance_status === 'non_compliant').length}
                </p>
              </div>
              <div className="p-3 bg-red-100 rounded-full">
                <XCircleIcon className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass hover-lift">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Under Review</p>
                <p className="text-3xl font-bold text-orange-600">
                  {complianceItems.filter(item => item.compliance_status === 'pending' || item.compliance_status === 'under_review').length}
                </p>
              </div>
              <div className="p-3 bg-orange-100 rounded-full">
                <ClockIcon className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card className="glass">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search compliance requirements..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Select 
                value={filters.compliance_type || ''} 
                onValueChange={(value) => setFilters(prev => ({ ...prev, compliance_type: value }))}
              >
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="contract_law">Contract Law</SelectItem>
                  <SelectItem value="labor_law">Labor Law</SelectItem>
                  <SelectItem value="commercial_law">Commercial Law</SelectItem>
                  <SelectItem value="tax_law">Tax Law</SelectItem>
                  <SelectItem value="data_protection">Data Protection</SelectItem>
                </SelectContent>
              </Select>

              <Select 
                value={filters.risk_level || ''} 
                onValueChange={(value) => setFilters(prev => ({ ...prev, risk_level: value }))}
              >
                <SelectTrigger className="w-full sm:w-32">
                  <SelectValue placeholder="Risk Level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" onClick={() => { setFilters({}); setSearchTerm(''); }}>
                Clear
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Compliance Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5">
          <TabsTrigger value="overview">Overview ({complianceItems.length})</TabsTrigger>
          <TabsTrigger value="compliant">Compliant ({complianceItems.filter(i => i.compliance_status === 'compliant').length})</TabsTrigger>
          <TabsTrigger value="non_compliant">Issues ({complianceItems.filter(i => i.compliance_status === 'non_compliant').length})</TabsTrigger>
          <TabsTrigger value="pending">Pending ({complianceItems.filter(i => i.compliance_status === 'pending').length})</TabsTrigger>
          <TabsTrigger value="review">Review ({complianceItems.filter(i => i.compliance_status === 'under_review').length})</TabsTrigger>
        </TabsList>

        {/* Compliance Items */}
        <TabsContent value={selectedTab} className="space-y-4">
          {filteredItems.length === 0 ? (
            <Card className="glass">
              <CardContent className="p-12 text-center">
                <ShieldCheckIcon className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No compliance items found</h3>
                <p className="text-gray-600 mb-6">No items match your current filters</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredItems.map((item) => (
                <Card key={item.id} className="glass hover-lift">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${getComplianceStatusColor(item.compliance_status).split(' ')[1]}`}>
                          {getComplianceTypeIcon(item.compliance_type)}
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900">{item.requirement_title}</h3>
                          <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                          <div className="flex gap-2 mt-2">
                            <Badge className={getComplianceStatusColor(item.compliance_status)}>
                              {item.compliance_status?.replace('_', ' ')}
                            </Badge>
                            <Badge className={getRiskLevelColor(item.risk_level)}>
                              {item.risk_level} risk
                            </Badge>
                            <Badge className="text-purple-600 bg-purple-100">
                              {item.compliance_type?.replace('_', ' ')}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      {item.last_review_date && (
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <CalendarIcon className="h-4 w-4 text-gray-400" />
                            <span className="text-gray-600">Last Review</span>
                          </div>
                          <p className="font-medium">{new Date(item.last_review_date).toLocaleDateString()}</p>
                        </div>
                      )}

                      {item.next_review_date && (
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <ClockIcon className="h-4 w-4 text-gray-400" />
                            <span className="text-gray-600">Next Review</span>
                          </div>
                          <p className={`font-medium ${
                            new Date(item.next_review_date) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) ? 'text-orange-600' : ''
                          }`}>
                            {new Date(item.next_review_date).toLocaleDateString()}
                          </p>
                        </div>
                      )}

                      {item.responsible_party && (
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <ShieldCheckIcon className="h-4 w-4 text-gray-400" />
                            <span className="text-gray-600">Responsible</span>
                          </div>
                          <p className="font-medium">{item.responsible_party}</p>
                        </div>
                      )}
                    </div>

                    {/* Non-compliance details */}
                    {item.compliance_status === 'non_compliant' && item.non_compliance_details && (
                      <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <div className="flex items-start gap-2">
                          <AlertTriangleIcon className="h-4 w-4 text-red-600 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-red-800">Non-compliance Details:</p>
                            <p className="text-sm text-red-700 mt-1">{item.non_compliance_details}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Remediation plan */}
                    {item.remediation_plan && (
                      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-sm font-medium text-blue-800">Remediation Plan:</p>
                        <p className="text-sm text-blue-700 mt-1">{item.remediation_plan}</p>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 mt-4 pt-4 border-t">
                      <Button variant="outline" size="sm">
                        <EyeIcon className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                      <Button variant="outline" size="sm">
                        <PencilIcon className="h-4 w-4 mr-2" />
                        Update Status
                      </Button>
                      {item.compliance_status !== 'compliant' && (
                        <Button variant="outline" size="sm">
                          <ArrowPathIcon className="h-4 w-4 mr-2" />
                          Review Now
                        </Button>
                      )}
                      {item.next_review_date && new Date(item.next_review_date) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) && (
                        <Button variant="outline" size="sm" className="text-orange-600">
                          <BellIcon className="h-4 w-4 mr-2" />
                          Set Reminder
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* UAE Legal References */}
      {legalReferences.length > 0 && (
        <Card className="glass">
          <CardHeader>
            <CardTitle>UAE Legal References</CardTitle>
            <CardDescription>Key legal references and regulations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {legalReferences.slice(0, 6).map((reference) => (
                <div key={reference.id} className="p-3 border rounded-lg hover:bg-gray-50">
                  <div className="flex items-start gap-2">
                    <DocumentTextIcon className="h-4 w-4 text-gray-400 mt-1" />
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">{reference.reference_title}</h4>
                      <p className="text-xs text-gray-600 mt-1">{reference.reference_code}</p>
                      <Badge className="mt-2 text-xs" variant="secondary">
                        {reference.reference_type}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}