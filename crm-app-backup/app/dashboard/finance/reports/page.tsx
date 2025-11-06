'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { 
  ArrowLeft,
  FileText,
  Download,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  BarChart3
} from 'lucide-react';
import { exportFinancialStatementToPDF, formatCurrency, formatDate } from '@/lib/exportUtils';

interface FinancialData {
  revenue: any[];
  expenses: any[];
  budgets: any[];
}

export default function ReportsPage() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<FinancialData>({ revenue: [], expenses: [], budgets: [] });
  const [reportType, setReportType] = useState<'income' | 'cashflow' | 'balance'>('income');
  const [periodFilter, setPeriodFilter] = useState('month');

  useEffect(() => {
    if (profile?.organization_id) {
      loadFinancialData();
    }
  }, [profile?.organization_id, periodFilter]);

  const loadFinancialData = async () => {
    try {
      setLoading(true);
      
      const startDate = getStartDate(periodFilter);
      const endDate = new Date().toISOString();

      const [revenueRes, expensesRes, budgetsRes] = await Promise.all([
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
          .lte('expense_date', endDate),
        supabase
          .from('budgets')
          .select('*')
          .eq('organization_id', profile?.organization_id)
      ]);

      setData({
        revenue: revenueRes.data || [],
        expenses: expensesRes.data || [],
        budgets: budgetsRes.data || []
      });
    } catch (error) {
      console.error('Error loading financial data:', error);
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

  // Calculate Income Statement
  const calculateIncomeStatement = () => {
    const totalRevenue = data.revenue.reduce((sum, r) => sum + Number(r.amount_aed), 0);
    const vatCollected = data.revenue.reduce((sum, r) => sum + Number(r.vat_amount_aed || 0), 0);
    const grossRevenue = totalRevenue - vatCollected;

    const expensesByCategory = data.expenses.reduce((acc, e) => {
      const category = e.category || 'other';
      acc[category] = (acc[category] || 0) + Number(e.amount_aed);
      return acc;
    }, {} as Record<string, number>);

    const costOfGoodsSold = (expensesByCategory.materials || 0) + (expensesByCategory.labor || 0);
    const grossProfit = grossRevenue - costOfGoodsSold;

    const operatingExpenses = Object.entries(expensesByCategory)
      .filter(([cat]) => cat !== 'materials' && cat !== 'labor')
      .reduce((sum, [, amount]) => sum + Number(amount), 0);

    const operatingIncome = grossProfit - operatingExpenses;
    const vatPaid = data.expenses.reduce((sum, e) => sum + Number(e.vat_amount_aed || 0), 0);
    const netIncome = operatingIncome - (vatCollected - vatPaid);

    return {
      totalRevenue,
      vatCollected,
      grossRevenue,
      costOfGoodsSold,
      grossProfit,
      expensesByCategory,
      operatingExpenses,
      operatingIncome,
      vatPaid,
      netIncome
    };
  };

  // Calculate Cash Flow Statement
  const calculateCashFlow = () => {
    const incomeStatement = calculateIncomeStatement();
    
    const cashFromOperations = incomeStatement.netIncome;
    
    const revenueReceived = data.revenue
      .filter(r => r.payment_status === 'received' || r.payment_status === 'completed')
      .reduce((sum, r) => sum + Number(r.amount_aed), 0);
    
    const expensesPaid = data.expenses
      .filter(e => e.payment_status === 'paid')
      .reduce((sum, e) => sum + Number(e.amount_aed), 0);
    
    const cashFromInvesting = 0; // Placeholder for investing activities
    const cashFromFinancing = 0; // Placeholder for financing activities
    
    const netCashFlow = revenueReceived - expensesPaid;
    
    return {
      cashFromOperations,
      revenueReceived,
      expensesPaid,
      cashFromInvesting,
      cashFromFinancing,
      netCashFlow
    };
  };

  // Calculate Balance Sheet Snapshot
  const calculateBalanceSheet = () => {
    const receivables = data.revenue
      .filter(r => r.payment_status === 'pending' || r.payment_status === 'partial')
      .reduce((sum, r) => sum + Number(r.amount_aed), 0);
    
    const payables = data.expenses
      .filter(e => e.payment_status === 'pending' || e.payment_status === 'partial')
      .reduce((sum, e) => sum + Number(e.amount_aed), 0);
    
    const cash = data.revenue
      .filter(r => r.payment_status === 'received' || r.payment_status === 'completed')
      .reduce((sum, r) => sum + Number(r.amount_aed), 0) -
      data.expenses
        .filter(e => e.payment_status === 'paid')
        .reduce((sum, e) => sum + Number(e.amount_aed), 0);
    
    const totalAssets = cash + receivables;
    const totalLiabilities = payables;
    const equity = totalAssets - totalLiabilities;
    
    return {
      cash,
      receivables,
      totalAssets,
      payables,
      totalLiabilities,
      equity
    };
  };

  const exportReport = (type: 'income' | 'cashflow' | 'balance') => {
    const timestamp = new Date().toISOString().split('T')[0];
    const periodLabel = periodFilter.charAt(0).toUpperCase() + periodFilter.slice(1);

    if (type === 'income') {
      const statement = calculateIncomeStatement();
      exportFinancialStatementToPDF(
        `Income Statement - ${periodLabel}`,
        `income_statement_${timestamp}`,
        [
          {
            title: 'Revenue',
            items: [
              { label: 'Total Revenue', amount: statement.totalRevenue, indent: 0 },
              { label: 'Less: VAT Collected', amount: statement.vatCollected, indent: 1 },
              { label: 'Gross Revenue', amount: statement.grossRevenue, isTotal: true, indent: 0 }
            ]
          },
          {
            title: 'Cost of Goods Sold',
            items: [
              { label: 'Materials', amount: statement.expensesByCategory.materials || 0, indent: 1 },
              { label: 'Labor', amount: statement.expensesByCategory.labor || 0, indent: 1 },
              { label: 'Total COGS', amount: statement.costOfGoodsSold, isTotal: true, indent: 0 }
            ]
          },
          {
            title: 'Gross Profit',
            items: [
              { label: 'Gross Profit', amount: statement.grossProfit, isTotal: true, indent: 0 }
            ]
          },
          {
            title: 'Operating Expenses',
            items: [
              ...Object.entries(statement.expensesByCategory)
                .filter(([cat]) => cat !== 'materials' && cat !== 'labor')
                .map(([cat, amount]) => ({
                  label: cat.charAt(0).toUpperCase() + cat.slice(1).replace('_', ' '),
                  amount: amount as number,
                  indent: 1
                })),
              { label: 'Total Operating Expenses', amount: statement.operatingExpenses, isTotal: true, indent: 0 }
            ]
          },
          {
            title: 'Net Income',
            items: [
              { label: 'Operating Income', amount: statement.operatingIncome, indent: 0 },
              { label: 'Net VAT (Collected - Paid)', amount: statement.vatCollected - statement.vatPaid, indent: 1 },
              { label: 'Net Income', amount: statement.netIncome, isTotal: true, indent: 0 }
            ]
          }
        ]
      );
    } else if (type === 'cashflow') {
      const statement = calculateCashFlow();
      exportFinancialStatementToPDF(
        `Cash Flow Statement - ${periodLabel}`,
        `cashflow_statement_${timestamp}`,
        [
          {
            title: 'Operating Activities',
            items: [
              { label: 'Cash Received from Customers', amount: statement.revenueReceived, indent: 1 },
              { label: 'Cash Paid to Suppliers', amount: -statement.expensesPaid, indent: 1 },
              { label: 'Net Cash from Operations', amount: statement.netCashFlow, isTotal: true, indent: 0 }
            ]
          },
          {
            title: 'Investing Activities',
            items: [
              { label: 'Net Cash from Investing', amount: statement.cashFromInvesting, isTotal: true, indent: 0 }
            ]
          },
          {
            title: 'Financing Activities',
            items: [
              { label: 'Net Cash from Financing', amount: statement.cashFromFinancing, isTotal: true, indent: 0 }
            ]
          },
          {
            title: 'Net Change in Cash',
            items: [
              { label: 'Net Increase/(Decrease) in Cash', amount: statement.netCashFlow, isTotal: true, indent: 0 }
            ]
          }
        ]
      );
    } else if (type === 'balance') {
      const statement = calculateBalanceSheet();
      exportFinancialStatementToPDF(
        `Balance Sheet - ${periodLabel}`,
        `balance_sheet_${timestamp}`,
        [
          {
            title: 'Assets',
            items: [
              { label: 'Cash', amount: statement.cash, indent: 1 },
              { label: 'Accounts Receivable', amount: statement.receivables, indent: 1 },
              { label: 'Total Assets', amount: statement.totalAssets, isTotal: true, indent: 0 }
            ]
          },
          {
            title: 'Liabilities',
            items: [
              { label: 'Accounts Payable', amount: statement.payables, indent: 1 },
              { label: 'Total Liabilities', amount: statement.totalLiabilities, isTotal: true, indent: 0 }
            ]
          },
          {
            title: 'Equity',
            items: [
              { label: 'Owner\'s Equity', amount: statement.equity, isTotal: true, indent: 0 }
            ]
          }
        ]
      );
    }
  };

  const renderIncomeStatement = () => {
    const statement = calculateIncomeStatement();
    
    return (
      <div className="space-y-6">
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-h3 font-bold text-neutral-900">Revenue</h3>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-neutral-700">Total Revenue</span>
              <span className="font-semibold">{formatCurrency(statement.totalRevenue)}</span>
            </div>
            <div className="flex justify-between text-small">
              <span className="text-neutral-600 pl-4">Less: VAT Collected</span>
              <span className="text-red-600">({formatCurrency(statement.vatCollected)})</span>
            </div>
            <div className="flex justify-between pt-2 border-t-2 border-neutral-900">
              <span className="font-bold">Gross Revenue</span>
              <span className="font-bold">{formatCurrency(statement.grossRevenue)}</span>
            </div>
          </div>
        </div>

        <div className="glass-card p-6">
          <h3 className="text-h3 font-bold text-neutral-900 mb-4">Cost of Goods Sold</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-small">
              <span className="text-neutral-600 pl-4">Materials</span>
              <span>{formatCurrency(statement.expensesByCategory.materials || 0)}</span>
            </div>
            <div className="flex justify-between text-small">
              <span className="text-neutral-600 pl-4">Labor</span>
              <span>{formatCurrency(statement.expensesByCategory.labor || 0)}</span>
            </div>
            <div className="flex justify-between pt-2 border-t-2 border-neutral-900">
              <span className="font-bold">Total COGS</span>
              <span className="font-bold text-red-600">({formatCurrency(statement.costOfGoodsSold)})</span>
            </div>
          </div>
        </div>

        <div className="glass-card p-6 bg-blue-50">
          <div className="flex justify-between">
            <span className="text-h3 font-bold text-neutral-900">Gross Profit</span>
            <span className="text-h3 font-bold text-blue-600">{formatCurrency(statement.grossProfit)}</span>
          </div>
        </div>

        <div className="glass-card p-6">
          <h3 className="text-h3 font-bold text-neutral-900 mb-4">Operating Expenses</h3>
          <div className="space-y-2">
            {Object.entries(statement.expensesByCategory)
              .filter(([cat]) => cat !== 'materials' && cat !== 'labor')
              .map(([category, amount]) => (
                <div key={category} className="flex justify-between text-small">
                  <span className="text-neutral-600 pl-4 capitalize">{category.replace('_', ' ')}</span>
                  <span>{formatCurrency(Number(amount))}</span>
                </div>
              ))}
            <div className="flex justify-between pt-2 border-t-2 border-neutral-900">
              <span className="font-bold">Total Operating Expenses</span>
              <span className="font-bold text-red-600">({formatCurrency(statement.operatingExpenses)})</span>
            </div>
          </div>
        </div>

        <div className="glass-card p-6">
          <h3 className="text-h3 font-bold text-neutral-900 mb-4">Net Income</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-neutral-700">Operating Income</span>
              <span className="font-semibold">{formatCurrency(statement.operatingIncome)}</span>
            </div>
            <div className="flex justify-between text-small">
              <span className="text-neutral-600 pl-4">Net VAT (Collected - Paid)</span>
              <span className={statement.vatCollected - statement.vatPaid >= 0 ? 'text-red-600' : 'text-green-600'}>
                {statement.vatCollected - statement.vatPaid >= 0 ? '-' : '+'}{formatCurrency(Math.abs(statement.vatCollected - statement.vatPaid))}
              </span>
            </div>
            <div className="flex justify-between pt-2 border-t-2 border-neutral-900">
              <span className="font-bold text-lg">Net Income</span>
              <span className={`font-bold text-lg ${statement.netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(statement.netIncome)}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderCashFlowStatement = () => {
    const statement = calculateCashFlow();
    
    return (
      <div className="space-y-6">
        <div className="glass-card p-6">
          <h3 className="text-h3 font-bold text-neutral-900 mb-4">Operating Activities</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-neutral-700 pl-4">Cash Received from Customers</span>
              <span className="text-green-600">{formatCurrency(statement.revenueReceived)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-700 pl-4">Cash Paid to Suppliers</span>
              <span className="text-red-600">({formatCurrency(statement.expensesPaid)})</span>
            </div>
            <div className="flex justify-between pt-2 border-t-2 border-neutral-900">
              <span className="font-bold">Net Cash from Operations</span>
              <span className={`font-bold ${statement.netCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(statement.netCashFlow)}
              </span>
            </div>
          </div>
        </div>

        <div className="glass-card p-6">
          <h3 className="text-h3 font-bold text-neutral-900 mb-4">Investing Activities</h3>
          <div className="space-y-2">
            <div className="flex justify-between pt-2 border-t-2 border-neutral-900">
              <span className="font-bold">Net Cash from Investing</span>
              <span className="font-bold">{formatCurrency(statement.cashFromInvesting)}</span>
            </div>
          </div>
        </div>

        <div className="glass-card p-6">
          <h3 className="text-h3 font-bold text-neutral-900 mb-4">Financing Activities</h3>
          <div className="space-y-2">
            <div className="flex justify-between pt-2 border-t-2 border-neutral-900">
              <span className="font-bold">Net Cash from Financing</span>
              <span className="font-bold">{formatCurrency(statement.cashFromFinancing)}</span>
            </div>
          </div>
        </div>

        <div className="glass-card p-6 bg-blue-50">
          <div className="flex justify-between">
            <span className="text-h3 font-bold text-neutral-900">Net Change in Cash</span>
            <span className={`text-h3 font-bold ${statement.netCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(statement.netCashFlow)}
            </span>
          </div>
        </div>
      </div>
    );
  };

  const renderBalanceSheet = () => {
    const statement = calculateBalanceSheet();
    
    return (
      <div className="space-y-6">
        <div className="glass-card p-6">
          <h3 className="text-h3 font-bold text-neutral-900 mb-4">Assets</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-small">
              <span className="text-neutral-600 pl-4">Cash</span>
              <span>{formatCurrency(statement.cash)}</span>
            </div>
            <div className="flex justify-between text-small">
              <span className="text-neutral-600 pl-4">Accounts Receivable</span>
              <span>{formatCurrency(statement.receivables)}</span>
            </div>
            <div className="flex justify-between pt-2 border-t-2 border-neutral-900">
              <span className="font-bold">Total Assets</span>
              <span className="font-bold text-blue-600">{formatCurrency(statement.totalAssets)}</span>
            </div>
          </div>
        </div>

        <div className="glass-card p-6">
          <h3 className="text-h3 font-bold text-neutral-900 mb-4">Liabilities</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-small">
              <span className="text-neutral-600 pl-4">Accounts Payable</span>
              <span>{formatCurrency(statement.payables)}</span>
            </div>
            <div className="flex justify-between pt-2 border-t-2 border-neutral-900">
              <span className="font-bold">Total Liabilities</span>
              <span className="font-bold text-red-600">{formatCurrency(statement.totalLiabilities)}</span>
            </div>
          </div>
        </div>

        <div className="glass-card p-6 bg-green-50">
          <div className="flex justify-between">
            <span className="text-h3 font-bold text-neutral-900">Owner's Equity</span>
            <span className="text-h3 font-bold text-green-600">{formatCurrency(statement.equity)}</span>
          </div>
          <p className="text-tiny text-neutral-600 mt-2">Assets - Liabilities = Equity</p>
        </div>
      </div>
    );
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
            <h1 className="text-h2 font-bold text-neutral-900">Financial Reports</h1>
            <p className="text-body text-neutral-700">
              Generate comprehensive financial statements
            </p>
          </div>
          <button 
            onClick={() => exportReport(reportType)}
            className="btn-primary flex items-center gap-2"
          >
            <Download className="w-5 h-5" />
            Export PDF
          </button>
        </div>

        {/* Filters */}
        <div className="flex gap-4">
          <select
            value={reportType}
            onChange={(e) => setReportType(e.target.value as any)}
            className="px-4 py-2 border border-glass-border rounded-lg focus:ring-2 focus:ring-primary-500"
          >
            <option value="income">Income Statement</option>
            <option value="cashflow">Cash Flow Statement</option>
            <option value="balance">Balance Sheet</option>
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

      {/* Report Content */}
      {reportType === 'income' && renderIncomeStatement()}
      {reportType === 'cashflow' && renderCashFlowStatement()}
      {reportType === 'balance' && renderBalanceSheet()}
    </div>
  );
}
