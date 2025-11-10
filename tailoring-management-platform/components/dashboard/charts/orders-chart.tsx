'use client';

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

const STATUS_COLORS = {
  'pending': '#ef4444',
  'in_progress': '#f59e0b',
  'completed': '#10b981',
  'cancelled': '#6b7280',
  'delivered': '#3b82f6',
};

export function OrdersChart() {
  const { data: ordersData, isLoading } = useQuery({
    queryKey: ['orders-chart'],
    queryFn: async () => {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      // Get orders by status
      const { data: statusData, error: statusError } = await supabase
        .from('orders')
        .select('status')
        .gte('created_at', thirtyDaysAgo.toISOString());

      if (statusError) throw statusError;

      // Get recent orders by date
      const { data: recentData, error: recentError } = await supabase
        .from('orders')
        .select('created_at')
        .gte('created_at', thirtyDaysAgo.toISOString())
        .order('created_at');

      if (recentError) throw recentError;

      // Process status data
      const statusCounts: { [key: string]: number } = {};
      statusData?.forEach((order) => {
        const status = order.status || 'pending';
        statusCounts[status] = (statusCounts[status] || 0) + 1;
      });

      const statusChartData = Object.entries(statusCounts).map(([status, count]) => ({
        status: status.replace('_', ' ').toUpperCase(),
        count,
        color: STATUS_COLORS[status as keyof typeof STATUS_COLORS] || '#6b7280',
      }));

      // Process date data (last 7 days)
      const dateData: { [key: string]: number } = {};
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - i);
        return date.toISOString().split('T')[0];
      }).reverse();

      last7Days.forEach(date => {
        dateData[date] = 0;
      });

      recentData?.forEach((order) => {
        const date = order.created_at.split('T')[0];
        if (dateData.hasOwnProperty(date)) {
          dateData[date] += 1;
        }
      });

      const dailyChartData = Object.entries(dateData).map(([date, count]) => ({
        date: new Date(date).toLocaleDateString('en-AE', { weekday: 'short' }),
        orders: count,
      }));

      return {
        statusData: statusChartData,
        dailyData: dailyChartData,
      };
    },
    refetchInterval: 60000, // Refetch every minute
  });

  if (isLoading) {
    return (
      <div className="h-80 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Orders by Status */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-3">Orders by Status</h4>
        <div className="space-y-2">
          {ordersData?.statusData?.map((item, index) => (
            <div key={index} className="flex items-center justify-between p-2 rounded-lg bg-gray-50">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-sm font-medium text-gray-700">{item.status}</span>
              </div>
              <span className="text-sm font-bold text-gray-900">{item.count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Last 7 Days */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-3">Last 7 Days</h4>
        <div className="space-y-2">
          {ordersData?.dailyData?.map((item, index) => (
            <div key={index} className="flex items-center justify-between p-2 rounded-lg bg-gray-50">
              <span className="text-sm font-medium text-gray-700">{item.date}</span>
              <span className="text-sm font-bold text-blue-600">{item.orders} orders</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
