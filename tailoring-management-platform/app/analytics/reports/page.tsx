'use client';

import { useState } from 'react';
import { DocumentChartBarIcon, PlusIcon, FunnelIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { useAuth } from '@/hooks/useAuth';
import { useCustomReports, useReportSchedules } from '@/hooks/useAnalytics';

export default function CustomReportsPage() {
  const { user } = useAuth();
  const organizationId = user?.user_metadata?.organization_id;

  // Fetch reports and schedules
  const { data: reports, isLoading: reportsLoading } = useCustomReports(organizationId);
  const { data: schedules, isLoading: schedulesLoading } = useReportSchedules(organizationId);

  const isLoading = reportsLoading || schedulesLoading;

  // Get schedule info for each report
  const getScheduleForReport = (reportId: string) => {
    return schedules?.find(s => s.report_id === reportId);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-purple-50 p-6 flex items-center justify-center">
        <div className="text-gray-600">Loading custom reports...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-purple-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center">
                <DocumentChartBarIcon className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Custom Reports</h1>
                <p className="text-gray-600">Create and manage custom business reports</p>
              </div>
            </div>
            <button className="bg-gradient-to-r from-indigo-500 to-indigo-600 text-white px-6 py-3 rounded-lg hover:from-indigo-600 hover:to-indigo-700 transition-all flex items-center gap-2">
              <PlusIcon className="w-5 h-5" />
              New Report
            </button>
          </div>
        </div>

        {/* Report Builder */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-gray-200 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Quick Report Builder</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <select className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
              <option>Select Category</option>
              <option>Financial</option>
              <option>Customer</option>
              <option>Operational</option>
              <option>HR</option>
            </select>
            
            <select className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
              <option>Time Period</option>
              <option>Today</option>
              <option>This Week</option>
              <option>This Month</option>
              <option>This Quarter</option>
              <option>This Year</option>
            </select>
            
            <select className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
              <option>Report Type</option>
              <option>Summary</option>
              <option>Detailed</option>
              <option>Comparison</option>
              <option>Trend Analysis</option>
            </select>
            
            <button className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2">
              <FunnelIcon className="w-5 h-5" />
              Generate
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 hover:shadow-lg transition-all text-left">
              <h3 className="font-semibold text-blue-900 mb-1">Revenue Analysis</h3>
              <p className="text-xs text-blue-700">Detailed revenue breakdown by category and period</p>
            </button>
            
            <button className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200 hover:shadow-lg transition-all text-left">
              <h3 className="font-semibold text-green-900 mb-1">Customer Insights</h3>
              <p className="text-xs text-green-700">Customer behavior and satisfaction metrics</p>
            </button>
            
            <button className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200 hover:shadow-lg transition-all text-left">
              <h3 className="font-semibold text-purple-900 mb-1">Operational Efficiency</h3>
              <p className="text-xs text-purple-700">Workflow and productivity analysis</p>
            </button>
          </div>
        </div>

        {/* Saved Reports */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Saved Reports ({reports?.length || 0})</h2>
          </div>

          <div className="divide-y divide-gray-200">
            {reports && reports.length > 0 ? (
              reports.map((report) => {
                const schedule = getScheduleForReport(report.id);
                return (
                  <div key={report.id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-bold text-gray-900">{report.report_name}</h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            report.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {report.is_active ? 'active' : 'inactive'}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span>Category: {report.report_category || 'General'}</span>
                          <span>Schedule: {schedule?.frequency || 'Manual'}</span>
                          <span>Last Run: {report.last_generated_at ? new Date(report.last_generated_at).toLocaleDateString() : 'Never'}</span>
                        </div>
                        {report.description && (
                          <p className="text-sm text-gray-500 mt-2">{report.description}</p>
                        )}
                      </div>
                      
                      <div className="flex gap-2">
                        <button className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm font-medium">
                          View
                        </button>
                        <button className="px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors text-sm font-medium flex items-center gap-1">
                          <ArrowDownTrayIcon className="w-4 h-4" />
                          Export
                        </button>
                        <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium">
                          Edit
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-12 text-center text-gray-500">
                <DocumentChartBarIcon className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                <p>No custom reports yet. Create your first report to get started.</p>
              </div>
            )}
          </div>
        </div>

        {/* Export Options */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-gray-200">
            <h3 className="font-bold text-gray-900 mb-3">Export Formats</h3>
            <div className="space-y-2">
              <button className="w-full p-3 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors text-left font-medium">
                PDF Document
              </button>
              <button className="w-full p-3 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors text-left font-medium">
                Excel Spreadsheet
              </button>
              <button className="w-full p-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-left font-medium">
                CSV Data
              </button>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-gray-200">
            <h3 className="font-bold text-gray-900 mb-3">Schedule Options</h3>
            <div className="space-y-2 text-sm text-gray-700">
              <div className="flex items-center gap-2">
                <input type="radio" name="schedule" id="daily" />
                <label htmlFor="daily">Daily Reports</label>
              </div>
              <div className="flex items-center gap-2">
                <input type="radio" name="schedule" id="weekly" />
                <label htmlFor="weekly">Weekly Reports</label>
              </div>
              <div className="flex items-center gap-2">
                <input type="radio" name="schedule" id="monthly" defaultChecked />
                <label htmlFor="monthly">Monthly Reports</label>
              </div>
              <div className="flex items-center gap-2">
                <input type="radio" name="schedule" id="quarterly" />
                <label htmlFor="quarterly">Quarterly Reports</label>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-gray-200">
            <h3 className="font-bold text-gray-900 mb-3">Delivery Options</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <input type="checkbox" id="email" defaultChecked />
                <label htmlFor="email" className="text-gray-700">Email Delivery</label>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="dashboard" defaultChecked />
                <label htmlFor="dashboard" className="text-gray-700">Dashboard Archive</label>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="cloud" />
                <label htmlFor="cloud" className="text-gray-700">Cloud Storage</label>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
