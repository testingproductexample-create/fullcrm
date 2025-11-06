'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { 
  ArrowLeft,
  Plus,
  Search,
  Download,
  FileText,
  FileSpreadsheet,
  CheckCircle,
  Clock,
  AlertCircle,
  Eye,
  Calendar,
  Filter,
  Edit,
  Trash2
} from 'lucide-react';
import { exportToCSV, exportToJSON, exportToPDF, formatCurrency as exportFormatCurrency, formatDate as exportFormatDate } from '@/lib/exportUtils';

interface InvoiceRecord {
  id: string;
  invoice_number: string;
  customer_id: string;
  customers?: {
    full_name: string;
    email: string;
  };
  order_id?: string;
  issue_date: string;
  due_date: string;
  total_amount_aed: number;
  paid_amount_aed: number;
  balance_due_aed: number;
  status: string;
  created_at: string;
}

export default function InvoicesPage() {
  const { profile } = useAuth();
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [periodFilter, setPeriodFilter] = useState('all');

  useEffect(() => {
    if (profile?.organization_id) {
      loadInvoices();
    }
  }, [profile?.organization_id, statusFilter, periodFilter]);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('invoices')
        .select(`
          *,
          customers (
            full_name,
            email
          )
        `)
        .eq('organization_id', profile?.organization_id)
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      if (periodFilter !== 'all') {
        const now = new Date();
        let startDate: Date;
        
        switch (periodFilter) {
          case 'week':
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
          case 'month':
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            break;
          case 'quarter':
            const quarter = Math.floor(now.getMonth() / 3);
            startDate = new Date(now.getFullYear(), quarter * 3, 1);
            break;
          default:
            startDate = new Date(0);
        }
        
        query = query.gte('issue_date', startDate.toISOString().split('T')[0]);
      }

      const { data, error } = await query;

      if (error) throw error;

      setInvoices(data || []);
    } catch (error) {
      console.error('Error loading invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return `AED ${amount.toLocaleString('en-AE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-AE', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { color: string; icon: any }> = {
      paid: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      partial: { color: 'bg-blue-100 text-blue-800', icon: Clock },
      sent: { color: 'bg-yellow-100 text-yellow-800', icon: Eye },
      viewed: { color: 'bg-purple-100 text-purple-800', icon: Eye },
      draft: { color: 'bg-gray-100 text-gray-800', icon: FileText },
      overdue: { color: 'bg-red-100 text-red-800', icon: AlertCircle },
      cancelled: { color: 'bg-neutral-100 text-neutral-800', icon: AlertCircle },
      void: { color: 'bg-neutral-100 text-neutral-800', icon: AlertCircle }
    };
    const badge = badges[status] || badges.draft;
    const Icon = badge.icon;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-tiny font-medium ${badge.color}`}>
        <Icon className="w-3 h-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const filteredInvoices = invoices.filter(inv => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      inv.invoice_number.toLowerCase().includes(query) ||
      inv.customers?.full_name?.toLowerCase().includes(query) ||
      inv.customers?.email?.toLowerCase().includes(query)
    );
  });

  const totalInvoiced = filteredInvoices.reduce((sum, inv) => sum + Number(inv.total_amount_aed), 0);
  const totalPaid = filteredInvoices.reduce((sum, inv) => sum + Number(inv.paid_amount_aed), 0);
  const totalOutstanding = filteredInvoices.reduce((sum, inv) => sum + Number(inv.balance_due_aed), 0);
  const paidCount = filteredInvoices.filter(inv => inv.status === 'paid').length;

  const handleExport = (format: 'csv' | 'json' | 'pdf' | 'excel') => {
    const exportData = filteredInvoices.map(inv => ({
      'Invoice Number': inv.invoice_number,
      'Customer': inv.customers?.full_name || 'N/A',
      'Email': inv.customers?.email || 'N/A',
      'Issue Date': exportFormatDate(inv.issue_date),
      'Due Date': exportFormatDate(inv.due_date),
      'Total Amount': Number(inv.total_amount_aed).toFixed(2),
      'Paid Amount': Number(inv.paid_amount_aed).toFixed(2),
      'Balance Due': Number(inv.balance_due_aed).toFixed(2),
      'Status': inv.status
    }));

    const timestamp = new Date().toISOString().split('T')[0];

    switch (format) {
      case 'csv':
        exportToCSV(exportData, `invoices_${timestamp}`);
        break;
      case 'json':
        exportToJSON(filteredInvoices, `invoices_${timestamp}`);
        break;
      case 'excel':
        exportToCSV(exportData, `invoices_${timestamp}`);
        break;
      case 'pdf':
        exportToPDF(
          exportData,
          `invoices_${timestamp}`,
          'Invoice Report',
          [
            { header: 'Invoice #', dataKey: 'Invoice Number' },
            { header: 'Customer', dataKey: 'Customer' },
            { header: 'Issue Date', dataKey: 'Issue Date' },
            { header: 'Due Date', dataKey: 'Due Date' },
            { header: 'Total', dataKey: 'Total Amount' },
            { header: 'Paid', dataKey: 'Paid Amount' },
            { header: 'Balance', dataKey: 'Balance Due' },
            { header: 'Status', dataKey: 'Status' }
          ],
          [
            { label: 'Total Invoiced', value: exportFormatCurrency(totalInvoiced) },
            { label: 'Total Collected', value: exportFormatCurrency(totalPaid) },
            { label: 'Total Outstanding', value: exportFormatCurrency(totalOutstanding) },
            { label: 'Paid Invoices', value: `${paidCount} of ${filteredInvoices.length}` }
          ]
        );
        break;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="glass-card p-8">
          <div className="animate-pulse">
            <div className="h-8 bg-neutral-200 rounded w-1/4 mb-4"></div>
            <div className="space-y-3">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-20 bg-neutral-200 rounded"></div>
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
          <Link href="/dashboard/billing" className="p-2 hover:bg-glass-light rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex-1">
            <h1 className="text-h2 font-bold text-neutral-900">Invoice Management</h1>
            <p className="text-body text-neutral-700">
              View, manage, and track all invoices
            </p>
          </div>
          <Link href="/dashboard/billing/create" className="btn-primary flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Create Invoice
          </Link>
          <div className="relative group">
            <button className="btn-secondary flex items-center gap-2">
              <Download className="w-5 h-5" />
              Export
            </button>
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-glass-border opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
              <button
                onClick={() => handleExport('pdf')}
                className="w-full px-4 py-2 text-left hover:bg-glass-light flex items-center gap-2 text-small"
              >
                <FileText className="w-4 h-4" />
                Export as PDF
              </button>
              <button
                onClick={() => handleExport('csv')}
                className="w-full px-4 py-2 text-left hover:bg-glass-light flex items-center gap-2 text-small"
              >
                <FileSpreadsheet className="w-4 h-4" />
                Export as CSV
              </button>
              <button
                onClick={() => handleExport('excel')}
                className="w-full px-4 py-2 text-left hover:bg-glass-light flex items-center gap-2 text-small"
              >
                <FileSpreadsheet className="w-4 h-4" />
                Export as Excel
              </button>
              <button
                onClick={() => handleExport('json')}
                className="w-full px-4 py-2 text-left hover:bg-glass-light flex items-center gap-2 text-small rounded-b-lg"
              >
                <FileText className="w-4 h-4" />
                Export as JSON
              </button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              placeholder="Search by invoice number, customer name, or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-glass-border rounded-lg focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-glass-border rounded-lg focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">All Status</option>
            <option value="draft">Draft</option>
            <option value="sent">Sent</option>
            <option value="viewed">Viewed</option>
            <option value="paid">Paid</option>
            <option value="partial">Partial</option>
            <option value="overdue">Overdue</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <select
            value={periodFilter}
            onChange={(e) => setPeriodFilter(e.target.value)}
            className="px-4 py-2 border border-glass-border rounded-lg focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">All Time</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass-card p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-small text-neutral-700">Total Invoiced</p>
            <FileText className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-h3 font-bold text-neutral-900">{formatCurrency(totalInvoiced)}</p>
          <p className="text-tiny text-neutral-600">{filteredInvoices.length} invoices</p>
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-small text-neutral-700">Total Collected</p>
            <CheckCircle className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-h3 font-bold text-green-600">{formatCurrency(totalPaid)}</p>
          <p className="text-tiny text-neutral-600">{paidCount} paid</p>
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-small text-neutral-700">Outstanding</p>
            <Clock className="w-5 h-5 text-yellow-600" />
          </div>
          <p className="text-h3 font-bold text-yellow-600">{formatCurrency(totalOutstanding)}</p>
          <p className="text-tiny text-neutral-600">Due from customers</p>
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-small text-neutral-700">Collection Rate</p>
            <CheckCircle className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-h3 font-bold text-neutral-900">
            {totalInvoiced > 0 ? ((totalPaid / totalInvoiced) * 100).toFixed(1) : 0}%
          </p>
          <p className="text-tiny text-neutral-600">Payment success</p>
        </div>
      </div>

      {/* Invoices List */}
      <div className="glass-card p-6">
        <h2 className="text-h3 font-bold text-neutral-900 mb-4">
          Invoices ({filteredInvoices.length})
        </h2>
        <div className="space-y-3">
          {filteredInvoices.length === 0 ? (
            <div className="text-center py-12 text-neutral-500">
              <FileText className="w-12 h-12 mx-auto mb-3 text-neutral-300" />
              <p className="text-body">No invoices found</p>
              <Link href="/dashboard/billing/create" className="mt-4 text-primary-600 hover:text-primary-700 inline-block">
                Create your first invoice
              </Link>
            </div>
          ) : (
            filteredInvoices.map((invoice) => (
              <div
                key={invoice.id}
                className="flex items-center justify-between p-4 border border-glass-border rounded-lg hover:bg-glass-light transition-colors"
              >
                <div className="flex items-center gap-4 flex-1">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <FileText className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Link 
                        href={`/dashboard/billing/invoices/${invoice.id}`}
                        className="font-medium text-neutral-900 hover:text-primary-600"
                      >
                        {invoice.invoice_number}
                      </Link>
                      {getStatusBadge(invoice.status)}
                    </div>
                    <div className="flex items-center gap-4 text-tiny text-neutral-600">
                      <span>
                        Customer: {invoice.customers?.full_name || 'N/A'}
                      </span>
                      <span>
                        <Calendar className="w-3 h-3 inline mr-1" />
                        Issue: {formatDate(invoice.issue_date)}
                      </span>
                      <span className={`font-medium ${
                        invoice.status !== 'paid' && new Date(invoice.due_date) < new Date() 
                          ? 'text-red-600' 
                          : 'text-neutral-600'
                      }`}>
                        Due: {formatDate(invoice.due_date)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-neutral-900">{formatCurrency(invoice.total_amount_aed)}</p>
                  {invoice.balance_due_aed > 0 && (
                    <p className="text-tiny text-yellow-600">
                      Balance: {formatCurrency(invoice.balance_due_aed)}
                    </p>
                  )}
                  {invoice.paid_amount_aed > 0 && invoice.balance_due_aed > 0 && (
                    <p className="text-tiny text-green-600">
                      Paid: {formatCurrency(invoice.paid_amount_aed)}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-2">
                    <Link 
                      href={`/dashboard/billing/invoices/${invoice.id}`}
                      className="p-1 hover:bg-neutral-200 rounded"
                    >
                      <Eye className="w-4 h-4 text-neutral-600" />
                    </Link>
                    <button className="p-1 hover:bg-neutral-200 rounded">
                      <Edit className="w-4 h-4 text-neutral-600" />
                    </button>
                    <button className="p-1 hover:bg-red-100 rounded">
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
