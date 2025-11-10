'use client';

import { useQuery } from '@tanstack/react-query';
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

  const total = revenueData?.reduce((sum, item) => sum + item.revenue, 0) || 0;
  const average = revenueData ? total / revenueData.length : 0;

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-blue-50 rounded-lg p-3">
          <p className="text-xs text-gray-600 mb-1">Total Revenue</p>
          <p className="text-lg font-bold text-blue-600">{formatCurrency(total)}</p>
        </div>
        <div className="bg-green-50 rounded-lg p-3">
          <p className="text-xs text-gray-600 mb-1">Monthly Average</p>
          <p className="text-lg font-bold text-green-600">{formatCurrency(average)}</p>
        </div>
      </div>

      {/* Monthly Revenue Table */}
      <div className="max-h-64 overflow-y-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-white border-b border-gray-200">
            <tr>
              <th className="text-left py-2 px-3 font-semibold text-gray-700">Month</th>
              <th className="text-right py-2 px-3 font-semibold text-gray-700">Revenue</th>
            </tr>
          </thead>
          <tbody>
            {revenueData?.map((item, index) => (
              <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-2 px-3 font-medium text-gray-900">{item.month}</td>
                <td className="text-right py-2 px-3">
                  <span className="font-semibold text-blue-600">
                    {formatCurrency(item.revenue)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
