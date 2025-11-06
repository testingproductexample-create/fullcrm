'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { 
  ArrowLeft,
  Search,
  Filter,
  Plus,
  Eye,
  Edit,
  AlertTriangle,
  CheckCircle2,
  Clock,
  XCircle,
  Shield,
  TrendingUp,
  DollarSign,
  User,
  Calendar,
  FileText,
  RefreshCw,
  Download
} from 'lucide-react';
import type { ComplianceViolation } from '@/types/visa-compliance';

interface ViolationWithEmployee extends ComplianceViolation {
  employee?: {
    first_name: string;
    last_name: string;
    employee_id: string;
    position: string;
    department: string;
  };
  assigned_to?: {
    first_name: string;
    last_name: string;
  };
}

export default function ComplianceViolationsPage() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [violations, setViolations] = useState<ViolationWithEmployee[]>([]);
  const [filteredViolations, setFilteredViolations] = useState<ViolationWithEmployee[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  useEffect(() => {
    if (profile?.organization_id) {
      fetchViolations();
    }
  }, [profile?.organization_id]);

  useEffect(() => {
    filterViolations();
  }, [violations, searchTerm, severityFilter, statusFilter, typeFilter]);

  const fetchViolations = async () => {
    if (!profile?.organization_id) return;

    try {
      const { data, error } = await supabase
        .from('compliance_violations')
        .select(`
          *,
          employee:employees!compliance_violations_employee_id_fkey (
            first_name,
            last_name,
            employee_id,
            position,
            department
          ),
          assigned_to:users!compliance_violations_assigned_to_user_id_fkey (
            first_name,
            last_name
          )
        `)
        .eq('organization_id', profile.organization_id)
        .order('detected_date', { ascending: false });

      if (error) throw error;
      setViolations(data || []);
    } catch (error) {
      console.error('Error fetching violations:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterViolations = () => {
    let filtered = [...violations];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(violation => 
        violation.employee?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        violation.employee?.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        violation.employee?.employee_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        violation.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Severity filter
    if (severityFilter !== 'all') {
      filtered = filtered.filter(violation => violation.severity === severityFilter);
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(violation => violation.status === statusFilter);
    }

    // Type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(violation => violation.violation_type === typeFilter);
    }

    setFilteredViolations(filtered);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'text-red-600 bg-red-100 border-red-200';
      case 'high':
        return 'text-orange-600 bg-orange-100 border-orange-200';
      case 'medium':
        return 'text-yellow-600 bg-yellow-100 border-yellow-200';
      case 'low':
        return 'text-blue-600 bg-blue-100 border-blue-200';
      default:
        return 'text-gray-600 bg-gray-100 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'resolved':
        return 'text-green-600 bg-green-100';
      case 'mitigated':
        return 'text-blue-600 bg-blue-100';
      case 'investigating':
        return 'text-yellow-600 bg-yellow-100';
      case 'active':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'resolved':
        return <CheckCircle2 className="w-4 h-4" />;
      case 'mitigated':
        return <Shield className="w-4 h-4" />;
      case 'investigating':
        return <Clock className="w-4 h-4" />;
      case 'active':
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return <XCircle className="w-4 h-4" />;
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getViolationTypeLabel = (type: string) => {
    const typeLabels: { [key: string]: string } = {
      'visa_expiry': 'Visa Expiry',
      'work_authorization': 'Work Authorization',
      'labor_law': 'Labor Law',
      'contract_compliance': 'Contract Compliance',
      'working_hours': 'Working Hours',
      'leave_policy': 'Leave Policy'
    };
    return typeLabels[type] || type.replace('_', ' ');
  };

  const getOverdueDays = (dueDate: string | null) => {
    if (!dueDate) return null;
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = today.getTime() - due.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-96">
            <RefreshCw className="w-8 h-8 animate-spin text-purple-600" />
          </div>
        </div>
      </div>
    );
  }

  const totalFinancialImpact = violations.reduce((sum, v) => sum + (v.financial_impact_aed || 0), 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard/visa-compliance">
              <button className="p-2 hover:bg-white/50 rounded-lg transition-colors">
                <ArrowLeft className="w-6 h-6 text-gray-600" />
              </button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Compliance Violations</h1>
              <p className="text-gray-600 mt-1">Track and manage compliance issues and violations</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button className="px-4 py-2 bg-white/70 text-gray-700 rounded-lg hover:bg-white/90 transition-colors flex items-center gap-2 border border-white/20">
              <Download className="w-4 h-4" />
              Export Report
            </button>
            <Link href="/dashboard/visa-compliance/violations/new">
              <button className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-colors flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Report Violation
              </button>
            </Link>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="backdrop-blur-xl bg-white/70 rounded-2xl shadow-lg border border-white/20 p-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search employees, description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="all">All Severities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="investigating">Investigating</option>
              <option value="mitigated">Mitigated</option>
              <option value="resolved">Resolved</option>
            </select>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="all">All Types</option>
              <option value="visa_expiry">Visa Expiry</option>
              <option value="work_authorization">Work Authorization</option>
              <option value="labor_law">Labor Law</option>
              <option value="contract_compliance">Contract Compliance</option>
              <option value="working_hours">Working Hours</option>
              <option value="leave_policy">Leave Policy</option>
            </select>
            <button
              onClick={() => {
                setSearchTerm('');
                setSeverityFilter('all');
                setStatusFilter('all');
                setTypeFilter('all');
              }}
              className="px-4 py-2 text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          <div className="backdrop-blur-xl bg-white/70 rounded-2xl shadow-lg border border-white/20 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Violations</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{violations.length}</p>
              </div>
              <div className="p-3 bg-red-100 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>
          <div className="backdrop-blur-xl bg-white/70 rounded-2xl shadow-lg border border-white/20 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active</p>
                <p className="text-2xl font-bold text-red-600 mt-1">
                  {violations.filter(v => v.status === 'active').length}
                </p>
              </div>
              <div className="p-3 bg-red-100 rounded-lg">
                <XCircle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>
          <div className="backdrop-blur-xl bg-white/70 rounded-2xl shadow-lg border border-white/20 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Critical</p>
                <p className="text-2xl font-bold text-orange-600 mt-1">
                  {violations.filter(v => v.severity === 'critical').length}
                </p>
              </div>
              <div className="p-3 bg-orange-100 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>
          <div className="backdrop-blur-xl bg-white/70 rounded-2xl shadow-lg border border-white/20 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Resolved</p>
                <p className="text-2xl font-bold text-green-600 mt-1">
                  {violations.filter(v => v.status === 'resolved').length}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
          <div className="backdrop-blur-xl bg-white/70 rounded-2xl shadow-lg border border-white/20 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Financial Impact</p>
                <p className="text-2xl font-bold text-purple-600 mt-1">
                  {totalFinancialImpact > 0 ? `${totalFinancialImpact.toLocaleString()} AED` : '0 AED'}
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <DollarSign className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Violations List */}
        <div className="backdrop-blur-xl bg-white/70 rounded-2xl shadow-lg border border-white/20 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Violation Records ({filteredViolations.length})</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Violation</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Severity</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Financial Impact</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredViolations.map((violation) => {
                  const overdueDays = getOverdueDays(violation.due_date);
                  
                  return (
                    <tr key={violation.id} className="hover:bg-gray-50/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-lg border ${getSeverityColor(violation.severity)}`}>
                            {getStatusIcon(violation.status)}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {getViolationTypeLabel(violation.violation_type)}
                            </div>
                            <div className="text-sm text-gray-500 max-w-xs">
                              {violation.description}
                            </div>
                            <div className="text-xs text-gray-400 mt-1">
                              Detected: {formatDate(violation.detected_date)}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {violation.employee ? (
                          <div className="flex items-center">
                            <div className="flex-shrink-0">
                              <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center">
                                <User className="w-4 h-4 text-white" />
                              </div>
                            </div>
                            <div className="ml-3">
                              <div className="text-sm font-medium text-gray-900">
                                {violation.employee.first_name} {violation.employee.last_name}
                              </div>
                              <div className="text-sm text-gray-500">
                                {violation.employee.employee_id}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-sm">System-wide</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getSeverityColor(violation.severity)}`}>
                          {violation.severity.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(violation.status)}`}>
                          {getStatusIcon(violation.status)}
                          {violation.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {violation.due_date ? (
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <div>
                              <div className="text-sm text-gray-900">
                                {formatDate(violation.due_date)}
                              </div>
                              {overdueDays && overdueDays > 0 && (
                                <div className="text-xs text-red-600 font-medium">
                                  {overdueDays} days overdue
                                </div>
                              )}
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-sm">No deadline</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {violation.financial_impact_aed ? (
                          <div className="flex items-center gap-2">
                            <DollarSign className="w-4 h-4 text-gray-400" />
                            <span className="text-sm font-medium text-gray-900">
                              {violation.financial_impact_aed.toLocaleString()} AED
                            </span>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-sm">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link href={`/dashboard/visa-compliance/violations/${violation.id}`}>
                            <button className="p-1 text-gray-400 hover:text-purple-600 transition-colors">
                              <Eye className="w-4 h-4" />
                            </button>
                          </Link>
                          <Link href={`/dashboard/visa-compliance/violations/${violation.id}/edit`}>
                            <button className="p-1 text-gray-400 hover:text-blue-600 transition-colors">
                              <Edit className="w-4 h-4" />
                            </button>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {filteredViolations.length === 0 && (
            <div className="text-center py-12">
              <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm || severityFilter !== 'all' || statusFilter !== 'all' || typeFilter !== 'all' 
                  ? 'No violations found'
                  : 'No compliance violations'
                }
              </h3>
              <p className="text-gray-500 mb-4">
                {searchTerm || severityFilter !== 'all' || statusFilter !== 'all' || typeFilter !== 'all' 
                  ? 'Try adjusting your search filters'
                  : 'Your organization is currently in compliance with all regulations'
                }
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}