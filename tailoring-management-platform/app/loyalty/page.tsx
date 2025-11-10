'use client';

/**
 * Loyalty Programs Overview Dashboard
 * Main dashboard showing program overview, tier distribution, and key metrics
 */

import { useState } from 'react';
import { useLoyaltyPrograms, useLoyaltyDashboard, useLoyaltyMembers } from '@/hooks/useLoyalty';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Users, Award, TrendingUp, Gift, Target, Crown, Star } from 'lucide-react';
import Link from 'next/link';

export default function LoyaltyProgramsPage() {
  const { data: programs, isLoading: programsLoading } = useLoyaltyPrograms();
  const { data: members, isLoading: membersLoading } = useLoyaltyMembers();
  const { data: dashboardMetrics } = useLoyaltyDashboard();

  const [selectedProgramId, setSelectedProgramId] = useState<string | undefined>();

  // Calculate overview metrics
  const activePrograms = programs?.filter(p => p.status === 'active').length || 0;
  const totalMembers = members?.length || 0;
  const activeMembers = members?.filter(m => m.status === 'active').length || 0;

  if (programsLoading || membersLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading loyalty programs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Loyalty Programs</h1>
          <p className="text-slate-600 mt-1">Manage customer loyalty and rewards programs</p>
        </div>
        <Link href="/loyalty/programs/new">
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-2" />
            New Program
          </Button>
        </Link>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-700">Active Programs</p>
              <p className="text-3xl font-bold text-blue-900 mt-2">{activePrograms}</p>
              <p className="text-xs text-blue-600 mt-1">of {programs?.length || 0} total</p>
            </div>
            <div className="bg-blue-200 p-3 rounded-full">
              <Award className="h-8 w-8 text-blue-700" />
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-700">Total Members</p>
              <p className="text-3xl font-bold text-green-900 mt-2">{totalMembers.toLocaleString()}</p>
              <p className="text-xs text-green-600 mt-1">{activeMembers} active</p>
            </div>
            <div className="bg-green-200 p-3 rounded-full">
              <Users className="h-8 w-8 text-green-700" />
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-700">Points Issued</p>
              <p className="text-3xl font-bold text-purple-900 mt-2">
                {(dashboardMetrics?.total_points_earned || 0).toLocaleString()}
              </p>
              <p className="text-xs text-purple-600 mt-1">lifetime</p>
            </div>
            <div className="bg-purple-200 p-3 rounded-full">
              <Star className="h-8 w-8 text-purple-700" />
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-amber-700">Rewards Redeemed</p>
              <p className="text-3xl font-bold text-amber-900 mt-2">
                {(dashboardMetrics?.total_rewards_redeemed || 0).toLocaleString()}
              </p>
              <p className="text-xs text-amber-600 mt-1">
                {(dashboardMetrics?.rewards_value_aed || 0).toLocaleString()} AED value
              </p>
            </div>
            <div className="bg-amber-200 p-3 rounded-full">
              <Gift className="h-8 w-8 text-amber-700" />
            </div>
          </div>
        </Card>
      </div>

      {/* Tier Distribution */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
          <Crown className="h-5 w-5 mr-2 text-amber-600" />
          Tier Distribution
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg border border-orange-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-orange-700">Bronze</span>
              <span className="text-2xl font-bold text-orange-900">
                {dashboardMetrics?.tier_distribution?.bronze || 0}
              </span>
            </div>
            <div className="w-full bg-orange-200 rounded-full h-2">
              <div 
                className="bg-orange-600 h-2 rounded-full" 
                style={{ 
                  width: `${((dashboardMetrics?.tier_distribution?.bronze || 0) / totalMembers * 100) || 0}%` 
                }}
              />
            </div>
          </div>

          <div className="p-4 bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-700">Silver</span>
              <span className="text-2xl font-bold text-slate-900">
                {dashboardMetrics?.tier_distribution?.silver || 0}
              </span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2">
              <div 
                className="bg-slate-600 h-2 rounded-full" 
                style={{ 
                  width: `${((dashboardMetrics?.tier_distribution?.silver || 0) / totalMembers * 100) || 0}%` 
                }}
              />
            </div>
          </div>

          <div className="p-4 bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg border border-yellow-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-yellow-700">Gold</span>
              <span className="text-2xl font-bold text-yellow-900">
                {dashboardMetrics?.tier_distribution?.gold || 0}
              </span>
            </div>
            <div className="w-full bg-yellow-200 rounded-full h-2">
              <div 
                className="bg-yellow-600 h-2 rounded-full" 
                style={{ 
                  width: `${((dashboardMetrics?.tier_distribution?.gold || 0) / totalMembers * 100) || 0}%` 
                }}
              />
            </div>
          </div>

          <div className="p-4 bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-lg border border-indigo-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-indigo-700">Platinum</span>
              <span className="text-2xl font-bold text-indigo-900">
                {dashboardMetrics?.tier_distribution?.platinum || 0}
              </span>
            </div>
            <div className="w-full bg-indigo-200 rounded-full h-2">
              <div 
                className="bg-indigo-600 h-2 rounded-full" 
                style={{ 
                  width: `${((dashboardMetrics?.tier_distribution?.platinum || 0) / totalMembers * 100) || 0}%` 
                }}
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Programs List */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Active Programs</h2>
        <div className="space-y-4">
          {programs && programs.length > 0 ? (
            programs.map((program) => (
              <Link key={program.id} href={`/loyalty/programs/${program.id}`}>
                <div className="p-4 border border-slate-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all cursor-pointer">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <h3 className="text-lg font-semibold text-slate-900">{program.program_name}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          program.status === 'active' 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-slate-100 text-slate-700'
                        }`}>
                          {program.status}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600 mt-1">{program.program_description || 'No description'}</p>
                      <div className="flex items-center space-x-6 mt-3 text-sm">
                        <span className="text-slate-600">
                          <strong className="text-slate-900">{program.earning_rate}</strong> points per {program.currency}
                        </span>
                        <span className="text-slate-600">
                          Code: <strong className="text-slate-900">{program.program_code}</strong>
                        </span>
                        <span className="text-slate-600">
                          Launched: <strong className="text-slate-900">{new Date(program.launch_date).toLocaleDateString()}</strong>
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm" className="text-blue-600">
                        View Details
                      </Button>
                    </div>
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <div className="text-center py-12">
              <Award className="h-16 w-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">No loyalty programs yet</h3>
              <p className="text-slate-600 mb-4">Create your first loyalty program to start rewarding customers</p>
              <Link href="/loyalty/programs/new">
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Program
                </Button>
              </Link>
            </div>
          )}
        </div>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link href="/loyalty/members">
          <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer border-2 border-transparent hover:border-blue-200">
            <div className="flex items-center space-x-4">
              <div className="bg-blue-100 p-3 rounded-full">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">Manage Members</h3>
                <p className="text-sm text-slate-600">View and manage loyalty members</p>
              </div>
            </div>
          </Card>
        </Link>

        <Link href="/loyalty/rewards">
          <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer border-2 border-transparent hover:border-purple-200">
            <div className="flex items-center space-x-4">
              <div className="bg-purple-100 p-3 rounded-full">
                <Gift className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">Rewards Catalog</h3>
                <p className="text-sm text-slate-600">Manage available rewards</p>
              </div>
            </div>
          </Card>
        </Link>

        <Link href="/loyalty/campaigns">
          <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer border-2 border-transparent hover:border-green-200">
            <div className="flex items-center space-x-4">
              <div className="bg-green-100 p-3 rounded-full">
                <Target className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">Campaigns</h3>
                <p className="text-sm text-slate-600">Create promotional campaigns</p>
              </div>
            </div>
          </Card>
        </Link>
      </div>
    </div>
  );
}
