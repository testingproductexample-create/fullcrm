'use client';

import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, PieChart, Pie, Cell, Legend } from 'recharts';
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
        fill: STATUS_COLORS[status as keyof typeof STATUS_COLORS] || '#6b7280',
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
      {/* Orders by Status - Pie Chart */}
      <div className="h-40">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Orders by Status</h4>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={ordersData?.statusData}
              cx="50%"
              cy="50%"
              innerRadius={40}
              outerRadius={60}
              dataKey="count"
              stroke="#fff"
              strokeWidth={2}
            >
              {ordersData?.statusData?.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value: number, name: string) => [value, 'Orders']}
              contentStyle={{ 
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '12px'
              }}
            />
            <Legend 
              wrapperStyle={{ fontSize: '12px' }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Recent Orders - Bar Chart */}
      <div className="h-32">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Last 7 Days</h4>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={ordersData?.dailyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ff" />
            <XAxis 
              dataKey="date" 
              stroke="#64748b"
              fontSize={10}
            />
            <YAxis 
              stroke="#64748b"
              fontSize={10}
            />
            <Tooltip 
              formatter={(value: number) => [value, 'Orders']}
              contentStyle={{ 
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '12px'
              }}
            />
            <Bar 
              dataKey="orders" 
              fill="#3b82f6"
              radius={[2, 2, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}