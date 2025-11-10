'use client';

import { useState } from 'react';
import {
  PlusIcon,
  ServerIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { useQuery, useMutation, useQueryClient } from '@tantml:react-query';
import { supabase } from '@/lib/supabase';
import { WebhookEndpoint, WebhookEvent } from '@/types/integrations';

export default function WebhooksManagement() {
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState('');
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  const [selectedConnection, setSelectedConnection] = useState('');

  // Fetch webhook endpoints
  const { data: webhooks, isLoading } = useQuery({
    queryKey: ['webhook-endpoints'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('webhook_endpoints')
        .select(`
          *,
          integration_connections!inner(
            connection_name,
            integration_providers!inner(provider_name)
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as WebhookEndpoint[];
    },
    refetchInterval: 30000,
  });

  // Fetch connections for dropdown
  const { data: connections } = useQuery({
    queryKey: ['integration-connections-active'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('integration_connections')
        .select('id, connection_name')
        .eq('status', 'active')
        .order('connection_name');

      if (error) throw error;
      return data;
    },
  });

  // Create webhook mutation
  const createWebhook = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('webhook_endpoints')
        .insert({
          connection_id: selectedConnection,
          webhook_url: webhookUrl,
          webhook_secret: crypto.randomUUID(), // Generate random secret
          event_types: selectedEvents,
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhook-endpoints'] });
      setShowCreateModal(false);
      setWebhookUrl('');
      setSelectedEvents([]);
      setSelectedConnection('');
    },
  });

  // Toggle webhook status
  const toggleWebhook = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { error } = await supabase
        .from('webhook_endpoints')
        .update({ is_active: !isActive })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhook-endpoints'] });
    },
  });

  const availableEvents = [
    'payment.succeeded',
    'payment.failed',
    'payment.refunded',
    'shipping.label_created',
    'shipping.in_transit',
    'shipping.delivered',
    'social.comment',
    'social.mention',
    'order.created',
    'order.updated',
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Webhook Management
            </h1>
            <p className="text-gray-600">
              Configure webhook endpoints to receive real-time events
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium flex items-center gap-2 transition-colors"
          >
            <PlusIcon className="w-5 h-5" />
            Add Webhook
          </button>
        </div>

        {/* Webhooks List */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-8 text-center text-gray-500">
              Loading webhooks...
            </div>
          ) : webhooks?.length === 0 ? (
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-8 text-center">
              <ServerIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">No webhooks configured yet.</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="mt-4 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                Create First Webhook
              </button>
            </div>
          ) : (
            webhooks?.map((webhook) => (
              <div
                key={webhook.id}
                className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-lg"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-gray-900">
                        {(webhook as any).integration_connections?.connection_name}
                      </h3>
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          webhook.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {webhook.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>

                    <p className="text-sm text-gray-600 font-mono mb-3">
                      {webhook.webhook_url}
                    </p>

                    <div className="flex flex-wrap gap-2 mb-4">
                      {webhook.event_types.map((event) => (
                        <span
                          key={event}
                          className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded"
                        >
                          {event}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center gap-6 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <CheckCircleIcon className="w-5 h-5 text-green-500" />
                        <span>{webhook.success_count} successful</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <XCircleIcon className="w-5 h-5 text-red-500" />
                        <span>{webhook.failure_count} failed</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <ArrowPathIcon className="w-5 h-5 text-gray-400" />
                        <span>{webhook.total_triggers} total triggers</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleWebhook.mutate({ id: webhook.id, isActive: webhook.is_active })}
                      className="px-4 py-2 border border-gray-300 hover:bg-gray-50 rounded-lg text-sm font-medium transition-colors"
                    >
                      {webhook.is_active ? 'Disable' : 'Enable'}
                    </button>
                  </div>
                </div>

                {webhook.last_triggered && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-xs text-gray-500">
                      Last triggered: {new Date(webhook.last_triggered).toLocaleString('en-GB')}
                    </p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Create Webhook Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Create Webhook</h2>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Integration Connection
                  </label>
                  <select
                    value={selectedConnection}
                    onChange={(e) => setSelectedConnection(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select a connection...</option>
                    {connections?.map((conn) => (
                      <option key={conn.id} value={conn.id}>
                        {conn.connection_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Webhook URL
                  </label>
                  <input
                    type="url"
                    value={webhookUrl}
                    onChange={(e) => setWebhookUrl(e.target.value)}
                    placeholder="https://your-domain.com/webhook"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Event Types
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {availableEvents.map((event) => (
                      <label key={event} className="flex items-center gap-2 p-2 border rounded-lg hover:bg-gray-50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedEvents.includes(event)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedEvents([...selectedEvents, event]);
                            } else {
                              setSelectedEvents(selectedEvents.filter(e => e !== event));
                            }
                          }}
                          className="rounded text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">{event}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    onClick={() => createWebhook.mutate()}
                    disabled={!selectedConnection || !webhookUrl || selectedEvents.length === 0 || createWebhook.isPending}
                    className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white rounded-lg font-medium transition-colors"
                  >
                    {createWebhook.isPending ? 'Creating...' : 'Create Webhook'}
                  </button>
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="px-6 py-3 border border-gray-300 hover:bg-gray-50 rounded-lg font-medium transition-colors"
                  >
                    Cancel
                  </button>
                </div>

                {createWebhook.isError && (
                  <p className="text-sm text-red-600">
                    Error: {(createWebhook.error as Error).message}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
