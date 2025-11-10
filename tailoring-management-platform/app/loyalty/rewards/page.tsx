'use client';

/**
 * Rewards Catalog Page
 * Browse and manage available rewards for redemption
 */

import { useState } from 'react';
import { useRewardsCatalog, useCreateReward, useUpdateReward, useDeleteReward } from '@/hooks/useLoyalty';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Search, Plus, Gift, Star, Tag, Calendar, Package,
  TrendingUp, Award, Filter, Edit, Trash2
} from 'lucide-react';
import type { RewardCategory } from '@/types/loyalty';

export default function RewardsCatalogPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<RewardCategory | 'all'>('all');
  const [showActiveOnly, setShowActiveOnly] = useState(true);

  const { data: rewards, isLoading } = useRewardsCatalog({
    search_query: searchQuery || undefined,
    categories: categoryFilter !== 'all' ? [categoryFilter] : undefined,
    is_active: showActiveOnly || undefined,
  });

  const getCategoryIcon = (category: RewardCategory) => {
    switch (category) {
      case 'discount': return <Tag className="h-5 w-5" />;
      case 'product': return <Package className="h-5 w-5" />;
      case 'service': return <Award className="h-5 w-5" />;
      case 'experience': return <TrendingUp className="h-5 w-5" />;
      case 'voucher': return <Gift className="h-5 w-5" />;
      default: return <Gift className="h-5 w-5" />;
    }
  };

  const getCategoryColor = (category: RewardCategory) => {
    switch (category) {
      case 'discount': return 'bg-green-100 text-green-700 border-green-200';
      case 'product': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'service': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'experience': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'voucher': return 'bg-pink-100 text-pink-700 border-pink-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading rewards...</p>
        </div>
      </div>
    );
  }

  const featuredRewards = rewards?.filter(r => r.featured) || [];
  const totalRedemptions = rewards?.reduce((sum, r) => sum + (r.total_redemptions || 0), 0) || 0;
  const totalValue = rewards?.reduce((sum, r) => sum + ((r.cash_value_aed || 0) * (r.total_redemptions || 0)), 0) || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Rewards Catalog</h1>
          <p className="text-slate-600 mt-1">{rewards?.length || 0} rewards available</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" />
          Add Reward
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-700">Total Rewards</p>
              <p className="text-2xl font-bold text-blue-900 mt-1">{rewards?.length || 0}</p>
              <p className="text-xs text-blue-600 mt-1">
                {rewards?.filter(r => r.is_active).length} active
              </p>
            </div>
            <Gift className="h-8 w-8 text-blue-600" />
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-700">Total Redemptions</p>
              <p className="text-2xl font-bold text-green-900 mt-1">{totalRedemptions.toLocaleString()}</p>
              <p className="text-xs text-green-600 mt-1">all time</p>
            </div>
            <TrendingUp className="h-8 w-8 text-green-600" />
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-700">Value Redeemed</p>
              <p className="text-2xl font-bold text-purple-900 mt-1">{totalValue.toLocaleString()}</p>
              <p className="text-xs text-purple-600 mt-1">AED total value</p>
            </div>
            <Award className="h-8 w-8 text-purple-600" />
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-amber-700">Featured Items</p>
              <p className="text-2xl font-bold text-amber-900 mt-1">{featuredRewards.length}</p>
              <p className="text-xs text-amber-600 mt-1">highlighted rewards</p>
            </div>
            <Star className="h-8 w-8 text-amber-600" />
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
                placeholder="Search rewards by name or code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as RewardCategory | 'all')}
            className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Categories</option>
            <option value="discount">Discounts</option>
            <option value="product">Products</option>
            <option value="service">Services</option>
            <option value="experience">Experiences</option>
            <option value="voucher">Vouchers</option>
            <option value="upgrade">Upgrades</option>
          </select>

          <Button
            variant={showActiveOnly ? "default" : "outline"}
            onClick={() => setShowActiveOnly(!showActiveOnly)}
            className={showActiveOnly ? "bg-blue-600" : "border-slate-300"}
          >
            <Filter className="h-4 w-4 mr-2" />
            Active Only
          </Button>
        </div>
      </Card>

      {/* Featured Rewards */}
      {featuredRewards.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
            <Star className="h-5 w-5 mr-2 text-amber-500" />
            Featured Rewards
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featuredRewards.map((reward) => (
              <Card key={reward.id} className="p-6 border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-white">
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-2 rounded-lg ${getCategoryColor(reward.reward_category)}`}>
                    {getCategoryIcon(reward.reward_category)}
                  </div>
                  <Star className="h-5 w-5 text-amber-500 fill-current" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">{reward.reward_name}</h3>
                <p className="text-sm text-slate-600 mb-4">{reward.short_description}</p>
                <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                  <div>
                    <p className="text-2xl font-bold text-blue-600">{reward.points_required.toLocaleString()}</p>
                    <p className="text-xs text-slate-600">points required</p>
                  </div>
                  <Button size="sm" variant="outline">View Details</Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* All Rewards Grid */}
      <div>
        <h2 className="text-lg font-semibold text-slate-900 mb-4">All Rewards</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rewards && rewards.length > 0 ? (
            rewards.map((reward) => (
              <Card key={reward.id} className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-2 rounded-lg border ${getCategoryColor(reward.reward_category)}`}>
                    {getCategoryIcon(reward.reward_category)}
                  </div>
                  <div className="flex items-center space-x-2">
                    {reward.featured && <Star className="h-4 w-4 text-amber-500 fill-current" />}
                    {!reward.is_active && (
                      <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full">Inactive</span>
                    )}
                  </div>
                </div>

                <h3 className="text-lg font-semibold text-slate-900 mb-2">{reward.reward_name}</h3>
                <p className="text-sm text-slate-600 mb-4 line-clamp-2">{reward.short_description}</p>

                <div className="space-y-2 mb-4 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">Points Required</span>
                    <span className="font-semibold text-blue-600">{reward.points_required.toLocaleString()}</span>
                  </div>
                  {reward.cash_value_aed && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">Value</span>
                      <span className="font-semibold text-slate-900">{reward.cash_value_aed} AED</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">Redeemed</span>
                    <span className="font-semibold text-slate-900">{reward.total_redemptions || 0} times</span>
                  </div>
                  {!reward.is_unlimited && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">Stock</span>
                      <span className={`font-semibold ${
                        (reward.remaining_quantity || 0) > 10 ? 'text-green-600' : 
                        (reward.remaining_quantity || 0) > 0 ? 'text-amber-600' : 
                        'text-red-600'
                      }`}>
                        {reward.remaining_quantity || 0} left
                      </span>
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
                  <span className={`text-xs px-2 py-1 rounded-full border font-medium ${getCategoryColor(reward.reward_category)}`}>
                    {reward.reward_category}
                  </span>
                  <div className="flex items-center space-x-2">
                    <Button size="sm" variant="outline" className="text-blue-600">
                      <Edit className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          ) : (
            <div className="col-span-3 text-center py-12">
              <Gift className="h-16 w-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">No rewards found</h3>
              <p className="text-slate-600 mb-4">Create your first reward to start engaging customers</p>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                Add Reward
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
