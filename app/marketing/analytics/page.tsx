'use client';

/**
 * Marketing Analytics & Performance Reports
 * Comprehensive analytics dashboard for marketing campaigns
 */

import { useState } from 'react';
import { useMarketingDashboard, useCampaignPerformanceReport, useMarketingCampaigns } from '@/hooks/useMarketing';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  BarChart3, TrendingUp, Eye, MousePointer, Mail, DollarSign,
  Calendar, Download, Filter, Target, Users, Zap
} from 'lucide-react';

export default function MarketingAnalyticsPage() {
  const [dateRange, setDateRange] = useState('this_month');
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>('');

  const { data: dashboard } = useMarketingDashboard();
  const { data: campaigns } = useMarketingCampaigns();
  const { data: campaignReport } = useCampaignPerformanceReport(selectedCampaignId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Marketing Analytics</h1>
          <p className="text-slate-600 mt-1">Performance insights and campaign analytics</p>
        </div>
        <div className="flex items-center space-x-3">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="this_week">This Week</SelectItem>
              <SelectItem value="this_month">This Month</SelectItem>
              <SelectItem value="last_month">Last Month</SelectItem>
              <SelectItem value="last_3_months">Last 3 Months</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Key Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Total Campaigns</p>
              <p className="text-2xl font-bold text-slate-900 mt-2">
                {dashboard?.overview.total_campaigns || 0}
              </p>
              <p className="text-xs text-green-600 mt-1">
                +{dashboard?.overview.percentage_changes.campaigns_change || 0}% vs last period
              </p>
            </div>
            <Mail className="h-8 w-8 text-blue-600" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Open Rate</p>
              <p className="text-2xl font-bold text-slate-900 mt-2">
                {(dashboard?.overview.this_month.avg_open_rate || 0).toFixed(1)}%
              </p>
              <p className="text-xs text-green-600 mt-1">
                +{dashboard?.overview.percentage_changes.open_rate_change || 0}% vs last period
              </p>
            </div>
            <Eye className="h-8 w-8 text-purple-600" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Click Rate</p>
              <p className="text-2xl font-bold text-slate-900 mt-2">
                {(dashboard?.overview.this_month.avg_click_rate || 0).toFixed(1)}%
              </p>
              <p className="text-xs text-green-600 mt-1">
                +{dashboard?.overview.percentage_changes.click_rate_change || 0}% vs last period
              </p>
            </div>
            <MousePointer className="h-8 w-8 text-green-600" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Revenue</p>
              <p className="text-2xl font-bold text-slate-900 mt-2">
                {(dashboard?.overview.this_month.revenue_generated || 0).toLocaleString()} AED
              </p>
              <p className="text-xs text-green-600 mt-1">
                +{dashboard?.overview.percentage_changes.revenue_change || 0}% vs last period
              </p>
            </div>
            <DollarSign className="h-8 w-8 text-amber-600" />
          </div>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center">
            <BarChart3 className="h-5 w-5 mr-2 text-blue-600" />
            Campaign Performance Trends
          </h2>
          <div className="h-80 flex items-center justify-center bg-slate-50 rounded-lg">
            <p className="text-slate-500">Chart placeholder - Campaign metrics over time</p>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center">
            <Target className="h-5 w-5 mr-2 text-green-600" />
            Audience Engagement
          </h2>
          <div className="h-80 flex items-center justify-center bg-slate-50 rounded-lg">
            <p className="text-slate-500">Chart placeholder - Segment performance</p>
          </div>
        </Card>
      </div>

      {/* Top Campaigns Table */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center">
          <TrendingUp className="h-5 w-5 mr-2 text-purple-600" />
          Top Performing Campaigns
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4 font-medium text-slate-600">Campaign</th>
                <th className="text-left py-3 px-4 font-medium text-slate-600">Sent</th>
                <th className="text-left py-3 px-4 font-medium text-slate-600">Opens</th>
                <th className="text-left py-3 px-4 font-medium text-slate-600">Clicks</th>
                <th className="text-left py-3 px-4 font-medium text-slate-600">Revenue</th>
                <th className="text-left py-3 px-4 font-medium text-slate-600">ROI</th>
              </tr>
            </thead>
            <tbody>
              {campaigns?.data?.slice(0, 5).map((campaign) => (
                <tr key={campaign.id} className="border-b hover:bg-slate-50">
                  <td className="py-3 px-4 font-medium">{campaign.campaign_name}</td>
                  <td className="py-3 px-4">{campaign.emails_sent?.toLocaleString() || 0}</td>
                  <td className="py-3 px-4">{campaign.emails_opened?.toLocaleString() || 0}</td>
                  <td className="py-3 px-4">{campaign.emails_clicked?.toLocaleString() || 0}</td>
                  <td className="py-3 px-4">{(campaign.total_revenue || 0).toLocaleString()} AED</td>
                  <td className="py-3 px-4 text-green-600 font-medium">0%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Automation Performance */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center">
          <Zap className="h-5 w-5 mr-2 text-amber-600" />
          Automation Performance
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-blue-700">Active Workflows</span>
              <span className="text-lg font-bold text-blue-900">
                {dashboard?.automation_performance.active_workflows || 0}
              </span>
            </div>
          </div>
          
          <div className="p-4 bg-green-50 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-green-700">Completion Rate</span>
              <span className="text-lg font-bold text-green-900">
                {(dashboard?.automation_performance.avg_completion_rate || 0).toFixed(1)}%
              </span>
            </div>
          </div>
          
          <div className="p-4 bg-purple-50 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-purple-700">Revenue</span>
              <span className="text-lg font-bold text-purple-900">
                {(dashboard?.automation_performance.total_automation_revenue || 0).toLocaleString()} AED
              </span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}