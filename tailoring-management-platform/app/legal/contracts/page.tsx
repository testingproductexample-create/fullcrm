'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DocumentTextIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  CalendarIcon,
  BanknotesIcon,
  UserGroupIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { useContracts, useContractTemplates } from '@/hooks/useLegal';
import type { ContractFilters, LegalPagination } from '@/types/legal';

export default function ContractManagement() {
  const [selectedTab, setSelectedTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<ContractFilters>({});
  const [pagination, setPagination] = useState<LegalPagination>({
    page: 1,
    limit: 20,
    sort_by: 'created_at',
    sort_order: 'desc'
  });

  // Data hooks
  const { data: contracts = [], isLoading, error } = useContracts(
    { ...filters, search: searchTerm },
    pagination
  );
  const { data: templates = [] } = useContractTemplates();

  // Filter contracts by tab
  const filteredContracts = contracts.filter(contract => {
    switch (selectedTab) {
      case 'active':
        return contract.status === 'active';
      case 'pending':
        return contract.signature_status === 'pending';
      case 'expiring':
        const now = new Date();
        const thirtyDaysFromNow = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000));
        return contract.end_date && new Date(contract.end_date) <= thirtyDaysFromNow;
      case 'drafts':
        return contract.status === 'draft';
      default:
        return true;
    }
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'draft': return 'text-yellow-600 bg-yellow-100';
      case 'review': return 'text-blue-600 bg-blue-100';
      case 'approval': return 'text-purple-600 bg-purple-100';
      case 'expired': return 'text-red-600 bg-red-100';
      case 'terminated': return 'text-gray-600 bg-gray-100';
      case 'renewed': return 'text-emerald-600 bg-emerald-100';
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

  const getContractTypeIcon = (type: string) => {
    switch (type) {
      case 'client_service': return <UserGroupIcon className="h-4 w-4" />;
      case 'employee': return <UserGroupIcon className="h-4 w-4" />;
      case 'supplier': return <BanknotesIcon className="h-4 w-4" />;
      default: return <DocumentTextIcon className="h-4 w-4" />;
    }
  };

  const handleFilterChange = (key: keyof ContractFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({});
    setSearchTerm('');
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
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
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Contract Management</h1>
          <p className="text-gray-600 mt-2">Manage all contracts, agreements, and legal documents</p>
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
        </div>
      </div>

      {/* Search and Filters */}
      <Card className="glass">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search contracts by title, number, or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-2">
              <Select value={filters.contract_type || ''} onValueChange={(value) => handleFilterChange('contract_type', value)}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Contract Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="client_service">Client Service</SelectItem>
                  <SelectItem value="employee">Employee</SelectItem>
                  <SelectItem value="supplier">Supplier</SelectItem>
                  <SelectItem value="vendor">Vendor</SelectItem>
                  <SelectItem value="lease">Lease</SelectItem>
                  <SelectItem value="insurance">Insurance</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filters.status || ''} onValueChange={(value) => handleFilterChange('status', value)}>
                <SelectTrigger className="w-full sm:w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="review">Review</SelectItem>
                  <SelectItem value="approval">Approval</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                  <SelectItem value="terminated">Terminated</SelectItem>
                  <SelectItem value="renewed">Renewed</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" onClick={clearFilters} className="w-full sm:w-auto">
                <FunnelIcon className="h-4 w-4 mr-2" />
                Clear
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contract Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5">
          <TabsTrigger value="all">All ({contracts.length})</TabsTrigger>
          <TabsTrigger value="active">Active ({contracts.filter(c => c.status === 'active').length})</TabsTrigger>
          <TabsTrigger value="pending">Pending ({contracts.filter(c => c.signature_status === 'pending').length})</TabsTrigger>
          <TabsTrigger value="expiring">Expiring ({contracts.filter(c => {
            const now = new Date();
            const thirtyDaysFromNow = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000));
            return c.end_date && new Date(c.end_date) <= thirtyDaysFromNow;
          }).length})</TabsTrigger>
          <TabsTrigger value="drafts">Drafts ({contracts.filter(c => c.status === 'draft').length})</TabsTrigger>
        </TabsList>

        {/* Contract Cards */}
        <TabsContent value={selectedTab} className="space-y-4">
          {filteredContracts.length === 0 ? (
            <Card className="glass">
              <CardContent className="p-12 text-center">
                <DocumentTextIcon className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No contracts found</h3>
                <p className="text-gray-600 mb-6">Create your first contract or adjust your filters</p>
                <Link href={`/legal/contracts/new`}>
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Create Contract
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredContracts.map((contract) => (
                <Card key={contract.id} className="glass hover-lift">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg flex items-center gap-2">
                          {getContractTypeIcon(contract.contract_type)}
                          <span className="truncate">{contract.title}</span>
                        </CardTitle>
                        <CardDescription className="mt-1">
                          {contract.contract_number} • {contract.contract_type?.replace('_', ' ')}
                        </CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Badge className={getStatusColor(contract.status)}>
                          {contract.status}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Contract Details */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <CalendarIcon className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-600">Start Date</span>
                        </div>
                        <p className="font-medium">
                          {new Date(contract.start_date).toLocaleDateString()}
                        </p>
                      </div>
                      
                      {contract.end_date && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <ClockIcon className="h-4 w-4 text-gray-400" />
                            <span className="text-gray-600">End Date</span>
                          </div>
                          <p className="font-medium">
                            {new Date(contract.end_date).toLocaleDateString()}
                          </p>
                        </div>
                      )}
                      
                      {contract.contract_value && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <BanknotesIcon className="h-4 w-4 text-gray-400" />
                            <span className="text-gray-600">Value</span>
                          </div>
                          <p className="font-medium">
                            {new Intl.NumberFormat('en-AE', {
                              style: 'currency',
                              currency: contract.currency
                            }).format(contract.contract_value)}
                          </p>
                        </div>
                      )}

                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <UserGroupIcon className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-600">Parties</span>
                        </div>
                        <p className="font-medium text-sm">
                          {contract.contract_parties?.[0]?.full_name || 'N/A'}
                        </p>
                      </div>
                    </div>

                    {/* Signature Status */}
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <PencilIcon className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-600">Signature Status</span>
                      </div>
                      <Badge className={getSignatureStatusColor(contract.signature_status)}>
                        {contract.signature_status}
                      </Badge>
                    </div>

                    {/* Warning for expiring contracts */}
                    {contract.end_date && new Date(contract.end_date) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) && (
                      <div className="flex items-center gap-2 p-2 bg-orange-50 border border-orange-200 rounded-lg">
                        <ExclamationTriangleIcon className="h-4 w-4 text-orange-600" />
                        <span className="text-sm text-orange-700">Expires within 30 days</span>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 pt-2 border-t">
                      <Link href={`/legal/contracts/${contract.id}`} className="flex-1">
                        <Button variant="outline" size="sm" className="w-full">
                          <EyeIcon className="h-4 w-4 mr-2" />
                          View
                        </Button>
                      </Link>
                      <Link href={`/legal/contracts/${contract.id/edit}`} className="flex-1">
                        <Button variant="outline" size="sm" className="w-full">
                          <PencilIcon className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                      </Link>
                      {contract.status === 'draft' && (
                        <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                          <TrashIcon className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Pagination */}
          {filteredContracts.length > 0 && (
            <div className="flex items-center justify-between pt-6">
              <div className="text-sm text-gray-600">
                Showing {filteredContracts.length} of {contracts.length} contracts
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  disabled={pagination.page <= 1}
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                >
                  Previous
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  disabled={filteredContracts.length < pagination.limit}
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}