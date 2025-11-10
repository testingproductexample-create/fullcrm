'use client';

/**
 * Loyalty Campaigns Page
 * Create and manage promotional loyalty campaigns
 */

import { useState } from 'react';
import { useCampaigns, useCreateCampaign, useUpdateCampaign } from '@/hooks/useLoyalty';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Search, Plus, Target, TrendingUp, Users, Calendar,
  Zap, Award, BarChart3, Play, Pause, CheckCircle
} from 'lucide-react';
import type { CampaignType, CampaignStatus } from '@/types/loyalty';

export default function CampaignsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<CampaignStatus | 'all'>('all');

  const { data: campaigns, isLoading } = useCampaigns({
    search_query: searchQuery || undefined,
    statuses: statusFilter !== 'all' ? [statusFilter] : undefined,
  });

  const updateCampaign = useUpdateCampaign();

  const getCampaignTypeColor = (type: CampaignType) => {
    switch (type) {
      case 'bonus_points': return 'bg-green-100 text-green-700 border-green-200';
      case 'double_points': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'tier_boost': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'special_reward': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'seasonal': return 'bg-pink-100 text-pink-700 border-pink-200';
      case 'flash_sale': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getStatusColor = (status: CampaignStatus) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-700 border-green-200';
      case 'scheduled': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'paused': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'completed': return 'bg-slate-100 text-slate-700 border-slate-200';
      case 'cancelled': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
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

  const activeCampaigns = campaigns?.filter(c => c.status === 'active').length || 0;
  const scheduledCampaigns = campaigns?.filter(c => c.status === 'scheduled').length || 0;
  const totalParticipants = campaigns?.reduce((sum, c) => sum + (c.total_participants || 0), 0) || 0;
  const totalPointsAwarded = campaigns?.reduce((sum, c) => sum + (c.total_points_awarded || 0), 0) || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Loyalty Campaigns</h1>
          <p className="text-slate-600 mt-1">{campaigns?.length || 0} total campaigns</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" />
          Create Campaign
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-700">Active Campaigns</p>
              <p className="text-2xl font-bold text-green-900 mt-1">{activeCampaigns}</p>
              <p className="text-xs text-green-600 mt-1">running now</p>
            </div>
            <Zap className="h-8 w-8 text-green-600" />
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-700">Scheduled</p>
              <p className="text-2xl font-bold text-blue-900 mt-1">{scheduledCampaigns}</p>
              <p className="text-xs text-blue-600 mt-1">upcoming</p>
            </div>
            <Calendar className="h-8 w-8 text-blue-600" />
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-700">Total Participants</p>
              <p className="text-2xl font-bold text-purple-900 mt-1">{totalParticipants.toLocaleString()}</p>
              <p className="text-xs text-purple-600 mt-1">all campaigns</p>
            </div>
            <Users className="h-8 w-8 text-purple-600" />
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-amber-700">Points Awarded</p>
              <p className="text-2xl font-bold text-amber-900 mt-1">{totalPointsAwarded.toLocaleString()}</p>
              <p className="text-xs text-amber-600 mt-1">total distributed</p>
            </div>
            <Award className="h-8 w-8 text-amber-600" />
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-6">
        <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                type="text"
                placeholder="Search campaigns by name or code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as CampaignStatus | 'all')}
            className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="scheduled">Scheduled</option>
            <option value="paused">Paused</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </Card>

      {/* Campaigns List */}
      <div className="space-y-4">
        {campaigns && campaigns.length > 0 ? (
          campaigns.map((campaign) => (
            <Card key={campaign.id} className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-3">
                    <h3 className="text-lg font-semibold text-slate-900">{campaign.campaign_name}</h3>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                      getStatusColor(campaign.status)
                    }`}>
                      {campaign.status}
                    </span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                      getCampaignTypeColor(campaign.campaign_type)
                    }`}>
                      {campaign.campaign_type.replace('_', ' ')}
                    </span>
                  </div>

                  <p className="text-sm text-slate-600 mb-4">{campaign.campaign_description}</p>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-xs text-slate-600 mb-1">Campaign Period</p>
                      <p className="text-sm font-medium text-slate-900 flex items-center">
                        <Calendar className="h-4 w-4 mr-1 text-slate-500" />
                        {new Date(campaign.start_date).toLocaleDateString()} - {new Date(campaign.end_date).toLocaleDateString()}
                      </p>
                    </div>

                    {campaign.bonus_points && (
                      <div>
                        <p className="text-xs text-slate-600 mb-1">Bonus Points</p>
                        <p className="text-sm font-medium text-slate-900 flex items-center">
                          <Award className="h-4 w-4 mr-1 text-amber-500" />
                          {campaign.bonus_points.toLocaleString()} points
                        </p>
                      </div>
                    )}

                    {campaign.points_multiplier && campaign.points_multiplier > 1 && (
                      <div>
                        <p className="text-xs text-slate-600 mb-1">Multiplier</p>
                        <p className="text-sm font-medium text-slate-900 flex items-center">
                          <TrendingUp className="h-4 w-4 mr-1 text-green-500" />
                          {campaign.points_multiplier}x points
                        </p>
                      </div>
                    )}

                    <div>
                      <p className="text-xs text-slate-600 mb-1">Participants</p>
                      <p className="text-sm font-medium text-slate-900 flex items-center">
                        <Users className="h-4 w-4 mr-1 text-blue-500" />
                        {campaign.total_participants.toLocaleString()}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-slate-600 mb-1">Points Awarded</p>
                      <p className="text-sm font-medium text-slate-900 flex items-center">
                        <Award className="h-4 w-4 mr-1 text-purple-500" />
                        {campaign.total_points_awarded.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {campaign.total_budget_points && (
                    <div className="mt-4">
                      <div className="flex items-center justify-between text-xs text-slate-600 mb-1">
                        <span>Budget Utilization</span>
                        <span>{Math.round((campaign.points_allocated / campaign.total_budget_points) * 100)}%</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all" 
                          style={{ width: `${Math.min((campaign.points_allocated / campaign.total_budget_points) * 100, 100)}%` }}
                        />
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        {campaign.points_allocated.toLocaleString()} / {campaign.total_budget_points.toLocaleString()} points used
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex flex-col space-y-2 ml-4">
                  {campaign.status === 'draft' && (
                    <Button 
                      size="sm" 
                      className="bg-green-600 hover:bg-green-700"
                      onClick={() => updateCampaign.mutate({
                        id: campaign.id,
                        updates: { status: 'scheduled' }
                      })}
                    >
                      <Calendar className="h-4 w-4 mr-1" />
                      Schedule
                    </Button>
                  )}

                  {campaign.status === 'scheduled' && (
                    <Button 
                      size="sm" 
                      className="bg-blue-600 hover:bg-blue-700"
                      onClick={() => updateCampaign.mutate({
                        id: campaign.id,
                        updates: { status: 'active' }
                      })}
                    >
                      <Play className="h-4 w-4 mr-1" />
                      Activate
                    </Button>
                  )}

                  {campaign.status === 'active' && (
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="border-yellow-300 text-yellow-700 hover:bg-yellow-50"
                      onClick={() => updateCampaign.mutate({
                        id: campaign.id,
                        updates: { status: 'paused' }
                      })}
                    >
                      <Pause className="h-4 w-4 mr-1" />
                      Pause
                    </Button>
                  )}

                  {campaign.status === 'paused' && (
                    <Button 
                      size="sm" 
                      className="bg-blue-600 hover:bg-blue-700"
                      onClick={() => updateCampaign.mutate({
                        id: campaign.id,
                        updates: { status: 'active' }
                      })}
                    >
                      <Play className="h-4 w-4 mr-1" />
                      Resume
                    </Button>
                  )}

                  <Button size="sm" variant="outline" className="border-slate-300">
                    <BarChart3 className="h-4 w-4 mr-1" />
                    View Analytics
                  </Button>

                  <Button size="sm" variant="outline" className="border-slate-300">
                    Edit Campaign
                  </Button>
                </div>
              </div>
            </Card>
          ))
        ) : (
          <Card className="p-12 text-center">
            <Target className="h-16 w-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">No campaigns yet</h3>
            <p className="text-slate-600 mb-4">Create promotional campaigns to boost customer engagement</p>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Create First Campaign
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
}
