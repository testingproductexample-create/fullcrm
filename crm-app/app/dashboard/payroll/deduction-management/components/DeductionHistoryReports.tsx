'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  FileText, 
  Download,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Calendar,
  Filter,
  Search,
  Eye,
  AlertCircle,
  CheckCircle,
  Clock,
  PieChart,
  DollarSign
} from 'lucide-react';
import { DeductionReport } from '../types/deduction.types';

interface DeductionHistoryReportsProps {
  employeeId?: string;
  month?: number;
  year?: number;
}

interface ReportData {
  deductions: Array<{
    id: string;
    employee_name: string;
    category: string;
    amount: number;
    date: string;
    status: string;
    description: string;
  }>;
  summary: {
    total_deductions: number;
    category_breakdown: Record<string, number>;
    status_breakdown: Record<string, number>;
    monthly_trend: Array<{ month: string; total: number }>;
  };
}

export default function DeductionHistoryReports({ employeeId, month, year }: DeductionHistoryReportsProps) {
  const [reports, setReports] = useState<DeductionReport[]>([]);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedReport, setSelectedReport] = useState<string | null>(null);
  const [reportType, setReportType] = useState<'monthly' | 'quarterly' | 'annual' | 'custom'>('monthly');
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    loadReports();
    loadReportData();
  }, [employeeId, month, year, reportType, dateRange]);

  const loadReports = async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('deduction_reports')
        .select('*')
        .order('generated_date', { ascending: false })
        .limit(20);

      if (employeeId) {
        // Filter by employee in report data
        query = query.contains('report_data', { employee_id: employeeId });
      }

      const { data, error: reportsError } = await query;

      if (reportsError) throw reportsError;

      setReports(data || []);
    } catch (error: any) {
      console.error('Error loading reports:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadReportData = async () => {
    try {
      let query = supabase
        .from('deductions')
        .select(`
          *,
          employees:employee_id (
            first_name,
            last_name
          )
        `)
        .order('deduction_date', { ascending: false });

      if (employeeId) {
        query = query.eq('employee_id', employeeId);
      }

      if (month && year) {
        query = query.eq('period_month', month).eq('period_year', year);
      }

      if (reportType !== 'custom') {
        const now = new Date();
        let startDate: Date;

        switch (reportType) {
          case 'monthly':
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            break;
          case 'quarterly':
            startDate = new Date(now.getFullYear(), now.getMonth() - 3, 1);
            break;
          case 'annual':
            startDate = new Date(now.getFullYear(), 0, 1);
            break;
          default:
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        }

        query = query.gte('deduction_date', startDate.toISOString());
      } else {
        query = query
          .gte('deduction_date', dateRange.start)
          .lte('deduction_date', dateRange.end);
      }

      const { data: deductions, error: deductionsError } = await query;

      if (deductionsError) throw deductionsError;

      // Process data for reports
      const processedData = processReportData(deductions || []);
      setReportData(processedData);
    } catch (error: any) {
      console.error('Error loading report data:', error);
      setError(error.message);
    }
  };

  const processReportData = (deductions: any[]): ReportData => {
    // Process deductions for reporting
    const processedDeductions = deductions.map(deduction => ({
      id: deduction.id,
      employee_name: `${deduction.employees?.first_name} ${deduction.employees?.last_name}`,
      category: deduction.deduction_category,
      amount: deduction.amount_aed,
      date: deduction.deduction_date,
      status: deduction.status,
      description: deduction.description
    }));

    // Calculate summaries
    const totalDeductions = deductions.reduce((sum, d) => sum + (d.amount_aed || 0), 0);
    
    const categoryBreakdown: Record<string, number> = {};
    const statusBreakdown: Record<string, number> = {};
    const monthlyTrend: Array<{ month: string; total: number }> = {};

    deductions.forEach(deduction => {
      // Category breakdown
      categoryBreakdown[deduction.deduction_category] = 
        (categoryBreakdown[deduction.deduction_category] || 0) + (deduction.amount_aed || 0);

      // Status breakdown
      statusBreakdown[deduction.status] = (statusBreakdown[deduction.status] || 0) + 1;

      // Monthly trend
      const monthKey = new Date(deduction.deduction_date).toLocaleDateString('en-AE', { 
        year: 'numeric', 
        month: 'short' 
      });
      monthlyTrend[monthKey] = (monthlyTrend[monthKey] || 0) + (deduction.amount_aed || 0);
    });

    return {
      deductions: processedDeductions,
      summary: {
        total_deductions: totalDeductions,
        category_breakdown: categoryBreakdown,
        status_breakdown: statusBreakdown,
        monthly_trend: Object.entries(monthlyTrend).map(([month, total]) => ({ month, total }))
      }
    };
  };

  const generateReport = async () => {
    try {
      setLoading(true);
      
      const reportName = `${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Deduction Report`;
      const now = new Date();
      
      const { data, error } = await supabase
        .from('deduction_reports')
        .insert([{
          report_name: reportName,
          report_type: reportType,
          generated_date: now.toISOString(),
          period_start: reportType === 'custom' ? dateRange.start : new Date(now.getFullYear(), now.getMonth(), 1).toISOString(),
          period_end: now.toISOString(),
          total_deductions_aed: reportData?.summary.total_deductions || 0,
          report_data: reportData,
          generated_by: 'current_user' // Would be actual user ID
        }])
        .select()
        .single();

      if (error) throw error;

      await loadReports();
      setSelectedReport(data.id);
    } catch (error: any) {
      console.error('Error generating report:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const exportReport = (format: 'csv' | 'pdf' | 'excel') => {
    if (!reportData) return;

    // Simple CSV export
    if (format === 'csv') {
      const csvContent = [
        ['Employee Name', 'Category', 'Amount (AED)', 'Date', 'Status', 'Description'],
        ...reportData.deductions.map(d => [
          d.employee_name,
          d.category,
          d.amount.toString(),
          d.date,
          d.status,
          d.description
        ])
      ].map(row => row.join(',')).join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `deductions-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-AE', {
      style: 'currency',
      currency: 'AED',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="glass-card p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gradient-to-r from-purple-200 to-pink-200 rounded mb-4"></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="h-32 bg-gradient-to-r from-purple-100 to-pink-100 rounded"></div>
            <div className="h-32 bg-gradient-to-r from-blue-100 to-purple-100 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-card p-6 border-red-200">
        <div className="flex items-center space-x-3 text-red-600">
          <AlertCircle className="h-5 w-5" />
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Report Controls */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">Deduction History & Reports</h3>
            <p className="text-sm text-gray-600">Comprehensive deduction reporting and analytics</p>
          </div>
          <button
            onClick={generateReport}
            disabled={loading}
            className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-200 disabled:opacity-50"
          >
            <FileText className="h-4 w-4" />
            <span>Generate Report</span>
          </button>
        </div>

        {/* Report Configuration */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Report Type</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
              <option value="annual">Annual</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>
          {reportType === 'custom' && (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>
          )}
        </div>

        {/* Export Options */}
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">Export:</span>
          <button
            onClick={() => exportReport('csv')}
            className="flex items-center space-x-1 px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
          >
            <Download className="h-3 w-3" />
            <span>CSV</span>
          </button>
          <button
            onClick={() => exportReport('pdf')}
            className="flex items-center space-x-1 px-3 py-1 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
          >
            <Download className="h-3 w-3" />
            <span>PDF</span>
          </button>
          <button
            onClick={() => exportReport('excel')}
            className="flex items-center space-x-1 px-3 py-1 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
          >
            <Download className="h-3 w-3" />
            <span>Excel</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      {reportData && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="glass-card p-6 border-gradient-purple-pink">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Deductions</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(reportData.summary.total_deductions)}</p>
                <p className="text-xs text-gray-500 mt-1">{reportData.deductions.length} transactions</p>
              </div>
              <div className="p-3 bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg">
                <TrendingDown className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="glass-card p-6 border-gradient-red-pink">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Tax Deductions</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(reportData.summary.category_breakdown.tax || 0)}
                </p>
                <p className="text-xs text-red-600 mt-1">UAE compliant</p>
              </div>
              <div className="p-3 bg-gradient-to-br from-red-100 to-pink-100 rounded-lg">
                <BarChart3 className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </div>

          <div className="glass-card p-6 border-gradient-blue-purple">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Loan Deductions</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(reportData.summary.category_breakdown.loan || 0)}
                </p>
                <p className="text-xs text-blue-600 mt-1">Active loans</p>
              </div>
              <div className="p-3 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="glass-card p-6 border-gradient-green-blue">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Insurance Deductions</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(reportData.summary.category_breakdown.insurance || 0)}
                </p>
                <p className="text-xs text-green-600 mt-1">Health & life</p>
              </div>
              <div className="p-3 bg-gradient-to-br from-green-100 to-blue-100 rounded-lg">
                <PieChart className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Category Breakdown Chart */}
      {reportData && (
        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-6">Deduction Categories Breakdown</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Object.entries(reportData.summary.category_breakdown).map(([category, amount]) => (
              <div key={category} className="p-4 bg-gradient-to-r from-gray-50 to-purple-50 rounded-lg border border-gray-200">
                <div className="text-center">
                  <p className="text-sm text-gray-600 capitalize">{category}</p>
                  <p className="text-xl font-bold text-gray-900">{formatCurrency(amount)}</p>
                  <p className="text-xs text-gray-500">
                    {((amount / reportData.summary.total_deductions) * 100).toFixed(1)}%
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Status Breakdown */}
      {reportData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Status Distribution</h3>
            <div className="space-y-4">
              {Object.entries(reportData.summary.status_breakdown).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between p-3 bg-gradient-to-r from-gray-50 to-purple-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    {status === 'pending' && <Clock className="h-5 w-5 text-yellow-500" />}
                    {status === 'processed' && <CheckCircle className="h-5 w-5 text-green-500" />}
                    {status === 'cancelled' && <AlertCircle className="h-5 w-5 text-red-500" />}
                    <span className="font-medium text-gray-700 capitalize">{status}</span>
                  </div>
                  <span className="font-semibold text-gray-900">{count}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Activity</h3>
            <div className="space-y-3">
              {reportData.deductions.slice(0, 5).map((deduction) => (
                <div key={deduction.id} className="flex items-center justify-between p-3 bg-gradient-to-r from-gray-50 to-purple-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{deduction.employee_name}</p>
                    <p className="text-xs text-gray-600">{deduction.description}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900 text-sm">{formatCurrency(deduction.amount)}</p>
                    <p className="text-xs text-gray-500">{new Date(deduction.date).toLocaleDateString('en-AE')}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Generated Reports History */}
      <div className="glass-card p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-6">Generated Reports</h3>
        <div className="space-y-4">
          {reports.length > 0 ? (
            reports.map((report) => (
              <div key={report.id} className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-purple-50 rounded-lg border border-gray-200">
                <div className="flex items-center space-x-4">
                  <div className="p-2 bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg">
                    <FileText className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">{report.report_name}</h4>
                    <p className="text-sm text-gray-600">
                      {report.report_type} • {new Date(report.generated_date).toLocaleDateString('en-AE')}
                    </p>
                    <p className="text-xs text-gray-500">
                      Total: {formatCurrency(report.total_deductions_aed)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setSelectedReport(selectedReport === report.id ? null : report.id)}
                    className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-100 rounded-lg transition-colors"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  {report.file_url && (
                    <a
                      href={report.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                    >
                      <Download className="h-4 w-4" />
                    </a>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              <FileText className="h-12 w-12 mx-auto text-gray-300 mb-4" />
              <p>No reports generated yet</p>
              <p className="text-sm">Generate your first deduction report</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}