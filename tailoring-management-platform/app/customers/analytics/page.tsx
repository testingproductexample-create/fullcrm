'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { 
  UserGroupIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  MapPinIcon,
  ChartBarIcon,
  CalendarIcon,
  StarIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/lib/supabase';
import { formatDate, formatCurrency } from '@/lib/utils';
import { Customer, CustomerAnalytics } from '@/types/customer';

// Force this page to be dynamic
export const dynamic = 'force-dynamic';

export default function CustomerAnalyticsPage() {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');

  // Fetch customer analytics
  const { data: analytics, isLoading, error, refetch } = useQuery({
    queryKey: ['customer-analytics', timeRange],
    queryFn: async (): Promise<CustomerAnalytics> => {
      const now = new Date();
      const startDate = new Date();
      
      switch (timeRange) {
        case '7d':
          startDate.setDate(now.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(now.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(now.getDate() - 90);
          break;
        case '1y':
          startDate.setFullYear(now.getFullYear() - 1);
          break;
      }

      // Execute multiple queries in parallel
      const [
        totalCustomersResult,
        newCustomersResult,
        activeCustomersResult,
        topCustomersResult,
        customersByCityResult,
        customersByNationalityResult,
        loyaltyTierResult,
        monthlyGrowthResult,
        orderStatsResult
      ] = await Promise.all([
        // Total customers
        supabase.from('customers').select('count', { count: 'exact' }),
        
        // New customers in time range
        supabase
          .from('customers')
          .select('count', { count: 'exact' })
          .gte('created_at', startDate.toISOString()),
        
        // Active customers (had orders in time range)
        supabase
          .from('customers')
          .select('count', { count: 'exact' })
          .gte('last_order_date', startDate.toISOString().split('T')[0]),
        
        // Top customers by revenue
        supabase
          .from('customers')
          .select('id, full_name, total_spent, total_orders')
          .order('total_spent', { ascending: false })
          .limit(10),
        
        // Customers by city
        supabase
          .from('customers')
          .select('city')
          .not('city', 'is', null),
        
        // Customers by nationality
        supabase
          .from('customers')
          .select('nationality')
          .not('nationality', 'is', null),
        
        // Loyalty tier distribution
        supabase
          .from('customers')
          .select('loyalty_tier')
          .not('loyalty_tier', 'is', null),
        
        // Monthly customer growth (last 12 months)
        supabase
          .from('customers')
          .select('created_at')
          .gte('created_at', new Date(new Date().setFullYear(new Date().getFullYear() - 1)).toISOString()),
        
        // Order statistics for average order value
        supabase
          .from('orders')
          .select('total_amount')
          .not('total_amount', 'is', null)
      ]);

      // Process city data
      const cityGroups = customersByCityResult.data?.reduce((acc: Record<string, number>, customer) => {
        const city = customer.city || 'Unknown';
        acc[city] = (acc[city] || 0) + 1;
        return acc;
      }, {}) || {};

      const customersByCity = Object.entries(cityGroups)
        .map(([city, count]) => ({ city, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      // Process nationality data
      const nationalityGroups = customersByNationalityResult.data?.reduce((acc: Record<string, number>, customer) => {
        const nationality = customer.nationality || 'Unknown';
        acc[nationality] = (acc[nationality] || 0) + 1;
        return acc;
      }, {}) || {};

      const customersByNationality = Object.entries(nationalityGroups)
        .map(([nationality, count]) => ({ nationality, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      // Process loyalty tier data
      const tierGroups = loyaltyTierResult.data?.reduce((acc: Record<string, number>, customer) => {
        const tier = customer.loyalty_tier || 'bronze';
        acc[tier] = (acc[tier] || 0) + 1;
        return acc;
      }, {}) || {};

      const loyaltyTierDistribution = Object.entries(tierGroups)
        .map(([tier, count]) => ({ tier, count }));

      // Process monthly growth
      const monthlyGroups = monthlyGrowthResult.data?.reduce((acc: Record<string, number>, customer) => {
        const month = new Date(customer.created_at).toISOString().slice(0, 7); // YYYY-MM format
        acc[month] = (acc[month] || 0) + 1;
        return acc;
      }, {}) || {};

      const monthlyCustomerGrowth = Object.entries(monthlyGroups)
        .map(([month, count]) => ({ month, count }))
        .sort((a, b) => a.month.localeCompare(b.month));

      // Calculate average order value
      const totalOrderAmount = orderStatsResult.data?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;
      const totalOrders = orderStatsResult.data?.length || 0;
      const averageOrderValue = totalOrders > 0 ? totalOrderAmount / totalOrders : 0;

      // Calculate retention rate (simplified - customers who made repeat orders)
      const repeatCustomers = await supabase
        .from('customers')
        .select('count', { count: 'exact' })
        .gt('total_orders', 1);

      const customerRetentionRate = totalCustomersResult.count && totalCustomersResult.count > 0 
        ? ((repeatCustomers.count || 0) / totalCustomersResult.count) * 100 
        : 0;

      return {
        totalCustomers: totalCustomersResult.count || 0,
        newCustomersThisMonth: newCustomersResult.count || 0,
        activeCustomers: activeCustomersResult.count || 0,
        topCustomersByRevenue: topCustomersResult.data || [],
        customersByCity,
        customersByNationality,
        loyaltyTierDistribution,
        monthlyCustomerGrowth,
        averageOrderValue,
        customerRetentionRate,
      };
    },
    refetchInterval: 300000, // Refresh every 5 minutes
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">Error loading analytics</p>
        <Button variant="outline" onClick={() => refetch()}>
          Try Again
        </Button>
      </div>
    );
  }

  const getTrendIcon = (current: number, previous: number) => {
    if (current > previous) return <ChevronUpIcon className="h-4 w-4 text-green-500" />;
    if (current < previous) return <ChevronDownIcon className="h-4 w-4 text-red-500" />;
    return <div className="h-4 w-4" />;
  };

  const getLoyaltyTierColor = (tier: string) => {
    switch (tier) {
      case 'bronze': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'silver': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'gold': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'platinum': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customer Analytics</h1>
          <p className="text-gray-600">Insights and metrics for your customer base</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="flex items-center gap-2"
          >
            <ArrowPathIcon className="h-4 w-4" />
            Refresh
          </Button>
          <div className="flex items-center gap-2">
            {(['7d', '30d', '90d', '1y'] as const).map((range) => (
              <Button
                key={range}
                variant={timeRange === range ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTimeRange(range)}
              >
                {range === '7d' ? '7 Days' : 
                 range === '30d' ? '30 Days' : 
                 range === '90d' ? '90 Days' : '1 Year'}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="glass">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Customers</p>
                <p className="text-2xl font-bold text-blue-600">{analytics.totalCustomers.toLocaleString()}</p>
              </div>
              <UserGroupIcon className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">New Customers</p>
                <p className="text-2xl font-bold text-green-600">{analytics.newCustomersThisMonth.toLocaleString()}</p>
                <p className="text-xs text-gray-500">in selected period</p>
              </div>
              <ChevronUpIcon className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Customers</p>
                <p className="text-2xl font-bold text-purple-600">{analytics.activeCustomers.toLocaleString()}</p>
                <p className="text-xs text-gray-500">with recent orders</p>
              </div>
              <ChartBarIcon className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Retention Rate</p>
                <p className="text-2xl font-bold text-orange-600">{analytics.customerRetentionRate.toFixed(1)}%</p>
                <p className="text-xs text-gray-500">repeat customers</p>
              </div>
              <StarIcon className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="glass">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Average Order Value</p>
                <p className="text-2xl font-bold text-indigo-600">{formatCurrency(analytics.averageOrderValue)}</p>
              </div>
              <ChartBarIcon className="h-8 w-8 text-indigo-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-emerald-600">
                  {formatCurrency(analytics.topCustomersByRevenue.reduce((sum, c) => sum + (c.total_spent || 0), 0))}
                </p>
              </div>
              <ChevronUpIcon className="h-8 w-8 text-emerald-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <Tabs defaultValue="top-customers" className="space-y-4">
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="top-customers">Top Customers</TabsTrigger>
          <TabsTrigger value="demographics">Demographics</TabsTrigger>
          <TabsTrigger value="loyalty">Loyalty Tiers</TabsTrigger>
          <TabsTrigger value="growth">Growth Trends</TabsTrigger>
        </TabsList>

        {/* Top Customers */}
        <TabsContent value="top-customers">
          <Card className="glass">
            <CardHeader>
              <CardTitle>Top Customers by Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.topCustomersByRevenue.map((customer, index) => (
                  <Link key={customer.id} href={`/customers/${customer.id}`}>
                    <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-800 font-medium text-sm">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{customer.full_name}</p>
                          <p className="text-sm text-gray-600">{customer.total_orders} orders</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">{formatCurrency(customer.total_spent || 0)}</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Demographics */}
        <TabsContent value="demographics">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="glass">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPinIcon className="h-5 w-5" />
                  Customers by City
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics.customersByCity.map((item) => (
                    <div key={item.city} className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">{item.city}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{
                              width: `${(item.count / Math.max(...analytics.customersByCity.map(c => c.count))) * 100}%`
                            }}
                          />
                        </div>
                        <span className="text-sm font-medium text-gray-900 min-w-8 text-right">{item.count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="glass">
              <CardHeader>
                <CardTitle>Customers by Nationality</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics.customersByNationality.map((item) => (
                    <div key={item.nationality} className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">{item.nationality}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-green-600 h-2 rounded-full"
                            style={{
                              width: `${(item.count / Math.max(...analytics.customersByNationality.map(c => c.count))) * 100}%`
                            }}
                          />
                        </div>
                        <span className="text-sm font-medium text-gray-900 min-w-8 text-right">{item.count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Loyalty Tiers */}
        <TabsContent value="loyalty">
          <Card className="glass">
            <CardHeader>
              <CardTitle>Loyalty Tier Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {analytics.loyaltyTierDistribution.map((item) => (
                  <div key={item.tier} className="text-center p-4 border border-gray-200 rounded-lg">
                    <Badge className={getLoyaltyTierColor(item.tier)}>
                      {item.tier.charAt(0).toUpperCase() + item.tier.slice(1)}
                    </Badge>
                    <p className="text-2xl font-bold text-gray-900 mt-2">{item.count}</p>
                    <p className="text-sm text-gray-600">customers</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Growth Trends */}
        <TabsContent value="growth">
          <Card className="glass">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5" />
                Monthly Customer Growth
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analytics.monthlyCustomerGrowth.slice(-12).map((item) => (
                  <div key={item.month} className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">
                      {new Date(item.month + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-purple-600 h-2 rounded-full"
                          style={{
                            width: `${(item.count / Math.max(...analytics.monthlyCustomerGrowth.map(c => c.count))) * 100}%`
                          }}
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-900 min-w-8 text-right">{item.count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}