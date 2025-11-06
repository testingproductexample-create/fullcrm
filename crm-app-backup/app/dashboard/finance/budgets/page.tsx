'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { 
  ArrowLeft,
  Plus,
  PieChart,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Calendar,
  Edit,
  Trash2,
  Download,
  FileText,
  FileSpreadsheet
} from 'lucide-react';
import { exportToCSV, exportToJSON, exportToPDF, formatCurrency as exportFormatCurrency, formatDate as exportFormatDate } from '@/lib/exportUtils';

interface BudgetRecord {
  id: string;
  budget_name: string;
  budget_period: string;
  start_date: string;
  end_date: string;
  fiscal_year: number;
  category: string;
  subcategory: string;
  budgeted_amount_aed: number;
  actual_amount_aed: number;
  variance_amount_aed: number;
  status: string;
  alert_threshold_percentage: number;
  alert_triggered: boolean;
}

export default function BudgetsPage() {
  const { profile } = useAuth();
  const [budgets, setBudgets] = useState<BudgetRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [periodFilter, setPeriodFilter] = useState('all');

  useEffect(() => {
    if (profile?.organization_id) {
      loadBudgets();
    }
  }, [profile?.organization_id, periodFilter]);

  const loadBudgets = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('budgets')
        .select('*')
        .eq('organization_id', profile?.organization_id)
        .order('start_date', { ascending: false });

      if (periodFilter !== 'all') {
        query = query.eq('budget_period', periodFilter);
      }

      const { data, error } = await query;

      if (error) throw error;

      setBudgets(data || []);
    } catch (error) {
      console.error('Error loading budgets:', error);
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

  const getVarianceColor = (variance: number) => {
    if (variance > 0) return 'text-green-600';
    if (variance < 0) return 'text-red-600';
    return 'text-neutral-600';
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { color: string; icon: any }> = {
      active: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      draft: { color: 'bg-gray-100 text-gray-800', icon: Calendar },
      completed: { color: 'bg-blue-100 text-blue-800', icon: CheckCircle },
      cancelled: { color: 'bg-red-100 text-red-800', icon: AlertTriangle }
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

  const totalBudgeted = budgets.reduce((sum, b) => sum + Number(b.budgeted_amount_aed), 0);
  const totalActual = budgets.reduce((sum, b) => sum + Number(b.actual_amount_aed), 0);
  const totalVariance = totalBudgeted - totalActual;
  const averageUtilization = totalBudgeted > 0 ? (totalActual / totalBudgeted) * 100 : 0;
  const budgetsOnTrack = budgets.filter(b => {
    const utilization = (Number(b.actual_amount_aed) / Number(b.budgeted_amount_aed)) * 100;
    return utilization <= b.alert_threshold_percentage;
  }).length;

  const handleExport = (format: 'csv' | 'json' | 'pdf' | 'excel') => {
    const exportData = budgets.map(b => ({
      'Budget Name': b.budget_name,
      'Period': b.budget_period,
      'Category': b.category,
      'Subcategory': b.subcategory || '-',
      'Start Date': exportFormatDate(b.start_date),
      'End Date': exportFormatDate(b.end_date),
      'Budgeted Amount': b.budgeted_amount_aed,
      'Actual Amount': b.actual_amount_aed,
      'Variance': b.variance_amount_aed,
      'Utilization %': ((b.actual_amount_aed / b.budgeted_amount_aed) * 100).toFixed(2),
      'Status': b.status
    }));

    const timestamp = new Date().toISOString().split('T')[0];

    switch (format) {
      case 'csv':
        exportToCSV(exportData, `budgets_${timestamp}`);
        break;
      case 'json':
        exportToJSON(budgets, `budgets_${timestamp}`);
        break;
      case 'excel':
        exportToCSV(exportData, `budgets_${timestamp}`);
        break;
      case 'pdf':
        exportToPDF(
          exportData,
          `budgets_${timestamp}`,
          'Budget Report',
          [
            { header: 'Budget Name', dataKey: 'Budget Name' },
            { header: 'Period', dataKey: 'Period' },
            { header: 'Category', dataKey: 'Category' },
            { header: 'Budgeted', dataKey: 'Budgeted Amount' },
            { header: 'Actual', dataKey: 'Actual Amount' },
            { header: 'Variance', dataKey: 'Variance' },
            { header: 'Status', dataKey: 'Status' }
          ],
          [
            { label: 'Total Budgeted', value: exportFormatCurrency(totalBudgeted) },
            { label: 'Total Spent', value: exportFormatCurrency(totalActual) },
            { label: 'Variance', value: exportFormatCurrency(totalVariance) },
            { label: 'Average Utilization', value: `${averageUtilization.toFixed(1)}%` }
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
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-32 bg-neutral-200 rounded"></div>
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
            <h1 className="text-h2 font-bold text-neutral-900">Budget Management</h1>
            <p className="text-body text-neutral-700">
              Plan and track budgets across categories
            </p>
          </div>
          <button className="btn-primary flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Create Budget
          </button>
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
        <div className="flex gap-4">
          <select
            value={periodFilter}
            onChange={(e) => setPeriodFilter(e.target.value)}
            className="px-4 py-2 border border-glass-border rounded-lg focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">All Periods</option>
            <option value="monthly">Monthly</option>
            <option value="quarterly">Quarterly</option>
            <option value="annual">Annual</option>
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass-card p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-small text-neutral-700">Total Budgeted</p>
            <PieChart className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-h3 font-bold text-neutral-900">{formatCurrency(totalBudgeted)}</p>
          <p className="text-tiny text-neutral-600">{budgets.length} budgets</p>
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-small text-neutral-700">Total Spent</p>
            <TrendingDown className="w-5 h-5 text-red-600" />
          </div>
          <p className="text-h3 font-bold text-neutral-900">{formatCurrency(totalActual)}</p>
          <p className="text-tiny text-neutral-600">{averageUtilization.toFixed(1)}% utilized</p>
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-small text-neutral-700">Variance</p>
            {totalVariance >= 0 ? (
              <TrendingUp className="w-5 h-5 text-green-600" />
            ) : (
              <TrendingDown className="w-5 h-5 text-red-600" />
            )}
          </div>
          <p className={`text-h3 font-bold ${getVarianceColor(totalVariance)}`}>
            {formatCurrency(Math.abs(totalVariance))}
          </p>
          <p className="text-tiny text-neutral-600">
            {totalVariance >= 0 ? 'Under budget' : 'Over budget'}
          </p>
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-small text-neutral-700">On Track</p>
            <CheckCircle className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-h3 font-bold text-neutral-900">{budgetsOnTrack}</p>
          <p className="text-tiny text-neutral-600">Within threshold</p>
        </div>
      </div>

      {/* Budget List */}
      <div className="glass-card p-6">
        <h2 className="text-h3 font-bold text-neutral-900 mb-4">Budget Overview</h2>
        <div className="space-y-4">
          {budgets.length === 0 ? (
            <div className="text-center py-12 text-neutral-500">
              <PieChart className="w-12 h-12 mx-auto mb-3 text-neutral-300" />
              <p className="text-body">No budgets found</p>
              <button className="mt-4 text-primary-600 hover:text-primary-700">
                Create your first budget
              </button>
            </div>
          ) : (
            budgets.map((budget) => {
              const utilizationPercentage = (Number(budget.actual_amount_aed) / Number(budget.budgeted_amount_aed)) * 100;
              const variance = Number(budget.budgeted_amount_aed) - Number(budget.actual_amount_aed);
              const isOverBudget = variance < 0;
              const isNearThreshold = utilizationPercentage >= budget.alert_threshold_percentage;

              return (
                <div
                  key={budget.id}
                  className={`p-6 border-2 rounded-lg ${isNearThreshold ? 'border-yellow-300 bg-yellow-50/50' : 'border-glass-border'} hover:bg-glass-light transition-colors`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-h4 font-semibold text-neutral-900">
                          {budget.budget_name}
                        </h3>
                        {getStatusBadge(budget.status)}
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-tiny font-medium capitalize">
                          {budget.budget_period}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-tiny text-neutral-600">
                        <span>
                          <Calendar className="w-3 h-3 inline mr-1" />
                          {formatDate(budget.start_date)} - {formatDate(budget.end_date)}
                        </span>
                        <span className="capitalize font-medium">
                          Category: {budget.category.replace('_', ' ')}
                        </span>
                        {budget.subcategory && (
                          <span>Subcategory: {budget.subcategory}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button className="p-2 hover:bg-neutral-200 rounded-lg">
                        <Edit className="w-4 h-4 text-neutral-600" />
                      </button>
                      <button className="p-2 hover:bg-red-100 rounded-lg">
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </button>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-small font-medium text-neutral-700">
                        Budget Utilization
                      </span>
                      <span className={`text-small font-bold ${
                        isOverBudget ? 'text-red-600' : 
                        isNearThreshold ? 'text-yellow-600' : 'text-green-600'
                      }`}>
                        {utilizationPercentage.toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-neutral-200 rounded-full h-3">
                      <div 
                        className={`h-3 rounded-full transition-all ${
                          isOverBudget ? 'bg-red-500' : 
                          isNearThreshold ? 'bg-yellow-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${Math.min(utilizationPercentage, 100)}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Budget Details */}
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-tiny text-neutral-600 mb-1">Budgeted Amount</p>
                      <p className="text-small font-semibold text-neutral-900">
                        {formatCurrency(budget.budgeted_amount_aed)}
                      </p>
                    </div>
                    <div>
                      <p className="text-tiny text-neutral-600 mb-1">Actual Spent</p>
                      <p className="text-small font-semibold text-neutral-900">
                        {formatCurrency(budget.actual_amount_aed)}
                      </p>
                    </div>
                    <div>
                      <p className="text-tiny text-neutral-600 mb-1">Variance</p>
                      <p className={`text-small font-semibold ${getVarianceColor(variance)}`}>
                        {variance >= 0 ? '+' : ''}{formatCurrency(variance)}
                      </p>
                    </div>
                  </div>

                  {/* Alert Message */}
                  {isNearThreshold && (
                    <div className="mt-4 flex items-center gap-2 p-3 bg-yellow-100 border border-yellow-300 rounded-lg">
                      <AlertTriangle className="w-4 h-4 text-yellow-700" />
                      <p className="text-small text-yellow-800">
                        {isOverBudget 
                          ? `Over budget by ${formatCurrency(Math.abs(variance))}`
                          : `Approaching budget limit (${budget.alert_threshold_percentage}% threshold)`
                        }
                      </p>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
