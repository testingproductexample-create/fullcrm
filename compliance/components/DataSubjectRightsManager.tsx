import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { Textarea } from '../../../components/ui/textarea';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../../../components/ui/dialog';
import { 
  UserCheck, 
  Plus, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  FileText,
  Download,
  Trash2,
  Eye,
  Edit,
  Send
} from 'lucide-react';
import { createClient } from '../../../../lib/supabase';
import { formatDateTime, isWithinDays, daysBetween } from '../../utils/uuid';

interface DataSubjectRequest {
  id: string;
  userId: string;
  requestType: string;
  requestStatus: string;
  requestDate: string;
  requestedDataCategories: string[];
  requestDetails: string;
  identityVerified: boolean;
  verificationDate?: string;
  verificationMethod?: string;
  responseDate?: string;
  responseMethod: string;
  responseDetails?: string;
  rejectionReason?: string;
  processingDeadline: string;
  escalated: boolean;
  assignedOfficer?: string;
  legalBasis?: string;
  dataLocation?: string;
  thirdPartiesNotified?: string[];
  createdAt: string;
  updatedAt: string;
}

export const DataSubjectRightsManager: React.FC<{ userId?: string; userRole?: string }> = ({ 
  userId, 
  userRole = 'user' 
}) => {
  const [requests, setRequests] = useState<DataSubjectRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<DataSubjectRequest | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  
  const [formData, setFormData] = useState({
    userId: userId || '',
    requestType: '',
    requestedDataCategories: [] as string[],
    requestDetails: ''
  });

  const supabase = createClient();

  const requestTypes = [
    { value: 'access', label: 'Right of Access', description: 'Request a copy of your personal data' },
    { value: 'rectification', label: 'Right of Rectification', description: 'Correct inaccurate personal data' },
    { value: 'erasure', label: 'Right of Erasure', description: 'Delete your personal data' },
    { value: 'portability', label: 'Right of Data Portability', description: 'Transfer your data to another service' },
    { value: 'restriction', label: 'Right of Restriction', description: 'Limit how your data is processed' },
    { value: 'objection', label: 'Right to Object', description: 'Object to processing of your data' },
    { value: 'automated_decision_making', label: 'Automated Decision-Making', description: 'Review automated decisions' }
  ];

  const dataCategories = [
    'Personal Identification Data',
    'Contact Information',
    'Financial Information',
    'Transaction History',
    'Device Information',
    'Usage Analytics',
    'Location Data',
    'Communication Records',
    'Profile Data',
    'Activity Logs'
  ];

  useEffect(() => {
    fetchRequests();
  }, [userId, userRole]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('data_subject_requests')
        .select('*')
        .order('created_at', { ascending: false });

      // Regular users can only see their own requests
      if (userRole === 'user' && userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setRequests(data || []);
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const createRequest = async () => {
    try {
      const processingDeadline = new Date();
      processingDeadline.setDate(processingDeadline.getDate() + 30);

      const requestData = {
        ...formData,
        request_date: new Date().toISOString(),
        request_status: 'pending',
        processing_deadline: processingDeadline.toISOString().split('T')[0],
        identity_verified: false,
        response_method: 'email',
        escalated: false
      };

      const { data, error } = await supabase
        .from('data_subject_requests')
        .insert([requestData])
        .select()
        .single();

      if (error) throw error;

      setRequests([data, ...requests]);
      setShowCreateDialog(false);
      resetForm();
    } catch (error) {
      console.error('Error creating request:', error);
    }
  };

  const updateRequestStatus = async (requestId: string, status: string, responseDetails?: string) => {
    try {
      const updateData: any = {
        request_status: status,
        updated_at: new Date().toISOString()
      };

      if (responseDetails) {
        updateData.response_details = responseDetails;
        updateData.response_date = new Date().toISOString();
      }

      if (status === 'completed') {
        updateData.identity_verified = true;
        updateData.verification_date = new Date().toISOString();
        updateData.verification_method = 'system';
      }

      const { data, error } = await supabase
        .from('data_subject_requests')
        .update(updateData)
        .eq('id', requestId)
        .select()
        .single();

      if (error) throw error;

      setRequests(requests.map(r => r.id === requestId ? data : r));
    } catch (error) {
      console.error('Error updating request status:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      userId: userId || '',
      requestType: '',
      requestedDataCategories: [],
      requestDetails: ''
    });
  };

  const getStatusBadge = (request: DataSubjectRequest) => {
    const isOverdue = new Date(request.processingDeadline) < new Date() && 
                     ['pending', 'in_progress'].includes(request.requestStatus);
    
    if (isOverdue) {
      return <Badge variant="destructive">Overdue</Badge>;
    }

    switch (request.requestStatus) {
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'in_progress':
        return <Badge variant="default" className="bg-blue-500">In Progress</Badge>;
      case 'completed':
        return <Badge variant="default" className="bg-green-500">Completed</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      case 'partially_completed':
        return <Badge variant="outline">Partially Completed</Badge>;
      default:
        return <Badge variant="outline">{request.requestStatus}</Badge>;
    }
  };

  const getDaysRemaining = (deadline: string) => {
    const today = new Date();
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const isUrgent = (request: DataSubjectRequest) => {
    return getDaysRemaining(request.processingDeadline) <= 3 && 
           ['pending', 'in_progress'].includes(request.requestStatus);
  };

  const canManageRequests = ['admin', 'compliance_officer', 'dpo'].includes(userRole);

  if (loading) {
    return <div className="flex justify-center py-8">Loading requests...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center space-x-2">
            <UserCheck className="h-6 w-6 text-blue-600" />
            <span>Data Subject Rights</span>
          </h2>
          <p className="text-gray-600">Manage data subject access, rectification, and erasure requests</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Request
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Data Subject Request</DialogTitle>
              <DialogDescription>
                Submit a request to exercise your data protection rights
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="requestType">Request Type *</Label>
                <Select onValueChange={(value) => setFormData({ ...formData, requestType: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select request type" />
                  </SelectTrigger>
                  <SelectContent>
                    {requestTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        <div>
                          <div className="font-medium">{type.label}</div>
                          <div className="text-sm text-gray-500">{type.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Data Categories *</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {dataCategories.map((category) => (
                    <label key={category} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={formData.requestedDataCategories.includes(category)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData({
                              ...formData,
                              requestedDataCategories: [...formData.requestedDataCategories, category]
                            });
                          } else {
                            setFormData({
                              ...formData,
                              requestedDataCategories: formData.requestedDataCategories.filter(c => c !== category)
                            });
                          }
                        }}
                        className="rounded"
                      />
                      <span className="text-sm">{category}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="requestDetails">Additional Details</Label>
                <Textarea
                  id="requestDetails"
                  value={formData.requestDetails}
                  onChange={(e) => setFormData({ ...formData, requestDetails: e.target.value })}
                  placeholder="Provide additional details about your request..."
                  rows={4}
                />
              </div>

              <div className="bg-blue-50 p-3 rounded-md">
                <p className="text-sm">
                  <strong>Processing Time:</strong> We will respond to your request within 30 days as required by UAE PDPL.
                </p>
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={createRequest} 
                  disabled={!formData.requestType || formData.requestedDataCategories.length === 0}
                >
                  Submit Request
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <FileText className="h-5 w-5 text-blue-600" />
              <div>
                <div className="text-2xl font-bold">{requests.length}</div>
                <div className="text-sm text-gray-600">Total Requests</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-yellow-600" />
              <div>
                <div className="text-2xl font-bold">
                  {requests.filter(r => r.requestStatus === 'pending' || r.requestStatus === 'in_progress').length}
                </div>
                <div className="text-sm text-gray-600">Active</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <div className="text-2xl font-bold">
                  {requests.filter(r => r.requestStatus === 'completed').length}
                </div>
                <div className="text-sm text-gray-600">Completed</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <div>
                <div className="text-2xl font-bold">
                  {requests.filter(r => isUrgent(r)).length}
                </div>
                <div className="text-sm text-gray-600">Urgent</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Requests List */}
      <Card>
        <CardHeader>
          <CardTitle>Data Subject Requests</CardTitle>
          <CardDescription>
            Track and manage data protection rights requests
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {requests.map((request) => (
              <div 
                key={request.id} 
                className={`border rounded-lg p-4 space-y-3 ${isUrgent(request) ? 'border-red-500 bg-red-50' : ''}`}
              >
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h3 className="font-semibold flex items-center space-x-2">
                      <span>{requestTypes.find(t => t.value === request.requestType)?.label || request.requestType}</span>
                      {isUrgent(request) && <AlertTriangle className="h-4 w-4 text-red-600" />}
                    </h3>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <span>Request ID: {request.id.slice(0, 8)}...</span>
                      <span>Submitted: {formatDateTime(request.requestDate)}</span>
                      <span className="flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        {getDaysRemaining(request.processingDeadline) > 0 
                          ? `${getDaysRemaining(request.processingDeadline)} days remaining`
                          : 'Overdue'
                        }
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getStatusBadge(request)}
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => {
                        setSelectedRequest(request);
                        setShowDetailsDialog(true);
                      }}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    {canManageRequests && (
                      <>
                        {request.requestStatus === 'pending' && (
                          <>
                            <Button 
                              size="sm" 
                              onClick={() => updateRequestStatus(request.id, 'in_progress')}
                            >
                              Start Processing
                            </Button>
                            <Button 
                              size="sm" 
                              variant="destructive"
                              onClick={() => updateRequestStatus(request.id, 'rejected', 'Request rejected - insufficient verification')}
                            >
                              Reject
                            </Button>
                          </>
                        )}
                        {request.requestStatus === 'in_progress' && (
                          <Button 
                            size="sm"
                            onClick={() => updateRequestStatus(request.id, 'completed', 'Request completed successfully')}
                          >
                            Mark Complete
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </div>
                
                <div className="bg-gray-50 p-3 rounded-md">
                  <div className="text-sm">
                    <strong>Data Categories:</strong> {request.requestedDataCategories.join(', ')}
                  </div>
                  {request.requestDetails && (
                    <div className="mt-2">
                      <strong>Details:</strong> {request.requestDetails}
                    </div>
                  )}
                </div>

                {request.responseDetails && (
                  <div className="bg-green-50 p-3 rounded-md">
                    <div className="text-sm">
                      <strong>Response:</strong> {request.responseDetails}
                    </div>
                    {request.responseDate && (
                      <div className="text-xs text-gray-600 mt-1">
                        Responded on: {formatDateTime(request.responseDate)}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
            
            {requests.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No data subject requests found.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Request Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Request Details</DialogTitle>
            <DialogDescription>
              Detailed information about this data subject request
            </DialogDescription>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Request Type</Label>
                  <p className="font-medium">
                    {requestTypes.find(t => t.value === selectedRequest.requestType)?.label}
                  </p>
                </div>
                <div>
                  <Label>Status</Label>
                  <div className="mt-1">{getStatusBadge(selectedRequest)}</div>
                </div>
                <div>
                  <Label>Submitted</Label>
                  <p>{formatDateTime(selectedRequest.requestDate)}</p>
                </div>
                <div>
                  <Label>Processing Deadline</Label>
                  <p className={getDaysRemaining(selectedRequest.processingDeadline) < 0 ? 'text-red-600 font-medium' : ''}>
                    {formatDateTime(selectedRequest.processingDeadline)}
                  </p>
                </div>
                <div>
                  <Label>Data Categories</Label>
                  <p>{selectedRequest.requestedDataCategories.join(', ')}</p>
                </div>
                <div>
                  <Label>Identity Verified</Label>
                  <p>{selectedRequest.identityVerified ? 'Yes' : 'No'}</p>
                </div>
              </div>
              
              {selectedRequest.requestDetails && (
                <div>
                  <Label>Request Details</Label>
                  <p className="mt-1 p-3 bg-gray-50 rounded-md">{selectedRequest.requestDetails}</p>
                </div>
              )}
              
              {selectedRequest.responseDetails && (
                <div>
                  <Label>Response</Label>
                  <p className="mt-1 p-3 bg-green-50 rounded-md">{selectedRequest.responseDetails}</p>
                </div>
              )}

              <div className="flex justify-end space-x-2">
                {canManageRequests && selectedRequest.requestStatus === 'pending' && (
                  <>
                    <Button 
                      variant="outline"
                      onClick={() => {
                        updateRequestStatus(selectedRequest.id, 'in_progress');
                        setShowDetailsDialog(false);
                      }}
                    >
                      Start Processing
                    </Button>
                    <Button 
                      variant="destructive"
                      onClick={() => {
                        updateRequestStatus(selectedRequest.id, 'rejected', 'Request rejected');
                        setShowDetailsDialog(false);
                      }}
                    >
                      Reject Request
                    </Button>
                  </>
                )}
                {canManageRequests && selectedRequest.requestStatus === 'in_progress' && (
                  <Button 
                    onClick={() => {
                      updateRequestStatus(selectedRequest.id, 'completed', 'Request completed successfully');
                      setShowDetailsDialog(false);
                    }}
                  >
                    Mark Complete
                  </Button>
                )}
                <Button variant="outline" onClick={() => setShowDetailsDialog(false)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DataSubjectRightsManager;