'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { Ruler, Users, Calendar, AlertCircle, TrendingUp, Plus } from 'lucide-react';

interface MeasurementStats {
  total_customers_with_measurements: number;
  measurements_this_month: number;
  upcoming_fittings: number;
  pending_alterations: number;
  recent_measurements: any[];
  upcoming_sessions: any[];
}

export default function MeasurementsPage() {
  const { user, profile } = useAuth();
  const [stats, setStats] = useState<MeasurementStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile?.organization_id) {
      fetchStats();
    }
  }, [profile?.organization_id]);

  const fetchStats = async () => {
    try {
      const orgId = profile?.organization_id;

      // Fetch measurement statistics
      const { data: measurements, error: measError } = await supabase
        .from('customer_measurements')
        .select('id, customer_id, garment_type, measurement_date, measurements')
        .eq('organization_id', orgId)
        .eq('is_latest', true);

      const { data: monthMeasurements } = await supabase
        .from('customer_measurements')
        .select('id')
        .eq('organization_id', orgId)
        .gte('measurement_date', new Date(new Date().setDate(1)).toISOString());

      const { data: upcomingSessions } = await supabase
        .from('fitting_sessions')
        .select('*, customers(full_name), orders(order_number)')
        .eq('organization_id', orgId)
        .eq('status', 'scheduled')
        .gte('scheduled_at', new Date().toISOString())
        .order('scheduled_at', { ascending: true })
        .limit(5);

      const { data: alterations } = await supabase
        .from('alteration_requests')
        .select('id')
        .eq('organization_id', orgId)
        .eq('status', 'pending');

      const { data: recentMeasurements } = await supabase
        .from('customer_measurements')
        .select('*, customers(full_name, customer_code)')
        .eq('organization_id', orgId)
        .order('measurement_date', { ascending: false })
        .limit(5);

      const uniqueCustomers = new Set(measurements?.map(m => m.customer_id) || []);

      setStats({
        total_customers_with_measurements: uniqueCustomers.size,
        measurements_this_month: monthMeasurements?.length || 0,
        upcoming_fittings: upcomingSessions?.length || 0,
        pending_alterations: alterations?.length || 0,
        recent_measurements: recentMeasurements || [],
        upcoming_sessions: upcomingSessions || [],
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-neutral-600">Loading measurements...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 md:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-neutral-900 mb-2">Measurements & Fittings</h1>
        <p className="text-neutral-600">Manage customer measurements, fittings, and alterations</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white/40 backdrop-blur-md border border-white/30 rounded-2xl p-6 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-100 rounded-xl">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <p className="text-2xl font-semibold text-neutral-900">{stats?.total_customers_with_measurements || 0}</p>
          <p className="text-sm text-neutral-600 mt-1">Customers with Measurements</p>
        </div>

        <div className="bg-white/40 backdrop-blur-md border border-white/30 rounded-2xl p-6 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-100 rounded-xl">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <p className="text-2xl font-semibold text-neutral-900">{stats?.measurements_this_month || 0}</p>
          <p className="text-sm text-neutral-600 mt-1">Measurements This Month</p>
        </div>

        <div className="bg-white/40 backdrop-blur-md border border-white/30 rounded-2xl p-6 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-100 rounded-xl">
              <Calendar className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <p className="text-2xl font-semibold text-neutral-900">{stats?.upcoming_fittings || 0}</p>
          <p className="text-sm text-neutral-600 mt-1">Upcoming Fittings</p>
        </div>

        <div className="bg-white/40 backdrop-blur-md border border-white/30 rounded-2xl p-6 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-amber-100 rounded-xl">
              <AlertCircle className="w-6 h-6 text-amber-600" />
            </div>
          </div>
          <p className="text-2xl font-semibold text-neutral-900">{stats?.pending_alterations || 0}</p>
          <p className="text-sm text-neutral-600 mt-1">Pending Alterations</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Link
          href="/dashboard/measurements/new"
          className="bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all hover:scale-105"
        >
          <div className="flex items-center justify-between mb-4">
            <Ruler className="w-8 h-8" />
            <Plus className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-semibold mb-2">New Measurement</h3>
          <p className="text-blue-100 text-sm">Record customer measurements</p>
        </Link>

        <Link
          href="/dashboard/measurements/fittings"
          className="bg-gradient-to-br from-purple-600 to-purple-700 text-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all hover:scale-105"
        >
          <div className="flex items-center justify-between mb-4">
            <Calendar className="w-8 h-8" />
            <Plus className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Schedule Fitting</h3>
          <p className="text-purple-100 text-sm">Book fitting appointments</p>
        </Link>

        <Link
          href="/dashboard/measurements/alterations"
          className="bg-gradient-to-br from-amber-600 to-amber-700 text-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all hover:scale-105"
        >
          <div className="flex items-center justify-between mb-4">
            <AlertCircle className="w-8 h-8" />
            <Plus className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Alteration Request</h3>
          <p className="text-amber-100 text-sm">Create alteration request</p>
        </Link>
      </div>

      {/* Recent Measurements & Upcoming Sessions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Measurements */}
        <div className="bg-white/40 backdrop-blur-md border border-white/30 rounded-2xl p-6 shadow-lg">
          <h2 className="text-xl font-semibold text-neutral-900 mb-6">Recent Measurements</h2>
          <div className="space-y-4">
            {stats?.recent_measurements && stats.recent_measurements.length > 0 ? (
              stats.recent_measurements.map((measurement) => (
                <div
                  key={measurement.id}
                  className="flex items-center justify-between p-4 bg-white/50 rounded-xl border border-neutral-200/50 hover:border-blue-300 transition-colors"
                >
                  <div>
                    <p className="font-medium text-neutral-900">
                      {measurement.customers?.full_name || 'Unknown Customer'}
                    </p>
                    <p className="text-sm text-neutral-600">
                      {measurement.garment_type.charAt(0).toUpperCase() + measurement.garment_type.slice(1)} - {' '}
                      {new Date(measurement.measurement_date).toLocaleDateString()}
                    </p>
                  </div>
                  <Link
                    href={`/dashboard/measurements/${measurement.id}`}
                    className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    View
                  </Link>
                </div>
              ))
            ) : (
              <p className="text-center text-neutral-500 py-8">No measurements recorded yet</p>
            )}
          </div>
          <Link
            href="/dashboard/measurements/all"
            className="block mt-6 text-center text-blue-600 hover:text-blue-700 font-medium"
          >
            View All Measurements
          </Link>
        </div>

        {/* Upcoming Fittings */}
        <div className="bg-white/40 backdrop-blur-md border border-white/30 rounded-2xl p-6 shadow-lg">
          <h2 className="text-xl font-semibold text-neutral-900 mb-6">Upcoming Fittings</h2>
          <div className="space-y-4">
            {stats?.upcoming_sessions && stats.upcoming_sessions.length > 0 ? (
              stats.upcoming_sessions.map((session) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between p-4 bg-white/50 rounded-xl border border-neutral-200/50 hover:border-purple-300 transition-colors"
                >
                  <div>
                    <p className="font-medium text-neutral-900">
                      {session.customers?.full_name || 'Unknown Customer'}
                    </p>
                    <p className="text-sm text-neutral-600">
                      {session.session_type.replace('_', ' ').toUpperCase()} - {' '}
                      {new Date(session.scheduled_at).toLocaleString()}
                    </p>
                  </div>
                  <Link
                    href={`/dashboard/measurements/fittings/${session.id}`}
                    className="px-4 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    Manage
                  </Link>
                </div>
              ))
            ) : (
              <p className="text-center text-neutral-500 py-8">No upcoming fittings scheduled</p>
            )}
          </div>
          <Link
            href="/dashboard/measurements/fittings"
            className="block mt-6 text-center text-purple-600 hover:text-purple-700 font-medium"
          >
            View All Fittings
          </Link>
        </div>
      </div>
    </div>
  );
}
