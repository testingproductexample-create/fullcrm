'use client';

import { useState } from 'react';
import { 
  ChatBubbleLeftEllipsisIcon, 
  ExclamationTriangleIcon, 
  SparklesIcon,
  ChartBarIcon,
  ClockIcon,
  UserGroupIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '@/hooks/useAuth';
import { useFeedbackDashboard, useFeedback, useComplaintWorkflow } from '@/hooks/useFeedback';

export default function FeedbackDashboardPage() {
  const { user } = useAuth();
  const { data: dashboardData, isLoading: dashboardLoading } = useFeedbackDashboard();
  const { data: workflowData, isLoading: workflowLoading } = useComplaintWorkflow();
  const { data: recentFeedback, isLoading: feedbackLoading } = useFeedback({}, true);

  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');

  if (dashboardLoading || workflowLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-slate-600">Loading feedback dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  const metrics = dashboardData?.metrics;
  const workflow = workflowData;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-2">
                Feedback & Complaints Dashboard
              </h1>
              <p className="text-slate-600">
                Monitor customer satisfaction, track complaints, and manage feedback resolution
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value as '7d' | '30d' | '90d')}
                className="px-4 py-2 bg-white/70 backdrop-blur-sm border border-white/20 rounded-lg shadow-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
              </select>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/70 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium">Total Feedback</p>
                <p className="text-2xl font-bold text-slate-900">{metrics?.total_feedback || 0}</p>
                <div className="flex items-center mt-2 text-sm">
                  <ArrowTrendingUpIcon className="w-4 h-4 text-green-500 mr-1" />
                  <span className="text-green-600">+12%</span>
                  <span className="text-slate-500 ml-1">vs last period</span>
                </div>
              </div>
              <div className="p-3 bg-indigo-100 rounded-lg">
                <ChatBubbleLeftEllipsisIcon className="w-6 h-6 text-indigo-600" />
              </div>
            </div>
          </div>

          <div className="bg-white/70 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium">Active Complaints</p>
                <p className="text-2xl font-bold text-slate-900">{metrics?.total_complaints || 0}</p>
                <div className="flex items-center mt-2 text-sm">
                  <ArrowTrendingDownIcon className="w-4 h-4 text-red-500 mr-1" />
                  <span className="text-red-600">-8%</span>
                  <span className="text-slate-500 ml-1">vs last period</span>
                </div>
              </div>
              <div className="p-3 bg-red-100 rounded-lg">
                <ExclamationTriangleIcon className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>

          <div className="bg-white/70 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium">Resolution Rate</p>
                <p className="text-2xl font-bold text-slate-900">{metrics?.resolution_rate.toFixed(1) || 0}%</p>
                <div className="flex items-center mt-2 text-sm">
                  <ArrowTrendingUpIcon className="w-4 h-4 text-green-500 mr-1" />
                  <span className="text-green-600">+5%</span>
                  <span className="text-slate-500 ml-1">vs last period</span>
                </div>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircleIcon className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white/70 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium">Avg Resolution Time</p>
                <p className="text-2xl font-bold text-slate-900">{metrics?.average_resolution_time || 0}h</p>
                <div className="flex items-center mt-2 text-sm">
                  <ArrowTrendingDownIcon className="w-4 h-4 text-green-500 mr-1" />
                  <span className="text-green-600">-3h</span>
                  <span className="text-slate-500 ml-1">vs last period</span>
                </div>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <ClockIcon className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Satisfaction Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white/70 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900">Customer Satisfaction</h3>
              <div className="p-2 bg-yellow-100 rounded-lg">
                <SparklesIcon className="w-5 h-5 text-yellow-600" />
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-slate-900 mb-2">
                {metrics?.customer_satisfaction_score.toFixed(1) || 0}/5.0
              </div>
              <div className="flex items-center justify-center space-x-1 mb-4">
                {[1, 2, 3, 4, 5].map((star) => (
                  <SparklesIcon 
                    key={star} 
                    className={`w-5 h-5 ${
                      star <= Math.round(metrics?.customer_satisfaction_score || 0) 
                        ? 'text-yellow-400' 
                        : 'text-gray-300'
                    }`} 
                  />
                ))}
              </div>
              <p className="text-sm text-slate-600">Based on recent feedback</p>
            </div>
          </div>

          <div className="bg-white/70 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900">NPS Score</h3>
              <div className="p-2 bg-indigo-100 rounded-lg">
                <ChartBarIcon className="w-5 h-5 text-indigo-600" />
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-slate-900 mb-2">
                {metrics?.nps_score.toFixed(0) || 0}
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                <div 
                  className="bg-indigo-600 h-2 rounded-full" 
                  style={{ width: `${((metrics?.nps_score || 0) + 100) / 2}%` }}
                ></div>
              </div>
              <p className="text-sm text-slate-600">Net Promoter Score</p>
            </div>
          </div>

          <div className="bg-white/70 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900">Escalation Rate</h3>
              <div className="p-2 bg-orange-100 rounded-lg">
                <ExclamationTriangleIcon className="w-5 h-5 text-orange-600" />
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-slate-900 mb-2">
                {metrics?.escalation_rate.toFixed(1) || 0}%
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                <div 
                  className="bg-orange-600 h-2 rounded-full" 
                  style={{ width: `${metrics?.escalation_rate || 0}%` }}
                ></div>
              </div>
              <p className="text-sm text-slate-600">Complaints escalated</p>
            </div>
          </div>
        </div>

        {/* Workflow Status */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white/70 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Complaint Workflow Status</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full mr-3"></div>
                  <span className="text-sm font-medium text-slate-900">Pending Assignment</span>
                </div>
                <span className="text-lg font-bold text-slate-900">
                  {workflow?.pending_assignments.length || 0}
                </span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
                  <span className="text-sm font-medium text-slate-900">In Progress</span>
                </div>
                <span className="text-lg font-bold text-slate-900">
                  {workflow?.in_progress.length || 0}
                </span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-red-500 rounded-full mr-3"></div>
                  <span className="text-sm font-medium text-slate-900">Escalated</span>
                </div>
                <span className="text-lg font-bold text-slate-900">
                  {workflow?.escalated.length || 0}
                </span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-purple-500 rounded-full mr-3"></div>
                  <span className="text-sm font-medium text-slate-900">Follow-up Required</span>
                </div>
                <span className="text-lg font-bold text-slate-900">
                  {workflow?.require_follow_up.length || 0}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white/70 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Today's Performance</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Resolved Today</span>
                <div className="flex items-center">
                  <CheckCircleIcon className="w-5 h-5 text-green-500 mr-2" />
                  <span className="text-lg font-bold text-slate-900">
                    {workflow?.resolved_today || 0}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Overdue Items</span>
                <div className="flex items-center">
                  <XCircleIcon className="w-5 h-5 text-red-500 mr-2" />
                  <span className="text-lg font-bold text-slate-900">
                    {workflow?.overdue_count || 0}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Avg Response Time</span>
                <div className="flex items-center">
                  <ClockIcon className="w-5 h-5 text-blue-500 mr-2" />
                  <span className="text-lg font-bold text-slate-900">
                    {workflow?.average_resolution_time || 0}h
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Feedback */}
        <div className="bg-white/70 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-slate-900">Recent Feedback & Complaints</h3>
            <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
              View All
            </button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Type</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Subject</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Customer</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Severity</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Created</th>
                </tr>
              </thead>
              <tbody>
                {recentFeedback?.items.slice(0, 8).map((feedback) => (
                  <tr key={feedback.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        feedback.feedback_type === 'complaint' 
                          ? 'bg-red-100 text-red-800'
                          : feedback.feedback_type === 'suggestion'
                          ? 'bg-blue-100 text-blue-800'
                          : feedback.feedback_type === 'compliment'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {feedback.feedback_type}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="max-w-xs truncate text-sm text-slate-900">
                        {feedback.subject}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-sm text-slate-900">
                        {feedback.customer?.name || feedback.customer_email || 'Anonymous'}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        feedback.status === 'resolved' 
                          ? 'bg-green-100 text-green-800'
                          : feedback.status === 'investigating'
                          ? 'bg-yellow-100 text-yellow-800'
                          : feedback.status === 'escalated'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {feedback.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        feedback.severity === 'critical' || feedback.severity === 'urgent'
                          ? 'bg-red-100 text-red-800'
                          : feedback.severity === 'high'
                          ? 'bg-orange-100 text-orange-800'
                          : feedback.severity === 'medium'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {feedback.severity}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-600">
                      {new Date(feedback.created_at).toLocaleDateString()}
                    </td>
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