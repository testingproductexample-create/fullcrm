'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { formatCurrency, formatDate } from '@/lib/utils';
import { ClockIcon, CheckCircleIcon, TruckIcon } from '@heroicons/react/24/outline';

interface RecentOrder {
  id: string;
  customer_id: string;
  status: string;
  total_amount: number;
  created_at: string;
  delivery_date: string;
  customer_name?: string;
}

export function RecentOrders() {
  const { data: orders, isLoading } = useQuery({
    queryKey: ['recent-orders'],
    queryFn: async (): Promise<RecentOrder[]> => {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          customers (
            name
          )
        `)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      
      return data.map(order => ({
        ...order,
        customer_name: order.customers?.name || 'Unknown Customer',
      })) as RecentOrder[];
    },
    refetchInterval: 60000, // Refetch every minute
  });

  if (isLoading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'delivered':
        return <TruckIcon className="h-5 w-5 text-blue-500" />;
      default:
        return <ClockIcon className="h-5 w-5 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'delivered':
        return 'bg-blue-100 text-blue-800';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'pending':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatStatus = (status: string) => {
    return status.replace('_', ' ').toUpperCase();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-gray-700">Recent Orders</h4>
        <Link 
          href={`/orders`} 
          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          View All
        </Link>
      </div>

      <div className="space-y-3">
        {orders?.map((order) => (
          <Link key={order.id} href={`/orders/${order.id}`}>
            <div className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getStatusIcon(order.status)}
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {order.customer_name}
                    </div>
                    <div className="text-xs text-gray-500">
                      Order #{order.id.slice(0, 8)}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900">
                    {formatCurrency(order.total_amount)}
                  </div>
                  <div className={`text-xs px-2 py-1 rounded-full ${getStatusColor(order.status)}`}>
                    {formatStatus(order.status)}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                <span>Created: {formatDate(order.created_at)}</span>
                {order.delivery_date && (
                  <span>Delivery: {formatDate(order.delivery_date)}</span>
                )}
              </div>
            </div>
          </Link>
        ))}
        
        {(!orders || orders.length === 0) && (
          <div className="text-center text-gray-500 py-8">
            No recent orders found
          </div>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-3 pt-3 border-t border-gray-200">
        <div className="text-center">
          <div className="text-lg font-bold text-gray-900">
            {orders?.filter(o => o.status === 'pending').length || 0}
          </div>
          <div className="text-xs text-gray-500">Pending</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-gray-900">
            {orders?.filter(o => o.status === 'in_progress').length || 0}
          </div>
          <div className="text-xs text-gray-500">In Progress</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-gray-900">
            {orders?.filter(o => o.status === 'completed').length || 0}
          </div>
          <div className="text-xs text-gray-500">Completed</div>
        </div>
      </div>
    </div>
  );
}