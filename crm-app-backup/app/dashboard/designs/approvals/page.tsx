'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { 
  Search,
  Filter,
  ArrowLeft,
  User,
  Calendar,
  Clock,
  Check,
  X,
  AlertCircle,
  FileText,
  Signature,
  Eye,
  ExternalLink,
  RefreshCw,
  PenTool
} from 'lucide-react';

interface ApprovalRequest {
  id: string;
  request_number: string;
  approval_stage: string;
  approval_sequence: number;
  requested_at: string;
  status: string;
  approved_at: string | null;
  rejection_reason: string | null;
  revision_notes: string | null;
  approval_notes: string | null;
  version_number: number;
  digital_signature: string | null;
  customers: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  }[];
  customer_design_selections: {
    id: string;
    total_price_aed: number;
    customization_notes: string;
    designs: {
      design_name: string;
      garment_category: string;
      design_code: string;
    }[];
    fabric_library: {
      fabric_name: string;
      fabric_type: string;
    }[] | null;
  }[];
  requested_from: {
    full_name: string;
    role: string;
  }[] | null;
  approved_by_profile: {
    full_name: string;
    role: string;
  }[] | null;
}

export default function ApprovalWorkflowPage() {
  const { profile } = useAuth();
  const [approvals, setApprovals] = useState<ApprovalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    status: '',
    approval_stage: '',
    date_range: ''
  });
  const [sortBy, setSortBy] = useState('newest');
  const [selectedApproval, setSelectedApproval] = useState<ApprovalRequest | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (profile?.organization_id) {
      fetchApprovals();
    }
  }, [profile?.organization_id, filters, sortBy]);

  const fetchApprovals = async () => {
    try {
      setLoading(true);

      let query = supabase
        .from('design_approval_requests')
        .select(`
          id,
          request_number,
          approval_stage,
          approval_sequence,
          requested_at,
          status,
          approved_at,
          rejection_reason,
          revision_notes,
          approval_notes,
          version_number,
          digital_signature,
          customers(
            id,
            first_name,
            last_name,
            email
          ),
          customer_design_selections(
            id,
            total_price_aed,
            customization_notes,
            designs(
              design_name,
              garment_category,
              design_code
            ),
            fabric_library(
              fabric_name,
              fabric_type
            )
          ),
          requested_from:profiles!design_approval_requests_requested_from_fkey(
            full_name,
            role
          ),
          approved_by_profile:profiles!design_approval_requests_approved_by_fkey(
            full_name,
            role
          )
        `)
        .eq('organization_id', profile?.organization_id);

      // Apply filters
      if (filters.status) query = query.eq('status', filters.status);
      if (filters.approval_stage) query = query.eq('approval_stage', filters.approval_stage);

      // Apply date range filter
      if (filters.date_range) {
        const now = new Date();
        let startDate = new Date();
        
        switch (filters.date_range) {
          case 'today':
            startDate.setHours(0, 0, 0, 0);
            break;
          case 'week':
            startDate.setDate(now.getDate() - 7);
            break;
          case 'month':
            startDate.setMonth(now.getMonth() - 1);
            break;
        }
        
        if (filters.date_range !== '') {
          query = query.gte('requested_at', startDate.toISOString());
        }
      }

      // Apply sorting
      switch (sortBy) {
        case 'newest':
          query = query.order('requested_at', { ascending: false });
          break;
        case 'oldest':
          query = query.order('requested_at', { ascending: true });
          break;
        case 'request_number':
          query = query.order('request_number', { ascending: true });
          break;
        case 'stage':
          query = query.order('approval_stage', { ascending: true });
          break;
        default:
          query = query.order('requested_at', { ascending: false });
      }

      const { data, error } = await query;

      if (error) throw error;

      let filteredData = data || [];

      // Client-side search filtering
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        filteredData = filteredData.filter(approval => 
          approval.request_number.toLowerCase().includes(query) ||
          `${approval.customers?.[0]?.first_name} ${approval.customers?.[0]?.last_name}`.toLowerCase().includes(query) ||
          approval.customer_design_selections?.[0]?.designs?.[0]?.design_name.toLowerCase().includes(query)
        );
      }

      setApprovals(filteredData);

    } catch (error) {
      console.error('Error fetching approval requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprovalAction = async (approvalId: string, action: 'approve' | 'reject' | 'request_revision', notes?: string) => {
    try {
      setActionLoading(approvalId);

      const updates: any = {
        status: action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'revision_requested'
      };

      if (action === 'approve') {
        updates.approved_at = new Date().toISOString();
        updates.approved_by = profile?.id;
        updates.approval_notes = notes;
      } else if (action === 'reject') {
        updates.rejection_reason = notes;
      } else if (action === 'request_revision') {
        updates.revision_notes = notes;
      }

      const { error } = await supabase
        .from('design_approval_requests')
        .update(updates)
        .eq('id', approvalId);

      if (error) throw error;

      // If approved, also update the selection status
      if (action === 'approve') {
        const approval = approvals.find(a => a.id === approvalId);
        if (approval?.customer_design_selections?.[0]?.id) {
          await supabase
            .from('customer_design_selections')
            .update({ status: 'approved' })
            .eq('id', approval.customer_design_selections[0]?.id);
        }
      }

      // Refresh approvals
      fetchApprovals();
      setSelectedApproval(null);

    } catch (error) {
      console.error('Error updating approval:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const updateFilter = (key: string, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      status: '',
      approval_stage: '',
      date_range: ''
    });
    setSearchQuery('');
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'pending':
        return { label: 'Pending', color: 'bg-yellow-100 text-yellow-700', icon: Clock };
      case 'approved':
        return { label: 'Approved', color: 'bg-green-100 text-green-700', icon: Check };
      case 'rejected':
        return { label: 'Rejected', color: 'bg-red-100 text-red-700', icon: X };
      case 'revision_requested':
        return { label: 'Revision Requested', color: 'bg-orange-100 text-orange-700', icon: RefreshCw };
      default:
        return { label: status, color: 'bg-gray-100 text-gray-700', icon: AlertCircle };
    }
  };

  const getStageInfo = (stage: string) => {
    switch (stage) {
      case 'customer':
        return { label: 'Customer Review', color: 'bg-blue-100 text-blue-700' };
      case 'tailor':
        return { label: 'Tailor Review', color: 'bg-purple-100 text-purple-700' };
      case 'production_manager':
        return { label: 'Production Manager', color: 'bg-indigo-100 text-indigo-700' };
      case 'final':
        return { label: 'Final Approval', color: 'bg-green-100 text-green-700' };
      default:
        return { label: stage, color: 'bg-gray-100 text-gray-700' };
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-AE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const statusOptions = [
    { value: '', label: 'All Statuses' },
    { value: 'pending', label: 'Pending' },
    { value: 'approved', label: 'Approved' },
    { value: 'rejected', label: 'Rejected' },
    { value: 'revision_requested', label: 'Revision Requested' }
  ];

  const stageOptions = [
    { value: '', label: 'All Stages' },
    { value: 'customer', label: 'Customer Review' },
    { value: 'tailor', label: 'Tailor Review' },
    { value: 'production_manager', label: 'Production Manager' },
    { value: 'final', label: 'Final Approval' }
  ];

  const dateRangeOptions = [
    { value: '', label: 'All Time' },
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'Last Week' },
    { value: 'month', label: 'Last Month' }
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="glass-card p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-glass-light rounded w-1/3"></div>
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-32 bg-glass-light rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-4 mb-4">
          <Link href="/dashboard/designs" className="p-2 hover:bg-glass-light rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-h2 font-bold text-neutral-900">Design Approval Workflow</h1>
            <p className="text-body text-neutral-700">
              Manage design approval requests and digital signatures ({approvals.length} requests)
            </p>
          </div>
        </div>

        {/* Search and Controls */}
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              placeholder="Search by request number, customer name, or design..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-glass-border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-2 border border-glass-border rounded-lg focus:ring-2 focus:ring-primary-500"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="request_number">Request Number</option>
            <option value="stage">Approval Stage</option>
          </select>
        </div>

        {/* Filters */}
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
          <select
            value={filters.status}
            onChange={(e) => updateFilter('status', e.target.value)}
            className="px-3 py-2 text-small border border-glass-border rounded focus:ring-2 focus:ring-primary-500"
          >
            {statusOptions.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>

          <select
            value={filters.approval_stage}
            onChange={(e) => updateFilter('approval_stage', e.target.value)}
            className="px-3 py-2 text-small border border-glass-border rounded focus:ring-2 focus:ring-primary-500"
          >
            {stageOptions.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>

          <select
            value={filters.date_range}
            onChange={(e) => updateFilter('date_range', e.target.value)}
            className="px-3 py-2 text-small border border-glass-border rounded focus:ring-2 focus:ring-primary-500"
          >
            {dateRangeOptions.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>

          <button
            onClick={clearFilters}
            className="px-3 py-2 text-small bg-neutral-100 hover:bg-neutral-200 rounded transition-colors"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Results */}
      <div className="glass-card p-6">
        {approvals.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
            <h3 className="text-h4 font-semibold text-neutral-900 mb-2">No approval requests found</h3>
            <p className="text-body text-neutral-600 mb-4">
              Try adjusting your filters or search terms
            </p>
            <button
              onClick={clearFilters}
              className="glass-button glass-button-primary"
            >
              Clear all filters
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {approvals.map((approval) => {
              const statusInfo = getStatusInfo(approval.status);
              const stageInfo = getStageInfo(approval.approval_stage);
              const StatusIcon = statusInfo.icon;

              return (
                <div key={approval.id} className="bg-white border border-glass-border rounded-lg p-6 hover:shadow-md transition-all">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-4">
                      {/* Request Info */}
                      <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg flex items-center justify-center text-white font-semibold">
                        <FileText className="w-6 h-6" />
                      </div>
                      
                      <div>
                        <h3 className="font-semibold text-neutral-900 mb-1">
                          {approval.request_number}
                        </h3>
                        <p className="text-small text-neutral-600 mb-1">
                          {approval.customers?.[0]?.first_name} {approval.customers?.[0]?.last_name}
                        </p>
                        <p className="text-small text-neutral-600">
                          {approval.customer_design_selections?.[0]?.designs?.[0]?.design_name || 'N/A'}
                        </p>
                        <p className="text-tiny text-neutral-500">
                          v{approval.version_number} • Sequence {approval.approval_sequence}
                        </p>
                      </div>
                    </div>

                    {/* Status & Stage */}
                    <div className="flex flex-col items-end gap-2">
                      <span className={`flex items-center gap-1 px-3 py-1 rounded-full text-small ${statusInfo.color}`}>
                        <StatusIcon className="w-3 h-3" />
                        {statusInfo.label}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-small ${stageInfo.color}`}>
                        {stageInfo.label}
                      </span>
                    </div>
                  </div>

                  {/* Request Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                    {/* Design Info */}
                    <div className="space-y-2">
                      <h4 className="font-medium text-neutral-900">Design Details</h4>
                      <div className="text-small text-neutral-600 space-y-1">
                        <p>
                          <span className="font-medium">Code:</span> {approval.customer_design_selections?.[0]?.designs?.[0]?.design_code || 'N/A'}
                        </p>
                        <p>
                          <span className="font-medium">Category:</span> {approval.customer_design_selections?.[0]?.designs?.[0]?.garment_category || 'N/A'}
                        </p>
                        {approval.customer_design_selections?.[0]?.fabric_library?.[0] && (
                          <p>
                            <span className="font-medium">Fabric:</span> {approval.customer_design_selections[0]?.fabric_library?.[0]?.fabric_name || 'N/A'}
                          </p>
                        )}
                        <p>
                          <span className="font-medium">Total:</span> AED {approval.customer_design_selections?.[0]?.total_price_aed?.toLocaleString()}
                        </p>
                      </div>
                    </div>

                    {/* Approval Info */}
                    <div className="space-y-2">
                      <h4 className="font-medium text-neutral-900">Approval Timeline</h4>
                      <div className="text-small text-neutral-600 space-y-1">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3 h-3" />
                          <span>Requested: {formatDate(approval.requested_at)}</span>
                        </div>
                        
                        {approval.requested_from && (
                          <p>
                            <span className="font-medium">Requested by:</span> {approval.requested_from?.[0]?.full_name || 'N/A'} ({approval.requested_from?.[0]?.role || 'N/A'})
                          </p>
                        )}
                        
                        {approval.approved_at && (
                          <div className="flex items-center gap-2 text-green-600">
                            <Check className="w-3 h-3" />
                            <span>Approved: {formatDate(approval.approved_at)}</span>
                          </div>
                        )}
                        
                        {approval.approved_by_profile && (
                          <p>
                            <span className="font-medium">Approved by:</span> {approval.approved_by_profile?.[0]?.full_name || 'N/A'} ({approval.approved_by_profile?.[0]?.role || 'N/A'})
                          </p>
                        )}
                        
                        {approval.digital_signature && (
                          <div className="flex items-center gap-2 text-purple-600">
                            <Signature className="w-3 h-3" />
                            <span>Digitally signed</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Notes */}
                  {(approval.approval_notes || approval.rejection_reason || approval.revision_notes) && (
                    <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                      {approval.approval_notes && (
                        <div className="mb-2">
                          <p className="text-small font-medium text-green-700 mb-1">Approval Notes:</p>
                          <p className="text-small text-neutral-700">{approval.approval_notes}</p>
                        </div>
                      )}
                      
                      {approval.rejection_reason && (
                        <div className="mb-2">
                          <p className="text-small font-medium text-red-700 mb-1">Rejection Reason:</p>
                          <p className="text-small text-neutral-700">{approval.rejection_reason}</p>
                        </div>
                      )}
                      
                      {approval.revision_notes && (
                        <div>
                          <p className="text-small font-medium text-orange-700 mb-1">Revision Notes:</p>
                          <p className="text-small text-neutral-700">{approval.revision_notes}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  {approval.status === 'pending' && (
                    <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                      <button
                        onClick={() => setSelectedApproval(approval)}
                        className="glass-button glass-button-primary"
                        disabled={actionLoading === approval.id}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Review
                      </button>
                      
                      <button
                        onClick={() => handleApprovalAction(approval.id, 'approve', 'Quick approval')}
                        className="glass-button bg-green-500 hover:bg-green-600 text-white"
                        disabled={actionLoading === approval.id}
                      >
                        {actionLoading === approval.id ? (
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Check className="w-4 h-4 mr-2" />
                        )}
                        Quick Approve
                      </button>
                      
                      <button
                        onClick={() => handleApprovalAction(approval.id, 'reject', 'Rejected without review')}
                        className="glass-button bg-red-500 hover:bg-red-600 text-white"
                        disabled={actionLoading === approval.id}
                      >
                        <X className="w-4 h-4 mr-2" />
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Detailed Review Modal */}
      {selectedApproval && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-h3 font-bold text-neutral-900">
                  Review Approval Request
                </h3>
                <button
                  onClick={() => setSelectedApproval(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-body text-neutral-600 mt-1">
                {selectedApproval.request_number}
              </p>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Customer & Design Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-neutral-900 mb-3">Customer Information</h4>
                  <div className="space-y-2 text-small">
                    <p><span className="font-medium">Name:</span> {selectedApproval.customers?.[0]?.first_name} {selectedApproval.customers?.[0]?.last_name}</p>
                    <p><span className="font-medium">Email:</span> {selectedApproval.customers?.[0]?.email}</p>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold text-neutral-900 mb-3">Design Information</h4>
                  <div className="space-y-2 text-small">
                    <p><span className="font-medium">Design:</span> {selectedApproval.customer_design_selections?.[0]?.designs?.[0]?.design_name || 'N/A'}</p>
                    <p><span className="font-medium">Category:</span> {selectedApproval.customer_design_selections?.[0]?.designs?.[0]?.garment_category || 'N/A'}</p>
                    <p><span className="font-medium">Total:</span> AED {selectedApproval.customer_design_selections?.[0]?.total_price_aed?.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              {/* Customization Notes */}
              {selectedApproval.customer_design_selections?.[0]?.customization_notes && (
                <div>
                  <h4 className="font-semibold text-neutral-900 mb-3">Customization Notes</h4>
                  <p className="text-small text-neutral-700 bg-gray-50 p-3 rounded-lg">
                    {selectedApproval.customer_design_selections[0]?.customization_notes || 'No notes'}
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => handleApprovalAction(selectedApproval.id, 'approve', 'Approved after detailed review')}
                  className="flex-1 glass-button bg-green-500 hover:bg-green-600 text-white"
                  disabled={actionLoading === selectedApproval.id}
                >
                  <Check className="w-4 h-4 mr-2" />
                  Approve
                </button>
                
                <button
                  onClick={() => handleApprovalAction(selectedApproval.id, 'request_revision', 'Please review and make necessary adjustments')}
                  className="flex-1 glass-button bg-orange-500 hover:bg-orange-600 text-white"
                  disabled={actionLoading === selectedApproval.id}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Request Revision
                </button>
                
                <button
                  onClick={() => handleApprovalAction(selectedApproval.id, 'reject', 'Design does not meet requirements')}
                  className="flex-1 glass-button bg-red-500 hover:bg-red-600 text-white"
                  disabled={actionLoading === selectedApproval.id}
                >
                  <X className="w-4 h-4 mr-2" />
                  Reject
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}