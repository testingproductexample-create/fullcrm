'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  DocumentTextIcon, 
  PencilSquareIcon, 
  ClockIcon, 
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XMarkIcon,
  BanknotesIcon,
  ShieldCheckIcon,
  UsersIcon,
  CalendarIcon,
  ArrowTrendingUpIcon,
  PlusIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { 
  useLegalDashboardStats,
  useContracts,
  useComplianceTracking 
} from '@/hooks/useLegal';

export default function LegalContractManagement() {
  const [selectedTab, setSelectedTab] = useState('overview');

  // Dashboard data
  const { data: dashboardStats, isLoading: statsLoading } = useLegalDashboardStats();
  const { data: recentContracts = [], isLoading: contractsLoading } = useContracts(
    {}, 
    { page: 1, limit: 10, sort_by: 'created_at', sort_order: 'desc' }
  );
  const { data: complianceAlerts = [] } = useComplianceTracking({
    compliance_status: 'non_compliant'
  });

  if (statsLoading || contractsLoading) {
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

  const stats = dashboardStats || {
    total_contracts: 0,
    active_contracts: 0,
    pending_signatures: 0,
    expiring_contracts: 0,
    compliance_score: 100,
    pending_approvals: 0,
    renewal_rate: 0,
    average_contract_value: 0
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'draft': return 'text-yellow-600 bg-yellow-100';
      case 'review': return 'text-blue-600 bg-blue-100';
      case 'expired': return 'text-red-600 bg-red-100';
      case 'terminated': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getSignatureStatusColor = (status: string) => {
    switch (status) {
      case 'signed': return 'text-green-600 bg-green-100';
      case 'pending': return 'text-orange-600 bg-orange-100';
      case 'partial': return 'text-blue-600 bg-blue-100';
      case 'rejected': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Legal & Contract Management</h1>
          <p className="text-gray-600 mt-2">Comprehensive legal documentation and contract lifecycle management</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <Link href={`/legal/contracts/new`}>
            <Button className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto">
              <PlusIcon className="h-4 w-4 mr-2" />
              New Contract
            </Button>
          </Link>
          <Link href={`/legal/templates`}>
            <Button variant="outline" className="w-full sm:w-auto">
              <DocumentTextIcon className="h-4 w-4 mr-2" />
              Templates
            </Button>
          </Link>
          <Link href={`/legal/signatures`}>
            <Button variant="outline" className="w-full sm:w-auto">
              <PencilSquareIcon className="h-4 w-4 mr-2" />
              Signatures
            </Button>
          </Link>
        </div>
      </div>

      {/* Compliance Alerts */}
      {complianceAlerts.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-600" />
            <span className="font-medium text-red-800">Compliance Alert</span>
          </div>
          <div className="mt-2 text-sm text-red-700">
            <p>{complianceAlerts.length} contract{complianceAlerts.length > 1 ? 's' : ''} need immediate attention for compliance issues</p>
          </div>
          <Link href={`/legal/compliance`} className="mt-2 inline-flex text-sm text-red-600 hover:text-red-800">
            Review Compliance Issues →
          </Link>
        </div>
      )}

      {/* KPI Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="glass hover-lift">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Contracts</p>
                <p className="text-3xl font-bold text-blue-600">{stats.total_contracts}</p>
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
                <p className="text-sm font-medium text-gray-600">Active Contracts</p>
                <p className="text-3xl font-bold text-green-600">{stats.active_contracts}</p>
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
                <p className="text-sm font-medium text-gray-600">Pending Signatures</p>
                <p className="text-3xl font-bold text-orange-600">{stats.pending_signatures}</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-full">
                <PencilSquareIcon className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass hover-lift">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Expiring Soon</p>
                <p className="text-3xl font-bold text-red-600">{stats.expiring_contracts}</p>
                <p className="text-xs text-gray-500">Next 30 days</p>
              </div>
              <div className="p-3 bg-red-100 rounded-full">
                <ClockIcon className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="glass hover-lift">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Compliance Score</p>
                <p className="text-3xl font-bold text-purple-600">{stats.compliance_score}%</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <ShieldCheckIcon className="h-6 w-6 text-purple-600" />
              </div>
            </div>
            <div className="mt-4">
              <Progress value={stats.compliance_score} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass hover-lift">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Approvals</p>
                <p className="text-3xl font-bold text-yellow-600">{stats.pending_approvals}</p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-full">
                <UsersIcon className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass hover-lift">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Renewal Rate</p>
                <p className="text-3xl font-bold text-cyan-600">{stats.renewal_rate}%</p>
              </div>
              <div className="p-3 bg-cyan-100 rounded-full">
                <ArrowTrendingUpIcon className="h-6 w-6 text-cyan-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass hover-lift">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg. Contract Value</p>
                <p className="text-2xl font-bold text-emerald-600">
                  {new Intl.NumberFormat('en-AE', { 
                    style: 'currency', 
                    currency: 'AED' 
                  }).format(stats.average_contract_value)}
                </p>
              </div>
              <div className="p-3 bg-emerald-100 rounded-full">
                <BanknotesIcon className="h-6 w-6 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="contracts">Recent Contracts</TabsTrigger>
          <TabsTrigger value="status">Contract Status</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Contract Status Distribution */}
            <Card className="glass">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <DocumentTextIcon className="h-5 w-5 mr-2" />
                  Contract Status Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { status: 'Active', count: stats.active_contracts, color: 'text-green-600 bg-green-100' },
                    { status: 'Pending', count: stats.pending_signatures, color: 'text-orange-600 bg-orange-100' },
                    { status: 'Expiring', count: stats.expiring_contracts, color: 'text-red-600 bg-red-100' }
                  ].map((item) => (
                    <div key={item.status} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${item.color.split(' ')[1]}`}></div>
                        <span className="font-medium text-gray-900">{item.status}</span>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-sm font-medium ${item.color}`}>
                        {item.count}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="glass">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <PlusIcon className="h-5 w-5 mr-2" />
                  Quick Actions
                </CardTitle>
                <CardDescription>
                  Common legal and contract management tasks
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-3">
                  <Link href={`/legal/contracts/new`}>
                    <Button variant="outline" className="w-full justify-start">
                      <DocumentTextIcon className="h-4 w-4 mr-2" />
                      Create New Contract
                    </Button>
                  </Link>
                  <Link href={`/legal/templates`}>
                    <Button variant="outline" className="w-full justify-start">
                      <DocumentTextIcon className="h-4 w-4 mr-2" />
                      Manage Templates
                    </Button>
                  </Link>
                  <Link href={`/legal/signatures`}>
                    <Button variant="outline" className="w-full justify-start">
                      <PencilSquareIcon className="h-4 w-4 mr-2" />
                      Digital Signatures
                    </Button>
                  </Link>
                  <Link href={`/legal/compliance`}>
                    <Button variant="outline" className="w-full justify-start">
                      <ShieldCheckIcon className="h-4 w-4 mr-2" />
                      Compliance Check
                    </Button>
                  </Link>
                  <Link href={`/legal/analytics`}>
                    <Button variant="outline" className="w-full justify-start">
                      <ArrowTrendingUpIcon className="h-4 w-4 mr-2" />
                      View Analytics
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Recent Contracts Tab */}
        <TabsContent value="contracts" className="space-y-6">
          <Card className="glass">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <ClockIcon className="h-5 w-5 mr-2" />
                  Recent Contracts
                </div>
                <Link href={`/legal/contracts`}>
                  <Button variant="outline" size="sm">
                    View All
                  </Button>
                </Link>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Contract</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900 hidden md:table-cell">Parties</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Status</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900 hidden md:table-cell">Signature</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900 hidden lg:table-cell">Value</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-900">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentContracts.slice(0, 5).map((contract) => (
                      <tr key={contract.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div>
                            <p className="font-medium text-gray-900">{contract.title}</p>
                            <p className="text-xs text-gray-500">{contract.contract_number}</p>
                          </div>
                        </td>
                        <td className="py-3 px-4 hidden md:table-cell">
                          <div className="text-sm text-gray-600">
                            {contract.contract_parties?.[0]?.full_name || 'N/A'}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <Badge className={getStatusColor(contract.status)}>
                            {contract.status}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 hidden md:table-cell">
                          <Badge className={getSignatureStatusColor(contract.signature_status)}>
                            {contract.signature_status}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 hidden lg:table-cell">
                          {contract.contract_value ? 
                            new Intl.NumberFormat('en-AE', { 
                              style: 'currency', 
                              currency: contract.currency 
                            }).format(contract.contract_value) : 'N/A'
                          }
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Link href={`/legal/contracts/${contract.id}`}>
                            <Button variant="ghost" size="sm">
                              <EyeIcon className="h-4 w-4" />
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {recentContracts.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No contracts found. Create your first contract to get started.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Contract Status Tab */}
        <TabsContent value="status" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="glass">
              <CardHeader>
                <CardTitle>Contract Status Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { label: 'Active', value: stats.active_contracts, total: stats.total_contracts, color: 'bg-green-500' },
                    { label: 'Pending', value: stats.pending_signatures, total: stats.total_contracts, color: 'bg-orange-500' },
                    { label: 'Expiring', value: stats.expiring_contracts, total: stats.total_contracts, color: 'bg-red-500' }
                  ].map((item) => (
                    <div key={item.label} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>{item.label}</span>
                        <span>{item.value} / {item.total}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${item.color}`}
                          style={{ width: `${item.total > 0 ? (item.value / item.total) * 100 : 0}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="glass">
              <CardHeader>
                <CardTitle>Compliance Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-purple-600">{stats.compliance_score}%</div>
                    <div className="text-sm text-gray-600">Overall Compliance Score</div>
                  </div>
                  <Progress value={stats.compliance_score} className="h-3" />
                  <div className="text-xs text-gray-500 text-center">
                    {stats.compliance_score >= 90 ? 'Excellent compliance' :
                     stats.compliance_score >= 75 ? 'Good compliance' :
                     stats.compliance_score >= 50 ? 'Moderate compliance' : 'Needs improvement'}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="glass">
              <CardHeader>
                <CardTitle className="text-lg">Contract Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Renewal Rate</span>
                    <span className="font-medium">{stats.renewal_rate}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Average Value</span>
                    <span className="font-medium">
                      {new Intl.NumberFormat('en-AE', { 
                        style: 'currency', 
                        currency: 'AED',
                        maximumFractionDigits: 0
                      }).format(stats.average_contract_value)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Total Contracts</span>
                    <span className="font-medium">{stats.total_contracts}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass">
              <CardHeader>
                <CardTitle className="text-lg">Signature Workflow</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Pending</span>
                    <span className="font-medium text-orange-600">{stats.pending_signatures}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Signed</span>
                    <span className="font-medium text-green-600">
                      {stats.total_contracts - stats.pending_signatures}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Success Rate</span>
                    <span className="font-medium">
                      {stats.total_contracts > 0 ? 
                        Math.round(((stats.total_contracts - stats.pending_signatures) / stats.total_contracts) * 100) : 0
                      }%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass">
              <CardHeader>
                <CardTitle className="text-lg">Risk Assessment</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Expiring Soon</span>
                    <span className="font-medium text-red-600">{stats.expiring_contracts}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Compliance Issues</span>
                    <span className="font-medium text-yellow-600">{complianceAlerts.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Risk Level</span>
                    <span className={`font-medium ${
                      stats.expiring_contracts > 5 || complianceAlerts.length > 3 ? 'text-red-600' :
                      stats.expiring_contracts > 2 || complianceAlerts.length > 1 ? 'text-yellow-600' : 'text-green-600'
                    }`}>
                      {stats.expiring_contracts > 5 || complianceAlerts.length > 3 ? 'High' :
                       stats.expiring_contracts > 2 || complianceAlerts.length > 1 ? 'Medium' : 'Low'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="glass">
            <CardHeader>
              <CardTitle>Contract Analytics Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-center">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{stats.total_contracts}</div>
                  <div className="text-sm text-blue-600">Total Contracts</div>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{stats.compliance_score}%</div>
                  <div className="text-sm text-green-600">Compliance Score</div>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">{stats.renewal_rate}%</div>
                  <div className="text-sm text-purple-600">Renewal Rate</div>
                </div>
                <div className="p-4 bg-emerald-50 rounded-lg">
                  <div className="text-2xl font-bold text-emerald-600">
                    {new Intl.NumberFormat('en-AE', { 
                      style: 'currency', 
                      currency: 'AED',
                      notation: 'compact',
                      maximumFractionDigits: 1
                    }).format(stats.average_contract_value)}
                  </div>
                  <div className="text-sm text-emerald-600">Avg. Value</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}