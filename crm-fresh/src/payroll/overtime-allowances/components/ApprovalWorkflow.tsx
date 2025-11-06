import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './Card';
import { Button } from './Button';
import { Badge } from './Badge';
import { OvertimeAllowancesService } from '../service';
import { formatCurrency, formatHours, UAEOvertimeCalculator } from '../uaeCompliantCalculator';
import { OvertimeRecord } from '../types';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  User, 
  Calendar,
  Building,
  DollarSign,
  MessageCircle,
  Eye,
  Filter,
  Search,
  AlertTriangle,
  TrendingUp
} from 'lucide-react';

interface ApprovalWorkflowProps {
  onDataChange: () => void;
}

export const ApprovalWorkflow: React.FC<ApprovalWorkflowProps> = ({ onDataChange }) => {
  const [overtimeRecords, setOvertimeRecords] = useState<OvertimeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({
    status: 'pending',
    department: 'all',
    search: ''
  });
  const [selectedRecord, setSelectedRecord] = useState<OvertimeRecord | null>(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    loadPendingApprovals();
  }, [filter]);

  const loadPendingApprovals = async () => {
    try {
      setLoading(true);
      const records = await OvertimeAllowancesService.getOvertimeRecords();
      
      let filteredRecords = records.filter(r => r.status === filter.status);
      
      if (filter.department !== 'all') {
        filteredRecords = filteredRecords.filter(r => r.department === filter.department);
      }
      
      if (filter.search) {
        const searchLower = filter.search.toLowerCase();
        filteredRecords = filteredRecords.filter(r => 
          r.employeeName.toLowerCase().includes(searchLower) ||
          r.department.toLowerCase().includes(searchLower) ||
          r.notes?.toLowerCase().includes(searchLower)
        );
      }
      
      // Sort by date (newest first)
      filteredRecords.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      setOvertimeRecords(filteredRecords);
    } catch (error) {
      console.error('Error loading approvals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (record: OvertimeRecord) => {
    try {
      await OvertimeAllowancesService.approveOvertime(
        record.id,
        'mgr001',
        'Sarah Johnson',
        'Approved per UAE labor law guidelines'
      );
      await loadPendingApprovals();
      onDataChange();
    } catch (error) {
      console.error('Error approving overtime:', error);
    }
  };

  const handleReject = async (record: OvertimeRecord) => {
    if (!rejectionReason.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }

    try {
      await OvertimeAllowancesService.rejectOvertime(
        record.id,
        'mgr001',
        'Sarah Johnson',
        rejectionReason
      );
      setShowApprovalModal(false);
      setRejectionReason('');
      setSelectedRecord(null);
      await loadPendingApprovals();
      onDataChange();
    } catch (error) {
      console.error('Error rejecting overtime:', error);
    }
  };

  const getStatusBadge = (status: OvertimeRecord['status']) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800">Approved</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800">Rejected</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'paid':
        return <Badge className="bg-blue-100 text-blue-800">Paid</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getOvertimeTypeColor = (type: OvertimeRecord['overtimeType']) => {
    const colors = {
      weekday: 'bg-blue-100 text-blue-800',
      weekend: 'bg-purple-100 text-purple-800',
      holiday: 'bg-red-100 text-red-800',
      night: 'bg-indigo-100 text-indigo-800'
    };
    return colors[type];
  };

  const validateCompliance = (record: OvertimeRecord) => {
    // Check UAE compliance
    const baseHourlyRate = record.hourlyRate / (getOvertimeTypeColor(record.overtimeType) === 'bg-blue-100 text-blue-800' ? 1.25 : 
                                               getOvertimeTypeColor(record.overtimeType) === 'bg-purple-100 text-purple-800' ? 1.5 : 2.0);
    
    const compliance = UAEOvertimeCalculator.checkOvertimeCompliance(
      record.overtimeHours,
      record.overtimeHours, // Simplified - would need weekly data
      record.overtimeHours * 22 // Simplified - would need monthly data
    );

    return compliance;
  };

  const departments = Array.from(new Set(overtimeRecords.map(r => r.department)));
  const totalAmount = overtimeRecords.reduce((sum, r) => sum + r.totalAmount, 0);
  const totalHours = overtimeRecords.reduce((sum, r) => sum + r.overtimeHours, 0);
  const pendingCount = overtimeRecords.filter(r => r.status === 'pending').length;
  const complianceRate = overtimeRecords.length > 0 ? 
    (overtimeRecords.filter(r => validateCompliance(r).compliant).length / overtimeRecords.length) * 100 : 100;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="glass-card border-0">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <Clock className="w-8 h-8 text-yellow-600" />
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-xl font-bold">{pendingCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="glass-card border-0">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <DollarSign className="w-8 h-8 text-emerald-600" />
              <div>
                <p className="text-sm text-gray-600">Total Amount</p>
                <p className="text-xl font-bold">{formatCurrency(totalAmount)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="glass-card border-0">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <TrendingUp className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Total Hours</p>
                <p className="text-xl font-bold">{formatHours(totalHours)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="glass-card border-0">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <CheckCircle className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Compliance</p>
                <p className="text-xl font-bold">{Math.round(complianceRate)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="glass-card border-0">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search employees or departments..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50"
                value={filter.search}
                onChange={(e) => setFilter({ ...filter, search: e.target.value })}
              />
            </div>
            
            <select
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50"
              value={filter.status}
              onChange={(e) => setFilter({ ...filter, status: e.target.value })}
            >
              <option value="pending">Pending Approval</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="all">All Status</option>
            </select>
            
            <select
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50"
              value={filter.department}
              onChange={(e) => setFilter({ ...filter, department: e.target.value })}
            >
              <option value="all">All Departments</option>
              {departments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Approval Queue */}
      <Card className="glass-card border-0 shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-gray-900 flex items-center">
              <CheckCircle className="w-5 h-5 mr-2" />
              Overtime Approval Queue
            </CardTitle>
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <span className="text-sm text-gray-600">
                UAE Labor Law Compliant
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {overtimeRecords.map((record) => {
              const compliance = validateCompliance(record);
              return (
                <div 
                  key={record.id} 
                  className="p-4 rounded-lg border border-gray-200 bg-white/50 hover:bg-white/70 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4 mb-3">
                        <div>
                          <h4 className="font-medium text-gray-900">{record.employeeName}</h4>
                          <p className="text-sm text-gray-600 flex items-center">
                            <Building className="w-3 h-3 mr-1" />
                            {record.department}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          {getStatusBadge(record.status)}
                          <Badge className={getOvertimeTypeColor(record.overtimeType)}>
                            {record.overtimeType}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                        <div>
                          <p className="text-xs text-gray-500">Date</p>
                          <p className="text-sm font-medium text-gray-900">{record.date}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Hours</p>
                          <p className="text-sm font-medium text-gray-900">
                            {formatHours(record.overtimeHours)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Rate</p>
                          <p className="text-sm font-medium text-gray-900">
                            {formatCurrency(record.hourlyRate)}/hr
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Amount</p>
                          <p className="text-sm font-medium text-emerald-600">
                            {formatCurrency(record.totalAmount)}
                          </p>
                        </div>
                      </div>
                      
                      {record.notes && (
                        <div className="mb-3">
                          <p className="text-xs text-gray-500">Notes</p>
                          <p className="text-sm text-gray-700 flex items-start">
                            <MessageCircle className="w-3 h-3 mr-1 mt-0.5 flex-shrink-0" />
                            {record.notes}
                          </p>
                        </div>
                      )}
                      
                      {/* Compliance Warnings */}
                      {!compliance.compliant && compliance.violations.length > 0 && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3">
                          <div className="flex items-start space-x-2">
                            <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5" />
                            <div>
                              <p className="text-sm font-medium text-red-800">Compliance Issue</p>
                              <ul className="text-xs text-red-700 mt-1">
                                {compliance.violations.map((violation, index) => (
                                  <li key={index}>• {violation}</li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* Approval Info */}
                      {record.approvedBy && (
                        <div className="text-xs text-gray-500 flex items-center">
                          <User className="w-3 h-3 mr-1" />
                          Approved by {record.approvedBy} on {record.approvedAt}
                        </div>
                      )}
                    </div>
                    
                    {record.status === 'pending' && (
                      <div className="flex space-x-2 ml-4">
                        <Button
                          size="sm"
                          onClick={() => handleApprove(record)}
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedRecord(record);
                            setShowApprovalModal(true);
                          }}
                          className="text-red-600 border-red-300 hover:bg-red-50"
                        >
                          <XCircle className="w-3 h-3 mr-1" />
                          Reject
                        </Button>
                      </div>
                    )}
                    
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setSelectedRecord(record)}
                    >
                      <Eye className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
          
          {overtimeRecords.length === 0 && (
            <div className="text-center py-8">
              <CheckCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No approval requests found</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Rejection Modal */}
      {showApprovalModal && selectedRecord && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Reject Overtime Request</h3>
            <p className="text-sm text-gray-600 mb-4">
              Are you sure you want to reject the overtime request for {selectedRecord.employeeName}?
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for rejection
              </label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                rows={3}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Please provide a reason for rejection..."
              />
            </div>
            <div className="flex space-x-3">
              <Button
                variant="destructive"
                onClick={() => handleReject(selectedRecord)}
                className="flex-1"
              >
                Reject Request
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowApprovalModal(false);
                  setRejectionReason('');
                  setSelectedRecord(null);
                }}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};