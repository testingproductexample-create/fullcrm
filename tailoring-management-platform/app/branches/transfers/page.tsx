'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useTransfers, useBranches, useUpdateTransferStatus } from '@/hooks/useBranch';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ArrowPathRoundedSquareIcon,
  PlusIcon,
  FunnelIcon,
  ArrowLongRightIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  TruckIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import type { TransferStatus, Priority } from '@/types/branch';

export default function TransfersPage() {
  const { user } = useAuth();
  const organizationId = user?.user_metadata?.organization_id;

  const [filterStatus, setFilterStatus] = useState<TransferStatus | 'all'>('all');
  const [filterPriority, setFilterPriority] = useState<Priority | 'all'>('all');

  const filters = {
    ...(filterStatus !== 'all' && { status: filterStatus }),
    ...(filterPriority !== 'all' && { priority: filterPriority })
  };

  const { data: transfers, isLoading } = useTransfers(organizationId, filters);
  const { data: branches } = useBranches(organizationId);
  const updateStatus = useUpdateTransferStatus();

  const getStatusColor = (status: TransferStatus) => {
    const colors: Record<TransferStatus, string> = {
      draft: 'bg-gray-500/20 text-gray-300 border-gray-500/30',
      pending_approval: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
      approved: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      in_transit: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
      received: 'bg-green-500/20 text-green-300 border-green-500/30',
      cancelled: 'bg-red-500/20 text-red-300 border-red-500/30',
      rejected: 'bg-red-500/20 text-red-300 border-red-500/30'
    };
    return colors[status];
  };

  const getPriorityColor = (priority: Priority) => {
    const colors: Record<Priority, string> = {
      low: 'bg-gray-500/20 text-gray-300 border-gray-500/30',
      normal: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      high: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
      urgent: 'bg-red-500/20 text-red-300 border-red-500/30'
    };
    return colors[priority];
  };

  const getStatusIcon = (status: TransferStatus) => {
    switch (status) {
      case 'pending_approval':
        return <ClockIcon className="h-5 w-5" />;
      case 'approved':
        return <CheckCircleIcon className="h-5 w-5" />;
      case 'in_transit':
        return <TruckIcon className="h-5 w-5" />;
      case 'received':
        return <CheckCircleIcon className="h-5 w-5" />;
      case 'cancelled':
      case 'rejected':
        return <XCircleIcon className="h-5 w-5" />;
      default:
        return <ArrowPathRoundedSquareIcon className="h-5 w-5" />;
    }
  };

  const handleStatusUpdate = async (transferId: string, newStatus: TransferStatus) => {
    try {
      await updateStatus.mutateAsync({
        id: transferId,
        status: newStatus,
        updates: {
          ...(newStatus === 'in_transit' && { dispatched_date: new Date().toISOString().split('T')[0] }),
          ...(newStatus === 'received' && { received_date: new Date().toISOString().split('T')[0] })
        }
      });
    } catch (error) {
      console.error('Failed to update transfer status:', error);
    }
  };

  const statusCounts = {
    draft: transfers?.filter(t => t.status === 'draft').length || 0,
    pending_approval: transfers?.filter(t => t.status === 'pending_approval').length || 0,
    in_transit: transfers?.filter(t => t.status === 'in_transit').length || 0,
    received: transfers?.filter(t => t.status === 'received').length || 0
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Inter-Branch Transfers</h1>
          <p className="text-gray-400">Manage inventory transfers between branch locations</p>
        </div>
        <Link href="/branches/transfers/new">
          <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">
            <PlusIcon className="h-5 w-5 mr-2" />
            New Transfer
          </Button>
        </Link>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-white/5 backdrop-blur-xl border border-white/10 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm">Draft</span>
            <ArrowPathRoundedSquareIcon className="h-6 w-6 text-gray-400" />
          </div>
          <div className="text-3xl font-bold text-white">{statusCounts.draft}</div>
        </Card>

        <Card className="bg-white/5 backdrop-blur-xl border border-white/10 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm">Pending Approval</span>
            <ClockIcon className="h-6 w-6 text-yellow-400" />
          </div>
          <div className="text-3xl font-bold text-white">{statusCounts.pending_approval}</div>
        </Card>

        <Card className="bg-white/5 backdrop-blur-xl border border-white/10 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm">In Transit</span>
            <TruckIcon className="h-6 w-6 text-purple-400" />
          </div>
          <div className="text-3xl font-bold text-white">{statusCounts.in_transit}</div>
        </Card>

        <Card className="bg-white/5 backdrop-blur-xl border border-white/10 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm">Received (This Month)</span>
            <CheckCircleIcon className="h-6 w-6 text-green-400" />
          </div>
          <div className="text-3xl font-bold text-white">{statusCounts.received}</div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-white/5 backdrop-blur-xl border border-white/10 p-6">
        <div className="flex items-center gap-4">
          <FunnelIcon className="h-5 w-5 text-gray-400" />
          <div className="flex gap-2 flex-wrap">
            <span className="text-sm text-gray-400">Status:</span>
            {(['all', 'draft', 'pending_approval', 'approved', 'in_transit', 'received'] as const).map(status => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                  filterStatus === status
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white/5 text-gray-400 hover:bg-white/10'
                }`}
              >
                {status === 'all' ? 'All' : status.replace('_', ' ')}
              </button>
            ))}
          </div>

          <div className="flex gap-2 flex-wrap">
            <span className="text-sm text-gray-400">Priority:</span>
            {(['all', 'urgent', 'high', 'normal', 'low'] as const).map(priority => (
              <button
                key={priority}
                onClick={() => setFilterPriority(priority)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                  filterPriority === priority
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white/5 text-gray-400 hover:bg-white/10'
                }`}
              >
                {priority.charAt(0).toUpperCase() + priority.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Transfers List */}
      <div className="space-y-4">
        {transfers && transfers.length > 0 ? (
          transfers.map((transfer: any) => (
            <Card key={transfer.id} className="bg-white/5 backdrop-blur-xl border border-white/10 p-6 hover:bg-white/10 transition-colors">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-start gap-4 flex-1">
                  <div className={`p-3 rounded-lg ${
                    transfer.status === 'received'
                      ? 'bg-green-500/20'
                      : transfer.status === 'in_transit'
                      ? 'bg-purple-500/20'
                      : transfer.status === 'pending_approval'
                      ? 'bg-yellow-500/20'
                      : 'bg-gray-500/20'
                  }`}>
                    {getStatusIcon(transfer.status)}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold text-white">{transfer.transfer_number}</h3>
                      <Badge className={getStatusColor(transfer.status)}>
                        {transfer.status.replace('_', ' ')}
                      </Badge>
                      <Badge className={getPriorityColor(transfer.priority)}>
                        {transfer.priority}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-3 text-sm mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400">From:</span>
                        <span className="text-white font-medium">{transfer.source_branch?.branch_name || 'Unknown'}</span>
                      </div>
                      <ArrowLongRightIcon className="h-5 w-5 text-gray-400" />
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400">To:</span>
                        <span className="text-white font-medium">{transfer.destination_branch?.branch_name || 'Unknown'}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <div className="text-gray-400 text-xs mb-1">Type</div>
                        <div className="text-white">{transfer.transfer_type.replace('_', ' ')}</div>
                      </div>
                      <div>
                        <div className="text-gray-400 text-xs mb-1">Requested</div>
                        <div className="text-white">{new Date(transfer.requested_date).toLocaleDateString()}</div>
                      </div>
                      <div>
                        <div className="text-gray-400 text-xs mb-1">Items</div>
                        <div className="text-white font-semibold">{transfer.total_items_count}</div>
                      </div>
                      <div>
                        <div className="text-gray-400 text-xs mb-1">Total Value</div>
                        <div className="text-white font-semibold">{transfer.total_transfer_value_aed.toLocaleString()} AED</div>
                      </div>
                    </div>

                    {transfer.transfer_notes && (
                      <div className="mt-3 text-sm text-gray-400">
                        {transfer.transfer_notes}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  {transfer.status === 'pending_approval' && (
                    <>
                      <Button
                        onClick={() => handleStatusUpdate(transfer.id, 'approved')}
                        className="bg-green-600 hover:bg-green-700 text-white text-sm"
                      >
                        Approve
                      </Button>
                      <Button
                        onClick={() => handleStatusUpdate(transfer.id, 'rejected')}
                        variant="outline"
                        className="border-red-500/30 text-red-300 hover:bg-red-500/10 text-sm"
                      >
                        Reject
                      </Button>
                    </>
                  )}
                  {transfer.status === 'approved' && (
                    <Button
                      onClick={() => handleStatusUpdate(transfer.id, 'in_transit')}
                      className="bg-purple-600 hover:bg-purple-700 text-white text-sm"
                    >
                      Mark In Transit
                    </Button>
                  )}
                  {transfer.status === 'in_transit' && (
                    <Button
                      onClick={() => handleStatusUpdate(transfer.id, 'received')}
                      className="bg-green-600 hover:bg-green-700 text-white text-sm"
                    >
                      Mark Received
                    </Button>
                  )}
                  <Link href={`/branches/transfers/${transfer.id}`}>
                    <Button variant="outline" className="border-white/10 text-white hover:bg-white/5 text-sm">
                      View Details
                    </Button>
                  </Link>
                </div>
              </div>

              {transfer.tracking_number && (
                <div className="pt-3 border-t border-white/10 flex items-center gap-2 text-sm">
                  <TruckIcon className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-400">Tracking:</span>
                  <span className="text-white font-mono">{transfer.tracking_number}</span>
                  {transfer.carrier_name && (
                    <>
                      <span className="text-gray-400">•</span>
                      <span className="text-white">{transfer.carrier_name}</span>
                    </>
                  )}
                </div>
              )}
            </Card>
          ))
        ) : (
          <Card className="bg-white/5 backdrop-blur-xl border border-white/10 p-12">
            <div className="text-center">
              <ArrowPathRoundedSquareIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No transfers found</h3>
              <p className="text-gray-400 mb-6">
                {filterStatus === 'all' && filterPriority === 'all'
                  ? 'Create your first inter-branch transfer to move inventory between locations'
                  : 'No transfers match your current filters'}
              </p>
              <Link href="/branches/transfers/new">
                <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">
                  <PlusIcon className="h-5 w-5 mr-2" />
                  Create Transfer
                </Button>
              </Link>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
