'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { 
  BanknotesIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  ExclamationTriangleIcon,
  CalendarIcon,
  ReceiptRefundIcon,
  ClockIcon,
  ChartPieIcon,
  DocumentTextIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { supabase } from '@/lib/supabase';
import { formatDate, formatCurrency } from '@/lib/utils';
import { FinancialAnalytics } from '@/types/financial';

// Force this page to be dynamic
export const dynamic = 'force-dynamic';

interface DashboardStats {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  vatCollected: number;
  outstandingInvoices: number;
  overdueInvoices: number;
  recentTransactions: Array<{
    id: string;
    type: string;
    description: string;
    amount: number;
    date: string;
    category?: string;
  }>;
  monthlyData: Array<{
    month: string;
    revenue: number;
    expenses: number;
    profit: number;
  }>;
}

export default function FinancialDashboard() {
  const [selectedPeriod, setSelectedPeriod] = useState('30'); // days

  // Fetch financial analytics data
  const { data: stats, isLoading, error } = useQuery({
    queryKey: ['financial-analytics', selectedPeriod],
    queryFn: async (): Promise<DashboardStats> => {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(selectedPeriod));

      // Get revenue from transactions
      const { data: revenueData } = await supabase
        .from('financial_transactions')
        .select('amount_aed')
        .eq('transaction_type', 'revenue')
        .gte('transaction_date', startDate.toISOString().split('T')[0])
        .lte('transaction_date', endDate.toISOString().split('T')[0]);

      // Get expenses from transactions
      const { data: expenseData } = await supabase
        .from('financial_transactions')
        .select('amount_aed')
        .eq('transaction_type', 'expense')
        .gte('transaction_date', startDate.toISOString().split('T')[0])
        .lte('transaction_date', endDate.toISOString().split('T')[0]);

      // Get invoice analytics
      const { data: invoiceData } = await supabase
        .from('invoices')
        .select('total_amount_aed, paid_amount_aed, balance_due_aed, status, vat_amount_aed, due_date')
        .gte('issue_date', startDate.toISOString().split('T')[0]);

      // Get recent transactions
      const { data: recentTransactions } = await supabase
        .from('financial_transactions')
        .select('id, transaction_type, description, amount_aed, transaction_date, transaction_category')
        .order('transaction_date', { ascending: false })
        .limit(10);

      // Calculate metrics
      const totalRevenue = revenueData?.reduce((sum, item) => sum + (item.amount_aed || 0), 0) || 0;
      const totalExpenses = expenseData?.reduce((sum, item) => sum + (item.amount_aed || 0), 0) || 0;
      const netProfit = totalRevenue - totalExpenses;

      const vatCollected = invoiceData?.reduce((sum, invoice) => sum + (invoice.vat_amount_aed || 0), 0) || 0;
      const outstandingInvoices = invoiceData?.reduce((sum, invoice) => sum + (invoice.balance_due_aed || 0), 0) || 0;
      
      const overdueInvoices = invoiceData?.filter(invoice => 
        invoice.status !== 'paid' && 
        new Date(invoice.due_date) < new Date()
      ).reduce((sum, invoice) => sum + (invoice.balance_due_aed || 0), 0) || 0;

      // Generate monthly data for chart (last 6 months)
      const monthlyData = [];
      for (let i = 5; i >= 0; i--) {
        const monthStart = new Date();
        monthStart.setMonth(monthStart.getMonth() - i, 1);
        const monthEnd = new Date(monthStart);
        monthEnd.setMonth(monthEnd.getMonth() + 1, 0);

        const monthRevenue = revenueData?.filter(item => {
          const itemDate = new Date(item.amount_aed);
          return itemDate >= monthStart && itemDate <= monthEnd;
        }).reduce((sum, item) => sum + (item.amount_aed || 0), 0) || 0;

        const monthExpenses = expenseData?.filter(item => {
          const itemDate = new Date(item.amount_aed);
          return itemDate >= monthStart && itemDate <= monthEnd;
        }).reduce((sum, item) => sum + (item.amount_aed || 0), 0) || 0;

        monthlyData.push({
          month: monthStart.toLocaleDateString('en-US', { month: 'short' }),
          revenue: monthRevenue,
          expenses: monthExpenses,
          profit: monthRevenue - monthExpenses,
        });
      }

      return {
        totalRevenue,
        totalExpenses,
        netProfit,
        vatCollected,
        outstandingInvoices,
        overdueInvoices,
        recentTransactions: recentTransactions?.map(t => ({
          id: t.id,
          type: t.transaction_type,
          description: t.description,
          amount: t.amount_aed,
          date: t.transaction_date,
          category: t.transaction_category,
        })) || [],
        monthlyData,
      };
    },
    refetchInterval: 30000, // Update every 30 seconds
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-red-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Error loading financial data</h3>
        <p className="mt-1 text-sm text-gray-500">
          There was a problem loading the financial dashboard.
        </p>
        <div className="mt-6">
          <Button onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  const profitMargin = stats?.totalRevenue ? (stats.netProfit / stats.totalRevenue) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Financial Management</h1>
          <p className="text-gray-600">Monitor revenue, expenses, and financial performance</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="rounded-md border-gray-300 text-sm"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="365">Last year</option>
          </select>
          <Link href="/finance/transactions">
            <Button variant="outline">
              <PlusIcon className="h-4 w-4 mr-2" />
              Add Transaction
            </Button>
          </Link>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="glass">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(stats?.totalRevenue || 0)}
                </div>
                {stats?.totalRevenue && (
                  <div className="flex items-center text-sm text-green-600">
                    <TrendingUpIcon className="h-4 w-4 mr-1" />
                    Revenue stream
                  </div>
                )}
              </div>
              <BanknotesIcon className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-red-600">
                  {formatCurrency(stats?.totalExpenses || 0)}
                </div>
                {stats?.totalExpenses && (
                  <div className="flex items-center text-sm text-red-600">
                    <TrendingDownIcon className="h-4 w-4 mr-1" />
                    Operating costs
                  </div>
                )}
              </div>
              <ReceiptRefundIcon className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Net Profit</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className={`text-2xl font-bold ${(stats?.netProfit || 0) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {formatCurrency(stats?.netProfit || 0)}
                </div>
                <div className="text-sm text-gray-500">
                  Margin: {profitMargin.toFixed(1)}%
                </div>
              </div>
              <ChartBarIcon className={`h-8 w-8 ${(stats?.netProfit || 0) >= 0 ? 'text-emerald-500' : 'text-red-500'}`} />
            </div>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">VAT Collected</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {formatCurrency(stats?.vatCollected || 0)}
                </div>
                <div className="text-sm text-gray-500">
                  UAE VAT (5%)
                </div>
              </div>
              <DocumentTextIcon className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Outstanding & Overdue Invoices */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card className="glass">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Outstanding Invoices</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-yellow-600">
                  {formatCurrency(stats?.outstandingInvoices || 0)}
                </div>
                <div className="text-sm text-gray-500">
                  Pending collection
                </div>
              </div>
              <ClockIcon className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Overdue Invoices</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-red-600">
                  {formatCurrency(stats?.overdueInvoices || 0)}
                </div>
                <div className="text-sm text-gray-500">
                  Requires action
                </div>
              </div>
              <ExclamationTriangleIcon className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="glass">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Link href="/invoices/new">
              <Button variant="outline" className="w-full flex flex-col items-center gap-2 h-auto py-4">
                <DocumentTextIcon className="h-6 w-6" />
                <span>Create Invoice</span>
              </Button>
            </Link>
            <Link href="/finance/transactions">
              <Button variant="outline" className="w-full flex flex-col items-center gap-2 h-auto py-4">
                <BanknotesIcon className="h-6 w-6" />
                <span>Add Transaction</span>
              </Button>
            </Link>
            <Link href="/finance/reports">
              <Button variant="outline" className="w-full flex flex-col items-center gap-2 h-auto py-4">
                <ChartPieIcon className="h-6 w-6" />
                <span>View Reports</span>
              </Button>
            </Link>
            <Link href="/payments">
              <Button variant="outline" className="w-full flex flex-col items-center gap-2 h-auto py-4">
                <CurrencyDollarIcon className="h-6 w-6" />
                <span>Record Payment</span>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Recent Transactions */}
      <Card className="glass">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Transactions</CardTitle>
          <Link href="/finance/transactions">
            <Button variant="outline" size="sm">
              View All
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {stats?.recentTransactions && stats.recentTransactions.length > 0 ? (
            <div className="space-y-4">
              {stats.recentTransactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${transaction.type === 'revenue' ? 'bg-green-100' : 'bg-red-100'}`}>
                      {transaction.type === 'revenue' ? (
                        <TrendingUpIcon className={`h-4 w-4 ${transaction.type === 'revenue' ? 'text-green-600' : 'text-red-600'}`} />
                      ) : (
                        <TrendingDownIcon className={`h-4 w-4 ${transaction.type === 'revenue' ? 'text-green-600' : 'text-red-600'}`} />
                      )}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{transaction.description}</div>
                      <div className="text-sm text-gray-500">
                        {transaction.category} • {formatDate(transaction.date)}
                      </div>
                    </div>
                  </div>
                  <div className={`text-lg font-semibold ${transaction.type === 'revenue' ? 'text-green-600' : 'text-red-600'}`}>
                    {transaction.type === 'revenue' ? '+' : '-'}{formatCurrency(Math.abs(transaction.amount))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <BanknotesIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No transactions yet</h3>
              <p className="mt-1 text-sm text-gray-500">
                Start by recording your first financial transaction.
              </p>
              <div className="mt-6">
                <Link href="/finance/transactions">
                  <Button>
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Add Transaction
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Financial Performance Chart Placeholder */}
      <Card className="glass">
        <CardHeader>
          <CardTitle>Financial Performance (Last 6 Months)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg">
            <div className="text-center">
              <ChartBarIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Chart Placeholder</h3>
              <p className="mt-1 text-sm text-gray-500">
                Financial performance chart will be displayed here
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}