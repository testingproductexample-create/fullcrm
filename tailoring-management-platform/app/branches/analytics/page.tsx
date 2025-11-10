'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useBranches, useBranchMetrics, useMultiLocationOverview } from '@/hooks/useBranch';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ChartBarIcon,
  BuildingOffice2Icon,
  TrophyIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  UsersIcon,
  CurrencyDollarIcon,
  ShoppingBagIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

export default function BranchAnalyticsPage() {
  const { user } = useAuth();
  const organizationId = user?.user_metadata?.organization_id;

  const { data: branches, isLoading: loadingBranches } = useBranches(organizationId, { status: 'active' });
  const { data: overview, isLoading: loadingOverview } = useMultiLocationOverview(organizationId);
  
  const [selectedPeriod, setSelectedPeriod] = useState<string>('monthly');
  const [selectedMetric, setSelectedMetric] = useState<string>('revenue');

  // Get top performing branches
  const topBranches = overview?.branches
    ?.sort((a, b) => b.monthly_revenue - a.monthly_revenue)
    .slice(0, 5);

  // Calculate performance indicators
  const averageRevenue = overview?.branches?.length 
    ? overview.monthly_revenue_all_branches / overview.branches.length 
    : 0;

  const averageSatisfaction = overview?.branches?.length
    ? overview.branches.reduce((sum, b) => sum + b.customer_satisfaction, 0) / overview.branches.length
    : 0;

  const averageDeliveryRate = overview?.branches?.length
    ? overview.branches.reduce((sum, b) => sum + b.on_time_delivery_rate, 0) / overview.branches.length
    : 0;

  if (loadingBranches || loadingOverview) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Branch Performance Analytics</h1>
          <p className="text-gray-400">Compare and analyze performance across all locations</p>
        </div>
        <div className="flex gap-2">
          {['daily', 'weekly', 'monthly', 'quarterly'].map(period => (
            <button
              key={period}
              onClick={() => setSelectedPeriod(period)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedPeriod === period
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10'
              }`}
            >
              {period.charAt(0).toUpperCase() + period.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Network-Wide KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-white/5 backdrop-blur-xl border border-white/10 p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-gray-400 text-sm">Average Revenue per Branch</span>
            <CurrencyDollarIcon className="h-6 w-6 text-green-400" />
          </div>
          <div className="text-3xl font-bold text-white">{averageRevenue.toLocaleString()} AED</div>
          <div className="flex items-center gap-1 text-xs text-green-400 mt-2">
            <ArrowTrendingUpIcon className="h-4 w-4" />
            <span>12% vs last month</span>
          </div>
        </Card>

        <Card className="bg-white/5 backdrop-blur-xl border border-white/10 p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-gray-400 text-sm">Avg Customer Satisfaction</span>
            <TrophyIcon className="h-6 w-6 text-yellow-400" />
          </div>
          <div className="text-3xl font-bold text-white">{(averageSatisfaction || 0).toFixed(1)}/5.0</div>
          <div className="flex items-center gap-1 text-xs text-green-400 mt-2">
            <ArrowTrendingUpIcon className="h-4 w-4" />
            <span>0.3 points improvement</span>
          </div>
        </Card>

        <Card className="bg-white/5 backdrop-blur-xl border border-white/10 p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-gray-400 text-sm">Avg On-Time Delivery</span>
            <ClockIcon className="h-6 w-6 text-blue-400" />
          </div>
          <div className="text-3xl font-bold text-white">{(averageDeliveryRate || 0).toFixed(1)}%</div>
          <div className="flex items-center gap-1 text-xs text-green-400 mt-2">
            <ArrowTrendingUpIcon className="h-4 w-4" />
            <span>5% improvement</span>
          </div>
        </Card>

        <Card className="bg-white/5 backdrop-blur-xl border border-white/10 p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-gray-400 text-sm">Total Staff Utilization</span>
            <UsersIcon className="h-6 w-6 text-purple-400" />
          </div>
          <div className="text-3xl font-bold text-white">87%</div>
          <div className="flex items-center gap-1 text-xs text-gray-400 mt-2">
            <span>Across {overview?.total_staff || 0} employees</span>
          </div>
        </Card>
      </div>

      {/* Top Performing Branches */}
      <Card className="bg-white/5 backdrop-blur-xl border border-white/10 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <TrophyIcon className="h-6 w-6 text-yellow-400" />
            Top Performing Branches
          </h2>
          <select
            value={selectedMetric}
            onChange={(e) => setSelectedMetric(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="revenue">By Revenue</option>
            <option value="satisfaction">By Customer Satisfaction</option>
            <option value="delivery">By On-Time Delivery</option>
            <option value="orders">By Order Volume</option>
          </select>
        </div>

        <div className="space-y-4">
          {topBranches?.map((branch, index) => (
            <div
              key={branch.branch_id}
              className="flex items-center gap-4 p-4 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors"
            >
              <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                index === 0 ? 'bg-yellow-500/20 text-yellow-300' :
                index === 1 ? 'bg-gray-400/20 text-gray-300' :
                index === 2 ? 'bg-orange-500/20 text-orange-300' :
                'bg-indigo-500/20 text-indigo-300'
              }`}>
                <span className="font-bold">{index + 1}</span>
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-white font-semibold">{branch.branch_name}</span>
                  {index === 0 && (
                    <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-500/30 text-xs">
                      Best Performer
                    </Badge>
                  )}
                </div>
                <div className="text-sm text-gray-400">
                  {selectedMetric === 'revenue' && `Revenue: ${branch.monthly_revenue.toLocaleString()} AED`}
                  {selectedMetric === 'satisfaction' && `Satisfaction: ${branch.customer_satisfaction.toFixed(1)}/5.0`}
                  {selectedMetric === 'delivery' && `On-Time: ${branch.on_time_delivery_rate.toFixed(1)}%`}
                  {selectedMetric === 'orders' && `Orders: ${branch.active_orders}`}
                </div>
              </div>

              <div className="text-right">
                <div className="text-2xl font-bold text-white">
                  {selectedMetric === 'revenue' && `${branch.monthly_revenue.toLocaleString()}`}
                  {selectedMetric === 'satisfaction' && `${branch.customer_satisfaction.toFixed(1)}`}
                  {selectedMetric === 'delivery' && `${branch.on_time_delivery_rate.toFixed(1)}%`}
                  {selectedMetric === 'orders' && `${branch.active_orders}`}
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  {branch.total_staff} staff
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* All Branches Comparison */}
      <Card className="bg-white/5 backdrop-blur-xl border border-white/10 p-6">
        <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
          <ChartBarIcon className="h-6 w-6 text-indigo-400" />
          Branch Comparison
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left text-sm font-medium text-gray-400 pb-3">Branch</th>
                <th className="text-right text-sm font-medium text-gray-400 pb-3">Revenue</th>
                <th className="text-right text-sm font-medium text-gray-400 pb-3">Orders</th>
                <th className="text-right text-sm font-medium text-gray-400 pb-3">Staff</th>
                <th className="text-right text-sm font-medium text-gray-400 pb-3">Satisfaction</th>
                <th className="text-right text-sm font-medium text-gray-400 pb-3">On-Time %</th>
                <th className="text-right text-sm font-medium text-gray-400 pb-3">Inventory Value</th>
              </tr>
            </thead>
            <tbody>
              {overview?.branches?.map((branch, index) => (
                <tr
                  key={branch.branch_id}
                  className={`border-b border-white/5 ${index % 2 === 0 ? 'bg-white/5' : ''}`}
                >
                  <td className="py-4">
                    <div className="flex items-center gap-2">
                      <BuildingOffice2Icon className="h-5 w-5 text-gray-400" />
                      <span className="text-white font-medium">{branch.branch_name}</span>
                    </div>
                  </td>
                  <td className="text-right text-white">{branch.monthly_revenue.toLocaleString()} AED</td>
                  <td className="text-right text-white">{branch.active_orders}</td>
                  <td className="text-right text-white">{branch.total_staff}</td>
                  <td className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <span className="text-white">{branch.customer_satisfaction.toFixed(1)}</span>
                      {branch.customer_satisfaction >= 4.5 ? (
                        <ArrowTrendingUpIcon className="h-4 w-4 text-green-400" />
                      ) : branch.customer_satisfaction < 3.5 ? (
                        <ArrowTrendingDownIcon className="h-4 w-4 text-red-400" />
                      ) : null}
                    </div>
                  </td>
                  <td className="text-right">
                    <Badge className={`${
                      branch.on_time_delivery_rate >= 90
                        ? 'bg-green-500/20 text-green-300 border-green-500/30'
                        : branch.on_time_delivery_rate >= 75
                        ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
                        : 'bg-red-500/20 text-red-300 border-red-500/30'
                    }`}>
                      {branch.on_time_delivery_rate.toFixed(1)}%
                    </Badge>
                  </td>
                  <td className="text-right text-white">{branch.inventory_value.toLocaleString()} AED</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-white/20 font-semibold">
                <td className="py-4 text-white">Total</td>
                <td className="text-right text-white">{overview?.monthly_revenue_all_branches.toLocaleString()} AED</td>
                <td className="text-right text-white">
                  {overview?.branches?.reduce((sum, b) => sum + b.active_orders, 0)}
                </td>
                <td className="text-right text-white">{overview?.total_staff}</td>
                <td className="text-right text-white">{averageSatisfaction.toFixed(1)}</td>
                <td className="text-right text-white">{averageDeliveryRate.toFixed(1)}%</td>
                <td className="text-right text-white">{overview?.total_inventory_value.toLocaleString()} AED</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>

      {/* Performance Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-white/5 backdrop-blur-xl border border-white/10 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Key Insights</h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
              <ArrowTrendingUpIcon className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
              <div>
                <div className="text-sm font-medium text-green-300">Strong Performance</div>
                <div className="text-xs text-gray-400 mt-1">
                  3 branches exceeded revenue targets by more than 15% this month
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
              <ClockIcon className="h-5 w-5 text-yellow-400 flex-shrink-0 mt-0.5" />
              <div>
                <div className="text-sm font-medium text-yellow-300">Attention Needed</div>
                <div className="text-xs text-gray-400 mt-1">
                  2 branches have declining on-time delivery rates requiring investigation
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <ShoppingBagIcon className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <div className="text-sm font-medium text-blue-300">Opportunity</div>
                <div className="text-xs text-gray-400 mt-1">
                  Consider redistributing workload from high-capacity branches to underutilized locations
                </div>
              </div>
            </div>
          </div>
        </Card>

        <Card className="bg-white/5 backdrop-blur-xl border border-white/10 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Recommended Actions</h3>
          <div className="space-y-3">
            <div className="p-3 bg-white/5 border border-white/10 rounded-lg">
              <div className="text-sm font-medium text-white mb-1">Staff Reallocation</div>
              <div className="text-xs text-gray-400">
                Move 2-3 tailors from downtown branch to new suburban location to balance capacity
              </div>
              <Button className="mt-2 text-xs bg-indigo-600 hover:bg-indigo-700 text-white">
                View Details
              </Button>
            </div>

            <div className="p-3 bg-white/5 border border-white/10 rounded-lg">
              <div className="text-sm font-medium text-white mb-1">Inventory Transfer</div>
              <div className="text-xs text-gray-400">
                15 fabric items are low stock at Marina branch but abundant at Deira branch
              </div>
              <Button className="mt-2 text-xs bg-indigo-600 hover:bg-indigo-700 text-white">
                Create Transfer
              </Button>
            </div>

            <div className="p-3 bg-white/5 border border-white/10 rounded-lg">
              <div className="text-sm font-medium text-white mb-1">Training Program</div>
              <div className="text-xs text-gray-400">
                Schedule customer service training for branches with satisfaction scores below 4.0
              </div>
              <Button className="mt-2 text-xs bg-indigo-600 hover:bg-indigo-700 text-white">
                Schedule Training
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
