'use client';

import { useState } from 'react';
import { CurrencyDollarIcon, ArrowTrendingUpIcon, ArrowTrendingDownIcon, BanknotesIcon } from '@heroicons/react/24/outline';
// Charts temporarily removed for build compatibility
import { useAuth } from '@/hooks/useAuth';
import { useBusinessIntelligence, useTrendAnalysis } from '@/hooks/useAnalytics';

export default function FinancialAnalyticsPage() {
  const { user } = useAuth();
  const organizationId = user?.user_metadata?.organization_id || '00000000-0000-0000-0000-000000000000';
  
  const { data: biData, isLoading } = useBusinessIntelligence(organizationId, { category: 'financial' });
  const { data: trendData } = useTrendAnalysis(organizationId, 'revenue');
  const financialData = [
    { month: 'Jan', revenue: 95000, expenses: 62000, profit: 33000 },
    { month: 'Feb', revenue: 102000, expenses: 66000, profit: 36000 },
    { month: 'Mar', revenue: 118000, expenses: 75000, profit: 43000 },
    { month: 'Apr', revenue: 125000, expenses: 80000, profit: 45000 },
    { month: 'May', revenue: 142000, expenses: 92000, profit: 50000 },
    { month: 'Jun', revenue: 138000, expenses: 88000, profit: 50000 },
  ];

  const expenseBreakdown = [
    { category: 'Materials', amount: 45000, percent: 32 },
    { category: 'Labor', amount: 38000, percent: 27 },
    { category: 'Rent', amount: 18000, percent: 13 },
    { category: 'Utilities', amount: 12000, percent: 9 },
    { category: 'Marketing', amount: 15000, percent: 11 },
    { category: 'Other', amount: 10000, percent: 7 },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50 to-emerald-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
              <CurrencyDollarIcon className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Financial Analytics</h1>
              <p className="text-gray-600">Revenue, profitability, and financial performance</p>
            </div>
          </div>
        </div>

        {/* Financial Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-gray-200">
            <h3 className="text-sm font-medium text-gray-600 mb-1">Total Revenue</h3>
            <p className="text-3xl font-bold text-gray-900">AED 720K</p>
            <div className="flex items-center gap-1 mt-1">
              <ArrowTrendingUpIcon className="w-4 h-4 text-green-600" />
              <span className="text-xs text-green-600">+23.5% YTD</span>
            </div>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-gray-200">
            <h3 className="text-sm font-medium text-gray-600 mb-1">Total Expenses</h3>
            <p className="text-3xl font-bold text-gray-900">AED 463K</p>
            <div className="flex items-center gap-1 mt-1">
              <ArrowTrendingDownIcon className="w-4 h-4 text-red-600" />
              <span className="text-xs text-red-600">+18.2% YTD</span>
            </div>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-gray-200">
            <h3 className="text-sm font-medium text-gray-600 mb-1">Net Profit</h3>
            <p className="text-3xl font-bold text-gray-900">AED 257K</p>
            <div className="flex items-center gap-1 mt-1">
              <ArrowTrendingUpIcon className="w-4 h-4 text-green-600" />
              <span className="text-xs text-green-600">+32.7% YTD</span>
            </div>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-gray-200">
            <h3 className="text-sm font-medium text-gray-600 mb-1">Profit Margin</h3>
            <p className="text-3xl font-bold text-gray-900">35.7%</p>
            <div className="flex items-center gap-1 mt-1">
              <ArrowTrendingUpIcon className="w-4 h-4 text-green-600" />
              <span className="text-xs text-green-600">+2.8% improvement</span>
            </div>
          </div>
        </div>

        {/* Revenue & Profit Trend */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-gray-200 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Revenue, Expenses & Profit Trend</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-3 font-semibold text-gray-700">Month</th>
                  <th className="text-right py-2 px-3 font-semibold text-gray-700">Revenue</th>
                  <th className="text-right py-2 px-3 font-semibold text-gray-700">Expenses</th>
                  <th className="text-right py-2 px-3 font-semibold text-gray-700">Profit</th>
                </tr>
              </thead>
              <tbody>
                {financialData.map((row, index) => (
                  <tr key={index} className="border-b border-gray-100">
                    <td className="py-2 px-3 font-medium text-gray-900">{row.month}</td>
                    <td className="text-right py-2 px-3 text-green-600 font-semibold">AED {row.revenue.toLocaleString()}</td>
                    <td className="text-right py-2 px-3 text-red-600 font-semibold">AED {row.expenses.toLocaleString()}</td>
                    <td className="text-right py-2 px-3 text-blue-600 font-bold">AED {row.profit.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Expense Breakdown */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Expense Breakdown</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {expenseBreakdown.map((item, idx) => (
                <div key={idx} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-gray-900">{item.category}</span>
                    <span className="text-sm text-gray-600">{item.percent}%</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">AED {(item.amount / 1000).toFixed(0)}K</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
