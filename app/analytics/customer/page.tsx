'use client';

import { UserGroupIcon, HeartIcon, ShoppingBagIcon } from '@heroicons/react/24/outline';
import { useAuth } from '@/hooks/useAuth';
import { useBusinessIntelligence } from '@/hooks/useAnalytics';

export default function CustomerAnalyticsPage() {
  const { user } = useAuth();
  const organizationId = user?.user_metadata?.organization_id;

  // Fetch customer-specific BI data
  const { data: biData, isLoading } = useBusinessIntelligence(organizationId, { category: 'customer' });

  // Transform data for charts
  const segmentData = biData?.filter(d => d.metric_name?.includes('segment')).map(d => ({
    name: d.metric_name.replace('customer_segment_', ''),
    value: d.metric_value,
    color: d.metric_name.includes('vip') ? '#8B5CF6' : d.metric_name.includes('regular') ? '#3B82F6' : '#10B981',
  })) || [
    { name: 'VIP', value: 234, color: '#8B5CF6' },
    { name: 'Regular', value: 856, color: '#3B82F6' },
    { name: 'New', value: 453, color: '#10B981' },
  ];

  const retentionData = biData?.filter(d => d.metric_name?.includes('retention') || d.metric_name?.includes('new_customer'))
    .reduce((acc: Array<{month: string, retention: number, newCustomers: number}>, curr) => {
      const month = new Date(curr.metric_date).toLocaleDateString('en-US', { month: 'short' });
      const existing = acc.find((a: {month: string, retention: number, newCustomers: number}) => a.month === month);
      
      if (existing) {
        if (curr.metric_name.includes('retention')) {
          existing.retention = curr.metric_value;
        } else {
          existing.newCustomers = curr.metric_value;
        }
      } else {
        acc.push({
          month,
          retention: curr.metric_name.includes('retention') ? curr.metric_value : 0,
          newCustomers: curr.metric_name.includes('new_customer') ? curr.metric_value : 0,
        });
      }
      return acc;
    }, [] as any[]) || [
    { month: 'Jan', retention: 85, newCustomers: 45 },
    { month: 'Feb', retention: 87, newCustomers: 52 },
    { month: 'Mar', retention: 89, newCustomers: 61 },
    { month: 'Apr', retention: 91, newCustomers: 58 },
    { month: 'May', retention: 90, newCustomers: 67 },
    { month: 'Jun', retention: 92, newCustomers: 72 },
  ];

  // Extract key metrics
  const totalCustomers = biData?.find(d => d.metric_name === 'total_customers')?.metric_value || 1543;
  const retentionRate = biData?.find(d => d.metric_name === 'retention_rate')?.metric_value || 92;
  const avgLifetimeValue = biData?.find(d => d.metric_name === 'avg_lifetime_value')?.metric_value || 4200;
  const satisfactionScore = biData?.find(d => d.metric_name === 'satisfaction_score')?.metric_value || 4.8;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-pink-50 to-rose-50 p-6 flex items-center justify-center">
        <div className="text-gray-600">Loading customer analytics...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-pink-50 to-rose-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500 to-pink-600 flex items-center justify-center">
              <UserGroupIcon className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Customer Analytics</h1>
              <p className="text-gray-600">Customer behavior, satisfaction, and lifetime value</p>
            </div>
          </div>
        </div>

        {/* Customer Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-gray-200">
            <h3 className="text-sm font-medium text-gray-600 mb-1">Total Customers</h3>
            <p className="text-3xl font-bold text-gray-900">{totalCustomers.toLocaleString()}</p>
            <p className="text-xs text-green-600 mt-1">+8.7% this month</p>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-gray-200">
            <h3 className="text-sm font-medium text-gray-600 mb-1">Retention Rate</h3>
            <p className="text-3xl font-bold text-gray-900">{retentionRate}%</p>
            <p className="text-xs text-gray-500 mt-1">Excellent retention</p>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-gray-200">
            <h3 className="text-sm font-medium text-gray-600 mb-1">Avg Lifetime Value</h3>
            <p className="text-3xl font-bold text-gray-900">AED {(avgLifetimeValue / 1000).toFixed(1)}K</p>
            <p className="text-xs text-green-600 mt-1">+12% vs last year</p>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-gray-200">
            <h3 className="text-sm font-medium text-gray-600 mb-1">Satisfaction Score</h3>
            <p className="text-3xl font-bold text-gray-900">{satisfactionScore}/5.0</p>
            <p className="text-xs text-gray-500 mt-1">Very satisfied</p>
          </div>
        </div>

        {/* Customer Segmentation */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Customer Segmentation</h2>
            <div className="space-y-4">
              {segmentData.map((segment, index) => (
                <div key={index} className="flex items-center justify-between p-4 rounded-lg" style={{ backgroundColor: `${segment.color}15` }}>
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: segment.color }} />
                    <span className="font-semibold text-gray-900">{segment.name}</span>
                  </div>
                  <span className="text-2xl font-bold text-gray-900">{segment.value}</span>
                </div>
              ))}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-600">Total Customers</span>
                  <span className="text-lg font-bold text-gray-900">
                    {segmentData.reduce((sum, s) => sum + s.value, 0)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Retention & New Customers</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 px-3 font-semibold text-gray-700">Month</th>
                    <th className="text-right py-2 px-3 font-semibold text-gray-700">Retention %</th>
                    <th className="text-right py-2 px-3 font-semibold text-gray-700">New Customers</th>
                  </tr>
                </thead>
                <tbody>
                  {retentionData.map((row: {month: string, retention: number, newCustomers: number}, index: number) => (
                    <tr key={index} className="border-b border-gray-100">
                      <td className="py-2 px-3 font-medium text-gray-900">{row.month}</td>
                      <td className="text-right py-2 px-3">
                        <span className="inline-flex items-center gap-1 text-pink-600 font-semibold">
                          {row.retention}%
                        </span>
                      </td>
                      <td className="text-right py-2 px-3">
                        <span className="inline-flex items-center gap-1 text-green-600 font-semibold">
                          {row.newCustomers}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Customer Insights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-gray-200">
            <h3 className="font-bold text-gray-900 mb-4">Top Customer Behaviors</h3>
            <ul className="space-y-3 text-sm">
              <li>• 68% prefer custom tailoring</li>
              <li>• Average 2.3 orders per customer</li>
              <li>• 45% return within 3 months</li>
              <li>• 78% refer friends</li>
            </ul>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-gray-200">
            <h3 className="font-bold text-gray-900 mb-4">Communication Preferences</h3>
            <ul className="space-y-3 text-sm">
              <li>• 52% prefer WhatsApp</li>
              <li>• 28% prefer SMS</li>
              <li>• 20% prefer Email</li>
              <li>• 87% opt-in for updates</li>
            </ul>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-gray-200">
            <h3 className="font-bold text-gray-900 mb-4">Loyalty Insights</h3>
            <ul className="space-y-3 text-sm">
              <li>• {segmentData.find(s => s.name === 'VIP')?.value || 234} VIP customers</li>
              <li>• AED 8.5K avg VIP spend</li>
              <li>• 95% VIP retention rate</li>
              <li>• 42% loyalty program members</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
