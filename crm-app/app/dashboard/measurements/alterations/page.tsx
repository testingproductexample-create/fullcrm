'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { AlertCircle, Plus, Package, User, Clock, DollarSign, Check, X } from 'lucide-react';

interface AlterationRequest {
  id: string;
  request_number: string;
  order_id: string;
  customer_id: string;
  request_date: string;
  alteration_type: string;
  detailed_instructions: string;
  urgency: string;
  status: string;
  approval_status: string;
  estimated_cost_aed: number | null;
  customer_charge_aed: number | null;
  charge_customer: boolean;
  customers: {
    full_name: string;
    customer_code: string;
  };
  orders: {
    order_number: string;
  };
}

export default function AlterationsPage() {
  const { profile } = useAuth();
  const { addToast } = useToast();
  const [requests, setRequests] = useState<AlterationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'in_progress' | 'completed'>('all');

  useEffect(() => {
    if (profile?.organization_id) {
      fetchRequests();

      // Real-time subscription
      const channel = supabase
        .channel('alteration_requests_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'alteration_requests',
            filter: `organization_id=eq.${profile.organization_id}`
          },
          () => {
            fetchRequests();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [profile?.organization_id]);

  const fetchRequests = async () => {
    try {
      let query = supabase
        .from('alteration_requests')
        .select('*, customers(full_name, customer_code), orders(order_number)')
        .eq('organization_id', profile?.organization_id)
        .order('request_date', { ascending: false });

      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setRequests(data || []);
    } catch (error) {
      console.error('Error fetching alteration requests:', error);
      addToast('Failed to load alteration requests', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (profile?.organization_id) {
      fetchRequests();
    }
  }, [filter]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-700';
      case 'rejected':
      case 'cancelled':
        return 'bg-red-100 text-red-700';
      case 'in_progress':
        return 'bg-blue-100 text-blue-700';
      case 'approved':
        return 'bg-purple-100 text-purple-700';
      default:
        return 'bg-amber-100 text-amber-700';
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'urgent':
        return 'bg-red-100 text-red-700';
      case 'high':
        return 'bg-orange-100 text-orange-700';
      case 'normal':
        return 'bg-blue-100 text-blue-700';
      default:
        return 'bg-neutral-100 text-neutral-700';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'remake':
        return 'bg-red-100 text-red-700';
      case 'major':
        return 'bg-orange-100 text-orange-700';
      default:
        return 'bg-blue-100 text-blue-700';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 md:p-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-semibold text-neutral-900 mb-2">Alteration Requests</h1>
          <p className="text-neutral-600">Track and manage garment alteration requests</p>
        </div>
        <Link
          href="/dashboard/measurements/alterations/new"
          className="inline-flex items-center px-6 py-3 bg-amber-600 text-white rounded-xl hover:bg-amber-700 transition-colors shadow-lg"
        >
          <Plus className="w-5 h-5 mr-2" />
          New Alteration Request
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6 overflow-x-auto pb-2">
        {[
          { value: 'all', label: 'All Requests' },
          { value: 'pending', label: 'Pending' },
          { value: 'approved', label: 'Approved' },
          { value: 'in_progress', label: 'In Progress' },
          { value: 'completed', label: 'Completed' }
        ].map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value as any)}
            className={`px-6 py-2 rounded-xl transition-all whitespace-nowrap ${
              filter === f.value
                ? 'bg-amber-600 text-white shadow-lg'
                : 'bg-white/40 backdrop-blur-md text-neutral-700 hover:bg-white/60'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Requests Grid */}
      <div className="grid grid-cols-1 gap-6">
        {requests.length > 0 ? (
          requests.map((request) => (
            <div
              key={request.id}
              className="bg-white/40 backdrop-blur-md border border-white/30 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all"
            >
              {/* Header Row */}
              <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                <div>
                  <h3 className="text-xl font-semibold text-neutral-900 mb-2">
                    {request.request_number}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    <span className={`px-3 py-1 rounded-full text-sm ${getStatusColor(request.status)}`}>
                      {request.status.replace('_', ' ').toUpperCase()}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-sm ${getUrgencyColor(request.urgency)}`}>
                      {request.urgency.toUpperCase()}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-sm ${getTypeColor(request.alteration_type)}`}>
                      {request.alteration_type.toUpperCase()}
                    </span>
                  </div>
                </div>

                {request.approval_status === 'pending_approval' && (
                  <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <AlertCircle className="w-5 h-5 text-amber-600" />
                    <span className="text-sm text-amber-800 font-medium">Awaiting Approval</span>
                  </div>
                )}
              </div>

              {/* Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="flex items-center text-neutral-700">
                  <User className="w-5 h-5 mr-3 text-neutral-500" />
                  <div>
                    <p className="font-medium">{request.customers.full_name}</p>
                    <p className="text-sm text-neutral-500">{request.customers.customer_code}</p>
                  </div>
                </div>

                <div className="flex items-center text-neutral-700">
                  <Package className="w-5 h-5 mr-3 text-neutral-500" />
                  <div>
                    <p className="font-medium">Order: {request.orders.order_number}</p>
                    <p className="text-sm text-neutral-500">
                      {new Date(request.request_date).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {request.estimated_cost_aed && (
                  <div className="flex items-center text-neutral-700">
                    <DollarSign className="w-5 h-5 mr-3 text-neutral-500" />
                    <div>
                      <p className="font-medium">Est. Cost: AED {request.estimated_cost_aed.toFixed(2)}</p>
                      {request.charge_customer && request.customer_charge_aed && (
                        <p className="text-sm text-neutral-500">
                          Customer: AED {request.customer_charge_aed.toFixed(2)}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Instructions */}
              <div className="mb-4 p-4 bg-white/50 rounded-xl">
                <p className="text-sm font-medium text-neutral-900 mb-2">Instructions:</p>
                <p className="text-neutral-700">{request.detailed_instructions}</p>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-4 border-t border-neutral-200">
                <Link
                  href={`/dashboard/measurements/alterations/${request.id}`}
                  className="flex-1 text-center px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
                >
                  View Details
                </Link>
                {request.approval_status === 'pending_approval' && (
                  <>
                    <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center">
                      <Check className="w-4 h-4 mr-1" />
                      Approve
                    </button>
                    <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center">
                      <X className="w-4 h-4 mr-1" />
                      Reject
                    </button>
                  </>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12 bg-white/40 backdrop-blur-md border border-white/30 rounded-2xl">
            <AlertCircle className="w-16 h-16 text-neutral-400 mx-auto mb-4" />
            <p className="text-neutral-600 mb-4">No alteration requests found</p>
            <Link
              href="/dashboard/measurements/alterations/new"
              className="inline-flex items-center px-6 py-3 bg-amber-600 text-white rounded-xl hover:bg-amber-700 transition-colors"
            >
              <Plus className="w-5 h-5 mr-2" />
              Create First Request
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
