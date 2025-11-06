'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { 
  FileText,
  Building,
  Shield,
  AlertTriangle,
  CheckCircle,
  Clock,
  Upload,
  Download,
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  Calendar
} from 'lucide-react';
import type { RegulatoryReport } from '@/types/database';

interface RegulatoryStats {
  totalReports: number;
  pendingSubmissions: number;
  approvedReports: number;
  rejectedReports: number;
  overdueReports: number;
}

interface ReportTemplate {
  id: string;
  name: string;
  authority: string;
  frequency: string;
  nextDue: string;
  description: string;
}

export default function RegulatoryReportsPage() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState<RegulatoryReport[]>([]);
  const [stats, setStats] = useState<RegulatoryStats>({
    totalReports: 0,
    pendingSubmissions: 0,
    approvedReports: 0,
    rejectedReports: 0,
    overdueReports: 0
  });
  const [filterAuthority, setFilterAuthority] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterPeriod, setFilterPeriod] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newReport, setNewReport] = useState({
    report_type: '',
    report_period: '',
    due_date: ''
  });

  const reportTemplates: ReportTemplate[] = [
    {
      id: 'central_bank_q',
      name: 'Central Bank Quarterly Report',
      authority: 'UAE Central Bank',
      frequency: 'Quarterly',
      nextDue: '2025-01-31',
      description: 'Financial position and risk exposure report'
    },
    {
      id: 'fta_vat',
      name: 'VAT Return',
      authority: 'Federal Tax Authority',
      frequency: 'Quarterly',
      nextDue: '2025-01-28',
      description: 'Value Added Tax return filing'
    },
    {
      id: 'economic_substance',
      name: 'Economic Substance Report',
      authority: 'Ministry of Economy',
      frequency: 'Annual',
      nextDue: '2025-06-30',
      description: 'Economic Substance Regulation compliance report'
    },
    {
      id: 'aml_report',
      name: 'AML/CFT Compliance Report',
      authority: 'Financial Intelligence Unit',
      frequency: 'Annual',
      nextDue: '2025-03-31',
      description: 'Anti-Money Laundering compliance report'
    },
    {
      id: 'securities_filing',
      name: 'Securities Commission Filing',
      authority: 'Securities & Commodities Authority',
      frequency: 'Semi-Annual',
      nextDue: '2025-02-28',
      description: 'Investment portfolio and securities report'
    }
  ];

  useEffect(() => {
    if (profile?.organization_id) {
      loadRegulatoryReports();
    }
  }, [profile]);

  const loadRegulatoryReports = async () => {
    try {
      setLoading(true);

      if (!profile?.organization_id) return;

      const { data: reports, error } = await supabase
        .from('regulatory_reports')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .order('due_date', { ascending: false });

      if (error) throw error;

      setReports(reports || []);

      // Calculate statistics
      const today = new Date().toISOString().split('T')[0];
      const pendingCount = reports?.filter(rep => rep.submission_status === 'pending').length || 0;
      const approvedCount = reports?.filter(rep => rep.submission_status === 'approved').length || 0;
      const rejectedCount = reports?.filter(rep => rep.submission_status === 'rejected').length || 0;
      const overdueCount = reports?.filter(rep => 
        rep.submission_status === 'pending' && rep.due_date < today).length || 0;

      setStats({
        totalReports: reports?.length || 0,
        pendingSubmissions: pendingCount,
        approvedReports: approvedCount,
        rejectedReports: rejectedCount,
        overdueReports: overdueCount
      });

    } catch (error) {
      console.error('Error loading regulatory reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const createReport = async () => {
    try {
      if (!profile?.organization_id || !newReport.report_type) return;

      const { error } = await supabase
        .from('regulatory_reports')
        .insert({
          organization_id: profile.organization_id,
          report_type: newReport.report_type,
          report_period: newReport.report_period,
          due_date: newReport.due_date,
          submission_status: 'pending',
          report_data: {}
        });

      if (error) throw error;

      setShowCreateModal(false);
      setNewReport({
        report_type: '',
        report_period: '',
        due_date: ''
      });
      
      await loadRegulatoryReports();
    } catch (error) {
      console.error('Error creating regulatory report:', error);
    }
  };

  const submitReport = async (reportId: string) => {
    try {
      const { error } = await supabase
        .from('regulatory_reports')
        .update({
          submission_status: 'submitted',
          submitted_date: new Date().toISOString()
        })
        .eq('id', reportId);

      if (error) throw error;
      await loadRegulatoryReports();
    } catch (error) {
      console.error('Error submitting report:', error);
    }
  };

  const exportReports = () => {
    const csv = [
      ['Report Type', 'Period', 'Due Date', 'Status', 'Submitted Date'].join(','),
      ...filteredReports.map(report => [
        report.report_type,
        report.report_period,
        report.due_date,
        report.submission_status,
        report.submitted_date || ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `regulatory-reports-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-AE', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { color: string; icon: any }> = {
      approved: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      submitted: { color: 'bg-blue-100 text-blue-800', icon: Upload },
      rejected: { color: 'bg-red-100 text-red-800', icon: AlertTriangle },
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock }
    };
    const badge = badges[status] || badges.pending;
    const Icon = badge.icon;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${badge.color}`}>
        <Icon className="w-3 h-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getAuthorityDisplayName = (reportType: string) => {
    const authorities: Record<string, string> = {
      central_bank: 'UAE Central Bank',
      fta: 'Federal Tax Authority',
      securities_comm: 'Securities & Commodities Authority',
      economic_substance: 'Ministry of Economy',
      aml: 'Financial Intelligence Unit',
      adgm: 'Abu Dhabi Global Market',
      difc: 'Dubai International Financial Centre'
    };
    return authorities[reportType] || reportType.replace('_', ' ').toUpperCase();
  };

  const getPriorityLevel = (dueDate: string, status: string) => {
    if (status === 'approved') return 'low';
    
    const today = new Date();
    const due = new Date(dueDate);
    const daysUntilDue = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilDue < 0) return 'critical'; // Overdue
    if (daysUntilDue <= 7) return 'high';
    if (daysUntilDue <= 30) return 'medium';
    return 'low';
  };

  const getPriorityBadge = (priority: string) => {
    const badges: Record<string, { color: string }> = {
      critical: { color: 'bg-red-500 text-white' },
      high: { color: 'bg-orange-500 text-white' },
      medium: { color: 'bg-yellow-500 text-white' },
      low: { color: 'bg-green-500 text-white' }
    };
    const badge = badges[priority] || badges.medium;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${badge.color}`}>
        {priority.charAt(0).toUpperCase() + priority.slice(1)}
      </span>
    );
  };

  const filteredReports = reports.filter(report => {
    const matchesAuthority = !filterAuthority || report.report_type === filterAuthority;
    const matchesStatus = !filterStatus || report.submission_status === filterStatus;
    const matchesPeriod = !filterPeriod || report.report_period.includes(filterPeriod);
    const matchesSearch = !searchQuery || 
      report.report_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.report_period.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesAuthority && matchesStatus && matchesPeriod && matchesSearch;
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="glass-card p-8">
          <div className="animate-pulse">
            <div className="h-8 bg-neutral-200 rounded w-1/4 mb-4"></div>
            <div className="grid grid-cols-5 gap-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-24 bg-neutral-200 rounded"></div>
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
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900 mb-2">Regulatory Reporting & Compliance</h1>
            <p className="text-neutral-600">Manage regulatory submissions to UAE government authorities and compliance bodies</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={exportReports}
              className="btn-secondary flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export Reports
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn-primary flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              New Report
            </button>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-5 gap-4">
        <div className="glass-card glass-card-hover p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <span className="text-xs text-neutral-500">Total</span>
          </div>
          <div className="space-y-1">
            <h3 className="text-2xl font-bold text-neutral-900">{stats.totalReports}</h3>
            <p className="text-xs text-neutral-600">Regulatory reports</p>
          </div>
        </div>

        <div className="glass-card glass-card-hover p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
            <span className="text-xs text-neutral-500">Pending</span>
          </div>
          <div className="space-y-1">
            <h3 className="text-2xl font-bold text-neutral-900">{stats.pendingSubmissions}</h3>
            <p className="text-xs text-neutral-600">Awaiting submission</p>
          </div>
        </div>

        <div className="glass-card glass-card-hover p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <span className="text-xs text-neutral-500">Approved</span>
          </div>
          <div className="space-y-1">
            <h3 className="text-2xl font-bold text-neutral-900">{stats.approvedReports}</h3>
            <p className="text-xs text-neutral-600">Successfully approved</p>
          </div>
        </div>

        <div className="glass-card glass-card-hover p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-red-100 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <span className="text-xs text-neutral-500">Rejected</span>
          </div>
          <div className="space-y-1">
            <h3 className="text-2xl font-bold text-neutral-900">{stats.rejectedReports}</h3>
            <p className="text-xs text-neutral-600">Rejected submissions</p>
          </div>
        </div>

        <div className="glass-card glass-card-hover p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-orange-100 rounded-lg">
              <Calendar className="w-6 h-6 text-orange-600" />
            </div>
            <span className="text-xs text-neutral-500">Overdue</span>
          </div>
          <div className="space-y-1">
            <h3 className="text-2xl font-bold text-neutral-900">{stats.overdueReports}</h3>
            <p className="text-xs text-neutral-600">Past due date</p>
          </div>
        </div>
      </div>

      {/* Report Templates */}
      <div className="glass-card p-6">
        <h2 className="text-lg font-semibold text-neutral-900 mb-4">UAE Regulatory Report Templates</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {reportTemplates.map((template) => (
            <div key={template.id} className="p-4 bg-white/30 rounded-lg border border-white/20">
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <h4 className="font-medium text-neutral-900 text-sm mb-1">{template.name}</h4>
                  <p className="text-xs text-neutral-600 mb-2">{template.authority}</p>
                  <p className="text-xs text-neutral-500">{template.description}</p>
                </div>
                <div className="ml-2">
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                    {template.frequency}
                  </span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-neutral-500">Next due: {formatDate(template.nextDue)}</span>
                <button className="text-primary-600 hover:text-primary-700 text-xs font-medium">
                  Create Report
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Filters and Search */}
      <div className="glass-card p-6">
        <div className="flex gap-4 items-center flex-wrap">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-neutral-500" />
            <span className="text-sm font-medium text-neutral-700">Filters:</span>
          </div>
          
          <select
            value={filterAuthority}
            onChange={(e) => setFilterAuthority(e.target.value)}
            className="input-glass text-sm"
          >
            <option value="">All Authorities</option>
            {Array.from(new Set(reports.map(rep => rep.report_type))).map(type => (
              <option key={type} value={type}>{getAuthorityDisplayName(type)}</option>
            ))}
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="input-glass text-sm"
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="submitted">Submitted</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>

          <input
            type="text"
            placeholder="Filter by period (e.g., 2024-Q4)"
            value={filterPeriod}
            onChange={(e) => setFilterPeriod(e.target.value)}
            className="input-glass text-sm w-48"
          />

          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              placeholder="Search reports..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-glass text-sm pl-9 w-full"
            />
          </div>
        </div>
      </div>

      {/* Reports Table */}
      <div className="glass-card p-6">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/20">
                <th className="text-left py-3 px-4 font-medium text-neutral-700">Report Type</th>
                <th className="text-left py-3 px-4 font-medium text-neutral-700">Authority</th>
                <th className="text-center py-3 px-4 font-medium text-neutral-700">Period</th>
                <th className="text-center py-3 px-4 font-medium text-neutral-700">Due Date</th>
                <th className="text-center py-3 px-4 font-medium text-neutral-700">Priority</th>
                <th className="text-center py-3 px-4 font-medium text-neutral-700">Status</th>
                <th className="text-center py-3 px-4 font-medium text-neutral-700">Submitted</th>
                <th className="text-center py-3 px-4 font-medium text-neutral-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredReports.length > 0 ? (
                filteredReports.map((report) => (
                  <tr key={report.id} className="border-b border-white/10 hover:bg-white/10">
                    <td className="py-3 px-4">
                      <div className="font-medium text-neutral-900 text-sm">
                        {report.report_type.replace('_', ' ').toUpperCase()}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm">{getAuthorityDisplayName(report.report_type)}</td>
                    <td className="py-3 px-4 text-center text-sm">{report.report_period}</td>
                    <td className="py-3 px-4 text-center text-sm">{formatDate(report.due_date)}</td>
                    <td className="py-3 px-4 text-center">
                      {getPriorityBadge(getPriorityLevel(report.due_date, report.submission_status))}
                    </td>
                    <td className="py-3 px-4 text-center">{getStatusBadge(report.submission_status)}</td>
                    <td className="py-3 px-4 text-center text-sm">
                      {report.submitted_date ? formatDate(report.submitted_date) : '-'}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex justify-center gap-1">
                        <button className="p-1 text-blue-600 hover:bg-blue-100 rounded" title="View Details">
                          <Eye className="w-4 h-4" />
                        </button>
                        {report.submission_status === 'pending' && (
                          <>
                            <button className="p-1 text-green-600 hover:bg-green-100 rounded" title="Edit Report">
                              <Edit className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => submitReport(report.id)}
                              className="p-1 text-primary-600 hover:bg-primary-100 rounded" 
                              title="Submit Report"
                            >
                              <Upload className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-neutral-500">
                    <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>No regulatory reports found</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Report Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="glass-card p-6 w-full max-w-md mx-4">
            <h2 className="text-lg font-semibold text-neutral-900 mb-6">Create New Regulatory Report</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">Report Type</label>
                <select
                  value={newReport.report_type}
                  onChange={(e) => setNewReport({...newReport, report_type: e.target.value})}
                  className="input-glass"
                >
                  <option value="">Select report type</option>
                  <option value="central_bank">Central Bank Report</option>
                  <option value="fta">Federal Tax Authority</option>
                  <option value="securities_comm">Securities Commission</option>
                  <option value="economic_substance">Economic Substance</option>
                  <option value="aml">AML/CFT Report</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">Report Period</label>
                <input
                  type="text"
                  placeholder="e.g., 2024-Q4, 2024"
                  value={newReport.report_period}
                  onChange={(e) => setNewReport({...newReport, report_period: e.target.value})}
                  className="input-glass"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">Due Date</label>
                <input
                  type="date"
                  value={newReport.due_date}
                  onChange={(e) => setNewReport({...newReport, due_date: e.target.value})}
                  className="input-glass"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                onClick={createReport}
                className="btn-primary flex-1"
                disabled={!newReport.report_type || !newReport.due_date}
              >
                Create Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}