'use client';

import { useState } from 'react';
import { 
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  UserGroupIcon,
  ExclamationTriangleIcon,
  CalendarDaysIcon,
  FunnelIcon,
  DocumentArrowDownIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '@/hooks/useAuth';
import { useFeedbackAnalytics, useFeedbackDashboard } from '@/hooks/useFeedback';
import type { AnalyticsFilters } from '@/types/feedback';

export default function FeedbackAnalyticsPage() {
  const { user } = useAuth();
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | 'custom'>('30d');
  const [selectedMetric, setSelectedMetric] = useState<'satisfaction' | 'nps' | 'resolution' | 'volume'>('satisfaction');
  const [showFilters, setShowFilters] = useState(false);
  
  const [filters, setFilters] = useState<AnalyticsFilters>({
    date_from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    date_to: new Date().toISOString(),
    group_by: 'day',
  });

  const { data: analyticsData, isLoading } = useFeedbackAnalytics(filters);
  const { data: dashboardData } = useFeedbackDashboard();

  const updateTimeRange = (range: '7d' | '30d' | '90d' | 'custom') => {
    setTimeRange(range);
    const now = new Date();
    let fromDate = new Date();

    switch (range) {
      case '7d':
        fromDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        fromDate.setDate(now.getDate() - 30);
        break;
      case '90d':
        fromDate.setDate(now.getDate() - 90);
        break;
      default:
        return; // Custom range - don't auto-update
    }

    setFilters(prev => ({
      ...prev,
      date_from: fromDate.toISOString(),
      date_to: now.toISOString(),
    }));
  };

  const metrics = dashboardData?.metrics;

  // Sample data for charts (would be calculated from real analytics data)
  const satisfactionTrend = [
    { date: '2024-01-01', score: 4.1 },
    { date: '2024-01-02', score: 4.2 },
    { date: '2024-01-03', score: 4.0 },
    { date: '2024-01-04', score: 4.3 },
    { date: '2024-01-05', score: 4.2 },
    { date: '2024-01-06', score: 4.4 },
    { date: '2024-01-07', score: 4.3 },
  ];

  const complaintCategories = [
    { category: 'Product Quality', count: 45, percentage: 35 },
    { category: 'Service Issues', count: 32, percentage: 25 },
    { category: 'Delivery Problems', count: 25, percentage: 19 },
    { category: 'Billing Concerns', count: 15, percentage: 12 },
    { category: 'Other', count: 12, percentage: 9 },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-slate-600">Loading analytics...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-2">
                Feedback Analytics & Reports
              </h1>
              <p className="text-slate-600">
                Analyze customer feedback trends, satisfaction scores, and complaint patterns
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
              >
                <FunnelIcon className="w-5 h-5 mr-2" />
                Filters
              </button>
              
              <button className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
                <DocumentArrowDownIcon className="w-5 h-5 mr-2" />
                Export Report
              </button>
            </div>
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="bg-white/70 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Time Range</label>
                <select
                  value={timeRange}
                  onChange={(e) => updateTimeRange(e.target.value as any)}
                  className="w-full px-3 py-2 bg-white/50 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="7d">Last 7 days</option>
                  <option value="30d">Last 30 days</option>
                  <option value="90d">Last 90 days</option>
                  <option value="custom">Custom range</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Group By</label>
                <select
                  value={filters.group_by}
                  onChange={(e) => setFilters(prev => ({ ...prev, group_by: e.target.value as any }))}
                  className="w-full px-3 py-2 bg-white/50 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="day">Day</option>
                  <option value="week">Week</option>
                  <option value="month">Month</option>
                  <option value="quarter">Quarter</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Branch</label>
                <select className="w-full px-3 py-2 bg-white/50 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  <option value="">All Branches</option>
                  <option value="main">Main Branch</option>
                  <option value="downtown">Downtown Branch</option>
                  <option value="mall">Mall Branch</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Category</label>
                <select className="w-full px-3 py-2 bg-white/50 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  <option value="">All Categories</option>
                  <option value="quality">Product Quality</option>
                  <option value="service">Service Issues</option>
                  <option value="delivery">Delivery</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/70 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium">Avg Satisfaction Score</p>
                <p className="text-2xl font-bold text-slate-900">
                  {metrics?.customer_satisfaction_score.toFixed(1) || 0}/5.0
                </p>
                <div className="flex items-center mt-2 text-sm">
                  <ArrowTrendingUpIcon className="w-4 h-4 text-green-500 mr-1" />
                  <span className="text-green-600">+0.3</span>
                  <span className="text-slate-500 ml-1">vs last period</span>
                </div>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <ChartBarIcon className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white/70 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium">Net Promoter Score</p>
                <p className="text-2xl font-bold text-slate-900">
                  {metrics?.nps_score.toFixed(0) || 0}
                </p>
                <div className="flex items-center mt-2 text-sm">
                  <ArrowTrendingUpIcon className="w-4 h-4 text-green-500 mr-1" />
                  <span className="text-green-600">+5</span>
                  <span className="text-slate-500 ml-1">vs last period</span>
                </div>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <UserGroupIcon className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white/70 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium">Resolution Rate</p>
                <p className="text-2xl font-bold text-slate-900">
                  {metrics?.resolution_rate.toFixed(1) || 0}%
                </p>
                <div className="flex items-center mt-2 text-sm">
                  <ArrowTrendingUpIcon className="w-4 h-4 text-green-500 mr-1" />
                  <span className="text-green-600">+7%</span>
                  <span className="text-slate-500 ml-1">vs last period</span>
                </div>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <ExclamationTriangleIcon className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white/70 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium">Avg Resolution Time</p>
                <p className="text-2xl font-bold text-slate-900">
                  {metrics?.average_resolution_time || 0}h
                </p>
                <div className="flex items-center mt-2 text-sm">
                  <ArrowTrendingDownIcon className="w-4 h-4 text-green-500 mr-1" />
                  <span className="text-green-600">-4h</span>
                  <span className="text-slate-500 ml-1">vs last period</span>
                </div>
              </div>
              <div className="p-3 bg-orange-100 rounded-lg">
                <CalendarDaysIcon className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Satisfaction Trend Chart */}
          <div className="bg-white/70 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-slate-900">Satisfaction Score Trend</h3>
              <div className="flex items-center space-x-2">
                <select
                  value={selectedMetric}
                  onChange={(e) => setSelectedMetric(e.target.value as any)}
                  className="px-3 py-1 text-sm bg-white/50 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="satisfaction">Satisfaction</option>
                  <option value="nps">NPS Score</option>
                  <option value="resolution">Resolution Time</option>
                  <option value="volume">Feedback Volume</option>
                </select>
              </div>
            </div>
            
            <div className="h-64 flex items-center justify-center">
              {/* Placeholder for chart */}
              <div className="w-full h-full bg-gradient-to-r from-indigo-100 to-blue-100 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <ChartBarIcon className="w-12 h-12 text-indigo-400 mx-auto mb-2" />
                  <p className="text-slate-600">Satisfaction trend chart</p>
                  <p className="text-sm text-slate-500">Chart visualization would appear here</p>
                </div>
              </div>
            </div>
          </div>

          {/* Complaint Categories */}
          <div className="bg-white/70 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-slate-900">Complaint Categories</h3>
              <span className="text-sm text-slate-600">
                {complaintCategories.reduce((sum, cat) => sum + cat.count, 0)} total complaints
              </span>
            </div>
            
            <div className="space-y-4">
              {complaintCategories.map((category, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 flex-1">
                    <div className="w-3 h-3 rounded-full" style={{ 
                      backgroundColor: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'][index] 
                    }}></div>
                    <span className="text-sm font-medium text-slate-900">{category.category}</span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div 
                        className="h-2 rounded-full" 
                        style={{ 
                          width: `${category.percentage}%`,
                          backgroundColor: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'][index]
                        }}
                      ></div>
                    </div>
                    <span className="text-sm text-slate-600 w-8">{category.count}</span>
                    <span className="text-sm text-slate-500 w-8">{category.percentage}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Response Time Analysis */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2 bg-white/70 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-6">Response Time Distribution</h3>
            <div className="h-48 flex items-center justify-center">
              <div className="w-full h-full bg-gradient-to-r from-green-100 to-yellow-100 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <ChartBarIcon className="w-12 h-12 text-green-400 mx-auto mb-2" />
                  <p className="text-slate-600">Response time histogram</p>
                  <p className="text-sm text-slate-500">Shows distribution of resolution times</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white/70 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-6">Performance Summary</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Within SLA</span>
                <span className="text-lg font-bold text-green-600">87%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Overdue</span>
                <span className="text-lg font-bold text-red-600">8%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Escalated</span>
                <span className="text-lg font-bold text-orange-600">5%</span>
              </div>
              <div className="pt-4 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Avg First Response</span>
                  <span className="text-lg font-bold text-slate-900">2.5h</span>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-sm text-slate-600">Avg Resolution</span>
                  <span className="text-lg font-bold text-slate-900">18h</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Branch Comparison */}
        <div className="bg-white/70 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-slate-900">Branch Performance Comparison</h3>
            <select className="px-3 py-2 text-sm bg-white/50 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option>All Metrics</option>
              <option>Satisfaction Score</option>
              <option>Response Time</option>
              <option>Resolution Rate</option>
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50/80 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Branch
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Total Feedback
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Satisfaction Score
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    NPS Score
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Resolution Rate
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Avg Response Time
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {[
                  { branch: 'Main Branch', feedback: 156, satisfaction: 4.2, nps: 8, resolution: 92, time: '2.1h' },
                  { branch: 'Downtown Branch', feedback: 89, satisfaction: 4.1, nps: 7, resolution: 88, time: '2.8h' },
                  { branch: 'Mall Branch', feedback: 134, satisfaction: 4.3, nps: 9, resolution: 95, time: '1.9h' },
                ].map((branch) => (
                  <tr key={branch.branch} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-4 font-medium text-slate-900">{branch.branch}</td>
                    <td className="px-4 py-4 text-slate-600">{branch.feedback}</td>
                    <td className="px-4 py-4">
                      <div className="flex items-center">
                        <span className="text-slate-900 font-medium">{branch.satisfaction}/5</span>
                        <div className="ml-2 flex space-x-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <div
                              key={star}
                              className={`w-3 h-3 rounded-full ${
                                star <= Math.round(branch.satisfaction) 
                                  ? 'bg-yellow-400' 
                                  : 'bg-gray-200'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        branch.nps >= 9 
                          ? 'bg-green-100 text-green-800'
                          : branch.nps >= 7
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {branch.nps}/10
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center">
                        <span className="text-slate-900 font-medium">{branch.resolution}%</span>
                        <div className="ml-2 w-16 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-green-600 h-2 rounded-full" 
                            style={{ width: `${branch.resolution}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-slate-600">{branch.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}