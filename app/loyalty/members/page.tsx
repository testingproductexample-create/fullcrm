'use client';

/**
 * Loyalty Members Management Page
 * View and manage all loyalty program members with filtering
 */

import { useState } from 'react';
import { useLoyaltyMembers, useLoyaltyTiers } from '@/hooks/useLoyalty';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Search, Filter, Download, Crown, Star, TrendingUp, 
  Mail, Phone, Calendar, Award, Gift, Users 
} from 'lucide-react';
import Link from 'next/link';
import type { CustomerLoyaltyStatus, TierLevel } from '@/types/loyalty';

export default function LoyaltyMembersPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<CustomerLoyaltyStatus | 'all'>('all');
  const [tierFilter, setTierFilter] = useState<TierLevel | 'all'>('all');

  const { data: members, isLoading } = useLoyaltyMembers({
    search_query: searchQuery || undefined,
    status: statusFilter !== 'all' ? [statusFilter] : undefined,
  });

  const { data: tiers } = useLoyaltyTiers();

  const getTierBadgeColor = (tierLevel?: number) => {
    switch (tierLevel) {
      case 1: return 'bg-orange-100 text-orange-700 border-orange-200';
      case 2: return 'bg-slate-100 text-slate-700 border-slate-200';
      case 3: return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 4: return 'bg-indigo-100 text-indigo-700 border-indigo-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getTierName = (tierId?: string) => {
    const tier = tiers?.find(t => t.id === tierId);
    return tier?.tier_name || 'No Tier';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading members...</p>
        </div>
      </div>
    );
  }

  const filteredMembers = members?.filter(member => {
    if (tierFilter !== 'all') {
      const tier = tiers?.find(t => t.id === member.current_tier_id);
      if (tier?.tier_level !== tierFilter) return false;
    }
    return true;
  }) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Loyalty Members</h1>
          <p className="text-slate-600 mt-1">{filteredMembers.length} members across all tiers</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" className="border-slate-300">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Users className="h-4 w-4 mr-2" />
            Enroll Member
          </Button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Active Members</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">
                {members?.filter(m => m.status === 'active').length || 0}
              </p>
            </div>
            <Users className="h-8 w-8 text-green-600" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Total Points</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">
                {members?.reduce((sum, m) => sum + (m.current_points_balance || 0), 0).toLocaleString() || 0}
              </p>
            </div>
            <Star className="h-8 w-8 text-amber-600" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Avg. Lifetime Value</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">
                {Math.round((members?.reduce((sum, m) => sum + (m.lifetime_spending_amount || 0), 0) || 0) / (members?.length || 1)).toLocaleString()} AED
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-blue-600" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Premium Tiers</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">
                {tiers?.filter(t => t.tier_level >= 3).reduce((sum, tier) => 
                  sum + (members?.filter(m => m.current_tier_id === tier.id).length || 0), 0
                ) || 0}
              </p>
            </div>
            <Crown className="h-8 w-8 text-purple-600" />
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
                placeholder="Search by loyalty number, name, email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as CustomerLoyaltyStatus | 'all')}
            className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="suspended">Suspended</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <select
            value={tierFilter}
            onChange={(e) => setTierFilter(e.target.value === 'all' ? 'all' : parseInt(e.target.value) as TierLevel)}
            className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Tiers</option>
            <option value="1">Bronze</option>
            <option value="2">Silver</option>
            <option value="3">Gold</option>
            <option value="4">Platinum</option>
          </select>

          <Button variant="outline" className="border-slate-300">
            <Filter className="h-4 w-4 mr-2" />
            More Filters
          </Button>
        </div>
      </Card>

      {/* Members Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                  Member
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                  Tier
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                  Points Balance
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                  Lifetime Spending
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                  Enrolled
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-600 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {filteredMembers.length > 0 ? (
                filteredMembers.map((member) => (
                  <tr key={member.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-slate-900">
                          {member.loyalty_number}
                        </div>
                        <div className="text-sm text-slate-500">
                          Customer ID: {member.customer_id.substring(0, 8)}...
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                        getTierBadgeColor(tiers?.find(t => t.id === member.current_tier_id)?.tier_level)
                      }`}>
                        <Crown className="h-3 w-3 mr-1" />
                        {getTierName(member.current_tier_id)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Star className="h-4 w-4 text-amber-500 mr-1" />
                        <span className="text-sm font-semibold text-slate-900">
                          {member.current_points_balance.toLocaleString()}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500">
                        {member.total_points_earned.toLocaleString()} earned
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-slate-900">
                        {member.lifetime_spending_amount.toLocaleString()} AED
                      </div>
                      <div className="text-xs text-slate-500">
                        {member.total_orders_count} orders
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        member.status === 'active' 
                          ? 'bg-green-100 text-green-700'
                          : member.status === 'suspended'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-slate-100 text-slate-700'
                      }`}>
                        {member.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        {new Date(member.enrollment_date).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link 
                        href={`/loyalty/members/${member.id}`}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        View Details
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <Users className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-slate-900 mb-2">No members found</h3>
                    <p className="text-slate-600">Try adjusting your search or filter criteria</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
