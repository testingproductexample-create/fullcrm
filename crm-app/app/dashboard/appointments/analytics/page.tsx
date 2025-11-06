'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import {
  Calendar,
  TrendingUp,
  TrendingDown,
  Users,
  Clock,
  DollarSign,
  BarChart3,
  PieChart,
  ArrowLeft,
  Download
} from 'lucide-react';
import Link from 'next/link';

interface AnalyticsData {
  totalAppointments: number;
  confirmedAppointments: number;
  completedAppointments: number;
  cancelledAppointments: number;
  noShowAppointments: number;
  totalRevenue: number;
  averageRating: number;
  popularTimes: { hour: number; count: number }[];
  typeBreakdown: { type: string; count: number }[];
  statusBreakdown: { status: string; count: number }[];
  monthlyTrend: { month: string; count: number }[];
}

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<'week' | 'month' | 'quarter' | 'year'>('month');
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalAppointments: 0,
    confirmedAppointments: 0,
    completedAppointments: 0,
    cancelledAppointments: 0,
    noShowAppointments: 0,
    totalRevenue: 0,
    averageRating: 0,
    popularTimes: [],
    typeBreakdown: [],
    statusBreakdown: [],
    monthlyTrend: []
  });

  useEffect(() => {
    loadAnalytics();
  }, [dateRange]);

  const loadAnalytics = async () => {
    try {
      setError(null);
      
      // Calculate date range
      const now = new Date();
      const startDate = new Date();
      
      switch (dateRange) {
        case 'week':
          startDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(now.getMonth() - 1);
          break;
        case 'quarter':
          startDate.setMonth(now.getMonth() - 3);
          break;
        case 'year':
          startDate.setFullYear(now.getFullYear() - 1);
          break;
      }

      // Load appointments within date range
      const { data: appointments, error: appointmentsError } = await supabase
        .from('appointments')
        .select(`
          *,
          appointment_types (
            type_name,
            price
          )
        `)
        .gte('appointment_date', startDate.toISOString().split('T')[0]);

      if (appointmentsError) throw appointmentsError;

      // Calculate analytics
      const total = appointments?.length || 0;
      const confirmed = appointments?.filter(a => a.status === 'confirmed').length || 0;
      const completed = appointments?.filter(a => a.status === 'completed').length || 0;
      const cancelled = appointments?.filter(a => a.status === 'cancelled').length || 0;
      const noShow = appointments?.filter(a => a.status === 'no_show').length || 0;

      // Calculate revenue
      const revenue = appointments?.reduce((sum, apt) => {
        if (apt.status === 'completed') {
          return sum + (apt.appointment_types?.price || 0);
        }
        return sum;
      }, 0) || 0;

      // Calculate average rating
      const ratingsSum = appointments?.reduce((sum, apt) => sum + (apt.customer_rating || 0), 0) || 0;
      const ratingsCount = appointments?.filter(a => a.customer_rating).length || 0;
      const avgRating = ratingsCount > 0 ? ratingsSum / ratingsCount : 0;

      // Popular times (by hour)
      const timeMap = new Map<number, number>();
      appointments?.forEach(apt => {
        const hour = parseInt(apt.start_time.split(':')[0]);
        timeMap.set(hour, (timeMap.get(hour) || 0) + 1);
      });
      const popularTimes = Array.from(timeMap.entries())
        .map(([hour, count]) => ({ hour, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Type breakdown
      const typeMap = new Map<string, number>();
      appointments?.forEach(apt => {
        const typeName = apt.appointment_types?.type_name || 'Unknown';
        typeMap.set(typeName, (typeMap.get(typeName) || 0) + 1);
      });
      const typeBreakdown = Array.from(typeMap.entries())
        .map(([type, count]) => ({ type, count }))
        .sort((a, b) => b.count - a.count);

      // Status breakdown
      const statusMap = new Map<string, number>();
      appointments?.forEach(apt => {
        statusMap.set(apt.status, (statusMap.get(apt.status) || 0) + 1);
      });
      const statusBreakdown = Array.from(statusMap.entries())
        .map(([status, count]) => ({ status, count }))
        .sort((a, b) => b.count - a.count);

      // Monthly trend (last 6 months)
      const monthlyMap = new Map<string, number>();
      appointments?.forEach(apt => {
        const month = new Date(apt.appointment_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        monthlyMap.set(month, (monthlyMap.get(month) || 0) + 1);
      });
      const monthlyTrend = Array.from(monthlyMap.entries())
        .map(([month, count]) => ({ month, count }))
        .slice(-6);

      setAnalytics({
        totalAppointments: total,
        confirmedAppointments: confirmed,
        completedAppointments: completed,
        cancelledAppointments: cancelled,
        noShowAppointments: noShow,
        totalRevenue: revenue,
        averageRating: avgRating,
        popularTimes,
        typeBreakdown,
        statusBreakdown,
        monthlyTrend
      });
    } catch (error) {
      console.error('Error loading analytics:', error);
      setError('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const completionRate = analytics.totalAppointments > 0
    ? ((analytics.completedAppointments / analytics.totalAppointments) * 100).toFixed(1)
    : '0';

  const cancellationRate = analytics.totalAppointments > 0
    ? ((analytics.cancelledAppointments / analytics.totalAppointments) * 100).toFixed(1)
    : '0';

  const noShowRate = analytics.totalAppointments > 0
    ? ((analytics.noShowAppointments / analytics.totalAppointments) * 100).toFixed(1)
    : '0';

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="glass-card p-8">
          <div className="animate-pulse">
            <div className="h-8 bg-neutral-200 rounded w-1/4 mb-4"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard/appointments"
              className="p-2 hover:bg-glass-light rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-h2 font-bold text-neutral-900">Appointment Analytics</h1>
              <p className="text-body text-neutral-700 mt-1">
                Insights and statistics for your appointments
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as any)}
              className="px-4 py-2 border border-glass-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="week">Last 7 Days</option>
              <option value="month">Last Month</option>
              <option value="quarter">Last 3 Months</option>
              <option value="year">Last Year</option>
            </select>
            <button className="btn-secondary flex items-center gap-2">
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="glass-card p-4 border-l-4 border-red-500 bg-red-50">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-small text-neutral-700">Total Appointments</p>
              <p className="text-h3 font-bold text-neutral-900 mt-1">{analytics.totalAppointments}</p>
              <p className="text-tiny text-green-600 mt-1 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                {completionRate}% completed
              </p>
            </div>
            <div className="p-3 rounded-lg bg-blue-50">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="glass-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-small text-neutral-700">Total Revenue</p>
              <p className="text-h3 font-bold text-neutral-900 mt-1">AED {analytics.totalRevenue.toLocaleString()}</p>
              <p className="text-tiny text-neutral-600 mt-1">
                {analytics.completedAppointments} completed
              </p>
            </div>
            <div className="p-3 rounded-lg bg-green-50">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="glass-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-small text-neutral-700">Avg Rating</p>
              <p className="text-h3 font-bold text-neutral-900 mt-1">{analytics.averageRating.toFixed(1)}/5.0</p>
              <p className="text-tiny text-neutral-600 mt-1">
                Customer satisfaction
              </p>
            </div>
            <div className="p-3 rounded-lg bg-yellow-50">
              <TrendingUp className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="glass-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-small text-neutral-700">No-Show Rate</p>
              <p className="text-h3 font-bold text-neutral-900 mt-1">{noShowRate}%</p>
              <p className="text-tiny text-red-600 mt-1 flex items-center gap-1">
                {analytics.noShowAppointments} no-shows
              </p>
            </div>
            <div className="p-3 rounded-lg bg-red-50">
              <TrendingDown className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Breakdown */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-h3 font-bold text-neutral-900 flex items-center gap-2">
              <PieChart className="w-5 h-5" />
              Status Breakdown
            </h2>
          </div>
          <div className="space-y-3">
            {analytics.statusBreakdown.map((item, index) => {
              const percentage = (item.count / analytics.totalAppointments * 100).toFixed(1);
              const colors = ['bg-green-500', 'bg-blue-500', 'bg-orange-500', 'bg-red-500', 'bg-gray-500'];
              const color = colors[index % colors.length];
              
              return (
                <div key={item.status}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-small text-neutral-700 capitalize">
                      {item.status.replace('_', ' ')}
                    </span>
                    <span className="text-small font-medium text-neutral-900">
                      {item.count} ({percentage}%)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${color} transition-all duration-500`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Type Breakdown */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-h3 font-bold text-neutral-900 flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Appointment Types
            </h2>
          </div>
          <div className="space-y-3">
            {analytics.typeBreakdown.slice(0, 6).map((item, index) => {
              const percentage = (item.count / analytics.totalAppointments * 100).toFixed(1);
              const colors = ['bg-blue-500', 'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500', 'bg-cyan-500'];
              const color = colors[index % colors.length];
              
              return (
                <div key={item.type}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-small text-neutral-700">{item.type}</span>
                    <span className="text-small font-medium text-neutral-900">
                      {item.count} ({percentage}%)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${color} transition-all duration-500`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Popular Times */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-h3 font-bold text-neutral-900 flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Most Popular Times
          </h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {analytics.popularTimes.map((item) => {
            const maxCount = Math.max(...analytics.popularTimes.map(t => t.count));
            const percentage = (item.count / maxCount * 100);
            
            return (
              <div key={item.hour} className="text-center">
                <div className="mb-2 flex items-end justify-center h-24">
                  <div
                    className="w-full bg-primary-500 rounded-t-lg transition-all duration-500"
                    style={{ height: `${percentage}%` }}
                  />
                </div>
                <p className="text-small font-medium text-neutral-900">
                  {item.hour.toString().padStart(2, '0')}:00
                </p>
                <p className="text-tiny text-neutral-600">{item.count} appointments</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Monthly Trend */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-h3 font-bold text-neutral-900 flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Monthly Trend
          </h2>
        </div>
        <div className="space-y-3">
          {analytics.monthlyTrend.map((item) => {
            const maxCount = Math.max(...analytics.monthlyTrend.map(t => t.count));
            const percentage = (item.count / maxCount * 100);
            
            return (
              <div key={item.month}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-small text-neutral-700">{item.month}</span>
                  <span className="text-small font-medium text-neutral-900">{item.count} appointments</span>
                </div>
                <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary-400 to-primary-600 transition-all duration-500"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Insights */}
      <div className="glass-card p-6">
        <h2 className="text-h3 font-bold text-neutral-900 mb-4">Key Insights</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-blue-50 rounded-lg">
            <p className="text-small font-medium text-blue-900 mb-1">Completion Rate</p>
            <p className="text-h4 font-bold text-blue-700">{completionRate}%</p>
            <p className="text-tiny text-blue-700 mt-1">
              {analytics.completedAppointments} of {analytics.totalAppointments} appointments completed
            </p>
          </div>
          
          <div className="p-4 bg-orange-50 rounded-lg">
            <p className="text-small font-medium text-orange-900 mb-1">Cancellation Rate</p>
            <p className="text-h4 font-bold text-orange-700">{cancellationRate}%</p>
            <p className="text-tiny text-orange-700 mt-1">
              {analytics.cancelledAppointments} cancelled appointments
            </p>
          </div>
          
          <div className="p-4 bg-green-50 rounded-lg">
            <p className="text-small font-medium text-green-900 mb-1">Average Revenue</p>
            <p className="text-h4 font-bold text-green-700">
              AED {analytics.completedAppointments > 0 
                ? (analytics.totalRevenue / analytics.completedAppointments).toFixed(2)
                : '0.00'
              }
            </p>
            <p className="text-tiny text-green-700 mt-1">
              Per completed appointment
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
