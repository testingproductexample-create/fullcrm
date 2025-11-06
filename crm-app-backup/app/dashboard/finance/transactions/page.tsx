'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { 
  ArrowLeft,
  Download,
  FileText,
  FileSpreadsheet,
  TrendingUp,
  TrendingDown,
  Filter,
  Search,
  Calendar
} from 'lucide-react';
import { exportToCSV, exportToJSON, exportToPDF, formatCurrency, formatDate } from '@/lib/exportUtils';

interface Transaction {
  id: string;
  transaction_date: string;
  transaction_type: 'revenue' | 'expense';
  category: string;
  subcategory?: string;
  description: string;
  amount_aed: number;
  vat_amount_aed: number;
  payment_method: string;
  payment_status: string;
  reference_type?: string;
  reference_id?: string;
}

export default function TransactionsPage() {
  const { profile } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [periodFilter, setPeriodFilter] = useState('month');

  useEffect(() => {
    if (profile?.organization_id) {
      loadTransactions();
    }
  }, [profile?.organization_id, typeFilter, statusFilter, periodFilter]);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      
      const startDate = getStartDate(periodFilter);
      const endDate = new Date().toISOString();

      // Load both revenue and expenses
      const [revenueRes, expensesRes] = await Promise.all([
        supabase
          .from('revenue_tracking')
          .select('*')
          .eq('organization_id', profile?.organization_id)
          .gte('transaction_date', startDate)
          .lte('transaction_date', endDate),
        supabase
          .from('expense_tracking')
          .select('*')
          .eq('organization_id', profile?.organization_id)
          .gte('expense_date', startDate)
          .lte('expense_date', endDate)
      ]);

      // Combine and normalize data
      const revenueTransactions = (revenueRes.data || []).map(r => ({
        id: r.id,
        transaction_date: r.transaction_date,
        transaction_type: 'revenue' as const,
        category: r.revenue_category,
        subcategory: r.revenue_subcategory,
        description: r.description || `${r.revenue_category} - ${r.customer_name || 'Unknown'}`,
        amount_aed: Number(r.amount_aed),
        vat_amount_aed: Number(r.vat_amount_aed || 0),
        payment_method: r.payment_method,
        payment_status: r.payment_status,
        reference_type: r.reference_type,
        reference_id: r.reference_id
      }));

      const expenseTransactions = (expensesRes.data || []).map(e => ({
        id: e.id,
        transaction_date: e.expense_date,
        transaction_type: 'expense' as const,
        category: e.category,
        subcategory: e.subcategory,
        description: e.description || `${e.category} - ${e.vendor_name || 'Unknown'}`,
        amount_aed: Number(e.amount_aed),
        vat_amount_aed: Number(e.vat_amount_aed || 0),
        payment_method: e.payment_method,
        payment_status: e.payment_status,
        reference_type: e.reference_type,
        reference_id: e.reference_id
      }));

      // Combine and sort by date
      const allTransactions = [...revenueTransactions, ...expenseTransactions]
        .sort((a, b) => new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime());

      setTransactions(allTransactions);
    } catch (error) {
      console.error('Error loading transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStartDate = (period: string) => {
    const now = new Date();
    switch (period) {
      case 'week':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      case 'month':
        return new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      case 'quarter':
        const quarter = Math.floor(now.getMonth() / 3);
        return new Date(now.getFullYear(), quarter * 3, 1).toISOString();
      case 'year':
        return new Date(now.getFullYear(), 0, 1).toISOString();
      default:
        return new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    }
  };

  const filteredTransactions = transactions.filter(t => {
    const matchesSearch = t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         t.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || t.transaction_type === typeFilter;
    const matchesStatus = statusFilter === 'all' || t.payment_status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  const totalRevenue = filteredTransactions
    .filter(t => t.transaction_type === 'revenue')
    .reduce((sum, t) => sum + t.amount_aed, 0);

  const totalExpenses = filteredTransactions
    .filter(t => t.transaction_type === 'expense')
    .reduce((sum, t) => sum + t.amount_aed, 0);

  const totalVAT = filteredTransactions.reduce((sum, t) => sum + t.vat_amount_aed, 0);
  const netCashFlow = totalRevenue - totalExpenses;

  const handleExport = (format: 'csv' | 'json' | 'pdf' | 'excel') => {
    const exportData = filteredTransactions.map(t => ({
      'Date': formatDate(t.transaction_date),
      'Type': t.transaction_type.toUpperCase(),
      'Category': t.category,
      'Subcategory': t.subcategory || '-',
      'Description': t.description,
      'Amount (AED)': t.amount_aed.toFixed(2),
      'VAT (AED)': t.vat_amount_aed.toFixed(2),
      'Total (AED)': (t.amount_aed + t.vat_amount_aed).toFixed(2),
      'Payment Method': t.payment_method,
      'Status': t.payment_status,
      'Reference': t.reference_type ? `${t.reference_type}: ${t.reference_id}` : '-'
    }));

    const timestamp = new Date().toISOString().split('T')[0];

    switch (format) {
      case 'csv':
        exportToCSV(exportData, `transactions_${timestamp}`);
        break;
      case 'json':
        exportToJSON(filteredTransactions, `transactions_${timestamp}`);
        break;
      case 'excel':
        exportToCSV(exportData, `transactions_${timestamp}`);
        break;
      case 'pdf':
        exportToPDF(
          exportData,
          `transactions_${timestamp}`,
          'Transaction History',
          [
            { header: 'Date', dataKey: 'Date' },
            { header: 'Type', dataKey: 'Type' },
            { header: 'Category', dataKey: 'Category' },
            { header: 'Description', dataKey: 'Description' },
            { header: 'Amount', dataKey: 'Amount (AED)' },
            { header: 'VAT', dataKey: 'VAT (AED)' },
            { header: 'Status', dataKey: 'Status' }
          ],
          [
            { label: 'Total Revenue', value: formatCurrency(totalRevenue) },
            { label: 'Total Expenses', value: formatCurrency(totalExpenses) },
            { label: 'Net Cash Flow', value: formatCurrency(netCashFlow) },
            { label: 'Total VAT', value: formatCurrency(totalVAT) }
          ]
        );
        break;
    }
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, string> = {
      completed: 'bg-green-100 text-green-800',
      received: 'bg-green-100 text-green-800',
      paid: 'bg-blue-100 text-blue-800',
      pending: 'bg-yellow-100 text-yellow-800',
      partial: 'bg-orange-100 text-orange-800',
      cancelled: 'bg-red-100 text-red-800',
      refunded: 'bg-purple-100 text-purple-800'
    };
    return badges[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="glass-card p-8">
          <div className="animate-pulse">
            <div className="h-8 bg-neutral-200 rounded w-1/4 mb-4"></div>
            <div className="space-y-3">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="h-16 bg-neutral-200 rounded"></div>
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
            <h1 className="text-h2 font-bold text-neutral-900">Transaction History</h1>
            <p className="text-body text-neutral-700">
              Complete record of all financial transactions
            </p>
          </div>
          <div className="relative group">
            <button className="btn-primary flex items-center gap-2">
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
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[250px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
              <input
                type="text"
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-glass-border rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-4 py-2 border border-glass-border rounded-lg focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">All Types</option>
            <option value="revenue">Revenue</option>
            <option value="expense">Expense</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-glass-border rounded-lg focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">All Status</option>
            <option value="completed">Completed</option>
            <option value="received">Received</option>
            <option value="paid">Paid</option>
            <option value="pending">Pending</option>
            <option value="partial">Partial</option>
          </select>
          <select
            value={periodFilter}
            onChange={(e) => setPeriodFilter(e.target.value)}
            className="px-4 py-2 border border-glass-border rounded-lg focus:ring-2 focus:ring-primary-500"
          >
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
            <option value="year">This Year</option>
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass-card p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-small text-neutral-700">Total Revenue</p>
            <TrendingUp className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-h3 font-bold text-green-600">{formatCurrency(totalRevenue)}</p>
          <p className="text-tiny text-neutral-600">
            {filteredTransactions.filter(t => t.transaction_type === 'revenue').length} transactions
          </p>
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-small text-neutral-700">Total Expenses</p>
            <TrendingDown className="w-5 h-5 text-red-600" />
          </div>
          <p className="text-h3 font-bold text-red-600">{formatCurrency(totalExpenses)}</p>
          <p className="text-tiny text-neutral-600">
            {filteredTransactions.filter(t => t.transaction_type === 'expense').length} transactions
          </p>
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-small text-neutral-700">Net Cash Flow</p>
            {netCashFlow >= 0 ? (
              <TrendingUp className="w-5 h-5 text-green-600" />
            ) : (
              <TrendingDown className="w-5 h-5 text-red-600" />
            )}
          </div>
          <p className={`text-h3 font-bold ${netCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatCurrency(netCashFlow)}
          </p>
          <p className="text-tiny text-neutral-600">Revenue - Expenses</p>
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-small text-neutral-700">Total VAT</p>
            <FileText className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-h3 font-bold text-blue-600">{formatCurrency(totalVAT)}</p>
          <p className="text-tiny text-neutral-600">5% UAE VAT</p>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="glass-card p-6">
        <h2 className="text-h3 font-bold text-neutral-900 mb-4">
          Transactions ({filteredTransactions.length})
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-glass-border">
                <th className="text-left py-3 px-4 text-small font-semibold text-neutral-700">Date</th>
                <th className="text-left py-3 px-4 text-small font-semibold text-neutral-700">Type</th>
                <th className="text-left py-3 px-4 text-small font-semibold text-neutral-700">Category</th>
                <th className="text-left py-3 px-4 text-small font-semibold text-neutral-700">Description</th>
                <th className="text-right py-3 px-4 text-small font-semibold text-neutral-700">Amount</th>
                <th className="text-right py-3 px-4 text-small font-semibold text-neutral-700">VAT</th>
                <th className="text-left py-3 px-4 text-small font-semibold text-neutral-700">Method</th>
                <th className="text-left py-3 px-4 text-small font-semibold text-neutral-700">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12">
                    <Filter className="w-12 h-12 mx-auto mb-3 text-neutral-300" />
                    <p className="text-body text-neutral-500">No transactions found</p>
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((transaction) => (
                  <tr key={transaction.id} className="border-b border-glass-border hover:bg-glass-light transition-colors">
                    <td className="py-3 px-4 text-small">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-neutral-400" />
                        {formatDate(transaction.transaction_date)}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        {transaction.transaction_type === 'revenue' ? (
                          <TrendingUp className="w-4 h-4 text-green-600" />
                        ) : (
                          <TrendingDown className="w-4 h-4 text-red-600" />
                        )}
                        <span className={`text-small font-medium capitalize ${
                          transaction.transaction_type === 'revenue' ? 'text-green-700' : 'text-red-700'
                        }`}>
                          {transaction.transaction_type}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-small capitalize">
                      {transaction.category.replace('_', ' ')}
                      {transaction.subcategory && (
                        <span className="text-neutral-500 text-tiny block">
                          {transaction.subcategory}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-small max-w-xs truncate" title={transaction.description}>
                      {transaction.description}
                    </td>
                    <td className={`py-3 px-4 text-small font-semibold text-right ${
                      transaction.transaction_type === 'revenue' ? 'text-green-700' : 'text-red-700'
                    }`}>
                      {transaction.transaction_type === 'revenue' ? '+' : '-'}{formatCurrency(transaction.amount_aed)}
                    </td>
                    <td className="py-3 px-4 text-small text-right text-neutral-600">
                      {formatCurrency(transaction.vat_amount_aed)}
                    </td>
                    <td className="py-3 px-4 text-small capitalize">
                      {transaction.payment_method.replace('_', ' ')}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex px-2 py-1 rounded-full text-tiny font-medium capitalize ${getStatusBadge(transaction.payment_status)}`}>
                        {transaction.payment_status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
