'use client';

/**
 * Loyalty Analytics & Reports Page
 * Comprehensive analytics dashboard for loyalty program performance
 */

import { useState } from 'react';
import { useLoyaltyDashboard, useLoyaltyAnalytics, useLoyaltyPrograms } from '@/hooks/useLoyalty';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  BarChart3, TrendingUp, Users, Award, Gift, Target,
  Crown, Star, Calendar, Download, ArrowUp, ArrowDown
} from 'lucide-react';

export default function LoyaltyAnalyticsPage() {
  const [selectedProgramId, setSelectedProgramId] = useState<string | undefined>();
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');

  const { data: programs } = useLoyaltyPrograms();
  const { data: dashboardMetrics } = useLoyaltyDashboard(selectedProgramId);
  const { data: analytics } = useLoyaltyAnalytics(
    selectedProgramId || programs?.[0]?.id || '',
    undefined
  );

  const getChangeIndicator = (value: number) => {
    if (value > 0) {
      return (
        <span className="flex items-center text-xs text-green-600">
          <ArrowUp className="h-3 w-3 mr-1" />
          {value.toFixed(1)}%
        </span>
      );
    } else if (value < 0) {
      return (
        <span className="flex items-center text-xs text-red-600">
          <ArrowDown className="h-3 w-3 mr-1" />
          {Math.abs(value).toFixed(1)}%
        </span>
      );
    }
    return <span className="text-xs text-slate-600">No change</span>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Loyalty Analytics</h1>
          <p className="text-slate-600 mt-1">Program performance and insights</p>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={selectedProgramId || 'all'}
            onChange={(e) => setSelectedProgramId(e.target.value === 'all' ? undefined : e.target.value)}
            className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Programs</option>
            {programs?.map((program) => (
              <option key={program.id} value={program.id}>{program.program_name}</option>
            ))}
          </select>

          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as any)}
            className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
            <option value="1y">Last Year</option>
          </select>

          <Button variant="outline" className="border-slate-300">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Key Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-medium text-blue-700">Total Members</p>
              <p className="text-3xl font-bold text-blue-900 mt-2">
                {dashboardMetrics?.total_members.toLocaleString() || 0}
              </p>
            </div>
            <Users className="h-10 w-10 text-blue-600" />
          </div>
          {getChangeIndicator(dashboardMetrics?.member_growth_rate || 0)}
        </Card>

        <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-medium text-green-700">Active Members</p>
              <p className="text-3xl font-bold text-green-900 mt-2">
                {dashboardMetrics?.active_members.toLocaleString() || 0}
              </p>
            </div>
            <TrendingUp className="h-10 w-10 text-green-600" />
          </div>
          <p className="text-xs text-green-600">
            {((dashboardMetrics?.active_members || 0) / (dashboardMetrics?.total_members || 1) * 100).toFixed(1)}% of total
          </p>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-medium text-purple-700">Points Balance</p>
              <p className="text-3xl font-bold text-purple-900 mt-2">
                {dashboardMetrics?.points_balance.toLocaleString() || 0}
              </p>
            </div>
            <Star className="h-10 w-10 text-purple-600" />
          </div>
          <p className="text-xs text-purple-600">Outstanding points</p>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-medium text-amber-700">Rewards Redeemed</p>
              <p className="text-3xl font-bold text-amber-900 mt-2">
                {dashboardMetrics?.total_rewards_redeemed.toLocaleString() || 0}
              </p>
            </div>
            <Gift className="h-10 w-10 text-amber-600" />
          </div>
          <p className="text-xs text-amber-600">
            {dashboardMetrics?.rewards_value_aed.toLocaleString() || 0} AED value
          </p>
        </Card>
      </div>

      {/* Tier Distribution Analysis */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-6 flex items-center">
          <Crown className="h-5 w-5 mr-2 text-amber-600" />
          Tier Distribution & Performance
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg border border-orange-200">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-orange-900">Bronze</h3>
              <Crown className="h-5 w-5 text-orange-600" />
            </div>
            <p className="text-3xl font-bold text-orange-900 mb-2">
              {dashboardMetrics?.tier_distribution?.bronze || 0}
            </p>
            <p className="text-sm text-orange-700 mb-3">
              {((dashboardMetrics?.tier_distribution?.bronze || 0) / (dashboardMetrics?.total_members || 1) * 100).toFixed(1)}% of members
            </p>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-orange-700">Avg. Orders:</span>
                <span className="font-medium text-orange-900">12</span>
              </div>
              <div className="flex justify-between">
                <span className="text-orange-700">Avg. Spending:</span>
                <span className="font-medium text-orange-900">1,250 AED</span>
              </div>
            </div>
          </div>

          <div className="p-4 bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg border border-slate-200">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-slate-900">Silver</h3>
              <Crown className="h-5 w-5 text-slate-600" />
            </div>
            <p className="text-3xl font-bold text-slate-900 mb-2">
              {dashboardMetrics?.tier_distribution?.silver || 0}
            </p>
            <p className="text-sm text-slate-700 mb-3">
              {((dashboardMetrics?.tier_distribution?.silver || 0) / (dashboardMetrics?.total_members || 1) * 100).toFixed(1)}% of members
            </p>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-700">Avg. Orders:</span>
                <span className="font-medium text-slate-900">28</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-700">Avg. Spending:</span>
                <span className="font-medium text-slate-900">3,500 AED</span>
              </div>
            </div>
          </div>

          <div className="p-4 bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg border border-yellow-200">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-yellow-900">Gold</h3>
              <Crown className="h-5 w-5 text-yellow-600" />
            </div>
            <p className="text-3xl font-bold text-yellow-900 mb-2">
              {dashboardMetrics?.tier_distribution?.gold || 0}
            </p>
            <p className="text-sm text-yellow-700 mb-3">
              {((dashboardMetrics?.tier_distribution?.gold || 0) / (dashboardMetrics?.total_members || 1) * 100).toFixed(1)}% of members
            </p>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-yellow-700">Avg. Orders:</span>
                <span className="font-medium text-yellow-900">52</span>
              </div>
              <div className="flex justify-between">
                <span className="text-yellow-700">Avg. Spending:</span>
                <span className="font-medium text-yellow-900">8,750 AED</span>
              </div>
            </div>
          </div>

          <div className="p-4 bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-lg border border-indigo-200">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-indigo-900">Platinum</h3>
              <Crown className="h-5 w-5 text-indigo-600" />
            </div>
            <p className="text-3xl font-bold text-indigo-900 mb-2">
              {dashboardMetrics?.tier_distribution?.platinum || 0}
            </p>
            <p className="text-sm text-indigo-700 mb-3">
              {((dashboardMetrics?.tier_distribution?.platinum || 0) / (dashboardMetrics?.total_members || 1) * 100).toFixed(1)}% of members
            </p>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-indigo-700">Avg. Orders:</span>
                <span className="font-medium text-indigo-900">95</span>
              </div>
              <div className="flex justify-between">
                <span className="text-indigo-700">Avg. Spending:</span>
                <span className="font-medium text-indigo-900">18,500 AED</span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Points Activity */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
            <Star className="h-5 w-5 mr-2 text-amber-500" />
            Points Activity
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
              <div>
                <p className="text-sm text-green-700 mb-1">Points Earned</p>
                <p className="text-2xl font-bold text-green-900">
                  {dashboardMetrics?.total_points_earned.toLocaleString() || 0}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>

            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div>
                <p className="text-sm text-blue-700 mb-1">Points Redeemed</p>
                <p className="text-2xl font-bold text-blue-900">
                  {dashboardMetrics?.total_points_redeemed.toLocaleString() || 0}
                </p>
              </div>
              <Gift className="h-8 w-8 text-blue-600" />
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
              <div>
                <p className="text-sm text-slate-700 mb-1">Points Expired</p>
                <p className="text-2xl font-bold text-slate-900">
                  {dashboardMetrics?.total_points_expired.toLocaleString() || 0}
                </p>
              </div>
              <Calendar className="h-8 w-8 text-slate-600" />
            </div>

            <div className="pt-4 border-t border-slate-200">
              <p className="text-sm text-slate-600 mb-2">Redemption Rate</p>
              <div className="flex items-center justify-between">
                <div className="flex-1 bg-slate-200 rounded-full h-3 mr-4">
                  <div 
                    className="bg-blue-600 h-3 rounded-full" 
                    style={{ 
                      width: `${((dashboardMetrics?.total_points_redeemed || 0) / (dashboardMetrics?.total_points_earned || 1) * 100) || 0}%` 
                    }}
                  />
                </div>
                <span className="text-sm font-semibold text-slate-900">
                  {(((dashboardMetrics?.total_points_redeemed || 0) / (dashboardMetrics?.total_points_earned || 1) * 100) || 0).toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
            <Target className="h-5 w-5 mr-2 text-blue-600" />
            Engagement Metrics
          </h2>
          <div className="space-y-4">
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
              <p className="text-sm text-slate-600 mb-2">Avg. Engagement Score</p>
              <p className="text-3xl font-bold text-slate-900">
                {dashboardMetrics?.engagement_metrics?.average_engagement_score.toFixed(1) || '0.0'}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-xs text-blue-700 mb-1">Orders from Members</p>
                <p className="text-xl font-bold text-blue-900">
                  {dashboardMetrics?.engagement_metrics?.orders_from_loyalty_members.toLocaleString() || 0}
                </p>
              </div>

              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <p className="text-xs text-green-700 mb-1">Avg. Order Value</p>
                <p className="text-xl font-bold text-green-900">
                  {dashboardMetrics?.engagement_metrics?.average_order_value.toLocaleString() || 0} AED
                </p>
              </div>
            </div>

            <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
              <p className="text-sm text-purple-700 mb-2">Revenue from Loyalty</p>
              <p className="text-2xl font-bold text-purple-900 mb-2">
                {dashboardMetrics?.engagement_metrics?.loyalty_revenue_percentage.toFixed(1) || '0.0'}%
              </p>
              <p className="text-xs text-purple-600">
                of total revenue
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Campaign Performance */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
          <Target className="h-5 w-5 mr-2 text-green-600" />
          Campaign Performance
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200">
            <p className="text-sm text-green-700 mb-2">Active Campaigns</p>
            <p className="text-3xl font-bold text-green-900">
              {dashboardMetrics?.campaign_metrics?.active_campaigns || 0}
            </p>
          </div>

          <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-700 mb-2">Total Participants</p>
            <p className="text-3xl font-bold text-blue-900">
              {dashboardMetrics?.campaign_metrics?.total_participants.toLocaleString() || 0}
            </p>
          </div>

          <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border border-purple-200">
            <p className="text-sm text-purple-700 mb-2">Campaign ROI</p>
            <p className="text-3xl font-bold text-purple-900">
              {dashboardMetrics?.campaign_metrics?.campaign_roi.toFixed(1) || '0.0'}%
            </p>
          </div>
        </div>
      </Card>

      {/* Referral Performance */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
          <Users className="h-5 w-5 mr-2 text-blue-600" />
          Referral Program Performance
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-700 mb-2">Total Referrals</p>
            <p className="text-3xl font-bold text-blue-900">
              {dashboardMetrics?.referral_metrics?.total_referrals || 0}
            </p>
          </div>

          <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200">
            <p className="text-sm text-green-700 mb-2">Successful Referrals</p>
            <p className="text-3xl font-bold text-green-900">
              {dashboardMetrics?.referral_metrics?.successful_referrals || 0}
            </p>
          </div>

          <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border border-purple-200">
            <p className="text-sm text-purple-700 mb-2">Conversion Rate</p>
            <p className="text-3xl font-bold text-purple-900">
              {dashboardMetrics?.referral_metrics?.conversion_rate.toFixed(1) || '0.0'}%
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
