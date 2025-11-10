'use client';

import { useState } from 'react';
import { ChartBarIcon, ArrowTrendingUpIcon, CurrencyDollarIcon, UserGroupIcon, ShoppingBagIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
// Charts temporarily removed for build compatibility
import { useAuth } from '@/hooks/useAuth';
import { useKPIMetrics, useBusinessIntelligence, useTrendAnalysis } from '@/hooks/useAnalytics';

export default function ExecutiveDashboardPage() {
  const { user } = useAuth();
  const organizationId = user?.user_metadata?.organization_id || '00000000-0000-0000-0000-000000000000';
  
  const { data: kpiData, isLoading } = useKPIMetrics(organizationId);
  const { data: biData } = useBusinessIntelligence(organizationId);
  const { data: trendData } = useTrendAnalysis(organizationId);
  const kpis = [
    { label: 'Monthly Revenue', value: 'AED 1.24M', change: +23.5, trend: 'up', target: 95, icon: CurrencyDollarIcon, color: 'green' },
    { label: 'Orders Completed', value: '2,847', change: +12.3, trend: 'up', target: 88, icon: ShoppingBagIcon, color: 'blue' },
    { label: 'Customer Satisfaction', value: '4.8/5.0', change: +5.2, trend: 'up', target: 96, icon: UserGroupIcon, color: 'purple' },
    { label: 'Operational Efficiency', value: '94%', change: +3.1, trend: 'up', target: 94, icon: ArrowPathIcon, color: 'orange' },
    { label: 'Profit Margin', value: '34.2%', change: +2.8, trend: 'up', target: 102, icon: ArrowTrendingUpIcon, color: 'pink' },
    { label: 'Employee Productivity', value: '87%', change: -1.5, trend: 'down', target: 82, icon: ChartBarIcon, color: 'indigo' },
  ];

  const monthlyPerformance = [
    { month: 'Jan', revenue: 95, orders: 420, customers: 185 },
    { month: 'Feb', revenue: 102, orders: 465, customers: 198 },
    { month: 'Mar', revenue: 118, orders: 520, customers: 215 },
    { month: 'Apr', revenue: 125, orders: 542, customers: 234 },
    { month: 'May', revenue: 142, orders: 598, customers: 267 },
    { month: 'Jun', revenue: 138, orders: 612, customers: 289 },
  ];

  const departmentPerformance = [
    { department: 'Sales', score: 92, budget: 85, efficiency: 88 },
    { department: 'Production', score: 87, budget: 90, efficiency: 85 },
    { department: 'Quality', score: 94, budget: 88, efficiency: 92 },
    { department: 'Customer Service', score: 89, budget: 82, efficiency: 91 },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
              <ChartBarIcon className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Executive Dashboard</h1>
              <p className="text-gray-600">High-level business performance overview</p>
            </div>
          </div>
        </div>

        {/* KPIs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {kpis.map((kpi, idx) => {
            const Icon = kpi.icon;
            return (
              <div key={idx} className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-gray-200">
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-12 h-12 rounded-xl bg-${kpi.color}-100 flex items-center justify-center`}>
                    <Icon className={`w-6 h-6 text-${kpi.color}-600`} />
                  </div>
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                    kpi.trend === 'up' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {kpi.trend === 'up' ? '+' : ''}{kpi.change}%
                  </div>
                </div>
                
                <h3 className="text-sm font-medium text-gray-600 mb-1">{kpi.label}</h3>
                <p className="text-2xl font-bold text-gray-900 mb-3">{kpi.value}</p>
                
                <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className={`absolute h-full bg-${kpi.color}-500 rounded-full transition-all`}
                    style={{ width: `${kpi.target}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 mt-1">{kpi.target}% of target achieved</p>
              </div>
            );
          })}
        </div>

        {/* Performance Data */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Monthly Business Performance</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 px-3 font-semibold text-gray-700">Month</th>
                    <th className="text-right py-2 px-3 font-semibold text-gray-700">Revenue (K)</th>
                    <th className="text-right py-2 px-3 font-semibold text-gray-700">Orders</th>
                    <th className="text-right py-2 px-3 font-semibold text-gray-700">Customers</th>
                  </tr>
                </thead>
                <tbody>
                  {monthlyPerformance.map((row, index) => (
                    <tr key={index} className="border-b border-gray-100">
                      <td className="py-2 px-3 font-medium text-gray-900">{row.month}</td>
                      <td className="text-right py-2 px-3 text-blue-600 font-semibold">{row.revenue}</td>
                      <td className="text-right py-2 px-3 text-green-600 font-semibold">{row.orders}</td>
                      <td className="text-right py-2 px-3 text-purple-600 font-semibold">{row.customers}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Department Performance Scorecard</h2>
            <div className="space-y-4">
              {departmentPerformance.map((dept, index) => (
                <div key={index} className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-3">{dept.department}</h4>
                  <div className="grid grid-cols-3 gap-3 text-sm">
                    <div>
                      <p className="text-gray-600">Score</p>
                      <p className="text-lg font-bold text-blue-600">{dept.score}%</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Budget</p>
                      <p className="text-lg font-bold text-green-600">{dept.budget}%</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Efficiency</p>
                      <p className="text-lg font-bold text-orange-600">{dept.efficiency}%</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Strategic Insights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-gray-200">
            <h3 className="font-bold text-gray-900 mb-4">Top Achievements</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-2 text-sm">
                <span className="text-green-600">✓</span>
                <span>Revenue exceeded target by 23.5%</span>
              </li>
              <li className="flex items-start gap-2 text-sm">
                <span className="text-green-600">✓</span>
                <span>Customer satisfaction at all-time high</span>
              </li>
              <li className="flex items-start gap-2 text-sm">
                <span className="text-green-600">✓</span>
                <span>Quality department scored 94%</span>
              </li>
            </ul>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-gray-200">
            <h3 className="font-bold text-gray-900 mb-4">Areas for Improvement</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-2 text-sm">
                <span className="text-orange-600">!</span>
                <span>Employee productivity dipped 1.5%</span>
              </li>
              <li className="flex items-start gap-2 text-sm">
                <span className="text-orange-600">!</span>
                <span>Production efficiency needs optimization</span>
              </li>
              <li className="flex items-start gap-2 text-sm">
                <span className="text-orange-600">!</span>
                <span>Customer service budget adherence low</span>
              </li>
            </ul>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-gray-200">
            <h3 className="font-bold text-gray-900 mb-4">Strategic Priorities</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-2 text-sm">
                <span className="text-blue-600">→</span>
                <span>Expand product line to new segments</span>
              </li>
              <li className="flex items-start gap-2 text-sm">
                <span className="text-blue-600">→</span>
                <span>Invest in employee training programs</span>
              </li>
              <li className="flex items-start gap-2 text-sm">
                <span className="text-blue-600">→</span>
                <span>Optimize production workflow efficiency</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
