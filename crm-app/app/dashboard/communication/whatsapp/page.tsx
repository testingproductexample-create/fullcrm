'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { 
  MessageCircle,
  Send,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  Phone,
  Image,
  FileText,
  TrendingUp,
  Filter,
  Download,
  RefreshCw,
  Plus,
  Search,
  Camera,
  Mic,
  Paperclip,
  Users,
  Zap,
  Video,
  Star,
  CheckCheck
} from 'lucide-react';

interface WhatsAppStats {
  totalSent: number;
  delivered: number;
  read: number;
  failed: number;
  deliveryRate: number;
  readRate: number;
  responseRate: number;
  avgResponseTime: number;
}

interface WhatsAppMessage {
  id: string;
  customer_name: string;
  phone: string;
  content: string;
  status: string;
  sent_at: string;
  delivered_at: string;
  read_at: string;
  message_type: string;
  media_type: string;
  external_id: string;
}

interface WhatsAppTemplate {
  id: string;
  template_name: string;
  content: string;
  category: string;
  approval_status: string;
  language: string;
}

export default function WhatsAppManagement() {
  const { user } = useAuth();
  const [stats, setStats] = useState<WhatsAppStats | null>(null);
  const [messages, setMessages] = useState<WhatsAppMessage[]>([]);
  const [templates, setTemplates] = useState<WhatsAppTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTimeframe, setSelectedTimeframe] = useState('7days');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showSendModal, setShowSendModal] = useState(false);
  const [newMessage, setNewMessage] = useState({
    phone: '',
    content: '',
    messageType: 'text',
    templateId: ''
  });

  useEffect(() => {
    if (user?.organization_id) {
      fetchWhatsAppData();
    }
  }, [user?.organization_id, selectedTimeframe]);

  const fetchWhatsAppData = async () => {
    try {
      const organizationId = user?.organization_id;
      if (!organizationId) return;

      // Calculate date range
      const daysBack = selectedTimeframe === '7days' ? 7 : selectedTimeframe === '30days' ? 30 : 90;
      const fromDate = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000).toISOString();

      // Fetch WhatsApp analytics
      const { data: analyticsData } = await supabase
        .from('communication_analytics')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('channel_type', 'WhatsApp')
        .gte('date', fromDate.split('T')[0]);

      // Fetch WhatsApp messages with customer data
      const { data: messagesData } = await supabase
        .from('customer_communications')
        .select(`
          id,
          content,
          status,
          sent_at,
          delivered_at,
          read_at,
          message_type,
          external_id,
          metadata,
          customers!inner(full_name, phone_primary)
        `)
        .eq('organization_id', organizationId)
        .eq('channel_type', 'WhatsApp')
        .gte('created_at', fromDate)
        .order('created_at', { ascending: false })
        .limit(100);

      // Fetch WhatsApp templates
      const { data: templatesData } = await supabase
        .from('message_templates')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('is_active', true);

      // Process analytics data
      const totalSent = analyticsData?.reduce((sum, item) => sum + (item.messages_sent || 0), 0) || 0;
      const totalDelivered = analyticsData?.reduce((sum, item) => sum + (item.messages_delivered || 0), 0) || 0;
      const totalRead = analyticsData?.reduce((sum, item) => sum + (item.messages_read || 0), 0) || 0;
      const totalFailed = analyticsData?.reduce((sum, item) => sum + (item.messages_failed || 0), 0) || 0;

      const deliveryRate = totalSent > 0 ? (totalDelivered / totalSent) * 100 : 0;
      const readRate = totalDelivered > 0 ? (totalRead / totalDelivered) * 100 : 0;
      const responseRate = analyticsData?.reduce((sum, item) => sum + (item.response_rate || 0), 0) / (analyticsData?.length || 1);
      const avgResponseTime = analyticsData?.reduce((sum, item) => sum + (item.average_response_time || 0), 0) / (analyticsData?.length || 1);

      setStats({
        totalSent,
        delivered: totalDelivered,
        read: totalRead,
        failed: totalFailed,
        deliveryRate: Math.round(deliveryRate * 100) / 100,
        readRate: Math.round(readRate * 100) / 100,
        responseRate: Math.round(responseRate * 100) / 100,
        avgResponseTime: Math.round(avgResponseTime)
      });

      // Process messages data
      const processedMessages: WhatsAppMessage[] = messagesData?.map(msg => ({
        id: msg.id,
        customer_name: (msg.customers as any)?.full_name || 'Unknown',
        phone: (msg.customers as any)?.phone_primary || 'N/A',
        content: msg.content,
        status: msg.status || 'unknown',
        sent_at: msg.sent_at || '',
        delivered_at: msg.delivered_at || '',
        read_at: msg.read_at || '',
        message_type: msg.message_type || 'text',
        media_type: msg.metadata?.media_type || 'text',
        external_id: msg.external_id || ''
      })) || [];

      setMessages(processedMessages);

      // Filter templates for WhatsApp
      const whatsappTemplates = templatesData?.map(template => ({
        id: template.id,
        template_name: template.template_name,
        content: template.content,
        category: template.category || 'general',
        approval_status: 'approved', // WhatsApp templates require approval
        language: template.language || 'ar'
      })) || [];

      setTemplates(whatsappTemplates);
    } catch (error) {
      console.error('Error fetching WhatsApp data:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendWhatsAppMessage = async () => {
    try {
      let content = newMessage.content;

      // If template is selected, use template content
      if (newMessage.templateId) {
        const template = templates.find(t => t.id === newMessage.templateId);
        if (template) {
          content = template.content;
        }
      }

      const { error } = await supabase
        .from('customer_communications')
        .insert([
          {
            organization_id: user?.organization_id,
            customer_id: '10000000-0000-0000-0000-000000000001', // Would find customer by phone
            channel_type: 'WhatsApp',
            message_type: newMessage.messageType,
            content: content,
            status: 'sent',
            sent_at: new Date().toISOString(),
            external_id: `wa_${Date.now()}`,
            metadata: { manual_send: true, media_type: newMessage.messageType }
          }
        ]);

      if (error) throw error;

      setShowSendModal(false);
      setNewMessage({ phone: '', content: '', messageType: 'text', templateId: '' });
      fetchWhatsAppData(); // Refresh data
    } catch (error) {
      console.error('Error sending WhatsApp message:', error);
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

  const getStatusIcon = (status: string, readAt: string) => {
    if (readAt) return CheckCheck; // Double check for read
    switch (status) {
      case 'delivered': return CheckCircle;
      case 'sent': return Clock;
      case 'pending': return Clock;
      case 'failed': return XCircle;
      default: return AlertCircle;
    }
  };

  const getMediaIcon = (mediaType: string) => {
    switch (mediaType) {
      case 'image': return Image;
      case 'video': return Video;
      case 'audio': return Mic;
      case 'document': return FileText;
      default: return MessageCircle;
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
          <p className="text-gray-600">Loading WhatsApp management...</p>
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
              <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
                <MessageCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">WhatsApp Management</h1>
                <p className="text-gray-600">Send and manage WhatsApp Business messages</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => fetchWhatsAppData()}
                className="bg-white/60 backdrop-blur-sm border border-white/20 text-gray-700 px-4 py-2 rounded-xl hover:bg-white/80 transition-all duration-200 flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
              <button
                onClick={() => setShowSendModal(true)}
                className="bg-green-600/90 backdrop-blur-sm text-white px-4 py-2 rounded-xl hover:bg-green-700 transition-all duration-200 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Send Message
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
                <p className="text-xs text-green-600 flex items-center gap-1 mt-1">
                  <TrendingUp className="w-3 h-3" />
                  {stats?.deliveryRate}% delivered
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <Send className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white/60 backdrop-blur-sm border border-white/20 rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Read Messages</p>
                <p className="text-2xl font-bold text-blue-600">{stats?.read.toLocaleString()}</p>
                <p className="text-xs text-gray-600 flex items-center gap-1 mt-1">
                  <CheckCheck className="w-3 h-3" />
                  {stats?.readRate}% read rate
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <CheckCheck className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white/60 backdrop-blur-sm border border-white/20 rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Response Rate</p>
                <p className="text-2xl font-bold text-purple-600">{stats?.responseRate}%</p>
                <p className="text-xs text-gray-600 flex items-center gap-1 mt-1">
                  <Zap className="w-3 h-3" />
                  Customer engagement
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <Zap className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white/60 backdrop-blur-sm border border-white/20 rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Avg Response Time</p>
                <p className="text-2xl font-bold text-orange-600">{stats?.avgResponseTime}s</p>
                <p className="text-xs text-gray-600 flex items-center gap-1 mt-1">
                  <Clock className="w-3 h-3" />
                  Customer replies
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                <Clock className="w-6 h-6 text-orange-600" />
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
                      className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <select
                  value={selectedTimeframe}
                  onChange={(e) => setSelectedTimeframe(e.target.value)}
                  className="px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="7days">Last 7 days</option>
                  <option value="30days">Last 30 days</option>
                  <option value="90days">Last 90 days</option>
                </select>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Read</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Sent</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMessages.map((message) => {
                      const StatusIcon = getStatusIcon(message.status, message.read_at);
                      const MediaIcon = getMediaIcon(message.media_type);
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
                            <div className="flex items-center gap-2">
                              <MediaIcon className="w-4 h-4 text-gray-500" />
                              <p className="text-sm text-gray-900 max-w-xs truncate">
                                {message.content}
                              </p>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-2">
                              <StatusIcon className={`w-4 h-4 ${message.read_at ? 'text-blue-600' : ''}`} />
                              <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(message.status)}`}>
                                {message.read_at ? 'read' : message.status}
                              </span>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <span className="text-sm text-gray-600 capitalize">{message.media_type}</span>
                          </td>
                          <td className="py-4 px-4">
                            {message.read_at ? (
                              <span className="text-xs text-blue-600">{formatTimeAgo(message.read_at)}</span>
                            ) : (
                              <span className="text-xs text-gray-400">Not read</span>
                            )}
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
                    <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600">No WhatsApp messages found</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* WhatsApp Business Status */}
            <div className="bg-white/60 backdrop-blur-sm border border-white/20 rounded-2xl p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Business Account</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-gray-700">WhatsApp API</span>
                  </div>
                  <span className="text-xs text-green-600 font-medium">Connected</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-gray-700">Business Profile</span>
                  </div>
                  <span className="text-xs text-green-600 font-medium">Verified</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                    <span className="text-sm text-gray-700">Template Approval</span>
                  </div>
                  <span className="text-xs text-amber-600 font-medium">Pending</span>
                </div>
              </div>
            </div>

            {/* Performance Metrics */}
            <div className="bg-white/60 backdrop-blur-sm border border-white/20 rounded-2xl p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Delivery Rate</span>
                    <span className="text-sm font-medium text-green-600">{stats?.deliveryRate}%</span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-green-500 rounded-full transition-all duration-200"
                      style={{ width: `${stats?.deliveryRate}%` }}
                    ></div>
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Read Rate</span>
                    <span className="text-sm font-medium text-blue-600">{stats?.readRate}%</span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-500 rounded-full transition-all duration-200"
                      style={{ width: `${stats?.readRate}%` }}
                    ></div>
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Response Rate</span>
                    <span className="text-sm font-medium text-purple-600">{stats?.responseRate}%</span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-purple-500 rounded-full transition-all duration-200"
                      style={{ width: `${stats?.responseRate}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Templates */}
            <div className="bg-white/60 backdrop-blur-sm border border-white/20 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Templates</h3>
              <div className="space-y-3">
                {templates.slice(0, 3).map((template) => (
                  <button 
                    key={template.id}
                    onClick={() => setNewMessage({ ...newMessage, templateId: template.id })}
                    className="w-full text-left p-3 bg-gray-50/50 rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    <p className="font-medium text-gray-900 text-sm truncate">{template.template_name}</p>
                    <p className="text-xs text-gray-600 capitalize">{template.category}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Send WhatsApp Message Modal */}
      {showSendModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg mx-4">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Send WhatsApp Message</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                <input
                  type="tel"
                  value={newMessage.phone}
                  onChange={(e) => setNewMessage({ ...newMessage, phone: e.target.value })}
                  placeholder="+971501234567"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Message Type</label>
                <select
                  value={newMessage.messageType}
                  onChange={(e) => setNewMessage({ ...newMessage, messageType: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="text">Text Message</option>
                  <option value="image">Image</option>
                  <option value="document">Document</option>
                  <option value="template">Template</option>
                </select>
              </div>
              {newMessage.messageType === 'template' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Template</label>
                  <select
                    value={newMessage.templateId}
                    onChange={(e) => setNewMessage({ ...newMessage, templateId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="">Choose a template...</option>
                    {templates.map((template) => (
                      <option key={template.id} value={template.id}>
                        {template.template_name} ({template.language})
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Message Content</label>
                <textarea
                  value={newMessage.content}
                  onChange={(e) => setNewMessage({ ...newMessage, content: e.target.value })}
                  placeholder="Enter your message here..."
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">WhatsApp messages support text, emojis, and media</p>
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
                onClick={sendWhatsAppMessage}
                disabled={!newMessage.phone || (!newMessage.content && !newMessage.templateId)}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Send Message
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}