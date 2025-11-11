'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  DocumentTextIcon,
  ChartBarIcon,
  DocumentArrowDownIcon,
  CalendarIcon,
  BanknotesIcon,
  ReceiptRefundIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { supabase } from '@/lib/supabase/client';
import { formatDate, formatCurrency } from '@/lib/utils';
import { FinancialTransaction, UAE_EXPENSE_CATEGORY_LABELS } from '@/types/financial';

// Force this page to be dynamic
export const dynamic = 'force-dynamic';

interface FinancialReportData {
  incomeStatement: {
    totalRevenue: number;
    totalExpenses: number;
    grossProfit: number;
    netProfit: number;
    expensesByCategory: { category: string; amount: number }[];
  };
  cashFlow: {
    operatingCashFlow: number;
    investingCashFlow: number;
    financingCashFlow: number;
    netCashFlow: number;
  };
  vatReport: {
    vatCollected: number;
    vatPaid: number;
    netVatPayable: number;
  };
}

export default function FinancialReportsPage() {
  const [reportType, setReportType] = useState<string>('income-statement');
  const [reportPeriod, setReportPeriod] = useState<string>('current-month');

  // Get date range based on selected period
  const getDateRange = () => {
    const today = new Date();
    let startDate: Date;
    let endDate = new Date(today);

    switch (reportPeriod) {
      case 'current-month':
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        break;
      case 'last-month':
        startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        endDate = new Date(today.getFullYear(), today.getMonth(), 0);
        break;
      case 'current-quarter':
        const currentQuarter = Math.floor(today.getMonth() / 3);
        startDate = new Date(today.getFullYear(), currentQuarter * 3, 1);
        break;
      case 'current-year':
        startDate = new Date(today.getFullYear(), 0, 1);
        break;
      case 'last-year':
        startDate = new Date(today.getFullYear() - 1, 0, 1);
        endDate = new Date(today.getFullYear() - 1, 11, 31);
        break;
      default:
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
    }

    return { startDate, endDate };
  };

  // Fetch financial report data
  const { data: reportData, isLoading, error } = useQuery({
    queryKey: ['financial-reports', reportType, reportPeriod],
    queryFn: async (): Promise<FinancialReportData> => {
      const { startDate, endDate } = getDateRange();

      // Get transactions for the period
      const { data: transactions } = await supabase
        .from('financial_transactions')
        .select('*')
        .gte('transaction_date', startDate.toISOString().split('T')[0])
        .lte('transaction_date', endDate.toISOString().split('T')[0]);

      // Get invoices for VAT calculation
      const { data: invoices } = await supabase
        .from('invoices')
        .select('vat_amount_aed, total_amount_aed')
        .gte('issue_date', startDate.toISOString().split('T')[0])
        .lte('issue_date', endDate.toISOString().split('T')[0]);

      if (!transactions) throw new Error('Failed to fetch transactions');

      // Calculate income statement
      const revenue = transactions.filter(t => t.transaction_type === 'revenue').reduce((sum, t) => sum + (t.amount_aed || 0), 0);
      const expenses = transactions.filter(t => t.transaction_type === 'expense').reduce((sum, t) => sum + (t.amount_aed || 0), 0);

      // Group expenses by category
      const expensesByCategory = transactions
        .filter(t => t.transaction_type === 'expense')
        .reduce((acc, t) => {
          const category = t.transaction_category || 'other';
          acc[category] = (acc[category] || 0) + (t.amount_aed || 0);
          return acc;
        }, {} as Record<string, number>);

      const expensesCategorized = Object.entries(expensesByCategory).map(([category, amount]) => ({
        category: UAE_EXPENSE_CATEGORY_LABELS[category as keyof typeof UAE_EXPENSE_CATEGORY_LABELS] || category,
        amount,
      }));

      // Calculate VAT
      const vatCollected = invoices?.reduce((sum, inv) => sum + (inv.vat_amount_aed || 0), 0) || 0;
      const vatPaid = expenses * 0.05; // Estimated VAT on expenses

      return {
        incomeStatement: {
          totalRevenue: revenue,
          totalExpenses: expenses,
          grossProfit: revenue,
          netProfit: revenue - expenses,
          expensesByCategory: expensesCategorized,
        },
        cashFlow: {
          operatingCashFlow: revenue - expenses,
          investingCashFlow: 0,
          financingCashFlow: 0,
          netCashFlow: revenue - expenses,
        },
        vatReport: {
          vatCollected,
          vatPaid,
          netVatPayable: vatCollected - vatPaid,
        },
      };
    },
    refetchInterval: 60000,
  });

  const handleExportReport = () => {
    // Export functionality would be implemented here
    console.log('Exporting report:', reportType, reportPeriod);
  };

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
        <h3 className="mt-2 text-sm font-medium text-gray-900">Error loading reports</h3>
        <p className="mt-1 text-sm text-gray-500">
          There was a problem loading the financial reports.
        </p>
        <div className="mt-6">
          <Button onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  const renderIncomeStatement = () => (
    <div className="space-y-6">
      {/* Revenue Section */}
      <Card className="glass">
        <CardHeader>
          <CardTitle className="text-lg text-green-600">Revenue</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center py-2">
            <span>Total Revenue</span>
            <span className="font-semibold text-green-600">
              {formatCurrency(reportData?.incomeStatement.totalRevenue || 0)}
            </span>
          </div>
          <div className="border-t pt-2">
            <div className="flex justify-between items-center py-2 font-semibold">
              <span>Gross Profit</span>
              <span className="text-green-600">
                {formatCurrency(reportData?.incomeStatement.grossProfit || 0)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Expenses Section */}
      <Card className="glass">
        <CardHeader>
          <CardTitle className="text-lg text-red-600">Expenses</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {reportData?.incomeStatement.expensesByCategory.map((expense) => (
              <div key={expense.category} className="flex justify-between items-center py-2">
                <span>{expense.category}</span>
                <span className="font-semibold text-red-600">
                  {formatCurrency(expense.amount)}
                </span>
              </div>
            ))}
          </div>
          <div className="border-t pt-2 mt-4">
            <div className="flex justify-between items-center py-2 font-semibold">
              <span>Total Expenses</span>
              <span className="text-red-600">
                {formatCurrency(reportData?.incomeStatement.totalExpenses || 0)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Net Profit */}
      <Card className="glass">
        <CardHeader>
          <CardTitle className="text-lg">Net Profit</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center py-2">
            <span>Gross Profit</span>
            <span className="font-semibold">
              {formatCurrency(reportData?.incomeStatement.grossProfit || 0)}
            </span>
          </div>
          <div className="flex justify-between items-center py-2">
            <span>Less: Operating Expenses</span>
            <span className="font-semibold text-red-600">
              ({formatCurrency(reportData?.incomeStatement.totalExpenses || 0)})
            </span>
          </div>
          <div className="border-t pt-2">
            <div className="flex justify-between items-center py-2 font-bold text-lg">
              <span>Net Profit</span>
              <span className={`${(reportData?.incomeStatement.netProfit || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(reportData?.incomeStatement.netProfit || 0)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderCashFlowStatement = () => (
    <div className="space-y-6">
      <Card className="glass">
        <CardHeader>
          <CardTitle className="text-lg">Cash Flow Statement</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-blue-600 mb-2">Operating Activities</h4>
              <div className="flex justify-between items-center py-2">
                <span>Cash from Operations</span>
                <span className="font-semibold">
                  {formatCurrency(reportData?.cashFlow.operatingCashFlow || 0)}
                </span>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-purple-600 mb-2">Investing Activities</h4>
              <div className="flex justify-between items-center py-2">
                <span>Cash from Investments</span>
                <span className="font-semibold">
                  {formatCurrency(reportData?.cashFlow.investingCashFlow || 0)}
                </span>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-orange-600 mb-2">Financing Activities</h4>
              <div className="flex justify-between items-center py-2">
                <span>Cash from Financing</span>
                <span className="font-semibold">
                  {formatCurrency(reportData?.cashFlow.financingCashFlow || 0)}
                </span>
              </div>
            </div>

            <div className="border-t pt-2">
              <div className="flex justify-between items-center py-2 font-bold text-lg">
                <span>Net Cash Flow</span>
                <span className={`${(reportData?.cashFlow.netCashFlow || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(reportData?.cashFlow.netCashFlow || 0)}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderVatReport = () => (
    <div className="space-y-6">
      <Card className="glass">
        <CardHeader>
          <CardTitle className="text-lg">UAE VAT Report</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center py-2">
              <span>VAT Collected (Output Tax)</span>
              <span className="font-semibold text-green-600">
                {formatCurrency(reportData?.vatReport.vatCollected || 0)}
              </span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span>VAT Paid (Input Tax)</span>
              <span className="font-semibold text-red-600">
                {formatCurrency(reportData?.vatReport.vatPaid || 0)}
              </span>
            </div>
            <div className="border-t pt-2">
              <div className="flex justify-between items-center py-2 font-bold text-lg">
                <span>Net VAT Payable</span>
                <span className={`${(reportData?.vatReport.netVatPayable || 0) >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {formatCurrency(reportData?.vatReport.netVatPayable || 0)}
                </span>
              </div>
            </div>
            
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h4 className="font-semibold text-blue-800 mb-2">VAT Filing Information</h4>
              <div className="text-sm text-blue-700 space-y-1">
                <p>• UAE VAT Rate: 5%</p>
                <p>• Filing Frequency: Quarterly</p>
                <p>• Next Due Date: Calculate based on period end</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Financial Reports</h1>
          <p className="text-gray-600">Generate comprehensive financial statements and reports</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleExportReport} className="flex items-center gap-2">
            <DocumentArrowDownIcon className="h-4 w-4" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* Report Controls */}
      <Card className="glass">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Report Type
              </label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select report type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="income-statement">Income Statement</SelectItem>
                  <SelectItem value="cash-flow">Cash Flow Statement</SelectItem>
                  <SelectItem value="vat-report">VAT Report</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Report Period
              </label>
              <Select value={reportPeriod} onValueChange={setReportPeriod}>
                <SelectTrigger>
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="current-month">Current Month</SelectItem>
                  <SelectItem value="last-month">Last Month</SelectItem>
                  <SelectItem value="current-quarter">Current Quarter</SelectItem>
                  <SelectItem value="current-year">Current Year</SelectItem>
                  <SelectItem value="last-year">Last Year</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Report Content */}
      <div>
        {reportType === 'income-statement' && renderIncomeStatement()}
        {reportType === 'cash-flow' && renderCashFlowStatement()}
        {reportType === 'vat-report' && renderVatReport()}
      </div>

      {/* Report Summary */}
      <Card className="glass">
        <CardHeader>
          <CardTitle>Report Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <BanknotesIcon className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(reportData?.incomeStatement.totalRevenue || 0)}
              </div>
              <div className="text-sm text-green-700">Total Revenue</div>
            </div>

            <div className="text-center p-4 bg-red-50 rounded-lg">
              <ReceiptRefundIcon className="h-8 w-8 text-red-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-red-600">
                {formatCurrency(reportData?.incomeStatement.totalExpenses || 0)}
              </div>
              <div className="text-sm text-red-700">Total Expenses</div>
            </div>

            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <ChartBarIcon className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <div className={`text-2xl font-bold ${(reportData?.incomeStatement.netProfit || 0) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {formatCurrency(reportData?.incomeStatement.netProfit || 0)}
              </div>
              <div className="text-sm text-blue-700">Net Profit</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}