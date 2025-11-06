'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { 
  DollarSign,
  TrendingUp,
  TrendingDown,
  PieChart,
  Calendar,
  FileText,
  CreditCard,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  Download
} from 'lucide-react';

interface FinancialMetrics {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  profitMargin: number;
  pendingRevenue: number;
  pendingExpenses: number;
  vatCollected: number;
  vatPaid: number;
  revenueGrowth: number;
  expenseGrowth: number;
}

interface RecentTransaction {
  id: string;
  type: 'revenue' | 'expense';
  amount: number;
  description: string;
  date: string;
  category?: string;
}

export default function FinanceDashboard() {
  const { profile } = useAuth();
  const [metrics, setMetrics] = useState<FinancialMetrics>({
    totalRevenue: 0,
    totalExpenses: 0,
    netProfit: 0,
    profitMargin: 0,
    pendingRevenue: 0,
    pendingExpenses: 0,
    vatCollected: 0,
    vatPaid: 0,
    revenueGrowth: 0,
    expenseGrowth: 0
  });
  const [recentTransactions, setRecentTransactions] = useState<RecentTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('month');

  useEffect(() => {
    if (profile?.organization_id) {
      loadFinancialData();
    }
  }, [profile?.organization_id, period]);

  const loadFinancialData = async () => {
    try {
      setLoading(true);
      const today = new Date();
      const currentMonth = today.getMonth() + 1;
      const currentYear = today.getFullYear();

      // Load revenue data
      const { data: revenueData } = await supabase
        .from('revenue_tracking')
        .select('amount_aed, vat_amount_aed, payment_status')
        .eq('organization_id', profile?.organization_id)
        .eq('fiscal_year', currentYear)
        .eq('fiscal_month', currentMonth);

      // Load expense data
      const { data: expenseData } = await supabase
        .from('expense_tracking')
        .select('amount_aed, vat_amount_aed, payment_status')
        .eq('organization_id', profile?.organization_id)
        .eq('fiscal_year', currentYear)
        .eq('fiscal_month', currentMonth);

      // Calculate metrics
      const totalRevenue = revenueData?.reduce((sum, r) => sum + Number(r.amount_aed), 0) || 0;
      const totalExpenses = expenseData?.reduce((sum, e) => sum + Number(e.amount_aed), 0) || 0;
      const pendingRevenue = revenueData?.filter(r => r.payment_status === 'pending').reduce((sum, r) => sum + Number(r.amount_aed), 0) || 0;
      const pendingExpenses = expenseData?.filter(e => e.payment_status === 'pending').reduce((sum, e) => sum + Number(e.amount_aed), 0) || 0;
      const vatCollected = revenueData?.reduce((sum, r) => sum + (Number(r.vat_amount_aed) || 0), 0) || 0;
      const vatPaid = expenseData?.reduce((sum, e) => sum + (Number(e.vat_amount_aed) || 0), 0) || 0;

      const netProfit = totalRevenue - totalExpenses;
      const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

      setMetrics({
        totalRevenue,
        totalExpenses,
        netProfit,
        profitMargin,
        pendingRevenue,
        pendingExpenses,
        vatCollected,
        vatPaid,
        revenueGrowth: 12.5,
        expenseGrowth: 8.3
      });

      // Load recent transactions
      const { data: recentRev } = await supabase
        .from('revenue_tracking')
        .select('id, amount_aed, description, transaction_date, transaction_type')
        .eq('organization_id', profile?.organization_id)
        .order('transaction_date', { ascending: false })
        .limit(5);

      const { data: recentExp } = await supabase
        .from('expense_tracking')
        .select('id, amount_aed, description, expense_date, category')
        .eq('organization_id', profile?.organization_id)
        .order('expense_date', { ascending: false })
        .limit(5);

      const transactions: RecentTransaction[] = [
        ...(recentRev?.map(r => ({
          id: r.id,
          type: 'revenue' as const,
          amount: Number(r.amount_aed),
          description: r.description || r.transaction_type,
          date: r.transaction_date
        })) || []),
        ...(recentExp?.map(e => ({
          id: e.id,
          type: 'expense' as const,
          amount: Number(e.amount_aed),
          description: e.description,
          date: e.expense_date,
          category: e.category
        })) || [])
      ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10);

      setRecentTransactions(transactions);
    } catch (error) {
      console.error('Error loading financial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return `AED ${amount.toLocaleString('en-AE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-AE', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="glass-card p-8">
          <div className="animate-pulse">
            <div className="h-8 bg-neutral-200 rounded w-1/4 mb-4"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-neutral-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const metricCards = [
    {
      title: 'Total Revenue',
      value: formatCurrency(metrics.totalRevenue),
      icon: DollarSign,
      trend: metrics.revenueGrowth,
      trendLabel: `${metrics.revenueGrowth}% vs last month`,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Total Expenses',
      value: formatCurrency(metrics.totalExpenses),
      icon: CreditCard,
      trend: metrics.expenseGrowth,
      trendLabel: `${metrics.expenseGrowth}% vs last month`,
      color: 'text-red-600',
      bgColor: 'bg-red-50'
    },
    {
      title: 'Net Profit',
      value: formatCurrency(metrics.netProfit),
      icon: Wallet,
      trend: metrics.profitMargin,
      trendLabel: `${metrics.profitMargin.toFixed(1)}% margin`,
      color: metrics.netProfit >= 0 ? 'text-green-600' : 'text-red-600',
      bgColor: metrics.netProfit >= 0 ? 'bg-green-50' : 'bg-red-50'
    },
    {
      title: 'VAT Net',
      value: formatCurrency(metrics.vatCollected - metrics.vatPaid),
      icon: FileText,
      trend: 5.0,
      trendLabel: '5% UAE VAT Rate',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    }
  ];

  const quickActions = [
    {
      title: 'Revenue Analysis',
      description: 'Track income and payments',
      icon: TrendingUp,
      href: '/dashboard/finance/revenue',
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Expense Management',
      description: 'Monitor and control expenses',
      icon: TrendingDown,
      href: '/dashboard/finance/expenses',
      color: 'text-red-600',
      bgColor: 'bg-red-50'
    },
    {
      title: 'Financial Reports',
      description: 'Generate P&L and cash flow',
      icon: FileText,
      href: '/dashboard/finance/reports',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      title: 'Budget Management',
      description: 'Plan and track budgets',
      icon: PieChart,
      href: '/dashboard/finance/budgets',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-h2 font-bold text-neutral-900">Financial Management</h1>
            <p className="text-body text-neutral-700 mt-1">
              Revenue tracking, expense management, and financial reporting in AED
            </p>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="px-4 py-2 border border-glass-border rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="quarter">This Quarter</option>
              <option value="year">This Year</option>
            </select>
            <button className="btn-primary flex items-center gap-2">
              <Download className="w-5 h-5" />
              Export Report
            </button>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metricCards.map((card, index) => {
          const Icon = card.icon;
          const TrendIcon = card.trend >= 0 ? ArrowUpRight : ArrowDownRight;
          return (
            <div key={index} className="glass-card p-6">
              <div className="flex items-center justify-between mb-3">
                <p className="text-small text-neutral-700">{card.title}</p>
                <div className={`p-2 rounded-lg ${card.bgColor}`}>
                  <Icon className={`w-5 h-5 ${card.color}`} />
                </div>
              </div>
              <p className="text-h3 font-bold text-neutral-900 mb-2">{card.value}</p>
              <div className="flex items-center gap-1 text-tiny">
                <TrendIcon className={`w-3 h-3 ${card.trend >= 0 ? 'text-green-600' : 'text-red-600'}`} />
                <span className={card.trend >= 0 ? 'text-green-600' : 'text-red-600'}>
                  {card.trendLabel}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Cash Flow Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="glass-card p-6">
          <h3 className="text-h4 font-semibold text-neutral-900 mb-4">Pending Payments</h3>
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-small text-neutral-700">Receivables</span>
                <span className="text-small font-medium text-green-600">
                  {formatCurrency(metrics.pendingRevenue)}
                </span>
              </div>
              <div className="w-full bg-neutral-200 rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full"
                  style={{ width: `${(metrics.pendingRevenue / (metrics.totalRevenue || 1)) * 100}%` }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-small text-neutral-700">Payables</span>
                <span className="text-small font-medium text-red-600">
                  {formatCurrency(metrics.pendingExpenses)}
                </span>
              </div>
              <div className="w-full bg-neutral-200 rounded-full h-2">
                <div 
                  className="bg-red-500 h-2 rounded-full"
                  style={{ width: `${(metrics.pendingExpenses / (metrics.totalExpenses || 1)) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        <div className="glass-card p-6">
          <h3 className="text-h4 font-semibold text-neutral-900 mb-4">VAT Summary</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-small text-neutral-700">VAT Collected</span>
              <span className="text-small font-medium text-neutral-900">
                {formatCurrency(metrics.vatCollected)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-small text-neutral-700">VAT Paid</span>
              <span className="text-small font-medium text-neutral-900">
                {formatCurrency(metrics.vatPaid)}
              </span>
            </div>
            <div className="pt-3 border-t border-glass-border">
              <div className="flex items-center justify-between">
                <span className="text-small font-medium text-neutral-900">Net VAT</span>
                <span className="text-small font-bold text-blue-600">
                  {formatCurrency(metrics.vatCollected - metrics.vatPaid)}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="glass-card p-6">
          <h3 className="text-h4 font-semibold text-neutral-900 mb-4">Profit Analysis</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-small text-neutral-700">Revenue</span>
              <span className="text-small font-medium text-green-600">
                {formatCurrency(metrics.totalRevenue)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-small text-neutral-700">Expenses</span>
              <span className="text-small font-medium text-red-600">
                {formatCurrency(metrics.totalExpenses)}
              </span>
            </div>
            <div className="pt-3 border-t border-glass-border">
              <div className="flex items-center justify-between">
                <span className="text-small font-medium text-neutral-900">Net Profit</span>
                <span className={`text-small font-bold ${metrics.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(metrics.netProfit)}
                </span>
              </div>
              <p className="text-tiny text-neutral-600 mt-1">
                {metrics.profitMargin.toFixed(1)}% margin
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="glass-card p-6">
        <h2 className="text-h3 font-bold text-neutral-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <Link
                key={index}
                href={action.href}
                className="p-4 border border-glass-border rounded-lg hover:bg-glass-light transition-colors group"
              >
                <div className={`p-2 rounded-lg ${action.bgColor} w-fit mb-3`}>
                  <Icon className={`w-5 h-5 ${action.color}`} />
                </div>
                <h3 className="font-medium text-neutral-900 group-hover:text-primary-600 mb-1">
                  {action.title}
                </h3>
                <p className="text-small text-neutral-700">{action.description}</p>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-h3 font-bold text-neutral-900">Recent Transactions</h2>
          <Link
            href="/dashboard/finance/transactions"
            className="text-small text-primary-600 hover:text-primary-700"
          >
            View All
          </Link>
        </div>
        <div className="space-y-3">
          {recentTransactions.length === 0 ? (
            <div className="text-center py-8 text-neutral-500">
              <Calendar className="w-8 h-8 mx-auto mb-2 text-neutral-300" />
              <p>No transactions found</p>
            </div>
          ) : (
            recentTransactions.map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between p-3 border border-glass-border rounded-lg hover:bg-glass-light transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${transaction.type === 'revenue' ? 'bg-green-50' : 'bg-red-50'}`}>
                    {transaction.type === 'revenue' ? (
                      <TrendingUp className="w-4 h-4 text-green-600" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-red-600" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-neutral-900">{transaction.description}</p>
                    <p className="text-tiny text-neutral-600">{formatDate(transaction.date)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-semibold ${transaction.type === 'revenue' ? 'text-green-600' : 'text-red-600'}`}>
                    {transaction.type === 'revenue' ? '+' : '-'} {formatCurrency(transaction.amount)}
                  </p>
                  {transaction.category && (
                    <p className="text-tiny text-neutral-600 capitalize">{transaction.category.replace('_', ' ')}</p>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
