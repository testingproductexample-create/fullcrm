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
  Phone,
  Mail,
  MapPin,
  Star,
  TrendingUp,
  TrendingDown,
  Package,
  Clock,
  CheckCircle,
  AlertTriangle,
  Download,
  RefreshCw,
  Building,
  Globe,
  CreditCard,
  FileText
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { 
  Supplier
} from '@/types/inventory';
import { 
  formatAEDCurrency, 
  getSupplierRatingColor 
} from '@/types/inventory';

interface SupplierWithMetrics extends Supplier {
  total_purchase_value?: number;
  recent_order_count?: number;
  last_order_date?: string;
  on_time_delivery_rate?: number;
}

interface FilterOptions {
  supplier_type: string;
  country: string;
  partnership_level: string;
  verification_status: string;
  search: string;
}

type SortField = 'name' | 'rating' | 'orders' | 'performance' | 'value' | 'updated';
type SortDirection = 'asc' | 'desc';

export default function SuppliersManagementPage() {
  const [filters, setFilters] = useState<FilterOptions>({
    supplier_type: '',
    country: '',
    partnership_level: '',
    verification_status: '',
    search: ''
  });
  
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [showFilters, setShowFilters] = useState(false);

  const queryClient = useQueryClient();

  // Fetch suppliers with metrics
  const { data: suppliers, isLoading: suppliersLoading, refetch } = useQuery({
    queryKey: ['suppliers-with-metrics', filters, sortField, sortDirection],
    queryFn: async (): Promise<SupplierWithMetrics[]> => {
      let query = supabase
        .from('suppliers')
        .select('*');

      // Apply filters
      if (filters.supplier_type) {
        query = query.eq('supplier_type', filters.supplier_type);
      }
      if (filters.country) {
        query = query.eq('country', filters.country);
      }
      if (filters.partnership_level) {
        query = query.eq('partnership_level', filters.partnership_level);
      }
      if (filters.verification_status) {
        query = query.eq('verification_status', filters.verification_status);
      }
      if (filters.search) {
        query = query.or(`supplier_name.ilike.%${filters.search}%,business_name.ilike.%${filters.search}%,supplier_code.ilike.%${filters.search}%`);
      }

      const { data, error } = await query.order('supplier_name', { ascending: true });
      if (error) throw error;

      // Enhance with metrics (in a real app, this would be more sophisticated)
      const enhancedSuppliers = (data || []).map(supplier => ({
        ...supplier,
        total_purchase_value: Math.random() * 100000, // Mock data
        recent_order_count: Math.floor(Math.random() * 20),
        last_order_date: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString(),
        on_time_delivery_rate: supplier.successful_deliveries && supplier.total_orders ? 
          (supplier.successful_deliveries / supplier.total_orders) : Math.random()
      }));

      // Apply sorting
      enhancedSuppliers.sort((a, b) => {
        let aValue: any;
        let bValue: any;

        switch (sortField) {
          case 'name':
            aValue = a.supplier_name.toLowerCase();
            bValue = b.supplier_name.toLowerCase();
            break;
          case 'rating':
            aValue = a.overall_rating || 0;
            bValue = b.overall_rating || 0;
            break;
          case 'orders':
            aValue = a.total_orders || 0;
            bValue = b.total_orders || 0;
            break;
          case 'performance':
            aValue = a.on_time_delivery_rate || 0;
            bValue = b.on_time_delivery_rate || 0;
            break;
          case 'value':
            aValue = a.total_purchase_value || 0;
            bValue = b.total_purchase_value || 0;
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

      return enhancedSuppliers;
    },
  });

  // Fetch unique countries for filter dropdown
  const { data: countries } = useQuery({
    queryKey: ['supplier-countries'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('suppliers')
        .select('country')
        .not('country', 'is', null);

      if (error) throw error;
      const uniqueCountries = [...new Set(data?.map(s => s.country).filter(Boolean))];
      return uniqueCountries.sort();
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
      supplier_type: '',
      country: '',
      partnership_level: '',
      verification_status: '',
      search: ''
    });
  };

  const exportSuppliers = () => {
    if (!suppliers) return;

    const csvContent = [
      ['Code', 'Name', 'Type', 'Country', 'Contact', 'Phone', 'Email', 'Rating', 'Orders', 'Performance'],
      ...suppliers.map(supplier => [
        supplier.supplier_code,
        supplier.supplier_name,
        supplier.supplier_type || '',
        supplier.country || '',
        supplier.primary_contact_name || '',
        supplier.primary_contact_phone || '',
        supplier.primary_contact_email || '',
        (supplier.overall_rating || 0).toString(),
        (supplier.total_orders || 0).toString(),
        ((supplier.on_time_delivery_rate || 0) * 100).toFixed(1) + '%'
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `suppliers-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? 
      <TrendingUp className="h-4 w-4 text-blue-600" /> : 
      <TrendingDown className="h-4 w-4 text-blue-600" />;
  };

  const getVerificationStatusColor = (status: string) => {
    switch (status) {
      case 'Verified': return 'text-green-600 bg-green-100';
      case 'Pending': return 'text-yellow-600 bg-yellow-100';
      case 'Unverified': return 'text-gray-600 bg-gray-100';
      case 'Rejected': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getPartnershipLevelColor = (level: string) => {
    switch (level) {
      case 'Strategic': return 'text-purple-600 bg-purple-100';
      case 'Preferred': return 'text-blue-600 bg-blue-100';
      case 'Standard': return 'text-gray-600 bg-gray-100';
      case 'Trial': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (suppliersLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-12 bg-gray-200 rounded"></div>
          <div className="space-y-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
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
          <h1 className="text-3xl font-bold text-gray-900">Suppliers Management</h1>
          <p className="text-gray-600 mt-1">
            {suppliers?.length || 0} suppliers • {suppliers?.filter(s => s.is_active).length || 0} active
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={exportSuppliers}
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
            href="/inventory/suppliers/new"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Supplier
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
                placeholder="Search suppliers by name, business name, or code..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              />
            </div>
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Supplier Type</label>
              <select
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={filters.supplier_type}
                onChange={(e) => setFilters({ ...filters, supplier_type: e.target.value })}
              >
                <option value="">All Types</option>
                <option value="Fabric Mill">Fabric Mill</option>
                <option value="Wholesaler">Wholesaler</option>
                <option value="Importer">Importer</option>
                <option value="Local Dealer">Local Dealer</option>
                <option value="International">International</option>
                <option value="Boutique">Boutique</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
              <select
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={filters.country}
                onChange={(e) => setFilters({ ...filters, country: e.target.value })}
              >
                <option value="">All Countries</option>
                {countries?.map((country) => (
                  <option key={country} value={country}>
                    {country}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Partnership Level</label>
              <select
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={filters.partnership_level}
                onChange={(e) => setFilters({ ...filters, partnership_level: e.target.value })}
              >
                <option value="">All Levels</option>
                <option value="Strategic">Strategic</option>
                <option value="Preferred">Preferred</option>
                <option value="Standard">Standard</option>
                <option value="Trial">Trial</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Verification Status</label>
              <select
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={filters.verification_status}
                onChange={(e) => setFilters({ ...filters, verification_status: e.target.value })}
              >
                <option value="">All Statuses</option>
                <option value="Verified">Verified</option>
                <option value="Pending">Pending</option>
                <option value="Unverified">Unverified</option>
                <option value="Rejected">Rejected</option>
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

      {/* Suppliers Table */}
      <div className="bg-white/80 backdrop-blur-sm rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button
                    onClick={() => handleSort('name')}
                    className="flex items-center space-x-1 hover:text-gray-700"
                  >
                    <span>Supplier</span>
                    {getSortIcon('name')}
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact Info</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button
                    onClick={() => handleSort('rating')}
                    className="flex items-center space-x-1 hover:text-gray-700"
                  >
                    <span>Performance</span>
                    {getSortIcon('rating')}
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button
                    onClick={() => handleSort('orders')}
                    className="flex items-center space-x-1 hover:text-gray-700"
                  >
                    <span>Orders & Value</span>
                    {getSortIcon('orders')}
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {suppliers?.map((supplier) => (
                <tr key={supplier.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-12 w-12">
                        <div className="h-12 w-12 rounded-lg bg-gradient-to-r from-green-500 to-blue-600 flex items-center justify-center">
                          <Building className="h-6 w-6 text-white" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{supplier.supplier_name}</div>
                        <div className="text-sm text-gray-500">{supplier.supplier_code}</div>
                        <div className="flex items-center mt-1">
                          {supplier.supplier_type && (
                            <span className="text-xs text-blue-600">{supplier.supplier_type}</span>
                          )}
                          {supplier.country && (
                            <span className="text-xs text-gray-500 ml-2 flex items-center">
                              <Globe className="h-3 w-3 mr-1" />
                              {supplier.country}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {supplier.primary_contact_name || 'No contact'}
                    </div>
                    <div className="text-sm text-gray-500 space-y-1">
                      {supplier.primary_contact_email && (
                        <div className="flex items-center">
                          <Mail className="h-3 w-3 mr-1" />
                          <span className="truncate max-w-32">{supplier.primary_contact_email}</span>
                        </div>
                      )}
                      {supplier.primary_contact_phone && (
                        <div className="flex items-center">
                          <Phone className="h-3 w-3 mr-1" />
                          <span>{supplier.primary_contact_phone}</span>
                        </div>
                      )}
                    </div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`h-3 w-3 ${
                              i < Math.floor(supplier.overall_rating || 0) 
                                ? 'text-yellow-400 fill-current' 
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="ml-2 text-sm text-gray-600">
                        {(supplier.overall_rating || 0).toFixed(1)}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {supplier.on_time_delivery_rate && (
                        <div className="flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          {(supplier.on_time_delivery_rate * 100).toFixed(0)}% on-time
                        </div>
                      )}
                    </div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {supplier.total_orders || 0} orders
                    </div>
                    <div className="text-sm text-gray-500">
                      {formatAEDCurrency(supplier.total_purchase_value || 0)} total
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {supplier.last_order_date && (
                        <>Last: {new Date(supplier.last_order_date).toLocaleDateString()}</>
                      )}
                    </div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="space-y-1">
                      {supplier.verification_status && (
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getVerificationStatusColor(supplier.verification_status)}`}>
                          {supplier.verification_status}
                        </span>
                      )}
                      {supplier.partnership_level && (
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPartnershipLevelColor(supplier.partnership_level)}`}>
                          {supplier.partnership_level}
                        </span>
                      )}
                      {!supplier.is_active && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-red-600 bg-red-100">
                          Inactive
                        </span>
                      )}
                    </div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <Link
                        href={`/inventory/suppliers/${supplier.id}`}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Eye className="h-4 w-4" />
                      </Link>
                      <Link
                        href={`/inventory/suppliers/${supplier.id}/edit`}
                        className="text-green-600 hover:text-green-900"
                      >
                        <Edit className="h-4 w-4" />
                      </Link>
                      <button className="text-purple-600 hover:text-purple-900">
                        <FileText className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {suppliers && suppliers.length === 0 && (
          <div className="text-center py-12">
            <Building className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No suppliers found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {Object.values(filters).some(f => f !== '') 
                ? "Try adjusting your search criteria or filters."
                : "Get started by adding your first supplier."}
            </p>
            {!Object.values(filters).some(f => f !== '') && (
              <div className="mt-6">
                <Link
                  href="/inventory/suppliers/new"
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Supplier
                </Link>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Quick Stats */}
      {suppliers && suppliers.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white/80 backdrop-blur-sm rounded-lg p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-green-900">Verified Suppliers</p>
                <p className="text-2xl font-bold text-green-700">
                  {suppliers.filter(s => s.verification_status === 'Verified').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-lg p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center">
              <Star className="h-8 w-8 text-yellow-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-yellow-900">Avg Rating</p>
                <p className="text-2xl font-bold text-yellow-700">
                  {(suppliers.reduce((sum, s) => sum + (s.overall_rating || 0), 0) / suppliers.length).toFixed(1)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-lg p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center">
              <Package className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-blue-900">Active Orders</p>
                <p className="text-2xl font-bold text-blue-700">
                  {suppliers.reduce((sum, s) => sum + (s.recent_order_count || 0), 0)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-lg p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center">
              <CreditCard className="h-8 w-8 text-purple-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-purple-900">Total Value</p>
                <p className="text-2xl font-bold text-purple-700">
                  {formatAEDCurrency(suppliers.reduce((sum, s) => sum + (s.total_purchase_value || 0), 0))}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}