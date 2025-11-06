'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { 
  Megaphone,
  Plus,
  Play,
  Pause,
  Stop,
  Edit,
  Trash2,
  Search,
  Calendar,
  Users,
  MessageSquare,
  Mail,
  Smartphone,
  MessageCircle,
  TrendingUp,
  Target,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  Filter,
  BarChart3,
  FileText,
  Eye,
  Copy,
  Settings
} from 'lucide-react';

interface BulkCampaign {
  id: string;
  campaign_name: string;
  target_criteria: any;
  channel_type: string;
  scheduled_at: string;
  status: string;
  total_recipients: number;
  sent_count: number;
  delivered_count: number;
  failed_count: number;
  opt_out_count: number;
  created_by: string;
  created_at: string;
  template_name?: string;
  creator_name?: string;
}

interface CampaignStats {
  totalCampaigns: number;
  activeCampaigns: number;
  scheduledCampaigns: number;
  totalRecipients: number;
  deliveryRate: number;
  optOutRate: number;
  avgCampaignSize: number;
  successfulCampaigns: number;
}

interface TargetAudience {
  criteria: string;
  description: string;
  estimatedCount: number;
}

export default function BulkMessagingCampaigns() {
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState<BulkCampaign[]>([]);
  const [stats, setStats] = useState<CampaignStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedChannel, setSelectedChannel] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCampaign, setNewCampaign] = useState({
    campaign_name: '',
    channel_type: 'SMS',
    message_template_id: '',
    target_criteria: '',
    scheduled_at: '',
    audience_type: 'all_customers'
  });

  const targetAudiences: TargetAudience[] = [
    { criteria: 'all_customers', description: 'All customers', estimatedCount: 1250 },
    { criteria: 'vip_customers', description: 'VIP customers only', estimatedCount: 45 },
    { criteria: 'new_customers', description: 'Customers registered in last 30 days', estimatedCount: 180 },
    { criteria: 'inactive_customers', description: 'Customers inactive for 90+ days', estimatedCount: 320 },
    { criteria: 'high_value', description: 'Customers with orders > 2000 AED', estimatedCount: 210 },
    { criteria: 'birthday_month', description: 'Customers with birthday this month', estimatedCount: 95 }
  ];

  useEffect(() => {
    if (user?.organization_id) {
      fetchCampaigns();
    }
  }, [user?.organization_id]);

  const fetchCampaigns = async () => {
    try {
      const organizationId = user?.organization_id;
      if (!organizationId) return;

      // Fetch bulk messaging campaigns
      const { data: campaignsData } = await supabase
        .from('bulk_messaging')
        .select(`
          id,
          campaign_name,
          target_criteria,
          channel_type,
          scheduled_at,
          status,
          total_recipients,
          sent_count,
          delivered_count,
          failed_count,
          opt_out_count,
          created_by,
          created_at,
          message_templates!left(template_name),
          employees!left(first_name, last_name)
        `)
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });

      // Process campaigns data
      const processedCampaigns: BulkCampaign[] = campaignsData?.map(campaign => {
        const template = campaign.message_templates as any;
        const employee = campaign.employees as any;
        
        return {
          id: campaign.id,
          campaign_name: campaign.campaign_name,
          target_criteria: campaign.target_criteria,
          channel_type: campaign.channel_type,
          scheduled_at: campaign.scheduled_at || '',
          status: campaign.status || 'draft',
          total_recipients: campaign.total_recipients || 0,
          sent_count: campaign.sent_count || 0,
          delivered_count: campaign.delivered_count || 0,
          failed_count: campaign.failed_count || 0,
          opt_out_count: campaign.opt_out_count || 0,
          created_by: campaign.created_by || '',
          created_at: campaign.created_at,
          template_name: template?.template_name || 'Custom Message',
          creator_name: employee ? `${employee.first_name} ${employee.last_name}` : 'Unknown'
        };
      }) || [];

      setCampaigns(processedCampaigns);

      // Calculate stats
      const totalCampaigns = processedCampaigns.length;
      const activeCampaigns = processedCampaigns.filter(c => c.status === 'sending').length;
      const scheduledCampaigns = processedCampaigns.filter(c => c.status === 'scheduled').length;
      const totalRecipients = processedCampaigns.reduce((sum, c) => sum + c.total_recipients, 0);
      const totalSent = processedCampaigns.reduce((sum, c) => sum + c.sent_count, 0);
      const totalDelivered = processedCampaigns.reduce((sum, c) => sum + c.delivered_count, 0);
      const totalOptOuts = processedCampaigns.reduce((sum, c) => sum + c.opt_out_count, 0);
      const successfulCampaigns = processedCampaigns.filter(c => c.status === 'completed').length;

      const deliveryRate = totalSent > 0 ? (totalDelivered / totalSent) * 100 : 0;
      const optOutRate = totalRecipients > 0 ? (totalOptOuts / totalRecipients) * 100 : 0;
      const avgCampaignSize = totalCampaigns > 0 ? totalRecipients / totalCampaigns : 0;

      setStats({
        totalCampaigns,
        activeCampaigns,
        scheduledCampaigns,
        totalRecipients,
        deliveryRate: Math.round(deliveryRate * 100) / 100,
        optOutRate: Math.round(optOutRate * 100) / 100,
        avgCampaignSize: Math.round(avgCampaignSize),
        successfulCampaigns
      });
    } catch (error) {
      console.error('Error fetching campaigns:', error);
    } finally {
      setLoading(false);
    }
  };

  const createCampaign = async () => {
    try {
      const audience = targetAudiences.find(a => a.criteria === newCampaign.audience_type);
      const targetCriteria = {
        audience_type: newCampaign.audience_type,
        description: audience?.description || 'Custom audience'
      };

      const { error } = await supabase
        .from('bulk_messaging')
        .insert([
          {
            organization_id: user?.organization_id,
            campaign_name: newCampaign.campaign_name,
            target_criteria: targetCriteria,
            channel_type: newCampaign.channel_type,
            scheduled_at: newCampaign.scheduled_at || null,
            status: newCampaign.scheduled_at ? 'scheduled' : 'draft',
            total_recipients: audience?.estimatedCount || 0,
            sent_count: 0,
            delivered_count: 0,
            failed_count: 0,
            opt_out_count: 0,
            created_by: user?.id
          }
        ]);

      if (error) throw error;

      setShowCreateModal(false);
      setNewCampaign({
        campaign_name: '',
        channel_type: 'SMS',
        message_template_id: '',
        target_criteria: '',
        scheduled_at: '',
        audience_type: 'all_customers'
      });
      fetchCampaigns();
    } catch (error) {
      console.error('Error creating campaign:', error);
    }
  };

  const updateCampaignStatus = async (campaignId: string, newStatus: string) => {
    try {
      const updateData: any = { status: newStatus };
      
      if (newStatus === 'sending') {
        // Simulate starting the campaign
        updateData.sent_count = 0;
      } else if (newStatus === 'completed') {
        // Simulate completion with random success rates
        const campaign = campaigns.find(c => c.id === campaignId);
        if (campaign) {
          const deliveryRate = 0.95 + Math.random() * 0.04; // 95-99% delivery
          updateData.sent_count = campaign.total_recipients;
          updateData.delivered_count = Math.floor(campaign.total_recipients * deliveryRate);
          updateData.failed_count = campaign.total_recipients - updateData.delivered_count;
        }
      }

      const { error } = await supabase
        .from('bulk_messaging')
        .update(updateData)
        .eq('id', campaignId);

      if (error) throw error;
      fetchCampaigns();
    } catch (error) {
      console.error('Error updating campaign status:', error);
    }
  };

  const deleteCampaign = async (campaignId: string) => {
    if (!confirm('Are you sure you want to delete this campaign?')) return;

    try {
      const { error } = await supabase
        .from('bulk_messaging')
        .delete()
        .eq('id', campaignId);

      if (error) throw error;
      fetchCampaigns();
    } catch (error) {
      console.error('Error deleting campaign:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-emerald-600 bg-emerald-50';
      case 'sending': return 'text-blue-600 bg-blue-50';
      case 'scheduled': return 'text-purple-600 bg-purple-50';
      case 'paused': return 'text-amber-600 bg-amber-50';
      case 'failed': return 'text-red-600 bg-red-50';
      case 'draft': return 'text-gray-600 bg-gray-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return CheckCircle;
      case 'sending': return Play;
      case 'scheduled': return Clock;
      case 'paused': return Pause;
      case 'failed': return XCircle;
      case 'draft': return Edit;
      default: return AlertCircle;
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

  const filteredCampaigns = campaigns.filter(campaign => {
    const channelMatch = selectedChannel === 'all' || campaign.channel_type === selectedChannel;
    const statusMatch = selectedStatus === 'all' || campaign.status === selectedStatus;
    const searchMatch = searchTerm === '' || 
      campaign.campaign_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      campaign.creator_name?.toLowerCase().includes(searchTerm.toLowerCase());
    return channelMatch && statusMatch && searchMatch;
  });

  const formatDateTime = (timestamp: string) => {
    if (!timestamp) return 'Not scheduled';
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const calculateProgress = (campaign: BulkCampaign) => {
    if (campaign.total_recipients === 0) return 0;
    return (campaign.sent_count / campaign.total_recipients) * 100;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading bulk messaging campaigns...</p>
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
              <div className="w-12 h-12 bg-pink-500 rounded-xl flex items-center justify-center">
                <Megaphone className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Bulk Messaging Campaigns</h1>
                <p className="text-gray-600">Create and manage mass communication campaigns</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => fetchCampaigns()}
                className="bg-white/60 backdrop-blur-sm border border-white/20 text-gray-700 px-4 py-2 rounded-xl hover:bg-white/80 transition-all duration-200 flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-pink-600/90 backdrop-blur-sm text-white px-4 py-2 rounded-xl hover:bg-pink-700 transition-all duration-200 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Create Campaign
              </button>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/60 backdrop-blur-sm border border-white/20 rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Campaigns</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.totalCampaigns}</p>
                <p className="text-xs text-pink-600 flex items-center gap-1 mt-1">
                  <Megaphone className="w-3 h-3" />
                  All campaigns
                </p>
              </div>
              <div className="w-12 h-12 bg-pink-100 rounded-xl flex items-center justify-center">
                <Megaphone className="w-6 h-6 text-pink-600" />
              </div>
            </div>
          </div>

          <div className="bg-white/60 backdrop-blur-sm border border-white/20 rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Active Campaigns</p>
                <p className="text-2xl font-bold text-blue-600">{stats?.activeCampaigns}</p>
                <p className="text-xs text-gray-600 flex items-center gap-1 mt-1">
                  <Play className="w-3 h-3" />
                  Currently sending
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Play className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white/60 backdrop-blur-sm border border-white/20 rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Recipients</p>
                <p className="text-2xl font-bold text-emerald-600">{stats?.totalRecipients.toLocaleString()}</p>
                <p className="text-xs text-gray-600 flex items-center gap-1 mt-1">
                  <Users className="w-3 h-3" />
                  All campaigns
                </p>
              </div>
              <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
          </div>

          <div className="bg-white/60 backdrop-blur-sm border border-white/20 rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Delivery Rate</p>
                <p className="text-2xl font-bold text-purple-600">{stats?.deliveryRate}%</p>
                <p className="text-xs text-gray-600 flex items-center gap-1 mt-1">
                  <TrendingUp className="w-3 h-3" />
                  Success rate
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Campaigns List */}
          <div className="lg:col-span-3">
            <div className="bg-white/60 backdrop-blur-sm border border-white/20 rounded-2xl p-6">
              {/* Filters */}
              <div className="mb-6 flex flex-wrap gap-4">
                <div className="flex-1 min-w-64">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Search campaigns..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <select
                  value={selectedChannel}
                  onChange={(e) => setSelectedChannel(e.target.value)}
                  className="px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                >
                  <option value="all">All Channels</option>
                  <option value="SMS">SMS</option>
                  <option value="Email">Email</option>
                  <option value="WhatsApp">WhatsApp</option>
                  <option value="Push">Push</option>
                </select>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                >
                  <option value="all">All Status</option>
                  <option value="draft">Draft</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="sending">Sending</option>
                  <option value="completed">Completed</option>
                  <option value="paused">Paused</option>
                  <option value="failed">Failed</option>
                </select>
              </div>

              {/* Campaigns Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Campaign</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Channel</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Recipients</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Progress</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Status</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCampaigns.map((campaign) => {
                      const StatusIcon = getStatusIcon(campaign.status);
                      const ChannelIcon = getChannelIcon(campaign.channel_type);
                      const progress = calculateProgress(campaign);
                      
                      return (
                        <tr key={campaign.id} className="border-b border-gray-100 hover:bg-gray-50/50">
                          <td className="py-4 px-4">
                            <div>
                              <p className="font-medium text-gray-900">{campaign.campaign_name}</p>
                              <p className="text-sm text-gray-600">
                                by {campaign.creator_name} • {formatDateTime(campaign.created_at)}
                              </p>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-2">
                              <ChannelIcon className="w-4 h-4 text-gray-600" />
                              <span className="text-sm text-gray-900">{campaign.channel_type}</span>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {campaign.total_recipients.toLocaleString()}
                              </p>
                              <p className="text-xs text-gray-600">
                                {campaign.target_criteria?.description || 'Custom audience'}
                              </p>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="w-full">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs text-gray-600">
                                  {campaign.sent_count} / {campaign.total_recipients}
                                </span>
                                <span className="text-xs text-gray-600">{Math.round(progress)}%</span>
                              </div>
                              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-pink-500 rounded-full transition-all duration-200"
                                  style={{ width: `${progress}%` }}
                                ></div>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-2">
                              <StatusIcon className="w-4 h-4" />
                              <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(campaign.status)}`}>
                                {campaign.status}
                              </span>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-2">
                              {campaign.status === 'draft' && (
                                <button
                                  onClick={() => updateCampaignStatus(campaign.id, 'sending')}
                                  className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                                  title="Start Campaign"
                                >
                                  <Play className="w-4 h-4" />
                                </button>
                              )}
                              {campaign.status === 'sending' && (
                                <button
                                  onClick={() => updateCampaignStatus(campaign.id, 'paused')}
                                  className="p-1 text-amber-600 hover:text-amber-800 hover:bg-amber-50 rounded transition-colors"
                                  title="Pause Campaign"
                                >
                                  <Pause className="w-4 h-4" />
                                </button>
                              )}
                              {campaign.status === 'paused' && (
                                <button
                                  onClick={() => updateCampaignStatus(campaign.id, 'sending')}
                                  className="p-1 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 rounded transition-colors"
                                  title="Resume Campaign"
                                >
                                  <Play className="w-4 h-4" />
                                </button>
                              )}
                              {(campaign.status === 'completed' || campaign.status === 'sending') && (
                                <button
                                  className="p-1 text-purple-600 hover:text-purple-800 hover:bg-purple-50 rounded transition-colors"
                                  title="View Analytics"
                                >
                                  <BarChart3 className="w-4 h-4" />
                                </button>
                              )}
                              <button
                                className="p-1 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                title="View Details"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              {campaign.status === 'draft' && (
                                <button
                                  onClick={() => deleteCampaign(campaign.id)}
                                  className="p-1 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                  title="Delete"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {filteredCampaigns.length === 0 && (
                  <div className="text-center py-8">
                    <Megaphone className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600">No campaigns found</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* Campaign Performance */}
            <div className="bg-white/60 backdrop-blur-sm border border-white/20 rounded-2xl p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Overview</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Successful Campaigns</span>
                  <span className="text-sm font-medium text-emerald-600">{stats?.successfulCampaigns}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Avg Campaign Size</span>
                  <span className="text-sm font-medium text-blue-600">{stats?.avgCampaignSize}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Opt-out Rate</span>
                  <span className="text-sm font-medium text-red-600">{stats?.optOutRate}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Scheduled</span>
                  <span className="text-sm font-medium text-purple-600">{stats?.scheduledCampaigns}</span>
                </div>
              </div>
            </div>

            {/* Channel Distribution */}
            <div className="bg-white/60 backdrop-blur-sm border border-white/20 rounded-2xl p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Channel Usage</h3>
              <div className="space-y-3">
                {['SMS', 'Email', 'WhatsApp', 'Push'].map((channel) => {
                  const channelCampaigns = campaigns.filter(c => c.channel_type === channel);
                  const ChannelIcon = getChannelIcon(channel);
                  return (
                    <div key={channel} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ChannelIcon className="w-4 h-4 text-gray-600" />
                        <span className="text-sm text-gray-700">{channel}</span>
                      </div>
                      <span className="text-sm text-gray-600">{channelCampaigns.length}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white/60 backdrop-blur-sm border border-white/20 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button className="w-full text-left p-3 bg-gray-50/50 rounded-xl hover:bg-gray-50 transition-colors flex items-center gap-3">
                  <FileText className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="font-medium text-gray-900">Templates</p>
                    <p className="text-xs text-gray-600">Manage message templates</p>
                  </div>
                </button>
                <button className="w-full text-left p-3 bg-gray-50/50 rounded-xl hover:bg-gray-50 transition-colors flex items-center gap-3">
                  <Target className="w-5 h-5 text-emerald-600" />
                  <div>
                    <p className="font-medium text-gray-900">Audience Builder</p>
                    <p className="text-xs text-gray-600">Create custom audiences</p>
                  </div>
                </button>
                <button className="w-full text-left p-3 bg-gray-50/50 rounded-xl hover:bg-gray-50 transition-colors flex items-center gap-3">
                  <BarChart3 className="w-5 h-5 text-purple-600" />
                  <div>
                    <p className="font-medium text-gray-900">Analytics</p>
                    <p className="text-xs text-gray-600">Campaign performance</p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Create Campaign Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg mx-4">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Create New Campaign</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Campaign Name</label>
                <input
                  type="text"
                  value={newCampaign.campaign_name}
                  onChange={(e) => setNewCampaign({ ...newCampaign, campaign_name: e.target.value })}
                  placeholder="Enter campaign name..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Channel</label>
                <select
                  value={newCampaign.channel_type}
                  onChange={(e) => setNewCampaign({ ...newCampaign, channel_type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                >
                  <option value="SMS">SMS</option>
                  <option value="Email">Email</option>
                  <option value="WhatsApp">WhatsApp</option>
                  <option value="Push">Push Notification</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Target Audience</label>
                <select
                  value={newCampaign.audience_type}
                  onChange={(e) => setNewCampaign({ ...newCampaign, audience_type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                >
                  {targetAudiences.map((audience) => (
                    <option key={audience.criteria} value={audience.criteria}>
                      {audience.description} ({audience.estimatedCount} recipients)
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Schedule (Optional)</label>
                <input
                  type="datetime-local"
                  value={newCampaign.scheduled_at}
                  onChange={(e) => setNewCampaign({ ...newCampaign, scheduled_at: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">Leave empty to save as draft</p>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={createCampaign}
                disabled={!newCampaign.campaign_name || !newCampaign.audience_type}
                className="flex-1 px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Create Campaign
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}