'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { 
  Search, 
  Filter, 
  Plus, 
  Eye, 
  Edit, 
  Download,
  RefreshCw,
  Package,
  Truck,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Calendar,
  DollarSign,
  FileText,
  Building,
  User,
  Phone,
  Mail,
  MapPin,
  TrendingUp,
  BarChart,
  Archive,
  Send,
  CheckSquare,
  X,
  MoreHorizontal,
  ArrowUpDown,
  ChevronDown,
  ExternalLink
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { 
  PurchaseOrder,
  PurchaseOrderItem,
  Supplier,
  FabricLibrary
} from '@/types/inventory';
import { 
  formatAEDCurrency, 
  formatDate,
  getStatusColor,
  getUrgencyColor
} from '@/types/inventory';

interface PurchaseOrderWithDetails extends PurchaseOrder {
  supplier?: Supplier;
  items?: PurchaseOrderItem[];
  items_count?: number;
  total_items_ordered?: number;
  total_items_received?: number;
}

interface FilterOptions {
  status: string;
  urgency: string;
  supplier: string;
  date_range: string;
  amount_range: string;
  search: string;
}

interface SortOption {
  field: string;
  direction: 'asc' | 'desc';
}

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'Draft', label: 'Draft' },
  { value: 'Sent', label: 'Sent to Supplier' },
  { value: 'Confirmed', label: 'Confirmed' },
  { value: 'In Production', label: 'In Production' },
  { value: 'Shipped', label: 'Shipped' },
  { value: 'Delivered', label: 'Delivered' },
  { value: 'Partial', label: 'Partially Received' },
  { value: 'Cancelled', label: 'Cancelled' }
];

const URGENCY_OPTIONS = [
  { value: '', label: 'All Priorities' },
  { value: 'Low', label: 'Low Priority' },
  { value: 'Normal', label: 'Normal Priority' },
  { value: 'High', label: 'High Priority' },
  { value: 'Urgent', label: 'Urgent' }
];

const DATE_RANGES = [
  { value: '', label: 'All Time' },
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
  { value: 'quarter', label: 'This Quarter' }
];

const AMOUNT_RANGES = [
  { value: '', label: 'Any Amount' },
  { value: '0-1000', label: 'Under AED 1,000' },
  { value: '1000-5000', label: 'AED 1,000 - 5,000' },
  { value: '5000-20000', label: 'AED 5,000 - 20,000' },
  { value: '20000+', label: 'Over AED 20,000' }
];

export default function PurchaseOrdersPage() {
  const queryClient = useQueryClient();
  
  const [filters, setFilters] = useState<FilterOptions>({
    status: '',
    urgency: '',
    supplier: '',
    date_range: '',
    amount_range: '',
    search: ''
  });
  
  const [sortBy, setSortBy] = useState<SortOption>({
    field: 'created_at',
    direction: 'desc'
  });
  
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch purchase orders with advanced filtering
  const { data: orders, isLoading, error } = useQuery({
    queryKey: ['purchase-orders', filters, sortBy],
    queryFn: async () => {
      let query = supabase
        .from('purchase_orders')
        .select(`
          *,
          supplier:suppliers(*),
          items:purchase_order_items(
            count
          )
        `);

      // Apply filters
      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      if (filters.urgency) {
        query = query.eq('urgency_level', filters.urgency);
      }

      if (filters.supplier) {
        query = query.eq('supplier_id', filters.supplier);
      }

      if (filters.search) {
        query = query.or(`po_number.ilike.%${filters.search}%,notes.ilike.%${filters.search}%`);
      }

      // Date range filtering
      if (filters.date_range) {
        const now = new Date();
        let startDate = new Date();
        
        switch (filters.date_range) {
          case 'today':
            startDate.setHours(0, 0, 0, 0);
            break;
          case 'week':
            startDate.setDate(now.getDate() - 7);
            break;
          case 'month':
            startDate.setMonth(now.getMonth() - 1);
            break;
          case 'quarter':
            startDate.setMonth(now.getMonth() - 3);
            break;
        }
        
        query = query.gte('created_at', startDate.toISOString());
      }

      // Amount range filtering
      if (filters.amount_range) {
        const [min, max] = filters.amount_range.split('-').map(v => v.replace('+', ''));
        if (min) query = query.gte('total_amount_aed', parseFloat(min));
        if (max) query = query.lte('total_amount_aed', parseFloat(max));
      }

      // Apply sorting
      query = query.order(sortBy.field, { ascending: sortBy.direction === 'asc' });

      const { data, error } = await query;
      
      if (error) throw error;
      
      // Calculate additional metrics for each order
      const ordersWithMetrics = await Promise.all(
        (data || []).map(async (order) => {
          const { data: items } = await supabase
            .from('purchase_order_items')
            .select('*')
            .eq('purchase_order_id', order.id);
          
          const items_count = items?.length || 0;
          const total_items_ordered = items?.reduce((sum, item) => sum + item.ordered_quantity_meters, 0) || 0;
          const total_items_received = items?.reduce((sum, item) => sum + (item.received_quantity_meters || 0), 0) || 0;
          
          return {
            ...order,
            items,
            items_count,
            total_items_ordered,
            total_items_received
          };
        })
      );
      
      return ordersWithMetrics as PurchaseOrderWithDetails[];
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Fetch suppliers for filter dropdown
  const { data: suppliers } = useQuery({
    queryKey: ['suppliers-dropdown'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('suppliers')
        .select('id, supplier_name, supplier_code')
        .order('supplier_name');
      
      if (error) throw error;
      return data as Supplier[];
    }
  });

  // Status update mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ orderId, newStatus }: { orderId: string; newStatus: string }) => {
      const { error } = await supabase
        .from('purchase_orders')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
    }
  });

  // Bulk actions mutation
  const bulkActionMutation = useMutation({
    mutationFn: async ({ orderIds, action }: { orderIds: string[]; action: string }) => {
      let updateData: any = { updated_at: new Date().toISOString() };
      
      switch (action) {
        case 'mark-sent':
          updateData.status = 'Sent';
          break;
        case 'mark-confirmed':
          updateData.status = 'Confirmed';
          break;
        case 'cancel':
          updateData.status = 'Cancelled';
          break;
      }
      
      const { error } = await supabase
        .from('purchase_orders')
        .update(updateData)
        .in('id', orderIds);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      setSelectedOrders([]);
    }
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
    setTimeout(() => setRefreshing(false), 1000);
  };

  const handleFilterChange = (key: keyof FilterOptions, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleSort = (field: string) => {
    setSortBy(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleSelectOrder = (orderId: string) => {
    setSelectedOrders(prev => 
      prev.includes(orderId) 
        ? prev.filter(id => id !== orderId)
        : [...prev, orderId]
    );
  };

  const handleSelectAll = () => {
    if (selectedOrders.length === (orders?.length || 0)) {
      setSelectedOrders([]);
    } else {
      setSelectedOrders(orders?.map(order => order.id) || []);
    }
  };

  const getStatusBadge = (status: string) => {
    const { bgColor, textColor, borderColor } = getStatusColor(status);
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${bgColor} ${textColor} ${borderColor}`}>
        {status}
      </span>
    );
  };

  const getUrgencyBadge = (urgency?: string) => {
    if (!urgency) return null;
    const { bgColor, textColor } = getUrgencyColor(urgency);
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${bgColor} ${textColor}`}>
        {urgency}
      </span>
    );
  };

  const getProgressPercentage = (received: number, ordered: number) => {
    if (ordered === 0) return 0;
    return Math.round((received / ordered) * 100);
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-100/40 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50/80 backdrop-blur-sm border border-red-200 rounded-xl p-6">
            <div className="flex items-center gap-3 text-red-800">
              <AlertTriangle className="h-5 w-5" />
              <span>Error loading purchase orders: {error.message}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-100/40">
      {/* Header */}
      <div className="border-b border-white/20 bg-white/10 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-800 to-blue-700 bg-clip-text text-transparent">
                Purchase Orders
              </h1>
              <p className="text-slate-600 mt-1">
                Manage procurement and supplier orders
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`px-4 py-2 rounded-xl border transition-all duration-200 ${
                  showFilters 
                    ? 'bg-blue-500 text-white border-blue-500 shadow-lg' 
                    : 'bg-white/70 backdrop-blur-sm border-white/30 text-slate-700 hover:bg-white/90'
                }`}
              >
                <Filter className="h-4 w-4 inline mr-2" />
                Filters
              </button>
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="px-4 py-2 rounded-xl bg-white/70 backdrop-blur-sm border border-white/30 text-slate-700 hover:bg-white/90 transition-all duration-200 disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 inline mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              <Link
                href={`/inventory/orders/new`}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-200 hover:from-blue-700 hover:to-indigo-700"
              >
                <Plus className="h-4 w-4 inline mr-2" />
                New PO
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Filters Panel */}
        {showFilters && (
          <div className="bg-white/70 backdrop-blur-sm border border-white/30 rounded-xl p-6 mb-6 shadow-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-white/30 bg-white/50 backdrop-blur-sm text-slate-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {STATUS_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Urgency Filter */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Priority</label>
                <select
                  value={filters.urgency}
                  onChange={(e) => handleFilterChange('urgency', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-white/30 bg-white/50 backdrop-blur-sm text-slate-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {URGENCY_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Supplier Filter */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Supplier</label>
                <select
                  value={filters.supplier}
                  onChange={(e) => handleFilterChange('supplier', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-white/30 bg-white/50 backdrop-blur-sm text-slate-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Suppliers</option>
                  {suppliers?.map(supplier => (
                    <option key={supplier.id} value={supplier.id}>
                      {supplier.supplier_name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date Range Filter */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Date Range</label>
                <select
                  value={filters.date_range}
                  onChange={(e) => handleFilterChange('date_range', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-white/30 bg-white/50 backdrop-blur-sm text-slate-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {DATE_RANGES.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Amount Range Filter */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Amount Range</label>
                <select
                  value={filters.amount_range}
                  onChange={(e) => handleFilterChange('amount_range', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-white/30 bg-white/50 backdrop-blur-sm text-slate-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {AMOUNT_RANGES.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Search */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={filters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                    placeholder="PO number, notes..."
                    className="w-full pl-10 pr-3 py-2 rounded-lg border border-white/30 bg-white/50 backdrop-blur-sm text-slate-700 placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bulk Actions */}
        {selectedOrders.length > 0 && (
          <div className="bg-blue-50/70 backdrop-blur-sm border border-blue-200 rounded-xl p-4 mb-6">
            <div className="flex items-center justify-between">
              <span className="text-blue-800 font-medium">
                {selectedOrders.length} order(s) selected
              </span>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => bulkActionMutation.mutate({ orderIds: selectedOrders, action: 'mark-sent' })}
                  className="px-3 py-1.5 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                >
                  <Send className="h-4 w-4 inline mr-1" />
                  Mark as Sent
                </button>
                <button
                  onClick={() => bulkActionMutation.mutate({ orderIds: selectedOrders, action: 'mark-confirmed' })}
                  className="px-3 py-1.5 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                >
                  <CheckCircle className="h-4 w-4 inline mr-1" />
                  Mark as Confirmed
                </button>
                <button
                  onClick={() => bulkActionMutation.mutate({ orderIds: selectedOrders, action: 'cancel' })}
                  className="px-3 py-1.5 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                >
                  <XCircle className="h-4 w-4 inline mr-1" />
                  Cancel Orders
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white/70 backdrop-blur-sm border border-white/30 rounded-xl p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-xl">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">
                  {orders?.length || 0}
                </p>
                <p className="text-sm text-slate-600">Total Orders</p>
              </div>
            </div>
          </div>

          <div className="bg-white/70 backdrop-blur-sm border border-white/30 rounded-xl p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-xl">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">
                  {orders?.filter(o => o.status === 'Delivered').length || 0}
                </p>
                <p className="text-sm text-slate-600">Completed</p>
              </div>
            </div>
          </div>

          <div className="bg-white/70 backdrop-blur-sm border border-white/30 rounded-xl p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-orange-100 rounded-xl">
                <Clock className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">
                  {orders?.filter(o => ['Sent', 'Confirmed', 'In Production', 'Shipped'].includes(o.status)).length || 0}
                </p>
                <p className="text-sm text-slate-600">Pending</p>
              </div>
            </div>
          </div>

          <div className="bg-white/70 backdrop-blur-sm border border-white/30 rounded-xl p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 rounded-xl">
                <DollarSign className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">
                  {formatAEDCurrency(orders?.reduce((sum, order) => sum + order.total_amount_aed, 0) || 0)}
                </p>
                <p className="text-sm text-slate-600">Total Value</p>
              </div>
            </div>
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white/70 backdrop-blur-sm border border-white/30 rounded-xl shadow-lg overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-slate-600 mt-2">Loading purchase orders...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50/50 border-b border-white/20">
                  <tr>
                    <th className="px-6 py-4 text-left">
                      <input
                        type="checkbox"
                        checked={selectedOrders.length === (orders?.length || 0) && orders && orders.length > 0}
                        onChange={handleSelectAll}
                        className="rounded border-slate-300"
                      />
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-slate-700">
                      <button onClick={() => handleSort('po_number')} className="flex items-center gap-1">
                        PO Number
                        <ArrowUpDown className="h-3 w-3" />
                      </button>
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-slate-700">
                      Supplier
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-slate-700">
                      <button onClick={() => handleSort('status')} className="flex items-center gap-1">
                        Status
                        <ArrowUpDown className="h-3 w-3" />
                      </button>
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-slate-700">
                      Priority
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-slate-700">
                      <button onClick={() => handleSort('order_date')} className="flex items-center gap-1">
                        Order Date
                        <ArrowUpDown className="h-3 w-3" />
                      </button>
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-slate-700">
                      Expected Delivery
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-slate-700">
                      <button onClick={() => handleSort('total_amount_aed')} className="flex items-center gap-1">
                        Amount
                        <ArrowUpDown className="h-3 w-3" />
                      </button>
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-slate-700">
                      Progress
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-slate-700">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/20">
                  {orders?.map((order) => {
                    const progressPercent = getProgressPercentage(
                      order.total_items_received || 0,
                      order.total_items_ordered || 0
                    );
                    
                    return (
                      <tr key={order.id} className="hover:bg-white/50 transition-colors">
                        <td className="px-6 py-4">
                          <input
                            type="checkbox"
                            checked={selectedOrders.includes(order.id)}
                            onChange={() => handleSelectOrder(order.id)}
                            className="rounded border-slate-300"
                          />
                        </td>
                        
                        <td className="px-6 py-4">
                          <div className="font-medium text-slate-900">
                            {order.po_number}
                          </div>
                        </td>
                        
                        <td className="px-6 py-4">
                          <div>
                            <div className="font-medium text-slate-900">
                              {order.supplier?.supplier_name || 'Unknown Supplier'}
                            </div>
                            <div className="text-sm text-slate-500">
                              {order.supplier?.supplier_code}
                            </div>
                          </div>
                        </td>
                        
                        <td className="px-6 py-4">
                          {getStatusBadge(order.status)}
                        </td>
                        
                        <td className="px-6 py-4">
                          {getUrgencyBadge(order.urgency_level)}
                        </td>
                        
                        <td className="px-6 py-4">
                          <div className="text-sm text-slate-900">
                            {formatDate(order.order_date)}
                          </div>
                        </td>
                        
                        <td className="px-6 py-4">
                          {order.expected_delivery_date && (
                            <div className="text-sm text-slate-900">
                              {formatDate(order.expected_delivery_date)}
                            </div>
                          )}
                        </td>
                        
                        <td className="px-6 py-4">
                          <div className="font-medium text-slate-900">
                            {formatAEDCurrency(order.total_amount_aed)}
                          </div>
                          <div className="text-sm text-slate-500">
                            {order.items_count || 0} items
                          </div>
                        </td>
                        
                        <td className="px-6 py-4">
                          <div className="w-full">
                            <div className="flex items-center justify-between text-xs text-slate-600 mb-1">
                              <span>Received</span>
                              <span>{progressPercent}%</span>
                            </div>
                            <div className="w-full bg-slate-200 rounded-full h-2">
                              <div 
                                className="bg-green-500 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${progressPercent}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Link
                              href={`/inventory/orders/${order.id}`}
                              className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            >
                              <Eye className="h-4 w-4" />
                            </Link>
                            <Link
                              href={`/inventory/orders/${order.id/edit}`}
                              className="p-2 text-slate-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            >
                              <Edit className="h-4 w-4" />
                            </Link>
                            <button className="p-2 text-slate-600 hover:text-slate-800 hover:bg-slate-50 rounded-lg transition-colors">
                              <MoreHorizontal className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              
              {orders && orders.length === 0 && (
                <div className="p-8 text-center text-slate-500">
                  <Package className="h-12 w-12 mx-auto mb-4 text-slate-400" />
                  <p className="text-lg font-medium">No purchase orders found</p>
                  <p className="text-sm">Create your first purchase order to get started.</p>
                  <Link
                    href={`/inventory/orders/new`}
                    className="mt-4 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Purchase Order
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}