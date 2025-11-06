'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { 
  DollarSign,
  FileText,
  Download,
  Upload,
  CalendarDays,
  CheckCircle,
  Clock,
  AlertTriangle,
  TrendingUp,
  Calculator,
  Plus,
  Filter,
  Search,
  Eye,
  Edit,
  Trash2
} from 'lucide-react';
import type { VATReport } from '@/types/database';

interface VATSummary {
  totalSales: number;
  totalVATCollected: number;
  totalPurchases: number;
  totalVATPaid: number;
  netVATDue: number;
  pendingReports: number;
}

export default function VATManagementPage() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [vatReports, setVATReports] = useState<VATReport[]>([]);
  const [summary, setSummary] = useState<VATSummary>({
    totalSales: 0,
    totalVATCollected: 0,
    totalPurchases: 0,
    totalVATPaid: 0,
    netVATDue: 0,
    pendingReports: 0
  });
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterPeriod, setFilterPeriod] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newReport, setNewReport] = useState({
    report_period: '',
    total_sales_aed: '',
    total_purchases_aed: '',
    due_date: ''
  });

  useEffect(() => {
    if (profile?.organization_id) {
      loadVATReports();
    }
  }, [profile]);

  const loadVATReports = async () => {
    try {
      setLoading(true);

      if (!profile?.organization_id) return;

      const { data: vatReports, error } = await supabase
        .from('vat_reports')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setVATReports(vatReports || []);

      // Calculate summary
      const totalSales = vatReports?.reduce((sum, report) => sum + report.total_sales_aed, 0) || 0;
      const totalVATCollected = vatReports?.reduce((sum, report) => sum + report.total_vat_collected_aed, 0) || 0;
      const totalPurchases = vatReports?.reduce((sum, report) => sum + report.total_purchases_aed, 0) || 0;
      const totalVATPaid = vatReports?.reduce((sum, report) => sum + report.total_vat_paid_aed, 0) || 0;
      const netVATDue = vatReports?.reduce((sum, report) => sum + report.net_vat_due_aed, 0) || 0;
      const pendingReports = vatReports?.filter(report => ['draft', 'submitted'].includes(report.submission_status)).length || 0;

      setSummary({
        totalSales,
        totalVATCollected,
        totalPurchases,
        totalVATPaid,
        netVATDue,
        pendingReports
      });

    } catch (error) {
      console.error('Error loading VAT reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const createVATReport = async () => {
    try {
      if (!profile?.organization_id || !newReport.report_period) return;

      // Calculate VAT amounts (5% standard rate)
      const salesAmount = parseFloat(newReport.total_sales_aed) || 0;
      const purchasesAmount = parseFloat(newReport.total_purchases_aed) || 0;
      const vatCollected = salesAmount * 0.05;
      const vatPaid = purchasesAmount * 0.05;
      const netVATDue = vatCollected - vatPaid;

      const { error } = await supabase
        .from('vat_reports')
        .insert({
          organization_id: profile.organization_id,
          report_period: newReport.report_period,
          total_sales_aed: salesAmount,
          total_vat_collected_aed: vatCollected,
          total_purchases_aed: purchasesAmount,
          total_vat_paid_aed: vatPaid,
          net_vat_due_aed: netVATDue,
          due_date: newReport.due_date,
          submission_status: 'draft'
        });

      if (error) throw error;

      setShowCreateModal(false);
      setNewReport({
        report_period: '',
        total_sales_aed: '',
        total_purchases_aed: '',
        due_date: ''
      });
      
      await loadVATReports();
    } catch (error) {
      console.error('Error creating VAT report:', error);
    }
  };

  const submitVATReport = async (reportId: string) => {
    try {
      const { error } = await supabase
        .from('vat_reports')
        .update({
          submission_status: 'submitted',
          submission_date: new Date().toISOString()
        })
        .eq('id', reportId);

      if (error) throw error;
      await loadVATReports();
    } catch (error) {
      console.error('Error submitting VAT report:', error);
    }
  };

  const deleteVATReport = async (reportId: string) => {
    try {
      const { error } = await supabase
        .from('vat_reports')
        .delete()
        .eq('id', reportId);

      if (error) throw error;
      await loadVATReports();
    } catch (error) {
      console.error('Error deleting VAT report:', error);
    }
  };

  const exportVATReports = () => {
    const csv = [
      ['Report Period', 'Total Sales (AED)', 'VAT Collected (AED)', 'Total Purchases (AED)', 'VAT Paid (AED)', 'Net VAT Due (AED)', 'Status', 'Due Date', 'Submission Date'].join(','),
      ...filteredReports.map(report => [
        report.report_period,
        report.total_sales_aed,
        report.total_vat_collected_aed,
        report.total_purchases_aed,
        report.total_vat_paid_aed,
        report.net_vat_due_aed,
        report.submission_status,
        report.due_date,
        report.submission_date || ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vat-reports-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const formatCurrency = (amount: number) => {
    return `AED ${amount.toLocaleString('en-AE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-AE', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { color: string; icon: any }> = {
      approved: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      submitted: { color: 'bg-blue-100 text-blue-800', icon: Clock },
      rejected: { color: 'bg-red-100 text-red-800', icon: AlertTriangle },
      draft: { color: 'bg-gray-100 text-gray-800', icon: FileText }
    };
    const badge = badges[status] || badges.draft;
    const Icon = badge.icon;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${badge.color}`}>
        <Icon className="w-3 h-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const filteredReports = vatReports.filter(report => {
    const matchesStatus = !filterStatus || report.submission_status === filterStatus;
    const matchesPeriod = !filterPeriod || report.report_period.includes(filterPeriod);
    const matchesSearch = !searchQuery || report.report_period.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesPeriod && matchesSearch;
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="glass-card p-8">
          <div className="animate-pulse">
            <div className="h-8 bg-neutral-200 rounded w-1/4 mb-4"></div>
            <div className="grid grid-cols-6 gap-4">
              {[...Array(6)].map((_, i) => (
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
            <h1 className="text-2xl font-bold text-neutral-900 mb-2">VAT Management</h1>
            <p className="text-neutral-600">UAE Federal Tax Authority (FTA) VAT reporting and compliance</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={exportVATReports}
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
              Create VAT Report
            </button>
          </div>
        </div>
      </div>

      {/* VAT Summary Cards */}
      <div className="grid grid-cols-6 gap-4">
        <div className="glass-card glass-card-hover p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
            <span className="text-xs text-neutral-500">Total Sales</span>
          </div>
          <div className="space-y-1">
            <h3 className="text-xl font-bold text-neutral-900">{formatCurrency(summary.totalSales)}</h3>
            <p className="text-xs text-neutral-600">Taxable sales revenue</p>
          </div>
        </div>

        <div className="glass-card glass-card-hover p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
            <span className="text-xs text-neutral-500">VAT Collected</span>
          </div>
          <div className="space-y-1">
            <h3 className="text-xl font-bold text-neutral-900">{formatCurrency(summary.totalVATCollected)}</h3>
            <p className="text-xs text-neutral-600">VAT on sales (5%)</p>
          </div>
        </div>

        <div className="glass-card glass-card-hover p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
            <span className="text-xs text-neutral-500">Purchases</span>
          </div>
          <div className="space-y-1">
            <h3 className="text-xl font-bold text-neutral-900">{formatCurrency(summary.totalPurchases)}</h3>
            <p className="text-xs text-neutral-600">Taxable purchases</p>
          </div>
        </div>

        <div className="glass-card glass-card-hover p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-orange-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-orange-600" />
            </div>
            <span className="text-xs text-neutral-500">VAT Paid</span>
          </div>
          <div className="space-y-1">
            <h3 className="text-xl font-bold text-neutral-900">{formatCurrency(summary.totalVATPaid)}</h3>
            <p className="text-xs text-neutral-600">VAT on purchases</p>
          </div>
        </div>

        <div className="glass-card glass-card-hover p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-red-100 rounded-lg">
              <Calculator className="w-6 h-6 text-red-600" />
            </div>
            <span className="text-xs text-neutral-500">Net VAT Due</span>
          </div>
          <div className="space-y-1">
            <h3 className="text-xl font-bold text-neutral-900">{formatCurrency(summary.netVATDue)}</h3>
            <p className="text-xs text-neutral-600">Amount due to FTA</p>
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
            <h3 className="text-xl font-bold text-neutral-900">{summary.pendingReports}</h3>
            <p className="text-xs text-neutral-600">Pending submissions</p>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="glass-card p-6">
        <div className="flex gap-4 items-center">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-neutral-500" />
            <span className="text-sm font-medium text-neutral-700">Filters:</span>
          </div>
          
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="input-glass text-sm"
          >
            <option value="">All Status</option>
            <option value="draft">Draft</option>
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

          <div className="relative flex-1">
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

      {/* VAT Reports Table */}
      <div className="glass-card p-6">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/20">
                <th className="text-left py-3 px-4 font-medium text-neutral-700">Period</th>
                <th className="text-right py-3 px-4 font-medium text-neutral-700">Sales (AED)</th>
                <th className="text-right py-3 px-4 font-medium text-neutral-700">VAT Collected</th>
                <th className="text-right py-3 px-4 font-medium text-neutral-700">Purchases</th>
                <th className="text-right py-3 px-4 font-medium text-neutral-700">VAT Paid</th>
                <th className="text-right py-3 px-4 font-medium text-neutral-700">Net VAT Due</th>
                <th className="text-center py-3 px-4 font-medium text-neutral-700">Status</th>
                <th className="text-center py-3 px-4 font-medium text-neutral-700">Due Date</th>
                <th className="text-center py-3 px-4 font-medium text-neutral-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredReports.length > 0 ? (
                filteredReports.map((report) => (
                  <tr key={report.id} className="border-b border-white/10 hover:bg-white/10">
                    <td className="py-3 px-4">
                      <div className="font-medium text-neutral-900">{report.report_period}</div>
                      {report.submission_date && (
                        <div className="text-xs text-neutral-500">
                          Submitted {formatDate(report.submission_date)}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-medium">{formatCurrency(report.total_sales_aed)}</td>
                    <td className="py-3 px-4 text-right text-green-600">{formatCurrency(report.total_vat_collected_aed)}</td>
                    <td className="py-3 px-4 text-right">{formatCurrency(report.total_purchases_aed)}</td>
                    <td className="py-3 px-4 text-right text-orange-600">{formatCurrency(report.total_vat_paid_aed)}</td>
                    <td className="py-3 px-4 text-right font-semibold text-blue-600">{formatCurrency(report.net_vat_due_aed)}</td>
                    <td className="py-3 px-4 text-center">{getStatusBadge(report.submission_status)}</td>
                    <td className="py-3 px-4 text-center text-sm">{formatDate(report.due_date)}</td>
                    <td className="py-3 px-4">
                      <div className="flex justify-center gap-1">
                        {report.submission_status === 'draft' && (
                          <>
                            <button
                              onClick={() => submitVATReport(report.id)}
                              className="p-1 text-green-600 hover:bg-green-100 rounded"
                              title="Submit to FTA"
                            >
                              <Upload className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => deleteVATReport(report.id)}
                              className="p-1 text-red-600 hover:bg-red-100 rounded"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        <button className="p-1 text-blue-600 hover:bg-blue-100 rounded" title="View Details">
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-neutral-500">
                    <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>No VAT reports found</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create VAT Report Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="glass-card p-6 w-full max-w-md mx-4">
            <h2 className="text-lg font-semibold text-neutral-900 mb-6">Create New VAT Report</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">Report Period</label>
                <input
                  type="text"
                  placeholder="e.g., 2024-Q4, 2024-12"
                  value={newReport.report_period}
                  onChange={(e) => setNewReport({...newReport, report_period: e.target.value})}
                  className="input-glass"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">Total Sales (AED)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={newReport.total_sales_aed}
                  onChange={(e) => setNewReport({...newReport, total_sales_aed: e.target.value})}
                  className="input-glass"
                />
                <p className="text-xs text-neutral-500 mt-1">VAT will be calculated at 5%</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">Total Purchases (AED)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={newReport.total_purchases_aed}
                  onChange={(e) => setNewReport({...newReport, total_purchases_aed: e.target.value})}
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
                onClick={createVATReport}
                className="btn-primary flex-1"
                disabled={!newReport.report_period || !newReport.due_date}
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