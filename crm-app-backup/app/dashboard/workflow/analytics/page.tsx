'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { WorkflowAnalytics, AutomationRule } from '@/types/database';
import { 
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Clock,
  CheckCircle,
  BarChart3,
  Activity,
  Zap
} from 'lucide-react';
import Link from 'next/link';

export default function WorkflowAnalyticsPage() {
  const { profile } = useAuth();
  
  const [analytics, setAnalytics] = useState<WorkflowAnalytics[]>([]);
  const [automationRules, setAutomationRules] = useState<AutomationRule[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, [profile]);

  async function fetchAnalytics() {
    if (!profile?.organization_id) return;

    setLoading(true);
    try {
      const { data: analyticsData } = await supabase
        .from('workflow_analytics')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .order('bottleneck_score', { ascending: false });

      const { data: rulesData } = await supabase
        .from('automation_rules')
        .select('*')
        .eq('organization_id', profile.organization_id);

      setAnalytics(analyticsData || []);
      setAutomationRules(rulesData || []);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  }

  const avgBottleneckScore = analytics.length > 0
    ? (analytics.reduce((sum: number, a: WorkflowAnalytics) => sum + (parseFloat(a.bottleneck_score?.toString() || '0')), 0) / analytics.length).toFixed(2)
    : 0;

  const avgEfficiency = analytics.length > 0
    ? (analytics.reduce((sum: number, a: WorkflowAnalytics) => sum + (parseFloat(a.efficiency_rating?.toString() || '0')), 0) / analytics.length).toFixed(2)
    : 0;

  const bottlenecks = analytics.filter((a: WorkflowAnalytics) => parseFloat(a.bottleneck_score?.toString() || '0') > 50);
  const activeAutomation = automationRules.filter(r => r.is_active).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-h2 font-bold text-neutral-900">Workflow Analytics</h1>
          <p className="text-body text-neutral-700">Performance metrics and bottleneck analysis</p>
        </div>
        <Link href="/dashboard/workflow" className="btn-secondary">
          Back to Dashboard
        </Link>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="glass-card p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-50 rounded-lg">
              <BarChart3 className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-large font-bold text-neutral-900">{analytics.length}</p>
              <p className="text-small text-neutral-700">Workflow Stages</p>
            </div>
          </div>
        </div>

        <div className="glass-card p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-red-50 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-large font-bold text-neutral-900">{bottlenecks.length}</p>
              <p className="text-small text-neutral-700">Bottlenecks Detected</p>
            </div>
          </div>
        </div>

        <div className="glass-card p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-50 rounded-lg">
              <Activity className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-large font-bold text-neutral-900">{avgEfficiency}%</p>
              <p className="text-small text-neutral-700">Avg Efficiency</p>
            </div>
          </div>
        </div>

        <div className="glass-card p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-50 rounded-lg">
              <Zap className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-large font-bold text-neutral-900">{activeAutomation}</p>
              <p className="text-small text-neutral-700">Active Rules</p>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Metrics Table */}
      <div className="glass-card">
        <div className="p-6 border-b border-neutral-200">
          <h3 className="text-h3 font-semibold text-neutral-900">Stage Performance Metrics</h3>
        </div>
        
        {loading ? (
          <div className="p-12 text-center">
            <p className="text-body text-neutral-700">Loading analytics...</p>
          </div>
        ) : analytics.length === 0 ? (
          <div className="p-12 text-center">
            <BarChart3 className="w-16 h-16 text-neutral-400 mx-auto mb-4" />
            <p className="text-body text-neutral-700">No analytics data available yet</p>
            <p className="text-small text-neutral-600 mt-2">Analytics are calculated hourly by the automation system</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-neutral-200">
                  <th className="text-left text-small font-semibold text-neutral-900 p-4">Workflow Stage</th>
                  <th className="text-center text-small font-semibold text-neutral-900 p-4">Avg Time (hrs)</th>
                  <th className="text-center text-small font-semibold text-neutral-900 p-4">Bottleneck Score</th>
                  <th className="text-center text-small font-semibold text-neutral-900 p-4">Efficiency</th>
                  <th className="text-center text-small font-semibold text-neutral-900 p-4">Active Orders</th>
                  <th className="text-center text-small font-semibold text-neutral-900 p-4">Completion Rate</th>
                  <th className="text-center text-small font-semibold text-neutral-900 p-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {analytics.map((metric) => {
                  const bottleneckScore = parseFloat(metric.bottleneck_score?.toString() || '0');
                  const efficiency = parseFloat(metric.efficiency_rating?.toString() || '0');
                  const isBottleneck = bottleneckScore > 50;
                  const metrics = metric.performance_metrics || {};

                  return (
                    <tr key={metric.id} className="border-b border-neutral-100 hover:bg-neutral-50">
                      <td className="p-4">
                        <p className="font-medium text-neutral-900 capitalize">
                          {metric.status.replace('_', ' ')}
                        </p>
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Clock className="w-4 h-4 text-neutral-600" />
                          <span className="text-body">{metric.average_completion_time || 0}</span>
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <span className={`text-body font-medium ${
                            isBottleneck ? 'text-red-600' : 'text-neutral-900'
                          }`}>
                            {bottleneckScore.toFixed(0)}
                          </span>
                          {isBottleneck && <AlertTriangle className="w-4 h-4 text-red-600" />}
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <span className={`text-body font-medium ${
                            efficiency >= 70 ? 'text-green-600' :
                            efficiency >= 40 ? 'text-yellow-600' :
                            'text-red-600'
                          }`}>
                            {efficiency.toFixed(0)}%
                          </span>
                          {efficiency >= 70 ? (
                            <TrendingUp className="w-4 h-4 text-green-600" />
                          ) : (
                            <TrendingDown className="w-4 h-4 text-red-600" />
                          )}
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <span className="text-body">{metrics.active_orders || 0}</span>
                      </td>
                      <td className="p-4 text-center">
                        <span className="text-body">{metrics.completion_rate || '0%'}</span>
                      </td>
                      <td className="p-4 text-center">
                        <span className={`px-3 py-1 rounded-full text-tiny font-medium ${
                          isBottleneck
                            ? 'bg-red-100 text-red-900'
                            : efficiency >= 70
                            ? 'bg-green-100 text-green-900'
                            : 'bg-yellow-100 text-yellow-900'
                        }`}>
                          {isBottleneck ? 'Bottleneck' : efficiency >= 70 ? 'Efficient' : 'Monitor'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Bottleneck Details */}
      {bottlenecks.length > 0 && (
        <div className="glass-card p-6 border-2 border-red-400">
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="w-6 h-6 text-red-600" />
            <h3 className="text-h3 font-semibold text-neutral-900">Critical Bottlenecks</h3>
          </div>
          <div className="space-y-4">
            {bottlenecks.map((bottleneck) => {
              const metrics = bottleneck.performance_metrics || {};
              return (
                <div key={bottleneck.id} className="p-4 bg-red-50 rounded-lg border border-red-200">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-semibold text-neutral-900 capitalize">
                        {bottleneck.status.replace('_', ' ')}
                      </p>
                      <p className="text-small text-neutral-700">
                        {metrics.active_orders || 0} active orders • Avg time: {bottleneck.average_completion_time}h
                      </p>
                    </div>
                    <span className="px-3 py-1 bg-red-100 text-red-900 rounded-full text-tiny font-medium">
                      Score: {parseFloat(bottleneck.bottleneck_score?.toString() || '0').toFixed(0)}
                    </span>
                  </div>
                  <div className="mt-3 p-3 bg-white rounded border border-red-200">
                    <p className="text-small font-medium text-neutral-900 mb-1">Recommended Actions:</p>
                    <ul className="text-small text-neutral-700 space-y-1 list-disc list-inside">
                      <li>Review resource allocation for this stage</li>
                      <li>Consider reassigning workload to reduce queue</li>
                      <li>Investigate common delays or quality issues</li>
                      <li>Implement automation rules to streamline process</li>
                    </ul>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Automation Rules Overview */}
      <div className="glass-card p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-h3 font-semibold text-neutral-900">Automation Rules</h3>
          <Link href="/dashboard/workflow/manage" className="text-primary-600 hover:text-primary-700 text-small font-medium">
            Manage Rules
          </Link>
        </div>
        
        {automationRules.length === 0 ? (
          <p className="text-body text-neutral-700 text-center py-8">No automation rules configured</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {automationRules.slice(0, 6).map((rule) => (
              <div key={rule.id} className="p-4 border border-neutral-200 rounded-lg">
                <div className="flex justify-between items-start mb-2">
                  <p className="font-medium text-neutral-900">{rule.rule_name}</p>
                  <span className={`px-2 py-1 rounded text-tiny font-medium ${
                    rule.is_active
                      ? 'bg-green-100 text-green-900'
                      : 'bg-gray-200 text-gray-900'
                  }`}>
                    {rule.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <p className="text-small text-neutral-700 mb-2">Type: {rule.rule_type.replace('_', ' ')}</p>
                <p className="text-small text-neutral-700">Action: {rule.action_type.replace('_', ' ')}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
