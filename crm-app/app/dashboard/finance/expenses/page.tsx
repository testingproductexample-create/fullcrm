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
  TrendingDown,
  Calendar,
  FileText,
  FileSpreadsheet,
  Edit,
  Trash2,
  Upload,
  DollarSign,
  Package
} from 'lucide-react';
import { exportToCSV, exportToJSON, exportToPDF, formatCurrency as exportFormatCurrency, formatDate as exportFormatDate } from '@/lib/exportUtils';

interface ExpenseRecord {
  id: string;
  category: string;
  subcategory: string;
  amount_aed: number;
  description: string;
  expense_date: string;
  vendor_name: string;
  payment_status: string;
  payment_method: string;
  vat_amount_aed: number;
  expense_type: string;
  receipt_url: string;
}

export default function ExpensesPage() {
  const { profile } = useAuth();
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    if (profile?.organization_id) {
      loadExpenses();
    }
  }, [profile?.organization_id, categoryFilter, statusFilter]);

  const loadExpenses = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('expense_tracking')
        .select('*')
        .eq('organization_id', profile?.organization_id)
        .order('expense_date', { ascending: false });

      if (categoryFilter !== 'all') {
        query = query.eq('category', categoryFilter);
      }

      if (statusFilter !== 'all') {
        query = query.eq('payment_status', statusFilter);
      }

      const { data, error } = await query;

      if (error) throw error;

      setExpenses(data || []);
    } catch (error) {
      console.error('Error loading expenses:', error);
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

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      materials: 'bg-purple-100 text-purple-800',
      labor: 'bg-blue-100 text-blue-800',
      utilities: 'bg-yellow-100 text-yellow-800',
      rent: 'bg-red-100 text-red-800',
      marketing: 'bg-green-100 text-green-800',
      equipment: 'bg-indigo-100 text-indigo-800',
      insurance: 'bg-pink-100 text-pink-800',
      maintenance: 'bg-orange-100 text-orange-800'
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  const handleExport = (format: 'csv' | 'json' | 'pdf' | 'excel') => {
    const exportData = filteredExpenses.map(e => ({
      'Date': exportFormatDate(e.expense_date),
      'Category': e.category,
      'Subcategory': e.subcategory || '-',
      'Description': e.description,
      'Vendor': e.vendor_name || '-',
      'Net Amount': (Number(e.amount_aed) - Number(e.vat_amount_aed || 0)).toFixed(2),
      'VAT Amount': Number(e.vat_amount_aed || 0).toFixed(2),
      'Total Amount': Number(e.amount_aed).toFixed(2),
      'Payment Method': e.payment_method || '-',
      'Status': e.payment_status,
      'Type': e.expense_type
    }));

    const timestamp = new Date().toISOString().split('T')[0];

    switch (format) {
      case 'csv':
        exportToCSV(exportData, `expenses_${timestamp}`);
        break;
      case 'json':
        exportToJSON(filteredExpenses, `expenses_${timestamp}`);
        break;
      case 'excel':
        exportToCSV(exportData, `expenses_${timestamp}`);
        break;
      case 'pdf':
        exportToPDF(
          exportData,
          `expenses_${timestamp}`,
          'Expense Report',
          [
            { header: 'Date', dataKey: 'Date' },
            { header: 'Category', dataKey: 'Category' },
            { header: 'Description', dataKey: 'Description' },
            { header: 'Vendor', dataKey: 'Vendor' },
            { header: 'Net Amount', dataKey: 'Net Amount' },
            { header: 'VAT', dataKey: 'VAT Amount' },
            { header: 'Total', dataKey: 'Total Amount' },
            { header: 'Status', dataKey: 'Status' }
          ],
          [
            { label: 'Total Expenses', value: exportFormatCurrency(totalExpenses) },
            { label: 'Total VAT Paid', value: exportFormatCurrency(totalVAT) },
            { label: 'Paid Payments', value: `${paidCount} transactions` },
            { label: 'Pending Payments', value: `${pendingCount} transactions` }
          ]
        );
        break;
    }
  };

  const filteredExpenses = expenses.filter(e => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      e.description.toLowerCase().includes(query) ||
      e.category.toLowerCase().includes(query) ||
      e.vendor_name?.toLowerCase().includes(query)
    );
  });

  const totalExpenses = filteredExpenses.reduce((sum, e) => sum + Number(e.amount_aed), 0);
  const totalVAT = filteredExpenses.reduce((sum, e) => sum + (Number(e.vat_amount_aed) || 0), 0);
  const paidCount = filteredExpenses.filter(e => e.payment_status === 'paid').length;
  const pendingCount = filteredExpenses.filter(e => e.payment_status === 'pending').length;

  // Category breakdown
  const categoryTotals = filteredExpenses.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + Number(e.amount_aed);
    return acc;
  }, {} as Record<string, number>);

  const topCategories = Object.entries(categoryTotals)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

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

  const categories = [
    'materials', 'labor', 'overhead', 'utilities', 'rent', 
    'marketing', 'equipment', 'insurance', 'bank_charges', 
    'professional_services', 'administrative', 'maintenance', 'transportation'
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-4 mb-4">
          <Link href="/dashboard/finance" className="p-2 hover:bg-glass-light rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex-1">
            <h1 className="text-h2 font-bold text-neutral-900">Expense Management</h1>
            <p className="text-body text-neutral-700">
              Track business expenses by UAE categories with VAT
            </p>
          </div>
          <button className="btn-primary flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Add Expense
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              placeholder="Search by description, category, or vendor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-glass-border rounded-lg focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-4 py-2 border border-glass-border rounded-lg focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat} className="capitalize">
                {cat.replace('_', ' ')}
              </option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-glass-border rounded-lg focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">All Status</option>
            <option value="paid">Paid</option>
            <option value="pending">Pending</option>
            <option value="partial">Partial</option>
            <option value="overdue">Overdue</option>
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
            <p className="text-small text-neutral-700">Total Expenses</p>
            <TrendingDown className="w-5 h-5 text-red-600" />
          </div>
          <p className="text-h3 font-bold text-neutral-900">{formatCurrency(totalExpenses)}</p>
          <p className="text-tiny text-neutral-600">{filteredExpenses.length} transactions</p>
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-small text-neutral-700">VAT Paid</p>
            <FileText className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-h3 font-bold text-neutral-900">{formatCurrency(totalVAT)}</p>
          <p className="text-tiny text-neutral-600">Deductible VAT</p>
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-small text-neutral-700">Paid</p>
            <DollarSign className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-h3 font-bold text-neutral-900">{paidCount}</p>
          <p className="text-tiny text-neutral-600">Completed payments</p>
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-small text-neutral-700">Pending</p>
            <Package className="w-5 h-5 text-yellow-600" />
          </div>
          <p className="text-h3 font-bold text-neutral-900">{pendingCount}</p>
          <p className="text-tiny text-neutral-600">Awaiting payment</p>
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="glass-card p-6">
        <h2 className="text-h3 font-bold text-neutral-900 mb-4">Top Expense Categories</h2>
        <div className="space-y-3">
          {topCategories.map(([category, amount]) => {
            const percentage = (amount / totalExpenses) * 100;
            return (
              <div key={category}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-small font-medium text-neutral-900 capitalize">
                    {category.replace('_', ' ')}
                  </span>
                  <span className="text-small font-medium text-neutral-900">
                    {formatCurrency(amount)}
                  </span>
                </div>
                <div className="w-full bg-neutral-200 rounded-full h-2">
                  <div 
                    className="bg-red-500 h-2 rounded-full"
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
                <p className="text-tiny text-neutral-600 mt-1">{percentage.toFixed(1)}% of total</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Expense List */}
      <div className="glass-card p-6">
        <h2 className="text-h3 font-bold text-neutral-900 mb-4">Expense Records</h2>
        <div className="space-y-3">
          {filteredExpenses.length === 0 ? (
            <div className="text-center py-12 text-neutral-500">
              <TrendingDown className="w-12 h-12 mx-auto mb-3 text-neutral-300" />
              <p className="text-body">No expense records found</p>
              <button className="mt-4 text-primary-600 hover:text-primary-700">
                Add your first expense record
              </button>
            </div>
          ) : (
            filteredExpenses.map((expense) => (
              <div
                key={expense.id}
                className="flex items-center justify-between p-4 border border-glass-border rounded-lg hover:bg-glass-light transition-colors"
              >
                <div className="flex items-center gap-4 flex-1">
                  <div className="p-3 bg-red-50 rounded-lg">
                    <TrendingDown className="w-6 h-6 text-red-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-neutral-900">{expense.description}</p>
                      <span className={`px-2 py-0.5 rounded text-tiny font-medium capitalize ${getCategoryColor(expense.category)}`}>
                        {expense.category.replace('_', ' ')}
                      </span>
                      {expense.subcategory && (
                        <span className="text-tiny text-neutral-600">
                          {expense.subcategory}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 mt-1">
                      <span className="text-tiny text-neutral-600">
                        <Calendar className="w-3 h-3 inline mr-1" />
                        {formatDate(expense.expense_date)}
                      </span>
                      {expense.vendor_name && (
                        <span className="text-tiny text-neutral-600">
                          Vendor: {expense.vendor_name}
                        </span>
                      )}
                      <span className={`text-tiny font-medium capitalize ${
                        expense.payment_status === 'paid' ? 'text-green-600' : 
                        expense.payment_status === 'pending' ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {expense.payment_status}
                      </span>
                      {expense.receipt_url && (
                        <a href={expense.receipt_url} target="_blank" rel="noopener noreferrer" className="text-tiny text-primary-600 hover:text-primary-700">
                          <Upload className="w-3 h-3 inline mr-1" />
                          Receipt
                        </a>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-neutral-900">{formatCurrency(expense.amount_aed)}</p>
                  {expense.vat_amount_aed && (
                    <p className="text-tiny text-neutral-600">
                      VAT: {formatCurrency(expense.vat_amount_aed)}
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
