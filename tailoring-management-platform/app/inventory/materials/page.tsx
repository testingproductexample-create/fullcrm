'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { 
  Search, 
  Filter, 
  Plus, 
  Eye, 
  Edit, 
  Package,
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  Download,
  Upload,
  RefreshCw,
  Tag,
  Layers,
  ShoppingCart
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { 
  FabricLibrary, 
  InventoryStock, 
  StorageLocation
} from '@/types/inventory';
import { 
  formatAEDCurrency, 
  getStockStatus 
} from '@/types/inventory';

interface FabricWithStock extends FabricLibrary {
  inventory_stocks: InventoryStock[];
  total_stock: number;
  total_value: number;
  stock_status: 'In Stock' | 'Low Stock' | 'Out of Stock';
}

interface FilterOptions {
  fabric_type: string;
  stock_status: string;
  supplier: string;
  search: string;
  season: string;
  garment_type: string;
}

type SortField = 'name' | 'type' | 'stock' | 'value' | 'cost' | 'updated';
type SortDirection = 'asc' | 'desc';

export default function MaterialsManagementPage() {
  const [filters, setFilters] = useState<FilterOptions>({
    fabric_type: '',
    stock_status: '',
    supplier: '',
    search: '',
    season: '',
    garment_type: ''
  });
  
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [showFilters, setShowFilters] = useState(false);

  const queryClient = useQueryClient();

  // Fetch fabrics with stock information
  const { data: fabrics, isLoading: fabricsLoading, refetch } = useQuery({
    queryKey: ['fabrics-with-stock', filters, sortField, sortDirection],
    queryFn: async (): Promise<FabricWithStock[]> => {
      let query = supabase
        .from('fabric_library')
        .select(`
          *,
          inventory_stocks(*)
        `);

      // Apply filters
      if (filters.fabric_type) {
        query = query.eq('fabric_type', filters.fabric_type);
      }
      if (filters.supplier) {
        query = query.ilike('supplier_name', `%${filters.supplier}%`);
      }
      if (filters.search) {
        query = query.or(`fabric_name.ilike.%${filters.search}%,fabric_code.ilike.%${filters.search}%`);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Process data to calculate totals and status
      const processedFabrics = (data || []).map(fabric => {
        const stocks = fabric.inventory_stocks || [];
        const totalStock = stocks.reduce((sum, stock) => sum + (stock.current_stock_meters || 0), 0);
        const totalValue = stocks.reduce((sum, stock) => sum + (stock.total_value_aed || 0), 0);
        const minStock = Math.max(...stocks.map(s => s.minimum_stock_level || 0), 10);
        const stockStatus = getStockStatus(totalStock, minStock);

        return {
          ...fabric,
          inventory_stocks: stocks,
          total_stock: totalStock,
          total_value: totalValue,
          stock_status: stockStatus
        };
      });

      // Apply stock status filter
      let filteredFabrics = processedFabrics;
      if (filters.stock_status) {
        filteredFabrics = processedFabrics.filter(fabric => fabric.stock_status === filters.stock_status);
      }

      // Apply sorting
      filteredFabrics.sort((a, b) => {
        let aValue: any;
        let bValue: any;

        switch (sortField) {
          case 'name':
            aValue = a.fabric_name.toLowerCase();
            bValue = b.fabric_name.toLowerCase();
            break;
          case 'type':
            aValue = a.fabric_type.toLowerCase();
            bValue = b.fabric_type.toLowerCase();
            break;
          case 'stock':
            aValue = a.total_stock;
            bValue = b.total_stock;
            break;
          case 'value':
            aValue = a.total_value;
            bValue = b.total_value;
            break;
          case 'cost':
            aValue = a.cost_per_meter_aed;
            bValue = b.cost_per_meter_aed;
            break;
          case 'updated':
            aValue = new Date(a.updated_at);
            bValue = new Date(b.updated_at);
            break;
          default:
            aValue = '';
            bValue = '';
        }

        if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });

      return filteredFabrics;
    },
  });

  // Fetch unique suppliers for filter dropdown
  const { data: suppliers } = useQuery({
    queryKey: ['suppliers-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fabric_library')
        .select('supplier_name')
        .not('supplier_name', 'is', null);

      if (error) throw error;
      const uniqueSuppliers = [...new Set(data?.map(f => f.supplier_name).filter(Boolean))];
      return uniqueSuppliers;
    },
  });

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const clearFilters = () => {
    setFilters({
      fabric_type: '',
      stock_status: '',
      supplier: '',
      search: '',
      season: '',
      garment_type: ''
    });
  };

  const exportFabrics = () => {
    if (!fabrics) return;

    const csvContent = [
      ['Fabric Code', 'Fabric Name', 'Type', 'Supplier', 'Stock (m)', 'Value (AED)', 'Cost/m (AED)', 'Status'],
      ...fabrics.map(fabric => [
        fabric.fabric_code,
        fabric.fabric_name,
        fabric.fabric_type,
        fabric.supplier_name || '',
        fabric.total_stock.toString(),
        fabric.total_value.toString(),
        fabric.cost_per_meter_aed.toString(),
        fabric.stock_status
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `fabrics-inventory-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? 
      <TrendingUp className="h-4 w-4 text-blue-600" /> : 
      <TrendingDown className="h-4 w-4 text-blue-600" />;
  };

  const getStockStatusColor = (status: string) => {
    switch (status) {
      case 'In Stock': return 'text-green-600 bg-green-100';
      case 'Low Stock': return 'text-yellow-600 bg-yellow-100';
      case 'Out of Stock': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStockStatusIcon = (status: string) => {
    switch (status) {
      case 'In Stock': return <Package className="h-4 w-4" />;
      case 'Low Stock': return <AlertTriangle className="h-4 w-4" />;
      case 'Out of Stock': return <TrendingDown className="h-4 w-4" />;
      default: return <Package className="h-4 w-4" />;
    }
  };

  if (fabricsLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-12 bg-gray-200 rounded"></div>
          <div className="space-y-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Materials Management</h1>
          <p className="text-gray-600 mt-1">
            {fabrics?.length || 0} fabrics • {fabrics?.filter(f => f.stock_status === 'In Stock').length || 0} in stock
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={exportFabrics}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </button>
          <button
            onClick={() => refetch()}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </button>
          <Link
            href={`/inventory/materials/new`}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Fabric
          </Link>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white/80 backdrop-blur-sm rounded-lg p-6 border border-gray-200 shadow-sm">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search fabrics by name, code, or supplier..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              />
            </div>
          </div>

          {/* View Toggle */}
          <div className="flex border border-gray-300 rounded-md">
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-2 text-sm font-medium ${
                viewMode === 'list'
                  ? 'bg-gray-100 text-gray-900'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              List
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-2 text-sm font-medium border-l border-gray-300 ${
                viewMode === 'grid'
                  ? 'bg-gray-100 text-gray-900'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Grid
            </button>
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium ${
              showFilters ? 'bg-blue-50 text-blue-700 border-blue-300' : 'bg-white text-gray-700'
            } hover:bg-gray-50`}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </button>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fabric Type</label>
              <select
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={filters.fabric_type}
                onChange={(e) => setFilters({ ...filters, fabric_type: e.target.value })}
              >
                <option value="">All Types</option>
                <option value="Wool">Wool</option>
                <option value="Cotton">Cotton</option>
                <option value="Silk">Silk</option>
                <option value="Linen">Linen</option>
                <option value="Polyester">Polyester</option>
                <option value="Viscose">Viscose</option>
                <option value="Blend">Blend</option>
                <option value="Cashmere">Cashmere</option>
                <option value="Mohair">Mohair</option>
                <option value="Tweed">Tweed</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Stock Status</label>
              <select
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={filters.stock_status}
                onChange={(e) => setFilters({ ...filters, stock_status: e.target.value })}
              >
                <option value="">All Statuses</option>
                <option value="In Stock">In Stock</option>
                <option value="Low Stock">Low Stock</option>
                <option value="Out of Stock">Out of Stock</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Supplier</label>
              <select
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={filters.supplier}
                onChange={(e) => setFilters({ ...filters, supplier: e.target.value })}
              >
                <option value="">All Suppliers</option>
                {suppliers?.map((supplier) => (
                  <option key={supplier} value={supplier}>
                    {supplier}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Season</label>
              <select
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={filters.season}
                onChange={(e) => setFilters({ ...filters, season: e.target.value })}
              >
                <option value="">All Seasons</option>
                <option value="Spring">Spring</option>
                <option value="Summer">Summer</option>
                <option value="Autumn">Autumn</option>
                <option value="Winter">Winter</option>
                <option value="All Season">All Season</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={clearFilters}
                className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Clear Filters
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Materials Table/Grid */}
      <div className="bg-white/80 backdrop-blur-sm rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        {viewMode === 'list' ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <button
                      onClick={() => handleSort('name')}
                      className="flex items-center space-x-1 hover:text-gray-700"
                    >
                      <span>Fabric</span>
                      {getSortIcon('name')}
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <button
                      onClick={() => handleSort('type')}
                      className="flex items-center space-x-1 hover:text-gray-700"
                    >
                      <span>Type & Details</span>
                      {getSortIcon('type')}
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Supplier</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <button
                      onClick={() => handleSort('stock')}
                      className="flex items-center space-x-1 hover:text-gray-700"
                    >
                      <span>Stock</span>
                      {getSortIcon('stock')}
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <button
                      onClick={() => handleSort('cost')}
                      className="flex items-center space-x-1 hover:text-gray-700"
                    >
                      <span>Cost/Meter</span>
                      {getSortIcon('cost')}
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <button
                      onClick={() => handleSort('value')}
                      className="flex items-center space-x-1 hover:text-gray-700"
                    >
                      <span>Total Value</span>
                      {getSortIcon('value')}
                    </button>
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {fabrics?.map((fabric) => (
                  <tr key={fabric.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                            <span className="text-white font-medium text-sm">{fabric.fabric_code.slice(0, 2)}</span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{fabric.fabric_name}</div>
                          <div className="text-sm text-gray-500">{fabric.fabric_code}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{fabric.fabric_type}</div>
                      <div className="text-sm text-gray-500">
                        {fabric.fabric_weight_gsm && `${fabric.fabric_weight_gsm}gsm`}
                        {fabric.fabric_composition && ` • ${fabric.fabric_composition}`}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {fabric.supplier_name || 'No supplier'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStockStatusColor(fabric.stock_status)}`}>
                          {getStockStatusIcon(fabric.stock_status)}
                          <span className="ml-1">{fabric.stock_status}</span>
                        </span>
                      </div>
                      <div className="text-sm text-gray-500 mt-1">{fabric.total_stock.toFixed(1)}m</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatAEDCurrency(fabric.cost_per_meter_aed)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatAEDCurrency(fabric.total_value)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <Link
                          href={`/inventory/materials/${fabric.id}`}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                        <Link
                          href={`/inventory/materials/${fabric.id/edit}`}
                          className="text-green-600 hover:text-green-900"
                        >
                          <Edit className="h-4 w-4" />
                        </Link>
                        <button className="text-purple-600 hover:text-purple-900">
                          <ShoppingCart className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          // Grid View
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-6">
            {fabrics?.map((fabric) => (
              <div key={fabric.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-3">
                  <div className="h-12 w-12 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                    <span className="text-white font-medium">{fabric.fabric_code.slice(0, 2)}</span>
                  </div>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStockStatusColor(fabric.stock_status)}`}>
                    {fabric.stock_status}
                  </span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">{fabric.fabric_name}</h3>
                <p className="text-sm text-gray-600 mb-2">{fabric.fabric_type}</p>
                <div className="space-y-1 text-xs text-gray-500 mb-3">
                  <div>Code: {fabric.fabric_code}</div>
                  <div>Stock: {fabric.total_stock.toFixed(1)}m</div>
                  <div>Value: {formatAEDCurrency(fabric.total_value)}</div>
                  {fabric.supplier_name && <div>Supplier: {fabric.supplier_name}</div>}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-900">
                    {formatAEDCurrency(fabric.cost_per_meter_aed)}/m
                  </span>
                  <div className="flex items-center space-x-2">
                    <Link
                      href={`/inventory/materials/${fabric.id}`}
                      className="text-blue-600 hover:text-blue-700"
                    >
                      <Eye className="h-4 w-4" />
                    </Link>
                    <Link
                      href={`/inventory/materials/${fabric.id/edit}`}
                      className="text-green-600 hover:text-green-700"
                    >
                      <Edit className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {fabrics && fabrics.length === 0 && (
          <div className="text-center py-12">
            <Package className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No fabrics found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {Object.values(filters).some(f => f !== '') 
                ? "Try adjusting your search criteria or filters."
                : "Get started by adding your first fabric to the catalog."}
            </p>
            {!Object.values(filters).some(f => f !== '') && (
              <div className="mt-6">
                <Link
                  href={`/inventory/materials/new`}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Fabric
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}