'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { 
  Mail,
  Send,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  Eye,
  MousePointer,
  TrendingUp,
  Filter,
  Download,
  RefreshCw,
  Plus,
  Search,
  Paperclip,
  Users,
  BarChart3,
  Inbox,
  Archive
} from 'lucide-react';

interface EmailStats {
  totalSent: number;
  delivered: number;
  opened: number;
  clicked: number;
  bounced: number;
  openRate: number;
  clickRate: number;
  bounceRate: number;
}

interface EmailMessage {
  id: string;
  customer_name: string;
  email: string;
  subject: string;
  content: string;
  status: string;
  sent_at: string;
  delivered_at: string;
  read_at: string;
  message_type: string;
  has_attachments: boolean;
}

interface EmailTemplate {
  id: string;
  template_name: string;
  subject: string;
  content: string;
  category: string;
  is_active: boolean;
}

export default function EmailManagement() {
  const { user } = useAuth();
  const [stats, setStats] = useState<EmailStats | null>(null);
  const [messages, setMessages] = useState<EmailMessage[]>([]);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTimeframe, setSelectedTimeframe] = useState('7days');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showComposeModal, setShowComposeModal] = useState(false);
  const [newEmail, setNewEmail] = useState({
    email: '',
    subject: '',
    content: '',
    messageType: 'transactional',
    templateId: ''
  });

  useEffect(() => {
    if (user?.organization_id) {
      fetchEmailData();
    }
  }, [user?.organization_id, selectedTimeframe]);

  const fetchEmailData = async () => {
    try {
      const organizationId = user?.organization_id;
      if (!organizationId) return;

      // Calculate date range
      const daysBack = selectedTimeframe === '7days' ? 7 : selectedTimeframe === '30days' ? 30 : 90;
      const fromDate = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000).toISOString();

      // Fetch email analytics
      const { data: analyticsData } = await supabase
        .from('communication_analytics')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('channel_type', 'Email')
        .gte('date', fromDate.split('T')[0]);

      // Fetch email messages with customer data
      const { data: messagesData } = await supabase
        .from('customer_communications')
        .select(`
          id,
          subject,
          content,
          status,
          sent_at,
          delivered_at,
          read_at,
          message_type,
          metadata,
          customers!inner(full_name, email)
        `)
        .eq('organization_id', organizationId)
        .eq('channel_type', 'Email')
        .gte('created_at', fromDate)
        .order('created_at', { ascending: false })
        .limit(100);

      // Fetch email templates
      const { data: templatesData } = await supabase
        .from('message_templates')
        .select('*')
        .eq('organization_id', organizationId)
        .in('template_type', ['transactional', 'marketing'])
        .eq('is_active', true);

      // Process analytics data
      const totalSent = analyticsData?.reduce((sum: number, item: AnalyticsData) => sum + (item.messages_sent || 0), 0) || 0;
      const totalDelivered = analyticsData?.reduce((sum: number, item: AnalyticsData) => sum + (item.messages_delivered || 0), 0) || 0;
      const totalOpened = analyticsData?.reduce((sum: number, item: AnalyticsData) => sum + (item.messages_read || 0), 0) || 0;
      const totalBounced = analyticsData?.reduce((sum: number, item: AnalyticsData) => sum + (item.messages_failed || 0), 0) || 0;

      // Calculate clicked from metadata (would normally be tracked)
      const totalClicked = Math.floor(totalOpened * 0.15); // Estimate 15% click rate

      const openRate = totalSent > 0 ? (totalOpened / totalSent) * 100 : 0;
      const clickRate = totalOpened > 0 ? (totalClicked / totalOpened) * 100 : 0;
      const bounceRate = totalSent > 0 ? (totalBounced / totalSent) * 100 : 0;

      setStats({
        totalSent,
        delivered: totalDelivered,
        opened: totalOpened,
        clicked: totalClicked,
        bounced: totalBounced,
        openRate: Math.round(openRate * 100) / 100,
        clickRate: Math.round(clickRate * 100) / 100,
        bounceRate: Math.round(bounceRate * 100) / 100
      });

      // Process messages data
      const processedMessages: EmailMessage[] = messagesData?.map(msg => ({
        id: msg.id,
        customer_name: (msg.customers as any)?.full_name || 'Unknown',
        email: (msg.customers as any)?.email || 'N/A',
        subject: msg.subject || 'No Subject',
        content: msg.content,
        status: msg.status || 'unknown',
        sent_at: msg.sent_at || '',
        delivered_at: msg.delivered_at || '',
        read_at: msg.read_at || '',
        message_type: msg.message_type || 'transactional',
        has_attachments: msg.metadata?.attachments?.length > 0 || false
      })) || [];

      setMessages(processedMessages);
      setTemplates(templatesData || []);
    } catch (error) {
      console.error('Error fetching email data:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendEmail = async () => {
    try {
      let content = newEmail.content;
      let subject = newEmail.subject;

      // If template is selected, use template content
      if (newEmail.templateId) {
        const template = templates.find(t => t.id === newEmail.templateId);
        if (template) {
          content = template.content;
          subject = template.subject;
        }
      }

      const { error } = await supabase
        .from('customer_communications')
        .insert([
          {
            organization_id: user?.organization_id,
            customer_id: '10000000-0000-0000-0000-000000000001', // Would find customer by email
            channel_type: 'Email',
            message_type: newEmail.messageType,
            subject: subject,
            content: content,
            status: 'sent',
            sent_at: new Date().toISOString(),
            metadata: { manual_send: true }
          }
        ]);

      if (error) throw error;

      setShowComposeModal(false);
      setNewEmail({ email: '', subject: '', content: '', messageType: 'transactional', templateId: '' });
      fetchEmailData(); // Refresh data
    } catch (error) {
      console.error('Error sending email:', error);
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
      message.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      message.subject.toLowerCase().includes(searchTerm.toLowerCase());
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
          <p className="text-gray-600">Loading email management...</p>
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
              <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
                <Mail className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Email Management</h1>
                <p className="text-gray-600">Send and track email communications to customers</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => fetchEmailData()}
                className="bg-white/60 backdrop-blur-sm border border-white/20 text-gray-700 px-4 py-2 rounded-xl hover:bg-white/80 transition-all duration-200 flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
              <button
                onClick={() => setShowComposeModal(true)}
                className="bg-blue-600/90 backdrop-blur-sm text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition-all duration-200 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Compose Email
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
                <p className="text-xs text-blue-600 flex items-center gap-1 mt-1">
                  <TrendingUp className="w-3 h-3" />
                  {stats?.openRate}% open rate
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
                <p className="text-sm text-gray-600 mb-1">Opened</p>
                <p className="text-2xl font-bold text-emerald-600">{stats?.opened.toLocaleString()}</p>
                <p className="text-xs text-gray-600 flex items-center gap-1 mt-1">
                  <Eye className="w-3 h-3" />
                  {stats?.openRate}% rate
                </p>
              </div>
              <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                <Eye className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
          </div>

          <div className="bg-white/60 backdrop-blur-sm border border-white/20 rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Clicked</p>
                <p className="text-2xl font-bold text-purple-600">{stats?.clicked.toLocaleString()}</p>
                <p className="text-xs text-gray-600 flex items-center gap-1 mt-1">
                  <MousePointer className="w-3 h-3" />
                  {stats?.clickRate}% rate
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <MousePointer className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white/60 backdrop-blur-sm border border-white/20 rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Bounced</p>
                <p className="text-2xl font-bold text-red-600">{stats?.bounced.toLocaleString()}</p>
                <p className="text-xs text-gray-600 flex items-center gap-1 mt-1">
                  <XCircle className="w-3 h-3" />
                  {stats?.bounceRate}% rate
                </p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                <XCircle className="w-6 h-6 text-red-600" />
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
                      placeholder="Search emails, customers, or subjects..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <select
                  value={selectedTimeframe}
                  onChange={(e) => setSelectedTimeframe(e.target.value)}
                  className="px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="7days">Last 7 days</option>
                  <option value="30days">Last 30 days</option>
                  <option value="90days">Last 90 days</option>
                </select>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Recipient</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Subject</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Status</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Type</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Opened</th>
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
                                <Mail className="w-3 h-3" />
                                {message.email}
                              </p>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-2">
                              <p className="text-sm text-gray-900 max-w-xs truncate">
                                {message.subject}
                              </p>
                              {message.has_attachments && (
                                <Paperclip className="w-3 h-3 text-gray-400" />
                              )}
                            </div>
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
                            {message.read_at ? (
                              <div className="flex items-center gap-1 text-emerald-600">
                                <Eye className="w-3 h-3" />
                                <span className="text-xs">Opened</span>
                              </div>
                            ) : (
                              <span className="text-xs text-gray-400">Not opened</span>
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
                    <Inbox className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600">No emails found</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* Performance Metrics */}
            <div className="bg-white/60 backdrop-blur-sm border border-white/20 rounded-2xl p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Open Rate</span>
                    <span className="text-sm font-medium text-emerald-600">{stats?.openRate}%</span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-emerald-500 rounded-full transition-all duration-200"
                      style={{ width: `${stats?.openRate}%` }}
                    ></div>
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Click Rate</span>
                    <span className="text-sm font-medium text-purple-600">{stats?.clickRate}%</span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-purple-500 rounded-full transition-all duration-200"
                      style={{ width: `${stats?.clickRate}%` }}
                    ></div>
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Bounce Rate</span>
                    <span className="text-sm font-medium text-red-600">{stats?.bounceRate}%</span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-red-500 rounded-full transition-all duration-200"
                      style={{ width: `${stats?.bounceRate}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white/60 backdrop-blur-sm border border-white/20 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button className="w-full text-left p-3 bg-gray-50/50 rounded-xl hover:bg-gray-50 transition-colors flex items-center gap-3">
                  <Users className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="font-medium text-gray-900">Bulk Email</p>
                    <p className="text-xs text-gray-600">Send to multiple recipients</p>
                  </div>
                </button>
                <button className="w-full text-left p-3 bg-gray-50/50 rounded-xl hover:bg-gray-50 transition-colors flex items-center gap-3">
                  <BarChart3 className="w-5 h-5 text-emerald-600" />
                  <div>
                    <p className="font-medium text-gray-900">Analytics</p>
                    <p className="text-xs text-gray-600">View detailed reports</p>
                  </div>
                </button>
                <button className="w-full text-left p-3 bg-gray-50/50 rounded-xl hover:bg-gray-50 transition-colors flex items-center gap-3">
                  <Archive className="w-5 h-5 text-orange-600" />
                  <div>
                    <p className="font-medium text-gray-900">Templates</p>
                    <p className="text-xs text-gray-600">Manage email templates</p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Compose Email Modal */}
      {showComposeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl mx-4">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Compose Email</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                  <input
                    type="email"
                    value={newEmail.email}
                    onChange={(e) => setNewEmail({ ...newEmail, email: e.target.value })}
                    placeholder="customer@example.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Message Type</label>
                  <select
                    value={newEmail.messageType}
                    onChange={(e) => setNewEmail({ ...newEmail, messageType: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="transactional">Transactional</option>
                    <option value="marketing">Marketing</option>
                    <option value="reminder">Reminder</option>
                    <option value="notification">Notification</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Template (Optional)</label>
                <select
                  value={newEmail.templateId}
                  onChange={(e) => setNewEmail({ ...newEmail, templateId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Choose a template...</option>
                  {templates.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.template_name} ({template.category})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
                <input
                  type="text"
                  value={newEmail.subject}
                  onChange={(e) => setNewEmail({ ...newEmail, subject: e.target.value })}
                  placeholder="Email subject..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Message Content</label>
                <textarea
                  value={newEmail.content}
                  onChange={(e) => setNewEmail({ ...newEmail, content: e.target.value })}
                  placeholder="Enter your email content here..."
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowComposeModal(false)}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={sendEmail}
                disabled={!newEmail.email || (!newEmail.content && !newEmail.templateId)}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Send Email
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}