'use client';

/**
 * Marketing Dashboard Overview
 * Main dashboard showing campaign overview, performance metrics, and key insights
 */

import { useState } from 'react';
import { useMarketingCampaigns, useMarketingDashboard, useCustomerSegments } from '@/hooks/useMarketing';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Mail, Users, TrendingUp, Target, Eye, MousePointer, DollarSign, BarChart3 } from 'lucide-react';
import Link from 'next/link';

export default function MarketingDashboardPage() {
  const { data: campaigns, isLoading: campaignsLoading } = useMarketingCampaigns();
  const { data: segments, isLoading: segmentsLoading } = useCustomerSegments();
  const { data: dashboardMetrics } = useMarketingDashboard();

  const [selectedPeriod, setSelectedPeriod] = useState('this_month');

  // Calculate overview metrics
  const activeCampaigns = campaigns?.data?.filter(c => c.status === 'sending' || c.status === 'scheduled').length || 0;
  const totalCampaigns = campaigns?.data?.length || 0;
  const totalSegments = segments?.length || 0;
  const activeSegments = segments?.filter(s => s.is_active).length || 0;

  if (campaignsLoading || segmentsLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading marketing dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Marketing Dashboard</h1>
          <p className="text-slate-600 mt-1">Manage campaigns, segments, and marketing automation</p>
        </div>
        <div className="flex gap-3">
          <Link href={`/marketing/campaigns/new`}>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              New Campaign
            </Button>
          </Link>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-700">Active Campaigns</p>
              <p className="text-3xl font-bold text-blue-900 mt-2">{activeCampaigns}</p>
              <p className="text-xs text-blue-600 mt-1">of {totalCampaigns} total</p>
            </div>
            <div className="bg-blue-200 p-3 rounded-full">
              <Mail className="h-8 w-8 text-blue-700" />
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-700">Total Subscribers</p>
              <p className="text-3xl font-bold text-green-900 mt-2">
                {(dashboardMetrics?.overview.total_subscribers || 0).toLocaleString()}
              </p>
              <p className="text-xs text-green-600 mt-1">{activeSegments} active segments</p>
            </div>
            <div className="bg-green-200 p-3 rounded-full">
              <Users className="h-8 w-8 text-green-700" />
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-700">Avg. Open Rate</p>
              <p className="text-3xl font-bold text-purple-900 mt-2">
                {(dashboardMetrics?.overview.this_month.avg_open_rate || 0).toFixed(1)}%
              </p>
              <p className="text-xs text-purple-600 mt-1">this month</p>
            </div>
            <div className="bg-purple-200 p-3 rounded-full">
              <Eye className="h-8 w-8 text-purple-700" />
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-amber-700">Revenue Generated</p>
              <p className="text-3xl font-bold text-amber-900 mt-2">
                {(dashboardMetrics?.overview.this_month.revenue_generated || 0).toLocaleString()} AED
              </p>
              <p className="text-xs text-amber-600 mt-1">
                {(dashboardMetrics?.overview.this_month.roi_percentage || 0).toFixed(1)}% ROI
              </p>
            </div>
            <div className="bg-amber-200 p-3 rounded-full">
              <DollarSign className="h-8 w-8 text-amber-700" />
            </div>
          </div>
        </Card>
      </div>

      {/* Performance Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
            <BarChart3 className="h-5 w-5 mr-2 text-blue-600" />
            This Month Performance
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <Mail className="h-4 w-4 text-blue-600 mr-2" />
                <span className="text-sm font-medium">Emails Delivered</span>
              </div>
              <span className="text-lg font-bold text-slate-900">
                {(dashboardMetrics?.overview.this_month.emails_delivered || 0).toLocaleString()}
              </span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <Eye className="h-4 w-4 text-purple-600 mr-2" />
                <span className="text-sm font-medium">Open Rate</span>
              </div>
              <span className="text-lg font-bold text-slate-900">
                {(dashboardMetrics?.overview.this_month.avg_open_rate || 0).toFixed(1)}%
              </span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <MousePointer className="h-4 w-4 text-green-600 mr-2" />
                <span className="text-sm font-medium">Click Rate</span>
              </div>
              <span className="text-lg font-bold text-slate-900">
                {(dashboardMetrics?.overview.this_month.avg_click_rate || 0).toFixed(1)}%
              </span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <Target className="h-4 w-4 text-amber-600 mr-2" />
                <span className="text-sm font-medium">Conversion Rate</span>
              </div>
              <span className="text-lg font-bold text-slate-900">
                {(dashboardMetrics?.overview.this_month.conversion_rate || 0).toFixed(1)}%
              </span>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
            <TrendingUp className="h-5 w-5 mr-2 text-green-600" />
            Growth Trends
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-600">Campaigns vs Last Month</span>
              <span className={`text-sm font-bold ${
                (dashboardMetrics?.overview.percentage_changes.campaigns_change || 0) >= 0 
                  ? 'text-green-600' 
                  : 'text-red-600'
              }`}>
                {(dashboardMetrics?.overview.percentage_changes.campaigns_change || 0) >= 0 ? '+' : ''}
                {(dashboardMetrics?.overview.percentage_changes.campaigns_change || 0).toFixed(1)}%
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-600">Open Rate Change</span>
              <span className={`text-sm font-bold ${
                (dashboardMetrics?.overview.percentage_changes.open_rate_change || 0) >= 0 
                  ? 'text-green-600' 
                  : 'text-red-600'
              }`}>
                {(dashboardMetrics?.overview.percentage_changes.open_rate_change || 0) >= 0 ? '+' : ''}
                {(dashboardMetrics?.overview.percentage_changes.open_rate_change || 0).toFixed(1)}%
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-600">Revenue Growth</span>
              <span className={`text-sm font-bold ${
                (dashboardMetrics?.overview.percentage_changes.revenue_change || 0) >= 0 
                  ? 'text-green-600' 
                  : 'text-red-600'
              }`}>
                {(dashboardMetrics?.overview.percentage_changes.revenue_change || 0) >= 0 ? '+' : ''}
                {(dashboardMetrics?.overview.percentage_changes.revenue_change || 0).toFixed(1)}%
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-600">ROI Improvement</span>
              <span className={`text-sm font-bold ${
                (dashboardMetrics?.overview.percentage_changes.roi_change || 0) >= 0 
                  ? 'text-green-600' 
                  : 'text-red-600'
              }`}>
                {(dashboardMetrics?.overview.percentage_changes.roi_change || 0) >= 0 ? '+' : ''}
                {(dashboardMetrics?.overview.percentage_changes.roi_change || 0).toFixed(1)}%
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Link href={`/marketing/campaigns`}>
            <Button variant="outline" className="w-full justify-start h-auto p-4">
              <Mail className="h-5 w-5 mr-3 text-blue-600" />
              <div className="text-left">
                <p className="font-medium">Manage Campaigns</p>
                <p className="text-xs text-slate-500 mt-1">Create and monitor campaigns</p>
              </div>
            </Button>
          </Link>
          
          <Link href={`/marketing/segments`}>
            <Button variant="outline" className="w-full justify-start h-auto p-4">
              <Users className="h-5 w-5 mr-3 text-purple-600" />
              <div className="text-left">
                <p className="font-medium">Customer Segments</p>
                <p className="text-xs text-slate-500 mt-1">Build targeted audiences</p>
              </div>
            </Button>
          </Link>
          
          <Link href={`/marketing/templates`}>
            <Button variant="outline" className="w-full justify-start h-auto p-4">
              <BarChart3 className="h-5 w-5 mr-3 text-green-600" />
              <div className="text-left">
                <p className="font-medium">Email Templates</p>
                <p className="text-xs text-slate-500 mt-1">Design beautiful emails</p>
              </div>
            </Button>
          </Link>
          
          <Link href={`/marketing/analytics`}>
            <Button variant="outline" className="w-full justify-start h-auto p-4">
              <TrendingUp className="h-5 w-5 mr-3 text-amber-600" />
              <div className="text-left">
                <p className="font-medium">Analytics</p>
                <p className="text-xs text-slate-500 mt-1">View detailed reports</p>
              </div>
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}