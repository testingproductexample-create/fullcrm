'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { Document, DocumentApproval } from '@/types/database';
import {
  ClipboardDocumentCheckIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  DocumentTextIcon,
  ChatBubbleLeftRightIcon,
  ArrowDownTrayIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';

type ApprovalFilter = 'pending' | 'approved' | 'rejected' | 'all';

interface DocumentWithApproval extends Document {
  approval?: DocumentApproval;
}

export default function ApprovalsPage() {
  const supabase = createClientComponentClient();
  const { user, profile } = useAuth();
  const { showToast } = useToast();
  
  const [documents, setDocuments] = useState<DocumentWithApproval[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<ApprovalFilter>('pending');
  const [selectedDoc, setSelectedDoc] = useState<DocumentWithApproval | null>(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [approvalForm, setApprovalForm] = useState({
    decision: '' as 'approve' | 'reject' | 'revise',
    comments: '',
    conditions: '',
  });

  // Statistics
  const [stats, setStats] = useState({
    pending: 0,
    approved: 0,
    rejected: 0,
    myPending: 0,
  });

  useEffect(() => {
    if (profile?.organization_id) {
      fetchDocuments();
      fetchStats();
    }
  }, [profile?.organization_id, filter]);

  const fetchDocuments = async () => {
    try {
      setLoading(true);

      // Get documents pending approval or with approval history
      let query = supabase
        .from('documents')
        .select('*')
        .eq('organization_id', profile?.organization_id)
        .eq('is_active', true);

      // Apply filter
      if (filter === 'pending') {
        query = query.eq('approval_status', 'pending');
      } else if (filter === 'approved') {
        query = query.eq('approval_status', 'approved');
      } else if (filter === 'rejected') {
        query = query.eq('approval_status', 'rejected');
      }

      query = query.order('created_at', { ascending: false });

      const { data: docs, error: docsError } = await query;
      if (docsError) throw docsError;

      // Fetch approval records for these documents
      if (docs && docs.length > 0) {
        const docIds = docs.map(d => d.id);
        const { data: approvals, error: approvalsError } = await supabase
          .from('document_approvals')
          .select('*')
          .in('document_id', docIds)
          .order('created_at', { ascending: false });

        if (approvalsError) throw approvalsError;

        // Merge documents with their approval records
        const docsWithApprovals = docs.map(doc => ({
          ...doc,
          approval: approvals?.find(a => a.document_id === doc.id),
        }));

        setDocuments(docsWithApprovals);
      } else {
        setDocuments([]);
      }
    } catch (error: any) {
      console.error('Error fetching documents:', error);
      showToast('Failed to load documents', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      // Get all documents
      const { data: allDocs, error: allError } = await supabase
        .from('documents')
        .select('approval_status, id')
        .eq('organization_id', profile?.organization_id)
        .eq('is_active', true);

      if (allError) throw allError;

      // Get approvals where current user is the approver
      const { data: myApprovals, error: myError } = await supabase
        .from('document_approvals')
        .select('document_id')
        .eq('organization_id', profile?.organization_id)
        .eq('approver_id', user?.id)
        .eq('status', 'pending');

      if (myError) throw myError;

      setStats({
        pending: allDocs?.filter(d => d.approval_status === 'pending').length || 0,
        approved: allDocs?.filter(d => d.approval_status === 'approved').length || 0,
        rejected: allDocs?.filter(d => d.approval_status === 'rejected').length || 0,
        myPending: myApprovals?.length || 0,
      });
    } catch (error: any) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleApprovalAction = (doc: DocumentWithApproval, action: 'approve' | 'reject' | 'revise') => {
    setSelectedDoc(doc);
    setApprovalForm({
      decision: action,
      comments: '',
      conditions: '',
    });
    setShowApprovalModal(true);
  };

  const submitApproval = async () => {
    if (!selectedDoc || !approvalForm.decision) return;

    if (!approvalForm.comments && (approvalForm.decision === 'reject' || approvalForm.decision === 'revise')) {
      showToast('Please provide comments for rejection or revision request', 'error');
      return;
    }

    try {
      // Check if approval record exists
      let approvalId = selectedDoc.approval?.id;

      if (!approvalId) {
        // Create new approval record
        const { data: newApproval, error: createError } = await supabase
          .from('document_approvals')
          .insert({
            organization_id: profile?.organization_id,
            document_id: selectedDoc.id,
            approver_id: user?.id,
            approver_role: profile?.role,
            status: approvalForm.decision === 'approve' ? 'approved' : 
                    approvalForm.decision === 'reject' ? 'rejected' : 'pending',
            decision: approvalForm.decision,
            comments: approvalForm.comments,
            conditions: approvalForm.conditions,
            responded_at: new Date().toISOString(),
            created_by: user?.id,
          })
          .select()
          .single();

        if (createError) throw createError;
        approvalId = newApproval.id;
      } else {
        // Update existing approval
        const { error: updateError } = await supabase
          .from('document_approvals')
          .update({
            status: approvalForm.decision === 'approve' ? 'approved' : 
                    approvalForm.decision === 'reject' ? 'rejected' : 'revision_required',
            decision: approvalForm.decision,
            comments: approvalForm.comments,
            conditions: approvalForm.conditions,
            responded_at: new Date().toISOString(),
          })
          .eq('id', approvalId);

        if (updateError) throw updateError;
      }

      // Update document status
      const newStatus = approvalForm.decision === 'approve' ? 'approved' :
                       approvalForm.decision === 'reject' ? 'rejected' : 
                       approvalForm.decision === 'revise' ? 'revision_required' : 'pending';

      const { error: docError } = await supabase
        .from('documents')
        .update({
          approval_status: newStatus,
          status: approvalForm.decision === 'approve' ? 'approved' : 
                  approvalForm.decision === 'reject' ? 'rejected' : 'pending_approval',
        })
        .eq('id', selectedDoc.id);

      if (docError) throw docError;

      // Create audit log
      await supabase.from('document_audit_logs').insert({
        organization_id: profile?.organization_id,
        document_id: selectedDoc.id,
        action: approvalForm.decision === 'approve' ? 'approve' : 
                approvalForm.decision === 'reject' ? 'reject' : 'request_revision',
        action_category: 'approval',
        action_details: {
          decision: approvalForm.decision,
          comments: approvalForm.comments,
          conditions: approvalForm.conditions,
        },
        user_id: user?.id,
        user_name: profile?.full_name,
        user_role: profile?.role,
        document_status: newStatus,
        compliance_event: true,
      });

      showToast(
        approvalForm.decision === 'approve' ? 'Document approved successfully' :
        approvalForm.decision === 'reject' ? 'Document rejected' :
        'Revision requested',
        'success'
      );

      setShowApprovalModal(false);
      setSelectedDoc(null);
      fetchDocuments();
      fetchStats();
    } catch (error: any) {
      console.error('Error processing approval:', error);
      showToast('Failed to process approval', 'error');
    }
  };

  const handleDownload = async (doc: Document) => {
    try {
      const { data, error } = await supabase.storage
        .from(doc.storage_bucket)
        .download(doc.storage_path);

      if (error) throw error;

      const url = window.URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.file_name;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      showToast('Document downloaded successfully', 'success');
    } catch (error: any) {
      console.error('Error downloading document:', error);
      showToast('Failed to download document', 'error');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'revision_required':
        return 'bg-yellow-100 text-yellow-800';
      case 'pending':
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading approvals...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-cyan-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="backdrop-blur-xl bg-white/70 rounded-2xl border border-teal-100 p-6 shadow-lg">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">
                Document Approvals
              </h1>
              <p className="text-gray-600 mt-1">Review and approve pending documents</p>
            </div>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-600 font-medium">Pending Approval</p>
                  <p className="text-2xl font-bold text-blue-900">{stats.pending}</p>
                </div>
                <ClockIcon className="h-10 w-10 text-blue-600/30" />
              </div>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100/50 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-600 font-medium">Approved</p>
                  <p className="text-2xl font-bold text-green-900">{stats.approved}</p>
                </div>
                <CheckCircleIcon className="h-10 w-10 text-green-600/30" />
              </div>
            </div>
            <div className="bg-gradient-to-br from-red-50 to-red-100/50 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-red-600 font-medium">Rejected</p>
                  <p className="text-2xl font-bold text-red-900">{stats.rejected}</p>
                </div>
                <XCircleIcon className="h-10 w-10 text-red-600/30" />
              </div>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-purple-600 font-medium">My Pending</p>
                  <p className="text-2xl font-bold text-purple-900">{stats.myPending}</p>
                </div>
                <ClipboardDocumentCheckIcon className="h-10 w-10 text-purple-600/30" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="backdrop-blur-xl bg-white/70 rounded-2xl border border-teal-100 p-4 shadow-lg">
          <div className="flex gap-2">
            {(['all', 'pending', 'approved', 'rejected'] as ApprovalFilter[]).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg capitalize transition-all ${
                  filter === f
                    ? 'bg-gradient-to-r from-teal-600 to-cyan-600 text-white'
                    : 'border border-gray-200 hover:bg-gray-50'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Documents List */}
        {documents.length === 0 ? (
          <div className="backdrop-blur-xl bg-white/70 rounded-2xl border border-teal-100 p-12 shadow-lg text-center">
            <ClipboardDocumentCheckIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No documents found</h3>
            <p className="text-gray-600">No documents match the selected filter</p>
          </div>
        ) : (
          <div className="space-y-4">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="backdrop-blur-xl bg-white/70 rounded-xl border border-teal-100 p-6 shadow-lg hover:shadow-xl transition-all"
              >
                <div className="flex items-start gap-4">
                  <DocumentTextIcon className="h-12 w-12 text-teal-600 flex-shrink-0" />
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold text-gray-900 text-lg">{doc.title}</h3>
                        <p className="text-sm text-gray-600">{doc.document_number}</p>
                      </div>
                      <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(doc.approval_status)}`}>
                        {doc.approval_status.replace('_', ' ')}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 mb-4">
                      <div>
                        <span className="font-medium">Type:</span>
                        <span className="ml-2 capitalize">{doc.document_type.replace('_', ' ')}</span>
                      </div>
                      <div>
                        <span className="font-medium">Uploaded:</span>
                        <span className="ml-2">{formatDate(doc.created_at)}</span>
                      </div>
                      {doc.approval?.responded_at && (
                        <div>
                          <span className="font-medium">Reviewed:</span>
                          <span className="ml-2">{formatDate(doc.approval.responded_at)}</span>
                        </div>
                      )}
                      {doc.is_confidential && (
                        <div className="text-red-600 font-medium">
                          Confidential
                        </div>
                      )}
                    </div>

                    {doc.approval?.comments && (
                      <div className="bg-gray-50 rounded-lg p-3 mb-4">
                        <div className="flex items-start gap-2">
                          <ChatBubbleLeftRightIcon className="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">Comments:</p>
                            <p className="text-sm text-gray-600 mt-1">{doc.approval.comments}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleDownload(doc)}
                        className="flex items-center gap-2 px-4 py-2 border border-teal-200 text-teal-700 rounded-lg hover:bg-teal-50 transition-all"
                      >
                        <ArrowDownTrayIcon className="h-4 w-4" />
                        Download
                      </button>
                      
                      {doc.approval_status === 'pending' && profile?.role && ['owner', 'manager', 'admin'].includes(profile.role) && (
                        <>
                          <button
                            onClick={() => handleApprovalAction(doc, 'approve')}
                            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all"
                          >
                            <CheckCircleIcon className="h-4 w-4" />
                            Approve
                          </button>
                          <button
                            onClick={() => handleApprovalAction(doc, 'revise')}
                            className="flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-all"
                          >
                            Request Revision
                          </button>
                          <button
                            onClick={() => handleApprovalAction(doc, 'reject')}
                            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all"
                          >
                            <XCircleIcon className="h-4 w-4" />
                            Reject
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Approval Modal */}
      {showApprovalModal && selectedDoc && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">
                {approvalForm.decision === 'approve' ? 'Approve Document' :
                 approvalForm.decision === 'reject' ? 'Reject Document' :
                 'Request Revision'}
              </h2>
              <p className="text-gray-600 mt-1">{selectedDoc.title}</p>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Comments {(approvalForm.decision === 'reject' || approvalForm.decision === 'revise') && <span className="text-red-500">*</span>}
                </label>
                <textarea
                  value={approvalForm.comments}
                  onChange={(e) => setApprovalForm({ ...approvalForm, comments: e.target.value })}
                  rows={4}
                  placeholder={
                    approvalForm.decision === 'approve' ? 'Optional: Add any comments or conditions...' :
                    approvalForm.decision === 'reject' ? 'Please explain why this document is being rejected...' :
                    'Please specify what needs to be revised...'
                  }
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              {approvalForm.decision === 'approve' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Approval Conditions (Optional)
                  </label>
                  <textarea
                    value={approvalForm.conditions}
                    onChange={(e) => setApprovalForm({ ...approvalForm, conditions: e.target.value })}
                    rows={3}
                    placeholder="Any conditions or requirements attached to this approval..."
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-200 flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowApprovalModal(false);
                  setSelectedDoc(null);
                }}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={submitApproval}
                className={`px-6 py-2 rounded-lg text-white font-semibold transition-all ${
                  approvalForm.decision === 'approve' ? 'bg-green-600 hover:bg-green-700' :
                  approvalForm.decision === 'reject' ? 'bg-red-600 hover:bg-red-700' :
                  'bg-yellow-600 hover:bg-yellow-700'
                }`}
              >
                Confirm {approvalForm.decision === 'approve' ? 'Approval' :
                        approvalForm.decision === 'reject' ? 'Rejection' :
                        'Revision Request'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
