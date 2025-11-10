'use client';

/**
 * Reward Redemptions Page
 * Track and manage customer reward redemptions
 */

import { useState } from 'react';
import { useRedemptions, useUpdateRedemption } from '@/hooks/useLoyalty';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Search, Filter, Package, CheckCircle, XCircle, Clock,
  Truck, Gift, User, Calendar, Star
} from 'lucide-react';
import type { RedemptionStatus } from '@/types/loyalty';

export default function RedemptionsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<RedemptionStatus | 'all'>('all');

  const { data: redemptions, isLoading } = useRedemptions({
    search_query: searchQuery || undefined,
    statuses: statusFilter !== 'all' ? [statusFilter] : undefined,
  });

  const updateRedemption = useUpdateRedemption();

  const getStatusColor = (status: RedemptionStatus) => {
    switch (status) {
      case 'fulfilled': return 'bg-green-100 text-green-700 border-green-200';
      case 'processing': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'pending': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'approved': return 'bg-cyan-100 text-cyan-700 border-cyan-200';
      case 'cancelled': return 'bg-red-100 text-red-700 border-red-200';
      case 'rejected': return 'bg-red-100 text-red-700 border-red-200';
      case 'expired': return 'bg-slate-100 text-slate-700 border-slate-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getStatusIcon = (status: RedemptionStatus) => {
    switch (status) {
      case 'fulfilled': return <CheckCircle className="h-4 w-4" />;
      case 'processing': return <Package className="h-4 w-4" />;
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'cancelled': return <XCircle className="h-4 w-4" />;
      case 'rejected': return <XCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading redemptions...</p>
        </div>
      </div>
    );
  }

  const pendingCount = redemptions?.filter(r => r.status === 'pending').length || 0;
  const processingCount = redemptions?.filter(r => r.status === 'processing').length || 0;
  const fulfilledCount = redemptions?.filter(r => r.status === 'fulfilled').length || 0;
  const totalPointsUsed = redemptions?.reduce((sum, r) => sum + r.points_used, 0) || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Reward Redemptions</h1>
          <p className="text-slate-600 mt-1">{redemptions?.length || 0} total redemptions</p>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-yellow-700">Pending</p>
              <p className="text-2xl font-bold text-yellow-900 mt-1">{pendingCount}</p>
              <p className="text-xs text-yellow-600 mt-1">awaiting approval</p>
            </div>
            <Clock className="h-8 w-8 text-yellow-600" />
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-700">Processing</p>
              <p className="text-2xl font-bold text-blue-900 mt-1">{processingCount}</p>
              <p className="text-xs text-blue-600 mt-1">in fulfillment</p>
            </div>
            <Package className="h-8 w-8 text-blue-600" />
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-700">Fulfilled</p>
              <p className="text-2xl font-bold text-green-900 mt-1">{fulfilledCount}</p>
              <p className="text-xs text-green-600 mt-1">completed</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-700">Points Used</p>
              <p className="text-2xl font-bold text-purple-900 mt-1">{totalPointsUsed.toLocaleString()}</p>
              <p className="text-xs text-purple-600 mt-1">total redeemed</p>
            </div>
            <Star className="h-8 w-8 text-purple-600" />
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
                placeholder="Search by redemption number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as RedemptionStatus | 'all')}
            className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="processing">Processing</option>
            <option value="fulfilled">Fulfilled</option>
            <option value="cancelled">Cancelled</option>
            <option value="rejected">Rejected</option>
          </select>

          <Button variant="outline" className="border-slate-300">
            <Filter className="h-4 w-4 mr-2" />
            More Filters
          </Button>
        </div>
      </Card>

      {/* Redemptions List */}
      <Card className="divide-y divide-slate-200">
        {redemptions && redemptions.length > 0 ? (
          redemptions.map((redemption) => (
            <div key={redemption.id} className="p-6 hover:bg-slate-50">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-semibold text-slate-900">
                      #{redemption.redemption_number}
                    </h3>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                      getStatusColor(redemption.status)
                    }`}>
                      {getStatusIcon(redemption.status)}
                      <span className="ml-1">{redemption.status}</span>
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                    <div>
                      <p className="text-xs text-slate-600 mb-1">Reward</p>
                      <p className="text-sm font-medium text-slate-900 flex items-center">
                        <Gift className="h-4 w-4 mr-1 text-purple-600" />
                        Reward ID: {redemption.reward_id.substring(0, 8)}...
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-slate-600 mb-1">Customer</p>
                      <p className="text-sm font-medium text-slate-900 flex items-center">
                        <User className="h-4 w-4 mr-1 text-blue-600" />
                        {redemption.customer_loyalty_id.substring(0, 8)}...
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-slate-600 mb-1">Points Used</p>
                      <p className="text-sm font-medium text-slate-900 flex items-center">
                        <Star className="h-4 w-4 mr-1 text-amber-500" />
                        {redemption.points_used.toLocaleString()} points
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-slate-600 mb-1">Redemption Date</p>
                      <p className="text-sm font-medium text-slate-900 flex items-center">
                        <Calendar className="h-4 w-4 mr-1 text-slate-500" />
                        {new Date(redemption.redemption_date).toLocaleString()}
                      </p>
                    </div>

                    {redemption.tracking_number && (
                      <div>
                        <p className="text-xs text-slate-600 mb-1">Tracking</p>
                        <p className="text-sm font-medium text-slate-900 flex items-center">
                          <Truck className="h-4 w-4 mr-1 text-green-600" />
                          {redemption.tracking_number}
                        </p>
                      </div>
                    )}

                    {redemption.voucher_code && (
                      <div>
                        <p className="text-xs text-slate-600 mb-1">Voucher Code</p>
                        <p className="text-sm font-mono font-medium text-slate-900 bg-slate-100 px-2 py-1 rounded">
                          {redemption.voucher_code}
                        </p>
                      </div>
                    )}
                  </div>

                  {redemption.customer_rating && (
                    <div className="mt-4 p-3 bg-amber-50 rounded-lg border border-amber-200">
                      <div className="flex items-center space-x-2">
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <Star 
                              key={i} 
                              className={`h-4 w-4 ${
                                i < redemption.customer_rating! 
                                  ? 'text-amber-500 fill-current' 
                                  : 'text-slate-300'
                              }`} 
                            />
                          ))}
                        </div>
                        {redemption.customer_feedback && (
                          <p className="text-sm text-slate-700 italic">"{redemption.customer_feedback}"</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex flex-col space-y-2 ml-4">
                  {redemption.status === 'pending' && (
                    <>
                      <Button 
                        size="sm" 
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => updateRedemption.mutate({
                          id: redemption.id,
                          updates: { status: 'approved', status_updated_at: new Date().toISOString() }
                        })}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Approve
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="border-red-300 text-red-600 hover:bg-red-50"
                        onClick={() => updateRedemption.mutate({
                          id: redemption.id,
                          updates: { status: 'rejected', status_updated_at: new Date().toISOString() }
                        })}
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Reject
                      </Button>
                    </>
                  )}
                  
                  {redemption.status === 'approved' && (
                    <Button 
                      size="sm" 
                      className="bg-blue-600 hover:bg-blue-700"
                      onClick={() => updateRedemption.mutate({
                        id: redemption.id,
                        updates: { status: 'processing', status_updated_at: new Date().toISOString() }
                      })}
                    >
                      <Package className="h-4 w-4 mr-1" />
                      Start Processing
                    </Button>
                  )}

                  {redemption.status === 'processing' && (
                    <Button 
                      size="sm" 
                      className="bg-green-600 hover:bg-green-700"
                      onClick={() => updateRedemption.mutate({
                        id: redemption.id,
                        updates: { 
                          status: 'fulfilled', 
                          status_updated_at: new Date().toISOString(),
                          delivered_date: new Date().toISOString().split('T')[0]
                        }
                      })}
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Mark Fulfilled
                    </Button>
                  )}

                  <Button size="sm" variant="outline" className="border-slate-300">
                    View Details
                  </Button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="p-12 text-center">
            <Gift className="h-16 w-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">No redemptions found</h3>
            <p className="text-slate-600">Redemptions will appear here once customers start redeeming rewards</p>
          </div>
        )}
      </Card>
    </div>
  );
}
