'use client';

import { useState } from 'react';
import { 
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '@/hooks/useAuth';
import { useKPIMetrics, useUpdateKPIMetric } from '@/hooks/useAnalytics';

export default function PerformanceTrackingPage() {
  const { user } = useAuth();
  const organizationId = user?.user_metadata?.organization_id || '00000000-0000-0000-0000-000000000000';

  const { data: kpis, isLoading } = useKPIMetrics(organizationId);
  const updateKPI = useUpdateKPIMetric();

  // Group KPIs by category
  const financialKPIs = kpis?.filter(k => 
    k.kpi_name?.toLowerCase().includes('revenue') || 
    k.kpi_name?.toLowerCase().includes('profit') ||
    k.kpi_name?.toLowerCase().includes('cost')
  ) || [];

  const operationalKPIs = kpis?.filter(k =>
    k.kpi_name?.toLowerCase().includes('efficiency') ||
    k.kpi_name?.toLowerCase().includes('time') ||
    k.kpi_name?.toLowerCase().includes('delivery')
  ) || [];

  const customerKPIs = kpis?.filter(k =>
    k.kpi_name?.toLowerCase().includes('customer') ||
    k.kpi_name?.toLowerCase().includes('satisfaction') ||
    k.kpi_name?.toLowerCase().includes('retention')
  ) || [];

  const calculateProgress = (current: number, target: number) => {
    if (!target || target === 0) return 0;
    return Math.min((current / target) * 100, 100);
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 90) return 'text-green-600';
    if (progress >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getProgressBgColor = (progress: number) => {
    if (progress >= 90) return 'bg-green-500';
    if (progress >= 70) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const renderKPICard = (kpi: any) => {
    const progress = calculateProgress(kpi.current_value, kpi.target_value);
    const isMeetingTarget = progress >= 90;

    return (
      <div key={kpi.id} className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-gray-200">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">{kpi.kpi_name}</h3>
            <p className="text-xs text-gray-500">{kpi.category || 'General'}</p>
          </div>
          {isMeetingTarget ? (
            <CheckCircleIcon className="w-6 h-6 text-green-500" />
          ) : (
            <XCircleIcon className="w-6 h-6 text-gray-400" />
          )}
        </div>

        <div className="space-y-3">
          <div className="flex items-baseline justify-between">
            <div>
              <p className="text-3xl font-bold text-gray-900">
                {kpi.unit === 'currency' ? `AED ${kpi.current_value.toLocaleString()}` : 
                 kpi.unit === 'percentage' ? `${kpi.current_value}%` :
                 kpi.current_value.toLocaleString()}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                Target: {kpi.unit === 'currency' ? `AED ${kpi.target_value.toLocaleString()}` : 
                         kpi.unit === 'percentage' ? `${kpi.target_value}%` :
                         kpi.target_value.toLocaleString()}
              </p>
            </div>
            <div className={`text-right ${getProgressColor(progress)}`}>
              <div className="flex items-center gap-1">
                {progress >= 100 ? (
                  <ArrowTrendingUpIcon className="w-5 h-5" />
                ) : (
                  <ArrowTrendingDownIcon className="w-5 h-5" />
                )}
                <span className="text-lg font-bold">{progress.toFixed(0)}%</span>
              </div>
              <p className="text-xs">Progress</p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${getProgressBgColor(progress)}`}
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>{kpi.frequency || 'Monthly'} tracking</span>
            <span>Updated: {new Date(kpi.updated_at || kpi.created_at).toLocaleDateString()}</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
              <ChartBarIcon className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Performance Tracking</h1>
              <p className="text-gray-600">Monitor KPIs and business performance metrics</p>
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-gray-200">
            <h3 className="text-sm font-medium text-gray-600 mb-1">Total KPIs</h3>
            <p className="text-3xl font-bold text-gray-900">
              {isLoading ? '...' : kpis?.length || 0}
            </p>
            <p className="text-xs text-gray-500 mt-1">Being tracked</p>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-gray-200">
            <h3 className="text-sm font-medium text-gray-600 mb-1">On Target</h3>
            <p className="text-3xl font-bold text-green-600">
              {isLoading ? '...' : kpis?.filter(k => calculateProgress(k.current_value, k.target_value) >= 90).length || 0}
            </p>
            <p className="text-xs text-gray-500 mt-1">Meeting goals</p>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-gray-200">
            <h3 className="text-sm font-medium text-gray-600 mb-1">Below Target</h3>
            <p className="text-3xl font-bold text-yellow-600">
              {isLoading ? '...' : kpis?.filter(k => {
                const progress = calculateProgress(k.current_value, k.target_value);
                return progress >= 70 && progress < 90;
              }).length || 0}
            </p>
            <p className="text-xs text-gray-500 mt-1">Need attention</p>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-gray-200">
            <h3 className="text-sm font-medium text-gray-600 mb-1">Critical</h3>
            <p className="text-3xl font-bold text-red-600">
              {isLoading ? '...' : kpis?.filter(k => calculateProgress(k.current_value, k.target_value) < 70).length || 0}
            </p>
            <p className="text-xs text-gray-500 mt-1">Urgent action</p>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-gray-500">Loading KPIs...</div>
        ) : !kpis || kpis.length === 0 ? (
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-12 border border-gray-200 text-center">
            <ChartBarIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No KPIs Defined</h3>
            <p className="text-gray-600">Start tracking your performance by creating KPI metrics</p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Financial KPIs */}
            {financialKPIs.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Financial Performance</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {financialKPIs.map(renderKPICard)}
                </div>
              </div>
            )}

            {/* Operational KPIs */}
            {operationalKPIs.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Operational Efficiency</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {operationalKPIs.map(renderKPICard)}
                </div>
              </div>
            )}

            {/* Customer KPIs */}
            {customerKPIs.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Customer Metrics</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {customerKPIs.map(renderKPICard)}
                </div>
              </div>
            )}

            {/* Other KPIs */}
            {kpis.filter(k => 
              !financialKPIs.includes(k) && 
              !operationalKPIs.includes(k) && 
              !customerKPIs.includes(k)
            ).length > 0 && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Other Metrics</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {kpis.filter(k => 
                    !financialKPIs.includes(k) && 
                    !operationalKPIs.includes(k) && 
                    !customerKPIs.includes(k)
                  ).map(renderKPICard)}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
