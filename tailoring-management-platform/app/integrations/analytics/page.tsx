'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ChartBarIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { supabase } from '@/lib/supabase';
import { IntegrationAnalytics } from '@/types/integrations';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

export default function IntegrationAnalytics() {
  const [dateRange, setDateRange] = useState<'week' | 'month' | 'quarter'>('week');

  // Fetch analytics data
  const { data: analytics, isLoading } = useQuery({
    queryKey: ['integration-analytics', dateRange],
    queryFn: async () => {
      const daysBack = dateRange === 'week' ? 7 : dateRange === 'month' ? 30 : 90;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysBack);

      const { data, error } = await supabase
        .from('integration_analytics')
        .select(`
          *,
          integration_connections!inner(
            connection_name,
            integration_providers!inner(provider_name, provider_type)
          )
        `)
        .gte('date', startDate.toISOString().split('T')[0])
        .order('date', { ascending: true });

      if (error) throw error;
      return data as IntegrationAnalytics[];
    },
    refetchInterval: 60000,
  });

  // Aggregate data by date
  const dailyData = analytics?.reduce((acc, item) => {
    if (!acc[item.date]) {
      acc[item.date] = {
        total_requests: 0,
        successful_requests: 0,
        failed_requests: 0,
        avg_response_time: 0,
      };
    }
    acc[item.date].total_requests += item.total_requests;
    acc[item.date].successful_requests += item.successful_requests;
    acc[item.date].failed_requests += item.failed_requests;
    acc[item.date].avg_response_time += item.avg_response_time_ms;
    return acc;
  }, {} as Record<string, any>);

  const chartData = {
    labels: Object.keys(dailyData || {}),
    datasets: [
      {
        label: 'Successful Requests',
        data: Object.values(dailyData || {}).map((d: any) => d.successful_requests),
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
      },
      {
        label: 'Failed Requests',
        data: Object.values(dailyData || {}).map((d: any) => d.failed_requests),
        borderColor: 'rgb(239, 68, 68)',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
      },
    ],
  };

  // Response time chart
  const responseTimeData = {
    labels: Object.keys(dailyData || {}),
    datasets: [
      {
        label: 'Avg Response Time (ms)',
        data: Object.values(dailyData || {}).map((d: any) => d.avg_response_time),
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 1,
      },
    ],
  };

  // Provider distribution
  const providerData = analytics?.reduce((acc, item) => {
    const provider = (item as any).integration_connections?.integration_providers?.provider_name;
    if (!acc[provider]) {
      acc[provider] = 0;
    }
    acc[provider] += item.total_requests;
    return acc;
  }, {} as Record<string, number>);

  const providerChartData = {
    labels: Object.keys(providerData || {}),
    datasets: [
      {
        data: Object.values(providerData || {}),
        backgroundColor: [
          'rgba(59, 130, 246, 0.5)',
          'rgba(16, 185, 129, 0.5)',
          'rgba(245, 158, 11, 0.5)',
          'rgba(139, 92, 246, 0.5)',
          'rgba(236, 72, 153, 0.5)',
        ],
      },
    ],
  };

  const totalStats = {
    totalRequests: analytics?.reduce((sum, a) => sum + a.total_requests, 0) || 0,
    successfulRequests: analytics?.reduce((sum, a) => sum + a.successful_requests, 0) || 0,
    failedRequests: analytics?.reduce((sum, a) => sum + a.failed_requests, 0) || 0,
    avgResponseTime:
      analytics && analytics.length > 0
        ? Math.round(
            analytics.reduce((sum, a) => sum + a.avg_response_time_ms, 0) / analytics.length
          )
        : 0,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Integration Analytics
            </h1>
            <p className="text-gray-600">
              Monitor usage, performance, and costs across all integrations
            </p>
          </div>

          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="week">Last 7 Days</option>
            <option value="month">Last 30 Days</option>
            <option value="quarter">Last 90 Days</option>
          </select>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-lg">
            <div className="flex items-center gap-3 mb-2">
              <ChartBarIcon className="w-8 h-8 text-blue-600" />
              <span className="text-3xl font-bold text-gray-900">{totalStats.totalRequests}</span>
            </div>
            <p className="text-sm text-gray-600">Total API Calls</p>
          </div>

          <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-lg">
            <div className="flex items-center gap-3 mb-2">
              <CheckCircleIcon className="w-8 h-8 text-green-600" />
              <span className="text-3xl font-bold text-gray-900">{totalStats.successfulRequests}</span>
            </div>
            <p className="text-sm text-gray-600">Successful Requests</p>
            <p className="text-xs text-green-600 mt-1">
              {totalStats.totalRequests > 0
                ? ((totalStats.successfulRequests / totalStats.totalRequests) * 100).toFixed(1)
                : 0}% success rate
            </p>
          </div>

          <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-lg">
            <div className="flex items-center gap-3 mb-2">
              <XCircleIcon className="w-8 h-8 text-red-600" />
              <span className="text-3xl font-bold text-gray-900">{totalStats.failedRequests}</span>
            </div>
            <p className="text-sm text-gray-600">Failed Requests</p>
            <p className="text-xs text-red-600 mt-1">
              {totalStats.totalRequests > 0
                ? ((totalStats.failedRequests / totalStats.totalRequests) * 100).toFixed(1)
                : 0}% error rate
            </p>
          </div>

          <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-lg">
            <div className="flex items-center gap-3 mb-2">
              <ClockIcon className="w-8 h-8 text-purple-600" />
              <span className="text-3xl font-bold text-gray-900">{totalStats.avgResponseTime}</span>
            </div>
            <p className="text-sm text-gray-600">Avg Response Time</p>
            <p className="text-xs text-gray-500 mt-1">milliseconds</p>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Request Volume Chart */}
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-lg">
            <h3 className="font-semibold text-gray-900 mb-4">Request Volume</h3>
            {isLoading ? (
              <div className="h-64 flex items-center justify-center text-gray-500">
                Loading...
              </div>
            ) : (
              <div className="h-64">
                <Line
                  data={chartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'bottom',
                      },
                    },
                  }}
                />
              </div>
            )}
          </div>

          {/* Response Time Chart */}
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-lg">
            <h3 className="font-semibold text-gray-900 mb-4">Response Time Trends</h3>
            {isLoading ? (
              <div className="h-64 flex items-center justify-center text-gray-500">
                Loading...
              </div>
            ) : (
              <div className="h-64">
                <Bar
                  data={responseTimeData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        display: false,
                      },
                    },
                  }}
                />
              </div>
            )}
          </div>
        </div>

        {/* Provider Distribution */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-lg">
          <h3 className="font-semibold text-gray-900 mb-4">Usage by Provider</h3>
          {isLoading ? (
            <div className="h-64 flex items-center justify-center text-gray-500">
              Loading...
            </div>
          ) : (
            <div className="h-64 max-w-md mx-auto">
              <Doughnut
                data={providerChartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'right',
                    },
                  },
                }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
