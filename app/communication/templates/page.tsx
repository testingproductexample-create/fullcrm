'use client';

import { useState } from 'react';
import { DocumentTextIcon, PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { useAuth } from '@/hooks/useAuth';
import { useMessageTemplates, useCreateMessageTemplate } from '@/hooks/useCommunication';

export default function TemplatesPage() {
  const { user } = useAuth();
  const organizationId = user?.user_metadata?.organization_id || '00000000-0000-0000-0000-000000000000';

  const { data: templates, isLoading } = useMessageTemplates(organizationId);
  const createTemplate = useCreateMessageTemplate();

  const categories = ['All', 'Order', 'Appointment', 'Payment', 'Marketing'];
  const [selectedCategory, setSelectedCategory] = useState('All');

  const filteredTemplates = selectedCategory === 'All' 
    ? templates 
    : templates?.filter(t => t.category?.toLowerCase() === selectedCategory.toLowerCase());

  // Calculate most used template
  const mostUsed = templates && templates.length > 0 
    ? templates.reduce((prev, current) => (current.usage_count || 0) > (prev.usage_count || 0) ? current : prev)
    : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-yellow-50 to-amber-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-500 to-yellow-600 flex items-center justify-center">
                <DocumentTextIcon className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Message Templates</h1>
                <p className="text-gray-600">Reusable templates for all communication channels</p>
              </div>
            </div>
            <button className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white px-6 py-3 rounded-lg hover:from-yellow-600 hover:to-yellow-700 transition-all flex items-center gap-2">
              <PlusIcon className="w-5 h-5" />
              New Template
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-gray-200">
            <h3 className="text-sm font-medium text-gray-600 mb-1">Total Templates</h3>
            <p className="text-3xl font-bold text-gray-900">
              {isLoading ? '...' : templates?.length || 0}
            </p>
            <p className="text-xs text-gray-500 mt-1">Across all categories</p>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-gray-200">
            <h3 className="text-sm font-medium text-gray-600 mb-1">Most Used</h3>
            <p className="text-xl font-bold text-gray-900">
              {mostUsed?.name?.substring(0, 15) || 'N/A'}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {mostUsed ? `${mostUsed.usage_count || 0} times this month` : 'No usage data'}
            </p>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-gray-200">
            <h3 className="text-sm font-medium text-gray-600 mb-1">Languages</h3>
            <p className="text-3xl font-bold text-gray-900">2</p>
            <p className="text-xs text-gray-500 mt-1">Arabic & English</p>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-gray-200">
            <h3 className="text-sm font-medium text-gray-600 mb-1">Channels</h3>
            <p className="text-3xl font-bold text-gray-900">5</p>
            <p className="text-xs text-gray-500 mt-1">Multi-channel support</p>
          </div>
        </div>

        {/* Category Filter */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
                selectedCategory === category
                  ? 'bg-yellow-600 text-white'
                  : 'bg-white/80 text-gray-700 hover:bg-gray-100'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Templates Grid */}
        {isLoading ? (
          <div className="text-center py-12 text-gray-500">Loading templates...</div>
        ) : filteredTemplates && filteredTemplates.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredTemplates.map((template) => (
              <div key={template.id} className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-gray-200 hover:shadow-xl transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg mb-1">{template.name}</h3>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
                        {template.category || 'General'}
                      </span>
                      <span className="text-xs text-gray-500">
                        {template.language || 'EN/AR'}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                      <PencilIcon className="w-5 h-5" />
                    </button>
                    <button className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg mb-4">
                  <p className="text-sm text-gray-700 font-mono">
                    {template.content}
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex gap-2">
                    {template.channel_type && (
                      <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-md text-xs font-medium">
                        {template.channel_type.toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-600">
                    Used {template.usage_count || 0} times
                  </div>
                </div>

                <button className="w-full mt-4 bg-yellow-600 text-white py-2 rounded-lg hover:bg-yellow-700 transition-colors font-medium">
                  Use Template
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <DocumentTextIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {selectedCategory === 'All' ? 'No Templates Yet' : `No ${selectedCategory} Templates`}
            </h3>
            <p className="text-gray-600">
              {selectedCategory === 'All' 
                ? 'Create your first message template to get started'
                : `Create your first ${selectedCategory} template`
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
