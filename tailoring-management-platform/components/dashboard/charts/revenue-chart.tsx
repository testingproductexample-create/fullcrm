'use client';

import { useQuery } from '@tanstack/react-query';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from 'recharts';
import { supabase } from '@/lib/supabase';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { formatCurrency } from '@/lib/utils';

export function RevenueChart() {
  const { data: revenueData, isLoading } = useQuery({
    queryKey: ['revenue-chart'],
    queryFn: async () => {
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      
      const { data, error } = await supabase
        .from('revenue_tracking')
        .select('date, amount, source')
        .gte('date', sixMonthsAgo.toISOString())
        .order('date');

      if (error) throw error;

      // Group data by month
      const monthlyData: { [key: string]: number } = {};
      data?.forEach((item) => {
        const month = new Date(item.date).toLocaleDateString('en-AE', { 
          year: 'numeric', 
          month: 'short' 
        });
        monthlyData[month] = (monthlyData[month] || 0) + (item.amount || 0);
      });

      return Object.entries(monthlyData).map(([month, amount]) => ({
        month,
        revenue: amount,
      }));
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

  const formatTooltip = (value: number) => [formatCurrency(value), 'Revenue'];

  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={revenueData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ff" />
          <XAxis 
            dataKey="month" 
            stroke="#64748b"
            fontSize={12}
          />
          <YAxis 
            stroke="#64748b"
            fontSize={12}
            tickFormatter={(value) => formatCurrency(value, 'AED').replace('AED', '')}
          />
          <Tooltip 
            formatter={formatTooltip}
            labelStyle={{ color: '#1f2937' }}
            contentStyle={{ 
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}
          />
          <Line 
            type="monotone" 
            dataKey="revenue" 
            stroke="#3b82f6" 
            strokeWidth={3}
            dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}