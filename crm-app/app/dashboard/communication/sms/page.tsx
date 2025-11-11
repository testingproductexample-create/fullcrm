'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { 
  Smartphone,
  Send,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  Phone,
  MessageSquare,
  TrendingUp,
  Filter,
  Download,
  RefreshCw,
  Plus,
  Search,
  Calendar,
  Users,
  DollarSign,
  BarChart3
} from 'lucide-react';

interface SMSStats {
  totalSent: number;
  delivered: number;
  failed: number;
  pending: number;
  deliveryRate: number;
  totalCost: number;
  avgResponseTime: number;
}

interface SMSMessage {
  id: string;
  customer_name: string;
  phone: string;
  content: string;
  status: string;
  sent_at: string;
  delivered_at: string;
  cost: number;
  message_type: string;
}

interface SMSChannel {
  id: string;
  provider_name: string;
  is_active: boolean;
  rate_limits: any;
  compliance_status: string;
}

export default function SMSManagement() {
  const { user } = useAuth();
  const [stats, setStats] = useState<SMSStats | null>(null);
  const [messages, setMessages] = useState<SMSMessage[]>([]);
  const [channels, setChannels] = useState<SMSChannel[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTimeframe, setSelectedTimeframe] = useState('7days');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showSendModal, setShowSendModal] = useState(false);
  const [newMessage, setNewMessage] = useState({
    phone: '',
    content: '',
    messageType: 'transactional'
  });

  useEffect(() => {
    if (user?.organization_id) {
      fetchSMSData();
    }
  }, [user?.organization_id, selectedTimeframe]);

  const fetchSMSData = async () => {
    try {
      const organizationId = user?.organization_id;
      if (!organizationId) return;

      // Calculate date range
      const daysBack = selectedTimeframe === '7days' ? 7 : selectedTimeframe === '30days' ? 30 : 90;
      const fromDate = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000).toISOString();

      // Fetch SMS analytics
      const { data: analyticsData } = await supabase
        .from('communication_analytics')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('channel_type', 'SMS')
        .gte('date', fromDate.split('T')[0]);

      // Fetch SMS messages with customer data
      const { data: messagesData } = await supabase
        .from('customer_communications')
        .select(`
          id,
          content,
          status,
          sent_at,
          delivered_at,
          message_type,
          metadata,
          customers!inner(full_name, phone_primary)
        `)
        .eq('organization_id', organizationId)
        .eq('channel_type', 'SMS')
        .gte('created_at', fromDate)
        .order('created_at', { ascending: false })
        .limit(100);

      // Fetch SMS channels
      const { data: channelsData } = await supabase
        .from('communication_channels')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('channel_type', 'SMS');

      // Process analytics data
      const totalSent = analyticsData?.reduce((sum: number, item: AnalyticsData) => sum + (item.messages_sent || 0), 0) || 0;
      const totalDelivered = analyticsData?.reduce((sum: number, item: AnalyticsData) => sum + (item.messages_delivered || 0), 0) || 0;
      const totalFailed = analyticsData?.reduce((sum: number, item: AnalyticsData) => sum + (item.messages_failed || 0), 0) || 0;
      const deliveryRate = totalSent > 0 ? (totalDelivered / totalSent) * 100 : 0;

      // Calculate cost from message metadata
      const totalCost = messagesData?.reduce((sum: number, msg: any) => {
        const cost = msg.metadata?.cost || 0.25; // Default cost per SMS
        return sum + cost;
      }, 0) || 0;

      // Count pending messages
      const pendingCount = messagesData?.filter(msg => msg.status === 'pending').length || 0;

      setStats({
        totalSent,
        delivered: totalDelivered,
        failed: totalFailed,
        pending: pendingCount,
        deliveryRate: Math.round(deliveryRate * 100) / 100,
        totalCost: Math.round(totalCost * 100) / 100,
        avgResponseTime: 0 // SMS doesn't have response time
      });

      // Process messages data
      const processedMessages: SMSMessage[] = messagesData?.map(msg => ({
        id: msg.id,
        customer_name: (msg.customers as any)?.full_name || 'Unknown',
        phone: (msg.customers as any)?.phone_primary || 'N/A',
        content: msg.content,
        status: msg.status || 'unknown',
        sent_at: msg.sent_at || '',
        delivered_at: msg.delivered_at || '',
        cost: msg.metadata?.cost || 0.25,
        message_type: msg.message_type || 'transactional'
      })) || [];

      setMessages(processedMessages);
      setChannels(channelsData || []);
    } catch (error) {
      console.error('Error fetching SMS data:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendSMS = async () => {
    try {
      // In a real implementation, this would send via SMS gateway
      // For now, we'll just insert into customer_communications
      const { error } = await supabase
        .from('customer_communications')
        .insert([
          {
            organization_id: user?.organization_id,
            customer_id: '10000000-0000-0000-0000-000000000001', // Would find customer by phone
            channel_type: 'SMS',
            message_type: newMessage.messageType,
            content: newMessage.content,
            status: 'sent',
            sent_at: new Date().toISOString(),
            metadata: { cost: 0.25, manual_send: true }
          }
        ]);

      if (error) throw error;

      setShowSendModal(false);
      setNewMessage({ phone: '', content: '', messageType: 'transactional' });
      fetchSMSData(); // Refresh data
    } catch (error) {
      console.error('Error sending SMS:', error);
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered': return CheckCircle;
      case 'sent': return Clock;
      case 'pending': return Clock;
      case 'failed': return XCircle;
      default: return AlertCircle;
    }
  };

  const filteredMessages = messages.filter(message => {
    const statusMatch = selectedStatus === 'all' || message.status === selectedStatus;
    const searchMatch = searchTerm === '' || 
      message.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      message.phone.includes(searchTerm) ||
      message.content.toLowerCase().includes(searchTerm.toLowerCase());
    return statusMatch && searchMatch;
  });

  const formatTimeAgo = (timestamp: string) => {
    if (!timestamp) return 'N/A';
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
          <p className="text-gray-600">Loading SMS management...</p>
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
              <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center">
                <Smartphone className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">SMS Management</h1>
                <p className="text-gray-600">Send and track SMS messages to customers</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => fetchSMSData()}
                className="bg-white/60 backdrop-blur-sm border border-white/20 text-gray-700 px-4 py-2 rounded-xl hover:bg-white/80 transition-all duration-200 flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
              <button
                onClick={() => setShowSendModal(true)}
                className="bg-emerald-600/90 backdrop-blur-sm text-white px-4 py-2 rounded-xl hover:bg-emerald-700 transition-all duration-200 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Send SMS
              </button>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/60 backdrop-blur-sm border border-white/20 rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Sent</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.totalSent.toLocaleString()}</p>
                <p className="text-xs text-emerald-600 flex items-center gap-1 mt-1">
                  <TrendingUp className="w-3 h-3" />
                  {stats?.deliveryRate}% delivered
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
                <p className="text-sm text-gray-600 mb-1">Delivered</p>
                <p className="text-2xl font-bold text-emerald-600">{stats?.delivered.toLocaleString()}</p>
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
                <p className="text-sm text-gray-600 mb-1">Failed</p>
                <p className="text-2xl font-bold text-red-600">{stats?.failed.toLocaleString()}</p>
                <p className="text-xs text-gray-600 flex items-center gap-1 mt-1">
                  <XCircle className="w-3 h-3" />
                  Delivery failed
                </p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                <XCircle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>

          <div className="bg-white/60 backdrop-blur-sm border border-white/20 rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Cost</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.totalCost} AED</p>
                <p className="text-xs text-gray-600 flex items-center gap-1 mt-1">
                  <DollarSign className="w-3 h-3" />
                  This period
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Messages List */}
          <div className="lg:col-span-3">
            <div className="bg-white/60 backdrop-blur-sm border border-white/20 rounded-2xl p-6">
              {/* Filters */}
              <div className="mb-6 flex flex-wrap gap-4">
                <div className="flex-1 min-w-64">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Search messages, customers, or phone numbers..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <select
                  value={selectedTimeframe}
                  onChange={(e) => setSelectedTimeframe(e.target.value)}
                  className="px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                >
                  <option value="7days">Last 7 days</option>
                  <option value="30days">Last 30 days</option>
                  <option value="90days">Last 90 days</option>
                </select>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                >
                  <option value="all">All Status</option>
                  <option value="delivered">Delivered</option>
                  <option value="sent">Sent</option>
                  <option value="pending">Pending</option>
                  <option value="failed">Failed</option>
                </select>
              </div>

              {/* Messages Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Customer</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Message</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Status</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Type</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Cost</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Sent</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMessages.map((message) => {
                      const StatusIcon = getStatusIcon(message.status);
                      return (
                        <tr key={message.id} className="border-b border-gray-100 hover:bg-gray-50/50">
                          <td className="py-4 px-4">
                            <div>
                              <p className="font-medium text-gray-900">{message.customer_name}</p>
                              <p className="text-sm text-gray-600 flex items-center gap-1">
                                <Phone className="w-3 h-3" />
                                {message.phone}
                              </p>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <p className="text-sm text-gray-900 max-w-xs truncate">
                              {message.content}
                            </p>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-2">
                              <StatusIcon className="w-4 h-4" />
                              <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(message.status)}`}>
                                {message.status}
                              </span>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <span className="text-sm text-gray-600 capitalize">{message.message_type}</span>
                          </td>
                          <td className="py-4 px-4">
                            <span className="text-sm text-gray-900">{message.cost} AED</span>
                          </td>
                          <td className="py-4 px-4">
                            <span className="text-sm text-gray-600">{formatTimeAgo(message.sent_at)}</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {filteredMessages.length === 0 && (
                  <div className="text-center py-8">
                    <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600">No SMS messages found</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* Channels Status */}
            <div className="bg-white/60 backdrop-blur-sm border border-white/20 rounded-2xl p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">SMS Channels</h3>
              <div className="space-y-3">
                {channels.map((channel) => (
                  <div key={channel.id} className="flex items-center justify-between p-3 bg-gray-50/50 rounded-xl">
                    <div>
                      <p className="font-medium text-gray-900">{channel.provider_name}</p>
                      <p className="text-xs text-gray-600">{channel.compliance_status}</p>
                    </div>
                    <div className={`w-2 h-2 rounded-full ${
                      channel.is_active ? 'bg-emerald-500' : 'bg-gray-400'
                    }`}></div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-white/60 backdrop-blur-sm border border-white/20 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Insights</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Delivery Rate</span>
                  <span className="text-sm font-medium text-emerald-600">{stats?.deliveryRate}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Avg Cost/SMS</span>
                  <span className="text-sm font-medium text-gray-900">0.25 AED</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Peak Hours</span>
                  <span className="text-sm font-medium text-gray-900">10 AM - 2 PM</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Best Performing</span>
                  <span className="text-sm font-medium text-gray-900">Reminders</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Send SMS Modal */}
      {showSendModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Send SMS</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                <input
                  type="tel"
                  value={newMessage.phone}
                  onChange={(e) => setNewMessage({ ...newMessage, phone: e.target.value })}
                  placeholder="+971501234567"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Message Type</label>
                <select
                  value={newMessage.messageType}
                  onChange={(e) => setNewMessage({ ...newMessage, messageType: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                >
                  <option value="transactional">Transactional</option>
                  <option value="marketing">Marketing</option>
                  <option value="reminder">Reminder</option>
                  <option value="notification">Notification</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Message Content</label>
                <textarea
                  value={newMessage.content}
                  onChange={(e) => setNewMessage({ ...newMessage, content: e.target.value })}
                  placeholder="Enter your message here..."
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">{newMessage.content.length}/160 characters</p>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowSendModal(false)}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={sendSMS}
                disabled={!newMessage.phone || !newMessage.content}
                className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Send SMS
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}