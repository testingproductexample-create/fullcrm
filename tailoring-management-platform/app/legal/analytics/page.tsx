'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  ChartBarIcon,
  DocumentTextIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  CalendarIcon,
  ClockIcon,
  ShieldCheckIcon,
  BanknotesIcon,
  PencilSquareIcon,
  UserGroupIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ArrowPathIcon,
  PresentationChartLineIcon,
  DocumentDuplicateIcon
} from '@heroicons/react/24/outline';
import { 
  useLegalDashboardStats,
  useContracts,
  useSignatureTracking,
  useComplianceTracking 
} from '@/hooks/useLegal';

export default function LegalAnalytics() {
  const [selectedTab, setSelectedTab] = useState('overview');
  const [timeRange, setTimeRange] = useState('30d');

  // Data hooks
  const { data: dashboardStats } = useLegalDashboardStats();
  const { data: contracts = [] } = useContracts();
  const { data: signatures = [] } = useSignatureTracking();
  const { data: compliance = [] } = useComplianceTracking();

  // Analytics calculations
  const contractsByType = contracts.reduce((acc, contract) => {
    acc[contract.contract_type] = (acc[contract.contract_type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const contractsByStatus = contracts.reduce((acc, contract) => {
    acc[contract.status] = (acc[contract.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const signatureSuccessRate = signatures.length > 0 ? 
    (signatures.filter(s => s.signature_status === 'signed').length / signatures.length) * 100 : 0;

  const averageSigningTime = signatures
    .filter(s => s.signature_status === 'signed' && s.sent_at && s.signed_at)
    .map(s => {
      const sent = new Date(s.sent_at!).getTime();
      const signed = new Date(s.signed_at!).getTime();
      return (signed - sent) / (1000 * 60 * 60 * 24); // days
    })
    .reduce((sum, days, _, arr) => sum + days / arr.length, 0);

  const complianceByType = compliance.reduce((acc, item) => {
    const type = item.compliance_type || 'other';
    if (!acc[type]) acc[type] = { total: 0, compliant: 0 };
    acc[type].total++;
    if (item.compliance_status === 'compliant') acc[type].compliant++;
    return acc;
  }, {} as Record<string, { total: number; compliant: number }>);

  const monthlyContractTrend = contracts.reduce((acc, contract) => {
    const month = new Date(contract.created_at || '').toISOString().slice(0, 7);
    acc[month] = (acc[month] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const contractValueByType = contracts.reduce((acc, contract) => {
    const type = contract.contract_type;
    if (!acc[type]) acc[type] = 0;
    acc[type] += contract.contract_value || 0;
    return acc;
  }, {} as Record<string, number>);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'draft': return 'text-yellow-600 bg-yellow-100';
      case 'expired': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const stats = dashboardStats || {
    total_contracts: 0,
    active_contracts: 0,
    pending_signatures: 0,
    expiring_contracts: 0,
    compliance_score: 100,
    renewal_rate: 0,
    average_contract_value: 0
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Legal Analytics</h1>
          <p className="text-gray-600 mt-2">Comprehensive insights into legal operations and performance</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <Button className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto">
            <PresentationChartLineIcon className="h-4 w-4 mr-2" />
            Export Report
          </Button>
          <Button variant="outline" className="w-full sm:w-auto">
            <DocumentDuplicateIcon className="h-4 w-4 mr-2" />
            Schedule Report
          </Button>
        </div>
      </div>

      {/* Key Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="glass hover-lift">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Contract Success Rate</p>
                <p className="text-3xl font-bold text-green-600">
                  {contracts.length > 0 ? Math.round((stats.active_contracts / stats.total_contracts) * 100) : 0}%
                </p>
                <p className="text-xs text-gray-500">Active vs Total</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <TrendingUpIcon className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass hover-lift">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Signature Success Rate</p>
                <p className="text-3xl font-bold text-blue-600">{Math.round(signatureSuccessRate)}%</p>
                <p className="text-xs text-gray-500">Completed signatures</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <PencilSquareIcon className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass hover-lift">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg. Signing Time</p>
                <p className="text-3xl font-bold text-purple-600">{Math.round(averageSigningTime || 0)}</p>
                <p className="text-xs text-gray-500">Days to complete</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <ClockIcon className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass hover-lift">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Contract Value</p>
                <p className="text-2xl font-bold text-emerald-600">
                  {new Intl.NumberFormat('en-AE', {
                    style: 'currency',
                    currency: 'AED',
                    notation: 'compact'
                  }).format(contracts.reduce((sum, c) => sum + (c.contract_value || 0), 0))}
                </p>
                <p className="text-xs text-gray-500">Portfolio value</p>
              </div>
              <div className="p-3 bg-emerald-100 rounded-full">
                <BanknotesIcon className="h-6 w-6 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="contracts">Contracts</TabsTrigger>
          <TabsTrigger value="signatures">Signatures</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Contract Status Distribution */}
            <Card className="glass">
              <CardHeader>
                <CardTitle>Contract Status Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(contractsByStatus).map(([status, count]) => (
                    <div key={status} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="capitalize">{status}</span>
                        <span>{count} contracts</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${
                              status === 'active' ? 'bg-green-500' :
                              status === 'draft' ? 'bg-yellow-500' :
                              status === 'expired' ? 'bg-red-500' : 'bg-blue-500'
                            }`}
                            style={{ width: `${(count / contracts.length) * 100}%` }}
                          ></div>
                        </div>
                        <Badge className={getStatusColor(status)}>
                          {Math.round((count / contracts.length) * 100)}%
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Contract Types */}
            <Card className="glass">
              <CardHeader>
                <CardTitle>Contract Types</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(contractsByType).map(([type, count]) => (
                    <div key={type} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <DocumentTextIcon className="h-4 w-4 text-gray-400" />
                        <span className="text-sm font-medium capitalize">{type.replace('_', ' ')}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-blue-600">{count}</div>
                        <div className="text-xs text-gray-500">
                          {Math.round((count / contracts.length) * 100)}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Monthly Trend */}
          <Card className="glass">
            <CardHeader>
              <CardTitle>Monthly Contract Creation Trend</CardTitle>
              <CardDescription>Number of contracts created each month</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-6 md:grid-cols-12 gap-2">
                {Object.entries(monthlyContractTrend).slice(-12).map(([month, count]) => (
                  <div key={month} className="text-center">
                    <div className="text-xs text-gray-600 mb-2">
                      {new Date(month + '-01').toLocaleDateString('en', { month: 'short' })}
                    </div>
                    <div className="bg-blue-100 rounded-full mx-auto relative" style={{ height: '60px', width: '20px' }}>
                      <div 
                        className="bg-blue-500 rounded-full absolute bottom-0 w-full"
                        style={{ height: `${Math.min((count / Math.max(...Object.values(monthlyContractTrend))) * 100, 100)}%` }}
                      ></div>
                    </div>
                    <div className="text-xs font-medium mt-1">{count}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Contracts Tab */}
        <TabsContent value="contracts" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Contract Value by Type */}
            <Card className="glass">
              <CardHeader>
                <CardTitle>Contract Value by Type</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(contractValueByType).map(([type, value]) => (
                    <div key={type} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="capitalize">{type.replace('_', ' ')}</span>
                        <span className="font-medium">
                          {new Intl.NumberFormat('en-AE', {
                            style: 'currency',
                            currency: 'AED',
                            notation: 'compact'
                          }).format(value)}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="h-2 rounded-full bg-emerald-500"
                          style={{ 
                            width: `${(value / Math.max(...Object.values(contractValueByType))) * 100}%` 
                          }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Contract Performance */}
            <Card className="glass">
              <CardHeader>
                <CardTitle>Contract Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <CheckCircleIcon className="h-5 w-5 text-green-600" />
                      <span className="text-sm font-medium">Active Contracts</span>
                    </div>
                    <span className="text-lg font-bold text-green-600">{stats.active_contracts}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <ClockIcon className="h-5 w-5 text-yellow-600" />
                      <span className="text-sm font-medium">Pending Approval</span>
                    </div>
                    <span className="text-lg font-bold text-yellow-600">{stats.pending_signatures}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <ExclamationTriangleIcon className="h-5 w-5 text-red-600" />
                      <span className="text-sm font-medium">Expiring Soon</span>
                    </div>
                    <span className="text-lg font-bold text-red-600">{stats.expiring_contracts}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <ArrowPathIcon className="h-5 w-5 text-purple-600" />
                      <span className="text-sm font-medium">Renewal Rate</span>
                    </div>
                    <span className="text-lg font-bold text-purple-600">{stats.renewal_rate}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Signatures Tab */}
        <TabsContent value="signatures" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="glass">
              <CardHeader>
                <CardTitle>Signature Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600">{Math.round(signatureSuccessRate)}%</div>
                    <div className="text-sm text-gray-600">Success Rate</div>
                    <Progress value={signatureSuccessRate} className="mt-2" />
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <div className="text-lg font-bold text-green-600">
                        {signatures.filter(s => s.signature_status === 'signed').length}
                      </div>
                      <div className="text-xs text-gray-600">Signed</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-orange-600">
                        {signatures.filter(s => s.signature_status === 'pending').length}
                      </div>
                      <div className="text-xs text-gray-600">Pending</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass">
              <CardHeader>
                <CardTitle>Average Signing Time</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center space-y-4">
                  <div className="text-3xl font-bold text-purple-600">
                    {Math.round(averageSigningTime || 0)} days
                  </div>
                  <div className="text-sm text-gray-600">Average time to complete signature</div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span>Target: 3 days</span>
                      <span>Current: {Math.round(averageSigningTime || 0)} days</span>
                    </div>
                    <Progress 
                      value={Math.min(((3 / (averageSigningTime || 3)) * 100), 100)} 
                      className="h-2" 
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass">
              <CardHeader>
                <CardTitle>Signature Methods</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {['digital', 'electronic', 'biometric'].map(method => {
                    const count = signatures.filter(s => s.signature_method === method).length;
                    const percentage = signatures.length > 0 ? (count / signatures.length) * 100 : 0;
                    
                    return (
                      <div key={method} className="flex items-center justify-between">
                        <span className="text-sm capitalize">{method}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div 
                              className="h-2 rounded-full bg-blue-500"
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                          <span className="text-xs font-medium w-8">{count}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Compliance Tab */}
        <TabsContent value="compliance" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="glass">
              <CardHeader>
                <CardTitle>Compliance Score by Type</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(complianceByType).map(([type, data]) => {
                    const score = data.total > 0 ? (data.compliant / data.total) * 100 : 100;
                    
                    return (
                      <div key={type} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="capitalize">{type.replace('_', ' ')}</span>
                          <span>{Math.round(score)}% ({data.compliant}/{data.total})</span>
                        </div>
                        <Progress value={score} className="h-2" />
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card className="glass">
              <CardHeader>
                <CardTitle>Overall Compliance Health</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center space-y-4">
                  <div className="text-4xl font-bold text-green-600">{stats.compliance_score}%</div>
                  <div className="text-sm text-gray-600">Overall Compliance Score</div>
                  <Progress value={stats.compliance_score} className="h-4" />
                  <div className="text-xs text-gray-500">
                    {stats.compliance_score >= 90 ? 'Excellent compliance' :
                     stats.compliance_score >= 75 ? 'Good compliance' :
                     stats.compliance_score >= 50 ? 'Moderate compliance' : 'Needs improvement'}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="glass">
            <CardHeader>
              <CardTitle>Compliance Risk Assessment</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {['critical', 'high', 'medium', 'low'].map(risk => {
                  const count = compliance.filter(item => item.risk_level === risk).length;
                  const color = risk === 'critical' ? 'red' : risk === 'high' ? 'orange' : risk === 'medium' ? 'yellow' : 'green';
                  
                  return (
                    <div key={risk} className={`p-4 rounded-lg bg-${color}-50 border border-${color}-200`}>
                      <div className={`text-2xl font-bold text-${color}-600`}>{count}</div>
                      <div className={`text-sm text-${color}-700 capitalize`}>{risk} Risk</div>
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