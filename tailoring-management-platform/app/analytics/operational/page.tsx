'use client';

import { useState } from 'react';
import { ArrowPathIcon, ClockIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
// Charts temporarily removed for build compatibility
import { useAuth } from '@/hooks/useAuth';
import { useBusinessIntelligence, usePerformanceMetrics } from '@/hooks/useAnalytics';

export default function OperationalAnalyticsPage() {
  const { user } = useAuth();
  const organizationId = user?.user_metadata?.organization_id || '00000000-0000-0000-0000-000000000000';
  
  const { data: operationalData, isLoading } = useBusinessIntelligence(organizationId, { category: 'operational' });
  const { data: performanceData } = usePerformanceMetrics(organizationId, 'operational');
  const efficiencyData = [
    { stage: 'Design', avgTime: 2.5, target: 3.0, efficiency: 95 },
    { stage: 'Measurement', avgTime: 1.2, target: 1.5, efficiency: 92 },
    { stage: 'Cutting', avgTime: 3.8, target: 4.0, efficiency: 88 },
    { stage: 'Sewing', avgTime: 8.5, target: 9.0, efficiency: 90 },
    { stage: 'Finishing', avgTime: 2.2, target: 2.5, efficiency: 94 },
    { stage: 'Quality Check', avgTime: 1.5, target: 1.8, efficiency: 96 },
  ];

  const productivityTrend = [
    { week: 'W1', orders: 142, onTime: 134, quality: 95 },
    { week: 'W2', orders: 156, onTime: 148, quality: 94 },
    { week: 'W3', orders: 168, onTime: 159, quality: 96 },
    { week: 'W4', orders: 175, onTime: 167, quality: 97 },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
              <ArrowPathIcon className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Operational Analytics</h1>
              <p className="text-gray-600">Workflow efficiency and operational performance</p>
            </div>
          </div>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-gray-200">
            <h3 className="text-sm font-medium text-gray-600 mb-1">Avg Completion Time</h3>
            <p className="text-3xl font-bold text-gray-900">8.2 days</p>
            <p className="text-xs text-green-600 mt-1">12% faster than target</p>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-gray-200">
            <h3 className="text-sm font-medium text-gray-600 mb-1">On-Time Delivery</h3>
            <p className="text-3xl font-bold text-gray-900">94.2%</p>
            <p className="text-xs text-gray-500 mt-1">Above 90% target</p>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-gray-200">
            <h3 className="text-sm font-medium text-gray-600 mb-1">Capacity Utilization</h3>
            <p className="text-3xl font-bold text-gray-900">87%</p>
            <p className="text-xs text-gray-500 mt-1">Optimal range</p>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-gray-200">
            <h3 className="text-sm font-medium text-gray-600 mb-1">First-Time Quality</h3>
            <p className="text-3xl font-bold text-gray-900">96.5%</p>
            <p className="text-xs text-green-600 mt-1">Excellent quality</p>
          </div>
        </div>

        {/* Workflow Efficiency */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-gray-200 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Workflow Stage Efficiency</h2>
          <div className="space-y-4">
            {efficiencyData.map((stage, index) => (
              <div key={index} className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-3">{stage.stage}</h4>
                <div className="grid grid-cols-3 gap-3 text-sm">
                  <div>
                    <p className="text-gray-600">Avg Time</p>
                    <p className="text-lg font-bold text-purple-600">{stage.avgTime}h</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Target</p>
                    <p className="text-lg font-bold text-gray-600">{stage.target}h</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Efficiency</p>
                    <p className="text-lg font-bold text-green-600">{stage.efficiency}%</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Productivity Trend */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Weekly Productivity Trend</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-3 font-semibold text-gray-700">Week</th>
                  <th className="text-right py-2 px-3 font-semibold text-gray-700">Orders</th>
                  <th className="text-right py-2 px-3 font-semibold text-gray-700">On-Time %</th>
                  <th className="text-right py-2 px-3 font-semibold text-gray-700">Quality</th>
                </tr>
              </thead>
              <tbody>
                {productivityTrend.map((row, index) => (
                  <tr key={index} className="border-b border-gray-100">
                    <td className="py-2 px-3 font-medium text-gray-900">{row.week}</td>
                    <td className="text-right py-2 px-3 text-blue-600 font-semibold">{row.orders}</td>
                    <td className="text-right py-2 px-3 text-green-600 font-semibold">{row.onTime}%</td>
                    <td className="text-right py-2 px-3 text-orange-600 font-semibold">{row.quality}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
