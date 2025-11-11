'use client';

/**
 * Marketing Settings & Configuration
 * Manage budgets, integrations, and marketing preferences
 */

import { useState } from 'react';
import { useMarketingBudgets, useMarketingIntegration } from '@/hooks/useMarketing';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  DollarSign, Plug, Mail, MessageSquare, BarChart3, 
  Settings, Plus, Edit, Trash2, Check, X, AlertTriangle 
} from 'lucide-react';

export default function MarketingSettingsPage() {
  const { data: budgets, isLoading: budgetsLoading } = useMarketingBudgets();
  const [activeTab, setActiveTab] = useState('budgets');

  const mockIntegrations = [
    { id: '1', name: 'Mailgun', type: 'email_provider', status: 'connected', icon: Mail },
    { id: '2', name: 'Twilio', type: 'sms_provider', status: 'disconnected', icon: MessageSquare },
    { id: '3', name: 'Google Analytics', type: 'analytics', status: 'connected', icon: BarChart3 },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Marketing Settings</h1>
        <p className="text-slate-600 mt-1">Configure budgets, integrations, and preferences</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'budgets', label: 'Budgets', icon: DollarSign },
            { id: 'integrations', label: 'Integrations', icon: Plug },
            { id: 'preferences', label: 'Preferences', icon: Settings },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              <tab.icon className={`-ml-0.5 mr-2 h-5 w-5 ${
                activeTab === tab.id ? 'text-blue-500' : 'text-slate-400 group-hover:text-slate-500'
              }`} />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Budget Tab */}
      {activeTab === 'budgets' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Marketing Budgets</h2>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              New Budget
            </Button>
          </div>

          <div className="grid gap-6">
            {budgets?.map((budget) => (
              <Card key={budget.id} className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">{budget.budget_name}</h3>
                  <div className="flex items-center space-x-2">
                    <Badge className="bg-green-100 text-green-800">Active</Badge>
                    <Button size="sm" variant="outline"><Edit className="h-4 w-4" /></Button>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-slate-600">Total Budget</p>
                    <p className="text-xl font-bold">{budget.total_budget.toLocaleString()} AED</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Spent</p>
                    <p className="text-xl font-bold text-orange-600">{budget.total_spent.toLocaleString()} AED</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Remaining</p>
                    <p className="text-xl font-bold text-green-600">{(budget.total_budget - budget.total_spent).toLocaleString()} AED</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Period</p>
                    <p className="text-lg font-semibold capitalize">{budget.budget_period}</p>
                  </div>
                </div>
                
                {/* Budget Usage Bar */}
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full" 
                    style={{ width: `${(budget.total_spent / budget.total_budget * 100)}%` }}
                  />
                </div>
                <p className="text-sm text-slate-600 mt-1">
                  {((budget.total_spent / budget.total_budget) * 100).toFixed(1)}% used
                </p>
              </Card>
            ))}
            
            {(!budgets || budgets.length === 0) && (
              <Card className="p-12 text-center">
                <DollarSign className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No budgets configured</h3>
                <p className="text-slate-600 mb-6">Set up your marketing budgets to track spending.</p>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="h-4 w-4 mr-2" />Create Budget
                </Button>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* Integrations Tab */}
      {activeTab === 'integrations' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Third-party Integrations</h2>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Add Integration
            </Button>
          </div>

          <div className="grid gap-6">
            {mockIntegrations.map((integration) => (
              <Card key={integration.id} className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-blue-100 rounded-full">
                      <integration.icon className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">{integration.name}</h3>
                      <p className="text-sm text-slate-600 capitalize">{integration.type.replace('_', ' ')}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2">
                      {integration.status === 'connected' ? (
                        <>
                          <Check className="h-4 w-4 text-green-600" />
                          <Badge className="bg-green-100 text-green-800">Connected</Badge>
                        </>
                      ) : (
                        <>
                          <X className="h-4 w-4 text-red-600" />
                          <Badge className="bg-red-100 text-red-800">Disconnected</Badge>
                        </>
                      )}
                    </div>
                    
                    <Button size="sm" variant="outline">
                      {integration.status === 'connected' ? 'Configure' : 'Connect'}
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Preferences Tab */}
      {activeTab === 'preferences' && (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold">Marketing Preferences</h2>
          
          <div className="grid gap-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Email Settings</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="from_name">Default From Name</Label>
                    <Input id="from_name" defaultValue="Tailoring Platform" />
                  </div>
                  <div>
                    <Label htmlFor="from_email">Default From Email</Label>
                    <Input id="from_email" defaultValue="no-reply@tailoring.com" />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="reply_to">Reply-To Email</Label>
                    <Input id="reply_to" defaultValue="support@tailoring.com" />
                  </div>
                  <div>
                    <Label htmlFor="unsubscribe_url">Unsubscribe URL</Label>
                    <Input id="unsubscribe_url" defaultValue="https://tailoring.com/unsubscribe" />
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Notification Settings</h3>
              <div className="space-y-3">
                {[
                  'Campaign performance alerts',
                  'Budget threshold warnings',
                  'Integration status updates',
                  'A/B test completion notifications'
                ].map((setting) => (
                  <div key={setting} className="flex items-center justify-between">
                    <span className="text-sm font-medium">{setting}</span>
                    <input type="checkbox" defaultChecked className="rounded" />
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Data Retention</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="analytics_retention">Analytics Data (months)</Label>
                  <Input id="analytics_retention" type="number" defaultValue="12" />
                </div>
                <div>
                  <Label htmlFor="campaign_retention">Campaign Data (months)</Label>
                  <Input id="campaign_retention" type="number" defaultValue="24" />
                </div>
              </div>
            </Card>
          </div>

          <div className="flex justify-end">
            <Button className="bg-blue-600 hover:bg-blue-700">Save Preferences</Button>
          </div>
        </div>
      )}
    </div>
  );
}