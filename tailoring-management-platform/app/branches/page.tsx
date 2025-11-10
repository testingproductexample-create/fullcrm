'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useBranches, useMultiLocationOverview, useDeleteBranch } from '@/hooks/useBranch';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  BuildingOffice2Icon,
  PlusIcon,
  MapPinIcon,
  PhoneIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon,
  Cog6ToothIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import type { Branch } from '@/types/branch';

export default function BranchesPage() {
  const { user } = useAuth();
  const organizationId = user?.user_metadata?.organization_id;
  
  const { data: branches, isLoading: loadingBranches } = useBranches(organizationId);
  const { data: overview, isLoading: loadingOverview } = useMultiLocationOverview(organizationId);
  const deleteBranch = useDeleteBranch();

  const [selectedFilter, setSelectedFilter] = useState<string>('all');

  const filteredBranches = branches?.filter(branch => {
    if (selectedFilter === 'all') return true;
    return branch.status === selectedFilter;
  });

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      active: 'bg-green-500/20 text-green-300 border-green-500/30',
      inactive: 'bg-gray-500/20 text-gray-300 border-gray-500/30',
      under_renovation: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
      temporarily_closed: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
      permanently_closed: 'bg-red-500/20 text-red-300 border-red-500/30'
    };
    return colors[status] || colors.active;
  };

  const getBranchTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      main: 'Main',
      branch: 'Branch',
      outlet: 'Outlet',
      franchise: 'Franchise',
      warehouse: 'Warehouse'
    };
    return labels[type] || type;
  };

  if (loadingBranches || loadingOverview) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Multi-Location Management</h1>
          <p className="text-gray-400">Manage all branch locations from a centralized dashboard</p>
        </div>
        <Link href="/branches/new">
          <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">
            <PlusIcon className="h-5 w-5 mr-2" />
            Add New Branch
          </Button>
        </Link>
      </div>

      {/* Overview Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-white/5 backdrop-blur-xl border border-white/10 p-6">
          <div className="flex items-center justify-between mb-4">
            <BuildingOffice2Icon className="h-8 w-8 text-indigo-400" />
            <Badge className="bg-indigo-500/20 text-indigo-300 border-indigo-500/30">
              {overview?.active_branches || 0} Active
            </Badge>
          </div>
          <div className="text-3xl font-bold text-white mb-1">
            {overview?.total_branches || 0}
          </div>
          <div className="text-sm text-gray-400">Total Branches</div>
        </Card>

        <Card className="bg-white/5 backdrop-blur-xl border border-white/10 p-6">
          <div className="flex items-center justify-between mb-4">
            <UserGroupIcon className="h-8 w-8 text-green-400" />
            <ArrowTrendingUpIcon className="h-5 w-5 text-green-400" />
          </div>
          <div className="text-3xl font-bold text-white mb-1">
            {overview?.total_staff || 0}
          </div>
          <div className="text-sm text-gray-400">Total Staff Across Locations</div>
        </Card>

        <Card className="bg-white/5 backdrop-blur-xl border border-white/10 p-6">
          <div className="flex items-center justify-between mb-4">
            <CurrencyDollarIcon className="h-8 w-8 text-yellow-400" />
            <ChartBarIcon className="h-5 w-5 text-yellow-400" />
          </div>
          <div className="text-3xl font-bold text-white mb-1">
            {(overview?.monthly_revenue_all_branches || 0).toLocaleString()} AED
          </div>
          <div className="text-sm text-gray-400">Combined Monthly Revenue</div>
        </Card>

        <Card className="bg-white/5 backdrop-blur-xl border border-white/10 p-6">
          <div className="flex items-center justify-between mb-4">
            <ChartBarIcon className="h-8 w-8 text-purple-400" />
            <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30">
              Average
            </Badge>
          </div>
          <div className="text-3xl font-bold text-white mb-1">
            {overview?.branches && overview.branches.length > 0
              ? Math.round(
                  overview.branches.reduce((sum, b) => sum + b.customer_satisfaction, 0) /
                    overview.branches.length * 10
                ) / 10
              : 0}
          </div>
          <div className="text-sm text-gray-400">Customer Satisfaction Score</div>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-4">
        <Link href="/branches/transfers">
          <Button variant="outline" className="border-white/10 text-white hover:bg-white/5">
            View Transfers
          </Button>
        </Link>
        <Link href="/branches/inventory">
          <Button variant="outline" className="border-white/10 text-white hover:bg-white/5">
            Cross-Location Inventory
          </Button>
        </Link>
        <Link href="/branches/analytics">
          <Button variant="outline" className="border-white/10 text-white hover:bg-white/5">
            Performance Analytics
          </Button>
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-white/10 pb-2">
        {['all', 'active', 'inactive', 'under_renovation'].map((filter) => (
          <button
            key={filter}
            onClick={() => setSelectedFilter(filter)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedFilter === filter
                ? 'bg-indigo-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            {filter === 'all' ? 'All Branches' : filter.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
          </button>
        ))}
      </div>

      {/* Branch List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredBranches?.map((branch) => (
          <Card key={branch.id} className="bg-white/5 backdrop-blur-xl border border-white/10 p-6 hover:bg-white/10 transition-colors">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-indigo-500/20 rounded-lg">
                  <BuildingOffice2Icon className="h-6 w-6 text-indigo-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-semibold text-white">{branch.branch_name}</h3>
                    {branch.is_flagship && (
                      <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-500/30 text-xs">
                        Flagship
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Badge className={`${getStatusColor(branch.status)} text-xs`}>
                      {branch.status.replace('_', ' ')}
                    </Badge>
                    <span className="text-gray-400">•</span>
                    <span className="text-gray-400">{getBranchTypeLabel(branch.branch_type)}</span>
                    <span className="text-gray-400">•</span>
                    <span className="text-gray-400">{branch.branch_code}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3 mb-4">
              <div className="flex items-start gap-2 text-sm">
                <MapPinIcon className="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5" />
                <span className="text-gray-300">
                  {branch.address_line1}
                  {branch.address_line2 && `, ${branch.address_line2}`}
                  <br />
                  {branch.city}, {branch.emirate || 'UAE'}
                </span>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <PhoneIcon className="h-5 w-5 text-gray-400" />
                <span className="text-gray-300">{branch.phone_primary}</span>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <div className="flex items-center gap-2">
                    <UserGroupIcon className="h-4 w-4 text-gray-400" />
                    <span className="text-2xl font-bold text-white">{branch.total_staff_count}</span>
                  </div>
                  <div className="text-xs text-gray-400 mt-1">Staff Members</div>
                </div>

                {overview?.branches?.find(b => b.branch_id === branch.id) && (
                  <div>
                    <div className="flex items-center gap-2">
                      <CurrencyDollarIcon className="h-4 w-4 text-gray-400" />
                      <span className="text-2xl font-bold text-white">
                        {(overview.branches.find(b => b.branch_id === branch.id)?.monthly_revenue || 0).toLocaleString()}
                      </span>
                    </div>
                    <div className="text-xs text-gray-400 mt-1">Monthly Revenue (AED)</div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-2 pt-4 border-t border-white/10">
              <Link href={`/branches/${branch.id}`} className="flex-1">
                <Button variant="outline" className="w-full border-white/10 text-white hover:bg-white/5">
                  <EyeIcon className="h-4 w-4 mr-2" />
                  View Details
                </Button>
              </Link>
              <Link href={`/branches/${branch.id}/settings`}>
                <Button variant="outline" className="border-white/10 text-white hover:bg-white/5">
                  <Cog6ToothIcon className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </Card>
        ))}
      </div>

      {filteredBranches?.length === 0 && (
        <Card className="bg-white/5 backdrop-blur-xl border border-white/10 p-12">
          <div className="text-center">
            <BuildingOffice2Icon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No branches found</h3>
            <p className="text-gray-400 mb-6">
              {selectedFilter === 'all' 
                ? 'Get started by creating your first branch location'
                : `No branches with status: ${selectedFilter}`
              }
            </p>
            <Link href="/branches/new">
              <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">
                <PlusIcon className="h-5 w-5 mr-2" />
                Add First Branch
              </Button>
            </Link>
          </div>
        </Card>
      )}
    </div>
  );
}
