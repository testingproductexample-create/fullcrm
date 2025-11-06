import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './Card';
import { Button } from './Button';
import { Badge } from './Badge';
import { OvertimeAllowancesService } from '../service';
import { formatCurrency, formatHours, UAEOvertimeCalculator } from '../uaeCompliantCalculator';
import { OvertimeRecord, AttendanceRecord } from '../types';
import { 
  Clock, 
  Plus, 
  Filter, 
  Search, 
  Edit, 
  Trash2, 
  Eye,
  CheckCircle,
  XCircle,
  Calendar,
  DollarSign,
  User,
  Building
} from 'lucide-react';

interface OvertimeManagementProps {
  onDataChange: () => void;
}

export const OvertimeManagement: React.FC<OvertimeManagementProps> = ({ onDataChange }) => {
  const [overtimeRecords, setOvertimeRecords] = useState<OvertimeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({
    status: 'all',
    department: 'all',
    dateRange: '30',
    search: ''
  });
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<OvertimeRecord | null>(null);

  useEffect(() => {
    loadOvertimeRecords();
  }, [filter]);

  const loadOvertimeRecords = async () => {
    try {
      setLoading(true);
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(filter.dateRange));
      const startDateStr = startDate.toISOString().split('T')[0];
      
      const records = await OvertimeAllowancesService.getOvertimeRecords(undefined, startDateStr, endDate);
      
      let filteredRecords = records;
      
      if (filter.status !== 'all') {
        filteredRecords = filteredRecords.filter(r => r.status === filter.status);
      }
      
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
      
      setOvertimeRecords(filteredRecords);
    } catch (error) {
      console.error('Error loading overtime records:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (recordId: string) => {
    try {
      await OvertimeAllowancesService.approveOvertime(
        recordId, 
        'mgr001', 
        'Sarah Johnson', 
        'Approved per UAE labor law'
      );
      await loadOvertimeRecords();
      onDataChange();
    } catch (error) {
      console.error('Error approving overtime:', error);
    }
  };

  const handleReject = async (recordId: string) => {
    try {
      await OvertimeAllowancesService.rejectOvertime(
        recordId, 
        'mgr001', 
        'Sarah Johnson', 
        'Insufficient justification'
      );
      await loadOvertimeRecords();
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

  const getOvertimeTypeBadge = (type: OvertimeRecord['overtimeType']) => {
    const colors = {
      weekday: 'bg-blue-100 text-blue-800',
      weekend: 'bg-purple-100 text-purple-800',
      holiday: 'bg-red-100 text-red-800',
      night: 'bg-indigo-100 text-indigo-800'
    };
    return <Badge className={colors[type]}>{type}</Badge>;
  };

  const departments = Array.from(new Set(overtimeRecords.map(r => r.department)));
  const totalAmount = overtimeRecords.reduce((sum, r) => sum + r.totalAmount, 0);
  const totalHours = overtimeRecords.reduce((sum, r) => sum + r.overtimeHours, 0);
  const pendingCount = overtimeRecords.filter(r => r.status === 'pending').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="glass-card border-0">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <Clock className="w-8 h-8 text-blue-600" />
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
              <CheckCircle className="w-8 h-8 text-yellow-600" />
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
              <User className="w-8 h-8 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600">Employees</p>
                <p className="text-xl font-bold">{overtimeRecords.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="glass-card border-0">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search employees..."
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
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="paid">Paid</option>
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
            
            <select
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50"
              value={filter.dateRange}
              onChange={(e) => setFilter({ ...filter, dateRange: e.target.value })}
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 3 months</option>
              <option value="365">Last year</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Overtime Records Table */}
      <Card className="glass-card border-0 shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-gray-900">Overtime Records</CardTitle>
            <Button 
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              onClick={() => setShowAddModal(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Overtime
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Employee</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Date</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Type</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Hours</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Rate</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Amount</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {overtimeRecords.map((record) => (
                  <tr key={record.id} className="border-b border-gray-100 hover:bg-white/30 transition-colors">
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-medium text-gray-900">{record.employeeName}</p>
                        <p className="text-sm text-gray-600">{record.department}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-900">{record.date}</td>
                    <td className="py-3 px-4">
                      {getOvertimeTypeBadge(record.overtimeType)}
                    </td>
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-medium text-gray-900">{formatHours(record.overtimeHours)}</p>
                        <p className="text-xs text-gray-600">Regular: {formatHours(record.regularHours)}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <p className="text-gray-900">{formatCurrency(record.hourlyRate)}/hr</p>
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-medium text-emerald-600">{formatCurrency(record.totalAmount)}</p>
                    </td>
                    <td className="py-3 px-4">
                      {getStatusBadge(record.status)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex space-x-2">
                        {record.status === 'pending' && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => handleApprove(record.id)}
                              className="bg-green-600 hover:bg-green-700 text-white"
                            >
                              <CheckCircle className="w-3 h-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleReject(record.id)}
                            >
                              <XCircle className="w-3 h-3" />
                            </Button>
                          </>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedRecord(record)}
                        >
                          <Eye className="w-3 h-3" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {overtimeRecords.length === 0 && (
            <div className="text-center py-8">
              <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No overtime records found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};