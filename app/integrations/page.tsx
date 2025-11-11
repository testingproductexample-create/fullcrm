'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ServerIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  PlusIcon,
  ChartBarIcon,
  CogIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import { IntegrationConnection, IntegrationStats } from '@/types/integrations';

export default function IntegrationsDashboard() {
  const [selectedType, setSelectedType] = useState<string>('all');

  // Fetch all connections
  const { data: connections, isLoading } = useQuery({
    queryKey: ['integration-connections'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('integration_connections')
        .select(`
          *,
          integration_providers!inner(provider_name, provider_type, logo_url),
          payment_providers(*),
          shipping_providers(*),
          social_media_accounts(*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as IntegrationConnection[];
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Calculate statistics
  const stats: IntegrationStats = {
    total_connections: connections?.length || 0,
    active_connections: connections?.filter(c => c.status === 'active').length || 0,
    inactive_connections: connections?.filter(c => c.status === 'inactive').length || 0,
    error_connections: connections?.filter(c => c.status === 'error').length || 0,
    health_summary: {
      healthy: connections?.filter(c => c.health_status === 'healthy').length || 0,
      degraded: connections?.filter(c => c.health_status === 'degraded').length || 0,
      down: connections?.filter(c => c.health_status === 'down').length || 0,
      unknown: connections?.filter(c => !c.health_status || c.health_status === 'unknown').length || 0,
    },
    total_api_calls_today: 0,
    total_webhooks_today: 0,
    avg_response_time_ms: 0,
    error_rate_percent: 0,
  };

  // Filter connections by type
  const filteredConnections = connections?.filter(conn => {
    if (selectedType === 'all') return true;
    return conn.integration_providers?.provider_type === selectedType;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
      case 'degraded':
        return <ExclamationTriangleIcon className="w-5 h-5 text-amber-500" />;
      case 'down':
        return <XCircleIcon className="w-5 h-5 text-red-500" />;
      default:
        return <ClockIcon className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800',
      error: 'bg-red-100 text-red-800',
      pending: 'bg-amber-100 text-amber-800',
      testing: 'bg-blue-100 text-blue-800',
    };

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[status as keyof typeof styles] || styles.inactive}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Integrations & API Management
            </h1>
            <p className="text-gray-600">
              Connect and manage third-party services for your business
            </p>
          </div>
          <Link
            href={`/integrations/setup`}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium flex items-center gap-2 transition-colors"
          >
            <PlusIcon className="w-5 h-5" />
            Add Integration
          </Link>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <ServerIcon className="w-8 h-8 text-blue-600" />
              <span className="text-3xl font-bold text-gray-900">{stats.total_connections}</span>
            </div>
            <p className="text-sm text-gray-600">Total Integrations</p>
            <p className="text-xs text-green-600 mt-1">{stats.active_connections} active</p>
          </div>

          <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <CheckCircleIcon className="w-8 h-8 text-green-600" />
              <span className="text-3xl font-bold text-gray-900">{stats.health_summary.healthy}</span>
            </div>
            <p className="text-sm text-gray-600">Healthy Services</p>
            <p className="text-xs text-gray-500 mt-1">
              {stats.health_summary.degraded} degraded, {stats.health_summary.down} down
            </p>
          </div>

          <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <ChartBarIcon className="w-8 h-8 text-purple-600" />
              <span className="text-3xl font-bold text-gray-900">{stats.total_api_calls_today}</span>
            </div>
            <p className="text-sm text-gray-600">API Calls Today</p>
            <p className="text-xs text-gray-500 mt-1">{stats.avg_response_time_ms}ms avg response</p>
          </div>

          <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <ExclamationTriangleIcon className="w-8 h-8 text-amber-600" />
              <span className="text-3xl font-bold text-gray-900">{stats.error_connections}</span>
            </div>
            <p className="text-sm text-gray-600">Errors</p>
            <p className="text-xs text-red-600 mt-1">{stats.error_rate_percent.toFixed(1)}% error rate</p>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-2 border border-white/20 shadow-lg mb-6">
          <div className="flex gap-2 overflow-x-auto">
            {['all', 'payment', 'shipping', 'social_media', 'marketing', 'communication'].map((type) => (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
                  selectedType === type
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {type === 'all' ? 'All' : type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Integrations List */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/20 shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Service
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Health
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Environment
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Check
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                      Loading integrations...
                    </td>
                  </tr>
                ) : filteredConnections?.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                      No integrations found. Add your first integration to get started.
                    </td>
                  </tr>
                ) : (
                  filteredConnections?.map((connection) => (
                    <tr key={connection.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {connection.integration_providers?.logo_url ? (
                            <img
                              src={connection.integration_providers.logo_url}
                              alt={connection.integration_providers.provider_name}
                              className="w-8 h-8 rounded"
                            />
                          ) : (
                            <ServerIcon className="w-8 h-8 text-gray-400" />
                          )}
                          <div>
                            <p className="font-medium text-gray-900">
                              {connection.integration_providers?.provider_name}
                            </p>
                            <p className="text-sm text-gray-500">{connection.connection_name}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-600 capitalize">
                          {connection.integration_providers?.provider_type.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(connection.status)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(connection.health_status || 'unknown')}
                          <span className="text-sm text-gray-600 capitalize">
                            {connection.health_status || 'unknown'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-600 capitalize">
                          {connection.environment}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-600">
                          {connection.last_health_check
                            ? new Date(connection.last_health_check).toLocaleString('en-GB', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : 'Never'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link
                          href={`/integrations/${connection.id}`}
                          className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                        >
                          Manage
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link
            href={`/integrations/logs`}
            className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-lg hover:shadow-xl transition-shadow"
          >
            <ChartBarIcon className="w-10 h-10 text-blue-600 mb-3" />
            <h3 className="font-semibold text-gray-900 mb-1">View API Logs</h3>
            <p className="text-sm text-gray-600">Monitor API calls and debugging information</p>
          </Link>

          <Link
            href={`/integrations/webhooks`}
            className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-lg hover:shadow-xl transition-shadow"
          >
            <ServerIcon className="w-10 h-10 text-purple-600 mb-3" />
            <h3 className="font-semibold text-gray-900 mb-1">Manage Webhooks</h3>
            <p className="text-sm text-gray-600">Configure webhook endpoints and events</p>
          </Link>

          <Link
            href={`/integrations/analytics`}
            className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-lg hover:shadow-xl transition-shadow"
          >
            <CogIcon className="w-10 h-10 text-green-600 mb-3" />
            <h3 className="font-semibold text-gray-900 mb-1">Analytics</h3>
            <p className="text-sm text-gray-600">View usage metrics and performance data</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
