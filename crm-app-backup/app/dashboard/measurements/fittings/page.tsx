'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { Calendar, Clock, User, Package, Plus, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface FittingSession {
  id: string;
  customer_id: string;
  order_id: string;
  session_number: number;
  session_type: string;
  scheduled_at: string;
  started_at: string | null;
  completed_at: string | null;
  status: string;
  overall_fit_rating: number | null;
  requires_alterations: boolean;
  notes: string | null;
  customers: {
    full_name: string;
    customer_code: string;
  };
  orders: {
    order_number: string;
  } | null;
}

export default function FittingsPage() {
  const { profile } = useAuth();
  const { addToast } = useToast();
  const [sessions, setSessions] = useState<FittingSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'scheduled' | 'completed' | 'cancelled'>('all');

  useEffect(() => {
    if (profile?.organization_id) {
      fetchSessions();
      
      // Set up real-time subscription
      const channel = supabase
        .channel('fitting_sessions_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'fitting_sessions',
            filter: `organization_id=eq.${profile.organization_id}`
          },
          () => {
            fetchSessions();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [profile?.organization_id]);

  const fetchSessions = async () => {
    try {
      let query = supabase
        .from('fitting_sessions')
        .select('*, customers(full_name, customer_code), orders(order_number)')
        .eq('organization_id', profile?.organization_id)
        .order('scheduled_at', { ascending: true });

      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setSessions(data || []);
    } catch (error) {
      console.error('Error fetching sessions:', error);
      addToast('Failed to load fitting sessions', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (profile?.organization_id) {
      fetchSessions();
    }
  }, [filter]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'cancelled':
      case 'no_show':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'in_progress':
        return <Clock className="w-5 h-5 text-blue-600" />;
      default:
        return <AlertCircle className="w-5 h-5 text-amber-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-700';
      case 'cancelled':
      case 'no_show':
        return 'bg-red-100 text-red-700';
      case 'in_progress':
        return 'bg-blue-100 text-blue-700';
      default:
        return 'bg-amber-100 text-amber-700';
    }
  };

  const getSessionTypeLabel = (type: string) => {
    return type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
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
          <h1 className="text-3xl font-semibold text-neutral-900 mb-2">Fitting Sessions</h1>
          <p className="text-neutral-600">Schedule and manage customer fitting appointments</p>
        </div>
        <Link
          href="/dashboard/measurements/fittings/new"
          className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors shadow-lg"
        >
          <Plus className="w-5 h-5 mr-2" />
          Schedule Fitting
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        {[
          { value: 'all', label: 'All Sessions' },
          { value: 'scheduled', label: 'Scheduled' },
          { value: 'completed', label: 'Completed' },
          { value: 'cancelled', label: 'Cancelled' }
        ].map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value as any)}
            className={`px-6 py-2 rounded-xl transition-all ${
              filter === f.value
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-white/40 backdrop-blur-md text-neutral-700 hover:bg-white/60'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Sessions Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {sessions.length > 0 ? (
          sessions.map((session) => (
            <div
              key={session.id}
              className="bg-white/40 backdrop-blur-md border border-white/30 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    {getStatusIcon(session.status)}
                    <span className={`px-3 py-1 rounded-full text-sm ${getStatusColor(session.status)}`}>
                      {session.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-neutral-900">
                    {getSessionTypeLabel(session.session_type)}
                  </h3>
                  <p className="text-sm text-neutral-600">Session #{session.session_number}</p>
                </div>
                {session.overall_fit_rating && (
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span
                        key={star}
                        className={`text-lg ${
                          star <= session.overall_fit_rating! ? 'text-yellow-500' : 'text-neutral-300'
                        }`}
                      >
                        ★
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Customer & Order Info */}
              <div className="space-y-3 mb-4">
                <div className="flex items-center text-neutral-700">
                  <User className="w-4 h-4 mr-3 text-neutral-500" />
                  <span className="font-medium">{session.customers.full_name}</span>
                  <span className="text-sm text-neutral-500 ml-2">({session.customers.customer_code})</span>
                </div>
                {session.orders && (
                  <div className="flex items-center text-neutral-700">
                    <Package className="w-4 h-4 mr-3 text-neutral-500" />
                    <span>Order: {session.orders.order_number}</span>
                  </div>
                )}
                <div className="flex items-center text-neutral-700">
                  <Calendar className="w-4 h-4 mr-3 text-neutral-500" />
                  <span>{new Date(session.scheduled_at).toLocaleDateString()}</span>
                  <Clock className="w-4 h-4 ml-4 mr-2 text-neutral-500" />
                  <span>{new Date(session.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>

              {/* Alterations Badge */}
              {session.requires_alterations && (
                <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-sm text-amber-800 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-2" />
                    Alterations Required
                  </p>
                </div>
              )}

              {/* Notes Preview */}
              {session.notes && (
                <div className="mb-4">
                  <p className="text-sm text-neutral-600 line-clamp-2">{session.notes}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-4 border-t border-neutral-200">
                <Link
                  href={`/dashboard/measurements/fittings/${session.id}`}
                  className="flex-1 text-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  View Details
                </Link>
                {session.status === 'scheduled' && (
                  <Link
                    href={`/dashboard/measurements/fittings/${session.id}/edit`}
                    className="px-4 py-2 bg-neutral-200 text-neutral-700 rounded-lg hover:bg-neutral-300 transition-colors"
                  >
                    Edit
                  </Link>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-2 text-center py-12 bg-white/40 backdrop-blur-md border border-white/30 rounded-2xl">
            <Calendar className="w-16 h-16 text-neutral-400 mx-auto mb-4" />
            <p className="text-neutral-600 mb-4">No fitting sessions found</p>
            <Link
              href="/dashboard/measurements/fittings/new"
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5 mr-2" />
              Schedule First Fitting
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
