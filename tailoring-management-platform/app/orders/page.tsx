'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { 
  PlusIcon, 
  MagnifyingGlassIcon,
  ShoppingBagIcon,
  ClockIcon,
  CheckCircleIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  FunnelIcon,
} from '@heroicons/react/24/outline';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/lib/supabase/client';
import { formatDate, formatCurrency } from '@/lib/utils';
import { 
  Order, 
  ORDER_STATUSES, 
  ORDER_STATUS_LABELS,
  ORDER_TYPES,
  ORDER_TYPE_LABELS,
  PRIORITY_LEVELS,
  PRIORITY_LEVEL_LABELS,
  getOrderStatusColor,
  getPriorityColor
} from '@/types/order';

// Force this page to be dynamic
export const dynamic = 'force-dynamic';

interface OrderWithCustomer extends Order {
  customers?: {
    full_name: string;
    customer_code: string;
  };
}

export default function OrdersPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  
  const { data: orders, isLoading, error } = useQuery({
    queryKey: ['orders', searchQuery, statusFilter, typeFilter, priorityFilter],
    queryFn: async (): Promise<OrderWithCustomer[]> => {
      let query = supabase
        .from('orders')
        .select(`
          id,
          order_number,
          order_type,
          status,
          sub_status,
          priority_level,
          total_amount,
          advance_payment,
          vat_amount,
          final_amount,
          progress_percentage,
          estimated_completion,
          delivery_date,
          created_at,
          updated_at,
          customers!inner (
            full_name,
            customer_code
          )
        `);

      // Apply filters
      if (searchQuery) {
        query = query.or(`order_number.ilike.%${searchQuery}%,customers.full_name.ilike.%${searchQuery}%,customers.customer_code.ilike.%${searchQuery}%`);
      }

      if (statusFilter && statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      if (typeFilter && typeFilter !== 'all') {
        query = query.eq('order_type', typeFilter);
      }

      if (priorityFilter && priorityFilter !== 'all') {
        query = query.eq('priority_level', priorityFilter);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      return data || [];
    },
    refetchInterval: 30000,
  });

  // Get order statistics
  const { data: stats } = useQuery({
    queryKey: ['order-stats'],
    queryFn: async () => {
      const [totalOrders, inProgress, completed, totalRevenue] = await Promise.all([
        supabase.from('orders').select('count', { count: 'exact' }),
        supabase.from('orders').select('count', { count: 'exact' }).eq('status', 'in_progress'),
        supabase.from('orders').select('count', { count: 'exact' }).eq('status', 'completed'),
        supabase.from('orders').select('total_amount').not('total_amount', 'is', null),
      ]);

      const revenue = totalRevenue.data?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;

      return {
        total: totalOrders.count || 0,
        inProgress: inProgress.count || 0,
        completed: completed.count || 0,
        revenue,
      };
    },
    refetchInterval: 60000,
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Order Management</h1>
          <p className="text-gray-600">Manage orders and track production workflow</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/workflow`}>
            <Button variant="outline" className="flex items-center gap-2">
              <ChartBarIcon className="h-4 w-4" />
              Workflow Board
            </Button>
          </Link>
          <Link href={`/orders/new`}>
            <Button className="flex items-center gap-2">
              <PlusIcon className="h-4 w-4" />
              New Order
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <Card className="glass">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="text-2xl font-bold text-blue-600">{stats?.total || 0}</div>
              <ShoppingBagIcon className="h-6 w-6 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="glass">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">In Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="text-2xl font-bold text-yellow-600">{stats?.inProgress || 0}</div>
              <ClockIcon className="h-6 w-6 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="glass">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="text-2xl font-bold text-green-600">{stats?.completed || 0}</div>
              <CheckCircleIcon className="h-6 w-6 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="text-2xl font-bold text-emerald-600">{formatCurrency(stats?.revenue || 0)}</div>
              <CurrencyDollarIcon className="h-6 w-6 text-emerald-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card className="glass">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search orders by number, customer name, or customer code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <FunnelIcon className="h-4 w-4 text-gray-400" />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  {Object.entries(ORDER_STATUS_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {Object.entries(ORDER_TYPE_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priority</SelectItem>
                  {Object.entries(PRIORITY_LEVEL_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Orders List */}
      <Card className="glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingBagIcon className="h-5 w-5" />
            Order List
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner size="lg" />
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-600">Error loading orders</p>
              <Button variant="outline" onClick={() => window.location.reload()}>
                Try Again
              </Button>
            </div>
          ) : orders && orders.length > 0 ? (
            <div className="space-y-4">
              {orders.map((order) => (
                <Link key={order.id} href={`/orders/${order.id}`}>
                  <div className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-3">
                        {/* Header Row */}
                        <div className="flex items-center gap-3">
                          <h3 className="text-lg font-semibold text-gray-900">{order.order_number}</h3>
                          <Badge className={getOrderStatusColor(order.status || '')}>
                            {ORDER_STATUS_LABELS[order.status as keyof typeof ORDER_STATUS_LABELS] || order.status}
                          </Badge>
                          {order.priority_level && (
                            <Badge className={getPriorityColor(order.priority_level)}>
                              {PRIORITY_LEVEL_LABELS[order.priority_level as keyof typeof PRIORITY_LEVEL_LABELS]}
                            </Badge>
                          )}
                        </div>

                        {/* Customer and Order Info */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 text-sm text-gray-600">
                          <div className="flex flex-col">
                            <span className="font-medium text-gray-700">Customer</span>
                            <span>{order.customers?.full_name}</span>
                            <span className="text-xs text-gray-500">{order.customers?.customer_code}</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="font-medium text-gray-700">Order Type</span>
                            <span>{ORDER_TYPE_LABELS[order.order_type as keyof typeof ORDER_TYPE_LABELS] || order.order_type}</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="font-medium text-gray-700">Delivery Date</span>
                            <span>{order.delivery_date ? formatDate(order.delivery_date) : 'Not set'}</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="font-medium text-gray-700">Created</span>
                            <span>{formatDate(order.created_at || '')}</span>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        {order.progress_percentage !== null && order.progress_percentage !== undefined && (
                          <div className="w-full">
                            <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                              <span>Progress</span>
                              <span>{order.progress_percentage}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${order.progress_percentage}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Amount Section */}
                      <div className="text-right space-y-1 ml-4">
                        <div className="text-lg font-semibold text-gray-900">
                          {formatCurrency(order.final_amount || order.total_amount || 0)}
                        </div>
                        {order.advance_payment && (
                          <div className="text-sm text-gray-600">
                            Advance: {formatCurrency(order.advance_payment)}
                          </div>
                        )}
                        {order.vat_amount && (
                          <div className="text-xs text-gray-500">
                            VAT: {formatCurrency(order.vat_amount)}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <ShoppingBagIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No orders found</h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by creating your first order.
              </p>
              <div className="mt-6">
                <Link href={`/orders/new`}>
                  <Button>
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Create Order
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}