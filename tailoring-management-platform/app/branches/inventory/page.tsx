'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useBranches } from '@/hooks/useBranch';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  CubeIcon,
  BuildingOffice2Icon,
  ArrowPathIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export default function CrossLocationInventoryPage() {
  const { user } = useAuth();
  const organizationId = user?.user_metadata?.organization_id;

  const { data: branches } = useBranches(organizationId);
  const [selectedBranch, setSelectedBranch] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Fetch inventory across all branches
  const { data: allInventory, isLoading } = useQuery({
    queryKey: ['cross-location-inventory', organizationId, selectedBranch],
    queryFn: async () => {
      let query = supabase
        .from('branch_inventory')
        .select('*, branch:branches(branch_name, branch_code)')
        .eq('organization_id', organizationId!);

      if (selectedBranch !== 'all') {
        query = query.eq('branch_id', selectedBranch);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!organizationId
  });

  // Group inventory by material_id to show stock levels across branches
  const inventoryByMaterial = allInventory?.reduce((acc: any, item: any) => {
    if (!acc[item.material_id]) {
      acc[item.material_id] = {
        material_id: item.material_id,
        unit_of_measure: item.unit_of_measure,
        branches: [],
        total_quantity: 0,
        total_value: 0,
        low_stock_branches: 0
      };
    }

    acc[item.material_id].branches.push({
      branch_id: item.branch_id,
      branch_name: item.branch?.branch_name || 'Unknown',
      branch_code: item.branch?.branch_code || '',
      quantity: item.quantity_in_stock,
      minimum_level: item.minimum_stock_level,
      status: item.status,
      storage_location: item.storage_location
    });

    acc[item.material_id].total_quantity += item.quantity_in_stock;
    acc[item.material_id].total_value += item.total_value_aed || 0;

    if (item.status === 'low_stock' || item.quantity_in_stock <= item.minimum_stock_level) {
      acc[item.material_id].low_stock_branches += 1;
    }

    return acc;
  }, {});

  const materials = inventoryByMaterial ? Object.values(inventoryByMaterial) : [];

  // Filter by status and search
  const filteredMaterials = materials.filter((material: any) => {
    const matchesSearch = searchQuery === '' || 
      material.material_id.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' ||
      (statusFilter === 'low_stock' && material.low_stock_branches > 0) ||
      (statusFilter === 'available' && material.low_stock_branches === 0);

    return matchesSearch && matchesStatus;
  });

  // Calculate totals
  const totalItems = allInventory?.length || 0;
  const lowStockItems = allInventory?.filter((item: any) => 
    item.status === 'low_stock' || item.quantity_in_stock <= item.minimum_stock_level
  ).length || 0;
  const totalValue = allInventory?.reduce((sum: number, item: any) => 
    sum + (item.total_value_aed || 0), 0
  ) || 0;

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      available: 'bg-green-500/20 text-green-300 border-green-500/30',
      reserved: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      low_stock: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
      out_of_stock: 'bg-red-500/20 text-red-300 border-red-500/30',
      discontinued: 'bg-gray-500/20 text-gray-300 border-gray-500/30'
    };
    return colors[status] || colors.available;
  };

  if (isLoading) {
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
          <h1 className="text-3xl font-bold text-white mb-2">Cross-Location Inventory</h1>
          <p className="text-gray-400">View and manage inventory across all branch locations</p>
        </div>
        <div className="flex gap-2">
          <Link href={`/branches/transfers/new`}>
            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">
              <ArrowPathIcon className="h-5 w-5 mr-2" />
              Transfer Stock
            </Button>
          </Link>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-white/5 backdrop-blur-xl border border-white/10 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm">Total Items</span>
            <CubeIcon className="h-6 w-6 text-indigo-400" />
          </div>
          <div className="text-3xl font-bold text-white">{totalItems}</div>
          <div className="text-xs text-gray-400 mt-1">Across all branches</div>
        </Card>

        <Card className="bg-white/5 backdrop-blur-xl border border-white/10 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm">Low Stock Alerts</span>
            <ExclamationTriangleIcon className="h-6 w-6 text-orange-400" />
          </div>
          <div className="text-3xl font-bold text-white">{lowStockItems}</div>
          <div className="text-xs text-gray-400 mt-1">Items below minimum</div>
        </Card>

        <Card className="bg-white/5 backdrop-blur-xl border border-white/10 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm">Total Value</span>
            <CubeIcon className="h-6 w-6 text-green-400" />
          </div>
          <div className="text-3xl font-bold text-white">{totalValue.toLocaleString()}</div>
          <div className="text-xs text-gray-400 mt-1">AED</div>
        </Card>

        <Card className="bg-white/5 backdrop-blur-xl border border-white/10 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm">Active Branches</span>
            <BuildingOffice2Icon className="h-6 w-6 text-purple-400" />
          </div>
          <div className="text-3xl font-bold text-white">
            {branches?.filter(b => b.status === 'active').length || 0}
          </div>
          <div className="text-xs text-gray-400 mt-1">Locations</div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-white/5 backdrop-blur-xl border border-white/10 p-6">
        <div className="space-y-4">
          <div className="flex items-center gap-4 flex-wrap">
            <FunnelIcon className="h-5 w-5 text-gray-400" />
            
            {/* Branch Filter */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400">Branch:</span>
              <select
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                className="bg-white/5 border border-white/10 rounded-lg px-3 py-1 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">All Branches</option>
                {branches?.map(branch => (
                  <option key={branch.id} value={branch.id}>
                    {branch.branch_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div className="flex gap-2">
              <span className="text-sm text-gray-400">Status:</span>
              {['all', 'available', 'low_stock'].map(status => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                    statusFilter === status
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white/5 text-gray-400 hover:bg-white/10'
                  }`}
                >
                  {status === 'all' ? 'All' : status.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by material ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
      </Card>

      {/* Inventory Table */}
      <div className="space-y-4">
        {filteredMaterials.length > 0 ? (
          filteredMaterials.map((material: any) => (
            <Card key={material.material_id} className="bg-white/5 backdrop-blur-xl border border-white/10 p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-white">Material ID: {material.material_id.substring(0, 16)}...</h3>
                    {material.low_stock_branches > 0 && (
                      <Badge className="bg-orange-500/20 text-orange-300 border-orange-500/30">
                        {material.low_stock_branches} low stock
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-400">
                    <span>Unit: {material.unit_of_measure}</span>
                    <span>•</span>
                    <span>Total: {material.total_quantity.toFixed(2)}</span>
                    <span>•</span>
                    <span>Value: {material.total_value.toLocaleString()} AED</span>
                  </div>
                </div>
              </div>

              {/* Branch Stock Levels */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {material.branches.map((branchStock: any) => (
                  <div
                    key={branchStock.branch_id}
                    className="bg-white/5 border border-white/10 rounded-lg p-4"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="text-white font-medium">{branchStock.branch_name}</div>
                        <div className="text-xs text-gray-400">{branchStock.branch_code}</div>
                      </div>
                      <Badge className={getStatusColor(branchStock.status)}>
                        {branchStock.status.replace('_', ' ')}
                      </Badge>
                    </div>
                    
                    <div className="flex justify-between items-end mt-3">
                      <div>
                        <div className="text-2xl font-bold text-white">{branchStock.quantity.toFixed(2)}</div>
                        <div className="text-xs text-gray-400 mt-1">
                          Min: {branchStock.minimum_level.toFixed(2)}
                        </div>
                      </div>
                      
                      {branchStock.quantity <= branchStock.minimum_level && (
                        <ExclamationTriangleIcon className="h-6 w-6 text-orange-400" />
                      )}
                    </div>

                    {branchStock.storage_location && (
                      <div className="text-xs text-gray-400 mt-2">
                        Location: {branchStock.storage_location}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Quick Actions */}
              <div className="flex gap-2 mt-4 pt-4 border-t border-white/10">
                <Button
                  variant="outline"
                  className="border-white/10 text-white hover:bg-white/5 text-sm"
                  onClick={() => {
                    // Would open transfer dialog with this material pre-selected
                    console.log('Transfer material:', material.material_id);
                  }}
                >
                  <ArrowPathIcon className="h-4 w-4 mr-2" />
                  Transfer Stock
                </Button>
                <Button
                  variant="outline"
                  className="border-white/10 text-white hover:bg-white/5 text-sm"
                >
                  View History
                </Button>
              </div>
            </Card>
          ))
        ) : (
          <Card className="bg-white/5 backdrop-blur-xl border border-white/10 p-12">
            <div className="text-center">
              <CubeIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No inventory found</h3>
              <p className="text-gray-400">
                {searchQuery || statusFilter !== 'all'
                  ? 'No inventory items match your search criteria'
                  : 'Start adding inventory items to your branches'}
              </p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
