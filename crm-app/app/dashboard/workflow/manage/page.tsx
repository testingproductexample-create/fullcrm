'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { AutomationRule, OrderWorkflow } from '@/types/database';
import { 
  Plus,
  Edit,
  Trash2,
  Zap,
  Settings,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';
import Link from 'next/link';

export default function WorkflowManagePage() {
  const { profile } = useAuth();
  
  const [workflows, setWorkflows] = useState<OrderWorkflow[]>([]);
  const [automationRules, setAutomationRules] = useState<AutomationRule[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [profile]);

  async function fetchData() {
    if (!profile?.organization_id) return;

    setLoading(true);
    try {
      const { data: workflowsData } = await supabase
        .from('order_workflows')
        .select('*')
        .eq('organization_id', profile.organization_id);

      const { data: rulesData } = await supabase
        .from('automation_rules')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .order('created_at', { ascending: false });

      setWorkflows(workflowsData || []);
      setAutomationRules(rulesData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function toggleRuleStatus(ruleId: string, currentStatus: boolean) {
    try {
      const { error } = await supabase
        .from('automation_rules')
        .update({ is_active: !currentStatus })
        .eq('id', ruleId);

      if (error) throw error;
      fetchData();
    } catch (error) {
      console.error('Error toggling rule:', error);
      alert('Failed to update rule status');
    }
  }

  async function deleteRule(ruleId: string) {
    if (!confirm('Are you sure you want to delete this automation rule?')) return;

    try {
      const { error } = await supabase
        .from('automation_rules')
        .delete()
        .eq('id', ruleId);

      if (error) throw error;
      fetchData();
    } catch (error) {
      console.error('Error deleting rule:', error);
      alert('Failed to delete rule');
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-h2 font-bold text-neutral-900">Workflow Management</h1>
          <p className="text-body text-neutral-700">Configure workflows and automation rules</p>
        </div>
        <Link href="/dashboard/workflow" className="btn-secondary">
          Back to Dashboard
        </Link>
      </div>

      {/* Workflows Section */}
      <div className="glass-card p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-h3 font-semibold text-neutral-900">Workflow Templates</h3>
        </div>

        {loading ? (
          <p className="text-center text-body text-neutral-700 py-8">Loading...</p>
        ) : workflows.length === 0 ? (
          <p className="text-center text-body text-neutral-700 py-8">No workflows configured</p>
        ) : (
          <div className="space-y-4">
            {workflows.map((workflow) => (
              <div key={workflow.id} className="p-4 border border-neutral-200 rounded-lg">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-semibold text-neutral-900">{workflow.workflow_name}</h4>
                      <span className={`px-2 py-1 rounded text-tiny font-medium ${
                        workflow.is_active
                          ? 'bg-green-100 text-green-900'
                          : 'bg-gray-200 text-gray-900'
                      }`}>
                        {workflow.is_active ? 'Active' : 'Inactive'}
                      </span>
                      <span className="px-2 py-1 bg-blue-100 text-blue-900 rounded text-tiny font-medium">
                        {workflow.workflow_type}
                      </span>
                    </div>
                    {workflow.description && (
                      <p className="text-small text-neutral-700 mb-2">{workflow.description}</p>
                    )}
                    <p className="text-small text-neutral-600">
                      {Array.isArray(workflow.status_definitions) ? workflow.status_definitions.length : 0} stages configured
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Automation Rules Section */}
      <div className="glass-card p-6">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <Zap className="w-6 h-6 text-purple-600" />
            <h3 className="text-h3 font-semibold text-neutral-900">Automation Rules</h3>
          </div>
          <p className="text-small text-neutral-600">
            {automationRules.filter(r => r.is_active).length} active / {automationRules.length} total
          </p>
        </div>

        {loading ? (
          <p className="text-center text-body text-neutral-700 py-8">Loading...</p>
        ) : automationRules.length === 0 ? (
          <div className="text-center py-12">
            <Zap className="w-16 h-16 text-neutral-400 mx-auto mb-4" />
            <p className="text-body text-neutral-700 mb-2">No automation rules configured</p>
            <p className="text-small text-neutral-600">Automation rules help streamline your workflow processes</p>
          </div>
        ) : (
          <div className="space-y-3">
            {automationRules.map((rule) => (
              <div
                key={rule.id}
                className={`p-4 border rounded-lg transition-all ${
                  rule.is_active
                    ? 'border-green-200 bg-green-50/30'
                    : 'border-neutral-200 bg-neutral-50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-semibold text-neutral-900">{rule.rule_name}</h4>
                      <span className="px-2 py-1 bg-blue-100 text-blue-900 rounded text-tiny font-medium">
                        {rule.rule_type.replace('_', ' ')}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-small">
                      <div>
                        <p className="text-neutral-700 mb-1">
                          <span className="font-medium">Action:</span> {rule.action_type.replace('_', ' ')}
                        </p>
                        {rule.trigger_conditions && Object.keys(rule.trigger_conditions).length > 0 && (
                          <p className="text-neutral-600 text-tiny">
                            Triggers: {JSON.stringify(rule.trigger_conditions).substring(0, 100)}...
                          </p>
                        )}
                      </div>

                      <div>
                        {rule.rule_configuration && Object.keys(rule.rule_configuration).length > 0 && (
                          <p className="text-neutral-600 text-tiny">
                            Config: {JSON.stringify(rule.rule_configuration).substring(0, 100)}...
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => toggleRuleStatus(rule.id, rule.is_active)}
                      className={`p-2 rounded transition-colors ${
                        rule.is_active
                          ? 'text-green-600 hover:bg-green-100'
                          : 'text-neutral-500 hover:bg-neutral-200'
                      }`}
                      title={rule.is_active ? 'Deactivate' : 'Activate'}
                    >
                      {rule.is_active ? (
                        <ToggleRight className="w-6 h-6" />
                      ) : (
                        <ToggleLeft className="w-6 h-6" />
                      )}
                    </button>
                    <button
                      onClick={() => deleteRule(rule.id)}
                      className="p-2 text-red-600 hover:bg-red-100 rounded transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Info */}
      <div className="glass-card p-6 bg-blue-50 border border-blue-200">
        <div className="flex items-start gap-3">
          <Settings className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
          <div>
            <h4 className="font-semibold text-neutral-900 mb-2">About Workflow Automation</h4>
            <p className="text-small text-neutral-700 mb-2">
              Automation rules run automatically to streamline your workflow processes:
            </p>
            <ul className="text-small text-neutral-700 space-y-1 list-disc list-inside">
              <li><strong>Time-based rules</strong>: Trigger alerts for delayed orders</li>
              <li><strong>Status-change rules</strong>: Auto-notify customers at milestones</li>
              <li><strong>Completion-based rules</strong>: Auto-progress orders when stages complete</li>
            </ul>
            <p className="text-tiny text-neutral-600 mt-3">
              Automation runs every 5 minutes. Analytics are calculated hourly.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
