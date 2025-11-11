'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { 
  MessageSquare,
  MessageCircle,
  Mail,
  Smartphone,
  Video,
  Users,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  Send,
  Bot,
  Zap,
  BarChart3,
  FileText,
  Megaphone,
  Headphones,
  PhoneCall
} from 'lucide-react';

interface CommunicationStats {
  totalMessagesSent: number;
  messagesDelivered: number;
  messagesFailed: number;
  activeChats: number;
  avgResponseTime: number;
  customerSatisfaction: number;
  smsCount: number;
  emailCount: number;
  whatsappCount: number;
  videoConsultations: number;
}

interface RecentActivity {
  id: string;
  type: string;
  channel: string;
  customer_name: string;
  content: string;
  status: string;
  timestamp: string;
}

interface Channel {
  name: string;
  type: string;
  icon: any;
  status: 'active' | 'inactive' | 'error';
  messagesCount: number;
  deliveryRate: number;
  href: string;
  color: string;
}

export default function CommunicationDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<CommunicationStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  const channels: Channel[] = [
    {
      name: 'SMS',
      type: 'SMS',
      icon: Smartphone,
      status: 'active',
      messagesCount: stats?.smsCount || 0,
      deliveryRate: 97.8,
      href: '/dashboard/communication/sms',
      color: 'bg-emerald-500'
    },
    {
      name: 'Email',
      type: 'Email',
      icon: Mail,
      status: 'active',
      messagesCount: stats?.emailCount || 0,
      deliveryRate: 96.2,
      href: '/dashboard/communication/email',
      color: 'bg-blue-500'
    },
    {
      name: 'WhatsApp',
      type: 'WhatsApp',
      icon: MessageCircle,
      status: 'active',
      messagesCount: stats?.whatsappCount || 0,
      deliveryRate: 99.1,
      href: '/dashboard/communication/whatsapp',
      color: 'bg-green-500'
    },
    {
      name: 'Live Chat',
      type: 'Chat',
      icon: MessageSquare,
      status: 'active',
      messagesCount: stats?.activeChats || 0,
      deliveryRate: 100,
      href: '/dashboard/communication/chat',
      color: 'bg-purple-500'
    }
  ];

  useEffect(() => {
    if (user?.organization_id) {
      fetchCommunicationStats();
      fetchRecentActivity();
    }
  }, [user?.organization_id]);

  const fetchCommunicationStats = async () => {
    try {
      const organizationId = user?.organization_id;
      if (!organizationId) return;

      // Get communication analytics for the last 7 days
      const { data: analyticsData } = await supabase
        .from('communication_analytics')
        .select('*')
        .eq('organization_id', organizationId)
        .gte('date', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);

      // Get active chat sessions
      const { data: chatData } = await supabase
        .from('chat_sessions')
        .select('*')
        .eq('organization_id', organizationId)
        .in('status', ['active', 'waiting']);

      // Get video consultations for this week
      const { data: videoData } = await supabase
        .from('video_consultations')
        .select('*')
        .eq('organization_id', organizationId)
        .gte('scheduled_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

      // Calculate stats
      const totalSent = analyticsData?.reduce((sum: number, item: AnalyticsData) => sum + (item.messages_sent || 0), 0) || 0;
      const totalDelivered = analyticsData?.reduce((sum: number, item: AnalyticsData) => sum + (item.messages_delivered || 0), 0) || 0;
      const totalFailed = analyticsData?.reduce((sum: number, item: AnalyticsData) => sum + (item.messages_failed || 0), 0) || 0;
      
      const smsAnalytics = analyticsData?.filter((item: AnalyticsData) => item.channel_type === 'SMS') || [];
      const emailAnalytics = analyticsData?.filter((item: AnalyticsData) => item.channel_type === 'Email') || [];
      const whatsappAnalytics = analyticsData?.filter((item: AnalyticsData) => item.channel_type === 'WhatsApp') || [];
      
      const avgResponseTimes = analyticsData?.filter((item: AnalyticsData) => item.average_response_time).map((item: AnalyticsData) => item.average_response_time) || [];
      const avgResponseTime = avgResponseTimes.length > 0 ? avgResponseTimes.reduce((sum: number, time: number) => sum + time, 0) / avgResponseTimes.length : 0;
      
      const satisfactionScores = analyticsData?.filter(item => item.satisfaction_score).map(item => item.satisfaction_score) || [];
      const avgSatisfaction = satisfactionScores.length > 0 ? satisfactionScores.reduce((sum, score) => sum + score, 0) / satisfactionScores.length : 0;

      setStats({
        totalMessagesSent: totalSent,
        messagesDelivered: totalDelivered,
        messagesFailed: totalFailed,
        activeChats: chatData?.length || 0,
        avgResponseTime: Math.round(avgResponseTime),
        customerSatisfaction: Math.round(avgSatisfaction * 10) / 10,
        smsCount: smsAnalytics.reduce((sum, item) => sum + (item.messages_sent || 0), 0),
        emailCount: emailAnalytics.reduce((sum, item) => sum + (item.messages_sent || 0), 0),
        whatsappCount: whatsappAnalytics.reduce((sum, item) => sum + (item.messages_sent || 0), 0),
        videoConsultations: videoData?.length || 0
      });
    } catch (error) {
      console.error('Error fetching communication stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentActivity = async () => {
    try {
      const organizationId = user?.organization_id;
      if (!organizationId) return;

      const { data, error } = await supabase
        .from('customer_communications')
        .select(`
          id,
          channel_type,
          message_type,
          content,
          status,
          created_at,
          customers!inner(full_name)
        `)
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      const activities: RecentActivity[] = data?.map(item => ({
        id: item.id,
        type: item.message_type || 'message',
        channel: item.channel_type,
        customer_name: (item.customers as any)?.full_name || 'Unknown Customer',
        content: item.content.substring(0, 100) + (item.content.length > 100 ? '...' : ''),
        status: item.status || 'unknown',
        timestamp: item.created_at
      })) || [];

      setRecentActivity(activities);
    } catch (error) {
      console.error('Error fetching recent activity:', error);
    }
  };

  const getChannelIcon = (channelType: string) => {
    switch (channelType) {
      case 'SMS': return Smartphone;
      case 'Email': return Mail;
      case 'WhatsApp': return MessageCircle;
      case 'Push': return Bell;
      default: return MessageSquare;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return 'text-emerald-600 bg-emerald-50';
      case 'sent': return 'text-blue-600 bg-blue-50';
      case 'pending': return 'text-amber-600 bg-amber-50';
      case 'failed': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading communication dashboard...</p>
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
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Communication Center</h1>
              <p className="text-gray-600">Manage customer communications across all channels</p>
            </div>
            <div className="flex gap-3">
              <Link
                href="/dashboard/communication/templates"
                className="bg-white/60 backdrop-blur-sm border border-white/20 text-gray-700 px-4 py-2 rounded-xl hover:bg-white/80 transition-all duration-200 flex items-center gap-2"
              >
                <FileText className="w-4 h-4" />
                Templates
              </Link>
              <Link
                href="/dashboard/communication/bulk"
                className="bg-blue-600/90 backdrop-blur-sm text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition-all duration-200 flex items-center gap-2"
              >
                <Megaphone className="w-4 h-4" />
                New Campaign
              </Link>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/60 backdrop-blur-sm border border-white/20 rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Messages Sent</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.totalMessagesSent.toLocaleString()}</p>
                <p className="text-xs text-emerald-600 flex items-center gap-1 mt-1">
                  <TrendingUp className="w-3 h-3" />
                  {((stats?.messagesDelivered || 0) / (stats?.totalMessagesSent || 1) * 100).toFixed(1)}% delivered
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Send className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white/60 backdrop-blur-sm border border-white/20 rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Active Chats</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.activeChats}</p>
                <p className="text-xs text-blue-600 flex items-center gap-1 mt-1">
                  <Clock className="w-3 h-3" />
                  {stats?.avgResponseTime}s avg response
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white/60 backdrop-blur-sm border border-white/20 rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Video Consultations</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.videoConsultations}</p>
                <p className="text-xs text-indigo-600 flex items-center gap-1 mt-1">
                  <Video className="w-3 h-3" />
                  This week
                </p>
              </div>
              <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
                <Video className="w-6 h-6 text-indigo-600" />
              </div>
            </div>
          </div>

          <div className="bg-white/60 backdrop-blur-sm border border-white/20 rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Customer Satisfaction</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.customerSatisfaction}/5</p>
                <p className="text-xs text-emerald-600 flex items-center gap-1 mt-1">
                  <CheckCircle className="w-3 h-3" />
                  Excellent rating
                </p>
              </div>
              <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Communication Channels */}
          <div className="lg:col-span-2">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Communication Channels</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {channels.map((channel) => {
                const Icon = channel.icon;
                return (
                  <Link key={channel.type} href={channel.href}>
                    <div className="bg-white/60 backdrop-blur-sm border border-white/20 rounded-2xl p-6 hover:bg-white/80 transition-all duration-200 cursor-pointer group">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 ${channel.color} rounded-xl flex items-center justify-center`}>
                            <Icon className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">{channel.name}</h3>
                            <p className="text-sm text-gray-600">{channel.messagesCount} messages</p>
                          </div>
                        </div>
                        <div className={`w-2 h-2 rounded-full ${
                          channel.status === 'active' ? 'bg-emerald-500' : 'bg-gray-400'
                        }`}></div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Delivery Rate</span>
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-emerald-500 rounded-full transition-all duration-200"
                              style={{ width: `${channel.deliveryRate}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium text-gray-900">{channel.deliveryRate}%</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* Quick Actions */}
            <div className="mt-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Quick Actions</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Link href="/dashboard/communication/templates" className="bg-white/60 backdrop-blur-sm border border-white/20 rounded-2xl p-4 hover:bg-white/80 transition-all duration-200 text-center group">
                  <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <FileText className="w-6 h-6 text-orange-600" />
                  </div>
                  <p className="font-medium text-gray-900">Templates</p>
                  <p className="text-xs text-gray-600">Manage message templates</p>
                </Link>

                <Link href="/dashboard/communication/bulk" className="bg-white/60 backdrop-blur-sm border border-white/20 rounded-2xl p-4 hover:bg-white/80 transition-all duration-200 text-center group">
                  <div className="w-12 h-12 bg-pink-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <Megaphone className="w-6 h-6 text-pink-600" />
                  </div>
                  <p className="font-medium text-gray-900">Bulk Messaging</p>
                  <p className="text-xs text-gray-600">Send campaigns</p>
                </Link>

                <Link href="/dashboard/communication/video" className="bg-white/60 backdrop-blur-sm border border-white/20 rounded-2xl p-4 hover:bg-white/80 transition-all duration-200 text-center group">
                  <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <Video className="w-6 h-6 text-indigo-600" />
                  </div>
                  <p className="font-medium text-gray-900">Video Calls</p>
                  <p className="text-xs text-gray-600">Schedule consultations</p>
                </Link>

                <Link href="/dashboard/communication/analytics" className="bg-white/60 backdrop-blur-sm border border-white/20 rounded-2xl p-4 hover:bg-white/80 transition-all duration-200 text-center group">
                  <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <BarChart3 className="w-6 h-6 text-teal-600" />
                  </div>
                  <p className="font-medium text-gray-900">Analytics</p>
                  <p className="text-xs text-gray-600">Performance insights</p>
                </Link>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="lg:col-span-1">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Recent Activity</h2>
            <div className="bg-white/60 backdrop-blur-sm border border-white/20 rounded-2xl p-6">
              <div className="space-y-4">
                {recentActivity.length > 0 ? (
                  recentActivity.map((activity) => {
                    const ChannelIcon = getChannelIcon(activity.channel);
                    return (
                      <div key={activity.id} className="flex items-start gap-3 p-3 rounded-xl bg-gray-50/50 hover:bg-gray-50 transition-colors">
                        <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <ChannelIcon className="w-4 h-4 text-gray-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {activity.customer_name}
                            </p>
                            <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(activity.status)}`}>
                              {activity.status}
                            </span>
                          </div>
                          <p className="text-xs text-gray-600 mb-1">{activity.content}</p>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500">{activity.channel}</span>
                            <span className="text-xs text-gray-400">•</span>
                            <span className="text-xs text-gray-500">{formatTimeAgo(activity.timestamp)}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-8">
                    <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-sm text-gray-600">No recent activity</p>
                  </div>
                )}
              </div>
            </div>

            {/* System Health */}
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">System Health</h3>
              <div className="bg-white/60 backdrop-blur-sm border border-white/20 rounded-2xl p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                      <span className="text-sm text-gray-700">SMS Gateway</span>
                    </div>
                    <span className="text-xs text-emerald-600 font-medium">Operational</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                      <span className="text-sm text-gray-700">Email Service</span>
                    </div>
                    <span className="text-xs text-emerald-600 font-medium">Operational</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                      <span className="text-sm text-gray-700">WhatsApp API</span>
                    </div>
                    <span className="text-xs text-emerald-600 font-medium">Operational</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                      <span className="text-sm text-gray-700">Video Platform</span>
                    </div>
                    <span className="text-xs text-emerald-600 font-medium">Operational</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}