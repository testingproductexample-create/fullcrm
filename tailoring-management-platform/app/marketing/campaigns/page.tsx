'use client';

/**
 * Marketing Campaigns Management
 * Comprehensive campaign creation, management, and monitoring
 */

import { useState, useMemo } from 'react';
import { 
  useMarketingCampaigns, 
  useCreateMarketingCampaign, 
  useUpdateMarketingCampaign,
  useDeleteMarketingCampaign,
  useSendCampaign,
  useEmailTemplates,
  useCustomerSegments 
} from '@/hooks/useMarketing';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  Plus, Mail, Users, Calendar, Send, Edit, Trash2, Play, Pause, 
  Eye, MousePointer, TrendingUp, Filter, Search, MoreHorizontal,
  Clock, Target, BarChart3
} from 'lucide-react';
import { format } from 'date-fns';
import { CampaignStatus, CampaignType } from '@/types/marketing';

export default function MarketingCampaignsPage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    status: '' as CampaignStatus | '',
    campaign_type: '' as CampaignType | '',
    search_query: ''
  });

  const { data: campaigns, isLoading, refetch } = useMarketingCampaigns({
    status: filters.status ? [filters.status] : undefined,
    campaign_type: filters.campaign_type ? [filters.campaign_type] : undefined,
    search_query: filters.search_query || undefined
  });
  const { data: templates } = useEmailTemplates();
  const { data: segments } = useCustomerSegments();
  
  const createMutation = useCreateMarketingCampaign();
  const updateMutation = useUpdateMarketingCampaign();
  const deleteMutation = useDeleteMarketingCampaign();
  const sendMutation = useSendCampaign();

  const [newCampaign, setNewCampaign] = useState({
    campaign_name: '',
    campaign_code: '',
    campaign_type: 'email' as CampaignType,
    campaign_description: '',
    subject_line: '',
    email_template_id: '',
    target_audience: 'all_customers' as const,
    segment_id: '',
    send_type: 'scheduled' as const,
    scheduled_send_date: '',
    is_ab_test: false,
  });

  // Filter campaigns
  const filteredCampaigns = useMemo(() => {
    if (!campaigns?.data) return [];
    return campaigns.data;
  }, [campaigns]);

  // Status badge component
  const StatusBadge = ({ status }: { status: CampaignStatus }) => {
    const statusConfig = {
      draft: { label: 'Draft', className: 'bg-gray-100 text-gray-800' },
      scheduled: { label: 'Scheduled', className: 'bg-blue-100 text-blue-800' },
      sending: { label: 'Sending', className: 'bg-yellow-100 text-yellow-800' },
      sent: { label: 'Sent', className: 'bg-green-100 text-green-800' },
      paused: { label: 'Paused', className: 'bg-orange-100 text-orange-800' },
      cancelled: { label: 'Cancelled', className: 'bg-red-100 text-red-800' },
      completed: { label: 'Completed', className: 'bg-emerald-100 text-emerald-800' }
    };
    
    const config = statusConfig[status];
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  // Campaign type icon
  const CampaignTypeIcon = ({ type }: { type: CampaignType }) => {
    const icons = {
      email: Mail,
      sms: MessageSquare,
      push: Bell,
      multichannel: Globe,
      automated_sequence: Workflow
    } as any;
    
    const Icon = icons[type] || Mail;
    return <Icon className="h-4 w-4" />;
  };

  const handleCreateCampaign = async () => {
    try {
      await createMutation.mutateAsync({
        ...newCampaign,
        organization_id: '' // Will be set by backend
      });
      setIsCreateModalOpen(false);
      setNewCampaign({
        campaign_name: '',
        campaign_code: '',
        campaign_type: 'email',
        campaign_description: '',
        subject_line: '',
        email_template_id: '',
        target_audience: 'all_customers',
        segment_id: '',
        send_type: 'scheduled',
        scheduled_send_date: '',
        is_ab_test: false,
      });
      refetch();
    } catch (error) {
      console.error('Failed to create campaign:', error);
    }
  };

  const handleSendCampaign = async (campaignId: string) => {
    try {
      await sendMutation.mutateAsync(campaignId);
      refetch();
    } catch (error) {
      console.error('Failed to send campaign:', error);
    }
  };

  const handleDeleteCampaign = async (campaignId: string) => {
    if (confirm('Are you sure you want to delete this campaign?')) {
      try {
        await deleteMutation.mutateAsync(campaignId);
        refetch();
      } catch (error) {
        console.error('Failed to delete campaign:', error);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading campaigns...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Marketing Campaigns</h1>
          <p className="text-slate-600 mt-1">Create and manage email marketing campaigns</p>
        </div>
        <Button 
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Campaign
        </Button>
      </div>

      {/* Filters */}
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <Label htmlFor="search">Search Campaigns</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                id="search"
                placeholder="Search by name or subject..."
                className="pl-10"
                value={filters.search_query}
                onChange={(e) => setFilters({ ...filters, search_query: e.target.value })}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="status">Status</Label>
            <Select 
              value={filters.status} 
              onValueChange={(value) => setFilters({ ...filters, status: value as CampaignStatus })}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Statuses</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="sending">Sending</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="type">Campaign Type</Label>
            <Select 
              value={filters.campaign_type} 
              onValueChange={(value) => setFilters({ ...filters, campaign_type: value as CampaignType })}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Types</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="sms">SMS</SelectItem>
                <SelectItem value="multichannel">Multi-channel</SelectItem>
                <SelectItem value="automated_sequence">Automation</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-end">
            <Button variant="outline" className="w-full">
              <Filter className="h-4 w-4 mr-2" />
              Advanced Filters
            </Button>
          </div>
        </div>
      </Card>

      {/* Campaigns List */}
      <div className="grid gap-6">
        {filteredCampaigns.map((campaign) => (
          <Card key={campaign.id} className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <CampaignTypeIcon type={campaign.campaign_type} />
                  <h3 className="text-lg font-semibold text-slate-900">{campaign.campaign_name}</h3>
                </div>
                <StatusBadge status={campaign.status} />
                {campaign.is_ab_test && (
                  <Badge className="bg-purple-100 text-purple-800">A/B Test</Badge>
                )}
              </div>
              
              <div className="flex items-center space-x-2">
                {campaign.status === 'draft' && (
                  <Button size="sm" onClick={() => handleSendCampaign(campaign.id)}>
                    <Send className="h-4 w-4 mr-1" />
                    Send
                  </Button>
                )}
                
                {campaign.status === 'scheduled' && (
                  <Button size="sm" variant="outline">
                    <Pause className="h-4 w-4 mr-1" />
                    Pause
                  </Button>
                )}
                
                <Button size="sm" variant="outline">
                  <Edit className="h-4 w-4" />
                </Button>
                
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => handleDeleteCampaign(campaign.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <p className="text-sm text-slate-600 mb-1">Subject Line</p>
                <p className="font-medium text-slate-900">{campaign.subject_line || 'No subject line'}</p>
              </div>
              
              <div>
                <p className="text-sm text-slate-600 mb-1">Target Audience</p>
                <p className="font-medium text-slate-900 capitalize">
                  {campaign.target_audience.replace('_', ' ')}
                </p>
              </div>
              
              <div>
                <p className="text-sm text-slate-600 mb-1">Scheduled Send</p>
                <p className="font-medium text-slate-900">
                  {campaign.scheduled_send_date 
                    ? format(new Date(campaign.scheduled_send_date), 'MMM dd, yyyy HH:mm')
                    : 'Not scheduled'
                  }
                </p>
              </div>
            </div>

            {/* Campaign Metrics */}
            {campaign.status === 'sent' || campaign.status === 'completed' && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t">
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4 text-blue-600" />
                  <div>
                    <p className="text-xs text-slate-600">Sent</p>
                    <p className="font-semibold">{campaign.emails_sent?.toLocaleString() || 0}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Eye className="h-4 w-4 text-purple-600" />
                  <div>
                    <p className="text-xs text-slate-600">Opens</p>
                    <p className="font-semibold">{campaign.emails_opened?.toLocaleString() || 0}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <MousePointer className="h-4 w-4 text-green-600" />
                  <div>
                    <p className="text-xs text-slate-600">Clicks</p>
                    <p className="font-semibold">{campaign.emails_clicked?.toLocaleString() || 0}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-4 w-4 text-amber-600" />
                  <div>
                    <p className="text-xs text-slate-600">Conversions</p>
                    <p className="font-semibold">{campaign.conversion_count?.toLocaleString() || 0}</p>
                  </div>
                </div>
              </div>
            )}
          </Card>
        ))}

        {filteredCampaigns.length === 0 && (
          <Card className="p-12 text-center">
            <Mail className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No campaigns found</h3>
            <p className="text-slate-600 mb-6">Create your first marketing campaign to get started.</p>
            <Button 
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Campaign
            </Button>
          </Card>
        )}
      </div>

      {/* Create Campaign Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">Create New Campaign</h2>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setIsCreateModalOpen(false)}
                >
                  Cancel
                </Button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="campaign_name">Campaign Name</Label>
                    <Input
                      id="campaign_name"
                      value={newCampaign.campaign_name}
                      onChange={(e) => setNewCampaign({ ...newCampaign, campaign_name: e.target.value })}
                      placeholder="Enter campaign name"
                    />
                  </div>

                  <div>
                    <Label htmlFor="campaign_code">Campaign Code</Label>
                    <Input
                      id="campaign_code"
                      value={newCampaign.campaign_code}
                      onChange={(e) => setNewCampaign({ ...newCampaign, campaign_code: e.target.value })}
                      placeholder="CAMP_001"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="campaign_type">Campaign Type</Label>
                  <Select 
                    value={newCampaign.campaign_type} 
                    onValueChange={(value) => setNewCampaign({ ...newCampaign, campaign_type: value as CampaignType })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="email">Email Campaign</SelectItem>
                      <SelectItem value="sms">SMS Campaign</SelectItem>
                      <SelectItem value="multichannel">Multi-channel Campaign</SelectItem>
                      <SelectItem value="automated_sequence">Automated Sequence</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="subject_line">Subject Line</Label>
                  <Input
                    id="subject_line"
                    value={newCampaign.subject_line}
                    onChange={(e) => setNewCampaign({ ...newCampaign, subject_line: e.target.value })}
                    placeholder="Enter email subject line"
                  />
                </div>

                <div>
                  <Label htmlFor="campaign_description">Description</Label>
                  <Textarea
                    id="campaign_description"
                    value={newCampaign.campaign_description}
                    onChange={(e) => setNewCampaign({ ...newCampaign, campaign_description: e.target.value })}
                    placeholder="Campaign description (optional)"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="email_template">Email Template</Label>
                    <Select 
                      value={newCampaign.email_template_id} 
                      onValueChange={(value) => setNewCampaign({ ...newCampaign, email_template_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select template" />
                      </SelectTrigger>
                      <SelectContent>
                        {templates?.map((template) => (
                          <SelectItem key={template.id} value={template.id}>
                            {template.template_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="target_segment">Target Segment</Label>
                    <Select 
                      value={newCampaign.segment_id} 
                      onValueChange={(value) => setNewCampaign({ ...newCampaign, segment_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All customers" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All Customers</SelectItem>
                        {segments?.map((segment) => (
                          <SelectItem key={segment.id} value={segment.id}>
                            {segment.segment_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="scheduled_send_date">Scheduled Send Date</Label>
                  <Input
                    id="scheduled_send_date"
                    type="datetime-local"
                    value={newCampaign.scheduled_send_date}
                    onChange={(e) => setNewCampaign({ ...newCampaign, scheduled_send_date: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <Button 
                  variant="outline" 
                  onClick={() => setIsCreateModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleCreateCampaign}
                  disabled={createMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {createMutation.isPending ? 'Creating...' : 'Create Campaign'}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

// Add missing imports for demonstration
const MessageSquare = Mail;
const Bell = Mail;
const Globe = Mail;
const Workflow = Mail;