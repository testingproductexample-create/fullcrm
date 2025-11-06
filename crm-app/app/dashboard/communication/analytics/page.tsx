'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { 
  BarChart3,
  TrendingUp,
  TrendingDown,
  MessageSquare,
  Mail,
  Smartphone,
  MessageCircle,
  Users,
  Clock,
  Target,
  Eye,
  MousePointer,
  CheckCircle,
  XCircle,
  Calendar,
  Filter,
  Download,
  RefreshCw,
  ArrowUp,
  ArrowDown,
  Minus,
  Star,
  Zap,
  Activity
} from 'lucide-react';

interface AnalyticsData {
  date: string;
  channel_type: string;
  message_type: string;
  messages_sent: number;
  messages_delivered: number;
  messages_read: number;
  messages_failed: number;
  response_rate: number;
  average_response_time: number;
  satisfaction_score: number;
}

interface ChannelMetrics {
  channel: string;
  sent: number;
  delivered: number;
  read: number;
  failed: number;
  deliveryRate: number;
  readRate: number;
  responseRate: number;
  avgResponseTime: number;
  satisfactionScore: number;
  trend: 'up' | 'down' | 'stable';
  trendPercentage: number;
}

interface TimeMetrics {
  hour: number;
  sent: number;
  delivered: number;
  openRate: number;
}

export default function CommunicationAnalytics() {
  const { user } = useAuth();
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData[]>([]);
  const [channelMetrics, setChannelMetrics] = useState<ChannelMetrics[]>([]);
  const [timeMetrics, setTimeMetrics] = useState<TimeMetrics[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('7days');
  const [selectedChannel, setSelectedChannel] = useState('all');
  const [totalStats, setTotalStats] = useState({
    totalSent: 0,
    totalDelivered: 0,
    totalRead: 0,
    totalFailed: 0,
    avgDeliveryRate: 0,
    avgReadRate: 0,
    avgResponseTime: 0,
    avgSatisfaction: 0
  });

  useEffect(() => {
    if (user?.organization_id) {
      fetchAnalyticsData();
    }
  }, [user?.organization_id, selectedPeriod]);

  const fetchAnalyticsData = async () => {
    try {
      const organizationId = user?.organization_id;
      if (!organizationId) return;

      // Calculate date range
      const daysBack = selectedPeriod === '7days' ? 7 : 
                      selectedPeriod === '30days' ? 30 : 
                      selectedPeriod === '90days' ? 90 : 365;
      const fromDate = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      // Fetch communication analytics
      const { data: analyticsData } = await supabase
        .from('communication_analytics')
        .select('*')
        .eq('organization_id', organizationId)
        .gte('date', fromDate)
        .order('date', { ascending: true });

      setAnalyticsData(analyticsData || []);

      // Process channel metrics
      const channels = ['SMS', 'Email', 'WhatsApp', 'Push'];
      const processedChannelMetrics: ChannelMetrics[] = channels.map(channel => {
        const channelData = analyticsData?.filter(d => d.channel_type === channel) || [];
        
        const sent = channelData.reduce((sum, d) => sum + (d.messages_sent || 0), 0);
        const delivered = channelData.reduce((sum, d) => sum + (d.messages_delivered || 0), 0);
        const read = channelData.reduce((sum, d) => sum + (d.messages_read || 0), 0);
        const failed = channelData.reduce((sum, d) => sum + (d.messages_failed || 0), 0);
        
        const deliveryRate = sent > 0 ? (delivered / sent) * 100 : 0;
        const readRate = delivered > 0 ? (read / delivered) * 100 : 0;
        const responseRate = channelData.reduce((sum, d) => sum + (d.response_rate || 0), 0) / Math.max(channelData.length, 1);
        const avgResponseTime = channelData.reduce((sum, d) => sum + (d.average_response_time || 0), 0) / Math.max(channelData.length, 1);
        const satisfactionScore = channelData.reduce((sum, d) => sum + (d.satisfaction_score || 0), 0) / Math.max(channelData.length, 1);
        
        // Calculate trend (mock calculation)
        const recentData = channelData.slice(-3);
        const olderData = channelData.slice(0, Math.max(channelData.length - 3, 1));
        const recentAvg = recentData.reduce((sum, d) => sum + (d.messages_delivered || 0), 0) / Math.max(recentData.length, 1);
        const olderAvg = olderData.reduce((sum, d) => sum + (d.messages_delivered || 0), 0) / Math.max(olderData.length, 1);
        
        let trend: 'up' | 'down' | 'stable' = 'stable';
        let trendPercentage = 0;
        
        if (olderAvg > 0) {
          const change = ((recentAvg - olderAvg) / olderAvg) * 100;
          trendPercentage = Math.abs(change);
          if (change > 5) trend = 'up';
          else if (change < -5) trend = 'down';
        }

        return {
          channel,
          sent,
          delivered,
          read,
          failed,
          deliveryRate: Math.round(deliveryRate * 100) / 100,
          readRate: Math.round(readRate * 100) / 100,
          responseRate: Math.round(responseRate * 100) / 100,
          avgResponseTime: Math.round(avgResponseTime),
          satisfactionScore: Math.round(satisfactionScore * 10) / 10,
          trend,
          trendPercentage: Math.round(trendPercentage * 10) / 10
        };
      });

      setChannelMetrics(processedChannelMetrics);

      // Generate time-based metrics (mock data for hourly patterns)
      const timeMetrics: TimeMetrics[] = Array.from({ length: 24 }, (_, hour) => {
        const baseActivity = hour >= 8 && hour <= 20 ? 50 + Math.random() * 100 : 10 + Math.random() * 30;
        const peakHours = [10, 11, 14, 15, 16]; // Peak hours
        const multiplier = peakHours.includes(hour) ? 1.5 : 1;
        
        return {
          hour,
          sent: Math.floor(baseActivity * multiplier),
          delivered: Math.floor(baseActivity * multiplier * 0.95),
          openRate: Math.round((60 + Math.random() * 30) * 100) / 100
        };
      });

      setTimeMetrics(timeMetrics);

      // Calculate total stats
      const totalSent = analyticsData?.reduce((sum, d) => sum + (d.messages_sent || 0), 0) || 0;
      const totalDelivered = analyticsData?.reduce((sum, d) => sum + (d.messages_delivered || 0), 0) || 0;
      const totalRead = analyticsData?.reduce((sum, d) => sum + (d.messages_read || 0), 0) || 0;
      const totalFailed = analyticsData?.reduce((sum, d) => sum + (d.messages_failed || 0), 0) || 0;
      
      const avgDeliveryRate = totalSent > 0 ? (totalDelivered / totalSent) * 100 : 0;
      const avgReadRate = totalDelivered > 0 ? (totalRead / totalDelivered) * 100 : 0;
      
      const responseTimeData = analyticsData?.filter(d => d.average_response_time) || [];
      const avgResponseTime = responseTimeData.length > 0 
        ? responseTimeData.reduce((sum, d) => sum + d.average_response_time, 0) / responseTimeData.length 
        : 0;
      
      const satisfactionData = analyticsData?.filter(d => d.satisfaction_score) || [];
      const avgSatisfaction = satisfactionData.length > 0
        ? satisfactionData.reduce((sum, d) => sum + d.satisfaction_score, 0) / satisfactionData.length
        : 0;

      setTotalStats({
        totalSent,
        totalDelivered,
        totalRead,
        totalFailed,
        avgDeliveryRate: Math.round(avgDeliveryRate * 100) / 100,
        avgReadRate: Math.round(avgReadRate * 100) / 100,
        avgResponseTime: Math.round(avgResponseTime),
        avgSatisfaction: Math.round(avgSatisfaction * 10) / 10
      });
    } catch (error) {
      console.error('Error fetching analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'SMS': return Smartphone;
      case 'Email': return Mail;
      case 'WhatsApp': return MessageCircle;
      case 'Push': return MessageSquare;
      default: return MessageSquare;
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return ArrowUp;
      case 'down': return ArrowDown;
      default: return Minus;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'up': return 'text-emerald-600';
      case 'down': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getTimeLabel = (hour: number) => {
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}${period}`;
  };

  const filteredChannelMetrics = selectedChannel === 'all' 
    ? channelMetrics 
    : channelMetrics.filter(m => m.channel === selectedChannel);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading communication analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-teal-500 rounded-xl flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Communication Analytics</h1>
                <p className="text-gray-600">Track performance and insights across all channels</p>
              </div>
            </div>
            <div className="flex gap-3">
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              >
                <option value="7days">Last 7 days</option>
                <option value="30days">Last 30 days</option>
                <option value="90days">Last 90 days</option>
                <option value="365days">Last year</option>
              </select>
              <button
                onClick={() => fetchAnalyticsData()}
                className="bg-white/60 backdrop-blur-sm border border-white/20 text-gray-700 px-4 py-2 rounded-xl hover:bg-white/80 transition-all duration-200 flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
              <button className="bg-teal-600/90 backdrop-blur-sm text-white px-4 py-2 rounded-xl hover:bg-teal-700 transition-all duration-200 flex items-center gap-2">
                <Download className="w-4 h-4" />
                Export Report
              </button>
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/60 backdrop-blur-sm border border-white/20 rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Messages Sent</p>
                <p className="text-2xl font-bold text-gray-900">{totalStats.totalSent.toLocaleString()}</p>
                <p className="text-xs text-teal-600 flex items-center gap-1 mt-1">
                  <MessageSquare className="w-3 h-3" />
                  All channels
                </p>
              </div>
              <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-teal-600" />
              </div>
            </div>
          </div>

          <div className="bg-white/60 backdrop-blur-sm border border-white/20 rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Delivery Rate</p>
                <p className="text-2xl font-bold text-emerald-600">{totalStats.avgDeliveryRate}%</p>
                <p className="text-xs text-gray-600 flex items-center gap-1 mt-1">
                  <CheckCircle className="w-3 h-3" />
                  Successfully delivered
                </p>
              </div>
              <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
          </div>

          <div className="bg-white/60 backdrop-blur-sm border border-white/20 rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Read Rate</p>
                <p className="text-2xl font-bold text-blue-600">{totalStats.avgReadRate}%</p>
                <p className="text-xs text-gray-600 flex items-center gap-1 mt-1">
                  <Eye className="w-3 h-3" />
                  Messages opened
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Eye className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white/60 backdrop-blur-sm border border-white/20 rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Avg Response Time</p>
                <p className="text-2xl font-bold text-purple-600">{totalStats.avgResponseTime}s</p>
                <p className="text-xs text-gray-600 flex items-center gap-1 mt-1">
                  <Clock className="w-3 h-3" />
                  Customer replies
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <Clock className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Channel Performance */}
          <div className="lg:col-span-2">
            <div className="bg-white/60 backdrop-blur-sm border border-white/20 rounded-2xl p-6 mb-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Channel Performance</h2>
                <select
                  value={selectedChannel}
                  onChange={(e) => setSelectedChannel(e.target.value)}
                  className="px-3 py-1 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                >
                  <option value="all">All Channels</option>
                  <option value="SMS">SMS</option>
                  <option value="Email">Email</option>
                  <option value="WhatsApp">WhatsApp</option>
                  <option value="Push">Push</option>
                </select>
              </div>

              <div className="space-y-4">
                {filteredChannelMetrics.map((metric) => {
                  const ChannelIcon = getChannelIcon(metric.channel);
                  const TrendIcon = getTrendIcon(metric.trend);
                  
                  return (
                    <div key={metric.channel} className="bg-gray-50/50 border border-gray-100 rounded-xl p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                            <ChannelIcon className="w-5 h-5 text-gray-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">{metric.channel}</h3>
                            <p className="text-sm text-gray-600">{metric.sent.toLocaleString()} messages sent</p>
                          </div>
                        </div>
                        <div className={`flex items-center gap-1 ${getTrendColor(metric.trend)}`}>
                          <TrendIcon className="w-4 h-4" />
                          <span className="text-sm font-medium">{metric.trendPercentage}%</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <p className="text-xs text-gray-600 mb-1">Delivery Rate</p>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-emerald-500 rounded-full transition-all duration-200"
                                style={{ width: `${metric.deliveryRate}%` }}
                              ></div>
                            </div>
                            <span className="text-sm font-medium text-gray-900">{metric.deliveryRate}%</span>
                          </div>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600 mb-1">Read Rate</p>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-blue-500 rounded-full transition-all duration-200"
                                style={{ width: `${metric.readRate}%` }}
                              ></div>
                            </div>
                            <span className="text-sm font-medium text-gray-900">{metric.readRate}%</span>
                          </div>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600 mb-1">Response Rate</p>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-purple-500 rounded-full transition-all duration-200"
                                style={{ width: `${metric.responseRate}%` }}
                              ></div>
                            </div>
                            <span className="text-sm font-medium text-gray-900">{metric.responseRate}%</span>
                          </div>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600 mb-1">Satisfaction</p>
                          <div className="flex items-center gap-2">
                            <Star className="w-3 h-3 text-yellow-500 fill-current" />
                            <span className="text-sm font-medium text-gray-900">{metric.satisfactionScore}/5</span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-3 gap-4 text-center">
                        <div>
                          <p className="text-lg font-bold text-emerald-600">{metric.delivered.toLocaleString()}</p>
                          <p className="text-xs text-gray-600">Delivered</p>
                        </div>
                        <div>
                          <p className="text-lg font-bold text-blue-600">{metric.read.toLocaleString()}</p>
                          <p className="text-xs text-gray-600">Read</p>
                        </div>
                        <div>
                          <p className="text-lg font-bold text-red-600">{metric.failed.toLocaleString()}</p>
                          <p className="text-xs text-gray-600">Failed</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Hourly Activity Chart */}
            <div className="bg-white/60 backdrop-blur-sm border border-white/20 rounded-2xl p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Activity by Hour</h2>
              <div className="space-y-2">
                {timeMetrics.map((metric) => (
                  <div key={metric.hour} className="flex items-center gap-4">
                    <div className="w-12 text-sm text-gray-600">
                      {getTimeLabel(metric.hour)}
                    </div>
                    <div className="flex-1 flex items-center gap-4">
                      <div className="flex-1 h-6 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-teal-500 to-blue-500 rounded-full transition-all duration-200"
                          style={{ width: `${(metric.sent / Math.max(...timeMetrics.map(m => m.sent))) * 100}%` }}
                        ></div>
                      </div>
                      <div className="w-16 text-sm text-gray-600">{metric.sent}</div>
                      <div className="w-16 text-sm text-gray-900 font-medium">{metric.openRate}%</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* Key Insights */}
            <div className="bg-white/60 backdrop-blur-sm border border-white/20 rounded-2xl p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Key Insights</h3>
              <div className="space-y-4">
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                    <span className="text-sm font-medium text-emerald-900">Best Performing</span>
                  </div>
                  <p className="text-sm text-emerald-800">
                    WhatsApp has the highest read rate at {channelMetrics.find(m => m.channel === 'WhatsApp')?.readRate}%
                  </p>
                </div>
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-900">Peak Hours</span>
                  </div>
                  <p className="text-sm text-blue-800">
                    Most activity occurs between 10 AM - 4 PM with 68% higher engagement
                  </p>
                </div>
                <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <Star className="w-4 h-4 text-purple-600" />
                    <span className="text-sm font-medium text-purple-900">Satisfaction</span>
                  </div>
                  <p className="text-sm text-purple-800">
                    Average customer satisfaction is {totalStats.avgSatisfaction}/5 across all channels
                  </p>
                </div>
              </div>
            </div>

            {/* Message Types Breakdown */}
            <div className="bg-white/60 backdrop-blur-sm border border-white/20 rounded-2xl p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Message Types</h3>
              <div className="space-y-3">
                {[
                  { type: 'Transactional', count: 2450, percentage: 45, color: 'bg-blue-500' },
                  { type: 'Marketing', count: 1680, percentage: 31, color: 'bg-purple-500' },
                  { type: 'Reminders', count: 890, percentage: 16, color: 'bg-amber-500' },
                  { type: 'Notifications', count: 430, percentage: 8, color: 'bg-emerald-500' }
                ].map((item) => (
                  <div key={item.type} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${item.color}`}></div>
                      <span className="text-sm text-gray-700">{item.type}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">{item.count}</span>
                      <span className="text-xs text-gray-500">({item.percentage}%)</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white/60 backdrop-blur-sm border border-white/20 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button className="w-full text-left p-3 bg-gray-50/50 rounded-xl hover:bg-gray-50 transition-colors flex items-center gap-3">
                  <Activity className="w-5 h-5 text-teal-600" />
                  <div>
                    <p className="font-medium text-gray-900">Real-time Dashboard</p>
                    <p className="text-xs text-gray-600">Live activity monitoring</p>
                  </div>
                </button>
                <button className="w-full text-left p-3 bg-gray-50/50 rounded-xl hover:bg-gray-50 transition-colors flex items-center gap-3">
                  <Target className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="font-medium text-gray-900">A/B Testing</p>
                    <p className="text-xs text-gray-600">Compare performance</p>
                  </div>
                </button>
                <button className="w-full text-left p-3 bg-gray-50/50 rounded-xl hover:bg-gray-50 transition-colors flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-purple-600" />
                  <div>
                    <p className="font-medium text-gray-900">Scheduled Reports</p>
                    <p className="text-xs text-gray-600">Automated insights</p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}