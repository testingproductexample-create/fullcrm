'use client';

import { useState } from 'react';
import { Cog6ToothIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { useAuth } from '@/hooks/useAuth';
import { useCommunicationChannels } from '@/hooks/useCommunication';

export default function CommunicationSettingsPage() {
  const { user } = useAuth();
  const organizationId = user?.user_metadata?.organization_id;

  // Fetch communication channels
  const { data: channels, isLoading } = useCommunicationChannels(organizationId);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-50 p-6 flex items-center justify-center">
        <div className="text-gray-600">Loading communication settings...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gray-500 to-gray-600 flex items-center justify-center">
              <Cog6ToothIcon className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Communication Settings</h1>
              <p className="text-gray-600">Configure channels and communication preferences</p>
            </div>
          </div>
        </div>

        {/* Channel Configuration */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 mb-8">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Channel Configuration ({channels?.length || 0})</h2>
          </div>
          
          <div className="divide-y divide-gray-200">
            {channels && channels.length > 0 ? (
              channels.map((channel) => (
                <div key={channel.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-bold text-gray-900">{channel.channel_name}</h3>
                        {channel.is_active ? (
                          <CheckCircleIcon className="w-5 h-5 text-green-500" />
                        ) : (
                          <XCircleIcon className="w-5 h-5 text-red-500" />
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span>Type: {channel.channel_type}</span>
                        <span>Provider: {channel.provider_name || 'N/A'}</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          channel.configuration ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {channel.configuration ? 'Configured' : 'Pending'}
                        </span>
                      </div>
                      {channel.description && (
                        <p className="text-sm text-gray-500 mt-2">{channel.description}</p>
                      )}
                      {channel.daily_limit && (
                        <p className="text-xs text-gray-500 mt-1">Daily Limit: {channel.daily_limit} messages</p>
                      )}
                    </div>
                    
                    <div className="flex gap-2">
                      <button className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm font-medium">
                        Configure
                      </button>
                      <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium">
                        Test
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-12 text-center text-gray-500">
                <Cog6ToothIcon className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                <p>No communication channels configured yet.</p>
                <button className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
                  Add Channel
                </button>
              </div>
            )}
          </div>
        </div>

        {/* General Settings */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-4">General Settings</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Default Language
                </label>
                <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                  <option>English</option>
                  <option>Arabic</option>
                  <option>Bilingual (EN/AR)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sender Name
                </label>
                <input 
                  type="text"
                  defaultValue="Tailoring Co."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Business Hours
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input 
                    type="time"
                    defaultValue="09:00"
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <input 
                    type="time"
                    defaultValue="18:00"
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input type="checkbox" id="autoReply" defaultChecked className="rounded" />
                <label htmlFor="autoReply" className="text-sm text-gray-700">
                  Enable auto-reply during off hours
                </label>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-4">UAE Compliance</h2>
            
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <input type="checkbox" id="uaeCompliance" defaultChecked className="rounded" />
                <label htmlFor="uaeCompliance" className="text-sm text-gray-700">
                  Enable UAE telecom compliance checks
                </label>
              </div>

              <div className="flex items-center gap-2">
                <input type="checkbox" id="pdpl" defaultChecked className="rounded" />
                <label htmlFor="pdpl" className="text-sm text-gray-700">
                  PDPL (Data Protection) compliance
                </label>
              </div>

              <div className="flex items-center gap-2">
                <input type="checkbox" id="optOut" defaultChecked className="rounded" />
                <label htmlFor="optOut" className="text-sm text-gray-700">
                  Include opt-out option in marketing messages
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Telecom License Number
                </label>
                <input 
                  type="text"
                  defaultValue="TRA-2024-XXXX"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-xs text-blue-700">
                  All communications must comply with UAE Telecommunications Regulatory Authority (TRA) guidelines and PDPL requirements.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="mt-8 flex justify-end">
          <button className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-8 py-3 rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all font-semibold">
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}
