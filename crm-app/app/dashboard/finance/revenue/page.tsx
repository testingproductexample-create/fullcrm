'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { 
  ArrowLeft,
  Plus,
  Search,
  Filter,
  Download,
  TrendingUp,
  CheckCircle,
  Clock,
  XCircle,
  Calendar,
  DollarSign,
  FileText,
  FileSpreadsheet,
  Edit,
  Trash2
} from 'lucide-react';
import { exportToCSV, exportToJSON, exportToPDF, formatCurrency as exportFormatCurrency, formatDate as exportFormatDate } from '@/lib/exportUtils';

interface RevenueRecord {
  id: string;
  transaction_type: string;
  amount_aed: number;
  description: string;
  transaction_date: string;
  payment_status: string;
  payment_method: string;
  vat_amount_aed: number;
  gross_amount_aed: number;
  invoice_number: string;
  customer_id: string;
  customers?: {
    full_name: string;
  };
}

export default function RevenuePage() {
  const { profile } = useAuth();
  const [revenues, setRevenues] = useState<RevenueRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    if (profile?.organization_id) {
      loadRevenues();
    }
  }, [profile?.organization_id, statusFilter, typeFilter]);

  const loadRevenues = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('revenue_tracking')
        .select(`
          *,
          customers (
            full_name
          )
        `)
        .eq('organization_id', profile?.organization_id)
        .order('transaction_date', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('payment_status', statusFilter);
      }

      if (typeFilter !== 'all') {
        query = query.eq('transaction_type', typeFilter);
      }

      const { data, error } = await query;

      if (error) throw error;

      setRevenues(data || []);
    } catch (error) {
      console.error('Error loading revenues:', error);
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
      received: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      partial: { color: 'bg-blue-100 text-blue-800', icon: Clock },
      overdue: { color: 'bg-red-100 text-red-800', icon: XCircle },
      cancelled: { color: 'bg-gray-100 text-gray-800', icon: XCircle }
    };
    const badge = badges[status] || badges.pending;
    const Icon = badge.icon;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-tiny font-medium ${badge.color}`}>
        <Icon className="w-3 h-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const handleExport = (format: 'csv' | 'json' | 'pdf' | 'excel') => {
    const exportData = filteredRevenues.map(r => ({
      'Date': exportFormatDate(r.transaction_date),
      'Invoice Number': r.invoice_number || '-',
      'Type': r.transaction_type,
      'Description': r.description || '-',
      'Customer': r.customers?.full_name || '-',
      'Net Amount': (Number(r.amount_aed) - Number(r.vat_amount_aed || 0)).toFixed(2),
      'VAT Amount': Number(r.vat_amount_aed || 0).toFixed(2),
      'Total Amount': Number(r.amount_aed).toFixed(2),
      'Payment Method': r.payment_method || '-',
      'Status': r.payment_status
    }));

    const timestamp = new Date().toISOString().split('T')[0];

    switch (format) {
      case 'csv':
        exportToCSV(exportData, `revenue_${timestamp}`);
        break;
      case 'json':
        exportToJSON(filteredRevenues, `revenue_${timestamp}`);
        break;
      case 'excel':
        exportToCSV(exportData, `revenue_${timestamp}`);
        break;
      case 'pdf':
        exportToPDF(
          exportData,
          `revenue_${timestamp}`,
          'Revenue Report',
          [
            { header: 'Date', dataKey: 'Date' },
            { header: 'Invoice', dataKey: 'Invoice Number' },
            { header: 'Customer', dataKey: 'Customer' },
            { header: 'Net Amount', dataKey: 'Net Amount' },
            { header: 'VAT', dataKey: 'VAT Amount' },
            { header: 'Total', dataKey: 'Total Amount' },
            { header: 'Status', dataKey: 'Status' }
          ],
          [
            { label: 'Total Revenue', value: exportFormatCurrency(totalRevenue) },
            { label: 'Total VAT', value: exportFormatCurrency(totalVAT) },
            { label: 'Received Payments', value: `${receivedCount} transactions` },
            { label: 'Pending Payments', value: `${pendingCount} transactions` }
          ]
        );
        break;
    }
  };

  const filteredRevenues = revenues.filter(r => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      r.description?.toLowerCase().includes(query) ||
      r.invoice_number?.toLowerCase().includes(query) ||
      r.customers?.full_name?.toLowerCase().includes(query)
    );
  });

  const totalRevenue = filteredRevenues.reduce((sum, r) => sum + Number(r.amount_aed), 0);
  const totalVAT = filteredRevenues.reduce((sum, r) => sum + (Number(r.vat_amount_aed) || 0), 0);
  const receivedCount = filteredRevenues.filter(r => r.payment_status === 'received').length;
  const pendingCount = filteredRevenues.filter(r => r.payment_status === 'pending').length;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="glass-card p-8">
          <div className="animate-pulse">
            <div className="h-8 bg-neutral-200 rounded w-1/4 mb-4"></div>
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
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
          <Link href="/dashboard/finance" className="p-2 hover:bg-glass-light rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex-1">
            <h1 className="text-h2 font-bold text-neutral-900">Revenue Tracking</h1>
            <p className="text-body text-neutral-700">
              Track income, invoices, and payment status
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Add Revenue
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              placeholder="Search by invoice, description, or customer..."
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
            <option value="received">Received</option>
            <option value="pending">Pending</option>
            <option value="partial">Partial</option>
            <option value="overdue">Overdue</option>
          </select>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-4 py-2 border border-glass-border rounded-lg focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">All Types</option>
            <option value="order">Orders</option>
            <option value="appointment">Appointments</option>
            <option value="service">Services</option>
          </select>
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
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass-card p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-small text-neutral-700">Total Revenue</p>
            <TrendingUp className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-h3 font-bold text-neutral-900">{formatCurrency(totalRevenue)}</p>
          <p className="text-tiny text-neutral-600">{filteredRevenues.length} transactions</p>
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-small text-neutral-700">VAT Collected</p>
            <FileText className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-h3 font-bold text-neutral-900">{formatCurrency(totalVAT)}</p>
          <p className="text-tiny text-neutral-600">5% UAE VAT</p>
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-small text-neutral-700">Received</p>
            <CheckCircle className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-h3 font-bold text-neutral-900">{receivedCount}</p>
          <p className="text-tiny text-neutral-600">Completed payments</p>
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-small text-neutral-700">Pending</p>
            <Clock className="w-5 h-5 text-yellow-600" />
          </div>
          <p className="text-h3 font-bold text-neutral-900">{pendingCount}</p>
          <p className="text-tiny text-neutral-600">Awaiting payment</p>
        </div>
      </div>

      {/* Revenue List */}
      <div className="glass-card p-6">
        <h2 className="text-h3 font-bold text-neutral-900 mb-4">Revenue Records</h2>
        <div className="space-y-3">
          {filteredRevenues.length === 0 ? (
            <div className="text-center py-12 text-neutral-500">
              <DollarSign className="w-12 h-12 mx-auto mb-3 text-neutral-300" />
              <p className="text-body">No revenue records found</p>
              <button
                onClick={() => setShowAddModal(true)}
                className="mt-4 text-primary-600 hover:text-primary-700"
              >
                Add your first revenue record
              </button>
            </div>
          ) : (
            filteredRevenues.map((revenue) => (
              <div
                key={revenue.id}
                className="flex items-center justify-between p-4 border border-glass-border rounded-lg hover:bg-glass-light transition-colors"
              >
                <div className="flex items-center gap-4 flex-1">
                  <div className="p-3 bg-green-50 rounded-lg">
                    <DollarSign className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-neutral-900">
                        {revenue.invoice_number || 'No Invoice'}
                      </p>
                      {getStatusBadge(revenue.payment_status)}
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-tiny font-medium capitalize">
                        {revenue.transaction_type}
                      </span>
                    </div>
                    <p className="text-small text-neutral-700">
                      {revenue.description || 'No description'}
                    </p>
                    <div className="flex items-center gap-4 mt-1">
                      <span className="text-tiny text-neutral-600">
                        <Calendar className="w-3 h-3 inline mr-1" />
                        {formatDate(revenue.transaction_date)}
                      </span>
                      {revenue.customers?.full_name && (
                        <span className="text-tiny text-neutral-600">
                          Customer: {revenue.customers.full_name}
                        </span>
                      )}
                      {revenue.payment_method && (
                        <span className="text-tiny text-neutral-600 capitalize">
                          Payment: {revenue.payment_method.replace('_', ' ')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-neutral-900">{formatCurrency(revenue.amount_aed)}</p>
                  {revenue.vat_amount_aed && (
                    <p className="text-tiny text-neutral-600">
                      VAT: {formatCurrency(revenue.vat_amount_aed)}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-2">
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
