'use client';

import { useState } from 'react';
import { 
  MagnifyingGlassIcon,
  FunnelIcon,
  PlusIcon,
  ExclamationTriangleIcon,
  ChatBubbleLeftEllipsisIcon,
  ClockIcon,
  UserGroupIcon,
  DocumentTextIcon,
  PaperClipIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '@/hooks/useAuth';
import { 
  useFeedback, 
  useFeedbackCategories, 
  useCreateFeedback,
  useUpdateFeedback,
  useBulkUpdateStatus
} from '@/hooks/useFeedback';
import type { FeedbackFilters, ComplaintStatus, ComplaintSeverity } from '@/types/feedback';

export default function ComplaintsManagementPage() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  const [filters, setFilters] = useState<FeedbackFilters>({
    feedback_type: ['complaint'],
    status: [],
    severity: [],
  });

  const { data: feedbackData, isLoading } = useFeedback(filters);
  const { data: categories } = useFeedbackCategories();
  const createFeedback = useCreateFeedback();
  const bulkUpdate = useBulkUpdateStatus();

  const handleFilterChange = (key: keyof FeedbackFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleSelectAll = () => {
    if (selectedItems.length === feedbackData?.items.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(feedbackData?.items.map(item => item.id) || []);
    }
  };

  const handleBulkStatusUpdate = async (status: ComplaintStatus) => {
    if (selectedItems.length === 0) return;
    
    try {
      await bulkUpdate.mutateAsync({
        feedbackIds: selectedItems,
        status: status,
        notes: `Bulk status update to ${status}`
      });
      setSelectedItems([]);
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const getSeverityColor = (severity: ComplaintSeverity) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: ComplaintStatus) => {
    switch (status) {
      case 'resolved': return 'bg-green-100 text-green-800 border-green-200';
      case 'investigating': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'escalated': return 'bg-red-100 text-red-800 border-red-200';
      case 'acknowledged': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'closed': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-purple-100 text-purple-800 border-purple-200';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-slate-600">Loading complaints...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-2">
                Complaints Management
              </h1>
              <p className="text-slate-600">
                Track, manage, and resolve customer complaints efficiently
              </p>
            </div>
            
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <PlusIcon className="w-5 h-5 mr-2" />
              New Complaint
            </button>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white/70 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 p-6 mb-6">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <div className="relative">
                <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search complaints by subject, customer, or description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white/50 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
            
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
            >
              <FunnelIcon className="w-5 h-5 mr-2" />
              Filters
            </button>
          </div>

          {showFilters && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Status</label>
                <select
                  multiple
                  value={filters.status || []}
                  onChange={(e) => handleFilterChange('status', Array.from(e.target.selectedOptions, option => option.value))}
                  className="w-full px-3 py-2 bg-white/50 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="submitted">Submitted</option>
                  <option value="acknowledged">Acknowledged</option>
                  <option value="investigating">Investigating</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                  <option value="escalated">Escalated</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Severity</label>
                <select
                  multiple
                  value={filters.severity || []}
                  onChange={(e) => handleFilterChange('severity', Array.from(e.target.selectedOptions, option => option.value))}
                  className="w-full px-3 py-2 bg-white/50 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Category</label>
                <select
                  multiple
                  value={filters.category_id || []}
                  onChange={(e) => handleFilterChange('category_id', Array.from(e.target.selectedOptions, option => option.value))}
                  className="w-full px-3 py-2 bg-white/50 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {categories?.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Date Range</label>
                <select
                  onChange={(e) => {
                    const days = parseInt(e.target.value);
                    const fromDate = new Date();
                    fromDate.setDate(fromDate.getDate() - days);
                    handleFilterChange('date_from', fromDate.toISOString());
                  }}
                  className="w-full px-3 py-2 bg-white/50 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">All Time</option>
                  <option value="7">Last 7 days</option>
                  <option value="30">Last 30 days</option>
                  <option value="90">Last 90 days</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Bulk Actions */}
        {selectedItems.length > 0 && (
          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <span className="text-indigo-700 font-medium">
                {selectedItems.length} complaint(s) selected
              </span>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleBulkStatusUpdate('acknowledged')}
                  className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-lg text-sm hover:bg-yellow-200 transition-colors"
                >
                  Mark Acknowledged
                </button>
                <button
                  onClick={() => handleBulkStatusUpdate('investigating')}
                  className="px-3 py-1 bg-blue-100 text-blue-800 rounded-lg text-sm hover:bg-blue-200 transition-colors"
                >
                  Start Investigation
                </button>
                <button
                  onClick={() => handleBulkStatusUpdate('resolved')}
                  className="px-3 py-1 bg-green-100 text-green-800 rounded-lg text-sm hover:bg-green-200 transition-colors"
                >
                  Mark Resolved
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Complaints Table */}
        <div className="bg-white/70 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50/80 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedItems.length === feedbackData?.items.length && feedbackData.items.length > 0}
                      onChange={handleSelectAll}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Complaint Details
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Severity
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {feedbackData?.items.map((complaint) => (
                  <tr key={complaint.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-4">
                      <input
                        type="checkbox"
                        checked={selectedItems.includes(complaint.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedItems([...selectedItems, complaint.id]);
                          } else {
                            setSelectedItems(selectedItems.filter(id => id !== complaint.id));
                          }
                        }}
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-start space-x-3">
                        <div className={`p-2 rounded-lg ${
                          complaint.severity === 'critical' || complaint.severity === 'urgent' 
                            ? 'bg-red-100' 
                            : 'bg-orange-100'
                        }`}>
                          <ExclamationTriangleIcon className={`w-5 h-5 ${
                            complaint.severity === 'critical' || complaint.severity === 'urgent' 
                              ? 'text-red-600' 
                              : 'text-orange-600'
                          }`} />
                        </div>
                        <div>
                          <div className="font-medium text-slate-900 mb-1">{complaint.subject}</div>
                          <div className="text-sm text-slate-600 max-w-md line-clamp-2">
                            {complaint.description}
                          </div>
                          {complaint.category && (
                            <div className="mt-2">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {complaint.category.name}
                              </span>
                            </div>
                          )}
                          <div className="flex items-center mt-2 space-x-4 text-xs text-slate-500">
                            {complaint.attachments && complaint.attachments.length > 0 && (
                              <div className="flex items-center">
                                <PaperClipIcon className="w-4 h-4 mr-1" />
                                {complaint.attachments.length} attachment(s)
                              </div>
                            )}
                            {complaint.resolutions && complaint.resolutions.length > 0 && (
                              <div className="flex items-center">
                                <DocumentTextIcon className="w-4 h-4 mr-1" />
                                {complaint.resolutions.length} resolution(s)
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8">
                          <div className="h-8 w-8 bg-indigo-100 rounded-full flex items-center justify-center">
                            <UserGroupIcon className="h-4 w-4 text-indigo-600" />
                          </div>
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-slate-900">
                            {complaint.customer?.name || complaint.customer_email || 'Anonymous'}
                          </div>
                          <div className="text-sm text-slate-500">
                            {complaint.customer?.email || complaint.customer_email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(complaint.status)}`}>
                        {complaint.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getSeverityColor(complaint.severity)}`}>
                        {complaint.severity}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center text-sm text-slate-600">
                        <ClockIcon className="w-4 h-4 mr-2" />
                        {new Date(complaint.created_at).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-slate-500">
                        {new Date(complaint.created_at).toLocaleTimeString()}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => {/* Navigate to detail view */}}
                          className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
                        >
                          View
                        </button>
                        <button
                          onClick={() => {/* Open edit modal */}}
                          className="text-slate-600 hover:text-slate-900 text-sm font-medium"
                        >
                          Edit
                        </button>
                        {complaint.status !== 'resolved' && (
                          <button
                            onClick={() => {/* Quick resolve */}}
                            className="text-green-600 hover:text-green-900 text-sm font-medium"
                          >
                            Resolve
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {(!feedbackData?.items || feedbackData.items.length === 0) && (
            <div className="text-center py-12">
              <ChatBubbleLeftEllipsisIcon className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">No complaints found</h3>
              <p className="text-slate-600 mb-4">
                {searchQuery || Object.values(filters).some(f => f && f.length > 0) 
                  ? 'Try adjusting your search criteria or filters.'
                  : 'No complaints have been submitted yet.'
                }
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <PlusIcon className="w-5 h-5 mr-2" />
                Create New Complaint
              </button>
            </div>
          )}
        </div>

        {/* Pagination */}
        {feedbackData && feedbackData.total > feedbackData.items.length && (
          <div className="mt-6 flex items-center justify-between">
            <div className="text-sm text-slate-600">
              Showing {feedbackData.items.length} of {feedbackData.total} complaints
            </div>
            <div className="flex items-center space-x-2">
              <button className="px-3 py-2 bg-white/70 text-slate-600 rounded-lg border border-white/20 hover:bg-white/90 transition-colors">
                Previous
              </button>
              <button className="px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}